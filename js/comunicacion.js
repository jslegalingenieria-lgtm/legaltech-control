/**
 * JS LegalTech Control v2.0 Enterprise
 * Centro de comunicación: mensajes y solicitudes de cita.
 */
(() => {
  "use strict";

  const ROLES_GESTION = ["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado"];
  let sesion = null;
  let asuntosCliente = [];
  let mensajesCache = [];
  let citasCache = [];
  let cancelarMensajes = null;
  let cancelarCitas = null;

  function obtenerSesion() {
    if (sesion) return sesion;
    try {
      sesion = JSON.parse(sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session") || "null");
    } catch (_) { sesion = null; }
    return sesion;
  }

  function esc(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function fechaLegible(valor) {
    if (!valor) return "Sin fecha";
    const fecha = valor.toDate ? valor.toDate() : new Date(valor);
    return Number.isNaN(fecha.getTime()) ? String(valor) : fecha.toLocaleString("es-MX", { dateStyle:"medium", timeStyle:"short" });
  }

  function usuarioEsResponsable(doc) {
    const u = obtenerSesion();
    if (!u) return false;
    if (["Superadministrador", "Administrador"].includes(u.rol)) return true;
    if (u.rol === "Auxiliar Jurídico") return doc.destinatarioTipo === "Administracion" || !doc.asuntoId;
    if (u.rol === "Abogado") {
      const ids = [u.uid, u.id, u.usuario, u.correo].filter(Boolean).map(v => String(v).toLowerCase());
      return [doc.abogadoUid, doc.abogadoAsignado, doc.destinatarioId].filter(Boolean)
        .some(v => ids.includes(String(v).toLowerCase()));
    }
    return false;
  }

  function inyectarPortal() {
    const vista = document.getElementById("vista-portal");
    if (!vista || document.getElementById("portal-centro-atencion")) return;
    const bloque = document.createElement("section");
    bloque.id = "portal-centro-atencion";
    bloque.className = "portal-atencion";
    bloque.innerHTML = `
      <h3>Centro de Atención</h3>
      <p>Comuníquese con el despacho o envíe una solicitud de cita.</p>
      <div class="portal-atencion-grid">
        <article class="portal-atencion-card">
          <h4>💬 Mensajes</h4>
          <p>Envíe una consulta relacionada con su expediente y consulte la respuesta del despacho.</p>
          <button type="button" class="btn-primary" id="btn-portal-mensaje">Enviar mensaje</button>
        </article>
        <article class="portal-atencion-card">
          <h4>📅 Solicitar cita</h4>
          <p>Proponga una fecha y horario. La solicitud quedará sujeta a confirmación del despacho.</p>
          <button type="button" class="btn-primary" id="btn-portal-cita">Solicitar cita</button>
        </article>
      </div>
      <div style="margin-top:1.25rem">
        <h4 style="margin-bottom:.7rem">Seguimiento de solicitudes y mensajes</h4>
        <div id="portal-comunicacion-historial" class="com-panel"><div class="com-empty">Cargando comunicación...</div></div>
      </div>`;
    const tabla = vista.querySelector(".table-responsive");
    vista.insertBefore(bloque, tabla || null);
    document.getElementById("btn-portal-mensaje")?.addEventListener("click", () => abrirModalCliente("mensaje"));
    document.getElementById("btn-portal-cita")?.addEventListener("click", () => abrirModalCliente("cita"));
  }

  function inyectarModal() {
    if (document.getElementById("modal-comunicacion-cliente")) return;
    const modal = document.createElement("div");
    modal.id = "modal-comunicacion-cliente";
    modal.className = "com-modal";
    modal.innerHTML = `
      <div class="com-modal-box">
        <div style="display:flex;justify-content:space-between;gap:1rem;align-items:center">
          <h3 id="com-modal-titulo" style="margin:0">Centro de Atención</h3>
          <button type="button" id="com-modal-cerrar" style="border:0;background:none;font-size:1.6rem;cursor:pointer">×</button>
        </div>
        <form id="form-com-cliente">
          <input type="hidden" id="com-tipo">
          <label for="com-asunto">Asunto relacionado</label>
          <select id="com-asunto"><option value="">Consulta general / nuevo asunto</option></select>
          <div id="campos-mensaje">
            <label for="com-mensaje">Mensaje</label>
            <textarea id="com-mensaje" rows="6" maxlength="3000"></textarea>
          </div>
          <div id="campos-cita" hidden>
            <div class="com-aviso">La solicitud no confirma la cita. El despacho revisará la disponibilidad y se comunicará con usted para confirmar la fecha, hora y modalidad. La atención puede generar honorarios conforme a las tarifas vigentes del despacho.</div>
            <label for="com-motivo">Motivo de la cita</label>
            <textarea id="com-motivo" rows="4" maxlength="1500"></textarea>
            <label for="com-fecha">Fecha sugerida</label>
            <input type="date" id="com-fecha">
            <label for="com-horario">Horario preferido</label>
            <input type="text" id="com-horario" maxlength="80" placeholder="Ejemplo: por la mañana o después de las 16:00">
            <label for="com-modalidad">Modalidad</label>
            <select id="com-modalidad"><option>Presencial</option><option>Videollamada</option><option>Telefónica</option></select>
          </div>
          <div class="com-actions" style="justify-content:flex-end">
            <button type="button" class="btn-secondary" id="com-cancelar">Cancelar</button>
            <button type="submit" class="btn-primary">Enviar solicitud</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("#com-modal-cerrar").onclick = cerrarModalCliente;
    modal.querySelector("#com-cancelar").onclick = cerrarModalCliente;
    modal.querySelector("#form-com-cliente").addEventListener("submit", guardarSolicitudCliente);
  }

  function abrirModalCliente(tipo) {
    asuntosCliente = JSON.parse(localStorage.getItem("js_legal_asuntos_cliente") || "[]");
    const select = document.getElementById("com-asunto");
    select.innerHTML = '<option value="">Consulta general / nuevo asunto</option>' + asuntosCliente.map(a =>
      `<option value="${esc(a.id)}">${esc(a.expediente || a.id)} — ${esc(a.accion || a.materia || "Asunto")}</option>`
    ).join("");
    document.getElementById("com-tipo").value = tipo;
    document.getElementById("com-modal-titulo").textContent = tipo === "mensaje" ? "Enviar mensaje" : "Solicitar cita";
    document.getElementById("campos-mensaje").hidden = tipo !== "mensaje";
    document.getElementById("campos-cita").hidden = tipo !== "cita";
    document.getElementById("modal-comunicacion-cliente").classList.add("open");
  }

  function cerrarModalCliente() {
    document.getElementById("form-com-cliente")?.reset();
    document.getElementById("modal-comunicacion-cliente")?.classList.remove("open");
  }

  async function guardarSolicitudCliente(e) {
    e.preventDefault();
    const u = obtenerSesion();
    const tipo = document.getElementById("com-tipo").value;
    const asuntoId = document.getElementById("com-asunto").value;
    const asunto = asuntosCliente.find(a => String(a.id) === String(asuntoId));
    const base = {
      clienteId: u.clienteId || u.id || "",
      clienteUid: window.firebaseAuth?.currentUser?.uid || u.uid || "",
      clienteNombre: u.nombre || "Cliente",
      clienteCorreo: u.correo || window.firebaseAuth?.currentUser?.email || "",
      asuntoId: asunto?.id || "",
      expediente: asunto?.expediente || "",
      abogadoAsignado: asunto?.abogadoAsignado || "",
      abogadoUid: asunto?.abogadoUid || "",
      destinatarioTipo: asunto ? "Abogado" : "Administracion",
      estado: "Pendiente",
      leido: false,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
      if (tipo === "mensaje") {
        const texto = document.getElementById("com-mensaje").value.trim();
        if (!texto) return alert("Escribe el mensaje.");
        await db.collection("mensajes").add({ ...base, mensaje:texto, respuesta:"" });
        alert("Mensaje enviado correctamente.");
      } else {
        const motivo = document.getElementById("com-motivo").value.trim();
        const fechaSugerida = document.getElementById("com-fecha").value;
        const horarioPreferido = document.getElementById("com-horario").value.trim();
        if (!motivo || !fechaSugerida || !horarioPreferido) return alert("Captura motivo, fecha sugerida y horario preferido.");
        await db.collection("solicitudesCitas").add({ ...base, motivo, fechaSugerida, horarioPreferido, modalidad:document.getElementById("com-modalidad").value, fechaConfirmada:"", horaConfirmada:"", respuesta:"", eventoAgendaId:"" });
        alert("Solicitud de cita enviada. Recuerda que aún no está confirmada.");
      }
      cerrarModalCliente();
    } catch (error) {
      console.error(error); alert("No fue posible enviar la solicitud: " + (error.message || error));
    }
  }

  function escucharPortalCliente() {
    const u = obtenerSesion();
    if (u?.rol !== "Cliente" || !window.db) return;
    const iniciar = usuarioFirebase => {
      const uid = usuarioFirebase?.uid || u.uid || "";
      if (!uid) return;
      cancelarMensajes?.(); cancelarCitas?.();
      cancelarMensajes = db.collection("mensajes").where("clienteUid", "==", uid).onSnapshot(s => { mensajesCache=s.docs.map(d=>({id:d.id,...d.data()})); renderPortalHistorial(); });
      cancelarCitas = db.collection("solicitudesCitas").where("clienteUid", "==", uid).onSnapshot(s => { citasCache=s.docs.map(d=>({id:d.id,...d.data()})); renderPortalHistorial(); });
    };
    if (window.firebaseAuth?.currentUser) iniciar(window.firebaseAuth.currentUser);
    else window.firebaseAuth?.onAuthStateChanged(usuario => { if (usuario) iniciar(usuario); });
  }

  function renderPortalHistorial() {
    const panel=document.getElementById("portal-comunicacion-historial"); if(!panel)return;
    const items=[...mensajesCache.map(x=>({...x,_tipo:"mensaje"})),...citasCache.map(x=>({...x,_tipo:"cita"}))]
      .sort((a,b)=>(b.fechaCreacion?.seconds||0)-(a.fechaCreacion?.seconds||0));
    if(!items.length){panel.innerHTML='<div class="com-empty">Todavía no ha enviado mensajes ni solicitudes de cita.</div>';return;}
    panel.innerHTML=items.map(x=>`<article class="com-card"><div class="com-card-head"><div><h4>${x._tipo==="mensaje"?"💬 Mensaje":"📅 Solicitud de cita"} ${x.expediente?"— "+esc(x.expediente):"— Consulta general"}</h4><div class="com-meta">${fechaLegible(x.fechaCreacion)}</div></div><span class="com-status">${esc(x.estado||"Pendiente")}</span></div><div class="com-texto">${esc(x.mensaje||x.motivo||"")}</div>${x._tipo==="cita"?`<div class="com-meta">Sugerencia: ${esc(x.fechaSugerida)} · ${esc(x.horarioPreferido)} · ${esc(x.modalidad)}</div>`:""}${x.respuesta?`<div class="com-respuesta"><strong>Respuesta del despacho:</strong><br>${esc(x.respuesta)}${x.fechaConfirmada?`<br><strong>Fecha propuesta/confirmada:</strong> ${esc(x.fechaConfirmada)} ${esc(x.horaConfirmada||"")}`:""}</div>`:""}</article>`).join("");
  }

  function prepararTabs() {
    document.querySelectorAll(".com-tab").forEach(btn => btn.addEventListener("click", () => {
      document.querySelectorAll(".com-tab").forEach(b=>b.classList.toggle("active",b===btn));
      document.getElementById("panel-com-mensajes").hidden=btn.dataset.comTab!=="mensajes";
      document.getElementById("panel-com-citas").hidden=btn.dataset.comTab!=="citas";
    }));
  }

  function consultaComunicacionPorRol(coleccion) {
    const u = obtenerSesion();
    let consulta = db.collection(coleccion);
    if (u?.rol === "Abogado") {
      consulta = consulta.where("abogadoAsignado", "==", u.usuario || "__sin_responsable__");
    } else if (u?.rol === "Auxiliar Jurídico") {
      consulta = consulta.where("destinatarioTipo", "==", "Administracion");
    }
    return consulta;
  }

  function cargarCentroComunicacion() {
    const u=obtenerSesion(); if(!u||!ROLES_GESTION.includes(u.rol)||!window.db)return;
    cancelarMensajes?.(); cancelarCitas?.();
    cancelarMensajes=consultaComunicacionPorRol("mensajes").onSnapshot(s=>{mensajesCache=s.docs.map(d=>({id:d.id,...d.data()})).filter(usuarioEsResponsable);renderMensajesStaff();},error=>{console.error(error);document.getElementById("panel-com-mensajes").innerHTML='<div class="com-empty">No fue posible consultar los mensajes.</div>';});
    cancelarCitas=consultaComunicacionPorRol("solicitudesCitas").onSnapshot(s=>{citasCache=s.docs.map(d=>({id:d.id,...d.data()})).filter(usuarioEsResponsable);renderCitasStaff();},error=>{console.error(error);document.getElementById("panel-com-citas").innerHTML='<div class="com-empty">No fue posible consultar las solicitudes.</div>';});
  }

  function renderMensajesStaff(){const p=document.getElementById("panel-com-mensajes");if(!p)return;const a=mensajesCache.sort((x,y)=>(y.fechaCreacion?.seconds||0)-(x.fechaCreacion?.seconds||0));document.getElementById("badge-mensajes").textContent=a.filter(x=>x.estado==="Pendiente").length||"";p.innerHTML=a.length?a.map(x=>`<article class="com-card"><div class="com-card-head"><div><h4>${esc(x.clienteNombre)} ${x.expediente?"— "+esc(x.expediente):""}</h4><div class="com-meta">${fechaLegible(x.fechaCreacion)} · ${esc(x.clienteCorreo)}</div></div><span class="com-status">${esc(x.estado)}</span></div><div class="com-texto">${esc(x.mensaje)}</div>${x.respuesta?`<div class="com-respuesta"><strong>Respuesta:</strong><br>${esc(x.respuesta)}</div>`:""}<div class="com-actions"><button class="btn-primary" onclick="window.responderMensaje('${x.id}')">Responder</button></div></article>`).join(""):'<div class="com-empty">No hay mensajes para atender.</div>'}

  async function responderMensaje(id){const x=mensajesCache.find(m=>m.id===id);if(!x)return;const r=prompt("Respuesta para el cliente:",x.respuesta||"");if(r===null||!r.trim())return;await db.collection("mensajes").doc(id).set({respuesta:r.trim(),estado:"Respondido",leido:true,respondidoPor:obtenerSesion()?.nombre||"Despacho",fechaActualizacion:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}

  function renderCitasStaff(){const p=document.getElementById("panel-com-citas");if(!p)return;const a=citasCache.sort((x,y)=>(y.fechaCreacion?.seconds||0)-(x.fechaCreacion?.seconds||0));document.getElementById("badge-citas").textContent=a.filter(x=>x.estado==="Pendiente").length||"";p.innerHTML=a.length?a.map(x=>`<article class="com-card"><div class="com-card-head"><div><h4>${esc(x.clienteNombre)} ${x.expediente?"— "+esc(x.expediente):"— Consulta general"}</h4><div class="com-meta">${fechaLegible(x.fechaCreacion)}</div></div><span class="com-status">${esc(x.estado)}</span></div><div class="com-texto">${esc(x.motivo)}</div><div class="com-meta">Solicita: ${esc(x.fechaSugerida)} · ${esc(x.horarioPreferido)} · ${esc(x.modalidad)}</div>${x.respuesta?`<div class="com-respuesta">${esc(x.respuesta)}${x.fechaConfirmada?`<br><strong>Fecha:</strong> ${esc(x.fechaConfirmada)} ${esc(x.horaConfirmada||"")}`:""}</div>`:""}<div class="com-actions"><button class="btn-primary" onclick="window.gestionarCita('${x.id}','Confirmada')">Confirmar</button><button class="btn-secondary" onclick="window.gestionarCita('${x.id}','Fecha propuesta')">Proponer fecha</button><button class="btn-secondary" onclick="window.gestionarCita('${x.id}','Rechazada')">Rechazar</button>${x.estado==="Confirmada"&&!x.eventoAgendaId?`<button class="btn-primary" onclick="window.crearAgendaDesdeCita('${x.id}')">Crear evento en Agenda</button>`:""}</div></article>`).join(""):'<div class="com-empty">No hay solicitudes de cita para atender.</div>'}

  function abrirGestorCita(cita, estado) {
    return new Promise(resolve => {
      document.getElementById("modal-gestionar-cita")?.remove();
      const esRechazo = estado === "Rechazada";
      const fechaInicial = cita.fechaConfirmada || cita.fechaSugerida || "";
      const horaInicial = cita.horaConfirmada || "";
      const mensajeInicial = esRechazo
        ? "Por el momento no fue posible confirmar la cita."
        : "El despacho ha revisado su solicitud.";
      const hoy = new Date();
      const minFecha = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

      const modal = document.createElement("div");
      modal.id = "modal-gestionar-cita";
      modal.className = "com-modal open";
      modal.innerHTML = `
        <div class="com-modal-box com-cita-box">
          <div class="com-modal-head">
            <div>
              <h3>${esRechazo ? "Rechazar solicitud" : estado === "Confirmada" ? "Confirmar cita" : "Proponer fecha"}</h3>
              <p>${esc(cita.clienteNombre)} ${cita.expediente ? "— " + esc(cita.expediente) : "— Consulta general"}</p>
            </div>
            <button type="button" class="com-cerrar-modal" aria-label="Cerrar">×</button>
          </div>
          <div class="com-resumen-cita">
            <div><strong>Motivo</strong><span>${esc(cita.motivo || "Sin motivo")}</span></div>
            <div><strong>Fecha sugerida</strong><span>${esc(cita.fechaSugerida || "Sin fecha")}</span></div>
            <div><strong>Horario preferido</strong><span>${esc(cita.horarioPreferido || "Sin horario")}</span></div>
            <div><strong>Modalidad</strong><span>${esc(cita.modalidad || "No especificada")}</span></div>
          </div>
          <form id="form-gestionar-cita">
            ${esRechazo ? "" : `
              <div class="com-fecha-hora-grid">
                <div>
                  <label for="gestion-fecha">Fecha ${estado === "Confirmada" ? "confirmada" : "propuesta"}</label>
                  <input type="date" id="gestion-fecha" min="${minFecha}" value="${esc(fechaInicial)}" required>
                </div>
                <div>
                  <label for="gestion-hora">Hora</label>
                  <input type="time" id="gestion-hora" step="900" value="${esc(horaInicial)}" required>
                </div>
              </div>
              <div id="aviso-conflicto-agenda" class="com-conflicto" hidden></div>
            `}
            <label for="gestion-respuesta">Mensaje para el cliente</label>
            <textarea id="gestion-respuesta" rows="4" maxlength="1000" required>${esc(mensajeInicial)}</textarea>
            <div class="com-actions" style="justify-content:flex-end">
              <button type="button" class="btn-secondary" id="cancelar-gestion-cita">Cancelar</button>
              <button type="submit" class="btn-primary">${esRechazo ? "Rechazar solicitud" : estado === "Confirmada" ? "Confirmar cita" : "Enviar propuesta"}</button>
            </div>
          </form>
        </div>`;
      document.body.appendChild(modal);

      const cerrar = resultado => { modal.remove(); resolve(resultado); };
      modal.querySelector(".com-cerrar-modal").addEventListener("click", () => cerrar(null));
      modal.querySelector("#cancelar-gestion-cita").addEventListener("click", () => cerrar(null));
      modal.addEventListener("click", e => { if (e.target === modal) cerrar(null); });

      const fechaInput = modal.querySelector("#gestion-fecha");
      const horaInput = modal.querySelector("#gestion-hora");
      const aviso = modal.querySelector("#aviso-conflicto-agenda");

      async function revisarConflicto() {
        if (!fechaInput || !horaInput || !fechaInput.value || !horaInput.value) return;
        aviso.hidden = true;
        aviso.textContent = "";
        try {
          const snap = await db.collection("agenda").where("fecha", "==", fechaInput.value).get();
          const ocupados = snap.docs.map(d => d.data()).filter(ev => {
            if (ev.hora !== horaInput.value) return false;
            const abogadoCita = String(cita.abogadoAsignado || obtenerSesion()?.usuario || "").toLowerCase();
            const abogadoEvento = String(ev.abogadoAsignado || "").toLowerCase();
            return !abogadoCita || !abogadoEvento || abogadoCita === abogadoEvento;
          });
          if (ocupados.length) {
            aviso.hidden = false;
            aviso.textContent = "⚠️ Ya existe un evento en la agenda para esa fecha y hora. Puedes elegir otro horario o continuar bajo tu responsabilidad.";
          }
        } catch (error) {
          console.warn("No fue posible verificar conflictos de agenda:", error);
        }
      }
      fechaInput?.addEventListener("change", revisarConflicto);
      horaInput?.addEventListener("change", revisarConflicto);
      if (fechaInput?.value && horaInput?.value) revisarConflicto();

      modal.querySelector("#form-gestionar-cita").addEventListener("submit", e => {
        e.preventDefault();
        const respuesta = modal.querySelector("#gestion-respuesta").value.trim();
        if (!respuesta) return alert("Escribe un mensaje para el cliente.");
        if (esRechazo) return cerrar({ fecha:"", hora:"", respuesta });
        const fecha = fechaInput.value;
        const hora = horaInput.value;
        if (!fecha || !hora) return alert("Selecciona la fecha y la hora.");
        cerrar({ fecha, hora, respuesta });
      });
    });
  }

  async function gestionarCita(id, estado) {
    const cita = citasCache.find(c => c.id === id);
    if (!cita) return;
    const datos = await abrirGestorCita(cita, estado);
    if (!datos) return;
    try {
      await db.collection("solicitudesCitas").doc(id).set({
        estado,
        fechaConfirmada: datos.fecha,
        horaConfirmada: datos.hora,
        respuesta: datos.respuesta,
        atendidoPor: obtenerSesion()?.nombre || "Despacho",
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge:true });
    } catch (error) {
      console.error(error);
      alert("No fue posible actualizar la solicitud de cita: " + (error.message || error));
    }
  }

  async function crearAgendaDesdeCita(id){const x=citasCache.find(c=>c.id===id);if(!x||x.estado!=="Confirmada")return alert("Primero confirma la cita.");if(!x.asuntoId)return alert("La consulta general no tiene expediente asociado. Créala manualmente en la Agenda.");const ref=await db.collection("agenda").add({asuntoId:x.asuntoId,tipo:"Reunión con cliente",fecha:x.fechaConfirmada,hora:x.horaConfirmada,notas:`Cita solicitada por ${x.clienteNombre}. ${x.motivo}`,abogadoAsignado:x.abogadoAsignado||obtenerSesion()?.usuario||"",notificado:false,origenSolicitudCitaId:x.id,fechaRegistro:firebase.firestore.FieldValue.serverTimestamp(),fechaActualizacion:firebase.firestore.FieldValue.serverTimestamp()});await db.collection("solicitudesCitas").doc(id).set({eventoAgendaId:ref.id,fechaActualizacion:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});alert("La cita fue agregada a la Agenda.");}

  document.addEventListener("DOMContentLoaded",()=>{inyectarModal();prepararTabs();const u=obtenerSesion();if(u?.rol==="Cliente"){inyectarPortal();setTimeout(escucharPortalCliente,500);}});
  window.cargarCentroComunicacion=cargarCentroComunicacion;
  window.responderMensaje=responderMensaje;
  window.gestionarCita=gestionarCita;
  window.crearAgendaDesdeCita=crearAgendaDesdeCita;
})();
