/**
 * JS LegalTech Control - Entrevistas Jurídicas
 * Guarda entrevistas en Firestore y permite convertirlas en asuntos.
 */
(() => {
  "use strict";

  const COLECCION = "entrevistas";
  const CACHE = "js_legal_entrevistas";
  let entrevistas = [];
  let cancelarEscucha = null;

  const $ = id => document.getElementById(id);
  const sesion = () => {
    try {
      const raw = sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session");
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  };
  const esc = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const fechaTexto = value => {
    if (!value) return "";
    const d = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("es-MX", {year:"numeric",month:"short",day:"2-digit"});
  };
  const responsableSesion = u => u?.rol === "Pasante" ? (u.abogadoSupervisorUsuario || "") : (["Abogado"].includes(u?.rol) ? (u.usuario || "") : "");

  function guardarCache() {
    localStorage.setItem(CACHE, JSON.stringify(entrevistas.map(x => ({...x, fechaRegistro: x.fechaRegistro?.toDate?.()?.toISOString?.() || x.fechaRegistro || null}))));
  }

  function poblarClientes() {
    const select = $("ent-cliente-id");
    if (!select) return;
    const actual = select.value;
    const clientes = typeof window.obtenerClientes === "function" ? window.obtenerClientes() : [];
    select.innerHTML = '<option value="">-- Prospecto sin cliente registrado --</option>' + clientes
      .filter(c => c.estado !== "Baja")
      .map(c => `<option value="${esc(c.id)}">${esc(c.nombre || "Cliente sin nombre")}</option>`).join("");
    if ([...select.options].some(o => o.value === actual)) select.value = actual;
  }

  function poblarAbogados() {
    const select = $("ent-abogado");
    if (!select) return;
    const u = sesion();
    const responsable = responsableSesion(u);
    const personal = JSON.parse(localStorage.getItem("js_legal_personal") || "[]");
    const opciones = personal.filter(p => p.estado !== "Baja" && ["Abogado","Administrador","Superadministrador"].includes(p.rol));
    select.innerHTML = '<option value="">-- Selecciona responsable --</option>' + opciones.map(p => `<option value="${esc(p.usuario || p.id)}">${esc(p.nombre || p.usuario || "Abogado")}</option>`).join("");
    if (responsable) {
      if (![...select.options].some(o => o.value === responsable)) select.add(new Option(u?.nombre || responsable, responsable));
      select.value = responsable;
      select.disabled = true;
    } else select.disabled = false;
  }

  function limpiarFormulario() {
    $("form-entrevista")?.reset();
    if ($("ent-id")) $("ent-id").value = "";
    if ($("ent-fecha")) $("ent-fecha").value = new Date().toISOString().slice(0,10);
    if ($("ent-estado")) $("ent-estado").value = "Pendiente de decisión";
    $("ent-form-titulo").textContent = "Nueva entrevista jurídica";
    poblarClientes();
    poblarAbogados();
  }

  function leerFormulario() {
    const clienteId = $("ent-cliente-id")?.value || "";
    const clientes = typeof window.obtenerClientes === "function" ? window.obtenerClientes() : [];
    const cliente = clientes.find(c => String(c.id) === String(clienteId));
    const u = sesion();
    const abogadoAsignado = $("ent-abogado")?.value || responsableSesion(u);
    return {
      clienteId,
      cliente: cliente?.nombre || "",
      prospectoNombre: $("ent-prospecto")?.value.trim() || cliente?.nombre || "",
      telefono: $("ent-telefono")?.value.trim() || cliente?.telefono || "",
      correo: $("ent-correo")?.value.trim() || cliente?.correo || "",
      fecha: $("ent-fecha")?.value || new Date().toISOString().slice(0,10),
      materia: $("ent-materia")?.value || "",
      procedimiento: $("ent-procedimiento")?.value.trim() || "",
      origen: $("ent-origen")?.value || "Otro",
      relatoHechos: $("ent-hechos")?.value.trim() || "",
      diagnostico: $("ent-diagnostico")?.value.trim() || "",
      documentos: $("ent-documentos")?.value.trim() || "",
      riesgos: $("ent-riesgos")?.value.trim() || "",
      honorarios: $("ent-honorarios")?.value.trim() || "",
      estado: $("ent-estado")?.value || "Pendiente de decisión",
      abogadoAsignado,
      creadoPorUid: window.firebaseAuth?.currentUser?.uid || u?.uid || "",
      creadoPor: u?.usuario || u?.correo || "",
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
  }

  async function guardarEntrevista(event) {
    event.preventDefault();
    try {
      const datos = leerFormulario();
      if (!datos.prospectoNombre || !datos.materia || !datos.procedimiento || !datos.abogadoAsignado) {
        alert("Completa nombre del prospecto, materia, procedimiento y abogado responsable.");
        return;
      }
      const id = $("ent-id")?.value || "";
      if (id) {
        await window.db.collection(COLECCION).doc(id).set(datos, {merge:true});
        alert("Entrevista actualizada correctamente.");
      } else {
        datos.folio = typeof window.siguienteConsecutivo === "function" ? await window.siguienteConsecutivo("entrevistas", "ENT") : `ENT-${Date.now()}`;
        datos.convertida = false;
        datos.asuntoId = "";
        datos.fechaRegistro = firebase.firestore.FieldValue.serverTimestamp();
        await window.db.collection(COLECCION).add(datos);
        alert("Entrevista guardada correctamente.");
      }
      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar entrevista:", error);
      alert(`No fue posible guardar la entrevista: ${error.message || error}`);
    }
  }

  function editarEntrevista(id) {
    const e = entrevistas.find(x => String(x.id) === String(id));
    if (!e) return;
    $("ent-id").value = e.id;
    $("ent-cliente-id").value = e.clienteId || "";
    $("ent-prospecto").value = e.prospectoNombre || e.cliente || "";
    $("ent-telefono").value = e.telefono || "";
    $("ent-correo").value = e.correo || "";
    $("ent-fecha").value = e.fecha || "";
    $("ent-materia").value = e.materia || "Civil";
    $("ent-procedimiento").value = e.procedimiento || "";
    $("ent-origen").value = e.origen || "Otro";
    $("ent-hechos").value = e.relatoHechos || "";
    $("ent-diagnostico").value = e.diagnostico || "";
    $("ent-documentos").value = e.documentos || "";
    $("ent-riesgos").value = e.riesgos || "";
    $("ent-honorarios").value = e.honorarios || "";
    $("ent-estado").value = e.estado || "Pendiente de decisión";
    if ($("ent-abogado")) {
      if (![...$("ent-abogado").options].some(o => o.value === e.abogadoAsignado)) $("ent-abogado").add(new Option(e.abogadoAsignado, e.abogadoAsignado));
      $("ent-abogado").value = e.abogadoAsignado || "";
    }
    $("ent-form-titulo").textContent = `Editar entrevista ${e.folio || ""}`;
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function convertirEnAsunto(id) {
    const e = entrevistas.find(x => String(x.id) === String(id));
    if (!e) return;
    if (e.convertida && e.asuntoId) {
      alert("Esta entrevista ya fue convertida en asunto.");
      window.switchTab?.("asuntos");
      return;
    }
    if (!e.clienteId) {
      alert("Para crear el asunto primero debes editar la entrevista y asociarla con un cliente registrado.");
      editarEntrevista(id);
      return;
    }
    if (!e.abogadoAsignado) {
      alert("La entrevista no tiene abogado responsable.");
      return;
    }
    if (!confirm(`Se creará un asunto de ${e.materia}: ${e.procedimiento}. ¿Continuar?`)) return;
    try {
      const folioInterno = typeof window.siguienteConsecutivo === "function" ? await window.siguienteConsecutivo("asuntos", "EXP") : `EXP-${Date.now()}`;
      const datosAsunto = {
        clienteId: e.clienteId,
        cliente: e.cliente || e.prospectoNombre,
        materia: e.materia,
        expediente: "Pendiente de asignación",
        juzgado: "Pendiente de asignación",
        accion: e.procedimiento,
        estado: "En proceso",
        activo: true,
        resumen: e.diagnostico || e.relatoHechos || "",
        entrevistaId: e.id,
        entrevistaFolio: e.folio || "",
        abogadoAsignado: e.abogadoAsignado,
        colaboradores: [],
        colaboradorIds: [],
        partes: {actor:{tipo:"fisica",nombre:e.cliente || e.prospectoNombre,representante:"",caracter:""},demandado:{tipo:"fisica",nombre:"",representante:"",caracter:""},terceroInteresado:"",autoridadResponsable:""},
        actuaciones: [],
        folioInterno,
        fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
      };
      const ref = await window.db.collection("asuntos").add(datosAsunto);
      await window.db.collection(COLECCION).doc(e.id).set({
        convertida: true,
        asuntoId: ref.id,
        estado: "Convertida en asunto",
        fechaConversion: firebase.firestore.FieldValue.serverTimestamp(),
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge:true});
      alert(`Asunto creado correctamente con folio ${folioInterno}.`);
      window.switchTab?.("asuntos");
    } catch (error) {
      console.error("Error al convertir entrevista:", error);
      alert(`No fue posible crear el asunto: ${error.message || error}`);
    }
  }

  function renderizar() {
    const cont = $("entrevistas-lista");
    if (!cont) return;
    const q = ($("entrevistas-buscar")?.value || "").toLowerCase().trim();
    const lista = entrevistas.filter(e => !q || [e.folio,e.prospectoNombre,e.cliente,e.materia,e.procedimiento,e.estado].join(" ").toLowerCase().includes(q));
    if (!lista.length) {
      cont.innerHTML = '<div class="entrevista-vacio">No hay entrevistas que coincidan con la búsqueda.</div>';
      return;
    }
    cont.innerHTML = lista.map(e => `<article class="entrevista-card">
      <div style="display:flex;justify-content:space-between;gap:.75rem;align-items:flex-start">
        <div><h4>${esc(e.prospectoNombre || e.cliente || "Sin nombre")}</h4><div class="entrevista-meta"><span>${esc(e.folio || "Sin folio")}</span><span>${esc(e.materia)}</span><span>${esc(e.procedimiento)}</span><span>${esc(fechaTexto(e.fecha || e.fechaRegistro))}</span></div></div>
        <span class="entrevista-chip ${e.convertida ? "convertida" : "pendiente"}">${esc(e.convertida ? "Convertida" : e.estado || "Pendiente")}</span>
      </div>
      <div class="entrevista-card-actions">
        <button type="button" class="btn-secondary" onclick="editarEntrevista('${esc(e.id)}')">Editar</button>
        <button type="button" class="btn-primary" ${e.convertida ? "disabled" : ""} onclick="convertirEntrevistaEnAsunto('${esc(e.id)}')">${e.convertida ? "Asunto creado" : "Crear asunto"}</button>
      </div>
    </article>`).join("");
  }

  function iniciarEscucha() {
    if (cancelarEscucha || !window.db) return;
    const u = sesion();
    let consulta = window.db.collection(COLECCION).orderBy("fechaRegistro", "desc");
    if (["Abogado","Pasante"].includes(u?.rol)) consulta = window.db.collection(COLECCION).where("abogadoAsignado", "==", responsableSesion(u));
    cancelarEscucha = consulta.onSnapshot(snapshot => {
      entrevistas = snapshot.docs.map(doc => ({id:doc.id,...doc.data()})).sort((a,b) => (b.fechaRegistro?.toMillis?.() || 0) - (a.fechaRegistro?.toMillis?.() || 0));
      guardarCache();
      renderizar();
    }, error => {
      console.error("Error sincronizando entrevistas:", error);
      try { entrevistas = JSON.parse(localStorage.getItem(CACHE) || "[]"); } catch (_) { entrevistas = []; }
      renderizar();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("form-entrevista")?.addEventListener("submit", guardarEntrevista);
    $("btn-limpiar-entrevista")?.addEventListener("click", limpiarFormulario);
    $("entrevistas-buscar")?.addEventListener("input", renderizar);
    $("ent-cliente-id")?.addEventListener("change", () => {
      const cliente = (window.obtenerClientes?.() || []).find(c => String(c.id) === String($("ent-cliente-id").value));
      if (cliente) {
        $("ent-prospecto").value = cliente.nombre || "";
        $("ent-telefono").value = cliente.telefono || "";
        $("ent-correo").value = cliente.correo || "";
      }
    });
    limpiarFormulario();
    iniciarEscucha();
    window.addEventListener("clientesActualizados", poblarClientes);
  });

  window.editarEntrevista = editarEntrevista;
  window.convertirEntrevistaEnAsunto = convertirEnAsunto;
  window.cargarEntrevistas = () => { poblarClientes(); poblarAbogados(); iniciarEscucha(); renderizar(); };
})();
