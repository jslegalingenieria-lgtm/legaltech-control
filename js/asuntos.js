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
            estado: datos.estado || "En Curso",
            resumen: datos.resumen || "",
            abogadoAsignado: datos.abogadoAsignado || "",
            fechaRegistro: datos.fechaRegistro || null,
            fechaActualizacion: datos.fechaActualizacion || null,
            actuaciones: Array.isArray(datos.actuaciones)
                ? datos.actuaciones
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

    function iniciarSincronizacionAsuntos() {
        if (detenerEscuchaAsuntos) return;

        try {
            const db = obtenerDB();

            detenerEscuchaAsuntos = db
                .collection(COLECCION_ASUNTOS)
                .orderBy("fechaRegistro", "desc")
                .onSnapshot(snapshot => {
                    const lista = snapshot.docs.map(doc =>
                        normalizarAsunto(doc.id, doc.data())
                    );

                    guardarCacheLocal(lista);
                    cargarAsuntosTabla();

                    if (
                        typeof window.cargarAsuntosConsultaCiudadana ===
                        "function"
                    ) {
                        window.cargarAsuntosConsultaCiudadana();
                    }

                    if (
                        typeof window.actualizarContadoresReales ===
                        "function"
                    ) {
                        window.actualizarContadoresReales();
                    }

                    window.dispatchEvent(
                        new CustomEvent("asuntosActualizados", {
                            detail: lista
                        })
                    );

                    if (asuntoHistorialIdSeleccionado) {
                        const asuntoActual = lista.find(
                            asunto =>
                                String(asunto.id) ===
                                String(asuntoHistorialIdSeleccionado)
                        );

                        if (asuntoActual) {
                            cargarHistorialActuacionesLista(
                                asuntoActual
                            );
                        }
                    }
                }, error => {
                    console.error(
                        "Error sincronizando asuntos:",
                        error
                    );

                    alert(
                        "No fue posible sincronizar los asuntos con Firebase."
                    );
                });

        } catch (error) {
            console.error(error);
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

        const abogados = lista.filter(
            empleado =>
                empleado.rol === "Abogado" ||
                empleado.rol === "Administrador"
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

    function abrirModalAsunto() {
        const modal = document.getElementById("modal-asunto");
        const formulario =
            document.getElementById("form-asunto");

        if (!modal || !formulario) return;

        formulario.reset();

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

        poblarSelectClientes();
        cargarAbogadosEnAsuntos();

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
                    ?.value.trim() || "";

            const juzgado =
                document.getElementById("asu-juzgado")
                    ?.value.trim() || "";

            const accion =
                document.getElementById("asu-accion")
                    ?.value.trim() || "";

            const estado =
                document.getElementById("asu-estado")
                    ?.value || "En Curso";

            const resumen =
                document.getElementById("asu-resumen")
                    ?.value.trim() || "";

            const selectAbogado =
                obtenerSelectAbogadoElemento();

            const abogadoAsignado =
                selectAbogado?.value || "";

            if (
                !clienteId ||
                !materia ||
                !expediente ||
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
                resumen,
                abogadoAsignado,
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

                if (resultadoCorreo?.ok) {
                    alert(
                        "Expediente registrado correctamente.\n\n" +
                        "La alerta interna y el correo fueron enviados al abogado asignado."
                    );
                } else if (abogadoAsignado) {
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

    function editarAsunto(id) {
        const asunto = obtenerAsuntos().find(
            item =>
                String(item.id) === String(id)
        );

        if (!asunto) {
            alert("No se encontró el expediente.");
            return;
        }

        abrirModalAsunto();

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
            asunto.estado || "En Curso";

        document.getElementById("asu-resumen").value =
            asunto.resumen || "";

        const selectAbogado =
            obtenerSelectAbogadoElemento();

        if (selectAbogado) {
            selectAbogado.value =
                asunto.abogadoAsignado || "";
        }
    }

    async function eliminarAsunto(id) {
        if (
            !confirm(
                "¿Seguro que deseas eliminar este expediente?"
            )
        ) {
            return;
        }

        try {
            const db = obtenerDB();

            await db
                .collection(COLECCION_ASUNTOS)
                .doc(String(id))
                .delete();

            alert("Expediente eliminado.");
        } catch (error) {
            console.error(
                "Error eliminando asunto:",
                error
            );

            alert(
                "No fue posible eliminar el expediente."
            );
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

        if (
            usuarioActivo &&
            usuarioActivo.rol === "Abogado"
        ) {
            asuntos = asuntos.filter(
                asunto =>
                    String(
                        asunto.abogadoAsignado || ""
                    ) ===
                    String(usuarioActivo.usuario || "")
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

            fila.innerHTML = `
                <td>${escaparHTML(
                    asunto.expediente || "S/N"
                )}</td>

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
                        onclick="eliminarAsunto('${asunto.id}')"
                        style="color:#ef4444;background:none;border:none;cursor:pointer;">
                        ❌
                    </button>
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
            formulario.reset();
        }

        cargarHistorialActuacionesLista(asunto);
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

    function cargarHistorialActuacionesLista(asunto) {
        const contenedor =
            document.getElementById(
                "bitacora-lista-historico"
            );

        if (!contenedor) return;

        contenedor.innerHTML = "";

        const actuaciones =
            Array.isArray(asunto.actuaciones)
                ? asunto.actuaciones
                : [];

        if (!actuaciones.length) {
            contenedor.innerHTML = `
                <p style="
                    color:#64748b;
                    text-align:center;
                    padding:1rem;
                ">
                    No hay actuaciones registradas.
                </p>
            `;
            return;
        }

        actuaciones
            .slice()
            .reverse()
            .forEach((actuacion, indiceInvertido) => {
                const indiceReal =
                    actuaciones.length -
                    1 -
                    indiceInvertido;

                const elemento =
                    document.createElement("div");

                elemento.style.cssText = `
                    background:#f8fafc;
                    border-left:4px solid #8b5cf6;
                    padding:.8rem;
                    margin-bottom:.5rem;
                    border-radius:0 6px 6px 0;
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                `;

                elemento.innerHTML = `
                    <div style="flex-grow:1;margin-right:10px;">
                        <span style="
                            font-size:.8rem;
                            font-weight:bold;
                            color:#64748b;
                            display:block;
                        ">
                            📅 ${escaparHTML(
                                actuacion.fecha || ""
                            )}
                        </span>

                        <p style="
                            margin:.2rem 0 0;
                            font-size:.9rem;
                            color:#1e293b;
                            line-height:1.4;
                        ">
                            ${escaparHTML(
                                actuacion.descripcion || ""
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        onclick="eliminarActuacion(${indiceReal})"
                        style="
                            background:none;
                            border:none;
                            color:#ef4444;
                            cursor:pointer;
                            font-size:.85rem;
                        ">
                        ❌
                    </button>
                `;

                contenedor.appendChild(elemento);
            });
    }

    async function guardarActuacion(event) {
        event.preventDefault();

        if (!asuntoHistorialIdSeleccionado) {
            alert("No hay expediente seleccionado.");
            return;
        }

        const descripcion =
            document.getElementById(
                "act-descripcion"
            )?.value.trim() || "";

        const fechaInput =
            document.getElementById("act-fecha")
                ?.value || "";

        if (!descripcion) {
            alert(
                "Escribe la descripción de la actuación."
            );
            return;
        }

        const fecha = fechaInput
            ? new Date(
                  `${fechaInput}T00:00:00`
              ).toLocaleDateString("es-MX")
            : new Date().toLocaleDateString(
                  "es-MX"
              );

        const asunto = obtenerAsuntos().find(
            item =>
                String(item.id) ===
                String(asuntoHistorialIdSeleccionado)
        );

        if (!asunto) {
            alert("No se encontró el expediente.");
            return;
        }

        const actuaciones = Array.isArray(
            asunto.actuaciones
        )
            ? [...asunto.actuaciones]
            : [];

        actuaciones.push({
            fecha,
            descripcion,
            creadoEn: new Date().toISOString()
        });

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
                    resumen: descripcion,
                    fechaActualizacion:
                        firebase.firestore.FieldValue.serverTimestamp()
                });

            document
                .getElementById("form-actuacion")
                ?.reset();

        } catch (error) {
            console.error(
                "Error guardando actuación:",
                error
            );

            alert(
                "No fue posible guardar la actuación."
            );
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

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            document
                .getElementById("form-asunto")
                ?.addEventListener(
                    "submit",
                    guardarAsunto
                );

            document
                .getElementById("form-actuacion")
                ?.addEventListener(
                    "submit",
                    guardarActuacion
                );

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
    window.eliminarActuacion =
        eliminarActuacion;
    window.cargarHistorialActuacionesLista =
        cargarHistorialActuacionesLista;
    window.cargarAbogadosEnAsuntos =
        cargarAbogadosEnAsuntos;
    window.poblarSelectClientes =
        poblarSelectClientes;
})();
