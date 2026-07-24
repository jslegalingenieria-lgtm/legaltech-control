/**
 * JS LegalTech Control
 * Autenticación Firebase + creación del perfil inicial del Superadministrador.
 *
 * Flujo definitivo de instalación:
 * 1. La cuenta se crea manualmente en Firebase Authentication con correo real.
 * 2. El usuario inicia sesión con ese correo y contraseña.
 * 3. Si no existe personal/{uid}, se abre el asistente de perfil.
 * 4. El asistente crea el perfil con rol Superadministrador, sin modificar
 *    el correo ni la contraseña de Firebase Authentication.
 */
(() => {
    "use strict";

    const CLAVE_SESION_LOCAL = "js_legal_session";
    const CLAVE_SESION_TEMPORAL = "js_legal_usuario";

    const normalizarTexto = valor => String(valor || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

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
        if (recordar) {
            localStorage.setItem(CLAVE_SESION_LOCAL, JSON.stringify(sesion));
        } else {
            localStorage.removeItem(CLAVE_SESION_LOCAL);
        }
        return sesion;
    }

    async function obtenerPerfilPorUid(uid) {
        const { db } = obtenerServicios();
        const doc = await db.collection("personal").doc(uid).get();
        return doc.exists ? { id: doc.id, uid: doc.id, ...doc.data() } : null;
    }

    function mostrarLogin() {
        const login = document.getElementById("login-form");
        const panel = document.getElementById("configuracion-inicial");
        if (login) login.hidden = false;
        if (panel) panel.hidden = true;
    }

    function mostrarConfiguracionInicial(user) {
        const login = document.getElementById("login-form");
        const panel = document.getElementById("configuracion-inicial");
        if (!login || !panel) return;

        login.hidden = true;
        panel.hidden = false;

        const uid = document.getElementById("setup-uid");
        const correo = document.getElementById("setup-correo-autenticado");
        const nombre = document.getElementById("setup-nombre");

        if (uid) uid.value = user.uid;
        if (correo) correo.value = user.email || "";
        if (nombre) nombre.focus();
    }

    async function guardarConfiguracionInicial(event) {
        event.preventDefault();

        const nombre = document.getElementById("setup-nombre")?.value.trim() || "";
        const usuario = document.getElementById("setup-usuario")?.value.trim() || "";
        const telefono = document.getElementById("setup-telefono")?.value.trim() || "";
        const despacho = document.getElementById("setup-despacho")?.value.trim() || "";
        const recordar = document.getElementById("recordar-sesion")?.checked ?? true;
        const boton = document.querySelector('#configuracion-inicial button[type="submit"]');

        if (!nombre || !usuario || !despacho) {
            alert("Completa el nombre, el usuario y el nombre del despacho.");
            return;
        }

        if (usuario.length < 3) {
            alert("El usuario debe contener al menos 3 caracteres.");
            return;
        }

        if (boton) {
            boton.disabled = true;
            boton.textContent = "Guardando perfil...";
        }

        try {
            const { db, auth } = obtenerServicios();
            const user = auth.currentUser;
            if (!user) {
                throw new Error("La sesión expiró. Inicia sesión nuevamente con tu correo de Firebase.");
            }

            const referencia = db.collection("personal").doc(user.uid);
            const existente = await referencia.get();
            if (existente.exists) {
                throw new Error("El perfil de este usuario ya existe. Vuelve a iniciar sesión.");
            }

            const perfil = {
                uid: user.uid,
                nombre,
                usuario,
                usuarioNormalizado: normalizarTexto(usuario),
                correo: user.email || "",
                telefono,
                despacho,
                rol: "Superadministrador",
                tipoResponsable: "Infraestructura",
                estado: "Activo",
                requiereConfiguracionInicial: false,
                configuracionInicialCompletada: firebase.firestore.FieldValue.serverTimestamp(),
                fechaAlta: firebase.firestore.FieldValue.serverTimestamp(),
                fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
            };

            await referencia.set(perfil);
            guardarSesion(perfil, recordar);
            alert("Superadministrador configurado correctamente.");
            window.location.replace("dashboard.html");
        } catch (error) {
            console.error("Error creando el perfil inicial:", error);
            const mensajes = {
                "permission-denied": "Firestore rechazó la operación. Publica las reglas incluidas en el proyecto.",
                "unavailable": "No fue posible conectar con Firestore. Revisa tu conexión a internet."
            };
            alert(mensajes[error.code] || error.message || "No fue posible crear el perfil inicial.");
        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = "Guardar perfil y entrar";
            }
        }
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

        if (!correo || !password) {
            alert("Escribe tu correo electrónico y contraseña.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(correo)) {
            alert("Escribe el correo electrónico registrado en Firebase Authentication.");
            return;
        }

        establecerEstadoFormulario(true);
        try {
            const { auth } = obtenerServicios();
            const persistencia = recordar
                ? firebase.auth.Auth.Persistence.LOCAL
                : firebase.auth.Auth.Persistence.SESSION;

            await auth.setPersistence(persistencia);
            const credencial = await auth.signInWithEmailAndPassword(correo, password);
            const perfil = await obtenerPerfilPorUid(credencial.user.uid);

            if (!perfil) {
                mostrarConfiguracionInicial(credencial.user);
                return;
            }

            if ((perfil.estado || "Activo") !== "Activo") {
                await auth.signOut();
                alert("Este usuario está inactivo. Contacta al administrador.");
                return;
            }

            guardarSesion(perfil, recordar);
            window.location.replace("dashboard.html");
        } catch (error) {
            console.error("Error iniciando sesión:", error);
            const mensajes = {
                "auth/invalid-credential": "Correo o contraseña incorrectos.",
                "auth/wrong-password": "Correo o contraseña incorrectos.",
                "auth/user-not-found": "No existe una cuenta con ese correo en Firebase Authentication.",
                "auth/invalid-email": "El correo electrónico no es válido.",
                "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
                "auth/network-request-failed": "No fue posible conectar con Firebase. Revisa tu internet.",
                "permission-denied": "No fue posible consultar el perfil en Firestore. Revisa las reglas publicadas."
            };
            alert(mensajes[error.code] || `No fue posible iniciar sesión: ${error.message}`);
        } finally {
            establecerEstadoFormulario(false);
        }
    }

    function leerSesion() {
        const data = localStorage.getItem(CLAVE_SESION_LOCAL)
            || sessionStorage.getItem(CLAVE_SESION_TEMPORAL);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch {
            cerrarSesion(false);
            return null;
        }
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
        try {
            await window.firebaseAuth?.signOut();
        } catch (error) {
            console.warn("No se pudo cerrar la sesión de Firebase:", error);
        }
        if (redirigir) window.location.replace("index.html");
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("login-form")?.addEventListener("submit", procesarLogin);
        document.getElementById("configuracion-inicial")?.addEventListener("submit", guardarConfiguracionInicial);
        document.getElementById("cancelar-configuracion")?.addEventListener("click", async () => {
            await cerrarSesion(false);
            mostrarLogin();
        });
    });

    window.procesarLogin = procesarLogin;
    window.verificarSesion = verificarSesion;
    window.obtenerUsuarioSesion = leerSesion;
    window.cerrarSesion = cerrarSesion;
})();
