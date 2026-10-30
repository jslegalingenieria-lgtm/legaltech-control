/**
 * JS LegalTech Control 3.1.0
 * Expedientes electrónicos y gestión documental con Firebase Storage.
 */
(() => {
    "use strict";

    const MAX_ARCHIVOS = 20;
    const MAX_BYTES = 10 * 1024 * 1024;
    const TIPOS = ["application/pdf", "image/jpeg", "image/png"];
    const DB_LOCAL_ARCHIVOS = "js_legaltech_archivos_locales";
    const STORE_LOCAL_ARCHIVOS = "archivos";

    // Los metadatos permanecen en Firestore; el contenido binario vive únicamente
    // en IndexedDB de este navegador y nunca se envía a Firebase Storage.
    function abrirBDLocal() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_LOCAL_ARCHIVOS, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_LOCAL_ARCHIVOS)) {
                    db.createObjectStore(STORE_LOCAL_ARCHIVOS, { keyPath: "id" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("No se pudo abrir IndexedDB."));
        });
    }

    async function guardarArchivoLocal(id, archivo, asuntoId, actuacionId = "") {
        const db = await abrirBDLocal();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_LOCAL_ARCHIVOS, "readwrite");
            tx.objectStore(STORE_LOCAL_ARCHIVOS).put({
                id: String(id), asuntoId: String(asuntoId), actuacionId: String(actuacionId || ""),
                nombre: archivo.name, tipo: archivo.type, tamano: archivo.size,
                blob: archivo, guardadoEn: new Date().toISOString()
            });
            tx.oncomplete = () => { db.close(); resolve(true); };
            tx.onerror = () => { const e=tx.error; db.close(); reject(e || new Error("No se pudo guardar el archivo localmente.")); };
            tx.onabort = () => { const e=tx.error; db.close(); reject(e || new Error("Se canceló el guardado local.")); };
        });
    }

    async function obtenerArchivoLocal(id) {
        const db = await abrirBDLocal();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_LOCAL_ARCHIVOS, "readonly");
            const req = tx.objectStore(STORE_LOCAL_ARCHIVOS).get(String(id));
            req.onsuccess = () => { const r=req.result || null; db.close(); resolve(r); };
            req.onerror = () => { const e=req.error; db.close(); reject(e); };
        });
    }

    async function eliminarArchivoLocal(id) {
        const db = await abrirBDLocal();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_LOCAL_ARCHIVOS, "readwrite");
            tx.objectStore(STORE_LOCAL_ARCHIVOS).delete(String(id));
            tx.oncomplete = () => { db.close(); resolve(true); };
            tx.onerror = () => { const e=tx.error; db.close(); reject(e); };
        });
    }

    async function abrirODescargarArchivoLocal(id, descargar = false) {
        const registro = await obtenerArchivoLocal(id);
        if (!registro?.blob) throw new Error("El archivo no está guardado en este navegador. Los adjuntos locales no se sincronizan entre equipos.");
        const url = URL.createObjectURL(registro.blob);
        if (descargar) {
            const a = document.createElement("a"); a.href=url; a.download=registro.nombre || "archivo";
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } else {
            const w = window.open(url, "_blank", "noopener");
            if (!w) { const a=document.createElement("a"); a.href=url; a.download=registro.nombre || "archivo"; a.click(); }
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
    }

    let expedientes = [];
    let expedienteSeleccionado = null;
    let documentos = [];
    let gestionDocumentalHabilitada = false;
    let escuchaDocumentos = null;
    let temporizadorAvisoCosto = null;
    let cicloConteo = 0;

    const $ = id => document.getElementById(id);
    const texto = valor => String(valor ?? "").trim();
    const escaparHTML = valor => texto(valor)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    function sesion() {
        try {
            return JSON.parse(sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session") || "null");
        } catch (_) { return null; }
    }

    function rol() { return sesion()?.rol || ""; }
    function tieneAcceso() { return rol() !== "Cliente"; }
    function esSuperadmin() { return rol() === "Superadministrador"; }
    function puedeGestionar() { return ["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado", "Pasante"].includes(rol()); }
    function listaAsuntos() { return typeof window.obtenerAsuntos === "function" ? window.obtenerAsuntos() : []; }

    function fechaComparable(valor) {
        if (!valor) return 0;
        if (typeof valor.toMillis === "function") return valor.toMillis();
        if (typeof valor.seconds === "number") return valor.seconds * 1000;
        const t = Date.parse(valor);
        return Number.isNaN(t) ? 0 : t;
    }

    function nombreCliente(asunto) {
        if (asunto.cliente) return texto(asunto.cliente);
        try {
            const clientes = typeof window.obtenerClientes === "function" ? window.obtenerClientes() : JSON.parse(localStorage.getItem("js_legal_clientes") || "[]");
            return texto(clientes.find(item => String(item.id) === String(asunto.clienteId))?.nombre || "Sin cliente");
        } catch (_) { return "Sin cliente"; }
    }

    function tamanoLegible(bytes = 0) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    }

    function fechaLegible(valor) {
        const ms = fechaComparable(valor);
        return ms ? new Date(ms).toLocaleString("es-MX") : "Sin fecha";
    }

    function llenarSelect(id, valores) {
        const select = $(id);
        if (!select) return;
        const actual = select.value;
        const primera = select.options[0]?.outerHTML || '<option value="">Todos</option>';
        select.innerHTML = primera + [...new Set(valores.filter(Boolean))].sort((a,b) => a.localeCompare(b, "es"))
            .map(v => `<option value="${escaparHTML(v)}">${escaparHTML(v)}</option>`).join("");
        if ([...select.options].some(o => o.value === actual)) select.value = actual;
    }

    function aplicarFiltros() {
        const q = texto($("exp-filtro-texto")?.value).toLowerCase();
        const materia = texto($("exp-filtro-materia")?.value);
        const estado = texto($("exp-filtro-estado")?.value);
        const orden = $("exp-orden")?.value || "reciente";
        let resultado = expedientes.filter(asunto => {
            const bolsa = [asunto.folioInterno, asunto.expediente, nombreCliente(asunto), asunto.materia, asunto.accion, asunto.juzgado, asunto.estado]
                .map(texto).join(" ").toLowerCase();
            return (!q || bolsa.includes(q)) && (!materia || asunto.materia === materia) && (!estado || asunto.estado === estado);
        });
        resultado.sort((a,b) => {
            if (orden === "antiguo") return fechaComparable(a.fechaRegistro) - fechaComparable(b.fechaRegistro);
            if (orden === "expediente") return texto(a.expediente || a.folioInterno).localeCompare(texto(b.expediente || b.folioInterno), "es", {numeric:true});
            if (orden === "cliente") return nombreCliente(a).localeCompare(nombreCliente(b), "es");
            return fechaComparable(b.fechaRegistro) - fechaComparable(a.fechaRegistro);
        });
        renderizarTabla(resultado);
    }

    function renderizarTabla(lista) {
        const cuerpo = $("expedientes-tabla-cuerpo");
        if (!cuerpo) return;
        cuerpo.innerHTML = lista.map(asunto => {
            const actuaciones = Array.isArray(asunto.actuaciones) ? asunto.actuaciones.length : 0;
            const archivos = Number(asunto.totalDocumentosActivos || 0);
            return `<tr data-expediente-id="${escaparHTML(asunto.id)}">
                <td><strong>${escaparHTML(asunto.folioInterno || asunto.id)}</strong></td>
                <td>${escaparHTML(asunto.expediente || "Pendiente")}</td><td>${escaparHTML(nombreCliente(asunto))}</td>
                <td>${escaparHTML(asunto.materia || "Sin materia")}</td><td>${escaparHTML(asunto.accion || "Sin especificar")}</td>
                <td>${escaparHTML(asunto.juzgado || "Sin asignar")}</td>
                <td><span class="exp-estado exp-estado-${texto(asunto.estado).toLowerCase().replace(/[^a-z0-9]+/g,"-")}">${escaparHTML(asunto.estado || "En proceso")}</span></td>
                <td><button type="button" class="exp-accion" data-accion="bitacora" data-id="${escaparHTML(asunto.id)}">📋 ${actuaciones}</button></td>
                <td><button type="button" class="exp-accion" data-accion="archivos" data-id="${escaparHTML(asunto.id)}">📎 ${archivos}</button></td>
            </tr>`;
        }).join("");
        $("expedientes-vacio").hidden = lista.length > 0;
        $("expedientes-contador").textContent = `${lista.length} expediente${lista.length === 1 ? "" : "s"}`;
    }

    async function cargarConfiguracion() {
        try {
            const doc = await window.db.collection("configuracion").doc("sistema").get();
            gestionDocumentalHabilitada = doc.exists && doc.data().gestionDocumentalHabilitada === true;
        } catch (error) {
            console.warn("No fue posible leer la configuración documental:", error);
            gestionDocumentalHabilitada = false;
        }
        actualizarControlesDocumentales();
        window.dispatchEvent(new CustomEvent("gestionDocumentalActualizada", {detail:{habilitada: gestionDocumentalHabilitada}}));
    }

    function actualizarControlesDocumentales() {
        const toggle = $("dashboard-gestion-documental");
        if (toggle) {
            toggle.hidden = !esSuperadmin();
            toggle.style.display = esSuperadmin() ? "block" : "none";
            toggle.classList.toggle("esta-activa", gestionDocumentalHabilitada);
            toggle.classList.toggle("esta-inactiva", !gestionDocumentalHabilitada);
        }
        const check = $("dashboard-storage-habilitado");
        if (check) {
            check.checked = gestionDocumentalHabilitada;
            check.setAttribute("aria-checked", String(gestionDocumentalHabilitada));
        }
        const estado = $("dashboard-storage-estado");
        if (estado) estado.textContent = gestionDocumentalHabilitada ? "Activada · almacenamiento local" : "Desactivada";
        const avisoCosto = $("dashboard-storage-aviso");
        if (avisoCosto && !gestionDocumentalHabilitada) {
            avisoCosto.hidden = true;
            avisoCosto.classList.remove("visible");
            if (temporizadorAvisoCosto) {
                clearTimeout(temporizadorAvisoCosto);
                temporizadorAvisoCosto = null;
            }
        }

        const carga = $("exp-carga-documental");
        if (carga) carga.hidden = !(gestionDocumentalHabilitada && puedeGestionar() && expedienteSeleccionado);
        const aviso = $("exp-documentos-aviso");
        if (aviso) {
            aviso.hidden = gestionDocumentalHabilitada;
            aviso.textContent = "La gestión documental está desactivada. Al activarla, los archivos nuevos se guardarán localmente en este navegador (IndexedDB), sin Firebase Storage.";
        }
    }

    function mostrarAvisoCostoTemporal() {
        const avisoCosto = $("dashboard-storage-aviso");
        if (!avisoCosto) return;

        if (temporizadorAvisoCosto) clearTimeout(temporizadorAvisoCosto);
        avisoCosto.hidden = false;
        avisoCosto.classList.remove("visible");
        requestAnimationFrame(() => avisoCosto.classList.add("visible"));

        temporizadorAvisoCosto = setTimeout(() => {
            avisoCosto.classList.remove("visible");
            setTimeout(() => { avisoCosto.hidden = true; }, 250);
            temporizadorAvisoCosto = null;
        }, 9000);
    }

    async function cambiarConfiguracion(event) {
        if (!esSuperadmin()) return;
        const habilitada = event.target.checked;
        try {
            await window.db.collection("configuracion").doc("sistema").set({
                gestionDocumentalHabilitada: habilitada,
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
                actualizadoPor: sesion()?.usuario || sesion()?.correo || sesion()?.id || ""
            }, {merge:true});
            gestionDocumentalHabilitada = habilitada;
            actualizarControlesDocumentales();
            if (habilitada) mostrarAvisoCostoTemporal();
            window.dispatchEvent(new CustomEvent("gestionDocumentalActualizada", {detail:{habilitada}}));
        } catch (error) {
            event.target.checked = !habilitada;
            alert(`No fue posible actualizar la configuración: ${error.message}`);
        }
    }

    function renderizarDetalle(asunto, enfocarArchivos = false) {
        expedienteSeleccionado = asunto;
        const actuaciones = Array.isArray(asunto.actuaciones) ? [...asunto.actuaciones] : [];
        actuaciones.sort((a,b) => fechaComparable(b.fecha || b.fechaRegistro) - fechaComparable(a.fecha || a.fechaRegistro));
        $("exp-detalle-titulo").textContent = asunto.expediente || asunto.folioInterno || asunto.id;
        $("exp-detalle-datos").innerHTML = [["Cliente", nombreCliente(asunto)], ["Materia", asunto.materia], ["Juicio o acción", asunto.accion],
            ["Juzgado", asunto.juzgado], ["Estado", asunto.estado], ["Abogado responsable", asunto.abogadoAsignado]]
            .map(([k,v]) => `<div><span>${escaparHTML(k)}</span><strong>${escaparHTML(v || "No especificado")}</strong></div>`).join("");
        $("exp-detalle-actuaciones").innerHTML = actuaciones.length ? actuaciones.map(act => `<article>
            <div class="exp-act-fecha">${escaparHTML(act.fecha || act.fechaRegistro || "Sin fecha")}${act.hora ? ` · ${escaparHTML(act.hora)}` : ""}</div>
            <h5>${escaparHTML(act.tipo || "Actuación")}</h5><p>${escaparHTML(act.descripcion || act.detalle || act.notas || "Sin descripción")}</p>
        </article>`).join("") : '<p class="exp-sin-datos">Este expediente todavía no tiene actuaciones registradas.</p>';
        $("expediente-detalle").hidden = false;
        actualizarControlesDocumentales();
        escucharDocumentos(asunto.id);
        $("expediente-detalle").scrollIntoView({behavior:"smooth", block:"start"});
        if (enfocarArchivos) $("exp-detalle-archivos")?.scrollIntoView({behavior:"smooth", block:"center"});
    }

    function escucharDocumentos(asuntoId) {
        if (escuchaDocumentos) escuchaDocumentos();
        documentos = [];
        renderizarDocumentos();
        escuchaDocumentos = window.db.collection("asuntos").doc(String(asuntoId)).collection("documentos")
            .orderBy("fechaCarga", "desc")
            .onSnapshot(snapshot => {
                documentos = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
                renderizarDocumentos();
            }, error => {
                console.error("No fue posible cargar documentos:", error);
                $("exp-detalle-archivos").innerHTML = '<p class="exp-sin-datos">No fue posible consultar los documentos.</p>';
            });
    }

    function actualizarContadorLocal(asuntoId, total) {
        const id = String(asuntoId || "");
        const cantidad = Number(total || 0);

        const asuntoLista = expedientes.find(item => String(item.id) === id);
        if (asuntoLista) asuntoLista.totalDocumentosActivos = cantidad;

        if (expedienteSeleccionado && String(expedienteSeleccionado.id) === id) {
            expedienteSeleccionado.totalDocumentosActivos = cantidad;
        }

        aplicarFiltros();
    }

    function renderizarDocumentos() {
        const activos = documentos.filter(d => d.estado !== "eliminado");
        const eliminados = documentos.filter(d => d.estado === "eliminado");
        const totalBytes = activos.reduce((s,d) => s + Number(d.tamano || 0), 0);

        if (expedienteSeleccionado) {
            actualizarContadorLocal(expedienteSeleccionado.id, activos.length);
        }
        $("exp-documentos-resumen").textContent = `${activos.length} de ${MAX_ARCHIVOS} archivos · ${tamanoLegible(totalBytes)}`;
        $("exp-detalle-archivos").innerHTML = activos.length ? activos.map(d => `<div class="exp-archivo">
            <span>${d.tipo === "application/pdf" ? "📄" : "🖼️"}</span><div><strong>${escaparHTML(d.nombre)}</strong>
            <small>${tamanoLegible(d.tamano)} · ${fechaLegible(d.fechaCarga)} · ${escaparHTML(d.subidoPorNombre || d.subidoPor || "Usuario")}</small></div>
            <div class="exp-archivo-acciones">${d.localOnly
                ? `<button type="button" data-abrir-doc="${escaparHTML(d.id)}">Ver</button><button type="button" data-descargar-doc="${escaparHTML(d.id)}">Descargar</button>`
                : `<a href="${escaparHTML(d.url || "#")}" target="_blank" rel="noopener">Ver</a><a href="${escaparHTML(d.url || "#")}" download>Descargar</a>`}
            <button type="button" data-eliminar-doc="${escaparHTML(d.id)}">Eliminar</button></div></div>`).join("")
            : '<p class="exp-sin-datos">No hay archivos adjuntos en este expediente.</p>';
        $("exp-papelera").hidden = eliminados.length === 0;
        $("exp-papelera-contador").textContent = eliminados.length;
        $("exp-papelera-lista").innerHTML = eliminados.map(d => `<div class="exp-archivo exp-archivo-eliminado"><span>🗑️</span><div><strong>${escaparHTML(d.nombre)}</strong>
            <small>Eliminado ${fechaLegible(d.fechaEliminacion)} por ${escaparHTML(d.eliminadoPorNombre || d.eliminadoPor || "Usuario")}</small></div>
            <div class="exp-archivo-acciones"><button type="button" data-restaurar-doc="${escaparHTML(d.id)}">Restaurar</button>
            ${esSuperadmin() ? `<button type="button" data-borrar-doc="${escaparHTML(d.id)}">Eliminar definitivamente</button>` : ""}</div></div>`).join("");
    }

    async function subirArchivo(archivo) {
        if (!gestionDocumentalHabilitada) return alert("La gestión documental está desactivada. Actívala desde el panel de administración.");
        if (!expedienteSeleccionado) return;
        const activos = documentos.filter(d => d.estado !== "eliminado");
        if (activos.length >= MAX_ARCHIVOS) return alert(`Este expediente ya alcanzó el límite de ${MAX_ARCHIVOS} archivos.`);
        if (!TIPOS.includes(archivo.type)) return alert("Formato no permitido. Solo se aceptan PDF, JPG, JPEG y PNG.");
        if (archivo.size > MAX_BYTES) return alert("El archivo supera el límite de 10 MB.");

        const id = window.db.collection("_ids").doc().id;
        const progreso = $("exp-progreso");
        progreso.hidden = false;
        progreso.querySelector("span").style.width = "35%";
        try {
            await guardarArchivoLocal(id, archivo, expedienteSeleccionado.id);
            const usuario = sesion() || {};
            await window.db.collection("asuntos").doc(String(expedienteSeleccionado.id)).collection("documentos").doc(id).set({
                nombre: archivo.name, tipo: archivo.type, tamano: archivo.size,
                almacenamiento: "indexeddb-local", localOnly: true, url: null,
                estado: "activo", fechaCarga: firebase.firestore.FieldValue.serverTimestamp(),
                subidoPor: usuario.id || usuario.uid || usuario.usuario || usuario.correo || "",
                subidoPorNombre: usuario.nombre || usuario.usuario || usuario.correo || "Usuario"
            });
            progreso.querySelector("span").style.width = "100%";
            await actualizarConteoAsunto();
        } catch (error) {
            try { await eliminarArchivoLocal(id); } catch (_) {}
            console.error(error);
            alert(`No fue posible guardar el archivo localmente: ${error.message}`);
        } finally {
            progreso.hidden = true;
            progreso.querySelector("span").style.width = "0%";
        }
    }

    async function actualizarConteoPorAsunto(asuntoId) {
        const id = String(asuntoId || "");
        if (!id) return 0;

        const snap = await window.db.collection("asuntos").doc(id).collection("documentos").get();
        const activos = snap.docs.filter(doc => doc.data().estado !== "eliminado").length;

        await window.db.collection("asuntos").doc(id).set({
            totalDocumentosActivos: activos
        }, {merge:true});

        actualizarContadorLocal(id, activos);
        return activos;
    }

    async function actualizarConteoAsunto() {
        if (!expedienteSeleccionado) return 0;
        return actualizarConteoPorAsunto(expedienteSeleccionado.id);
    }

    async function eliminarDocumento(id) {
        if (!confirm("¿Deseas enviar este archivo a la papelera documental?")) return;
        const usuario = sesion() || {};
        await window.db.collection("asuntos").doc(String(expedienteSeleccionado.id)).collection("documentos").doc(id).set({
            estado: "eliminado", fechaEliminacion: firebase.firestore.FieldValue.serverTimestamp(),
            eliminadoPor: usuario.id || usuario.uid || usuario.usuario || usuario.correo || "",
            eliminadoPorNombre: usuario.nombre || usuario.usuario || usuario.correo || "Usuario"
        }, {merge:true});
        setTimeout(actualizarConteoAsunto, 150);
    }

    async function restaurarDocumento(id) {
        if (documentos.filter(d => d.estado !== "eliminado").length >= MAX_ARCHIVOS) return alert("No se puede restaurar porque el expediente ya tiene 20 archivos activos.");
        await window.db.collection("asuntos").doc(String(expedienteSeleccionado.id)).collection("documentos").doc(id).set({
            estado: "activo", fechaRestauracion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaEliminacion: firebase.firestore.FieldValue.delete(), eliminadoPor: firebase.firestore.FieldValue.delete(), eliminadoPorNombre: firebase.firestore.FieldValue.delete()
        }, {merge:true});
        setTimeout(actualizarConteoAsunto, 150);
    }

    async function borrarDefinitivamente(id) {
        if (!esSuperadmin() || !confirm("Esta acción eliminará definitivamente el archivo. ¿Deseas continuar?")) return;
        const doc = documentos.find(d => d.id === id);
        if (doc?.localOnly || doc?.almacenamiento === "indexeddb-local") await eliminarArchivoLocal(id);
        // Compatibilidad: no se elimina automáticamente un archivo remoto legado.
        await window.db.collection("asuntos").doc(String(expedienteSeleccionado.id)).collection("documentos").doc(id).delete();
    }

    async function sincronizarContadoresIniciales(lista, ciclo) {
        if (!window.db || !lista.length) return;
        const resultados = await Promise.allSettled(lista.map(async asunto => {
            const snap = await window.db.collection("asuntos").doc(String(asunto.id)).collection("documentos").get();
            const activos = snap.docs.filter(d => d.data().estado !== "eliminado").length;
            return { id: String(asunto.id), activos };
        }));
        if (ciclo !== cicloConteo) return;
        let cambio = false;
        resultados.forEach(r => {
            if (r.status !== "fulfilled") return;
            const asunto = expedientes.find(a => String(a.id) === r.value.id);
            if (asunto && Number(asunto.totalDocumentosActivos || 0) !== r.value.activos) {
                asunto.totalDocumentosActivos = r.value.activos;
                cambio = true;
            }
        });
        if (cambio) aplicarFiltros();
    }

    function cargarExpedientes() {
        if (!tieneAcceso()) return;
        expedientes = listaAsuntos();
        llenarSelect("exp-filtro-materia", expedientes.map(a => texto(a.materia)));
        llenarSelect("exp-filtro-estado", expedientes.map(a => texto(a.estado)));
        aplicarFiltros();
        const ciclo = ++cicloConteo;
        sincronizarContadoresIniciales(expedientes, ciclo).catch(error => console.warn("No fue posible precargar el conteo documental:", error));
    }

    function iniciar() {
        ["exp-filtro-texto", "exp-filtro-materia", "exp-filtro-estado", "exp-orden"].forEach(id => $(id)?.addEventListener(id === "exp-filtro-texto" ? "input" : "change", aplicarFiltros));
        $("exp-limpiar-filtros")?.addEventListener("click", () => { $("exp-filtro-texto").value=""; $("exp-filtro-materia").value=""; $("exp-filtro-estado").value=""; $("exp-orden").value="reciente"; aplicarFiltros(); });
        $("expedientes-tabla-cuerpo")?.addEventListener("click", event => {
            const boton = event.target.closest("button[data-id]"); const fila = event.target.closest("tr[data-expediente-id]");
            const id = boton?.dataset.id || fila?.dataset.expedienteId; const asunto = expedientes.find(item => String(item.id) === String(id));
            if (asunto) renderizarDetalle(asunto, boton?.dataset.accion === "archivos");
        });
        $("exp-cerrar-detalle")?.addEventListener("click", () => { $("expediente-detalle").hidden=true; expedienteSeleccionado=null; if (escuchaDocumentos) escuchaDocumentos(); });
        $("dashboard-storage-habilitado")?.addEventListener("change", cambiarConfiguracion);
        $("exp-input-pdf")?.addEventListener("change", e => { if (e.target.files[0]) subirArchivo(e.target.files[0]); e.target.value=""; });
        $("exp-input-imagen")?.addEventListener("change", e => { if (e.target.files[0]) subirArchivo(e.target.files[0]); e.target.value=""; });
        $("exp-detalle-archivos")?.addEventListener("click", e => {
            const b=e.target.closest("button[data-eliminar-doc]");
            const ver=e.target.closest("button[data-abrir-doc]");
            const descargar=e.target.closest("button[data-descargar-doc]");
            if (b) eliminarDocumento(b.dataset.eliminarDoc);
            if (ver) abrirODescargarArchivoLocal(ver.dataset.abrirDoc, false).catch(err => alert(err.message));
            if (descargar) abrirODescargarArchivoLocal(descargar.dataset.descargarDoc, true).catch(err => alert(err.message));
        });
        $("exp-papelera-lista")?.addEventListener("click", e => { const r=e.target.closest("button[data-restaurar-doc]"); const b=e.target.closest("button[data-borrar-doc]"); if(r) restaurarDocumento(r.dataset.restaurarDoc); if(b) borrarDefinitivamente(b.dataset.borrarDoc); });
        window.addEventListener("asuntosActualizados", () => cargarExpedientes());
        cargarConfiguracion(); cargarExpedientes();
    }


    window.JSLegalDocumentos = {
        estaHabilitada: () => gestionDocumentalHabilitada,
        recargarConfiguracion: cargarConfiguracion,
        subirArchivoActuacion: async (asuntoId, actuacionId, archivo) => {
            if (!gestionDocumentalHabilitada) throw new Error("La gestión documental está desactivada. Actívala desde el panel de administración.");
            if (!TIPOS.includes(archivo.type)) throw new Error("Formato no permitido. Solo PDF, JPG, JPEG y PNG.");
            if (archivo.size > MAX_BYTES) throw new Error("El archivo supera el límite de 10 MB.");
            const coleccion = window.db.collection("asuntos").doc(String(asuntoId)).collection("documentos");
            const activos = await coleccion.where("estado", "==", "activo").get();
            if (activos.size >= MAX_ARCHIVOS) throw new Error(`El expediente ya alcanzó el límite de ${MAX_ARCHIVOS} archivos activos.`);
            const id = window.db.collection("_ids").doc().id;
            await guardarArchivoLocal(id, archivo, asuntoId, actuacionId);
            const usuario = sesion() || {};
            try {
                await coleccion.doc(id).set({
                    nombre: archivo.name, tipo: archivo.type, tamano: archivo.size,
                    almacenamiento: "indexeddb-local", localOnly: true, url: null,
                    estado: "activo", actuacionId: String(actuacionId), origen: "actuacion",
                    fechaCarga: firebase.firestore.FieldValue.serverTimestamp(),
                    subidoPor: usuario.id || usuario.uid || usuario.usuario || usuario.correo || "",
                    subidoPorNombre: usuario.nombre || usuario.usuario || usuario.correo || "Usuario"
                });
            } catch (error) {
                await eliminarArchivoLocal(id);
                throw error;
            }
            await actualizarConteoPorAsunto(asuntoId);
            return {id, nombre: archivo.name, localOnly: true};
        }
    };

    document.addEventListener("DOMContentLoaded", iniciar);
    window.cargarExpedientes = cargarExpedientes;
})();
