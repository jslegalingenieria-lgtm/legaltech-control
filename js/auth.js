/**
 * JS LegalTech Control
 * Autenticación con Firebase Authentication y perfil en Firestore.
 * Mantiene las claves de sesión anteriores para no romper los demás módulos.
 */
(() => {
    "use strict";

    const CLAVE_SESION_LOCAL = "js_legal_session";
    const CLAVE_SESION_TEMPORAL = "js_legal_usuario";

    // Acceso inicial para crear el primer administrador cuando Authentication está vacío.
    const ADMIN_INICIAL = {
        usuario: "Administrador",
        password: "admin2026",
        correo: "administrador@jslegaltech.local",
        nombre: "Administrador",
        rol: "Administrador"
    };

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

    async function buscarPerfilPersonal(entrada) {
        const { db } = obtenerServicios();
        const valor = normalizarTexto(entrada);

        const porUsuario = await db.collection("personal")
            .where("usuarioNormalizado", "==", valor)
            .limit(1)
            .get();
        if (!porUsuario.empty) {
            const doc = porUsuario.docs[0];
            return { id: doc.id, uid: doc.id, ...doc.data() };
        }

        // Compatibilidad con documentos anteriores que todavía no tienen usuarioNormalizado.
        const snapshot = await db.collection("personal").get();
        const encontrado = snapshot.docs.find(doc => {
            const datos = doc.data();
            return normalizarTexto(datos.usuario) === valor || normalizarTexto(datos.correo) === valor;
        });
        return encontrado ? { id: encontrado.id, uid: encontrado.id, ...encontrado.data() } : null;
    }

    async function buscarPerfilCliente(entrada) {
        const { db } = obtenerServicios();
        const valor = normalizarTexto(entrada);
        const snapshot = await db.collection("clientes").get();
        const encontrado = snapshot.docs.find(doc => {
            const datos = doc.data();
            return normalizarTexto(datos.usuario) === valor || normalizarTexto(datos.correo) === valor;
        });
        return encontrado ? { id: encontrado.id, ...encontrado.data(), rol: "Cliente" } : null;
    }

    async function crearAdministradorInicial(entrada, password) {
        if (
            normalizarTexto(entrada) !== normalizarTexto(ADMIN_INICIAL.usuario) ||
            String(password) !== ADMIN_INICIAL.password
        ) return null;

        const { db, auth } = obtenerServicios();
        let credencial;

        try {
            credencial = await auth.createUserWithEmailAndPassword(
                ADMIN_INICIAL.correo,
                ADMIN_INICIAL.password
            );
        } catch (error) {
            if (error.code !== "auth/email-already-in-use") throw error;
            credencial = await auth.signInWithEmailAndPassword(
                ADMIN_INICIAL.correo,
                ADMIN_INICIAL.password
            );
        }

        const perfil = {
            uid: credencial.user.uid,
            nombre: ADMIN_INICIAL.nombre,
            usuario: ADMIN_INICIAL.usuario,
            usuarioNormalizado: normalizarTexto(ADMIN_INICIAL.usuario),
            correo: ADMIN_INICIAL.correo,
            rol: ADMIN_INICIAL.rol,
            estado: "Activo",
            fechaAlta: firebase.firestore.FieldValue.serverTimestamp(),
            fechaModificacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection("personal").doc(credencial.user.uid).set(perfil, { merge: true });
        return perfil;
    }

    function establecerEstadoFormulario(procesando) {
        const boton = document.querySelector('#login-form button[type="submit"]');
        if (!boton) return;
        boton.disabled = procesando;
        boton.textContent = procesando ? "Verificando..." : "Iniciar sesión";
    }

    async function procesarLogin(event) {
        event?.preventDefault();

        const entrada = document.getElementById("usuario")?.value.trim() || "";
        const password = document.getElementById("password")?.value || "";
        const recordar = document.getElementById("recordar-sesion")?.checked ?? true;

        if (!entrada || !password) {
            alert("Escribe tu usuario y contraseña.");
            return;
        }

        establecerEstadoFormulario(true);
        try {
            const { auth } = obtenerServicios();
            let perfil;

            // El acceso inicial migra o recupera al administrador aunque exista
            // un documento antiguo de Firestore sin cuenta en Authentication.
            const esAdminInicial =
                normalizarTexto(entrada) === normalizarTexto(ADMIN_INICIAL.usuario) &&
                String(password) === ADMIN_INICIAL.password;

            if (esAdminInicial) {
                perfil = await crearAdministradorInicial(entrada, password);
            } else {
                perfil = await buscarPerfilPersonal(entrada);
            }

            if (perfil && !esAdminInicial) {
                if ((perfil.estado || "Activo") !== "Activo") {
                    alert("Este usuario está inactivo. Contacta al administrador.");
                    return;
                }
                await auth.signInWithEmailAndPassword(perfil.correo, password);
            }

            if (!perfil) {
                const cliente = await buscarPerfilCliente(entrada);
                if (!cliente) {
                    alert("❌ Usuario o contraseña incorrectos.");
                    return;
                }
                if ((cliente.estado || "Activo") !== "Activo") {
                    alert("Este cliente está dado de baja. Contacte al despacho.");
                    return;
                }

                if (cliente.portalHabilitado === true || cliente.authUid) {
                    const credencialCliente = await auth.signInWithEmailAndPassword(cliente.correo, password);
                    const uidAutenticado = credencialCliente.user.uid;

                    // Repara automáticamente clientes anteriores que no tenían authUid.
                    if (cliente.authUid !== uidAutenticado) {
                        await obtenerServicios().db.collection("clientes").doc(String(cliente.id)).set({
                            authUid: uidAutenticado,
                            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                        cliente.authUid = uidAutenticado;
                    }
                } else {
                    // Compatibilidad temporal con registros anteriores.
                    const passwordCliente = cliente?.password ?? cliente?.pass ?? "";
                    if (String(passwordCliente) !== String(password)) {
                        alert("❌ Usuario o contraseña incorrectos.");
                        return;
                    }
                }
                guardarSesion(cliente, recordar);
            } else {
                guardarSesion(perfil, recordar);
            }

            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Error iniciando sesión:", error);
            const mensajes = {
                "auth/invalid-credential": "Usuario o contraseña incorrectos.",
                "auth/wrong-password": "Usuario o contraseña incorrectos.",
                "auth/user-not-found": "El usuario no existe en Firebase Authentication.",
                "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
                "auth/network-request-failed": "No fue posible conectar con Firebase. Revisa tu internet."
            };
            alert(mensajes[error.code] || `No fue posible iniciar sesión: ${error.message}`);
        } finally {
            establecerEstadoFormulario(false);
        }
    }

    function leerSesion() {
        const data = localStorage.getItem(CLAVE_SESION_LOCAL) || sessionStorage.getItem(CLAVE_SESION_TEMPORAL);
        if (!data) return null;
        try { return JSON.parse(data); }
        catch { cerrarSesion(false); return null; }
    }

    function verificarSesion() {
        const sesion = leerSesion();
        if (!sesion) {
            const login = window.location.pathname.endsWith("/") || window.location.pathname.endsWith("index.html");
            if (!login) window.location.replace("index.html");
            return null;
        }
        sessionStorage.setItem(CLAVE_SESION_TEMPORAL, JSON.stringify(sesion));
        return sesion;
    }

    async function cerrarSesion(redirigir = true) {
        localStorage.removeItem(CLAVE_SESION_LOCAL);
        sessionStorage.removeItem(CLAVE_SESION_TEMPORAL);
        try { await window.firebaseAuth?.signOut(); } catch (error) { console.warn(error); }
        if (redirigir) window.location.replace("index.html");
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("login-form")?.addEventListener("submit", procesarLogin);
    });

    window.procesarLogin = procesarLogin;
    window.verificarSesion = verificarSesion;
    window.obtenerUsuarioSesion = leerSesion;
    window.cerrarSesion = cerrarSesion;
})();
