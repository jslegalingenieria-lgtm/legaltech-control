/**
 * JS LegalTech Control
 * Clientes sincronizados con Cloud Firestore.
 * Firestore es la fuente principal; LocalStorage funciona como caché
 * durante la migración de los demás módulos.
 */
(() => {
    "use strict";

    const COLECCION = "clientes";
    const CACHE = "js_legal_clientes";
    let clientesCache = [];
    let cancelarEscucha = null;

    function obtenerDB() {
        if (!window.db) {
            throw new Error("Firestore no está disponible. Revisa js/firebase.js.");
        }
        return window.db;
    }

    function obtenerSesion() {
        try {
            const raw = sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session");
            return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
    }

    function responsableParaSesion(sesion = obtenerSesion()) {
        if (!sesion) return "";
        if (sesion.rol === "Pasante") return sesion.abogadoSupervisorUsuario || "";
        if (sesion.rol === "Abogado") return sesion.usuario || "";
        return "";
    }

    function consultaClientesPorRol() {
        const sesion = obtenerSesion();
        const coleccion = obtenerDB().collection(COLECCION);
        const responsable = responsableParaSesion(sesion);
        if (sesion?.rol === "Abogado" || sesion?.rol === "Pasante") {
            // Si el pasante no tiene supervisor configurado, no debe ver
            // accidentalmente la cartera completa del despacho.
            return coleccion.where("abogadoAsignado", "==", responsable || "__SIN_RESPONSABLE__");
        }
        return coleccion.orderBy("nombre");
    }

    function normalizarCliente(id, datos = {}) {
        return {
            id: String(id),
            nombre: datos.nombre || "",
            curp: datos.curp || "",
            telefono: datos.telefono || "",
            correo: datos.correo || "",
            direccion: datos.direccion || "",
            clienteCodigo: datos.clienteCodigo || datos.codigo || "",
            estado: datos.estado || "Activo",
            activo: datos.activo !== false && (datos.estado || "Activo") !== "Baja",
            abogadoAsignado: datos.abogadoAsignado || "",
            fechaRegistro: datos.fechaRegistro || null,
            fechaActualizacion: datos.fechaActualizacion || null
        };
    }

    function guardarCache(clientes) {
        clientesCache = Array.isArray(clientes) ? clientes : [];
        localStorage.setItem(CACHE, JSON.stringify(clientesCache));
    }

    function obtenerClientes() {
        if (clientesCache.length) return [...clientesCache];
        try {
            return JSON.parse(localStorage.getItem(CACHE)) || [];
        } catch (error) {
            console.error("No se pudo leer la caché de clientes:", error);
            return [];
        }
    }

    function iniciarSincronizacionClientes() {
        if (cancelarEscucha) return;

        cancelarEscucha = consultaClientesPorRol()
            .onSnapshot(snapshot => {
                const clientes = snapshot.docs.map(doc =>
                    normalizarCliente(doc.id, doc.data())
                ).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));

                guardarCache(clientes);
                cargarClientesTabla();
                cargarAsuntosConsultaCiudadana();
                actualizarSelectAbogadosAsignados();

                if (typeof window.actualizarContadoresDashboard === "function") {
                    window.actualizarContadoresDashboard();
                }
            }, error => {
                console.error("Error sincronizando clientes:", error);
                alert("No fue posible sincronizar los clientes con Firebase.");
            });
    }

    async function guardarCliente(event) {
        event.preventDefault();

        try {
            const id = document.getElementById("cliente-id")?.value.trim() || "";
            const nombre = document.getElementById("cli-nombre")?.value.trim() || "";
            const curp = document.getElementById("cli-curp")?.value.trim() || "";
            const telefono = document.getElementById("cli-telefono")?.value.trim() || "";
            const correo = document.getElementById("cli-correo")?.value.trim() || "";
            const direccion = document.getElementById("cli-direccion")?.value.trim() || "";
            let abogadoAsignado = document.getElementById("cliente-abogado")?.value || "";
            const sesion = obtenerSesion();
            const responsableSesion = responsableParaSesion(sesion);
            if (responsableSesion) abogadoAsignado = responsableSesion;
            const estado = document.getElementById("cliente-estado")?.value || "Activo";

            if (!nombre || !telefono || !correo) {
                alert("Completa nombre, teléfono y correo.");
                return;
            }

            const datos = {
                nombre,
                curp,
                telefono,
                correo,
                direccion,
                abogadoAsignado,
                estado,
                activo: estado === "Activo",
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) {
                await obtenerDB().collection(COLECCION).doc(String(id)).set(datos, { merge: true });
                alert("Cliente actualizado con éxito.");
            } else {
                datos.fechaRegistro = firebase.firestore.FieldValue.serverTimestamp();
                datos.clienteCodigo = await window.siguienteConsecutivo("clientes", "CLI");

                await obtenerDB().collection(COLECCION).add(datos);
                alert("Cliente registrado con éxito.");
            }

            cerrarModalCliente();
        } catch (error) {
            console.error("Error guardando cliente:", error);
            alert("No fue posible guardar el cliente en Firebase.");
        }
    }

    async function eliminarCliente(id) {
        if (!window.JSLegalRoles?.tienePermiso("baja_clientes")) {
            alert("Tu rol no permite dar de baja o reactivar clientes.");
            return;
        }
        const cliente = obtenerClientes().find(c => String(c.id) === String(id));
        if (!cliente) return;
        const nuevoEstado = cliente.estado === "Baja" ? "Activo" : "Baja";
        const accion = nuevoEstado === "Baja" ? "dar de baja" : "reactivar";
        if (!confirm(`¿Deseas ${accion} a ${cliente.nombre}? El registro no se eliminará.`)) return;
        try {
            await obtenerDB().collection(COLECCION).doc(String(id)).set({
                estado: nuevoEstado,
                activo: nuevoEstado === "Activo",
                fechaBaja: nuevoEstado === "Baja" ? firebase.firestore.FieldValue.serverTimestamp() : null,
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            alert(nuevoEstado === "Baja" ? "Cliente dado de baja." : "Cliente reactivado.");
        } catch (error) {
            console.error("Error cambiando estado del cliente:", error);
            alert("No fue posible cambiar el estado del cliente.");
        }
    }

    function abrirModalCliente() {
        const modal = document.getElementById("modal-cliente");
        const formulario = document.getElementById("form-cliente");
        if (!modal || !formulario) return;

        modal.style.display = "block";
        document.getElementById("modal-titulo").innerText = "Registrar Nuevo Cliente";
        formulario.reset();
        document.getElementById("cliente-id").value = "";
        if (document.getElementById("cliente-estado")) document.getElementById("cliente-estado").value = "Activo";
        actualizarSelectAbogadosAsignados();
    }

    function cerrarModalCliente() {
        const modal = document.getElementById("modal-cliente");
        if (modal) modal.style.display = "none";
    }

    function editarCliente(id) {
        const cliente = obtenerClientes().find(c => String(c.id) === String(id));
        if (!cliente) {
            alert("No se encontró el cliente.");
            return;
        }

        abrirModalCliente();
        document.getElementById("modal-titulo").innerText = "Editar Cliente";
        document.getElementById("cliente-id").value = cliente.id;
        document.getElementById("cli-nombre").value = cliente.nombre || "";
        document.getElementById("cli-curp").value = cliente.curp || "";
        document.getElementById("cli-telefono").value = cliente.telefono || "";
        document.getElementById("cli-correo").value = cliente.correo || "";
        document.getElementById("cli-direccion").value = cliente.direccion || "";
        if (document.getElementById("cliente-estado")) document.getElementById("cliente-estado").value = cliente.estado || "Activo";

        const select = document.getElementById("cliente-abogado");
        if (select) select.value = cliente.abogadoAsignado || "";
    }

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function cargarClientesTabla() {
        const cuerpo = document.getElementById("tabla-clientes-cuerpo");
        if (!cuerpo) return;

        const clientes = obtenerClientes();
        cuerpo.innerHTML = "";

        if (!clientes.length) {
            cuerpo.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#64748b;">No hay clientes registrados.</td></tr>';
            return;
        }

        clientes.forEach(cliente => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td style="padding:1rem;font-weight:700;">${escaparHTML(cliente.clienteCodigo || "CLI-PENDIENTE")}</td>
                <td style="padding:1rem;">${escaparHTML(cliente.nombre)}</td>
                <td style="padding:1rem;">${escaparHTML(cliente.curp || "No provista")}</td>
                <td style="padding:1rem;">${escaparHTML(cliente.telefono || "S/N")}</td>
                <td style="padding:1rem;">${escaparHTML(cliente.correo || "S/N")}</td>
                <td style="padding:1rem;"><span style="font-weight:700;color:${cliente.estado === "Baja" ? "#991b1b" : "#166534"};">${escaparHTML(cliente.estado || "Activo")}</span></td>
                <td style="padding:1rem;text-align:center;">
                    <button type="button" onclick="editarCliente('${cliente.id}')" style="background:#3b82f6;color:white;border:none;padding:.4rem .8rem;border-radius:4px;cursor:pointer;margin-right:.4rem;">✏️ Editar</button>
                    ${window.JSLegalRoles?.tienePermiso("baja_clientes") ? `<button type="button" onclick="eliminarCliente('${cliente.id}')" style="background:${cliente.estado === "Baja" ? "#16a34a" : "#ef4444"};color:white;border:none;padding:.4rem .8rem;border-radius:4px;cursor:pointer;">${cliente.estado === "Baja" ? "♻️ Reactivar" : "🚫 Baja"}</button>` : ""}
                </td>`;
            cuerpo.appendChild(fila);
        });
    }

    function cargarAsuntosConsultaCiudadana() {
        const cuerpo = document.getElementById("tabla-portal-cuerpo");
        if (!cuerpo) return;

        const sesionData = localStorage.getItem("js_legal_session") || sessionStorage.getItem("js_legal_usuario");
        const usuarioActivo = sesionData ? JSON.parse(sesionData) : null;
        const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];
        cuerpo.innerHTML = "";
        if (!usuarioActivo) return;

        const idUsuario = String(usuarioActivo.id || usuarioActivo.usuario || "").toLowerCase().trim();
        const idLimpio = idUsuario.replace("cli-", "");
        const nombreActivo = String(usuarioActivo.nombre || "").toLowerCase().trim();

        const filtrados = asuntos.filter(asunto => {
            const idCliente = String(asunto.clienteId || "").toLowerCase().trim();
            const idClienteLimpio = idCliente.replace("cli-", "");
            const nombreCliente = String(asunto.cliente || "").toLowerCase().trim();

            return idCliente === idUsuario ||
                idClienteLimpio === idLimpio ||
                nombreCliente.includes(idLimpio) ||
                (nombreActivo && nombreCliente.includes(nombreActivo));
        });

        if (!filtrados.length) {
            cuerpo.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#64748b;">No se encontraron asuntos vigentes registrados a su nombre.</td></tr>';
            return;
        }

        filtrados.forEach(asunto => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td style="padding:12px;font-weight:600;">${escaparHTML(asunto.expediente || "S/N")}</td>
                <td style="padding:12px;">${escaparHTML(asunto.materia || asunto.juicio || "General")}</td>
                <td style="padding:12px;">${escaparHTML(asunto.juzgado || asunto.organo || "No especificado")}</td>
                <td style="padding:12px;">${escaparHTML(asunto.estado || "En trámite")}</td>
                <td style="padding:12px;">${escaparHTML(asunto.resumen || "Sin actualizaciones")}</td>
                <td style="padding:12px;text-align:center;">
                    <button type="button" onclick="abrirBitacoraCliente('${asunto.id}')" style="background:#8b5cf6;color:white;border:none;padding:7px 12px;border-radius:5px;cursor:pointer;">📜 Línea de tiempo</button>
                </td>`;
            cuerpo.appendChild(fila);
        });
    }

    function abrirBitacoraCliente(asuntoId) {
        const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];
        const asunto = asuntos.find(a => String(a.id) === String(asuntoId));

        if (!asunto) {
            alert("No se encontró el expediente.");
            return;
        }

        const modal = document.getElementById("modal-bitacora");
        const titulo = document.getElementById("bitacora-expediente-titulo");
        const formulario = document.getElementById("form-actuacion");
        if (!modal) return;

        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        if (titulo) titulo.innerText = asunto.expediente || "Sin número";
        if (formulario) formulario.style.display = "none";

        renderizarActuacionesCliente(asunto.actuaciones || []);
        modal.style.display = "block";
    }

    function renderizarActuacionesCliente(actuaciones) {
        const lista = document.getElementById("bitacora-lista-historico");
        if (!lista) return;

        lista.innerHTML = "";
        if (!actuaciones.length) {
            lista.innerHTML = "<p>No hay actuaciones registradas.</p>";
            return;
        }

        actuaciones.slice().reverse().forEach(actuacion => {
            const elemento = document.createElement("div");
            elemento.style.padding = ".8rem";
            elemento.style.borderBottom = "1px solid #eee";
            elemento.innerHTML = `<strong>${escaparHTML(actuacion.fecha)}</strong><br>${escaparHTML(actuacion.descripcion)}`;
            lista.appendChild(elemento);
        });
    }

    function actualizarSelectAbogadosAsignados() {
        const select = document.getElementById("cliente-abogado");
        if (!select) return;

        let personal = [];
        try {
            personal = JSON.parse(localStorage.getItem("js_legal_personal")) || [];
        } catch (error) {
            console.error("No se pudo leer el personal:", error);
        }

        const base = typeof window.USUARIOS_MOCK !== "undefined" ? window.USUARIOS_MOCK : [];
        const lista = typeof window.obtenerListaCompletaPersonal === "function"
            ? window.obtenerListaCompletaPersonal()
            : [...base, ...personal];

        // En clientes pueden fungir como responsables el superadministrador,
        // el administrador y el abogado. Se eliminan duplicados usando el
        // identificador que realmente se guarda en cliente.abogadoAsignado.
        const responsablesPorId = new Map();
        lista
            .filter(emp =>
                ["Superadministrador", "Administrador", "Abogado"].includes(emp.rol) &&
                String(emp.estado || "Activo").toLowerCase() === "activo"
            )
            .forEach(emp => {
                const id = String(emp.usuario || emp.uid || emp.id || emp.correo || "").trim();
                if (id && !responsablesPorId.has(id)) responsablesPorId.set(id, emp);
            });

        const responsables = [...responsablesPorId.values()].sort((a, b) =>
            String(a.nombre || a.usuario || "").localeCompare(
                String(b.nombre || b.usuario || ""),
                "es"
            )
        );

        select.innerHTML = '<option value="">-- Sin abogado asignado --</option>';
        responsables.forEach(responsableItem => {
            const opcion = document.createElement("option");
            opcion.value = responsableItem.usuario || responsableItem.uid || responsableItem.id;
            opcion.textContent = responsableItem.nombre || responsableItem.usuario || responsableItem.correo;
            select.appendChild(opcion);
        });
        const responsable = responsableParaSesion();
        if (responsable) {
            if (![...select.options].some(o => o.value === responsable)) {
                const opcion = document.createElement("option");
                opcion.value = responsable;
                opcion.textContent = obtenerSesion()?.rol === "Pasante" ? "Abogado responsable" : (obtenerSesion()?.nombre || responsable);
                select.appendChild(opcion);
            }
            select.value = responsable;
            select.disabled = true;
        } else {
            select.disabled = false;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("form-cliente")?.addEventListener("submit", guardarCliente);

        let sesion = null;
        try {
            sesion = JSON.parse(
                sessionStorage.getItem("js_legal_usuario") ||
                localStorage.getItem("js_legal_session") ||
                "null"
            );
        } catch (_) {}

        if (sesion?.rol === "Cliente") {
            console.info("Sincronización general de clientes omitida para el cliente.");
            return;
        }

        iniciarSincronizacionClientes();
        cargarClientesTabla();
    });

    window.obtenerClientes = obtenerClientes;
    window.guardarCliente = guardarCliente;
    window.cargarClientesTabla = cargarClientesTabla;
    window.abrirModalCliente = abrirModalCliente;
    window.cerrarModalCliente = cerrarModalCliente;
    window.editarCliente = editarCliente;
    window.eliminarCliente = eliminarCliente;
    window.abrirBitacoraCliente = abrirBitacoraCliente;
    window.renderizarActuacionesCliente = renderizarActuacionesCliente;
    window.actualizarSelectAbogadosAsignados = actualizarSelectAbogadosAsignados;
})();
