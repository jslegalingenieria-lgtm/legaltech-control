/**
 * JS LegalTech Control
 * Agenda jurídica sincronizada con Cloud Firestore.
 *
 * Requiere que firebase.js se cargue antes de agenda.js y exponga:
 * window.db
 */

(() => {
    "use strict";

    const COLECCION = "agenda";
    const CACHE = "js_legal_agenda";
    const INTERVALO_ALARMAS_MS = 30000;

    let agendaCache = [];
    let detenerEscucha = null;
    let intervaloAlarmas = null;
    let intervaloAudiencia = null;

    function obtenerDB() {
        if (!window.db) {
            throw new Error(
                "Firestore no está disponible. Revisa que firebase.js se cargue antes de agenda.js."
            );
        }

        return window.db;
    }

    function obtenerUsuarioSesion() {
        try {
            const sesion =
                localStorage.getItem("js_legal_session") ||
                sessionStorage.getItem("js_legal_usuario");

            return sesion ? JSON.parse(sesion) : null;
        } catch (error) {
            console.error("No se pudo leer la sesión:", error);
            return null;
        }
    }

    function obtenerAsuntos() {
        if (typeof window.obtenerAsuntos === "function") {
            return window.obtenerAsuntos();
        }

        try {
            return JSON.parse(
                localStorage.getItem("js_legal_asuntos")
            ) || [];
        } catch (error) {
            console.error("No se pudo leer la caché de asuntos:", error);
            return [];
        }
    }

    function normalizarEvento(id, datos = {}) {
        return {
            id: String(id),
            asuntoId: datos.asuntoId || "",
            tipo: datos.tipo || "",
            fecha: datos.fecha || "",
            hora: datos.hora || "",
            notas: datos.notas || datos.notes || "",
            abogadoAsignado: datos.abogadoAsignado || "",
            colaboradorIds: Array.isArray(datos.colaboradorIds) ? datos.colaboradorIds : [],
            notificado: Boolean(datos.notificado),
            fechaRegistro: datos.fechaRegistro || null,
            fechaActualizacion: datos.fechaActualizacion || null
        };
    }

    function guardarCache(lista) {
        agendaCache = Array.isArray(lista) ? lista : [];

        localStorage.setItem(
            CACHE,
            JSON.stringify(agendaCache)
        );
    }

    function obtenerAgenda() {
        if (agendaCache.length) {
            return [...agendaCache];
        }

        try {
            return JSON.parse(
                localStorage.getItem(CACHE)
            ) || [];
        } catch (error) {
            console.error("No se pudo leer la caché de agenda:", error);
            return [];
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

    function filtrarEventosPorUsuario(eventos) {
        const usuario = obtenerUsuarioSesion();

        if (!usuario) return [];

        if (["Superadministrador", "Administrador", "Auxiliar Jurídico"].includes(usuario.rol)) {
            return eventos;
        }

        if (usuario.rol === "Abogado") {
            const identificadores = [
                usuario.uid,
                usuario.authUid,
                usuario.id,
                usuario.usuario,
                usuario.correo
            ]
                .filter(Boolean)
                .map(valor => String(valor).trim().toLowerCase());

            return eventos.filter(evento => {
                const responsable = String(evento.abogadoAsignado || "")
                    .trim()
                    .toLowerCase();
                const colaboradores = Array.isArray(evento.colaboradorIds)
                    ? evento.colaboradorIds.map(valor => String(valor).trim().toLowerCase())
                    : [];

                return identificadores.includes(responsable) ||
                    colaboradores.some(valor => identificadores.includes(valor));
            });
        }

        if (usuario.rol === "Pasante") {
            // La consulta a Firestore ya se limita a los asuntoId autorizados.
            // No se vuelve a filtrar con la caché local, porque los asuntos y la
            // agenda pueden terminar de sincronizar en momentos distintos.
            return eventos;
        }

        const asuntos = obtenerAsuntos();

        return eventos.filter(evento => {
            const asunto = asuntos.find(
                item =>
                    String(item.id) === String(evento.asuntoId)
            );

            if (!asunto) return false;

            const usuarioId = String(
                usuario.id || usuario.usuario || ""
            ).toLowerCase();

            return JSON.stringify(asunto)
                .toLowerCase()
                .includes(usuarioId);
        });
    }


function obtenerUsuarioActivo() {
    try {
        const sesionRaw =
            sessionStorage.getItem("js_legal_usuario") ||
            localStorage.getItem("js_legal_session");

        return sesionRaw ? JSON.parse(sesionRaw) : null;
    } catch (error) {
        console.error("No fue posible leer la sesión activa:", error);
        return null;
    }
}

    
    function esperarUsuarioFirebase() {
        const auth = firebase.auth();

        if (auth.currentUser) {
            return Promise.resolve(auth.currentUser);
        }

        return new Promise(resolve => {
            const cancelar = auth.onAuthStateChanged(usuario => {
                cancelar();
                resolve(usuario || null);
            });
        });
    }

    function dividirEnBloques(lista, tamano = 10) {
        const bloques = [];
        for (let i = 0; i < lista.length; i += tamano) {
            bloques.push(lista.slice(i, i + tamano));
        }
        return bloques;
    }

    async function consultaAgendaPorRol() {
        const usuario = obtenerUsuarioActivo();
        const db = obtenerDB();
        const consulta = db.collection(COLECCION);

        if (usuario?.rol === "Abogado") {
            return {
                tipo: "simple",
                consultas: [
                    consulta.where(
                        "abogadoAsignado",
                        "==",
                        usuario.usuario || "__SIN_RESPONSABLE__"
                    )
                ]
            };
        }

        if (usuario?.rol === "Pasante") {
            const usuarioFirebase = await esperarUsuarioFirebase();
            const identificadores = [
                usuarioFirebase?.uid,
                usuario?.uid,
                usuario?.authUid,
                usuario?.id,
                usuario?.usuario,
                usuarioFirebase?.email,
                usuario?.correo
            ]
                .filter(Boolean)
                .map(valor => String(valor).trim())
                .filter((valor, indice, lista) => lista.indexOf(valor) === indice);

            if (!identificadores.length) {
                throw new Error("No fue posible identificar la sesión del pasante.");
            }

            // La agenda se consulta directamente por los identificadores guardados
            // en colaboradorIds. Esto coincide con las reglas de Firestore y evita
            // consultas indirectas por asuntoId que podían ser rechazadas.
            return {
                tipo: "multiple",
                consultas: identificadores.map(identificador =>
                    consulta.where("colaboradorIds", "array-contains", identificador)
                )
            };
        }

        return { tipo: "simple", consultas: [consulta] };
    }

    async function iniciarSincronizacionAgenda() {
        if (detenerEscucha) return;

        const usuarioActivo = obtenerUsuarioActivo();

        if (usuarioActivo?.rol === "Cliente") {
            console.info("Sincronización general de agenda omitida para el cliente.");
            return;
        }

        try {
            const resultado = await consultaAgendaPorRol();
            const consultas = resultado.consultas || [];

            if (!consultas.length) {
                guardarCache([]);
                cargarAgendaLista();
                detenerEscucha = () => {};
                return;
            }

            const resultadosPorConsulta = new Map();
            const cancelaciones = [];
            let errorMostrado = false;

            const actualizarVista = () => {
                const eventosPorId = new Map();
                resultadosPorConsulta.forEach(eventos => {
                    eventos.forEach(evento => eventosPorId.set(evento.id, evento));
                });

                const eventos = [...eventosPorId.values()].sort((a, b) =>
                    new Date(`${a.fecha}T${a.hora || "00:00"}`) -
                    new Date(`${b.fecha}T${b.hora || "00:00"}`)
                );

                guardarCache(eventos);
                cargarAgendaLista();
                window.dispatchEvent(new CustomEvent("agendaActualizada", { detail: eventos }));
            };

            consultas.forEach((consulta, indice) => {
                const cancelar = consulta.onSnapshot(
                    snapshot => {
                        resultadosPorConsulta.set(
                            indice,
                            snapshot.docs.map(doc => normalizarEvento(doc.id, doc.data()))
                        );
                        actualizarVista();
                    },
                    error => {
                        console.error("Error sincronizando agenda:", error);
                        if (!errorMostrado) {
                            errorMostrado = true;
                            mostrarErrorAgenda("No fue posible sincronizar la agenda con Firebase.");
                        }
                    }
                );
                cancelaciones.push(cancelar);
            });

            detenerEscucha = () => cancelaciones.forEach(cancelar => cancelar());
        } catch (error) {
            console.error("No fue posible iniciar la sincronización de agenda:", error);
            mostrarErrorAgenda(error.message || "No fue posible sincronizar la agenda con Firebase.");
        }
    }

    function obtenerSelectAsuntos() {
        return (
            document.getElementById("age-asunto-id") ||
            document.getElementById("agenda-asunto-id")
        );
    }

    function obtenerTextareaNotas() {
        return (
            document.getElementById("age-notes") ||
            document.getElementById("age-notas")
        );
    }

    function poblarSelectAsuntos() {
        const select = obtenerSelectAsuntos();
        if (!select) return;

        const usuario = obtenerUsuarioSesion();
        let asuntos = obtenerAsuntos();

        if (usuario?.rol === "Abogado") {
            const identificadores = [
                usuario.id,
                usuario.usuario,
                usuario.abogadoSupervisorUid,
                usuario.abogadoSupervisorUsuario
            ]
                .filter(Boolean)
                .map(valor =>
                    String(valor).trim().toLowerCase()
                );

            asuntos = asuntos.filter(asunto =>
                identificadores.includes(
                    String(asunto.abogadoAsignado || "")
                        .trim()
                        .toLowerCase()
                )
            );
        }

        select.innerHTML =
            '<option value="">-- Selecciona un expediente --</option>';

        if (!asuntos.length) {
            select.innerHTML =
                '<option value="">-- No tienes expedientes disponibles --</option>';
            return;
        }

        asuntos.forEach(asunto => {
            const option = document.createElement("option");

            option.value = asunto.id;
            option.textContent =
                `Exp. ${asunto.expediente || "S/N"} - ${asunto.materia || "Asunto"}`;

            select.appendChild(option);
        });
    }

    async function poblarSelectAbogados(valorSeleccionado = "") {
        const contenedor = document.getElementById("contenedor-age-abogado");
        const select = document.getElementById("age-abogado");

        if (!contenedor || !select) return;

        const usuario = obtenerUsuarioSesion();

        if (!["Superadministrador", "Administrador", "Auxiliar Jurídico"].includes(usuario?.rol)) {
            contenedor.style.display = "none";
            select.required = false;
            select.innerHTML = '<option value="">-- Selecciona un abogado --</option>';
            return;
        }

        contenedor.style.display = "block";
        select.required = true;
        select.innerHTML = '<option value="">-- Selecciona un abogado --</option>';

        try {
            const snapshot = await obtenerDB()
                .collection("personal")
                .get();

            const responsablesPorId = new Map();
            snapshot.docs
                .map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() }))
                .filter(item =>
                    ["Superadministrador", "Administrador", "Abogado"].includes(item.rol) &&
                    String(item.estado || "Activo").toLowerCase() === "activo"
                )
                .forEach(item => {
                    const id = String(item.usuario || item.uid || item.id || item.correo || "").trim();
                    if (id && !responsablesPorId.has(id)) responsablesPorId.set(id, item);
                });

            const responsables = [...responsablesPorId.values()].sort((a, b) =>
                String(a.nombre || a.usuario || "").localeCompare(
                    String(b.nombre || b.usuario || ""),
                    "es"
                )
            );

            responsables.forEach(responsable => {
                const option = document.createElement("option");
                option.value = responsable.usuario || responsable.uid || responsable.id;
                option.textContent = responsable.nombre || responsable.usuario || responsable.correo || "Responsable";
                select.appendChild(option);
            });

            if (valorSeleccionado) {
                select.value = valorSeleccionado;
            }
        } catch (error) {
            console.error("No se pudo cargar la lista de abogados:", error);
            select.innerHTML = '<option value="">No fue posible cargar abogados</option>';
        }
    }

    async function abrirModalAgenda() {
        const modal = document.getElementById("modal-agenda");
        const formulario = document.getElementById("form-agenda");
        const titulo = document.getElementById("agenda-modal-titulo");
        const id = document.getElementById("agenda-id");

        if (!modal || !formulario) return;

        formulario.reset();
        if (id) id.value = "";
        if (titulo) titulo.innerText = "Agendar Evento Procesal";

        poblarSelectAsuntos();
        await poblarSelectAbogados();
        modal.style.display = "block";
    }

    function cerrarModalAgenda() {
        const modal = document.getElementById("modal-agenda");
        if (modal) modal.style.display = "none";
    }

    async function guardarEventoAgenda(event) {
        event.preventDefault();

        const id =
            document.getElementById("agenda-id")?.value.trim() || "";

        const asuntoId = obtenerSelectAsuntos()?.value || "";
        const tipo =
            document.getElementById("age-tipo")?.value || "";
        const fecha =
            document.getElementById("age-fecha")?.value || "";
        const hora =
            document.getElementById("age-hora")?.value || "";
        const notas =
            obtenerTextareaNotas()?.value.trim() || "";

        if (!asuntoId || !tipo || !fecha || !hora) {
            alert(
                "Selecciona expediente, tipo, fecha y hora."
            );
            return;
        }

        const usuario = obtenerUsuarioSesion();
        const abogadoSeleccionado =
            document.getElementById("age-abogado")?.value || "";

        if (["Superadministrador", "Administrador", "Auxiliar Jurídico"].includes(usuario?.rol) && !abogadoSeleccionado) {
            alert("Selecciona el abogado responsable del evento.");
            return;
        }

        const abogadoAsignado =
            ["Superadministrador", "Administrador", "Auxiliar Jurídico"].includes(usuario?.rol)
                ? abogadoSeleccionado
                : (usuario?.usuario || usuario?.id || "");

        const asuntoRelacionado = obtenerAsuntos().find(
            asunto => String(asunto.id) === String(asuntoId)
        );
        const colaboradorIds = Array.isArray(asuntoRelacionado?.colaboradorIds)
            ? asuntoRelacionado.colaboradorIds
            : [];

        try {
            const db = obtenerDB();

            if (id) {
                const eventoAnterior = obtenerAgenda().find(
                    item => String(item.id) === String(id)
                );

                const cambioFechaHora =
                    !eventoAnterior ||
                    eventoAnterior.fecha !== fecha ||
                    eventoAnterior.hora !== hora;

                await db
                    .collection(COLECCION)
                    .doc(id)
                    .set({
                        asuntoId,
                        tipo,
                        fecha,
                        hora,
                        notas,
                        abogadoAsignado,
                        colaboradorIds,
                        notificado: cambioFechaHora
                            ? false
                            : Boolean(eventoAnterior?.notificado),
                        fechaActualizacion:
                            firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                alert("Evento actualizado correctamente.");
            } else {
                await db
                    .collection(COLECCION)
                    .add({
                        asuntoId,
                        tipo,
                        fecha,
                        hora,
                        notas,
                        abogadoAsignado,
                        colaboradorIds,
                        notificado: false,
                        fechaRegistro:
                            firebase.firestore.FieldValue.serverTimestamp(),
                        fechaActualizacion:
                            firebase.firestore.FieldValue.serverTimestamp()
                    });

                alert("Evento guardado correctamente.");
            }

            cerrarModalAgenda();
        } catch (error) {
            console.error("Error guardando evento:", error);
            alert(
                "No fue posible guardar el evento en Firebase."
            );
        }
    }

    function cargarAgendaLista() {
        const contenedor =
            document.getElementById("lista-agenda-contenedor");

        if (!contenedor) return;

        const asuntos = obtenerAsuntos();
        const eventos = filtrarEventosPorUsuario(
            obtenerAgenda()
        );

        contenedor.innerHTML = "";

        if (!eventos.length) {
            contenedor.innerHTML = `
                <div style="
                    text-align:center;
                    padding:3rem;
                    color:var(--text-muted);
                    background:white;
                    border:1px dashed var(--border-color);
                    border-radius:8px;
                ">
                    No hay audiencias ni vencimientos programados.
                </div>
            `;

            actualizarContadoresDashboard(0);
            return;
        }

        eventos.forEach(evento => {
            const asunto = asuntos.find(
                item =>
                    String(item.id) === String(evento.asuntoId)
            );

            const expedienteTexto = asunto
                ? `Expediente: ${asunto.expediente || "S/N"} (${asunto.materia || "General"})`
                : "Asunto no especificado";

            let indicador = "#3b82f6";

            if (evento.tipo === "Término Judicial") {
                indicador = "#ef4444";
            } else if (evento.tipo === "Diligencia") {
                indicador = "#f59e0b";
            }

            const fechaLegible = new Date(
                `${evento.fecha}T00:00:00`
            ).toLocaleDateString("es-MX", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            });

            const tarjeta = document.createElement("div");

            tarjeta.style.cssText = `
                background:#ffffff;
                border-left:5px solid ${indicador};
                padding:1.2rem;
                border-radius:0 8px 8px 0;
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:1rem;
                border:1px solid var(--border-color);
                gap:1rem;
            `;

            tarjeta.innerHTML = `
                <div>
                    <div style="
                        font-size:.85rem;
                        font-weight:700;
                        color:${indicador};
                        text-transform:uppercase;
                        margin-bottom:.3rem;
                    ">
                        ${escaparHTML(evento.tipo)}
                    </div>

                    <h4 style="
                        color:var(--primary-color);
                        margin-bottom:.2rem;
                    ">
                        ${escaparHTML(expedienteTexto)}
                    </h4>

                    <p style="
                        font-size:.9rem;
                        color:var(--text-main);
                        margin-bottom:.4rem;
                    ">
                        ${escaparHTML(evento.notas || "Sin notas.")}
                    </p>

                    <div style="
                        font-size:.85rem;
                        color:var(--text-muted);
                    ">
                        📅 ${escaparHTML(fechaLegible)}
                        a las 🕒 ${escaparHTML(evento.hora)} hrs
                    </div>
                </div>

                <div style="display:flex;gap:.5rem;">
                    <button
                        type="button"
                        onclick="editarEvento('${evento.id}')"
                        style="
                            background:#f1f5f9;
                            border:none;
                            padding:.5rem .8rem;
                            border-radius:6px;
                            cursor:pointer;
                        ">
                        ✏️
                    </button>

                    ${evento.tipo === "Audiencia" ? `

                  <button
                   type="button"
                    onclick="abrirExpedienteAgenda('${evento.asuntoId}')"
                  title="Abrir expediente"
                   style="
        background:#eff6ff;
        border:none;
        padding:.5rem .8rem;
        border-radius:6px;
        cursor:pointer;
        color:#1d4ed8;
                    ">
                  📂
             </button>


                    <button
        type="button"
        onclick="iniciarAudienciaAgenda('${evento.asuntoId}', '${evento.id}')"
        title="Iniciar audiencia"
        style="
            background:#dcfce7;
            border:none;
            padding:.5rem .8rem;
            border-radius:6px;
            cursor:pointer;
            color:#166534;
                     ">
                   ▶️
                   </button>
                   ` : ""}


                    <button
                        type="button"
                        onclick="eliminarEvento('${evento.id}')"
                        style="
                            background:#f1f5f9;
                            border:none;
                            padding:.5rem .8rem;
                            border-radius:6px;
                            cursor:pointer;
                            color:#ef4444;
                        ">
                        🗑️
                    </button>
                </div>
            `;

            contenedor.appendChild(tarjeta);
        });

        actualizarContadoresDashboard(eventos.length);
    }



function abrirExpedienteAgenda(asuntoId) {

    if (!asuntoId) {
        alert("Este evento no tiene un expediente asociado.");
        return;
    }

    if (typeof window.switchTab !== "function") {
        alert("No fue posible abrir el módulo de asuntos.");
        return;
    }

    window.switchTab("asuntos");

    setTimeout(() => {

        const fila = document.querySelector(
            `tr[data-id="${asuntoId}"]`
        );

        if (!fila) {
            alert("No fue posible localizar el expediente.");
            return;
        }

        fila.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        fila.classList.add("expediente-destacado");

        setTimeout(() => {
            fila.classList.remove("expediente-destacado");
        }, 4000);

    }, 400);
}


function iniciarAudienciaAgenda(asuntoId, eventoId) {

    if (!asuntoId) {
        alert("Esta audiencia no tiene un expediente asociado.");
        return;
    }

    const asunto = obtenerAsuntos().find(
        item => String(item.id) === String(asuntoId)
    );

    if (!asunto) {
        alert("No fue posible localizar el expediente de la audiencia.");
        return;
    }

    const evento = obtenerAgenda().find(
        item => String(item.id) === String(eventoId)
    );

    if (!evento) {
        alert("No fue posible localizar el evento de agenda.");
        return;
    }

    if (typeof window.switchTab !== "function") {
        alert("No fue posible abrir el módulo de asuntos.");
        return;
    }

    if (typeof window.abrirBitacoraAsunto !== "function") {
        alert("El módulo de bitácora todavía no está disponible.");
        return;
    }

    const confirmarInicio = confirm(
        `¿Deseas iniciar esta audiencia?\n\n` +
        `Expediente: ${asunto.expediente || "S/N"}\n` +
        `Cliente: ${asunto.cliente || "Sin cliente"}\n` +
        `Hora programada: ${evento.hora || "Sin hora"}`
    );

    if (!confirmarInicio) {
        return;
    }

    sessionStorage.setItem(
        "js_legal_audiencia_activa",
        JSON.stringify({
            eventoId: String(eventoId),
            asuntoId: String(asuntoId),
            expediente: asunto.expediente || "",
            cliente: asunto.cliente || "",
            juzgado: asunto.juzgado || "",
            tipo: evento.tipo || "Audiencia",
            notas: evento.notas || "",
            fechaProgramada: evento.fecha || "",
            horaProgramada: evento.hora || "",
            inicio: new Date().toISOString()
        })
    );

    window.switchTab("asuntos");

    setTimeout(() => {

        const fila = document.querySelector(
            `tr[data-id="${asuntoId}"]`
        );

        if (fila) {
            fila.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            fila.classList.add("expediente-destacado");

            setTimeout(() => {
                fila.classList.remove("expediente-destacado");
            }, 3000);
        }

        window.abrirBitacoraAsunto(asuntoId);

        setTimeout(() => {

            const descripcion =
                document.getElementById("act-descripcion");

            if (descripcion) {
                descripcion.value =
                    `Audiencia celebrada. ${evento.notas || ""}`.trim();

                descripcion.focus();
            }

            const fecha =
                document.getElementById("act-fecha");

            if (fecha && evento.fecha) {
                fecha.value = evento.fecha;
            }

            mostrarModoAudiencia();

        }, 250);

    }, 400);
}

    function obtenerAudienciaActiva() {
        try {
            const datos = sessionStorage.getItem("js_legal_audiencia_activa");
            return datos ? JSON.parse(datos) : null;
        } catch (error) {
            console.error("No se pudo leer la audiencia activa:", error);
            return null;
        }
    }

    function formatearDuracionAudiencia(milisegundos) {
        const totalSegundos = Math.max(0, Math.floor(milisegundos / 1000));
        const horas = String(Math.floor(totalSegundos / 3600)).padStart(2, "0");
        const minutos = String(Math.floor((totalSegundos % 3600) / 60)).padStart(2, "0");
        const segundos = String(totalSegundos % 60).padStart(2, "0");
        return `${horas}:${minutos}:${segundos}`;
    }

    function actualizarCronometroAudiencia() {
        const audiencia = obtenerAudienciaActiva();
        const cronometro = document.getElementById("audiencia-cronometro");
        if (!audiencia || !cronometro) {
            if (intervaloAudiencia) {
                clearInterval(intervaloAudiencia);
                intervaloAudiencia = null;
            }
            return;
        }
        const inicio = new Date(audiencia.inicio).getTime();
        if (Number.isNaN(inicio)) {
            cronometro.textContent = "00:00:00";
            return;
        }
        cronometro.textContent = formatearDuracionAudiencia(Date.now() - inicio);
    }

    function mostrarModoAudiencia() {
        const audiencia = obtenerAudienciaActiva();
        const modal = document.getElementById("modal-bitacora");
        const formulario = document.getElementById("form-actuacion");
        if (!audiencia || !modal || !formulario) return;

        let panel = document.getElementById("panel-audiencia-en-curso");
        if (!panel) {
            panel = document.createElement("section");
            panel.id = "panel-audiencia-en-curso";
            panel.className = "panel-audiencia-en-curso";
            formulario.parentElement.insertBefore(panel, formulario);
        }

        const inicio = new Date(audiencia.inicio);
        const horaInicio = Number.isNaN(inicio.getTime())
            ? "Sin registro"
            : inicio.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

        panel.innerHTML = `
            <div class="audiencia-encabezado">
                <div>
                    <span class="audiencia-etiqueta">⚖️ Audiencia en curso</span>
                    <h4>Expediente: ${escaparHTML(audiencia.expediente || "S/N")}</h4>
                </div>
                <div id="audiencia-cronometro" class="audiencia-cronometro">00:00:00</div>
            </div>
            <div class="audiencia-datos">
                <div><span>Cliente</span><strong>${escaparHTML(audiencia.cliente || "Sin cliente")}</strong></div>
                <div><span>Juzgado</span><strong>${escaparHTML(audiencia.juzgado || "Sin juzgado")}</strong></div>
                <div><span>Inicio</span><strong>${escaparHTML(horaInicio)}</strong></div>
            </div>
            <div class="audiencia-acciones">
                <button type="button" class="btn-finalizar-audiencia" onclick="finalizarAudienciaAgenda()">⏹ Finalizar audiencia</button>
            </div>`;

        actualizarCronometroAudiencia();
        if (intervaloAudiencia) clearInterval(intervaloAudiencia);
        intervaloAudiencia = setInterval(actualizarCronometroAudiencia, 1000);
    }

    function finalizarAudienciaAgenda() {
        const audiencia = obtenerAudienciaActiva();
        if (!audiencia) {
            alert("No hay una audiencia activa.");
            return;
        }
        if (!confirm("¿Deseas finalizar la audiencia en curso?")) return;

        const inicio = new Date(audiencia.inicio).getTime();
        const fin = Date.now();
        const duracion = Number.isNaN(inicio) ? "00:00:00" : formatearDuracionAudiencia(fin - inicio);
        const descripcion = document.getElementById("act-descripcion");
        if (descripcion) {
            const textoActual = descripcion.value.trim();
            const cierre = `Audiencia finalizada. Duración: ${duracion}.`;
            descripcion.value = textoActual ? `${textoActual}\n\n${cierre}` : cierre;
            descripcion.focus();
        }

        sessionStorage.removeItem("js_legal_audiencia_activa");
        if (intervaloAudiencia) {
            clearInterval(intervaloAudiencia);
            intervaloAudiencia = null;
        }
        document.getElementById("panel-audiencia-en-curso")?.remove();
        alert(`Audiencia finalizada.\n\nDuración: ${duracion}\n\nRevisa la descripción y agrega la actuación al historial.`);
    }

    async function editarEvento(id) {
        const evento = obtenerAgenda().find(
            item => String(item.id) === String(id)
        );

        if (!evento) {
            alert("No se encontró el evento.");
            return;
        }

        await abrirModalAgenda();

        const titulo =
            document.getElementById("agenda-modal-titulo");

        if (titulo) titulo.innerText = "Modificar Evento";

        document.getElementById("agenda-id").value = evento.id;
        obtenerSelectAsuntos().value = evento.asuntoId || "";
        document.getElementById("age-tipo").value = evento.tipo || "";
        document.getElementById("age-fecha").value = evento.fecha || "";
        document.getElementById("age-hora").value = evento.hora || "";

        const notas = obtenerTextareaNotas();
        if (notas) notas.value = evento.notas || "";

        const abogado = document.getElementById("age-abogado");
        if (abogado) {
            abogado.value = evento.abogadoAsignado || "";
        }
    }

    async function eliminarEvento(id) {
        if (
            !confirm(
                "¿Deseas eliminar este evento de la agenda?"
            )
        ) {
            return;
        }

        try {
            await obtenerDB()
                .collection(COLECCION)
                .doc(String(id))
                .delete();

            alert("Evento eliminado.");
        } catch (error) {
            console.error("Error eliminando evento:", error);
            alert("No fue posible eliminar el evento.");
        }
    }

    function actualizarContadoresDashboard(conteoReal) {
        const badge =
            document.getElementById("count-audiencias");

        if (badge) {
            badge.innerText = String(conteoReal);
        }
    }

    function mostrarErrorAgenda(mensaje) {
        const contenedor =
            document.getElementById("lista-agenda-contenedor");

        if (contenedor) {
            contenedor.innerHTML = `
                <div style="
                    color:#b91c1c;
                    text-align:center;
                    padding:2rem;
                ">
                    ${escaparHTML(mensaje)}
                </div>
            `;
        }
    }

    async function verificarAlarmasAgenda() {
        const usuario = obtenerUsuarioSesion();
        if (!usuario) return;

        const ahora = new Date();
        const fechaActual =
            `${ahora.getFullYear()}-` +
            `${String(ahora.getMonth() + 1).padStart(2, "0")}-` +
            `${String(ahora.getDate()).padStart(2, "0")}`;

        const horaActual =
            `${String(ahora.getHours()).padStart(2, "0")}:` +
            `${String(ahora.getMinutes()).padStart(2, "0")}`;

        const eventos = filtrarEventosPorUsuario(
            obtenerAgenda()
        ).filter(evento =>
            !evento.notificado &&
            evento.fecha === fechaActual &&
            evento.hora === horaActual
        );

        for (const evento of eventos) {
            const asuntos = obtenerAsuntos();
            const asunto = asuntos.find(
                item =>
                    String(item.id) === String(evento.asuntoId)
            );

            evento.expedienteContexto = asunto
                ? `Exp. ${asunto.expediente || "S/N"} (${asunto.materia || "General"})`
                : "Expediente no especificado";

            dispararAlarmaAccion(evento);

            try {
                await obtenerDB()
                    .collection(COLECCION)
                    .doc(evento.id)
                    .update({
                        notificado: true,
                        fechaActualizacion:
                            firebase.firestore.FieldValue.serverTimestamp()
                    });
            } catch (error) {
                console.error(
                    "No se pudo marcar la alarma como notificada:",
                    error
                );
            }
        }
    }

    function dispararAlarmaAccion(evento) {
        try {
            const AudioContexto =
                window.AudioContext ||
                window.webkitAudioContext;

            if (AudioContexto) {
                const audioCtx = new AudioContexto();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(
                    880,
                    audioCtx.currentTime
                );

                gainNode.gain.setValueAtTime(
                    0.4,
                    audioCtx.currentTime
                );

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();

                setTimeout(() => {
                    oscillator.stop();
                    audioCtx.close();
                }, 300);
            }
        } catch (error) {
            console.warn(
                "El navegador bloqueó el sonido de la alarma:",
                error
            );
        }

        alert(
            `⏰ RECORDATORIO DE AGENDA\n\n` +
            `Tipo: ${evento.tipo}\n` +
            `${evento.expedienteContexto || ""}\n\n` +
            `Detalles: ${evento.notas || "Sin notas."}`
        );
    }

    document.addEventListener("DOMContentLoaded", () => {
        document
            .getElementById("form-agenda")
            ?.addEventListener(
                "submit",
                guardarEventoAgenda
            );

        poblarSelectAsuntos();
        iniciarSincronizacionAgenda();
        cargarAgendaLista();
        verificarAlarmasAgenda();

        if (obtenerAudienciaActiva()) {
            mostrarModoAudiencia();
        }

        if (!intervaloAlarmas) {
            intervaloAlarmas = setInterval(
                verificarAlarmasAgenda,
                INTERVALO_ALARMAS_MS
            );
        }
    });

    window.obtenerAgenda = obtenerAgenda;
    window.abrirModalAgenda = abrirModalAgenda;
    window.cerrarModalAgenda = cerrarModalAgenda;
    window.poblarSelectAsuntos = poblarSelectAsuntos;
    window.poblarSelectAbogados = poblarSelectAbogados;
    window.guardarEventoAgenda = guardarEventoAgenda;
    window.cargarAgendaLista = cargarAgendaLista;
    window.editarEvento = editarEvento;
    window.eliminarEvento = eliminarEvento;
    window.abrirExpedienteAgenda = abrirExpedienteAgenda;
    window.iniciarAudienciaAgenda = iniciarAudienciaAgenda;
    window.mostrarModoAudiencia = mostrarModoAudiencia;
    window.finalizarAudienciaAgenda = finalizarAudienciaAgenda;
    window.verificarAlarmasAgenda = verificarAlarmasAgenda;
})();
