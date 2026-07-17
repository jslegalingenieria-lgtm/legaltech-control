/**
 * JS LegalTech Control
 * Login Firestore con migración inicial del administrador.
 *
 * Requiere:
 *   firebase-app-compat.js
 *   firebase-firestore-compat.js
 *   js/firebase.js
 */

(() => {
    "use strict";

    const CLAVE_SESION_LOCAL = "js_legal_session";
    const CLAVE_SESION_TEMPORAL = "js_legal_usuario";

    // Acceso inicial únicamente para migrar al administrador antiguo.
    // Después de confirmar que el documento aparece en Firestore,
    // puedes eliminar este bloque y la función migrarAdministradorInicial.
    const ADMIN_INICIAL = {
        usuario: "Administrador",
        nombre: "Administrador",
        rol: "Administrador",
        pass: "admin2026"
    };

    function obtenerDB() {
        if (!window.db) {
            throw new Error(
                "Firestore no está disponible. Verifica que firebase.js se cargue antes de auth.js."
            );
        }
        return window.db;
    }

    function normalizarTexto(valor) {
        return String(valor || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function normalizarNombre(valor) {
        return normalizarTexto(valor)
            .replace(/\s+/g, "")
            .replace(/\./g, "");
    }

    function construirSesion(id, datos, rolForzado = null) {
        return {
            id: String(id),
            nombre: datos.nombre || "Usuario",
            rol: rolForzado || datos.rol || "Cliente",
            usuario: datos.usuario || datos.correo || normalizarNombre(datos.nombre),
            token:
                "tk_" +
                Date.now().toString(36) +
                "_" +
                Math.random().toString(36).slice(2, 10),
            inicioSesion: new Date().toISOString()
        };
    }

    function guardarSesion(sesion, recordar = true) {
        sessionStorage.setItem(
            CLAVE_SESION_TEMPORAL,
            JSON.stringify(sesion)
        );

        if (recordar) {
            localStorage.setItem(
                CLAVE_SESION_LOCAL,
                JSON.stringify(sesion)
            );
        } else {
            localStorage.removeItem(CLAVE_SESION_LOCAL);
        }
    }

    async function buscarPersonal(usuarioInput, passwordInput) {
        const db = obtenerDB();
        const usuarioNormalizado = normalizarTexto(usuarioInput);
        const snapshot = await db.collection("personal").get();

        const documento = snapshot.docs.find(doc => {
            const datos = doc.data();
            const usuario = normalizarTexto(datos.usuario || datos.correo);
            return usuario === usuarioNormalizado;
        });

        if (!documento) return null;

        const datos = documento.data();
        const passwordGuardado =
            datos.pass ??
            datos.password ??
            datos.contrasena ??
            datos.contraseña ??
            "";

        if (String(passwordGuardado) !== String(passwordInput)) {
            return null;
        }

        return construirSesion(documento.id, datos);
    }

    async function buscarCliente(usuarioInput, passwordInput) {
        const db = obtenerDB();
        const entradaNormalizada = normalizarTexto(usuarioInput);
        const entradaComoNombre = normalizarNombre(usuarioInput);
        const snapshot = await db.collection("clientes").get();

        const documento = snapshot.docs.find(doc => {
            const datos = doc.data();

            return (
                normalizarTexto(datos.correo) === entradaNormalizada ||
                normalizarTexto(datos.usuario) === entradaNormalizada ||
                normalizarNombre(datos.nombre) === entradaComoNombre
            );
        });

        if (!documento) return null;

        const datos = documento.data();
        const passwordGuardado =
            datos.password ??
            datos.pass ??
            datos.contrasena ??
            datos.contraseña ??
            "";

        if (String(passwordGuardado) !== String(passwordInput)) {
            return null;
        }

        return construirSesion(documento.id, datos, "Cliente");
    }

    async function migrarAdministradorInicial(usuarioInput, passwordInput) {
        const usuarioCoincide =
            normalizarTexto(usuarioInput) === normalizarTexto(ADMIN_INICIAL.usuario);
        const passwordCoincide =
            String(passwordInput) === String(ADMIN_INICIAL.pass);

        if (!usuarioCoincide || !passwordCoincide) {
            return null;
        }

        const db = obtenerDB();

        const existente = await db
            .collection("personal")
            .where("usuario", "==", ADMIN_INICIAL.usuario)
            .limit(1)
            .get();

        let idDocumento;

        if (existente.empty) {
            const referencia = await db.collection("personal").add({
                usuario: ADMIN_INICIAL.usuario,
                nombre: ADMIN_INICIAL.nombre,
                rol: ADMIN_INICIAL.rol,
                pass: ADMIN_INICIAL.pass,
                estado: "Activo",
                fechaRegistro: new Date().toISOString()
            });

            idDocumento = referencia.id;
            console.log("Administrador inicial migrado a Firestore.");
        } else {
            idDocumento = existente.docs[0].id;
        }

        return construirSesion(idDocumento, ADMIN_INICIAL);
    }

    function establecerEstadoFormulario(procesando) {
        const boton = document.querySelector(
            '#login-form button[type="submit"]'
        );

        if (!boton) return;

        boton.disabled = procesando;
        boton.textContent = procesando
            ? "Verificando..."
            : "Iniciar sesión";
    }

    async function procesarLogin(event) {
        if (event) event.preventDefault();

        const usuarioInput =
            document.getElementById("usuario")?.value.trim() || "";
        const passwordInput =
            document.getElementById("password")?.value || "";
        const recordar =
            document.getElementById("recordar-sesion")?.checked ?? true;

        if (!usuarioInput || !passwordInput) {
            alert("Escribe tu usuario y contraseña.");
            return;
        }

        establecerEstadoFormulario(true);

        try {
            let sesion = await buscarPersonal(usuarioInput, passwordInput);

            if (!sesion) {
                sesion = await buscarCliente(usuarioInput, passwordInput);
            }

            if (!sesion) {
                sesion = await migrarAdministradorInicial(
                    usuarioInput,
                    passwordInput
                );
            }

            if (!sesion) {
                alert(
                    "❌ Usuario o contraseña incorrectos. Verifica tus datos."
                );
                return;
            }

            guardarSesion(sesion, recordar);
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Error iniciando sesión:", error);
            alert(
                "No fue posible consultar Firebase. Abre la consola con F12 para revisar el error."
            );
        } finally {
            establecerEstadoFormulario(false);
        }
    }

    function leerSesion() {
        const sesionData =
            localStorage.getItem(CLAVE_SESION_LOCAL) ||
            sessionStorage.getItem(CLAVE_SESION_TEMPORAL);

        if (!sesionData) return null;

        try {
            return JSON.parse(sesionData);
        } catch (error) {
            cerrarSesion(false);
            return null;
        }
    }

    function verificarSesion() {
        const sesion = leerSesion();

        if (!sesion) {
            const esPaginaLogin =
                window.location.pathname.endsWith("/") ||
                window.location.pathname.endsWith("index.html");

            if (!esPaginaLogin) {
                window.location.replace("index.html");
            }
            return null;
        }

        sessionStorage.setItem(
            CLAVE_SESION_TEMPORAL,
            JSON.stringify(sesion)
        );

        return sesion;
    }

    function cerrarSesion(redirigir = true) {
        localStorage.removeItem(CLAVE_SESION_LOCAL);
        sessionStorage.removeItem(CLAVE_SESION_TEMPORAL);

        if (redirigir) {
            window.location.replace("index.html");
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const formulario = document.getElementById("login-form");

        if (formulario) {
            formulario.addEventListener("submit", procesarLogin);
        }
    });

    window.procesarLogin = procesarLogin;
    window.verificarSesion = verificarSesion;
    window.obtenerUsuarioSesion = leerSesion;
    window.cerrarSesion = cerrarSesion;
})();
