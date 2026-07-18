/**
 * JS LegalTech Control
 * Integración centralizada con EmailJS.
 */
(() => {
    "use strict";

    const CONFIG = Object.freeze({
        publicKey: "Rch9Cu7NvpP5yrpeF",
        serviceId: "service_u5nu19m",
        templateNuevoAsunto: "template_3n49lhp"
    });

    let inicializado = false;

    function inicializarEmailJS() {
        if (inicializado) return true;

        if (!window.emailjs) {
            console.error("EmailJS no está disponible. Revisa la librería cargada en dashboard.html.");
            return false;
        }

        window.emailjs.init({ publicKey: CONFIG.publicKey });
        inicializado = true;
        return true;
    }

    async function buscarAbogadoPorUsuario(usuario) {
        if (!window.db || !usuario) return null;

        const consulta = await window.db
            .collection("personal")
            .where("usuario", "==", String(usuario))
            .limit(1)
            .get();

        if (consulta.empty) return null;

        const documento = consulta.docs[0];
        return { id: documento.id, ...documento.data() };
    }

    async function enviarCorreoNuevoAsunto({
        usuario,
        abogadoNombre = "",
        expediente = "",
        cliente = "",
        materia = "",
        descripcion = "",
        fecha = ""
    }) {
        try {
            if (!inicializarEmailJS()) {
                return { ok: false, motivo: "emailjs_no_disponible" };
            }

            const abogado = await buscarAbogadoPorUsuario(usuario);
            const correo = String(abogado?.correo || "").trim();

            if (!correo) {
                console.warn("No se envió el correo: el abogado asignado no tiene correo registrado.", usuario);
                return { ok: false, motivo: "correo_no_registrado" };
            }

            const parametros = {
                correo,
                abogado: abogado?.nombre || abogadoNombre || usuario,
                numeroExpediente: expediente || "Sin número",
                cliente: cliente || "Sin especificar",
                materia: materia || "Sin especificar",
                descripcion: descripcion || "Sin descripción",
                fecha: fecha || new Date().toLocaleDateString("es-MX")
            };

            const respuesta = await window.emailjs.send(
                CONFIG.serviceId,
                CONFIG.templateNuevoAsunto,
                parametros
            );

            console.info("Correo de nuevo asunto enviado:", respuesta.status, respuesta.text);
            return { ok: true, correo, respuesta };
        } catch (error) {
            console.error("No fue posible enviar el correo del nuevo asunto:", error);
            return { ok: false, motivo: "error_envio", error };
        }
    }

    document.addEventListener("DOMContentLoaded", inicializarEmailJS);

    window.JSLegalEmail = Object.freeze({
        enviarCorreoNuevoAsunto
    });
})();
