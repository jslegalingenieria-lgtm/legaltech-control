/**
 * JS LegalTech Control
 * Módulo de Asuntos y Bitácora sincronizado con Cloud Firestore.
 *
 * Firestore es la fuente principal.
 * LocalStorage se conserva como caché temporal para mantener
 * compatibilidad con los módulos todavía no migrados.
 */

(() => {
    "use strict";

    const COLECCION_ASUNTOS = "asuntos";
    const CACHE_ASUNTOS = "js_legal_asuntos";

    let asuntosCache = [];
    let asuntoHistorialIdSeleccionado = null;
    let detenerEscuchaAsuntos = null;

    function obtenerDB() {
        if (!window.db) {
            throw new Error(
                "Firestore no está disponible. Revisa js/firebase.js."
            );
        }

        return window.db;
    }

    function normalizarAsunto(id, datos = {}) {
        return {
            id: String(id),
            clienteId: datos.clienteId || "",
            cliente: datos.cliente || "",
            materia: datos.materia || "",
            expediente: datos.expediente || "",
            juzgado: datos.juzgado || "",
            accion: datos.accion || "",
            folioInterno: datos.folioInterno || datos.codigo || "",
            estado: datos.estado || "En proceso",
            activo: !["Concluido", "Cancelado"].includes(datos.estado || "En proceso"),
            resumen: datos.resumen || "",
            abogadoAsignado: datos.abogadoAsignado || "",
            colaboradores: Array.isArray(datos.colaboradores) ? datos.colaboradores : [],
            colaboradorIds: Array.isArray(datos.colaboradorIds) ? datos.colaboradorIds : [],
            fechaRegistro: datos.fechaRegistro || null,
            fechaActualizacion: datos.fechaActualizacion || null,
            actuaciones: Array.isArray(datos.actuaciones)
                ? datos.actuaciones
                : [],
            correos: Array.isArray(datos.correos)
                ? datos.correos
                : []
        };
    }

    function convertirFechaFirestore(valor) {
        if (!valor) return "";

        if (typeof valor.toDate === "function") {
            return valor.toDate().toLocaleDateString("es-MX");
        }

        return String(valor);
    }

    function guardarCacheLocal(lista) {
        asuntosCache = Array.isArray(lista) ? lista : [];

        localStorage.setItem(
            CACHE_ASUNTOS,
            JSON.stringify(asuntosCache)
        );
    }

    function obtenerAsuntos() {
        if (asuntosCache.length) {
            return [...asuntosCache];
        }

        try {
            return JSON.parse(
                localStorage.getItem(CACHE_ASUNTOS)
            ) || [];
        } catch (error) {
            console.error(
                "No se pudo leer la caché de asuntos:",
                error
            );

            return [];
        }
    }

    function responsableParaSesion(sesion = obtenerUsuarioActivo()) {
        if (!sesion) return "";
        if (sesion.rol === "Pasante") return sesion.abogadoSupervisorUsuario || "";
        if (sesion.rol === "Abogado") return sesion.usuario || "";
        return "";
    }

    function consultasAsuntosPorRol() {
        const sesion = obtenerUsuarioActivo();
        const coleccion = obtenerDB().collection(COLECCION_ASUNTOS);
        const responsable = responsableParaSesion(sesion);

        if (sesion?.rol === "Abogado") {
            const consultas = [
                coleccion.where("abogadoAsignado", "==", responsable || "__SIN_RESPONSABLE__")
            ];

            // Un abogado colaborador también debe recibir el asunto aunque no sea
            // el responsable principal. Los colaboradores se guardan por UID.
            // El UID real de Firebase es la llave principal de acceso.
            // La sesión local puede no contenerlo o conservar un identificador anterior.
            const usuarioFirebase = window.firebaseAuth?.currentUser ||
                (window.firebase?.auth ? firebase.auth().currentUser : null);

            const llavesAcceso = [...new Set([
                usuarioFirebase?.uid,
                usuarioFirebase?.email,
                sesion.uid,
                sesion.id,
                sesion.usuario,
                sesion.correo
            ].filter(Boolean).map(valor => String(valor).trim()))];

            llavesAcceso.forEach(llave => {
                consultas.push(coleccion.where("colaboradorIds", "array-contains", llave));
            });

            return consultas;
        }

        if (sesion?.rol === "Pasante") {
            // El pasante conserva únicamente el ámbito de su responsable.
            return [coleccion.where("abogadoAsignado", "==", responsable || "__SIN_RESPONSABLE__")];
        }

        return [coleccion.orderBy("fechaRegistro", "desc")];
    }

    function iniciarSincronizacionAsuntos() {
        if (detenerEscuchaAsuntos) return;

        const usuarioActivo = obtenerUsuarioActivo();

        // El cliente usa la consulta específica del portal.
        if (usuarioActivo?.rol === "Cliente") {
            console.info("Sincronización general de asuntos omitida para el cliente.");
            return;
        }

        try {
            const consultas = consultasAsuntosPorRol();
            const resultadosPorConsulta = new Map();
            const cancelaciones = [];

            const publicarLista = () => {
                const documentos = new Map();

                resultadosPorConsulta.forEach(lista => {
                    lista.forEach(item => documentos.set(String(item.id), item));
                });

                const lista = [...documentos.values()].sort((a, b) => {
                    const fa = a.fechaRegistro?.toMillis?.() || 0;
                    const fb = b.fechaRegistro?.toMillis?.() || 0;
                    return fb - fa;
                });

                guardarCacheLocal(lista);
                cargarAsuntosTabla();
                window.cargarAsuntosConsultaCiudadana?.();
                window.actualizarContadoresReales?.();

                window.dispatchEvent(new CustomEvent("asuntosActualizados", { detail: lista }));

                if (asuntoHistorialIdSeleccionado) {
                    const asuntoActual = lista.find(asunto =>
                        String(asunto.id) === String(asuntoHistorialIdSeleccionado)
                    );
                    if (asuntoActual) {
                        cargarHistorialActuacionesLista(asuntoActual);
                        cargarHistorialCorreosLista(asuntoActual);
                    }
                }
            };

            consultas.forEach((consulta, indice) => {
                const cancelar = consulta.onSnapshot(
                    snapshot => {
                        resultadosPorConsulta.set(
                            indice,
                            snapshot.docs.map(doc => normalizarAsunto(doc.id, doc.data()))
                        );
                        publicarLista();
                    },
                    error => {
                        console.error(`Error sincronizando asuntos (consulta ${indice + 1}):`, error);
                    }
                );
                cancelaciones.push(cancelar);
            });

            detenerEscuchaAsuntos = () => cancelaciones.forEach(cancelar => cancelar?.());
        } catch (error) {
            console.error("No fue posible iniciar la sincronización de asuntos:", error);
        }
    }

    function obtenerUsuarioActivo() {
        try {
            const sesion =
                sessionStorage.getItem("js_legal_usuario") ||
                localStorage.getItem("js_legal_session");

            return sesion ? JSON.parse(sesion) : null;
        } catch (error) {
            console.error(
                "No se pudo leer la sesión:",
                error
            );

            return null;
        }
    }

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function obtenerNombreCliente(clienteId) {
        const clientes =
            typeof window.obtenerClientes === "function"
                ? window.obtenerClientes()
                : JSON.parse(
                    localStorage.getItem("js_legal_clientes")
                ) || [];

        const cliente = clientes.find(
            item =>
                String(item.id) === String(clienteId)
        );

        return cliente?.nombre || "";
    }

    function obtenerSelectAbogadoElemento() {
        return (
            document.getElementById("expediente-abogado") ||
            document.getElementById("asu-abogado-id") ||
            document.getElementById("asunto-abogado") ||
            document.getElementById("abogado-asignado")
        );
    }

    function poblarSelectClientes() {
        const select =
            document.getElementById("asu-cliente-id");

        if (!select) return;

        const clientes =
            typeof window.obtenerClientes === "function"
                ? window.obtenerClientes()
                : JSON.parse(
                    localStorage.getItem("js_legal_clientes")
                ) || [];

        select.innerHTML =
            '<option value="">-- Selecciona un cliente --</option>';

        clientes.forEach(cliente => {
            const opcion = document.createElement("option");

            opcion.value = cliente.id;
            opcion.textContent =
                cliente.nombre || "Cliente sin nombre";

            select.appendChild(opcion);
        });
    }

    function cargarAbogadosEnAsuntos() {
        const select = obtenerSelectAbogadoElemento();

        if (!select) {
            console.error(
                "No se encontró el selector de abogado del expediente."
            );
            return;
        }

        let lista = [];

        if (
            typeof window.obtenerListaCompletaPersonal ===
            "function"
        ) {
            lista = window.obtenerListaCompletaPersonal();
        } else {
            const dinamico =
                JSON.parse(
                    localStorage.getItem("js_legal_personal")
                ) || [];

            const base =
                typeof window.USUARIOS_MOCK !== "undefined"
                    ? window.USUARIOS_MOCK
                    : [];

            lista = [...base, ...dinamico];
        }

        const abogados = lista.filter(empleado =>
            ["Superadministrador", "Administrador", "Abogado"].includes(empleado.rol)
            && empleado.estado !== "Baja"
        );

        select.innerHTML =
            '<option value="">-- Seleccione un abogado responsable --</option>';

        abogados.forEach(abogado => {
            const opcion = document.createElement("option");

            opcion.value =
                abogado.usuario || abogado.id;

            opcion.textContent =
                abogado.nombre || abogado.usuario;

            select.appendChild(opcion);
        });
    }

    function identificadorPersonal(persona = {}) {
        return String(persona.uid || persona.id || persona.usuario || persona.correo || "").trim();
    }

    function obtenerPersonalDisponible() {
        const lista = typeof window.obtenerListaCompletaPersonal === "function"
            ? window.obtenerListaCompletaPersonal()
            : JSON.parse(localStorage.getItem("js_legal_personal") || "[]");
        return lista.filter(persona => persona.estado !== "Baja" &&
            ["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado", "Pasante"].includes(persona.rol));
    }

    function poblarColaboradores(seleccionados = []) {
        const contenedor = document.getElementById("asunto-colaboradores");
        if (!contenedor) return;

        const seleccion = new Set((seleccionados || []).map(String));
        contenedor.innerHTML = "";

        const personal = obtenerPersonalDisponible();
        if (!personal.length) {
            contenedor.innerHTML = '<p style="margin:0;color:#64748b;">No hay personal activo disponible.</p>';
            return;
        }

        personal.forEach(persona => {
            const id = identificadorPersonal(persona);
            if (!id) return;

            const etiqueta = document.createElement("label");
            etiqueta.className = "colaborador-opcion";

            const casilla = document.createElement("input");
            casilla.type = "checkbox";
            casilla.className = "asunto-colaborador-check";
            casilla.value = id;
            casilla.checked = seleccion.has(id);
            casilla.dataset.nombre = persona.nombre || persona.usuario || id;
            casilla.dataset.rol = persona.rol || "";
            casilla.dataset.uid = persona.uid || "";
            casilla.dataset.usuario = persona.usuario || "";
            casilla.dataset.correo = persona.correo || "";

            const marcador = document.createElement("span");
            marcador.className = "colaborador-marcador";
            marcador.setAttribute("aria-hidden", "true");

            const texto = document.createElement("span");
            texto.className = "colaborador-datos";
            texto.innerHTML = `<strong>${escaparHTML(persona.nombre || persona.usuario || id)}</strong><small>${escaparHTML(persona.rol || "Personal")}</small>`;

            const actualizarApariencia = () => {
                etiqueta.classList.toggle("seleccionado", casilla.checked);
                marcador.textContent = casilla.checked ? "✓" : "";
                actualizarResumenColaboradores();
            };
            casilla.addEventListener("change", actualizarApariencia);
            actualizarApariencia();

            etiqueta.append(casilla, marcador, texto);
            contenedor.appendChild(etiqueta);
        });
    }

    function actualizarColaboradoresEnAsuntos() {
        const seleccionados = obtenerColaboradoresSeleccionados().map(persona => persona.id);
        poblarColaboradores(seleccionados);
    }

    function actualizarResumenColaboradores() {
        const total = document.querySelectorAll("#asunto-colaboradores .asunto-colaborador-check:checked").length;
        const resumen = document.getElementById("resumen-colaboradores");
        if (resumen) resumen.textContent = `${total} colaborador${total === 1 ? "" : "es"} seleccionado${total === 1 ? "" : "s"}`;
    }

    function obtenerColaboradoresSeleccionados() {
        const contenedor = document.getElementById("asunto-colaboradores");
        if (!contenedor) return [];
        return [...contenedor.querySelectorAll(".asunto-colaborador-check:checked")].map(casilla => ({
            id: casilla.value,
            uid: casilla.dataset.uid || "",
            usuario: casilla.dataset.usuario || "",
            correo: casilla.dataset.correo || "",
            nombre: casilla.dataset.nombre || casilla.value,
            rol: casilla.dataset.rol || ""
        }));
    }

    async function abrirModalAsunto() {
        const modal = document.getElementById("modal-asunto");
        const formulario =
            document.getElementById("form-asunto");

        if (!modal || !formulario) return;

        formulario.reset();

        // Asegura que el catálogo de personal esté disponible antes de
        // construir los selectores de responsable y colaboradores.
        if (typeof window.cargarPersonal === "function") {
            try {
                await window.cargarPersonal();
            } catch (error) {
                console.error("No fue posible cargar el personal para el asunto:", error);
            }
        }

        const id = document.getElementById("asunto-id");
        const titulo =
            document.getElementById(
                "asunto-modal-titulo"
            );

        if (id) id.value = "";
        if (titulo) {
            titulo.innerText =
                "Registrar Nuevo Expediente";
        }

        if (document.getElementById("asu-estado")) document.getElementById("asu-estado").value = "En proceso";
        poblarSelectClientes();
        cargarAbogadosEnAsuntos();
        poblarColaboradores([]);
        const contenedorColaboradores = document.getElementById("contenedor-colaboradores");
        if (contenedorColaboradores) contenedorColaboradores.style.display = "none";
        const responsable = responsableParaSesion();
        const selectResponsable = obtenerSelectAbogadoElemento();
        if (selectResponsable && responsable) {
            if (![...selectResponsable.options].some(o => o.value === responsable)) {
                const opcion = document.createElement("option");
                opcion.value = responsable;
                opcion.textContent = obtenerUsuarioActivo()?.rol === "Pasante" ? "Abogado responsable" : (obtenerUsuarioActivo()?.nombre || responsable);
                selectResponsable.appendChild(opcion);
            }
            selectResponsable.value = responsable;
            selectResponsable.disabled = true;
        } else if (selectResponsable) {
            selectResponsable.disabled = false;
        }

        modal.style.display = "block";
    }

    function cerrarModalAsunto() {
        const modal = document.getElementById("modal-asunto");

        if (modal) modal.style.display = "none";
    }

    async function guardarAsunto(event) {
        event.preventDefault();

        try {
            const db = obtenerDB();

            const id =
                document.getElementById("asunto-id")
                    ?.value.trim() || "";

            const clienteId =
                document.getElementById("asu-cliente-id")
                    ?.value || "";

            const materia =
                document.getElementById("asu-materia")
                    ?.value || "";

            const expediente =
                document.getElementById("asu-expediente")
                    ?.value.trim() || "Pendiente de asignación";

            const juzgado =
                document.getElementById("asu-juzgado")
                    ?.value.trim() || "";

            const accion =
                document.getElementById("asu-accion")
                    ?.value.trim() || "";

            const estado =
                document.getElementById("asu-estado")
                    ?.value || "En proceso";

            const resumen =
                document.getElementById("asu-resumen")
                    ?.value.trim() || "";

            const selectAbogado =
                obtenerSelectAbogadoElemento();

            let abogadoAsignado =
                selectAbogado?.value || "";
            const sesionActiva = obtenerUsuarioActivo();
            const responsableSesion = responsableParaSesion(sesionActiva);
            if (responsableSesion) abogadoAsignado = responsableSesion;
            const enviarBienvenida = document.getElementById("asunto-enviar-bienvenida")?.checked !== false;
            const colaboradores = obtenerColaboradoresSeleccionados()
                .filter(persona => String(persona.id) !== String(abogadoAsignado));
            const colaboradorIds = [...new Set(colaboradores.flatMap(persona => [
                persona.id,
                persona.uid,
                persona.usuario,
                persona.correo
            ]).filter(Boolean).map(String))];

            if (
                !clienteId ||
                !materia ||
                !juzgado ||
                !accion
            ) {
                alert(
                    "Completa los campos obligatorios del expediente."
                );
                return;
            }

            const cliente =
                obtenerNombreCliente(clienteId);

            const datos = {
                clienteId,
                cliente,
                materia,
                expediente,
                juzgado,
                accion,
                estado,
                activo: !["Concluido", "Cancelado"].includes(estado),
                resumen,
                abogadoAsignado,
                colaboradores,
                colaboradorIds,
                fechaActualizacion:
                    firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) {
                await db
                    .collection(COLECCION_ASUNTOS)
                    .doc(String(id))
                    .set(datos, { merge: true });

                alert(
                    "Expediente actualizado correctamente."
                );
            } else {
                datos.actuaciones = [];
                datos.folioInterno = await window.siguienteConsecutivo("asuntos", "EXP");
                datos.fechaRegistro =
                    firebase.firestore.FieldValue.serverTimestamp();

                const documentoCreado = await db
                    .collection(COLECCION_ASUNTOS)
                    .add(datos);

                const opcionSeleccionada =
                    selectAbogado?.options[selectAbogado.selectedIndex];

                if (
                    abogadoAsignado &&
                    typeof window.crearAlertaNuevoAsunto === "function"
                ) {
                    try {
                        await window.crearAlertaNuevoAsunto({
                            usuario: abogadoAsignado,
                            abogadoNombre:
                                opcionSeleccionada?.textContent?.trim() || "",
                            asuntoId: documentoCreado.id,
                            expediente,
                            cliente
                        });
                    } catch (errorAlerta) {
                        console.error(
                            "El expediente se guardó, pero no se pudo crear la alerta interna:",
                            errorAlerta
                        );
                    }
                }

                let resultadoCorreo = null;

                if (
                    abogadoAsignado &&
                    window.JSLegalEmail?.enviarCorreoNuevoAsunto
                ) {
                    resultadoCorreo =
                        await window.JSLegalEmail.enviarCorreoNuevoAsunto({
                            usuario: abogadoAsignado,
                            abogadoNombre:
                                opcionSeleccionada?.textContent?.trim() || "",
                            expediente,
                            cliente,
                            materia,
                            descripcion: resumen || accion,
                            fecha: new Date().toLocaleDateString("es-MX")
                        });
                }

                let resultadoPortal = null;
                if (enviarBienvenida && window.JSLegalAccesoClientes?.habilitarYEnviar) {
                    try {
                        resultadoPortal = await window.JSLegalAccesoClientes.habilitarYEnviar({
                            clienteId,
                            asuntoId: documentoCreado.id,
                            asunto: { ...datos, id: documentoCreado.id },
                            abogadoNombre: opcionSeleccionada?.textContent?.trim() || ""
                        });
                    } catch (errorPortal) {
                        console.error("El expediente se guardó, pero falló la invitación del cliente:", errorPortal);
                        resultadoPortal = { ok: false, error: errorPortal };
                    }
                }

                const mensajes = ["Expediente registrado correctamente."];
                if (resultadoCorreo?.ok) mensajes.push("La alerta interna y el correo fueron enviados al abogado asignado.");
                else if (abogadoAsignado) mensajes.push("La alerta interna fue creada, pero no se confirmó el correo al abogado.");
                if (resultadoPortal?.ok) mensajes.push(`El acceso al portal fue enviado a ${resultadoPortal.correo}.`);
                else if (enviarBienvenida) mensajes.push("No se pudo completar el correo de acceso del cliente. Puede reenviarlo desde la tabla de asuntos.");
                alert(mensajes.join("\n\n"));
                /* Mensajes anteriores conservados como referencia, sin ejecución. */
                if (false && resultadoCorreo?.ok) {
                    alert(
                        "Expediente registrado correctamente.\n\n" +
                        "La alerta interna y el correo fueron enviados al abogado asignado."
                    );
                } else if (false && abogadoAsignado) {
                    alert(
                        "Expediente registrado correctamente.\n\n" +
                        "La alerta interna fue creada, pero no se pudo confirmar el envío del correo. " +
                        "Revisa que el abogado tenga un correo registrado y consulta la consola si el problema continúa."
                    );
                } else {
                    alert(
                        "Expediente registrado correctamente."
                    );
                }
            }

            cerrarModalAsunto();

        } catch (error) {
            console.error(
                "Error guardando asunto:",
                error
            );

            alert(
                "No fue posible guardar el expediente en Firebase."
            );
        }
    }

    async function editarAsunto(id) {
        const asunto = obtenerAsuntos().find(
            item =>
                String(item.id) === String(id)
        );

        if (!asunto) {
            alert("No se encontró el expediente.");
            return;
        }

        await abrirModalAsunto();

        document.getElementById(
            "asunto-modal-titulo"
        ).innerText = "Editar Expediente";

        document.getElementById("asunto-id").value =
            asunto.id;

        document.getElementById(
            "asu-cliente-id"
        ).value = asunto.clienteId || "";

        document.getElementById("asu-materia").value =
            asunto.materia || "";

        document.getElementById(
            "asu-expediente"
        ).value = asunto.expediente || "";

        document.getElementById("asu-juzgado").value =
            asunto.juzgado || "";

        document.getElementById("asu-accion").value =
            asunto.accion || "";

        document.getElementById("asu-estado").value =
            asunto.estado || "En proceso";

        document.getElementById("asu-resumen").value =
            asunto.resumen || "";

        const selectAbogado =
            obtenerSelectAbogadoElemento();

        if (selectAbogado) {
            selectAbogado.value = asunto.abogadoAsignado || "";
        }

        const idsColaboradores = (asunto.colaboradorIds || asunto.colaboradores?.map(c => c.id) || []).map(String);
        poblarColaboradores(idsColaboradores);
        const contenedorColaboradores = document.getElementById("contenedor-colaboradores");
        if (contenedorColaboradores) contenedorColaboradores.style.display = idsColaboradores.length ? "block" : "none";
    }

    function solicitarEstadoAsunto(asunto) {
        return new Promise(resolve => {
            const anterior = document.getElementById("modal-cambiar-estado-asunto");
            if (anterior) anterior.remove();

            const modal = document.createElement("div");
            modal.id = "modal-cambiar-estado-asunto";
            modal.style.cssText = "position:fixed;inset:0;z-index:2000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:1rem;";
            modal.innerHTML = `
                <div style="background:white;width:min(430px,100%);padding:1.5rem;border-radius:12px;box-shadow:0 20px 45px rgba(0,0,0,.25)">
                    <h3 style="margin:0 0 .5rem;color:#0f172a">Cambiar estado del asunto</h3>
                    <p style="margin:0 0 1rem;color:#64748b">${escaparHTML(asunto.expediente || asunto.folioInterno || "Expediente")}</p>
                    <label for="selector-estado-asunto" style="display:block;font-weight:700;margin-bottom:.4rem">Nuevo estado</label>
                    <select id="selector-estado-asunto" style="width:100%;padding:.75rem;border:1px solid #cbd5e1;border-radius:6px">
                        ${["En proceso", "Suspendido", "Concluido", "Cancelado"].map(estado =>
                            `<option value="${estado}" ${estado === (asunto.estado || "En proceso") ? "selected" : ""}>${estado}</option>`
                        ).join("")}
                    </select>
                    <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1.25rem">
                        <button type="button" id="cancelar-estado-asunto" style="padding:.65rem 1rem;border:1px solid #cbd5e1;background:white;border-radius:6px;cursor:pointer">Cancelar</button>
                        <button type="button" id="confirmar-estado-asunto" style="padding:.65rem 1rem;border:0;background:#2563eb;color:white;border-radius:6px;cursor:pointer;font-weight:700">Actualizar</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);

            const cerrar = valor => { modal.remove(); resolve(valor); };
            modal.querySelector("#cancelar-estado-asunto").addEventListener("click", () => cerrar(""));
            modal.querySelector("#confirmar-estado-asunto").addEventListener("click", () => cerrar(modal.querySelector("#selector-estado-asunto").value));
            modal.addEventListener("click", event => { if (event.target === modal) cerrar(""); });
        });
    }

    async function eliminarAsunto(id) {
        if (!window.JSLegalRoles?.tienePermiso("cancelar_asuntos")) {
            alert("Tu rol no permite concluir, suspender o cancelar asuntos.");
            return;
        }
        const asunto = obtenerAsuntos().find(a => String(a.id) === String(id));
        if (!asunto) return;
        const nuevoEstado = await solicitarEstadoAsunto(asunto);
        if (!nuevoEstado) return;
        try {
            await obtenerDB().collection(COLECCION_ASUNTOS).doc(String(id)).set({
                estado: nuevoEstado,
                activo: !["Concluido", "Cancelado"].includes(nuevoEstado),
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            alert(`Asunto actualizado a: ${nuevoEstado}. El registro no fue eliminado.`);
        } catch (error) {
            console.error("Error cambiando estado del asunto:", error);
            alert("No fue posible cambiar el estado del asunto.");
        }
    }

    function cargarAsuntosTabla() {
        const cuerpo =
            document.getElementById(
                "tabla-asuntos-cuerpo"
            ) ||
            document.getElementById(
                "tabla-expedientes-cuerpo"
            );

        if (!cuerpo) return;

        const usuarioActivo = obtenerUsuarioActivo();
        let asuntos = obtenerAsuntos();

        const responsable = responsableParaSesion(usuarioActivo);
        if (responsable) {
            asuntos = asuntos.filter(asunto =>
                String(asunto.abogadoAsignado || "") === String(responsable)
            );
        }

        cuerpo.innerHTML = "";

        if (!asuntos.length) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center;padding:1rem;">
                        No hay expedientes registrados o asignados.
                    </td>
                </tr>
            `;
            return;
        }

        asuntos.forEach(asunto => {
            const fila = document.createElement("tr");

                  fila.dataset.id = asunto.id;
            fila.innerHTML = `
                <td><strong>${escaparHTML(asunto.folioInterno || "EXP-PENDIENTE")}</strong><br><small>${escaparHTML(asunto.expediente || "Pendiente de asignación")}</small></td>

                <td>${escaparHTML(
                    asunto.cliente || "Sin cliente"
                )}</td>

                <td>${escaparHTML(
                    `${asunto.materia || ""} / ${
                        asunto.accion || ""
                    }`
                )}</td>

                <td>${escaparHTML(
                    asunto.juzgado || ""
                )}</td>

                <td>
                    <span class="badge">
                        ${escaparHTML(
                            asunto.estado || ""
                        )}
                    </span>
                </td>

                <td style="text-align:center;">
                    <button
                        type="button"
                        onclick="editarAsunto('${asunto.id}')"
                        style="color:#3b82f6;background:none;border:none;cursor:pointer;margin-right:5px;">
                        ✏️
                    </button>

                    <button
                        type="button"
                        onclick="abrirBitacoraAsunto('${asunto.id}')"
                        style="color:#8b5cf6;background:none;border:none;cursor:pointer;margin-right:5px;">
                        📜
                    </button>

                    <button
                        type="button"
                        title="Reenviar acceso al portal"
                        onclick="reenviarInvitacionCliente('${asunto.id}')"
                        style="color:#0f766e;background:none;border:none;cursor:pointer;margin-right:5px;">
                        📧
                    </button>

                    ${window.JSLegalRoles?.tienePermiso("cancelar_asuntos") ? `<button
                        type="button"
                        onclick="eliminarAsunto('${asunto.id}')"
                        style="color:#ef4444;background:none;border:none;cursor:pointer;">
                        🔄 Estado
                    </button>` : ""}
                </td>
            `;

            cuerpo.appendChild(fila);
        });
    }

    function abrirBitacoraAsunto(asuntoId) {
        asuntoHistorialIdSeleccionado =
            String(asuntoId);

        const asunto = obtenerAsuntos().find(
            item =>
                String(item.id) ===
                String(asuntoId)
        );

        if (!asunto) {
            alert("No se encontró el expediente.");
            return;
        }

        const modal =
            document.getElementById("modal-bitacora");

        const titulo =
            document.getElementById(
                "bitacora-expediente-titulo"
            );

        const formulario =
            document.getElementById("form-actuacion");

        if (!modal) {
            console.error(
                "No existe modal-bitacora."
            );
            return;
        }

        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        if (titulo) {
            titulo.innerText =
                asunto.expediente || "Sin número";
        }

        if (formulario) {
            formulario.style.display = "block";
            reiniciarFormularioActuacion();
        }

        cargarHistorialActuacionesLista(asunto);
        cargarHistorialCorreosLista(asunto);
        modal.style.display = "block";
    }

    function cerrarModalBitacora() {
        const modal =
            document.getElementById("modal-bitacora");

        if (modal) modal.style.display = "none";

        asuntoHistorialIdSeleccionado = null;

        const formulario =
            document.getElementById("form-actuacion");

        if (formulario) {
            formulario.style.display = "block";
        }
    }

    function obtenerPresentacionActuacion(actuacion = {}) {
        const mapa = {
            Audiencia: { icono: "⚖️", color: "#2563eb" },
            Acuerdo: { icono: "📄", color: "#7c3aed" },
            Auto: { icono: "📑", color: "#4f46e5" },
            Sentencia: { icono: "🏛️", color: "#b45309" },
            Requerimiento: { icono: "📌", color: "#dc2626" },
            Oficio: { icono: "📬", color: "#0891b2" },
            Exhorto: { icono: "🚚", color: "#0f766e" },
            Promoción: { icono: "📝", color: "#16a34a" },
            Notificación: { icono: "📨", color: "#9333ea" },
            Convenio: { icono: "🤝", color: "#059669" },
            Diligencia: { icono: "🔎", color: "#475569" },
            Otro: { icono: "📂", color: "#64748b" }
        };

        const tipo = actuacion.tipo || "Actuación";
        return {
            tipo,
            ...(mapa[tipo] || { icono: "📍", color: "#8b5cf6" })
        };
    }

    function cargarHistorialActuacionesLista(asunto) {
        const contenedor = document.getElementById("bitacora-lista-historico");
        if (!contenedor) return;

        contenedor.innerHTML = "";
        const actuaciones = Array.isArray(asunto.actuaciones) ? asunto.actuaciones : [];

        if (!actuaciones.length) {
            contenedor.innerHTML = '<p style="color:#64748b;text-align:center;padding:1rem;">No hay actuaciones registradas.</p>';
            return;
        }

        actuaciones.slice().reverse().forEach((actuacion, indiceInvertido) => {
            const indiceReal = actuaciones.length - 1 - indiceInvertido;
            const presentacion = obtenerPresentacionActuacion(actuacion);
            const elemento = document.createElement("article");
            elemento.style.cssText = `position:relative;background:#fff;border:1px solid #e2e8f0;border-left:5px solid ${presentacion.color};padding:1rem;margin-bottom:.75rem;border-radius:0 8px 8px 0;box-shadow:0 2px 6px rgba(15,23,42,.05);`;

            const etiquetas = [];
            if (actuacion.requiereCumplimiento) etiquetas.push('<span style="background:#fff7ed;color:#9a3412;padding:.2rem .45rem;border-radius:999px;font-size:.72rem;font-weight:700;">✓ Requiere seguimiento</span>');
            if (actuacion.generaTermino) etiquetas.push('<span style="background:#fef2f2;color:#b91c1c;padding:.2rem .45rem;border-radius:999px;font-size:.72rem;font-weight:700;">⏰ Término generado</span>');
            etiquetas.push(actuacion.visibleCliente
                ? '<span style="background:#ecfdf5;color:#047857;padding:.2rem .45rem;border-radius:999px;font-size:.72rem;font-weight:700;">👁 Visible al cliente</span>'
                : '<span style="background:#f1f5f9;color:#475569;padding:.2rem .45rem;border-radius:999px;font-size:.72rem;font-weight:700;">🔒 Uso interno</span>');

            elemento.innerHTML = `
                <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;">
                    <div style="min-width:0;flex:1;">
                        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;">
                            <strong style="color:${presentacion.color};font-size:.95rem;text-transform:uppercase;letter-spacing:.03em;">${presentacion.icono} ${escaparHTML(presentacion.tipo)}</strong>
                            ${actuacion.subtipo ? `<span style="color:#475569;font-size:.78rem;font-weight:700;">${escaparHTML(actuacion.subtipo)}</span>` : ""}
                        </div>
                        <span style="display:block;margin-top:.35rem;font-size:.78rem;font-weight:700;color:#64748b;">📅 ${escaparHTML(actuacion.fecha || "")}</span>
                        <p style="margin:.55rem 0 0;font-size:.9rem;color:#1e293b;line-height:1.5;white-space:pre-wrap;">${escaparHTML(actuacion.descripcion || "")}</p>
                        ${etiquetas.length ? `<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.65rem;">${etiquetas.join("")}</div>` : ""}
                    </div>
                    <button type="button" onclick="eliminarActuacion(${indiceReal})" title="Eliminar actuación" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.9rem;padding:.2rem;">❌</button>
                </div>`;

            contenedor.appendChild(elemento);
        });
    }

    async function crearAlertaTermino(db, asunto, datosTermino) {
        if (!asunto.abogadoAsignado) {
            throw new Error("El expediente no tiene un abogado responsable asignado.");
        }

        const sesion = obtenerUsuarioActivo();

        return db.collection("alertas").add({
            tipo: "termino",
            usuario: String(asunto.abogadoAsignado),
            asuntoId: String(asunto.id),
            expediente: asunto.expediente || "",
            cliente: asunto.cliente || "",
            titulo: datosTermino.concepto,
            descripcion: datosTermino.descripcion || "",
            fechaVencimiento: datosTermino.fechaVencimiento,
            prioridad: datosTermino.prioridad || "Media",
            estado: "pendiente",
            creadoPor: sesion?.usuario || sesion?.uid || "",
            creadoPorNombre: sesion?.nombre || "",
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaCumplimiento: null
        });
    }

    async function guardarActuacion(event) {
        event.preventDefault();

        if (!asuntoHistorialIdSeleccionado) {
            alert("No hay expediente seleccionado.");
            return;
        }

        const tipo = document.getElementById("act-tipo")?.value || "";
        const subtipo = document.getElementById("act-subtipo")?.value || "";
        const descripcion = document.getElementById("act-descripcion")?.value.trim() || "";
        const fechaInput = document.getElementById("act-fecha")?.value || "";
        const requiereCumplimiento = document.getElementById("act-requiere-cumplimiento")?.checked === true;
        const generaTermino = document.getElementById("act-genera-termino")?.checked === true;
        const visibleCliente = document.getElementById("act-visible-cliente")?.checked === true;
        const notificarCliente = visibleCliente && document.getElementById("act-notificar-cliente")?.checked === true;
        const conceptoTermino = document.getElementById("termino-concepto")?.value.trim() || "";
        const fechaVencimiento = document.getElementById("termino-fecha")?.value || "";
        const prioridadTermino = document.getElementById("termino-prioridad")?.value || "Media";

        if (!tipo) {
            alert("Selecciona el tipo de actuación.");
            return;
        }
        if (!descripcion) {
            alert("Escribe la descripción de la actuación.");
            return;
        }
        if (generaTermino && (!conceptoTermino || !fechaVencimiento)) {
            alert("Para generar el término escribe el concepto y la fecha límite.");
            return;
        }

        const fecha = fechaInput
            ? new Date(`${fechaInput}T00:00:00`).toLocaleDateString("es-MX")
            : new Date().toLocaleDateString("es-MX");

        const asunto = obtenerAsuntos().find(item => String(item.id) === String(asuntoHistorialIdSeleccionado));
        if (!asunto) {
            alert("No se encontró el expediente.");
            return;
        }

        const actuaciones = Array.isArray(asunto.actuaciones) ? [...asunto.actuaciones] : [];
        const sesion = obtenerUsuarioActivo();
        actuaciones.push({
            fecha,
            tipo,
            subtipo,
            descripcion,
            requiereCumplimiento,
            generaTermino,
            visibleCliente,
            notificarCliente,
            creadoPor: sesion?.uid || sesion?.usuario || sesion?.correo || "",
            creadoPorNombre: sesion?.nombre || sesion?.usuario || "Usuario",
            creadoPorRol: sesion?.rol || "",
            creadoEn: new Date().toISOString()
        });

        try {
            const db = obtenerDB();
            await db.collection(COLECCION_ASUNTOS).doc(String(asuntoHistorialIdSeleccionado)).update({
                actuaciones,
                resumen: descripcion,
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (generaTermino) {
                await crearAlertaTermino(db, asunto, {
                    concepto: conceptoTermino,
                    descripcion,
                    fechaVencimiento,
                    prioridad: prioridadTermino
                });

                if (window.JSLegalEmail?.enviarCorreoAlertaAbogado) {
                    const resultadoAlerta = await window.JSLegalEmail.enviarCorreoAlertaAbogado({
                        usuario: asunto.abogadoAsignado,
                        asunto: `Término procesal: ${conceptoTermino}`,
                        expediente: asunto.expediente,
                        cliente: asunto.cliente,
                        juzgado: asunto.juzgado,
                        materia: asunto.materia,
                        descripcion: `${descripcion}\n\nFecha límite: ${fechaVencimiento}. Prioridad: ${prioridadTermino}.`,
                        tipo: "termino_procesal"
                    });
                    if (!resultadoAlerta.ok) {
                        console.warn("El término se creó, pero no se confirmó el correo al abogado:", resultadoAlerta.motivo);
                    }
                }
            }

            let correoClienteEnviado = false;
            if (notificarCliente && window.JSLegalEmail?.enviarCorreoCliente) {
                const clientes = typeof window.obtenerClientes === "function" ? window.obtenerClientes() : JSON.parse(localStorage.getItem("js_legal_clientes") || "[]");
                const cliente = clientes.find(item => String(item.id) === String(asunto.clienteId));
                if (cliente?.correo) {
                    const resultado = await window.JSLegalEmail.enviarCorreoCliente({
                        correo: cliente.correo,
                        cliente: asunto.cliente,
                        expediente: asunto.expediente,
                        juzgado: asunto.juzgado,
                        materia: asunto.materia,
                        descripcion,
                        asunto: `Actualización de su expediente ${asunto.expediente || ""}`,
                        tipo: "informe_cliente",
                        fecha
                    });
                    correoClienteEnviado = resultado.ok === true;
                } else {
                    console.warn("La actuación se publicó, pero el cliente no tiene correo registrado.");
                }
            }

            reiniciarFormularioActuacion();
            alert(generaTermino
                ? "Actuación registrada y término procesal creado correctamente."
                : "Actuación registrada correctamente.");

            if (notificarCliente) {
                window.setTimeout(() => abrirModalCorreoCliente({
                    asuntoId: asunto.id,
                    mensajeSugerido: descripcion,
                    tipoActuacion: tipo
                }), 150);
            }
        } catch (error) {
            console.error("Error guardando actuación:", error);
            alert("No fue posible guardar la actuación.");
        }
    }

    async function eliminarActuacion(indice) {
        if (
            !confirm(
                "¿Deseas borrar esta actuación del historial?"
            )
        ) {
            return;
        }

        const asunto = obtenerAsuntos().find(
            item =>
                String(item.id) ===
                String(asuntoHistorialIdSeleccionado)
        );

        if (!asunto) return;

        const actuaciones = Array.isArray(
            asunto.actuaciones
        )
            ? [...asunto.actuaciones]
            : [];

        actuaciones.splice(indice, 1);

        try {
            const db = obtenerDB();

            await db
                .collection(COLECCION_ASUNTOS)
                .doc(
                    String(
                        asuntoHistorialIdSeleccionado
                    )
                )
                .update({
                    actuaciones,
                    fechaActualizacion:
                        firebase.firestore.FieldValue.serverTimestamp()
                });

        } catch (error) {
            console.error(
                "Error eliminando actuación:",
                error
            );

            alert(
                "No fue posible eliminar la actuación."
            );
        }
    }

    const SUBTIPOS_ACTUACION = {
        Audiencia: ["Inicial", "Preliminar", "Juicio", "Conciliación", "Pruebas", "Alegatos", "Otra"],
        Acuerdo: ["Admisorio", "Preventivo", "De trámite", "Cumplimiento", "Archivo", "Otro"],
        Auto: ["Admisorio", "Interlocutorio", "De trámite", "Ejecución", "Otro"],
        Sentencia: ["Definitiva", "Interlocutoria", "Incidental"],
        Requerimiento: ["Documental", "Personal", "Pago", "Aclaración", "Otro"],
        Notificación: ["Personal", "Lista", "Boletín", "Electrónica", "Otra"],
        Diligencia: ["Emplazamiento", "Inspección", "Embargo", "Ejecución", "Otra"]
    };

    function actualizarSubtiposActuacion() {
        const tipo = document.getElementById("act-tipo")?.value || "";
        const contenedor = document.getElementById("contenedor-act-subtipo");
        const select = document.getElementById("act-subtipo");
        if (!contenedor || !select) return;

        const opciones = SUBTIPOS_ACTUACION[tipo] || [];
        select.innerHTML = '<option value="">-- Selecciona --</option>' +
            opciones.map(opcion => `<option value="${escaparHTML(opcion)}">${escaparHTML(opcion)}</option>`).join("");
        contenedor.style.display = opciones.length ? "block" : "none";

        if (tipo === "Requerimiento") {
            const genera = document.getElementById("act-genera-termino");
            if (genera && !genera.checked) {
                genera.checked = true;
                genera.dispatchEvent(new Event("change"));
            }
        }
    }


    async function obtenerClienteDelAsunto(asunto) {
        if (!asunto?.clienteId || !window.db) return null;
        try {
            const documento = await window.db.collection("clientes").doc(String(asunto.clienteId)).get();
            return documento.exists ? { id: documento.id, ...documento.data() } : null;
        } catch (error) {
            console.error("No se pudo obtener el cliente del expediente:", error);
            return null;
        }
    }

    function obtenerFirmaUsuario() {
        const sesion = obtenerUsuarioActivo();
        return sesion?.nombre || sesion?.usuario || "JS Legal & Ingeniería";
    }

    function construirMensajeCliente(asunto, tipoPlantilla = "actualizacion", mensajeSugerido = "") {
        const expediente = asunto?.expediente || "sin número";
        const cliente = asunto?.cliente || "cliente";
        const ultima = mensajeSugerido || asunto?.resumen || "No existen novedades adicionales registradas.";
        const firma = obtenerFirmaUsuario();

        const mensajes = {
            actualizacion: `Estimado(a) ${cliente}:\n\nPor este medio le informamos que su expediente ${expediente} presenta la siguiente actualización:\n\n${ultima}\n\nSeguiremos dando puntual seguimiento a su asunto y le comunicaremos cualquier novedad relevante.\n\nAtentamente,\n${firma}\nJS Legal & Ingeniería`,
            audiencia: `Estimado(a) ${cliente}:\n\nLe recordamos que existe una audiencia relacionada con su expediente ${expediente}. Por favor, manténgase atento(a) a las indicaciones de su abogado y confirme la documentación que deberá presentar.\n\nObservaciones:\n${ultima}\n\nAtentamente,\n${firma}\nJS Legal & Ingeniería`,
            documentos: `Estimado(a) ${cliente}:\n\nPara continuar con la atención de su expediente ${expediente}, le solicitamos proporcionar la documentación indicada a continuación:\n\n${ultima}\n\nAgradecemos su pronta atención.\n\nAtentamente,\n${firma}\nJS Legal & Ingeniería`,
            personalizado: mensajeSugerido || ""
        };
        return mensajes[tipoPlantilla] || mensajes.actualizacion;
    }

    function cargarHistorialCorreosLista(asunto) {
        const contenedor = document.getElementById("correos-lista-historico");
        if (!contenedor) return;
        const correos = Array.isArray(asunto?.correos) ? asunto.correos : [];
        if (!correos.length) {
            contenedor.innerHTML = '<p style="color:#64748b;text-align:center;padding:1rem;">No hay correos registrados.</p>';
            return;
        }
        contenedor.innerHTML = correos.slice().reverse().map(correo => `
            <article style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid ${correo.estado === "enviado" ? "#16a34a" : "#dc2626"};padding:.8rem;margin-bottom:.55rem;border-radius:0 7px 7px 0;">
                <div style="display:flex;justify-content:space-between;gap:.8rem;flex-wrap:wrap;">
                    <strong style="color:#1e293b;">📧 ${escaparHTML(correo.asunto || "Correo")}</strong>
                    <span style="font-size:.76rem;color:#64748b;">${escaparHTML(correo.fecha || "")}</span>
                </div>
                <div style="font-size:.82rem;color:#475569;margin-top:.35rem;"><b>Para:</b> ${escaparHTML(correo.destinatario || "")}</div>
                <div style="font-size:.78rem;color:${correo.estado === "enviado" ? "#15803d" : "#b91c1c"};margin-top:.3rem;font-weight:700;">${correo.estado === "enviado" ? "Enviado" : "No enviado"}</div>
            </article>
        `).join("");
    }

    async function abrirModalCorreoCliente(opciones = {}) {
        const asuntoId = opciones.asuntoId || asuntoHistorialIdSeleccionado;
        const asunto = obtenerAsuntos().find(item => String(item.id) === String(asuntoId));
        if (!asunto) {
            alert("Abre primero la bitácora de un expediente.");
            return;
        }
        asuntoHistorialIdSeleccionado = asunto.id;
        const cliente = await obtenerClienteDelAsunto(asunto);
        const modal = document.getElementById("modal-correo-cliente");
        const destinatario = document.getElementById("correo-cliente-destinatario");
        const plantilla = document.getElementById("correo-cliente-plantilla");
        const asuntoCorreo = document.getElementById("correo-cliente-asunto");
        const mensaje = document.getElementById("correo-cliente-mensaje");
        const estado = document.getElementById("correo-cliente-estado");
        if (!modal || !destinatario || !plantilla || !asuntoCorreo || !mensaje) return;

        destinatario.value = cliente?.correo || "";
        plantilla.value = opciones.tipoActuacion === "Audiencia" ? "audiencia" : "actualizacion";
        asuntoCorreo.value = `Actualización del expediente ${asunto.expediente || ""}`.trim();
        mensaje.value = construirMensajeCliente(asunto, plantilla.value, opciones.mensajeSugerido || "");
        if (estado) estado.textContent = cliente?.correo ? "" : "El cliente no tiene correo registrado; puede capturarlo manualmente.";
        modal.style.display = "block";
    }

    function cerrarModalCorreoCliente() {
        const modal = document.getElementById("modal-correo-cliente");
        if (modal) modal.style.display = "none";
    }

    async function guardarRegistroCorreo(asunto, registro) {
        const correos = Array.isArray(asunto.correos) ? [...asunto.correos] : [];
        correos.push(registro);
        await obtenerDB().collection(COLECCION_ASUNTOS).doc(String(asunto.id)).update({
            correos,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async function enviarInformeCliente(event) {
        event.preventDefault();
        const asunto = obtenerAsuntos().find(item => String(item.id) === String(asuntoHistorialIdSeleccionado));
        if (!asunto) return alert("No se encontró el expediente seleccionado.");

        const correo = document.getElementById("correo-cliente-destinatario")?.value.trim() || "";
        const asuntoCorreo = document.getElementById("correo-cliente-asunto")?.value.trim() || "";
        const descripcion = document.getElementById("correo-cliente-mensaje")?.value.trim() || "";
        const estado = document.getElementById("correo-cliente-estado");
        const boton = document.getElementById("btn-confirmar-envio-correo");
        if (!correo || !asuntoCorreo || !descripcion) return alert("Completa destinatario, asunto y mensaje.");
        if (!window.JSLegalEmail?.enviarCorreoCliente) return alert("El servicio de correo no está disponible.");

        if (boton) { boton.disabled = true; boton.textContent = "Enviando..."; }
        if (estado) estado.textContent = "Enviando correo...";

        const resultado = await window.JSLegalEmail.enviarCorreoCliente({
            correo,
            asunto: asuntoCorreo,
            cliente: asunto.cliente,
            expediente: asunto.expediente,
            juzgado: asunto.juzgado,
            materia: asunto.materia,
            descripcion,
            abogado: obtenerFirmaUsuario(),
            tipo: "informe_cliente"
        });

        const registro = {
            destinatario: correo,
            asunto: asuntoCorreo,
            tipo: "informe_cliente",
            estado: resultado.ok ? "enviado" : "error",
            fecha: new Date().toLocaleString("es-MX"),
            enviadoPor: obtenerFirmaUsuario(),
            creadoEn: new Date().toISOString()
        };

        try {
            await guardarRegistroCorreo(asunto, registro);
        } catch (error) {
            console.error("El correo se procesó, pero no se pudo registrar:", error);
        }

        if (boton) { boton.disabled = false; boton.textContent = "Enviar correo"; }
        if (resultado.ok) {
            if (estado) estado.textContent = "Correo enviado y registrado correctamente.";
            alert("Correo enviado al cliente correctamente.");
            cerrarModalCorreoCliente();
        } else {
            if (estado) estado.textContent = "No fue posible confirmar el envío. Revise EmailJS y la consola.";
            alert("No se pudo enviar el correo. El intento quedó registrado.");
        }
    }

    function reiniciarFormularioActuacion() {
        document.getElementById("form-actuacion")?.reset();
        const subtipos = document.getElementById("contenedor-act-subtipo");
        const camposTermino = document.getElementById("campos-termino");
        if (subtipos) subtipos.style.display = "none";
        if (camposTermino) camposTermino.style.display = "none";
        const filaNotificar = document.getElementById("fila-act-notificar-cliente");
        if (filaNotificar) filaNotificar.style.display = "none";
    }

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            window.addEventListener("personalActualizado", () => {
                cargarAbogadosEnAsuntos();
                actualizarColaboradoresEnAsuntos();
            });

            document
                .getElementById("form-asunto")
                ?.addEventListener(
                    "submit",
                    guardarAsunto
                );

            document
                .getElementById("form-actuacion")
                ?.addEventListener("submit", guardarActuacion);

            document.getElementById("btn-agregar-colaborador")?.addEventListener("click", () => {
                const contenedor = document.getElementById("contenedor-colaboradores");
                if (!contenedor) return;
                contenedor.style.display = contenedor.style.display === "none" ? "block" : "none";
            });

            document.getElementById("act-visible-cliente")?.addEventListener("change", event => {
                const fila = document.getElementById("fila-act-notificar-cliente");
                const notificar = document.getElementById("act-notificar-cliente");
                if (fila) fila.style.display = event.target.checked ? "flex" : "none";
                if (!event.target.checked && notificar) notificar.checked = false;
            });

            document
                .getElementById("form-correo-cliente")
                ?.addEventListener("submit", enviarInformeCliente);

            document
                .getElementById("correo-cliente-plantilla")
                ?.addEventListener("change", event => {
                    const asunto = obtenerAsuntos().find(item => String(item.id) === String(asuntoHistorialIdSeleccionado));
                    const mensaje = document.getElementById("correo-cliente-mensaje");
                    if (asunto && mensaje) mensaje.value = construirMensajeCliente(asunto, event.target.value);
                });

            document
                .getElementById("act-tipo")
                ?.addEventListener("change", actualizarSubtiposActuacion);

            document
                .getElementById("act-genera-termino")
                ?.addEventListener("change", event => {
                    const campos = document.getElementById("campos-termino");
                    if (!campos) return;
                    campos.style.display = event.target.checked ? "block" : "none";
                    if (!event.target.checked) {
                        const concepto = document.getElementById("termino-concepto");
                        const fecha = document.getElementById("termino-fecha");
                        if (concepto) concepto.value = "";
                        if (fecha) fecha.value = "";
                    }
                });

            iniciarSincronizacionAsuntos();
            cargarAsuntosTabla();
        }
    );

    window.obtenerAsuntos = obtenerAsuntos;
    window.cargarAsuntosTabla =
        cargarAsuntosTabla;
    window.abrirModalAsunto =
        abrirModalAsunto;
    window.cerrarModalAsunto =
        cerrarModalAsunto;
    window.guardarAsunto = guardarAsunto;
    window.editarAsunto = editarAsunto;
    window.eliminarAsunto = eliminarAsunto;
    window.abrirBitacoraAsunto =
        abrirBitacoraAsunto;
    window.cerrarModalBitacora =
        cerrarModalBitacora;
    window.guardarActuacion =
        guardarActuacion;
    window.abrirModalCorreoCliente = abrirModalCorreoCliente;
    window.cerrarModalCorreoCliente = cerrarModalCorreoCliente;
    window.eliminarActuacion =
        eliminarActuacion;
    window.cargarHistorialActuacionesLista =
        cargarHistorialActuacionesLista;
    window.cargarAbogadosEnAsuntos =
        cargarAbogadosEnAsuntos;
    window.actualizarColaboradoresEnAsuntos =
        actualizarColaboradoresEnAsuntos;
    window.actualizarSubtiposActuacion = actualizarSubtiposActuacion;
    window.poblarSelectClientes =
        poblarSelectClientes;
})();
