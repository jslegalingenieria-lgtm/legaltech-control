/**
 * JS LegalTech Control
 * Aviso sencillo de nuevo asunto para el abogado asignado.
 */
(() => {
    "use strict";

    const COLECCION_ALERTAS = "alertas";
    let detenerEscucha = null;

    function obtenerSesion() {
        try {
            const datos =
                sessionStorage.getItem("js_legal_usuario") ||
                localStorage.getItem("js_legal_session");

            return datos ? JSON.parse(datos) : null;
        } catch (error) {
            console.error("No se pudo leer la sesión para las alertas:", error);
            return null;
        }
    }

    function reproducirAviso() {
        try {
            const AudioContexto =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContexto) return;

            const contexto = new AudioContexto();
            const oscilador = contexto.createOscillator();
            const volumen = contexto.createGain();

            oscilador.type = "sine";
            oscilador.frequency.setValueAtTime(880, contexto.currentTime);
            volumen.gain.setValueAtTime(0.12, contexto.currentTime);
            volumen.gain.exponentialRampToValueAtTime(
                0.001,
                contexto.currentTime + 0.45
            );

            oscilador.connect(volumen);
            volumen.connect(contexto.destination);
            oscilador.start();
            oscilador.stop(contexto.currentTime + 0.45);
        } catch (error) {
            console.warn("El navegador bloqueó el sonido de la alerta:", error);
        }
    }

    function mostrarAviso(alerta) {
        document.getElementById("aviso-nuevo-asunto")?.remove();

        const contenedor = document.createElement("div");
        contenedor.id = "aviso-nuevo-asunto";
        contenedor.setAttribute("role", "alert");
        contenedor.style.cssText = `
            position:fixed;
            top:20px;
            right:20px;
            z-index:99999;
            width:min(360px, calc(100vw - 40px));
            background:#ffffff;
            border-left:5px solid #2563eb;
            border-radius:10px;
            box-shadow:0 12px 30px rgba(15, 23, 42, .22);
            padding:16px 18px;
            color:#1e293b;
            font-family:inherit;
        `;

        contenedor.innerHTML = `
            <button type="button" aria-label="Cerrar"
                style="float:right;border:0;background:none;font-size:20px;cursor:pointer;color:#64748b;">
                &times;
            </button>
            <strong style="display:block;margin-bottom:7px;color:#1d4ed8;">
                ⚖️ Nuevo asunto asignado
            </strong>
            <div style="font-size:14px;line-height:1.5;">
                <b>Expediente:</b> ${escaparHTML(alerta.expediente || "Sin número")}<br>
                <b>Cliente:</b> ${escaparHTML(alerta.cliente || "Sin especificar")}
            </div>
        `;

        contenedor.querySelector("button")?.addEventListener("click", () => {
            contenedor.remove();
        });

        document.body.appendChild(contenedor);
        reproducirAviso();

        window.setTimeout(() => contenedor.remove(), 8000);
    }

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function crearAlertaNuevoAsunto({
        usuario,
        abogadoNombre = "",
        asuntoId = "",
        expediente = "",
        cliente = ""
    }) {
        if (!window.db || !usuario) return;

        await window.db.collection(COLECCION_ALERTAS).add({
            tipo: "nuevo_asunto",
            usuario: String(usuario),
            abogadoNombre,
            asuntoId: String(asuntoId || ""),
            expediente,
            cliente,
            leida: false,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    function iniciarNotificaciones() {
        const sesion = obtenerSesion();

        if (
            !window.db ||
            !sesion ||
            sesion.rol !== "Abogado" ||
            !sesion.usuario ||
            detenerEscucha
        ) {
            return;
        }

        detenerEscucha = window.db
            .collection(COLECCION_ALERTAS)
            .where("usuario", "==", String(sesion.usuario))
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(cambio => {
                    if (cambio.type !== "added") return;

                    const alerta = cambio.doc.data();
                    if ((alerta.tipo || "nuevo_asunto") !== "nuevo_asunto") return;
                    if (alerta.leida === true) return;

                    const clave = `alerta_mostrada_${cambio.doc.id}`;
                    if (sessionStorage.getItem(clave)) return;

                    sessionStorage.setItem(clave, "1");
                    mostrarAviso(alerta);

                    cambio.doc.ref.update({ leida: true }).catch(error => {
                        console.error("No se pudo marcar la alerta como leída:", error);
                    });
                });
            }, error => {
                console.error("No se pudieron escuchar las alertas:", error);
            });
    }

    document.addEventListener("DOMContentLoaded", iniciarNotificaciones);

    window.crearAlertaNuevoAsunto = crearAlertaNuevoAsunto;
    window.iniciarNotificaciones = iniciarNotificaciones;
})();
