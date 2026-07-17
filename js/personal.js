/**
 * Gestión de Personal con Firebase Authentication + Firestore.
 * La contraseña nunca se guarda en Firestore.
 */
(() => {
    "use strict";

    let personalCache = [];
    const normalizar = valor => String(valor || "").trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const escaparHTML = valor => String(valor ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    function servicios() {
        if (!window.db || !window.firebaseAuth || !window.FIREBASE_CONFIG) {
            throw new Error("Firebase no está disponible.");
        }
        return { db: window.db, auth: window.firebaseAuth };
    }

    async function cargarPersonal() {
        const { db } = servicios();
        const snapshot = await db.collection("personal").orderBy("nombre").get();
        personalCache = snapshot.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() }));
        window.USUARIOS_MOCK = personalCache;
        renderizarTablaPersonal();
        return personalCache;
    }

    function obtenerPersonal() { return [...personalCache]; }

    function renderizarTablaPersonal() {
        const tbody = document.getElementById("tabla-personal-cuerpo");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!personalCache.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:24px;text-align:center;color:#64748b;">No hay personal registrado.</td></tr>';
            return;
        }

        personalCache.forEach(empleado => {
            const estado = empleado.estado || "Activo";
            const fila = document.createElement("tr");
            fila.style.borderBottom = "1px solid #e2e8f0";
            fila.innerHTML = `
                <td style="padding:12px 24px;color:#1e293b;">${escaparHTML(empleado.nombre)}</td>
                <td style="padding:12px 24px;color:#475569;">${escaparHTML(empleado.correo)}</td>
                <td style="padding:12px 24px;color:#475569;">${escaparHTML(empleado.usuario)}</td>
                <td style="padding:12px 24px;"><span style="padding:4px 8px;border-radius:4px;font-size:.85rem;font-weight:600;background:${empleado.rol === "Administrador" ? "#fee2e2" : "#dbeafe"};color:${empleado.rol === "Administrador" ? "#991b1b" : "#1e40af"};">${escaparHTML(empleado.rol)}</span></td>
                <td style="padding:12px 24px;"><span style="padding:4px 8px;border-radius:999px;font-size:.82rem;font-weight:600;background:${estado === "Activo" ? "#dcfce7" : "#f1f5f9"};color:${estado === "Activo" ? "#166534" : "#64748b"};">${escaparHTML(estado)}</span></td>
                <td style="padding:12px 24px;text-align:center;">
                    <button onclick="editarPersonal('${empleado.id}')" style="background:#e2e8f0;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;color:#475569;margin-right:5px;">✏️ Editar</button>
                    <button onclick="eliminarPersonal('${empleado.id}')" style="background:#fee2e2;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600;color:#991b1b;">🚫 Dar de baja</button>
                </td>`;
            tbody.appendChild(fila);
        });

        window.actualizarSelectAbogadosAsignados?.();
    }

    function abrirModalPersonal() {
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
        modal.style.display = "flex";
    }

    function cerrarModalPersonal() {
        document.getElementById("modal-personal")?.style && (document.getElementById("modal-personal").style.display = "none");
        document.getElementById("form-alta-personal")?.reset();
    }

    async function crearCuentaAuth(correo, password) {
        const nombreApp = `PersonalAdmin-${Date.now()}`;
        const appSecundaria = firebase.initializeApp(window.FIREBASE_CONFIG, nombreApp);
        try {
            const credencial = await appSecundaria.auth().createUserWithEmailAndPassword(correo, password);
            await appSecundaria.auth().signOut();
            return credencial.user.uid;
        } finally {
            await appSecundaria.delete();
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

        try {
            if (!nombre || !correo || !usuario || !rol || !estado || (!id && !password)) {
                throw new Error("Completa todos los campos obligatorios.");
            }
            if (!id && password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");

            const duplicado = personalCache.some(emp => emp.id !== id && (
                normalizar(emp.usuario) === normalizar(usuario) || normalizar(emp.correo) === normalizar(correo)
            ));
            if (duplicado) throw new Error("El usuario o correo ya está registrado.");

            const { db } = servicios();
            const datos = {
                nombre, correo, usuario,
                usuarioNormalizado: normalizar(usuario),
                rol, estado,
                fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) {
                // Correo y usuario quedan bloqueados en edición para conservar la relación con Authentication.
                await db.collection("personal").doc(id).update(datos);
                alert("Datos del personal actualizados correctamente. La contraseña no se modificó.");
            } else {
                const uid = await crearCuentaAuth(correo, password);
                await db.collection("personal").doc(uid).set({
                    uid, ...datos,
                    fechaAlta: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert("Personal dado de alta en Authentication y Firestore.");
            }

            cerrarModalPersonal();
            await cargarPersonal();
        } catch (error) {
            console.error(error);
            const mensajes = {
                "auth/email-already-in-use": "Ese correo ya existe en Firebase Authentication.",
                "auth/invalid-email": "El correo electrónico no es válido.",
                "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
                "auth/operation-not-allowed": "Activa Email/Password en Firebase Authentication."
            };
            alert(mensajes[error.code] || error.message || "No fue posible guardar el personal.");
        } finally {
            if (boton) { boton.disabled = false; boton.textContent = "Guardar Personal"; }
        }
    }

    function editarPersonal(id) {
        const emp = personalCache.find(item => item.id === id);
        if (!emp) return;
        document.getElementById("personal-id").value = emp.id;
        document.getElementById("personal-nombre").value = emp.nombre || "";
        document.getElementById("personal-correo").value = emp.correo || "";
        document.getElementById("personal-usuario").value = emp.usuario || "";
        document.getElementById("personal-pass").value = "";
        document.getElementById("personal-pass").required = false;
        document.getElementById("personal-rol").value = emp.rol || "Abogado";
        document.getElementById("personal-estado").value = emp.estado || "Activo";
        document.getElementById("personal-correo").disabled = true;
        document.getElementById("personal-usuario").disabled = true;
        document.getElementById("modal-personal-titulo").textContent = "Modificar Personal";
        document.getElementById("modal-personal").style.display = "flex";
    }

    async function eliminarPersonal(id) {
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
                estado: "Inactivo",
                fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            });
            await cargarPersonal();
        } catch (error) {
            console.error(error);
            alert("No fue posible dar de baja al usuario.");
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        cargarPersonal().catch(error => {
            console.error("Error cargando personal:", error);
            const tbody = document.getElementById("tabla-personal-cuerpo");
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding:24px;text-align:center;color:#991b1b;">No fue posible cargar el personal desde Firebase.</td></tr>';
        });
    });

    Object.assign(window, {
        cargarPersonal, obtenerPersonal, renderizarTablaPersonal,
        abrirModalPersonal, cerrarModalPersonal, guardarPersonal,
        editarPersonal, eliminarPersonal
    });
})();
