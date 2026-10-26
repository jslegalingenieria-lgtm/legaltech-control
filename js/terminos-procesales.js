/*
 * LegalTech Control v4.8.0 — Términos procesales
 * Catálogo canónico de términos + Supermatriz V19 + control operativo de vencimientos.
 * Importante: no calcula automáticamente fechas límite. El profesional debe verificar la norma,
 * el órgano, la notificación, días inhábiles, suspensiones y criterios aplicables antes de registrar.
 */
(() => {
  "use strict";
  const ROOT_ID = "terminos-procesales-root";
  const COLLECTION = "alertas";
  let activeTab = "catalogo";
  let cacheTerms = [];
  let operationalItems = [];
  let lastOperationalError = "";
  let eventBound = false;

  const root = () => document.getElementById(ROOT_ID);
  const norm = v => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const esc = v => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const session = () => {
    try {
      const raw = sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session");
      return raw ? JSON.parse(raw) : (window.usuarioActivoGlobal || null);
    } catch (_) { return window.usuarioActivoGlobal || null; }
  };
  const canAccess = () => {
    const s = session();
    return !!s && !["cliente", "pasante externo"].includes(norm(s.rol));
  };
  const isAbogado = s => norm(s?.rol) === "abogado";
  const isAdmin = s => ["administrador", "superadministrador"].includes(norm(s?.rol));
  const data = () => Array.isArray(window.LEGALTECH_MOTOR_TERMINOS) ? window.LEGALTECH_MOTOR_TERMINOS : [];
  const matrix = () => window.SIGDE_SUPERMATRIZ_V19 || null;
  const getSessionUser = s => String(s?.usuario || s?.nombreUsuario || s?.email || s?.correo || "").trim();

  function dateParse(v) {
    if (!v) return null;
    const p = String(v).slice(0, 10).split("-").map(Number);
    if (p.length !== 3 || p.some(Number.isNaN)) return null;
    const d = new Date(p[0], p[1] - 1, p[2]);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function dateFmt(v) {
    const d = dateParse(v);
    return d ? d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "Sin fecha";
  }
  function dayDiff(v) {
    const d = dateParse(v);
    if (!d) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  }
  function dueState(item) {
    if (["cumplido", "completado"].includes(norm(item.estado))) return { cls: "future", text: "Cumplido" };
    if (norm(item.estado) === "cancelado") return { cls: "future", text: "Cancelado" };
    const n = dayDiff(item.fechaVencimiento);
    if (n === null) return { cls: "soon", text: "Fecha por verificar" };
    if (n < 0) return { cls: "overdue", text: `Vencido hace ${Math.abs(n)} día(s)` };
    if (n === 0) return { cls: "today", text: "Vence hoy" };
    if (n <= 5) return { cls: "soon", text: `Vence en ${n} día(s)` };
    return { cls: "future", text: `Vence en ${n} días` };
  }
  function statusClass(v) {
    const n = norm(v);
    if (n.includes("verificado fuente") || n.includes("fuente revisada")) return "ok";
    if (n.includes("pendiente") || n.includes("revisar")) return "warn";
    return "";
  }
  function uniqueSorted(items) { return [...new Set(items.filter(Boolean).map(String))].sort((a,b) => a.localeCompare(b, "es")); }

  function ensureShell() {
    const el = root(); if (!el || el.dataset.ready === "1") return;
    el.dataset.ready = "1";
    el.innerHTML = `
      <div class="tp-root">
        <header class="tp-hero">
          <div><span class="tp-kicker">Centro de control procesal</span><h3>⏱️ Términos procesales</h3>
            <p>Consulta la matriz canónica, revisa las rutas procesales y administra vencimientos de expedientes. Las fechas deben ser verificadas por el abogado; el sistema no presume el inicio ni computa plazos que no tengan una regla ejecutable validada.</p>
          </div><span class="tp-pill">Matriz canónica · v4.8</span>
        </header>
        <div class="tp-alert"><strong>Control jurídico obligatorio.</strong> El catálogo contiene registros en diferentes estados de validación. No uses una fila como cálculo definitivo sin verificar el texto vigente, el régimen, el órgano, la notificación, los días inhábiles y cualquier suspensión aplicable. La fecha límite registrada manualmente no constituye una opinión jurídica del sistema.</div>
        <nav class="tp-tabs" role="tablist" aria-label="Secciones de términos procesales">
          <button class="tp-tab active" type="button" data-tp-tab="catalogo">Catálogo canónico</button>
          <button class="tp-tab" type="button" data-tp-tab="rutas">Rutas y etapas</button>
          <button class="tp-tab" type="button" data-tp-tab="control">Control de vencimientos</button>
        </nav>
        <section class="tp-panel" data-tp-panel="catalogo">
          <div class="tp-filters">
            <div class="tp-field"><label for="tp-q">Buscar en el catálogo</label><input id="tp-q" type="search" placeholder="Materia, artículo, actuación, ID…"></div>
            <div class="tp-field"><label for="tp-materia">Materia</label><select id="tp-materia"><option value="">Todas</option></select></div>
            <div class="tp-field"><label for="tp-validacion">Validación</label><select id="tp-validacion"><option value="">Todos los estados</option></select></div>
            <div class="tp-field"><label for="tp-ejecutable">Regla ejecutable</label><select id="tp-ejecutable"><option value="">Todas</option><option value="SI">Sí</option><option value="NO">No</option></select></div>
          </div>
          <div class="tp-results-head"><div><h4>Registros canónicos</h4><p id="tp-catalog-caption">Cargando catálogo…</p></div><button class="tp-btn" data-tp-action="reset-catalog">Limpiar filtros</button></div>
          <div id="tp-catalog-list" class="tp-grid"><div class="tp-loading">Cargando catálogo…</div></div>
        </section>
        <section class="tp-panel" data-tp-panel="rutas" hidden>
          <div class="tp-filters">
            <div class="tp-field"><label for="tp-ruta-q">Buscar ruta, etapa o fundamento</label><input id="tp-ruta-q" type="search" placeholder="Ej. apelación, emplazamiento, artículo…"></div>
            <div class="tp-field"><label for="tp-ruta-materia">Materia</label><select id="tp-ruta-materia"><option value="">Todas</option></select></div>
            <div class="tp-field"><label for="tp-ruta-regimen">Régimen</label><select id="tp-ruta-regimen"><option value="">Todos</option></select></div>
            <div class="tp-field"><label for="tp-ruta-estado">Estado de datos</label><select id="tp-ruta-estado"><option value="">Todos</option></select></div>
          </div>
          <div class="tp-results-head"><div><h4>Supermatriz de rutas procesales</h4><p id="tp-ruta-caption">Las etapas organizan referencias estructurales, no generan un vencimiento automático.</p></div></div>
          <div id="tp-routes-list" class="tp-grid"><div class="tp-loading">Cargando rutas…</div></div>
        </section>
        <section class="tp-panel" data-tp-panel="control" hidden>
          <div class="tp-stats" id="tp-stats"></div>
          <div class="tp-form-card">
            <h4>Registrar un vencimiento revisado</h4>
            <p>Capture manualmente la fecha que ya verificó en la fuente aplicable. La selección de un término del catálogo solo copia su referencia; no calcula el plazo ni determina la fecha límite.</p>
            <form id="tp-register-form">
              <div class="tp-form-grid">
                <div class="tp-field"><label for="tp-reg-title">Actuación / término *</label><input id="tp-reg-title" required maxlength="240" placeholder="Ej. contestación de demanda"></div>
                <div class="tp-field"><label for="tp-reg-date">Fecha límite verificada *</label><input id="tp-reg-date" required type="date"></div>
                <div class="tp-field"><label for="tp-reg-priority">Prioridad</label><select id="tp-reg-priority"><option>Media</option><option>Alta</option><option>Crítica</option><option>Baja</option></select></div>
                <div class="tp-field"><label for="tp-reg-expediente">Expediente / asunto</label><input id="tp-reg-expediente" maxlength="120"></div>
                <div class="tp-field"><label for="tp-reg-cliente">Cliente</label><input id="tp-reg-cliente" maxlength="160"></div>
                <div class="tp-field"><label for="tp-reg-materia">Materia</label><input id="tp-reg-materia" maxlength="120" placeholder="Civil, laboral, penal…"></div>
                <div class="tp-field"><label for="tp-reg-ordenamiento">Ordenamiento</label><input id="tp-reg-ordenamiento" maxlength="240"></div>
                <div class="tp-field"><label for="tp-reg-fundamento">Fundamento</label><input id="tp-reg-fundamento" maxlength="240"></div>
                <div class="tp-field"><label for="tp-reg-id">ID del catálogo (opcional)</label><input id="tp-reg-id" maxlength="80" placeholder="T-0123"></div>
                <div class="tp-field wide"><label for="tp-reg-notes">Notas de cómputo y verificación</label><textarea id="tp-reg-notes" maxlength="2500" placeholder="Fecha y forma de notificación, inicio del cómputo, calendario, suspensiones, fuente consultada, responsable de la verificación…"></textarea><small>No introduzcas información innecesaria o datos sensibles en notas. Verifica el cómputo antes de guardar.</small></div>
              </div>
              <div class="tp-actions"><button class="tp-btn primary" type="submit">Guardar término verificado</button><button class="tp-btn" type="reset">Limpiar formulario</button></div>
            </form>
            <div id="tp-register-message" aria-live="polite"></div>
          </div>
          <div class="tp-filters">
            <div class="tp-field"><label for="tp-control-q">Buscar en los vencimientos</label><input id="tp-control-q" type="search" placeholder="Actuación, expediente, cliente…"></div>
            <div class="tp-field"><label for="tp-control-status">Estado</label><select id="tp-control-status"><option value="pendientes">Pendientes</option><option value="todos">Todos</option><option value="cumplido">Cumplidos</option><option value="cancelado">Cancelados</option></select></div>
            <div class="tp-field"><label for="tp-control-time">Vencimiento</label><select id="tp-control-time"><option value="todos">Todos</option><option value="atencion">Vencidos y próximos 5 días</option><option value="futuro">Más de 5 días</option></select></div>
            <div class="tp-field"><label>Datos</label><div id="tp-control-status-message"><small>Se consultan las alertas disponibles para el perfil actual.</small></div></div>
          </div>
          <div class="tp-results-head"><div><h4>Vencimientos registrados</h4><p id="tp-control-caption">Cargando vencimientos…</p></div><button class="tp-btn" data-tp-action="reload-control">Actualizar lista</button></div>
          <div id="tp-control-list"><div class="tp-loading">Cargando vencimientos…</div></div>
        </section>
      </div>`;
    bindEvents();
    populateCatalogFilters();
    populateRouteFilters();
  }

  function bindEvents() {
    if (eventBound) return; eventBound = true;
    const doc = document;
    doc.addEventListener("click", async event => {
      const tab = event.target.closest("[data-tp-tab]");
      if (tab) { setTab(tab.dataset.tpTab); return; }
      const actionEl = event.target.closest("[data-tp-action]");
      if (actionEl) {
        const action = actionEl.dataset.tpAction;
        if (action === "reset-catalog") { ["tp-q","tp-materia","tp-validacion","tp-ejecutable"].forEach(id => { const el=doc.getElementById(id); if (el) el.value=""; }); renderCatalog(); }
        if (action === "reload-control") await loadOperational(true);
        if (action === "use-term") useCatalogTerm(actionEl.dataset.id);
        if (action === "mark-done") await changeStatus(actionEl.dataset.id, "cumplido");
        if (action === "cancel-term") await changeStatus(actionEl.dataset.id, "cancelado");
        if (action === "copy-term") await copyTerm(actionEl.dataset.id);
        return;
      }
      const openRoute = event.target.closest("[data-tp-route]");
      if (openRoute) { const id = openRoute.dataset.tpRoute; const detail=doc.querySelector(`[data-tp-route-detail="${CSS.escape(id)}"]`); if (detail) detail.hidden=!detail.hidden; }
      const useRoute = event.target.closest("[data-tp-use-route]");
      if (useRoute) { const r = getRoutes().find(x => x.id === useRoute.dataset.tpUseRoute); if (r) { setTab("control"); const title=doc.getElementById("tp-reg-title"); if(title) title.value=`Seguimiento: ${r.ruta}`; const mat=doc.getElementById("tp-reg-materia"); if(mat) mat.value=r.materia||""; const ord=doc.getElementById("tp-reg-ordenamiento"); if(ord) ord.value=r.ordenamiento||""; const notes=doc.getElementById("tp-reg-notes"); if(notes) notes.value=`Ruta consultada: ${r.ruta}. Etapas de referencia: ${Object.keys(r.stages||{}).join("; ")}. Verificar la fecha límite en la fuente aplicable antes de guardar.`; const dt=doc.getElementById("tp-reg-date"); if(dt) dt.focus(); } }
    });
    ["tp-q","tp-materia","tp-validacion","tp-ejecutable"].forEach(id => doc.addEventListener("input", e => { if (e.target.id === id) renderCatalog(); }));
    ["tp-ruta-q","tp-ruta-materia","tp-ruta-regimen","tp-ruta-estado"].forEach(id => doc.addEventListener("input", e => { if (e.target.id === id) renderRoutes(); }));
    ["tp-control-q","tp-control-status","tp-control-time"].forEach(id => doc.addEventListener("input", e => { if (e.target.id === id) renderOperational(); }));
    doc.addEventListener("change", e => {
      if (["tp-q","tp-materia","tp-validacion","tp-ejecutable"].includes(e.target.id)) renderCatalog();
      if (["tp-ruta-q","tp-ruta-materia","tp-ruta-regimen","tp-ruta-estado"].includes(e.target.id)) renderRoutes();
      if (["tp-control-q","tp-control-status","tp-control-time"].includes(e.target.id)) renderOperational();
    });
    doc.addEventListener("submit", async event => {
      if (event.target?.id === "tp-register-form") { event.preventDefault(); await saveOperational(); }
    });
  }

  function setTab(name) {
    activeTab = name;
    const el=root(); if(!el) return;
    el.querySelectorAll("[data-tp-tab]").forEach(b => b.classList.toggle("active", b.dataset.tpTab === name));
    el.querySelectorAll("[data-tp-panel]").forEach(p => p.hidden = p.dataset.tpPanel !== name);
    if (name === "catalogo") renderCatalog();
    if (name === "rutas") renderRoutes();
    if (name === "control") loadOperational(false);
  }

  function populateCatalogFilters() {
    const records=data();
    fillSelect("tp-materia", uniqueSorted(records.map(x=>x.Materia)), "Todas");
    fillSelect("tp-validacion", uniqueSorted(records.map(x=>x["Estado de validación"])), "Todos los estados");
    renderCatalog();
  }
  function populateRouteFilters() {
    const routes=getRoutes();
    fillSelect("tp-ruta-materia", uniqueSorted(routes.map(x=>x.materia)), "Todas");
    fillSelect("tp-ruta-regimen", uniqueSorted(routes.map(x=>x.regimen)), "Todos");
    fillSelect("tp-ruta-estado", uniqueSorted(routes.map(x=>x.estado)), "Todos");
    renderRoutes();
  }
  function fillSelect(id, values, first) {
    const el=document.getElementById(id); if(!el) return;
    const old=el.value;
    el.innerHTML=`<option value="">${esc(first)}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
    if(values.includes(old)) el.value=old;
  }
  function catalogMatch(item) {
    const q=norm(document.getElementById("tp-q")?.value);
    const mat=document.getElementById("tp-materia")?.value||"";
    const status=document.getElementById("tp-validacion")?.value||"";
    const execVal=document.getElementById("tp-ejecutable")?.value||"";
    const all=[item.Materia,item.Ordenamiento,item.Procedimiento,item["Actuación / evento"],item.Plazo,item.Unidad,item["Inicio / cómputo"],item.Fundamento,item["Consecuencia / efecto"],item.Observaciones,item.ID_Termino,item.ID_Regla_Engine,item.Regimen_Normativo,item.Estado_Cadena,item.Motivo_no_ejecutable].join(" ");
    return (!q||norm(all).includes(q))&&(!mat||item.Materia===mat)&&(!status||item["Estado de validación"]===status)&&(!execVal||String(item.Regla_ejecutable||"").toUpperCase()===execVal);
  }
  function renderCatalog() {
    const list=document.getElementById("tp-catalog-list"); if(!list) return;
    const records=data();
    const filtered=records.filter(catalogMatch).slice(0,100);
    const cap=document.getElementById("tp-catalog-caption"); if(cap) cap.textContent=`${filtered.length} de ${records.filter(catalogMatch).length} registros visibles (máximo 100 por consulta); total canónico: ${records.length}.`;
    if(!records.length){list.innerHTML='<div class="tp-alert">No se cargó el catálogo canónico. Comprueba que js/terminos-procesales-data.js se cargue antes de este módulo.</div>';return;}
    if(!filtered.length){list.innerHTML='<div class="tp-empty">No hay términos que coincidan con los filtros.</div>';return;}
    list.innerHTML=filtered.map((x,i)=>{
      const status=x["Estado de validación"]||"Sin estado"; const exec=String(x.Regla_ejecutable||"NO").toUpperCase()==="SI";
      const plazo=[x.Plazo,x.Unidad].filter(v=>v!==null&&v!==undefined&&v!=="").join(" ")||"Sin plazo numérico confirmado";
      return `<article class="tp-card"><div class="tp-card-top"><span class="tp-pill">${esc(x.Materia||"Materia no indicada")}</span><span class="tp-chip ${statusClass(status)}">${esc(status)}</span></div><h5>${esc(x["Actuación / evento"]||x.Procedimiento||"Término procesal")}</h5><p><b>Ordenamiento:</b> ${esc(x.Ordenamiento||"No identificado")}</p><p><b>Procedimiento:</b> ${esc(x.Procedimiento||"No indicado")}</p><p><b>Plazo:</b> ${esc(plazo)}</p><p><b>Inicio / cómputo:</b> ${esc(x["Inicio / cómputo"]||"Requiere revisión jurídica")}</p><p><b>Fundamento registrado:</b> ${esc(x.Fundamento||"No indicado")}</p><div class="tp-meta"><span class="tp-chip">ID ${esc(x.ID_Termino||"s/id")}</span><span class="tp-chip ${exec?"ok":"warn"}">Regla ejecutable: ${exec?"Sí":"No"}</span><span class="tp-chip">Régimen: ${esc(x.Regimen_Normativo||"por revisar")}</span></div><details class="tp-detail"><summary>Ver observaciones y control de calidad</summary><p><b>Observaciones:</b> ${esc(x.Observaciones||"—")}</p><p><b>Motivo de no ejecución:</b> ${esc(x.Motivo_no_ejecutable||"No consignado")}</p><p><b>Estado de cadena:</b> ${esc(x.Estado_Cadena||"No indicado")}</p><p><b>Versión de fuente:</b> ${esc(x.Version_fuente||"Por determinar")}</p><p><b>Fuente canónica:</b> ${esc(x.Fuente_Canonica||"Matriz de términos")}</p><p><b>Comentario de cómputo:</b> ${esc(x.Comentario_computo||"—")}</p></details><div class="tp-actions"><button class="tp-btn primary" data-tp-action="use-term" data-id="${esc(x.ID_Termino||"")}">Registrar vencimiento</button><button class="tp-btn" data-tp-action="copy-term" data-id="${esc(x.ID_Termino||"")}">Copiar ficha</button></div></article>`;
    }).join("");
  }
  function getRoutes() {
    const m=matrix(); return Array.isArray(m?.routes) ? m.routes : [];
  }
  function routeMatch(r) {
    const q=norm(document.getElementById("tp-ruta-q")?.value);
    const mat=document.getElementById("tp-ruta-materia")?.value||"";
    const regime=document.getElementById("tp-ruta-regimen")?.value||"";
    const status=document.getElementById("tp-ruta-estado")?.value||"";
    const stageText=Object.entries(r.stages||{}).map(([k,arr])=>[k,...(arr||[]).map(x=>[x.texto,x.numero,x.unidad,x.fundamento].join(" "))].join(" ")).join(" ");
    return (!q||norm([r.materia,r.ordenamiento,r.regimen,r.ruta,r.estado,r.fuente,stageText].join(" ")).includes(q))&&(!mat||r.materia===mat)&&(!regime||r.regimen===regime)&&(!status||r.estado===status);
  }
  function renderRoutes() {
    const list=document.getElementById("tp-routes-list"); if(!list) return;
    const all=getRoutes(), filtered=all.filter(routeMatch).slice(0,80);
    const cap=document.getElementById("tp-ruta-caption"); if(cap) cap.textContent=`${filtered.length} rutas de ${all.length} registradas. Las reglas requieren validación por fundamento, régimen y etapa.`;
    if(!all.length){list.innerHTML='<div class="tp-alert">No se cargó la Supermatriz procesal. Comprueba js/supermatriz-procesal-data.js.</div>';return;}
    if(!filtered.length){list.innerHTML='<div class="tp-empty">No hay rutas con los filtros seleccionados.</div>';return;}
    list.innerHTML=filtered.map(r=>{
      const stages=Object.entries(r.stages||{});
      const stageHtml=stages.map(([name,items])=>`<li><b>${esc(name)}</b><ul>${(items||[]).map(x=>`<li>${esc(x.texto||`${x.numero??""} ${x.unidad||""}`)}${x.fundamento?` — Fundamento registrado: ${esc(x.fundamento)}`:""}</li>`).join("")||"<li>Sin términos estructurados.</li>"}</ul></li>`).join("");
      return `<article class="tp-card"><div class="tp-card-top"><span class="tp-pill">${esc(r.materia||"Materia no indicada")}</span><span class="tp-chip ${norm(r.estado).includes("con datos")?"ok":"warn"}">${esc(r.estado||"Estado sin indicar")}</span></div><h5>${esc(r.ruta||"Ruta procesal")}</h5><p><b>Ordenamiento:</b> ${esc(r.ordenamiento||"No identificado")}</p><p><b>Régimen:</b> ${esc(r.regimen||"No indicado")}</p><p><b>Fuente indicada:</b> ${esc(r.fuente||"No indicada")}</p><div class="tp-meta"><span class="tp-chip">ID ${esc(r.id||"")}</span><span class="tp-chip">${stages.length} etapa(s)</span><span class="tp-chip">Revisión registrada: ${esc(r.fechaRevision||"No indicada")}</span></div><button type="button" class="tp-btn" data-tp-route="${esc(r.id)}">Ver etapas y términos</button><div data-tp-route-detail="${esc(r.id)}" hidden><details open><summary>Etapas registradas (referencia)</summary><ul>${stageHtml}</ul></details><p><b>Auditoría registrada:</b> ${esc(r.auditoria||"Sin nota de auditoría")}</p></div><div class="tp-actions"><button type="button" class="tp-btn primary" data-tp-use-route="${esc(r.id)}">Registrar seguimiento</button></div></article>`;
    }).join("");
  }
  function findCatalogItem(id) { return data().find(x=>String(x.ID_Termino||"")===String(id)); }
  function useCatalogTerm(id) {
    const item=findCatalogItem(id); if(!item) return;
    setTab("control");
    const set=(f,v)=>{const el=document.getElementById(f);if(el)el.value=String(v??"");};
    set("tp-reg-title",item["Actuación / evento"]||item.Procedimiento||""); set("tp-reg-materia",item.Materia||"");
    set("tp-reg-ordenamiento",item.Ordenamiento||""); set("tp-reg-fundamento",item.Fundamento||""); set("tp-reg-id",item.ID_Termino||"");
    set("tp-reg-notes",`Referencia del catálogo ${item.ID_Termino||""}. Plazo registrado: ${item.Plazo??"sin plazo numérico"} ${item.Unidad||""}. Inicio/computo indicado: ${item["Inicio / cómputo"]||"por verificar"}. Estado de validación: ${item["Estado de validación"]||"no indicado"}. Regla ejecutable: ${item.Regla_ejecutable||"NO"}. Verificar la fuente vigente y determinar manualmente la fecha límite; el sistema no la calculó.`);
    document.getElementById("tp-reg-title")?.focus();
  }
  async function copyTerm(id) {
    const x=findCatalogItem(id); if(!x) return;
    const lines=[`ID: ${x.ID_Termino||""}`,`Materia: ${x.Materia||""}`,`Ordenamiento: ${x.Ordenamiento||""}`,`Procedimiento: ${x.Procedimiento||""}`,`Actuación: ${x["Actuación / evento"]||""}`,`Plazo: ${x.Plazo??""} ${x.Unidad||""}`,`Inicio/cómputo: ${x["Inicio / cómputo"]||""}`,`Fundamento: ${x.Fundamento||""}`,`Estado de validación: ${x["Estado de validación"]||""}`,`Regla ejecutable: ${x.Regla_ejecutable||"NO"}`,`Fuente: ${x.Fuente_Canonica||""}`].join("\n");
    try { await navigator.clipboard.writeText(lines); alert("Ficha copiada. Verifica la vigencia normativa antes de utilizarla."); }
    catch (_) { window.prompt("Copia la ficha del término:",lines); }
  }

  async function loadOperational(force) {
    const s=session();
    if (!canAccess()) { const el=document.getElementById("tp-control-list"); if(el)el.innerHTML='<div class="tp-alert">Esta sección es para personal autorizado del despacho. Inicia sesión con un perfil de administrador o abogado.</div>'; return; }
    if (!window.db || typeof window.db.collection !== "function") {
      lastOperationalError="Firestore no está disponible en esta sesión."; operationalItems=[]; renderOperational(); return;
    }
    const status=document.getElementById("tp-control-status-message"); if(status)status.innerHTML='<small>Consultando registros autorizados…</small>';
    try {
      let query=window.db.collection(COLLECTION);
      if (isAbogado(s)) {
        const user=getSessionUser(s); if(!user) throw new Error("No se encontró el usuario autenticado para filtrar sus términos.");
        query=query.where("usuario","==",user);
      }
      const snap=await query.get();
      operationalItems=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.tipo==="termino");
      lastOperationalError="";
      if(status)status.innerHTML='<small>Consulta completada.</small>';
      renderOperational();
    } catch(e) {
      console.error("No se pudieron cargar términos procesales",e);
      lastOperationalError=e?.code==="permission-denied" ? "La sesión no tiene permiso para consultar estos registros. Verifica el rol y las reglas de Firestore." : (e.message||"No se pudieron consultar los vencimientos.");
      operationalItems=[]; renderOperational();
      if(status)status.innerHTML=`<small>${esc(lastOperationalError)}</small>`;
    }
  }
  async function saveOperational() {
    const form=document.getElementById("tp-register-form"), msg=document.getElementById("tp-register-message"); if(!form) return;
    const s=session();
    const title=document.getElementById("tp-reg-title")?.value.trim();
    const date=document.getElementById("tp-reg-date")?.value;
    const user=getSessionUser(s);
    if(!canAccess()) { if(msg)msg.innerHTML='<div class="tp-alert">Solo un usuario autorizado puede registrar términos.</div>'; return; }
    if(!title||!date) { if(msg)msg.innerHTML='<div class="tp-alert">Completa la actuación y la fecha límite que verificaste.</div>'; return; }
    if(!user) { if(msg)msg.innerHTML='<div class="tp-alert">No se identificó el usuario de la sesión.</div>'; return; }
    if(!window.db) { if(msg)msg.innerHTML='<div class="tp-alert">No hay conexión con Firestore. No se guardó el término.</div>'; return; }
    const btn=form.querySelector('button[type="submit"]'); if(btn){btn.disabled=true;btn.textContent="Guardando…";}
    const value=id=>document.getElementById(id)?.value.trim()||"";
    const payload={
      tipo:"termino", titulo:title, fechaVencimiento:date, estado:"pendiente", usuario:user,
      expediente:value("tp-reg-expediente"), cliente:value("tp-reg-cliente"), prioridad:value("tp-reg-priority")||"Media",
      materia:value("tp-reg-materia"), ordenamiento:value("tp-reg-ordenamiento"), fundamento:value("tp-reg-fundamento"),
      idTermino:value("tp-reg-id"), observaciones:value("tp-reg-notes"), origenModulo:"terminos-procesales",
      creadoPorUid:window.firebaseAuth?.currentUser?.uid||s.uid||s.id||null,
      fechaRegistro:window.firebase?.firestore?.FieldValue?.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
      fechaActualizacion:window.firebase?.firestore?.FieldValue?.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
      fechaBaseVerificada:true, fechaLimiteCapturadaManualmente:true
    };
    try {
      await window.db.collection(COLLECTION).add(payload);
      form.reset(); if(msg)msg.innerHTML='<div class="tp-chip ok">Término guardado. La fecha fue registrada tal como la capturaste; vuelve a verificarla si cambia algún hecho procesal.</div>';
      await loadOperational(true);
    } catch(e) {
      console.error("Error guardando término",e);
      if(msg)msg.innerHTML=`<div class="tp-alert">No se pudo guardar: ${esc(e?.message||"error de permisos o conexión")}. No se guardó ningún registro.</div>`;
    } finally { if(btn){btn.disabled=false;btn.textContent="Guardar término verificado";} }
  }
  async function changeStatus(id, status) {
    const item=operationalItems.find(x=>x.id===id); if(!item||!window.db) return;
    const prompt=status==="cumplido"?"¿Confirmas que este término fue cumplido?":"¿Confirmas que deseas cancelar este término?";
    if(!confirm(prompt))return;
    try {
      const patch={estado:status};
      if(window.firebase?.firestore?.FieldValue?.serverTimestamp) patch.fechaActualizacion=firebase.firestore.FieldValue.serverTimestamp();
      if(status==="cumplido"&&window.firebase?.firestore?.FieldValue?.serverTimestamp)patch.fechaCumplimiento=firebase.firestore.FieldValue.serverTimestamp();
      await window.db.collection(COLLECTION).doc(id).update(patch);
      await loadOperational(true);
    } catch(e) { console.error(e); alert(`No fue posible actualizar el término: ${e?.message||"error"}`); }
  }
  function renderOperational() {
    const list=document.getElementById("tp-control-list"); if(!list)return;
    const now=operationalItems;
    const pending=now.filter(x=>!['cumplido','completado','cancelado'].includes(norm(x.estado)));
    const overdue=pending.filter(x=>dayDiff(x.fechaVencimiento)!==null&&dayDiff(x.fechaVencimiento)<0).length;
    const today=pending.filter(x=>dayDiff(x.fechaVencimiento)===0).length;
    const near=pending.filter(x=>dayDiff(x.fechaVencimiento)!==null&&dayDiff(x.fechaVencimiento)>=0&&dayDiff(x.fechaVencimiento)<=5).length;
    const stats=document.getElementById("tp-stats"); if(stats)stats.innerHTML=`<div class="tp-stat"><span>Pendientes</span><strong>${pending.length}</strong></div><div class="tp-stat"><span>Vencidos</span><strong>${overdue}</strong></div><div class="tp-stat"><span>Vencen hoy</span><strong>${today}</strong></div><div class="tp-stat"><span>Próximos 5 días</span><strong>${near}</strong></div>`;
    if(lastOperationalError){list.innerHTML=`<div class="tp-alert">${esc(lastOperationalError)} La consulta del catálogo y de rutas continúa disponible.</div>`; const c=document.getElementById("tp-control-caption");if(c)c.textContent="La lista operativa no está disponible.";return;}
    const q=norm(document.getElementById("tp-control-q")?.value); const state=document.getElementById("tp-control-status")?.value||"pendientes"; const time=document.getElementById("tp-control-time")?.value||"todos";
    const f=now.filter(x=>{
      const closed=['cumplido','completado','cancelado'].includes(norm(x.estado)); const d=dayDiff(x.fechaVencimiento);
      const statusOk=state==="todos"||(state==="pendientes"&&!closed)||(state==="cumplido"&&['cumplido','completado'].includes(norm(x.estado)))||(state==="cancelado"&&norm(x.estado)==="cancelado");
      const timeOk=time==="todos"||(time==="atencion"&&!closed&&d!==null&&d<=5)||(time==="futuro"&&!closed&&d!==null&&d>5);
      return statusOk&&timeOk&&(!q||norm([x.titulo,x.expediente,x.cliente,x.materia,x.ordenamiento,x.fundamento,x.observaciones].join(" ")).includes(q));
    }).sort((a,b)=>(dayDiff(a.fechaVencimiento)??99999)-(dayDiff(b.fechaVencimiento)??99999));
    const cap=document.getElementById("tp-control-caption");if(cap)cap.textContent=`${f.length} registro(s) visibles de ${now.length} término(s) del tipo procesal.`;
    if(!f.length){list.innerHTML='<div class="tp-empty">No hay términos para los filtros elegidos. Puedes registrar uno con su fecha límite verificada.</div>';return;}
    list.innerHTML=f.map(x=>{const st=dueState(x);const closed=['cumplido','completado','cancelado'].includes(norm(x.estado));return `<article class="tp-term-line ${st.cls}"><div class="tp-card-top"><h5>${esc(x.titulo||"Término procesal")}</h5><span class="tp-chip ${st.cls==='overdue'||st.cls==='today'?'bad':st.cls==='soon'?'warn':'ok'}">${esc(st.text)}</span></div><p><b>Fecha límite registrada:</b> ${esc(dateFmt(x.fechaVencimiento))} · <b>Estado:</b> ${esc(x.estado||"pendiente")} · <b>Prioridad:</b> ${esc(x.prioridad||"Media")}</p><p><b>Expediente:</b> ${esc(x.expediente||"No indicado")} · <b>Cliente:</b> ${esc(x.cliente||"No indicado")}</p><p><b>Materia / ordenamiento:</b> ${esc(x.materia||"No indicado")} / ${esc(x.ordenamiento||"No indicado")}</p>${x.fundamento?`<p><b>Fundamento:</b> ${esc(x.fundamento)}</p>`:""}${x.observaciones?`<details><summary>Notas de verificación</summary><p>${esc(x.observaciones)}</p></details>`:""}${!closed?`<div class="tp-actions"><button class="tp-btn primary" data-tp-action="mark-done" data-id="${esc(x.id)}">Marcar cumplido</button><button class="tp-btn" data-tp-action="cancel-term" data-id="${esc(x.id)}">Cancelar término</button></div>`:""}</article>`;}).join("");
  }
  function renderTerminosProcesales() {
    const el=root(); if(!el)return;
    ensureShell();
    if(!canAccess()) { el.innerHTML='<div class="tp-alert">El módulo de términos procesales es exclusivo del personal autorizado del despacho.</div>'; return; }
    // Rebuild only if the shell has not been mounted. Preserve filters while navigating tabs.
    if(!el.querySelector("[data-tp-panel]")) { el.dataset.ready="";ensureShell(); }
    if(activeTab==="catalogo")renderCatalog(); else if(activeTab==="rutas")renderRoutes(); else loadOperational(false);
  }
  window.renderTerminosProcesales=renderTerminosProcesales;
  window.abrirTerminosProcesales=()=>{ if(typeof window.switchTab==="function") window.switchTab("terminos-procesales"); };
})();
