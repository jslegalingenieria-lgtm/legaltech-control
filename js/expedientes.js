/**
 * JS LegalTech Control 3.1.0
 * Expedientes electrónicos y gestión documental con Firebase Storage.
 */
(() => {
    "use strict";

    const MAX_ARCHIVOS = 20;
    const MAX_BYTES = 10 * 1024 * 1024;
    const TIPOS = ["application/pdf", "image/jpeg", "image/png"];

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
        if (estado) estado.textContent = gestionDocumentalHabilitada ? "Activada" : "Desactivada";
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
            aviso.textContent = "La gestión documental está desactivada. Los documentos existentes continúan disponibles para consulta.";
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
            <div class="exp-archivo-acciones"><a href="${escaparHTML(d.url)}" target="_blank" rel="noopener">Ver</a>
            <a href="${escaparHTML(d.url)}" download>Descargar</a><button type="button" data-eliminar-doc="${escaparHTML(d.id)}">Eliminar</button></div></div>`).join("")
            : '<p class="exp-sin-datos">No hay archivos adjuntos en este expediente.</p>';
        $("exp-papelera").hidden = eliminados.length === 0;
        $("exp-papelera-contador").textContent = eliminados.length;
        $("exp-papelera-lista").innerHTML = eliminados.map(d => `<div class="exp-archivo exp-archivo-eliminado"><span>🗑️</span><div><strong>${escaparHTML(d.nombre)}</strong>
            <small>Eliminado ${fechaLegible(d.fechaEliminacion)} por ${escaparHTML(d.eliminadoPorNombre || d.eliminadoPor || "Usuario")}</small></div>
            <div class="exp-archivo-acciones"><button type="button" data-restaurar-doc="${escaparHTML(d.id)}">Restaurar</button>
            ${esSuperadmin() ? `<button type="button" data-borrar-doc="${escaparHTML(d.id)}">Eliminar definitivamente</button>` : ""}</div></div>`).join("");
    }

    async function subirArchivo(archivo) {
        if (!gestionDocumentalHabilitada) return alert("La gestión documental está desactivada.");
        if (!expedienteSeleccionado) return;
        const activos = documentos.filter(d => d.estado !== "eliminado");
        if (activos.length >= MAX_ARCHIVOS) return alert(`Este expediente ya alcanzó el límite de ${MAX_ARCHIVOS} archivos.`);
        if (!TIPOS.includes(archivo.type)) return alert("Formato no permitido. Solo se aceptan PDF, JPG, JPEG y PNG.");
        if (archivo.size > MAX_BYTES) return alert("El archivo supera el límite de 10 MB.");
        if (!window.firebaseStorage) return alert("Firebase Storage no está disponible. Revisa la configuración del proyecto.");

        const id = window.db.collection("_ids").doc().id;
        const nombreSeguro = archivo.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const ruta = `expedientes/${expedienteSeleccionado.id}/${id}_${nombreSeguro}`;
        const referencia = window.firebaseStorage.ref().child(ruta);
        const progreso = $("exp-progreso");
        progreso.hidden = false;
        progreso.querySelector("span").style.width = "0%";

        try {
            const tarea = referencia.put(archivo, {contentType: archivo.type});
            await new Promise((resolve, reject) => tarea.on("state_changed", snapshot => {
                const porcentaje = Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100);
                progreso.querySelector("span").style.width = `${porcentaje}%`;
            }, reject, resolve));
            const url = await referencia.getDownloadURL();
            const usuario = sesion() || {};
            await window.db.collection("asuntos").doc(String(expedienteSeleccionado.id)).collection("documentos").doc(id).set({
                nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, rutaStorage: ruta, url,
                estado: "activo", fechaCarga: firebase.firestore.FieldValue.serverTimestamp(),
                subidoPor: usuario.id || usuario.uid || usuario.usuario || usuario.correo || "",
                subidoPorNombre: usuario.nombre || usuario.usuario || usuario.correo || "Usuario"
            });
            await actualizarConteoAsunto();
        } catch (error) {
            console.error(error);
            if (error?.code === "storage/unauthorized") {
                alert("Firebase Storage rechazó la carga. Despliega las reglas incluidas en esta versión con: firebase deploy --only storage,firestore:rules. Después cierra sesión, vuelve a ingresar y prueba nuevamente.");
            } else {
                alert(`No fue posible subir el archivo: ${error.message}`);
            }
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
        try {
            if (doc?.rutaStorage) await window.firebaseStorage.ref().child(doc.rutaStorage).delete();
        } catch (error) { if (error.code !== "storage/object-not-found") throw error; }
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
        $("exp-detalle-archivos")?.addEventListener("click", e => { const b=e.target.closest("button[data-eliminar-doc]"); if (b) eliminarDocumento(b.dataset.eliminarDoc); });
        $("exp-papelera-lista")?.addEventListener("click", e => { const r=e.target.closest("button[data-restaurar-doc]"); const b=e.target.closest("button[data-borrar-doc]"); if(r) restaurarDocumento(r.dataset.restaurarDoc); if(b) borrarDefinitivamente(b.dataset.borrarDoc); });
        window.addEventListener("asuntosActualizados", () => cargarExpedientes());
        cargarConfiguracion(); cargarExpedientes();
    }


    window.JSLegalDocumentos = {
        estaHabilitada: () => gestionDocumentalHabilitada,
        recargarConfiguracion: cargarConfiguracion,
        subirArchivoActuacion: async (asuntoId, actuacionId, archivo) => {
            if (!gestionDocumentalHabilitada) throw new Error("La gestión documental está desactivada.");
            if (!TIPOS.includes(archivo.type)) throw new Error("Formato no permitido. Solo PDF, JPG, JPEG y PNG.");
            if (archivo.size > MAX_BYTES) throw new Error("El archivo supera el límite de 10 MB.");
            if (!window.firebaseStorage) throw new Error("Firebase Storage no está disponible.");
            const coleccion = window.db.collection("asuntos").doc(String(asuntoId)).collection("documentos");
            const activos = await coleccion.where("estado", "==", "activo").get();
            if (activos.size >= MAX_ARCHIVOS) throw new Error(`El expediente ya alcanzó el límite de ${MAX_ARCHIVOS} archivos activos.`);
            const id = window.db.collection("_ids").doc().id;
            const nombreSeguro = archivo.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
            const ruta = `expedientes/${asuntoId}/actuaciones/${actuacionId}/${id}_${nombreSeguro}`;
            const referencia = window.firebaseStorage.ref().child(ruta);
            await referencia.put(archivo, {contentType: archivo.type, customMetadata: {asuntoId: String(asuntoId), actuacionId: String(actuacionId)}});
            const url = await referencia.getDownloadURL();
            const usuario = sesion() || {};
            await coleccion.doc(id).set({
                nombre: archivo.name, tipo: archivo.type, tamano: archivo.size, rutaStorage: ruta, url,
                estado: "activo", actuacionId: String(actuacionId), origen: "actuacion",
                fechaCarga: firebase.firestore.FieldValue.serverTimestamp(),
                subidoPor: usuario.id || usuario.uid || usuario.usuario || usuario.correo || "",
                subidoPorNombre: usuario.nombre || usuario.usuario || usuario.correo || "Usuario"
            });
            await actualizarConteoPorAsunto(asuntoId);
            return {id, nombre: archivo.name, url};
        }
    };

    document.addEventListener("DOMContentLoaded", iniciar);
    window.cargarExpedientes = cargarExpedientes;
})();
