/**
 * JS LegalTech Control
 * Módulo de Personal sincronizado con Cloud Firestore.
 *
 * Firestore es la fuente principal.
 * LocalStorage se conserva como caché temporal para mantener
 * compatibilidad con los módulos que todavía no han sido migrados.
 */

(() => {
    "use strict";

    const COLECCION_PERSONAL = "personal";
    const CACHE_PERSONAL = "js_legal_personal";

    let personalCache = [];
    let detenerEscuchaPersonal = null;

    function obtenerDB() {
        if (!window.db) {
            throw new Error(
                "Firestore no está disponible. Revisa js/firebase.js."
            );
        }

        return window.db;
    }

    function normalizarPersonal(id, datos = {}) {
        return {
            id: String(id),
            nombre: datos.nombre || "",
            usuario: datos.usuario || "",
            pass: datos.pass || "",
            rol: datos.rol || "Abogado",
            fechaRegistro: datos.fechaRegistro || null,
            fechaActualizacion: datos.fechaActualizacion || null
        };
    }

    function guardarCacheLocal(lista) {
        personalCache = Array.isArray(lista) ? lista : [];
        localStorage.setItem(
            CACHE_PERSONAL,
            JSON.stringify(personalCache)
        );
    }

    function obtenerPersonal() {
        if (personalCache.length) {
            return [...personalCache];
        }

        try {
            return (
                JSON.parse(localStorage.getItem(CACHE_PERSONAL)) || []
            );
        } catch (error) {
            console.error(
                "No se pudo leer la caché de personal:",
                error
            );

            return [];
        }
    }

    function obtenerPersonalBase() {
        return typeof window.USUARIOS_MOCK !== "undefined"
            ? window.USUARIOS_MOCK
            : [];
    }

    function obtenerListaCompletaPersonal() {
        const base = obtenerPersonalBase();
        const dinamico = obtenerPersonal();

        return [...base, ...dinamico];
    }

    function iniciarSincronizacionPersonal() {
        if (detenerEscuchaPersonal) return;

        try {
            const db = obtenerDB();

            detenerEscuchaPersonal = db
                .collection(COLECCION_PERSONAL)
                .orderBy("nombre")
                .onSnapshot(snapshot => {
                    const lista = snapshot.docs.map(doc =>
                        normalizarPersonal(doc.id, doc.data())
                    );

                    guardarCacheLocal(lista);
                    renderizarTablaPersonal();

                    if (
                        typeof window.actualizarSelectAbogadosAsignados ===
                        "function"
                    ) {
                        window.actualizarSelectAbogadosAsignados();
                    }

                    if (
                        typeof window.cargarAbogadosEnAsuntos ===
                        "function"
                    ) {
                        window.cargarAbogadosEnAsuntos();
                    }

                    window.dispatchEvent(
                        new CustomEvent("personalActualizado", {
                            detail: lista
                        })
                    );
                }, error => {
                    console.error(
                        "Error sincronizando personal:",
                        error
                    );

                    alert(
                        "No fue posible sincronizar el personal con Firebase."
                    );
                });

        } catch (error) {
            console.error(error);
        }
    }

    function abrirModalPersonal() {
        const modal = document.getElementById("modal-personal");
        const formulario =
            document.getElementById("form-alta-personal");

        if (!modal || !formulario) return;

        formulario.reset();

        const id = document.getElementById("personal-id");
        const titulo =
            document.getElementById("modal-personal-titulo");
        const usuario =
            document.getElementById("personal-usuario");

        if (id) id.value = "";
        if (titulo) titulo.textContent = "Alta de Personal";
        if (usuario) usuario.disabled = false;

        modal.style.display = "flex";
    }

    function cerrarModalPersonal() {
        const modal = document.getElementById("modal-personal");
        const formulario =
            document.getElementById("form-alta-personal");

        if (modal) modal.style.display = "none";
        if (formulario) formulario.reset();
    }

    async function guardarPersonal(event) {
        event.preventDefault();

        try {
            const db = obtenerDB();

            const id =
                document.getElementById("personal-id")?.value.trim() ||
                "";

            const nombre =
                document
                    .getElementById("personal-nombre")
                    ?.value.trim() || "";

            const usuario =
                document
                    .getElementById("personal-usuario")
                    ?.value.trim()
                    .toLowerCase() || "";

            const pass =
                document.getElementById("personal-pass")?.value || "";

            const rol =
                document.getElementById("personal-rol")?.value ||
                "Abogado";

            if (!nombre || !usuario || !pass || !rol) {
                alert("Completa todos los campos.");
                return;
            }

            const base = obtenerPersonalBase();
            const dinamico = obtenerPersonal();

            const existeEnBase = base.some(
                item =>
                    String(item.usuario).toLowerCase() === usuario
            );

            const existeEnDinamico = dinamico.some(
                item =>
                    String(item.usuario).toLowerCase() === usuario &&
                    String(item.id) !== String(id)
            );

            if (existeEnBase || existeEnDinamico) {
                alert(
                    "El nombre de usuario ya está registrado."
                );
                return;
            }

            const datos = {
                nombre,
                usuario,
                pass,
                rol,
                fechaActualizacion:
                    firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) {
                await db
                    .collection(COLECCION_PERSONAL)
                    .doc(String(id))
                    .set(datos, { merge: true });

                alert(
                    "Datos del personal actualizados correctamente."
                );
            } else {
                datos.fechaRegistro =
                    firebase.firestore.FieldValue.serverTimestamp();

                await db
                    .collection(COLECCION_PERSONAL)
                    .add(datos);

                alert("Personal dado de alta con éxito.");
            }

            cerrarModalPersonal();

        } catch (error) {
            console.error(
                "Error guardando personal:",
                error
            );

            alert(
                "No fue posible guardar el personal en Firebase."
            );
        }
    }

    function editarPersonal(id) {
        const empleado = obtenerPersonal().find(
            item => String(item.id) === String(id)
        );

        if (!empleado) {
            alert("No se encontró el registro.");
            return;
        }

        const modal = document.getElementById("modal-personal");
        const titulo =
            document.getElementById("modal-personal-titulo");

        document.getElementById("personal-id").value =
            empleado.id;

        document.getElementById("personal-nombre").value =
            empleado.nombre || "";

        document.getElementById("personal-usuario").value =
            empleado.usuario || "";

        document.getElementById("personal-pass").value =
            empleado.pass || "";

        document.getElementById("personal-rol").value =
            empleado.rol || "Abogado";

        if (titulo) titulo.textContent = "Modificar Personal";
        if (modal) modal.style.display = "flex";
    }

    async function eliminarPersonal(id) {
        const empleado = obtenerPersonal().find(
            item => String(item.id) === String(id)
        );

        if (!empleado) {
            alert("No se encontró el registro.");
            return;
        }

        if (
            empleado.rol === "Administrador" &&
            obtenerPersonal().filter(
                item => item.rol === "Administrador"
            ).length <= 1
        ) {
            alert(
                "No se puede eliminar el único administrador dinámico."
            );
            return;
        }

        if (
            !confirm(
                "¿Estás seguro de que deseas dar de baja a este integrante del personal?"
            )
        ) {
            return;
        }

        try {
            const db = obtenerDB();

            await db
                .collection(COLECCION_PERSONAL)
                .doc(String(id))
                .delete();

            alert("Personal eliminado.");
        } catch (error) {
            console.error(
                "Error eliminando personal:",
                error
            );

            alert(
                "No fue posible eliminar el registro."
            );
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

    function renderizarTablaPersonal() {
        const cuerpo =
            document.getElementById("tabla-personal-cuerpo");

        if (!cuerpo) return;

        const listaCompleta = obtenerListaCompletaPersonal();
        cuerpo.innerHTML = "";

        if (!listaCompleta.length) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="4"
                        style="text-align:center;padding:2rem;color:#64748b;">
                        No hay personal registrado.
                    </td>
                </tr>
            `;
            return;
        }

        listaCompleta.forEach(empleado => {
            const esBase = obtenerPersonalBase().some(
                item =>
                    String(item.id) === String(empleado.id)
            );

            const fila = document.createElement("tr");
            fila.style.borderBottom = "1px solid #e2e8f0";

            fila.innerHTML = `
                <td style="padding:12px 24px;color:#1e293b;">
                    ${escaparHTML(empleado.nombre)}
                </td>

                <td style="padding:12px 24px;color:#475569;">
                    ${escaparHTML(empleado.usuario)}
                </td>

                <td style="padding:12px 24px;">
                    <span style="
                        padding:4px 8px;
                        border-radius:4px;
                        font-size:.85rem;
                        font-weight:600;
                        background:${
                            empleado.rol === "Administrador"
                                ? "#fee2e2"
                                : "#dbeafe"
                        };
                        color:${
                            empleado.rol === "Administrador"
                                ? "#991b1b"
                                : "#1e40af"
                        };
                    ">
                        ${escaparHTML(empleado.rol)}
                    </span>
                </td>

                <td style="padding:12px 24px;text-align:center;">
                    ${
                        esBase
                            ? `
                                <span style="
                                    color:#94a3b8;
                                    font-size:.85rem;
                                    font-style:italic;
                                ">
                                    Protegido (Sistema)
                                </span>
                              `
                            : `
                                <button
                                    type="button"
                                    onclick="editarPersonal('${empleado.id}')"
                                    style="
                                        background:#e2e8f0;
                                        border:none;
                                        padding:6px 12px;
                                        border-radius:4px;
                                        cursor:pointer;
                                        font-weight:600;
                                        color:#475569;
                                        margin-right:5px;
                                    ">
                                    ✏️ Editar
                                </button>

                                <button
                                    type="button"
                                    onclick="eliminarPersonal('${empleado.id}')"
                                    style="
                                        background:#fee2e2;
                                        border:none;
                                        padding:6px 12px;
                                        border-radius:4px;
                                        cursor:pointer;
                                        font-weight:600;
                                        color:#991b1b;
                                    ">
                                    🗑️ Eliminar
                                </button>
                              `
                    }
                </td>
            `;

            cuerpo.appendChild(fila);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        iniciarSincronizacionPersonal();
        renderizarTablaPersonal();
    });

    window.obtenerPersonal = obtenerPersonal;
    window.obtenerListaCompletaPersonal =
        obtenerListaCompletaPersonal;
    window.renderizarTablaPersonal = renderizarTablaPersonal;
    window.abrirModalPersonal = abrirModalPersonal;
    window.cerrarModalPersonal = cerrarModalPersonal;
    window.guardarPersonal = guardarPersonal;
    window.editarPersonal = editarPersonal;
    window.eliminarPersonal = eliminarPersonal;
})();
