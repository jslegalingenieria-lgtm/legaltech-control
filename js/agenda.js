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

        if (usuario.rol === "Administrador") {
            return eventos;
        }

        if (usuario.rol === "Abogado") {
            const identificadores = [
                usuario.id,
                usuario.usuario
            ]
                .filter(Boolean)
                .map(valor =>
                    String(valor).trim().toLowerCase()
                );

            return eventos.filter(evento =>
                identificadores.includes(
                    String(evento.abogadoAsignado || "")
                        .trim()
                        .toLowerCase()
                )
            );
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

    function iniciarSincronizacionAgenda() {
        if (detenerEscucha) return;

        try {
            detenerEscucha = obtenerDB()
                .collection(COLECCION)
                .onSnapshot(snapshot => {
                    const eventos = snapshot.docs
                        .map(doc =>
                            normalizarEvento(doc.id, doc.data())
                        )
                        .sort((a, b) =>
                            new Date(`${a.fecha}T${a.hora || "00:00"}`) -
                            new Date(`${b.fecha}T${b.hora || "00:00"}`)
                        );

                    guardarCache(eventos);
                    cargarAgendaLista();

                    window.dispatchEvent(
                        new CustomEvent("agendaActualizada", {
                            detail: eventos
                        })
                    );
                }, error => {
                    console.error(
                        "Error sincronizando agenda:",
                        error
                    );

                    mostrarErrorAgenda(
                        "No fue posible sincronizar la agenda con Firebase."
                    );
                });
        } catch (error) {
            console.error(error);
            mostrarErrorAgenda(error.message);
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
                usuario.usuario
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

    function abrirModalAgenda() {
        const modal = document.getElementById("modal-agenda");
        const formulario = document.getElementById("form-agenda");
        const titulo = document.getElementById("agenda-modal-titulo");
        const id = document.getElementById("agenda-id");

        if (!modal || !formulario) return;

        formulario.reset();
        if (id) id.value = "";
        if (titulo) titulo.innerText = "Agendar Evento Procesal";

        poblarSelectAsuntos();
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
                        abogadoAsignado:
                            eventoAnterior?.abogadoAsignado ||
                            usuario?.usuario ||
                            usuario?.id ||
                            "",
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
                        abogadoAsignado:
                            usuario?.usuario ||
                            usuario?.id ||
                            "",
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

    function editarEvento(id) {
        const evento = obtenerAgenda().find(
            item => String(item.id) === String(id)
        );

        if (!evento) {
            alert("No se encontró el evento.");
            return;
        }

        abrirModalAgenda();

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
    window.guardarEventoAgenda = guardarEventoAgenda;
    window.cargarAgendaLista = cargarAgendaLista;
    window.editarEvento = editarEvento;
    window.eliminarEvento = eliminarEvento;
    window.verificarAlarmasAgenda = verificarAlarmasAgenda;
})();
