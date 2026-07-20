/**
 * JS LegalTech Control
 * Alertas ligeras de términos procesales.
 * Consulta únicamente las alertas del usuario en sesión y muestra las que
 * vencieron o vencerán dentro de los próximos cinco días.
 */
(() => {
    "use strict";

    const COLECCION = "alertas";
    const DIAS_AVISO = 5;
    let detenerEscucha = null;
    let primeraCargaProcesada = false;

    function obtenerSesion() {
        try {
            const datos = sessionStorage.getItem("js_legal_usuario") ||
                localStorage.getItem("js_legal_session");
            return datos ? JSON.parse(datos) : null;
        } catch (error) {
            console.error("No se pudo leer la sesión para términos:", error);
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

    function fechaLocal(valor) {
        if (!valor) return null;
        const partes = String(valor).split("-").map(Number);
        if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function diferenciaDias(fechaISO) {
        const vencimiento = fechaLocal(fechaISO);
        if (!vencimiento) return Number.POSITIVE_INFINITY;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        vencimiento.setHours(0, 0, 0, 0);
        return Math.round((vencimiento - hoy) / 86400000);
    }

    function clasificar(alerta) {
        const dias = diferenciaDias(alerta.fechaVencimiento);
        if (dias < 0) return { dias, texto: `Venció hace ${Math.abs(dias)} día(s)`, color: "#dc2626", fondo: "#fef2f2" };
        if (dias === 0) return { dias, texto: "Vence hoy", color: "#dc2626", fondo: "#fef2f2" };
        if (dias === 1) return { dias, texto: "Vence mañana", color: "#d97706", fondo: "#fffbeb" };
        return { dias, texto: `Vence en ${dias} días`, color: "#ca8a04", fondo: "#fefce8" };
    }

    function formatearFecha(fechaISO) {
        const fecha = fechaLocal(fechaISO);
        return fecha ? fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) : "Sin fecha";
    }

    function reproducirAviso() {
        try {
            const AudioContexto = window.AudioContext || window.webkitAudioContext;
            if (!AudioContexto) return;
            const contexto = new AudioContexto();
            const oscilador = contexto.createOscillator();
            const ganancia = contexto.createGain();
            oscilador.frequency.setValueAtTime(740, contexto.currentTime);
            ganancia.gain.setValueAtTime(0.09, contexto.currentTime);
            ganancia.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + 0.55);
            oscilador.connect(ganancia);
            ganancia.connect(contexto.destination);
            oscilador.start();
            oscilador.stop(contexto.currentTime + 0.55);
        } catch (error) {
            console.warn("El navegador bloqueó el sonido de términos:", error);
        }
    }

    async function marcarCumplido(id, boton) {
        if (!window.db || !id) return;
        if (!confirm("¿Confirmas que este término fue cumplido?")) return;
        try {
            if (boton) {
                boton.disabled = true;
                boton.textContent = "Guardando...";
            }
            await window.db.collection(COLECCION).doc(String(id)).update({
                estado: "cumplido",
                fechaCumplimiento: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("No se pudo marcar el término:", error);
            alert("No fue posible marcar el término como cumplido.");
            if (boton) {
                boton.disabled = false;
                boton.textContent = "Marcar cumplido";
            }
        }
    }

    function mostrarModal(alertas) {
        document.getElementById("modal-alertas-terminos")?.remove();
        if (!alertas.length) return;

        const modal = document.createElement("div");
        modal.id = "modal-alertas-terminos";
        modal.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:20px;";

        const tarjetas = alertas.map(item => {
            const estado = clasificar(item);
            return `
                <article data-alerta-id="${escaparHTML(item.id)}" style="border:1px solid #e2e8f0;border-left:5px solid ${estado.color};background:${estado.fondo};border-radius:8px;padding:13px 14px;margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                        <div>
                            <strong style="display:block;color:#1e293b;margin-bottom:4px;">${escaparHTML(item.titulo || "Término procesal")}</strong>
                            <div style="font-size:13px;line-height:1.55;color:#475569;">
                                <b>Expediente:</b> ${escaparHTML(item.expediente || "Sin número")}<br>
                                <b>Cliente:</b> ${escaparHTML(item.cliente || "Sin especificar")}<br>
                                <b>Fecha límite:</b> ${escaparHTML(formatearFecha(item.fechaVencimiento))}<br>
                                <b>Prioridad:</b> ${escaparHTML(item.prioridad || "Media")}
                            </div>
                        </div>
                        <span style="white-space:nowrap;font-size:12px;font-weight:800;color:${estado.color};">${escaparHTML(estado.texto)}</span>
                    </div>
                    <button type="button" data-cumplir="${escaparHTML(item.id)}" style="margin-top:10px;border:0;border-radius:6px;padding:7px 10px;background:#0f766e;color:white;font-weight:700;cursor:pointer;">Marcar cumplido</button>
                </article>`;
        }).join("");

        modal.innerHTML = `
            <section role="dialog" aria-modal="true" aria-labelledby="titulo-alertas-terminos" style="width:min(680px,100%);max-height:88vh;overflow:auto;background:white;border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.3);padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:14px;">
                    <div>
                        <h2 id="titulo-alertas-terminos" style="margin:0;color:#1e293b;font-size:1.25rem;">⚖️ Alertas de términos procesales</h2>
                        <p style="margin:5px 0 0;color:#64748b;font-size:13px;">Tienes ${alertas.length} término(s) que requieren atención.</p>
                    </div>
                    <button type="button" data-cerrar style="border:0;background:#f1f5f9;color:#475569;width:34px;height:34px;border-radius:50%;font-size:20px;cursor:pointer;">&times;</button>
                </div>
                <div>${tarjetas}</div>
                <button type="button" data-cerrar style="width:100%;border:0;border-radius:7px;padding:10px;background:#334155;color:white;font-weight:700;cursor:pointer;">Cerrar</button>
            </section>`;

        modal.querySelectorAll("[data-cerrar]").forEach(btn => btn.addEventListener("click", () => modal.remove()));
        modal.addEventListener("click", event => { if (event.target === modal) modal.remove(); });
        modal.querySelectorAll("[data-cumplir]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.cumplir;
                await marcarCumplido(id, btn);
                btn.closest("[data-alerta-id]")?.remove();
                if (!modal.querySelector("[data-alerta-id]")) modal.remove();
            });
        });

        document.body.appendChild(modal);
        reproducirAviso();
    }

    function procesarSnapshot(snapshot) {
        const alertas = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.tipo === "termino" && item.estado !== "cumplido")
            .filter(item => diferenciaDias(item.fechaVencimiento) <= DIAS_AVISO)
            .sort((a, b) => diferenciaDias(a.fechaVencimiento) - diferenciaDias(b.fechaVencimiento));

        const firma = alertas.map(item => `${item.id}:${item.estado}:${item.fechaVencimiento}`).join("|");
        const clave = `terminos_mostrados_${firma}`;
        if (!alertas.length || sessionStorage.getItem(clave)) return;
        sessionStorage.setItem(clave, "1");
        mostrarModal(alertas);
    }

    function iniciarAlertasTerminos() {
        const sesion = obtenerSesion();
        if (!window.db || !sesion || !["Abogado", "Administrador"].includes(sesion.rol) || !sesion.usuario || detenerEscucha) return;

        detenerEscucha = window.db.collection(COLECCION)
            .where("usuario", "==", String(sesion.usuario))
            .onSnapshot(snapshot => {
                if (!primeraCargaProcesada) primeraCargaProcesada = true;
                procesarSnapshot(snapshot);
            }, error => console.error("No se pudieron consultar los términos:", error));
    }

    async function mostrarAlertasTerminosManualmente() {
        const sesion = obtenerSesion();

        if (!window.db || !sesion || !["Abogado", "Administrador"].includes(sesion.rol)) {
            alert("No fue posible consultar los términos procesales.");
            return;
        }

        try {
            let consulta = window.db.collection(COLECCION);

            if (sesion.rol === "Abogado") {
                if (!sesion.usuario) {
                    alert("No se encontró el usuario de la sesión.");
                    return;
                }
                consulta = consulta.where("usuario", "==", String(sesion.usuario));
            }

            const snapshot = await consulta.get();
            const alertas = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => item.tipo === "termino" && item.estado !== "cumplido" && item.estado !== "cancelado")
                .filter(item => diferenciaDias(item.fechaVencimiento) <= DIAS_AVISO)
                .sort((a, b) => diferenciaDias(a.fechaVencimiento) - diferenciaDias(b.fechaVencimiento));

            if (!alertas.length) {
                alert("No hay términos procesales pendientes dentro de los próximos 5 días.");
                return;
            }

            mostrarModal(alertas);
        } catch (error) {
            console.error("No se pudieron abrir los términos pendientes:", error);
            alert("No fue posible consultar los términos procesales.");
        }
    }

    document.addEventListener("DOMContentLoaded", iniciarAlertasTerminos);
    window.iniciarAlertasTerminos = iniciarAlertasTerminos;
    window.mostrarAlertasTerminos = mostrarAlertasTerminosManualmente;
})();
