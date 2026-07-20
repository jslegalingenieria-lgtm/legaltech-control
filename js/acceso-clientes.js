/**
 * JS LegalTech Control Light
 * Acceso inicial del cliente al portal.
 *
 * La cuenta se crea con una instancia secundaria de Firebase para no cerrar
 * la sesión del administrador. Después Firebase envía el correo seguro para
 * que el cliente establezca su propia contraseña.
 */
(() => {
    "use strict";

    const NOMBRE_APP_SECUNDARIA = "jsLegalClienteCreator";

    function servicios() {
        if (!window.db || !window.firebaseAuth || !window.FIREBASE_CONFIG) {
            throw new Error("Firebase no está disponible.");
        }
        return { db: window.db, auth: window.firebaseAuth };
    }

    function generarPasswordTemporal() {
        const aleatorio = Math.random().toString(36).slice(2);
        return `JsL!${Date.now().toString(36)}${aleatorio}9A`;
    }

    function obtenerAuthSecundario() {
        let app = firebase.apps.find(item => item.name === NOMBRE_APP_SECUNDARIA);
        if (!app) app = firebase.initializeApp(window.FIREBASE_CONFIG, NOMBRE_APP_SECUNDARIA);
        return app.auth();
    }

    async function leerCliente(clienteId) {
        const { db } = servicios();
        const doc = await db.collection("clientes").doc(String(clienteId)).get();
        if (!doc.exists) throw new Error("No se encontró el cliente seleccionado.");
        return { id: doc.id, ...doc.data() };
    }

    async function asegurarCuenta(correo) {
        const email = String(correo || "").trim().toLowerCase();
        if (!email) throw new Error("El cliente no tiene correo registrado.");

        const authSecundario = obtenerAuthSecundario();
        let uid = "";
        let creada = false;

        try {
            const credencial = await authSecundario.createUserWithEmailAndPassword(
                email,
                generarPasswordTemporal()
            );
            uid = credencial.user.uid;
            creada = true;
        } catch (error) {
            if (error.code !== "auth/email-already-in-use") throw error;
        } finally {
            try { await authSecundario.signOut(); } catch (_) { /* sin acción */ }
        }

        return { uid, creada, correo: email };
    }

    async function enviarEnlacePassword(correo) {
        const { auth } = servicios();
        const urlBase = new URL("index.html", window.location.href).href;
        await auth.sendPasswordResetEmail(correo, {
            url: urlBase,
            handleCodeInApp: false
        });
    }

    async function registrarCorreoEnAsunto(asuntoId, registro) {
        const { db } = servicios();
        const ref = db.collection("asuntos").doc(String(asuntoId));
        await db.runTransaction(async transaccion => {
            const snapshot = await transaccion.get(ref);
            if (!snapshot.exists) return;
            const correos = Array.isArray(snapshot.data().correos)
                ? [...snapshot.data().correos]
                : [];
            correos.push(registro);
            transaccion.set(ref, {
                correos,
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
    }

    async function enviarBienvenida({ cliente, asunto, abogadoNombre = "" }) {
        if (!window.JSLegalEmail?.enviarCorreoCliente) {
            return { ok: false, motivo: "emailjs_no_disponible" };
        }

        const portal = new URL("index.html", window.location.href).href;
        const descripcion = [
            `Bienvenido(a) al Portal del Cliente de JS Legal & Ingeniería.`,
            `Su usuario de acceso es: ${cliente.correo}.`,
            `Folio interno: ${asunto.folioInterno || "Pendiente"}.`,
            `Expediente judicial: ${asunto.expediente || "Pendiente de asignación"}.`,
            `Portal: ${portal}`,
            `Por seguridad, recibirá también un correo de Firebase para crear su propia contraseña. No comparta sus datos de acceso.`
        ].join("\n\n");

        return window.JSLegalEmail.enviarCorreoCliente({
            correo: cliente.correo,
            asunto: "Bienvenido al Portal del Cliente – JS Legal & Ingeniería",
            cliente: cliente.nombre,
            expediente: asunto.folioInterno || asunto.expediente,
            juzgado: asunto.juzgado,
            materia: asunto.materia,
            descripcion,
            abogado: abogadoNombre || "JS Legal & Ingeniería",
            tipo: "bienvenida_portal",
            fecha: new Date().toLocaleString("es-MX")
        });
    }

    async function habilitarYEnviar({ clienteId, asuntoId, asunto, abogadoNombre = "", reenviar = false }) {
        const { db } = servicios();
        const cliente = await leerCliente(clienteId);
        const correo = String(cliente.correo || "").trim().toLowerCase();
        if (!correo) throw new Error("El cliente no tiene correo registrado.");

        const cuenta = await asegurarCuenta(correo);

        await db.collection("clientes").doc(String(clienteId)).set({
            correo,
            usuario: correo,
            rol: "Cliente",
            portalHabilitado: true,
            authUid: cuenta.uid || cliente.authUid || "",
            invitacionEnviada: true,
            fechaInvitacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await enviarEnlacePassword(correo);
        const resultadoBienvenida = await enviarBienvenida({ cliente: { ...cliente, correo }, asunto, abogadoNombre });

        const registro = {
            tipo: reenviar ? "reinvitacion_portal" : "bienvenida_portal",
            asunto: reenviar ? "Reenvío de acceso al portal" : "Correo de bienvenida al portal",
            destinatario: correo,
            estado: resultadoBienvenida?.ok ? "enviado" : "parcial",
            fecha: new Date().toLocaleString("es-MX"),
            descripcion: "Firebase envió el enlace seguro para establecer o restablecer la contraseña."
        };
        await registrarCorreoEnAsunto(asuntoId, registro);

        return {
            ok: true,
            cuentaCreada: cuenta.creada,
            bienvenidaEnviada: resultadoBienvenida?.ok === true,
            correo
        };
    }

    async function reenviarInvitacion(asuntoId) {
        const { db } = servicios();
        const doc = await db.collection("asuntos").doc(String(asuntoId)).get();
        if (!doc.exists) return alert("No se encontró el expediente.");
        const asunto = { id: doc.id, ...doc.data() };

        if (!confirm(`¿Reenviar el acceso al portal a ${asunto.cliente || "este cliente"}?`)) return;
        try {
            const resultado = await habilitarYEnviar({
                clienteId: asunto.clienteId,
                asuntoId: doc.id,
                asunto,
                reenviar: true
            });
            alert(`Acceso reenviado a ${resultado.correo}.\n\nFirebase enviará el enlace seguro para crear o cambiar la contraseña.`);
        } catch (error) {
            console.error("No se pudo reenviar la invitación:", error);
            alert(`No fue posible reenviar el acceso: ${error.message}`);
        }
    }

    window.JSLegalAccesoClientes = Object.freeze({ habilitarYEnviar, reenviarInvitacion });
    window.reenviarInvitacionCliente = reenviarInvitacion;
})();
