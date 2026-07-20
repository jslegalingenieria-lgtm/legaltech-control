/**
 * JS LegalTech Control
 * Servicio centralizado de correo mediante EmailJS.
 *
 * Nota: el Template ID debe aceptar como mínimo estas variables:
 * {{correo}}, {{asunto}}, {{cliente}}, {{numeroExpediente}},
 * {{juzgado}}, {{materia}}, {{descripcion}}, {{fecha}} y {{abogado}}.
 */
(() => {
    "use strict";

    const CONFIG = Object.freeze({
        publicKey: "Rch9Cu7NvpP5yrpeF",
        serviceId: "service_u5nu19m",
        // Se conserva la plantilla que ya funcionaba en el proyecto.
        // Puede sustituirse desde localStorage con la clave
        // js_legal_email_template_comunicaciones.
        templateComunicaciones: "template_3n49lhp"
    });

    let inicializado = false;

    function inicializarEmailJS() {
        if (inicializado) return true;
        if (!window.emailjs) {
            console.error("EmailJS no está disponible. Revisa dashboard.html.");
            return false;
        }
        window.emailjs.init({ publicKey: CONFIG.publicKey });
        inicializado = true;
        return true;
    }

    function obtenerTemplateId() {
        return String(
            localStorage.getItem("js_legal_email_template_comunicaciones") ||
            CONFIG.templateComunicaciones
        ).trim();
    }

    async function buscarAbogadoPorUsuario(usuario) {
        if (!window.db || !usuario) return null;

        let consulta = await window.db
            .collection("personal")
            .where("usuario", "==", String(usuario))
            .limit(1)
            .get();

        if (consulta.empty) {
            const porId = await window.db.collection("personal").doc(String(usuario)).get();
            if (porId.exists) return { id: porId.id, ...porId.data() };
            return null;
        }

        const documento = consulta.docs[0];
        return { id: documento.id, ...documento.data() };
    }

    async function enviarCorreo({
        correo,
        asunto = "Notificación de JS LegalTech Control",
        cliente = "",
        expediente = "",
        juzgado = "",
        materia = "",
        descripcion = "",
        abogado = "",
        tipo = "comunicacion",
        fecha = ""
    }) {
        try {
            const destinatario = String(correo || "").trim();
            if (!destinatario) return { ok: false, motivo: "correo_no_registrado" };
            if (!inicializarEmailJS()) return { ok: false, motivo: "emailjs_no_disponible" };

            const parametros = {
    correo: destinatario,
    to_email: destinatario,

    asunto,
    subject: asunto,

    titulo:
        tipo === "bienvenida_portal"
            ? "Bienvenido al Portal del Cliente"
            : tipo === "nuevo_asunto"
                ? "Nuevo asunto asignado"
                : tipo === "termino_procesal"
                    ? "Alerta de término procesal"
                    : "Actualización de expediente",

    destinatarioNombre:
        tipo === "nuevo_asunto" || tipo === "termino_procesal"
            ? (abogado || "Abogado responsable")
            : (cliente || "Cliente"),

    introduccion:
        tipo === "bienvenida_portal"
            ? `Le damos la bienvenida al Portal del Cliente de JS LegalTech Control.

Su asunto ha sido registrado y está siendo atendido por nuestro despacho a través de JS LegalTech Control. Desde este portal podrá consultar el estado de su expediente, recibir actualizaciones y mantenerse informado sobre el avance de su asunto.`
            : tipo === "nuevo_asunto"
                ? "Se le informa que se le ha asignado un nuevo asunto dentro de JS LegalTech Control."
                : tipo === "termino_procesal"
                    ? "Se ha generado una alerta procesal relacionada con el expediente indicado."
                    : "Existe una actualización relacionada con su expediente.",

    mensajeDestacado:
        tipo === "bienvenida_portal"
            ? `En unos minutos recibirá un correo de Firebase Authentication con un enlace seguro para establecer su contraseña.

Si no lo encuentra en su bandeja de entrada, revise la carpeta de correo no deseado (Spam).`
            : tipo === "nuevo_asunto"
                ? "Ingrese al sistema para consultar los detalles del expediente y dar seguimiento."
                : "Revise el sistema para conocer más detalles.",

    firma:
        tipo === "bienvenida_portal"
            ? (abogado || "JS Legal & Ingeniería")
            : "Administrador del Sistema",

    cliente: cliente || "Sin especificar",
    numeroExpediente: expediente || "Sin número",
    expediente: expediente || "Sin número",
    juzgado: juzgado || "Sin especificar",
    materia: materia || "Sin especificar",
    descripcion: descripcion || "Sin descripción",
    mensaje: descripcion || "Sin descripción",
    abogado: abogado || "JS Legal & Ingeniería",
    tipo,
    fecha: fecha || new Date().toLocaleString("es-MX")
};

            const respuesta = await window.emailjs.send(
                CONFIG.serviceId,
                obtenerTemplateId(),
                parametros
            );

            return { ok: true, correo: destinatario, respuesta };
        } catch (error) {
            console.error("No fue posible enviar el correo:", error);
            return { ok: false, motivo: "error_envio", error };
        }
    }

    async function enviarCorreoNuevoAsunto(datos = {}) {
        const abogado = await buscarAbogadoPorUsuario(datos.usuario);
        return enviarCorreo({
            correo: abogado?.correo,
            asunto: `Nuevo expediente asignado: ${datos.expediente || "Sin número"}`,
            cliente: datos.cliente,
            expediente: datos.expediente,
            materia: datos.materia,
            descripcion: datos.descripcion,
            abogado: abogado?.nombre || datos.abogadoNombre || datos.usuario,
            tipo: "nuevo_asunto",
            fecha: datos.fecha
        });
    }

    async function enviarCorreoAlertaAbogado(datos = {}) {
        const abogado = await buscarAbogadoPorUsuario(datos.usuario);
        return enviarCorreo({
            correo: abogado?.correo,
            asunto: datos.asunto || `Alerta procesal: ${datos.expediente || "Sin número"}`,
            cliente: datos.cliente,
            expediente: datos.expediente,
            juzgado: datos.juzgado,
            materia: datos.materia,
            descripcion: datos.descripcion,
            abogado: abogado?.nombre || datos.abogadoNombre || datos.usuario,
            tipo: datos.tipo || "alerta",
            fecha: datos.fecha
        });
    }

    async function enviarCorreoCliente(datos = {}) {
        return enviarCorreo({
            correo: datos.correo,
            asunto: datos.asunto || `Actualización de su expediente ${datos.expediente || ""}`,
            cliente: datos.cliente,
            expediente: datos.expediente,
            juzgado: datos.juzgado,
            materia: datos.materia,
            descripcion: datos.descripcion,
            abogado: datos.abogado,
            tipo: datos.tipo || "informe_cliente",
            fecha: datos.fecha
        });
    }

    document.addEventListener("DOMContentLoaded", inicializarEmailJS);

    window.JSLegalEmail = Object.freeze({
        enviarCorreo,
        enviarCorreoNuevoAsunto,
        enviarCorreoAlertaAbogado,
        enviarCorreoCliente,
        buscarAbogadoPorUsuario
    });
})();
