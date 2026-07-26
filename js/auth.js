/**
 * JS LegalTech Control
 * Autenticación centralizada con Firebase Authentication y Firestore.
 *
 * Reglas del flujo:
 * - Ningún usuario se convierte automáticamente en Superadministrador.
 * - Toda cuenta debe tener un perfil previamente autorizado en personal/{uid}
 *   o corresponder a un cliente habilitado en la colección clientes.
 * - Las cuentas con debeCambiarPassword=true deben cambiar la contraseña
 *   antes de acceder al sistema.
 */
(() => {
    "use strict";

    const CLAVE_SESION_LOCAL = "js_legal_session";
    const CLAVE_SESION_TEMPORAL = "js_legal_usuario";
    let perfilPendiente = null;
    let recordarPendiente = true;

    function obtenerServicios() {
        if (!window.db || !window.firebaseAuth) {
            throw new Error("Firebase no está disponible. Revisa firebase.js y los SDK cargados.");
        }
        return { db: window.db, auth: window.firebaseAuth };
    }

    function guardarSesion(perfil, recordar = true) {
        const sesion = {
            id: perfil.uid || perfil.id,
            uid: perfil.uid || perfil.id,
            clienteId: perfil.clienteId || "",
            nombre: perfil.nombre || "Usuario",
            usuario: perfil.usuario || perfil.correo,
            correo: perfil.correo || "",
            rol: perfil.rol || "Cliente",
            estado: perfil.estado || "Activo",
            abogadoSupervisorUid: perfil.abogadoSupervisorUid || "",
            abogadoSupervisorUsuario: perfil.abogadoSupervisorUsuario || "",
            inicioSesion: new Date().toISOString()
        };

        sessionStorage.setItem(CLAVE_SESION_TEMPORAL, JSON.stringify(sesion));
        if (recordar) localStorage.setItem(CLAVE_SESION_LOCAL, JSON.stringify(sesion));
        else localStorage.removeItem(CLAVE_SESION_LOCAL);
        return sesion;
    }

    async function obtenerPerfilAutorizado(user) {
        const { db } = obtenerServicios();

        const personalDoc = await db.collection("personal").doc(user.uid).get();
        if (personalDoc.exists) {
            return { id: personalDoc.id, uid: personalDoc.id, tipoPerfil: "personal", ...personalDoc.data() };
        }

        let clienteSnapshot = await db.collection("clientes")
            .where("authUid", "==", user.uid)
            .limit(1)
            .get();

        if (clienteSnapshot.empty && user.email) {
            clienteSnapshot = await db.collection("clientes")
                .where("correo", "==", user.email.toLowerCase())
                .limit(1)
                .get();
        }

        if (!clienteSnapshot.empty) {
            const doc = clienteSnapshot.docs[0];
            const datos = doc.data();
            if (datos.portalHabilitado !== true) return null;

            if (!datos.authUid) {
                await doc.ref.set({
                    authUid: user.uid,
                    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }

            return {
                id: user.uid,
                uid: user.uid,
                clienteId: doc.id,
                tipoPerfil: "cliente",
                nombre: datos.nombre || "Cliente",
                usuario: datos.usuario || user.email,
                correo: datos.correo || user.email || "",
                rol: "Cliente",
                estado: datos.estado || "Activo",
                debeCambiarPassword: datos.debeCambiarPassword === true
            };
        }

        return null;
    }

    function mostrarPanel(idVisible) {
        ["login-form", "cambio-password-form"].forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.hidden = id !== idVisible;
        });
    }

    function mostrarCambioPassword(perfil) {
        perfilPendiente = perfil;
        mostrarPanel("cambio-password-form");
        const correo = document.getElementById("cambio-correo");
        if (correo) correo.value = perfil.correo || "";
        document.getElementById("nueva-password")?.focus();
    }

    async function completarAcceso(perfil, recordar) {
        guardarSesion(perfil, recordar);
        window.location.replace("dashboard.html");
    }

    function establecerEstadoFormulario(procesando) {
        const boton = document.querySelector('#login-form button[type="submit"]');
        if (!boton) return;
        boton.disabled = procesando;
        boton.textContent = procesando ? "Verificando..." : "Iniciar sesión";
    }

    async function procesarLogin(event) {
        event?.preventDefault();

        const correo = document.getElementById("usuario")?.value.trim().toLowerCase() || "";
        const password = document.getElementById("password")?.value || "";
        const recordar = document.getElementById("recordar-sesion")?.checked ?? true;

        if (!correo || !password) return alert("Escribe tu correo electrónico y contraseña.");
        if (!/^\S+@\S+\.\S+$/.test(correo)) return alert("Escribe un correo electrónico válido.");

        establecerEstadoFormulario(true);
        try {
            const { auth } = obtenerServicios();
            const persistencia = recordar
                ? firebase.auth.Auth.Persistence.LOCAL
                : firebase.auth.Auth.Persistence.SESSION;

            await auth.setPersistence(persistencia);
            const credencial = await auth.signInWithEmailAndPassword(correo, password);
            const perfil = await obtenerPerfilAutorizado(credencial.user);

            if (!perfil) {
                await auth.signOut();
                alert("La cuenta existe en Firebase, pero no tiene un perfil autorizado en el sistema. Solicita al Superadministrador que complete tu alta.");
                return;
            }

            if ((perfil.estado || "Activo") !== "Activo") {
                await auth.signOut();
                alert("Este usuario está inactivo. Contacta al administrador.");
                return;
            }

            recordarPendiente = recordar;
            if (perfil.debeCambiarPassword === true) {
                mostrarCambioPassword(perfil);
                return;
            }

            await completarAcceso(perfil, recordar);
        } catch (error) {
            console.error("Error iniciando sesión:", error);
            const mensajes = {
                "auth/invalid-credential": "Correo o contraseña incorrectos.",
                "auth/wrong-password": "Correo o contraseña incorrectos.",
                "auth/user-not-found": "No existe una cuenta con ese correo en Firebase Authentication.",
                "auth/invalid-email": "El correo electrónico no es válido.",
                "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
                "auth/network-request-failed": "No fue posible conectar con Firebase. Revisa tu internet.",
                "permission-denied": "No fue posible consultar el perfil autorizado en Firestore. Revisa las reglas publicadas."
            };
            alert(mensajes[error.code] || `No fue posible iniciar sesión: ${error.message}`);
        } finally {
            establecerEstadoFormulario(false);
        }
    }

    async function cambiarPasswordObligatoria(event) {
        event.preventDefault();
        const nueva = document.getElementById("nueva-password")?.value || "";
        const confirmar = document.getElementById("confirmar-password")?.value || "";
        const boton = event.submitter || document.querySelector('#cambio-password-form button[type="submit"]');

        if (nueva.length < 8) return alert("La nueva contraseña debe tener al menos 8 caracteres.");
        if (nueva !== confirmar) return alert("Las contraseñas no coinciden.");
        if (!perfilPendiente) return alert("La sesión de cambio de contraseña ya no es válida. Inicia sesión nuevamente.");

        if (boton) { boton.disabled = true; boton.textContent = "Actualizando..."; }
        try {
            const { db, auth } = obtenerServicios();
            const user = auth.currentUser;
            if (!user) throw new Error("La sesión expiró. Inicia sesión nuevamente.");

            await user.updatePassword(nueva);

            if (perfilPendiente.tipoPerfil === "personal") {
                await db.collection("personal").doc(user.uid).set({
                    debeCambiarPassword: false,
                    ultimoCambioPassword: firebase.firestore.FieldValue.serverTimestamp(),
                    fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } else if (perfilPendiente.tipoPerfil === "cliente" && perfilPendiente.clienteId) {
                await db.collection("clientes").doc(perfilPendiente.clienteId).set({
                    debeCambiarPassword: false,
                    ultimoCambioPassword: firebase.firestore.FieldValue.serverTimestamp(),
                    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }

            perfilPendiente.debeCambiarPassword = false;
            alert("Contraseña actualizada correctamente.");
            await completarAcceso(perfilPendiente, recordarPendiente);
        } catch (error) {
            console.error("No fue posible cambiar la contraseña:", error);
            const mensaje = error.code === "auth/requires-recent-login"
                ? "Por seguridad, vuelve a iniciar sesión con la contraseña temporal e inténtalo nuevamente."
                : (error.message || "No fue posible cambiar la contraseña.");
            alert(mensaje);
        } finally {
            if (boton) { boton.disabled = false; boton.textContent = "Guardar nueva contraseña"; }
        }
    }

    function leerSesion() {
        const data = localStorage.getItem(CLAVE_SESION_LOCAL)
            || sessionStorage.getItem(CLAVE_SESION_TEMPORAL);
        if (!data) return null;
        try { return JSON.parse(data); }
        catch { cerrarSesion(false); return null; }
    }

    function verificarSesion() {
        const sesion = leerSesion();
        if (!sesion) {
            const esLogin = window.location.pathname.endsWith("/")
                || window.location.pathname.endsWith("index.html");
            if (!esLogin) window.location.replace("index.html");
            return null;
        }
        sessionStorage.setItem(CLAVE_SESION_TEMPORAL, JSON.stringify(sesion));
        return sesion;
    }

    async function cerrarSesion(redirigir = true) {
        localStorage.removeItem(CLAVE_SESION_LOCAL);
        sessionStorage.removeItem(CLAVE_SESION_TEMPORAL);
        perfilPendiente = null;
        try { await window.firebaseAuth?.signOut(); }
        catch (error) { console.warn("No se pudo cerrar la sesión de Firebase:", error); }
        if (redirigir) window.location.replace("index.html");
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("login-form")?.addEventListener("submit", procesarLogin);
        document.getElementById("cambio-password-form")?.addEventListener("submit", cambiarPasswordObligatoria);
        document.getElementById("cancelar-cambio-password")?.addEventListener("click", async () => {
            await cerrarSesion(false);
            mostrarPanel("login-form");
        });
    });

    window.procesarLogin = procesarLogin;
    window.verificarSesion = verificarSesion;
    window.obtenerUsuarioSesion = leerSesion;
    window.cerrarSesion = cerrarSesion;
})();
