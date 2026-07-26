/**
 * JS LegalTech Control Light
 * Respaldo administrativo de Firestore en formato Excel.
 *
 * Seguridad:
 * - El botón solo se habilita para Administrador o Superadministrador.
 * - No exporta contraseñas ni otros secretos de autenticación.
 */
(() => {
    "use strict";

    const COLECCIONES = ["clientes", "asuntos", "agenda", "personal"];

    function obtenerUsuarioActivo() {
        try {
            const sesion =
                sessionStorage.getItem("js_legal_usuario") ||
                localStorage.getItem("js_legal_session");
            return sesion ? JSON.parse(sesion) : null;
        } catch (error) {
            console.error("No fue posible leer la sesión:", error);
            return null;
        }
    }

    function esAdministrador() {
        return ["Administrador", "Superadministrador"].includes(obtenerUsuarioActivo()?.rol);
    }

    function normalizarFecha(valor) {
        if (!valor) return "";
        try {
            if (typeof valor.toDate === "function") {
                return valor.toDate().toLocaleString("es-MX");
            }
            if (valor instanceof Date) return valor.toLocaleString("es-MX");
            if (typeof valor === "object" && Number.isFinite(valor.seconds)) {
                return new Date(valor.seconds * 1000).toLocaleString("es-MX");
            }
            return String(valor);
        } catch (_) {
            return String(valor);
        }
    }

    function valorPlano(valor) {
        if (valor === null || valor === undefined) return "";
        if (typeof valor?.toDate === "function") return normalizarFecha(valor);
        if (valor instanceof Date) return normalizarFecha(valor);
        if (Array.isArray(valor)) {
            return valor.map(item =>
                typeof item === "object" ? JSON.stringify(limpiarObjeto(item)) : String(item)
            ).join(" | ");
        }
        if (typeof valor === "object") return JSON.stringify(limpiarObjeto(valor));
        return valor;
    }

    function limpiarObjeto(datos = {}, camposExcluidos = []) {
        const excluidos = new Set([
            "password", "contrasena", "contraseña", "pass", "passwordHash",
            "token", "refreshToken", ...camposExcluidos
        ]);
        return Object.fromEntries(
            Object.entries(datos)
                .filter(([clave]) => !excluidos.has(clave))
                .map(([clave, valor]) => [clave, valorPlano(valor)])
        );
    }

    async function leerColeccion(nombre) {
        const snapshot = await window.db.collection(nombre).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    function ordenarColumnas(filas, preferidas = []) {
        if (!filas.length) return [];
        const todas = new Set();
        filas.forEach(fila => Object.keys(fila).forEach(clave => todas.add(clave)));
        const restantes = [...todas]
            .filter(clave => !preferidas.includes(clave))
            .sort((a, b) => a.localeCompare(b, "es"));
        return [...preferidas.filter(clave => todas.has(clave)), ...restantes];
    }

    function crearHoja(filas, preferidas = []) {
        const datos = filas.length ? filas : [{ Información: "Sin registros" }];
        const columnas = ordenarColumnas(datos, preferidas);
        const hoja = XLSX.utils.json_to_sheet(datos, { header: columnas });

        hoja["!autofilter"] = { ref: hoja["!ref"] || "A1:A1" };
        hoja["!freeze"] = { xSplit: 0, ySplit: 1 };
        hoja["!cols"] = columnas.map(columna => {
            const maximo = Math.max(
                columna.length,
                ...datos.map(fila => String(fila[columna] ?? "").length)
            );
            return { wch: Math.min(Math.max(maximo + 2, 12), 42) };
        });
        return hoja;
    }

    function aFilasActuaciones(asuntos) {
        const filas = [];
        asuntos.forEach(asunto => {
            const actuaciones = Array.isArray(asunto.actuaciones) ? asunto.actuaciones : [];
            actuaciones.forEach((actuacion, indice) => {
                filas.push({
                    asuntoId: asunto.id,
                    folioInterno: asunto.folioInterno || asunto.codigo || "",
                    expediente: asunto.expediente || "",
                    cliente: asunto.cliente || "",
                    numeroActuacion: indice + 1,
                    ...limpiarObjeto(actuacion)
                });
            });
        });
        return filas;
    }

    function agregarHoja(libro, nombre, filas, preferidas = []) {
        XLSX.utils.book_append_sheet(libro, crearHoja(filas, preferidas), nombre);
    }

    function construirResumen(datos, usuario) {
        const asuntosActivos = datos.asuntos.filter(asunto =>
            !["Concluido", "Cancelado"].includes(asunto.estado || "En proceso")
        ).length;
        const asuntosConcluidos = datos.asuntos.filter(asunto =>
            asunto.estado === "Concluido"
        ).length;
        const actuaciones = aFilasActuaciones(datos.asuntos);

        return [
            { Indicador: "Sistema", Valor: "JS LegalTech Control Light" },
            { Indicador: "Fecha y hora del respaldo", Valor: new Date().toLocaleString("es-MX") },
            { Indicador: "Administrador", Valor: usuario.nombre || usuario.usuario || usuario.correo || "Administrador" },
            { Indicador: "Total de clientes", Valor: datos.clientes.length },
            { Indicador: "Total de asuntos", Valor: datos.asuntos.length },
            { Indicador: "Asuntos activos", Valor: asuntosActivos },
            { Indicador: "Asuntos concluidos", Valor: asuntosConcluidos },
            { Indicador: "Eventos de agenda", Valor: datos.agenda.length },
            { Indicador: "Personal registrado", Valor: datos.personal.length },
            { Indicador: "Actuaciones registradas", Valor: actuaciones.length },
            { Indicador: "Nota de seguridad", Valor: "El respaldo no contiene contraseñas ni tokens de autenticación." }
        ];
    }

    function prepararClientes(clientes) {
        return clientes.map(cliente => limpiarObjeto(cliente, ["password"]));
    }

    function prepararAsuntos(asuntos) {
        return asuntos.map(asunto => limpiarObjeto(asunto, ["actuaciones", "correos"]));
    }

    function prepararPersonal(personal) {
        return personal.map(empleado => limpiarObjeto(empleado));
    }

    function nombreArchivo() {
        const ahora = new Date();
        const fecha = ahora.toISOString().slice(0, 10);
        const hora = `${String(ahora.getHours()).padStart(2, "0")}-${String(ahora.getMinutes()).padStart(2, "0")}`;
        return `JS-LegalTech-Backup-${fecha}_${hora}.xlsx`;
    }

    async function exportarBaseDatosExcel() {
        const boton = document.getElementById("btn-exportar-excel");
        const usuario = obtenerUsuarioActivo();

        if (!esAdministrador()) {
            alert("Solo el Administrador o Superadministrador puede descargar el respaldo de la base de datos.");
            return;
        }
        if (!window.db) {
            alert("Firestore no está disponible. Revisa la conexión a internet.");
            return;
        }
        if (!window.XLSX) {
            alert("No fue posible cargar el generador de Excel. Recarga la página e inténtalo nuevamente.");
            return;
        }

        const textoOriginal = boton?.textContent || "📥 Exportar Excel";
        if (boton) {
            boton.disabled = true;
            boton.textContent = "⏳ Preparando respaldo...";
        }

        try {
            const [clientes, asuntos, agenda, personal] = await Promise.all(
                COLECCIONES.map(leerColeccion)
            );
            const datos = { clientes, asuntos, agenda, personal };
            const libro = XLSX.utils.book_new();

            libro.Props = {
                Title: "Respaldo de JS LegalTech Control Light",
                Subject: "Exportación administrativa de Firestore",
                Author: usuario.nombre || "JS Legal & Ingeniería",
                CreatedDate: new Date()
            };

            agregarHoja(libro, "Resumen", construirResumen(datos, usuario), ["Indicador", "Valor"]);
            agregarHoja(libro, "Clientes", prepararClientes(clientes), [
                "id", "clienteCodigo", "nombre", "curp", "telefono", "correo",
                "direccion", "estado", "activo", "abogadoAsignado", "fechaRegistro", "fechaActualizacion"
            ]);
            agregarHoja(libro, "Asuntos", prepararAsuntos(asuntos), [
                "id", "folioInterno", "expediente", "clienteId", "cliente", "materia",
                "accion", "juzgado", "estado", "abogadoAsignado", "resumen",
                "fechaRegistro", "fechaActualizacion"
            ]);
            agregarHoja(libro, "Agenda", agenda.map(item => limpiarObjeto(item)), [
                "id", "fecha", "hora", "tipo", "titulo", "descripcion", "asuntoId",
                "expediente", "cliente", "abogadoAsignado", "estado"
            ]);
            agregarHoja(libro, "Personal", prepararPersonal(personal), [
                "id", "abogadoCodigo", "nombre", "correo", "usuario", "rol", "estado",
                "activo", "fechaAlta", "fechaModificacion"
            ]);
            agregarHoja(libro, "Actuaciones", aFilasActuaciones(asuntos), [
                "asuntoId", "folioInterno", "expediente", "cliente", "numeroActuacion",
                "fecha", "tipo", "subtipo", "descripcion", "requiereCumplimiento",
                "generaTermino", "notificarCliente", "creadoEn"
            ]);

            XLSX.writeFile(libro, nombreArchivo(), { compression: true });
        } catch (error) {
            console.error("Error exportando la base de datos:", error);
            if (error?.code === "permission-denied") {
                alert("Firestore rechazó la exportación. Verifica que la sesión corresponda a un administrador.");
            } else {
                alert("No fue posible generar el respaldo en Excel. Revisa tu conexión e inténtalo nuevamente.");
            }
        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = textoOriginal;
            }
        }
    }

    function actualizarVisibilidadBoton() {
        const boton = document.getElementById("btn-exportar-excel");
        if (!boton) return;
        boton.hidden = !esAdministrador();
    }

    document.addEventListener("DOMContentLoaded", () => {
        const boton = document.getElementById("btn-exportar-excel");
        if (!boton) return;
        actualizarVisibilidadBoton();
        boton.addEventListener("click", exportarBaseDatosExcel);
        // La sesión ya existe al entrar al dashboard, pero se vuelve a comprobar
        // después de cargar todos los módulos para evitar condiciones de carrera.
        setTimeout(actualizarVisibilidadBoton, 250);
    });
    window.addEventListener("storage", actualizarVisibilidadBoton);

    window.exportarBaseDatosExcel = exportarBaseDatosExcel;
})();
