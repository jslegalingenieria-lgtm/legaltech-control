/**
 * Gestión de Personal con Firebase Authentication + Firestore.
 * La contraseña nunca se guarda en Firestore.
 */
(() => {
    "use strict";

    let personalCache = [];
    const normalizar = valor => String(valor || "").trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const roles = () => window.JSLegalRoles;
    const puede = permiso => roles()?.tienePermiso(permiso) === true;

    const escaparHTML = valor => String(valor ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    function servicios() {

    if (!window.db) {
        throw new Error("Firestore no está disponible.");
    }

    return {
        db: window.db,
        auth: window.firebaseAuth || firebase.auth()
    };
}

    async function cargarPersonal() {
        const { db } = servicios();
        const snapshot = await db.collection("personal").orderBy("nombre").get();
        personalCache = snapshot.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() }));
        window.USUARIOS_MOCK = personalCache;
        localStorage.setItem("js_legal_personal", JSON.stringify(personalCache));
        renderizarTablaPersonal();

        // Notifica a los módulos que dependen del catálogo de personal.
        window.dispatchEvent(new CustomEvent("personalActualizado", {
            detail: [...personalCache]
        }));
        window.cargarAbogadosEnAsuntos?.();
        window.actualizarColaboradoresEnAsuntos?.();

        return personalCache;
    }

    function obtenerPersonal() { return [...personalCache]; }
    function obtenerListaCompletaPersonal() { return [...personalCache]; }

    function renderizarTablaPersonal() {
        const tbody = document.getElementById("tabla-personal-cuerpo");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!personalCache.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding:24px;text-align:center;color:#64748b;">No hay personal registrado.</td></tr>';
            return;
        }

        personalCache.forEach(empleado => {
            const estado = empleado.estado || "Activo";
            const fila = document.createElement("tr");
            fila.style.borderBottom = "1px solid #e2e8f0";
            fila.innerHTML = `
                <td style="padding:12px 24px;font-weight:700;color:#1e293b;">${escaparHTML(empleado.abogadoCodigo || "ABG-PENDIENTE")}</td>
                <td style="padding:12px 24px;color:#1e293b;">${escaparHTML(empleado.nombre)}</td>
                <td style="padding:12px 24px;color:#475569;">${escaparHTML(empleado.correo)}</td>
                <td style="padding:12px 24px;color:#475569;">${escaparHTML(empleado.usuario)}</td>
                <td style="padding:12px 24px;"><span style="padding:4px 8px;border-radius:4px;font-size:.85rem;font-weight:600;background:${empleado.rol === "Administrador" ? "#fee2e2" : "#dbeafe"};color:${empleado.rol === "Administrador" ? "#991b1b" : "#1e40af"};">${escaparHTML(empleado.rol)}</span></td>
                <td style="padding:12px 24px;"><span style="padding:4px 8px;border-radius:999px;font-size:.82rem;font-weight:600;background:${estado === "Activo" ? "#dcfce7" : "#f1f5f9"};color:${estado === "Activo" ? "#166534" : "#64748b"};">${escaparHTML(estado)}</span></td>
                <td style="padding:12px 24px;text-align:center;">
                    ${puede("gestionar_personal") ? `<button onclick="editarPersonal('${empleado.id}')" style="background:#e2e8f0;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;color:#475569;margin-right:5px;">✏️ Editar</button><button onclick="restablecerPasswordTemporal('${empleado.id}')" style="background:#fef3c7;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;color:#92400e;margin-right:5px;">🔑 Contraseña temporal</button>` : ""}
                    ${puede("baja_personal") ? `<button onclick="eliminarPersonal('${empleado.id}')" style="background:${estado === "Baja" ? "#dcfce7" : "#fee2e2"};border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;color:${estado === "Baja" ? "#166534" : "#991b1b"};">${estado === "Baja" ? "♻️ Reactivar" : "🚫 Dar de baja"}</button>` : ""}
                </td>`;
            tbody.appendChild(fila);
        });

        window.actualizarSelectAbogadosAsignados?.();
    }

    function actualizarAbogadosSupervisores(seleccionado = "") {
        const select = document.getElementById("personal-abogado-supervisor");
        if (!select) return;
        const rolesResponsables = ["Abogado", "Administrador", "Superadministrador"];
        const responsables = personalCache.filter(p =>
            rolesResponsables.includes(p.rol) && (p.estado || "Activo") === "Activo"
        );
        select.innerHTML = '<option value="">Seleccione un responsable</option>' + responsables.map(persona =>
            `<option value="${escaparHTML(persona.uid || persona.id)}">${escaparHTML(persona.nombre)} — ${escaparHTML(persona.rol)}</option>`
        ).join("");
        select.value = seleccionado || "";
    }

    function alternarSupervisorPasante() {
        const rol = document.getElementById("personal-rol")?.value;
        const grupo = document.getElementById("grupo-abogado-supervisor");
        const select = document.getElementById("personal-abogado-supervisor");
        if (!grupo || !select) return;
        const visible = rol === "Pasante";
        grupo.style.display = visible ? "block" : "none";
        select.required = visible;
        if (!visible) select.value = "";
    }

    function configurarOpcionesRolPersonal() {
        const select = document.getElementById("personal-rol");
        if (!select) return;
        const sesion = roles()?.sesionActual();
        const permitidos = sesion?.rol === "Superadministrador"
            ? ["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado", "Pasante"]
            : sesion?.rol === "Administrador"
                ? ["Administrador", "Auxiliar Jurídico", "Abogado", "Pasante"]
                : ["Auxiliar Jurídico", "Abogado", "Pasante"];
        [...select.options].forEach(op => { op.hidden = !permitidos.includes(op.value); op.disabled = !permitidos.includes(op.value); });
        if (!permitidos.includes(select.value)) select.value = permitidos[0];
    }

    function abrirModalPersonal() {
        if (!puede("alta_personal")) return alert("Tu rol no permite dar de alta personal.");
        const modal = document.getElementById("modal-personal");
        const form = document.getElementById("form-alta-personal");
        if (!modal || !form) return;
        form.reset();
        document.getElementById("personal-id").value = "";
        document.getElementById("personal-usuario").disabled = false;
        document.getElementById("personal-correo").disabled = false;
        document.getElementById("personal-pass").required = true;
        document.getElementById("personal-estado").value = "Activo";
        document.getElementById("modal-personal-titulo").textContent = "Alta de Personal";
        configurarOpcionesRolPersonal();
        actualizarAbogadosSupervisores();
        alternarSupervisorPasante();
        modal.style.display = "flex";
    }

    function cerrarModalPersonal() {
        document.getElementById("modal-personal")?.style && (document.getElementById("modal-personal").style.display = "none");
        document.getElementById("form-alta-personal")?.reset();
    }

    async function crearCuentaSegura(datosUsuario) {
        if (!window.firebaseFunctions) {
            throw new Error("Cloud Functions no está disponible. Despliega la carpeta functions y vuelve a cargar la página.");
        }
        const crearUsuario = window.firebaseFunctions.httpsCallable("crearUsuarioDelSistema");
        const resultado = await crearUsuario(datosUsuario);
        if (!resultado?.data?.uid) throw new Error("El servidor no devolvió el UID del usuario creado.");
        return resultado.data.uid;
    }

    async function restablecerPasswordTemporal(id) {
        if (!puede("gestionar_personal")) return alert("Tu rol no permite restablecer contraseñas.");
        const emp = personalCache.find(item => item.id === id);
        if (!emp) return;
        const temporal = prompt(`Escribe una nueva contraseña temporal para ${emp.nombre}.

Debe contener al menos 8 caracteres:`);
        if (!temporal) return;
        if (temporal.length < 8) return alert("La contraseña temporal debe tener al menos 8 caracteres.");
        if (!confirm("El usuario deberá cambiar esta contraseña en su siguiente inicio de sesión. ¿Continuar?")) return;
        try {
            if (!window.firebaseFunctions) throw new Error("Cloud Functions no está disponible.");
            const funcion = window.firebaseFunctions.httpsCallable("restablecerPasswordTemporal");
            await funcion({ uid: id, passwordTemporal: temporal });
            alert("Contraseña temporal actualizada. El usuario deberá cambiarla al iniciar sesión.");
            await cargarPersonal();
        } catch (error) {
            console.error(error);
            alert(error?.message || "No fue posible restablecer la contraseña.");
        }
    }

    async function guardarPersonal(event) {
        event.preventDefault();
        const boton = event.submitter || document.querySelector('#form-alta-personal button[type="submit"]');
        if (boton) { boton.disabled = true; boton.textContent = "Guardando..."; }

        const id = document.getElementById("personal-id").value;
        const nombre = document.getElementById("personal-nombre").value.trim();
        const correo = document.getElementById("personal-correo").value.trim().toLowerCase();
        const usuario = document.getElementById("personal-usuario").value.trim();
        const password = document.getElementById("personal-pass").value;
        const rol = document.getElementById("personal-rol").value;
        const estado = document.getElementById("personal-estado").value;
        const abogadoSupervisorUid = document.getElementById("personal-abogado-supervisor")?.value || "";
        const supervisor = personalCache.find(p => String(p.uid || p.id) === String(abogadoSupervisorUid));
        const abogadoSupervisorUsuario = supervisor?.usuario || "";

        try {
            if (!puede(id ? "gestionar_personal" : "alta_personal")) throw new Error("Tu rol no permite esta operación.");
            if (!nombre || !correo || !usuario || !rol || !estado || (!id && !password)) {
                throw new Error("Completa todos los campos obligatorios.");
            }
            if (!id && password.length < 8) throw new Error("La contraseña temporal debe tener al menos 8 caracteres.");
            if (rol === "Pasante" && !abogadoSupervisorUid) throw new Error("Asigna el pasante a un responsable activo.");
            const rolSesion = roles()?.sesionActual()?.rol;
            if (rolSesion === "Auxiliar Jurídico" && !["Auxiliar Jurídico", "Abogado", "Pasante"].includes(rol)) throw new Error("El auxiliar no puede crear administradores ni superadministradores.");
            if (rolSesion === "Administrador" && rol === "Superadministrador") throw new Error("Solo el superadministrador puede crear otro superadministrador.");

            const duplicado = personalCache.some(emp => emp.id !== id && (
                normalizar(emp.usuario) === normalizar(usuario) || normalizar(emp.correo) === normalizar(correo)
            ));
            if (duplicado) throw new Error("El usuario o correo ya está registrado.");

            const { db } = servicios();
            const datos = {
                nombre, correo, usuario,
                usuarioNormalizado: normalizar(usuario),
                rol, estado, activo: estado === "Activo",
                abogadoSupervisorUid: rol === "Pasante" ? abogadoSupervisorUid : "",
                abogadoSupervisorUsuario: rol === "Pasante" ? abogadoSupervisorUsuario : "",
                fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) {
                // Correo y usuario quedan bloqueados en edición para conservar la relación con Authentication.
                await db.collection("personal").doc(id).update(datos);
                alert("Datos del personal actualizados correctamente. La contraseña no se modificó.");
            } else {
                const abogadoCodigo = await window.siguienteConsecutivo("abogados", "ABG");
                const uid = await crearCuentaSegura({
                    nombre, correo, usuario, passwordTemporal: password,
                    rol, estado, abogadoCodigo,
                    abogadoSupervisorUid: rol === "Pasante" ? abogadoSupervisorUid : "",
                    abogadoSupervisorUsuario: rol === "Pasante" ? abogadoSupervisorUsuario : ""
                });
                alert("Personal dado de alta de forma segura. Deberá cambiar su contraseña temporal al iniciar sesión.");
            }

            cerrarModalPersonal();
            await cargarPersonal();
        } catch (error) {
            console.error(error);
            const mensajes = {
                "auth/email-already-in-use": "Ese correo ya existe en Firebase Authentication.",
                "auth/invalid-email": "El correo electrónico no es válido.",
                "auth/weak-password": "La contraseña temporal debe tener al menos 8 caracteres.",
                "auth/operation-not-allowed": "Activa Email/Password en Firebase Authentication."
            };
            alert(mensajes[error.code] || error.message || "No fue posible guardar el personal.");
        } finally {
            if (boton) { boton.disabled = false; boton.textContent = "Guardar Personal"; }
        }
    }

    function editarPersonal(id) {
        if (!puede("gestionar_personal")) return alert("Tu rol no permite modificar personal.");
        const emp = personalCache.find(item => item.id === id);
        if (!emp) return;
        document.getElementById("personal-id").value = emp.id;
        document.getElementById("personal-nombre").value = emp.nombre || "";
        document.getElementById("personal-correo").value = emp.correo || "";
        document.getElementById("personal-usuario").value = emp.usuario || "";
        document.getElementById("personal-pass").value = "";
        document.getElementById("personal-pass").required = false;
        configurarOpcionesRolPersonal();
        document.getElementById("personal-rol").value = emp.rol || "Abogado";
        document.getElementById("personal-estado").value = emp.estado || "Activo";
        document.getElementById("personal-correo").disabled = true;
        document.getElementById("personal-usuario").disabled = true;
        document.getElementById("modal-personal-titulo").textContent = "Modificar Personal";
        actualizarAbogadosSupervisores(emp.abogadoSupervisorUid || "");
        alternarSupervisorPasante();
        document.getElementById("modal-personal").style.display = "flex";
    }

    async function eliminarPersonal(id) {
        if (!puede("baja_personal")) return alert("Tu rol no permite dar de baja o reactivar personal.");
        const emp = personalCache.find(item => item.id === id);
        if (!emp) return;
        if (emp.rol === "Administrador" && emp.estado === "Activo") {
            const activos = personalCache.filter(item => item.rol === "Administrador" && item.estado === "Activo");
            if (activos.length <= 1) {
                alert("No se puede dar de baja al único administrador activo.");
                return;
            }
        }
        if (!confirm(`¿Deseas dar de baja a ${emp.nombre}?`)) return;
        try {
            await window.db.collection("personal").doc(id).update({
                estado: emp.estado === "Baja" ? "Activo" : "Baja",
                activo: emp.estado === "Baja",
                fechaBaja: emp.estado === "Baja" ? null : firebase.firestore.FieldValue.serverTimestamp(),
                fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            });
            await cargarPersonal();
        } catch (error) {
            console.error(error);
            alert("No fue posible dar de baja al usuario.");
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("personal-rol")?.addEventListener("change", alternarSupervisorPasante);
        let sesion = null;
        try {
            sesion = JSON.parse(
                sessionStorage.getItem("js_legal_usuario") ||
                localStorage.getItem("js_legal_session") ||
                "null"
            );
        } catch (_) {}

        if (!sesion || !["Superadministrador", "Administrador", "Auxiliar Jurídico"].includes(sesion.rol)) {
            console.info("Sincronización de personal omitida para el cliente.");
            return;
        }

        cargarPersonal().catch(error => {
            console.error("Error cargando personal:", error);
            const tbody = document.getElementById("tabla-personal-cuerpo");
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="padding:24px;text-align:center;color:#991b1b;">No fue posible cargar el personal desde Firebase.</td></tr>';
        });
    });

    Object.assign(window, {
        cargarPersonal, obtenerPersonal, obtenerListaCompletaPersonal, renderizarTablaPersonal,
        abrirModalPersonal, cerrarModalPersonal, guardarPersonal,
        editarPersonal, eliminarPersonal, restablecerPasswordTemporal
    });
})();
