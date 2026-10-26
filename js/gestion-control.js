/**
 * JS LegalTech Control — Gestión y control v4.9.1
 * Migración adaptada del módulo SIGDE: Cotizaciones, Gastos y costos, Reportes KPI.
 * Colecciones raíz: cotizaciones y registrosFinancieros. No depende de Cloud Functions.
 */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
  const money = value => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value) || 0);
  const dateISO = value => {
    if (!value) return "";
    if (typeof value.toDate === "function") return value.toDate().toISOString().slice(0, 10);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : d.toISOString().slice(0, 10);
  };
  const dateMx = value => {
    const iso = dateISO(value);
    if (!iso) return "—";
    const d = new Date(`${iso}T12:00:00`);
    return Number.isNaN(d.getTime()) ? esc(iso) : d.toLocaleDateString("es-MX");
  };
  const nowISO = () => new Date().toISOString().slice(0, 10);
  const ROLE_ADMIN = ["Superadministrador", "Administrador"];
  const ROLE_STAFF = ["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado", "Pasante"];
  const CATS = ["Costo fijo", "Costo variable", "Gasto procesal", "Gasto de personal", "Gasto administrativo", "Tecnología", "Marketing", "Servicios profesionales", "Otros"];
  const INCOME_CATS = ["Honorarios", "Anticipos", "Recuperación de gastos", "Otros ingresos"];
  const SERVICES = ["Consulta y asesoría jurídica", "Elaboración de contrato", "Revisión de contrato", "Demanda / escrito inicial", "Contestación de demanda", "Audiencia / comparecencia", "Amparo", "Juicio civil", "Juicio mercantil", "Juicio laboral", "Juicio familiar", "Asesoría especializada", "Otros servicios profesionales"];
  const QUOTE_STATUS = ["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA", "VENCIDA", "ARCHIVADA"];
  const state = { view: "cotizaciones", session: null, quotes: [], records: [], clients: [], matters: [], quoteItems: [], expenseTab: "expense", period: "month" };

  const STYLES = `
  .gctrl-wrap{display:flex;flex-direction:column;gap:16px;min-width:0;color:#172b4d}
  .gctrl-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;padding:18px 20px;border:1px solid #dce4ee;border-radius:16px;background:linear-gradient(135deg,#fff,#f4f8fc)}
  .gctrl-eyebrow{display:block;font-size:11px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#8b6a13;margin-bottom:5px}
  .gctrl-hero h3{font-size:22px;color:#17365d;margin:0 0 7px}.gctrl-hero p{color:#667085;font-size:13px;line-height:1.55;margin:0;max-width:840px}
  .gctrl-subnav{display:flex;gap:8px;flex-wrap:wrap}.gctrl-subnav button{border:1px solid #d0d9e5;background:#fff;color:#344054;padding:9px 12px;border-radius:9px;font-weight:800;cursor:pointer}.gctrl-subnav button.active{background:#17365d;color:#fff;border-color:#17365d}
  .gctrl-toolbar{display:flex;align-items:end;gap:10px;flex-wrap:wrap}.gctrl-toolbar label,.gctrl-form label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:800;color:#475467;min-width:0}
  .gctrl-toolbar input,.gctrl-toolbar select,.gctrl-form input,.gctrl-form select,.gctrl-form textarea{font:inherit;font-weight:500;min-width:0;max-width:100%;width:100%;border:1px solid #cfd8e3;border-radius:8px;padding:9px 10px;background:#fff;color:#172b4d;box-sizing:border-box}
  .gctrl-grid{display:grid;grid-template-columns:minmax(300px,1fr) minmax(320px,1fr);gap:14px;align-items:start}.gctrl-card{min-width:0;max-width:100%;padding:16px;border:1px solid #dce3eb;background:#fff;border-radius:14px;box-shadow:0 2px 9px rgba(16,24,40,.04);overflow:hidden}.gctrl-card h4{font-size:16px;color:#17365d;margin:0 0 7px}.gctrl-muted{font-size:12px;color:#667085;line-height:1.45}.gctrl-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.gctrl-form .full{grid-column:1/-1}.gctrl-form textarea{min-height:76px;resize:vertical}
  .gctrl-items{width:100%;border-collapse:collapse;margin-top:6px;font-size:12px}.gctrl-items th,.gctrl-items td{border-bottom:1px solid #e6ebf2;padding:6px 4px;text-align:left;vertical-align:middle}.gctrl-items th{color:#667085;font-size:10px;text-transform:uppercase}.gctrl-items input{padding:7px!important}.gctrl-items .gctrl-item-desc{min-width:110px}.gctrl-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px}.gctrl-btn{border:1px solid #cbd5e1;background:#fff;color:#17365d;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:800;cursor:pointer}.gctrl-btn.primary{background:#17365d;color:#fff;border-color:#17365d}.gctrl-btn.gold{background:#b8942e;color:#fff;border-color:#b8942e}.gctrl-btn.danger{color:#b42318;border-color:#f0b9b3}.gctrl-btn:disabled{opacity:.5;cursor:not-allowed}
  .gctrl-totalbox{display:grid;gap:7px;border-top:1px solid #e5eaf0;padding-top:12px;margin-top:12px}.gctrl-totalrow{display:flex;justify-content:space-between;gap:12px;color:#475467;font-size:13px}.gctrl-totalrow strong{color:#172b4d}.gctrl-totalrow.total{font-size:17px;font-weight:900;color:#17365d}.gctrl-totalrow.total strong{color:#17365d}.gctrl-history-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:end;margin-bottom:12px}.gctrl-table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}.gctrl-table{width:100%;border-collapse:collapse;min-width:720px;font-size:12px}.gctrl-table th,.gctrl-table td{padding:9px 8px;border-bottom:1px solid #e5eaf0;text-align:left;vertical-align:top}.gctrl-table th{background:#f7f9fc;color:#667085;font-size:10px;text-transform:uppercase;white-space:nowrap}.gctrl-table td .gctrl-muted{display:block;margin-top:3px}.gctrl-badge{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef4ff;color:#2856a6;font-size:10px;font-weight:900}.gctrl-badge.accepted{background:#dcfae6;color:#067647}.gctrl-badge.rejected{background:#fee4e2;color:#b42318}.gctrl-empty{padding:22px;text-align:center;border:1px dashed #cbd5e1;border-radius:11px;color:#667085}.gctrl-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.gctrl-kpi{padding:14px;border-radius:12px;border:1px solid #dce3eb;background:#fff;min-width:0}.gctrl-kpi span{display:block;font-size:11px;color:#667085;font-weight:800}.gctrl-kpi strong{display:block;font-size:clamp(17px,2vw,25px);margin-top:8px;color:#17365d;overflow-wrap:anywhere}.gctrl-kpi small{display:block;font-size:11px;color:#667085;margin-top:5px}.gctrl-chart{display:grid;grid-template-columns:repeat(12,minmax(24px,1fr));align-items:end;gap:5px;height:190px;border-bottom:1px solid #d5dde7;padding:16px 4px 24px;overflow-x:auto}.gctrl-chart-col{min-width:24px;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:end;gap:4px}.gctrl-chart-bar{width:min(100%,28px);border-radius:5px 5px 0 0;background:#17365d;min-height:2px}.gctrl-chart-bar.income{background:#16805d}.gctrl-chart-bar.expense{background:#c08d1a}.gctrl-chart-col small{font-size:9px;color:#667085}.gctrl-chart-col b{font-size:9px;color:#344054}.gctrl-note{padding:11px 13px;background:#f8fafc;border-left:4px solid #c4a448;border-radius:6px;color:#667085;font-size:11px;line-height:1.5}.gctrl-result{padding:12px;border:1px solid #d4e4db;background:#f5fbf7;border-radius:10px}.gctrl-result h4{margin-bottom:8px}.gctrl-inline-select{max-width:132px;padding:6px;border:1px solid #cbd5e1;border-radius:7px;font-size:11px}.gctrl-view-link{color:#175cd3;font-weight:800;text-decoration:none}.gctrl-modal{position:fixed;inset:0;background:#0f172a88;z-index:12000;display:grid;place-items:center;padding:16px}.gctrl-modal-card{background:#fff;border-radius:14px;max-width:650px;width:100%;max-height:90vh;overflow:auto;padding:20px}
  @media(max-width:900px){.gctrl-grid{grid-template-columns:minmax(0,1fr)}.gctrl-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:560px){.gctrl-hero{padding:14px}.gctrl-hero h3{font-size:19px}.gctrl-form{grid-template-columns:minmax(0,1fr)}.gctrl-form .full{grid-column:1}.gctrl-kpis{grid-template-columns:minmax(0,1fr)}.gctrl-card{padding:12px}.gctrl-subnav{overflow-x:auto;flex-wrap:nowrap}.gctrl-subnav button{flex:0 0 auto}.gctrl-toolbar label{width:100%}.gctrl-items{min-width:550px}.gctrl-items-wrap{overflow-x:auto}}
  @media print{.gctrl-hero,.gctrl-subnav,.gctrl-toolbar,.gctrl-actions,.gctrl-note{display:none!important}.gctrl-card{box-shadow:none;break-inside:avoid}}
  `;

  function injectStyles() {
    if ($("gestion-control-styles")) return;
    const style = document.createElement("style"); style.id = "gestion-control-styles"; style.textContent = STYLES; document.head.appendChild(style);
  }

  function sessionNow() {
    try { return JSON.parse(sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session") || "null"); }
    catch (_) { return null; }
  }
  function currentUid() { return String(window.firebaseAuth?.currentUser?.uid || state.session?.uid || state.session?.id || ""); }
  function isAdmin() { return ROLE_ADMIN.includes(state.session?.rol); }
  function getDB() {
    if (!window.db) throw new Error("Firestore no está disponible. Revisa la configuración de Firebase.");
    if (!state.session || state.session.rol === "Cliente") throw new Error("Gestión y control requiere una sesión del personal del despacho.");
    return window.db;
  }
  function localArray(key) { try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; } catch (_) { return []; } }
  function getLocalClients() {
    return localArray("js_legal_clientes").map(x => ({
      id: String(x.id || x.clienteId || ""),
      name: String(x.nombre || x.cliente || x.razonSocial || x.businessName || "Cliente sin nombre"),
      abogadoAsignado: x.abogadoAsignado || ""
    })).filter(x => x.id || x.name);
  }
  function getLocalMatters() {
    return localArray("js_legal_asuntos").map(x => ({
      id: String(x.id || ""), name: [x.folioInterno, x.expediente, x.cliente, x.materia].filter(Boolean).join(" · ") || String(x.id || "Asunto"), clientId: String(x.clienteId || "")
    })).filter(x => x.id);
  }
  function canUseModule() { return state.session && ROLE_STAFF.includes(state.session.rol); }

  async function fetchOwnedCollection(name) {
    const db = getDB();
    let query = db.collection(name);
    if (!isAdmin()) query = query.where("createdByUid", "==", currentUid());
    const snap = await query.get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  function serverTime() { return window.firebase?.firestore?.FieldValue?.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(); }
  function sortByDateDesc(items, field = "fecha") { return [...items].sort((a, b) => String(dateISO(b[field] || b.createdAt || b.date)).localeCompare(String(dateISO(a[field] || a.createdAt || a.date)))); }
  function setInner(hostId, html) { const host = $(hostId); if (host) host.innerHTML = html; return host; }
  function moduleTabs(active) {
    return `<nav class="gctrl-subnav" aria-label="Submódulos de Gestión y control">
      <button type="button" data-gctrl-nav="cotizaciones" class="${active === "cotizaciones" ? "active" : ""}">💼 Cotizaciones</button>
      <button type="button" data-gctrl-nav="gastos-costos" class="${active === "gastos-costos" ? "active" : ""}">💸 Gastos y costos</button>
      <button type="button" data-gctrl-nav="reportes-kpi" class="${active === "reportes-kpi" ? "active" : ""}">📈 Reportes KPI</button>
    </nav>`;
  }
  function hero(title, description, active) {
    return `<header class="gctrl-hero"><div><span class="gctrl-eyebrow">LexGear · Gestión administrativa</span><h3>${esc(title)}</h3><p>${esc(description)}</p></div>${moduleTabs(active)}</header>`;
  }
  function bindModuleTabs(host) {
    host?.querySelectorAll("[data-gctrl-nav]").forEach(btn => btn.addEventListener("click", () => window.switchTab?.(btn.dataset.gctrlNav)));
  }
  function statusBadge(status) {
    const v = String(status || "BORRADOR").toUpperCase();
    const cls = v === "ACEPTADA" ? "accepted" : ["RECHAZADA", "VENCIDA"].includes(v) ? "rejected" : "";
    return `<span class="gctrl-badge ${cls}">${esc(v)}</span>`;
  }
  function getClientOptions(selected = "") {
    return `<option value="">— Seleccionar cliente / captura manual —</option>` + state.clients.map(c => `<option value="${esc(c.id)}" ${String(c.id) === String(selected) ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  }
  function getMatterOptions(selected = "") {
    return `<option value="">— Sin asunto relacionado —</option>` + state.matters.map(m => `<option value="${esc(m.id)}" ${String(m.id) === String(selected) ? "selected" : ""}>${esc(m.name)}</option>`).join("");
  }

  // ----------------------------- Cotizaciones -----------------------------
  function quoteItemRow(item = {}) {
    const id = item.rowId || `qi-${Math.random().toString(36).slice(2, 10)}`;
    return `<tr data-quote-item-row="${id}"><td><input class="gctrl-item-desc" aria-label="Concepto" placeholder="Servicio u honorario" value="${esc(item.concepto || "")}" data-qi="concepto"></td><td><input aria-label="Cantidad" type="number" min="0" step="0.01" value="${Number(item.cantidad ?? 1)}" data-qi="cantidad"></td><td><input aria-label="Precio unitario" type="number" min="0" step="0.01" value="${Number(item.precio || 0)}" data-qi="precio"></td><td class="gctrl-item-total">${money((Number(item.cantidad ?? 1) || 0) * (Number(item.precio) || 0))}</td><td><button type="button" class="gctrl-btn danger" data-qi-remove="1" aria-label="Eliminar concepto">×</button></td></tr>`;
  }
  function quoteItemsFromForm() {
    return [...document.querySelectorAll("#gctrl-quote-items tbody tr")].map(row => ({
      concepto: row.querySelector('[data-qi="concepto"]')?.value.trim() || "",
      cantidad: Number(row.querySelector('[data-qi="cantidad"]')?.value || 0),
      precio: Number(row.querySelector('[data-qi="precio"]')?.value || 0)
    })).filter(x => x.concepto && x.cantidad > 0 && x.precio >= 0);
  }
  function quoteNumbers(items = quoteItemsFromForm()) {
    const subtotal = items.reduce((s, x) => s + (Number(x.cantidad) || 0) * (Number(x.precio) || 0), 0);
    const gastos = Number($("gctrl-quote-gastos")?.value || 0);
    const descuento = Number($("gctrl-quote-descuento")?.value || 0);
    const total = Math.max(0, subtotal + gastos - descuento);
    const anticipoPct = Math.min(100, Math.max(0, Number($("gctrl-quote-anticipo")?.value || 0)));
    const anticipo = total * anticipoPct / 100;
    return { subtotal, gastos, descuento, total, anticipoPct, anticipo, saldo: total - anticipo };
  }
  function updateQuoteTotals() {
    const items = quoteItemsFromForm();
    document.querySelectorAll("#gctrl-quote-items tbody tr").forEach(row => {
      const qty = Number(row.querySelector('[data-qi="cantidad"]')?.value || 0);
      const price = Number(row.querySelector('[data-qi="precio"]')?.value || 0);
      const totalCell = row.querySelector(".gctrl-item-total"); if (totalCell) totalCell.textContent = money(qty * price);
    });
    const n = quoteNumbers(items);
    const names = { subtotal: "subtotal", gastos: "gastos", descuento: "descuento", total: "total", anticipo: "anticipo", saldo: "saldo" };
    Object.entries(names).forEach(([key, id]) => { const el = $(`gctrl-quote-total-${id}`); if (el) el.textContent = money(n[key]); });
  }
  function renderQuotePage(host) {
    host.innerHTML = `${hero("Cotizaciones", "Genera, controla e imprime propuestas de servicios profesionales con conceptos, gastos, descuentos, anticipo, saldo y estado comercial.", "cotizaciones")}
      <div class="gctrl-toolbar"><button class="gctrl-btn" type="button" id="gctrl-import-legacy">↥ Importar cotizaciones locales</button><span class="gctrl-muted" id="gctrl-import-note">Las cotizaciones nuevas se guardan en Firestore según tu perfil.</span></div>
      <div class="gctrl-grid"><section class="gctrl-card"><h4>Nueva propuesta</h4><p class="gctrl-muted" style="margin-bottom:12px">Revisa los importes y las condiciones antes de guardar o entregar al cliente.</p>
        <form id="gctrl-quote-form" class="gctrl-form">
          <label>Cliente registrado<select id="gctrl-quote-client">${getClientOptions()}</select></label>
          <label>Nombre del cliente<input id="gctrl-quote-client-name" required placeholder="Nombre o razón social"></label>
          <label>Asunto / referencia<input id="gctrl-quote-asunto" placeholder="Expediente o referencia interna"></label>
          <label>Servicio<select id="gctrl-quote-servicio">${SERVICES.map(x => `<option>${esc(x)}</option>`).join("")}</select></label>
          <label>Asunto relacionado<select id="gctrl-quote-matter">${getMatterOptions()}</select></label>
          <label>Vigencia (días)<input id="gctrl-quote-vigencia" type="number" min="1" max="365" value="30" required></label>
          <div class="full"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap"><strong>Conceptos y honorarios</strong><button class="gctrl-btn" type="button" id="gctrl-quote-add-item">+ Agregar concepto</button></div>
            <div class="gctrl-items-wrap" style="overflow-x:auto"><table class="gctrl-items" id="gctrl-quote-items"><thead><tr><th>Concepto</th><th>Cant.</th><th>Precio unit.</th><th>Total</th><th></th></tr></thead><tbody>${quoteItemRow({ concepto: "Servicios profesionales", cantidad: 1, precio: 0 })}</tbody></table></div></div>
          <label>Gastos estimados (MXN)<input id="gctrl-quote-gastos" type="number" min="0" step="0.01" value="0"></label>
          <label>Descuento (MXN)<input id="gctrl-quote-descuento" type="number" min="0" step="0.01" value="0"></label>
          <label>Anticipo (%)<input id="gctrl-quote-anticipo" type="number" min="0" max="100" step="0.01" value="50"></label>
          <label>Forma de pago<input id="gctrl-quote-forma-pago" value="50% al inicio y 50% al concluir"></label>
          <label class="full">Incluye<textarea id="gctrl-quote-incluye" placeholder="Una actividad por línea"></textarea></label>
          <label class="full">No incluye<textarea id="gctrl-quote-no-incluye" placeholder="Derechos, peritos, traslados, erogaciones de terceros..."></textarea></label>
          <label class="full">Observaciones<textarea id="gctrl-quote-observaciones"></textarea></label>
          <div class="full gctrl-totalbox">
            <div class="gctrl-totalrow"><span>Subtotal de conceptos</span><strong id="gctrl-quote-total-subtotal">$0.00</strong></div>
            <div class="gctrl-totalrow"><span>Gastos estimados</span><strong id="gctrl-quote-total-gastos">$0.00</strong></div>
            <div class="gctrl-totalrow"><span>Descuento</span><strong id="gctrl-quote-total-descuento">$0.00</strong></div>
            <div class="gctrl-totalrow total"><span>Total</span><strong id="gctrl-quote-total-total">$0.00</strong></div>
            <div class="gctrl-totalrow"><span>Anticipo estimado</span><strong id="gctrl-quote-total-anticipo">$0.00</strong></div>
            <div class="gctrl-totalrow"><span>Saldo estimado</span><strong id="gctrl-quote-total-saldo">$0.00</strong></div>
          </div>
          <div class="full gctrl-actions"><button class="gctrl-btn primary" type="submit">Guardar cotización</button><button class="gctrl-btn" type="button" id="gctrl-quote-clear">Limpiar</button></div>
        </form></section>
        <section class="gctrl-card"><h4>Historial de cotizaciones</h4><p class="gctrl-muted" style="margin-bottom:12px">Consulta y actualiza el estado de las propuestas creadas por tu perfil o autorizadas para administración.</p>
          <div class="gctrl-history-tools"><label>Buscar<input id="gctrl-quote-search" type="search" placeholder="Folio, cliente o asunto"></label><label>Estado<select id="gctrl-quote-filter"><option value="all">Todos</option>${QUOTE_STATUS.map(x => `<option>${x}</option>`).join("")}</select></label><button class="gctrl-btn" type="button" id="gctrl-quote-refresh">Actualizar</button></div>
          <div id="gctrl-quote-history"><div class="gctrl-empty">Cargando cotizaciones…</div></div>
        </section></div>
      <p class="gctrl-note">Las cotizaciones son propuestas comerciales; no sustituyen el contrato de prestación de servicios. Revisa honorarios, gastos, impuestos aplicables, alcance y vigencia antes de entregarlas.</p>`;
    bindModuleTabs(host);
    const form = $("gctrl-quote-form");
    $("gctrl-quote-client")?.addEventListener("change", () => {
      const chosen = state.clients.find(c => String(c.id) === String($("gctrl-quote-client")?.value));
      if (chosen && $("gctrl-quote-client-name") && !$("gctrl-quote-client-name").value.trim()) $("gctrl-quote-client-name").value = chosen.name;
    });
    $("gctrl-quote-add-item")?.addEventListener("click", () => {
      const tbody = document.querySelector("#gctrl-quote-items tbody"); if (tbody) tbody.insertAdjacentHTML("beforeend", quoteItemRow({ concepto: "", cantidad: 1, precio: 0 }));
      updateQuoteTotals();
    });
    $("gctrl-quote-items")?.addEventListener("input", event => { if (event.target.matches("input")) updateQuoteTotals(); });
    $("gctrl-quote-items")?.addEventListener("click", event => {
      const btn = event.target.closest("[data-qi-remove]"); if (!btn) return;
      const rows = document.querySelectorAll("#gctrl-quote-items tbody tr");
      if (rows.length <= 1) { const row = rows[0]; if (row) { row.querySelector('[data-qi="concepto"]').value = ""; row.querySelector('[data-qi="cantidad"]').value = "1"; row.querySelector('[data-qi="precio"]').value = "0"; } }
      else btn.closest("tr")?.remove();
      updateQuoteTotals();
    });
    ["gctrl-quote-gastos", "gctrl-quote-descuento", "gctrl-quote-anticipo"].forEach(id => $(id)?.addEventListener("input", updateQuoteTotals));
    $("gctrl-quote-clear")?.addEventListener("click", () => renderCurrent());
    form?.addEventListener("submit", saveQuoteFromForm);
    ["gctrl-quote-search", "gctrl-quote-filter"].forEach(id => $(id)?.addEventListener(id.endsWith("search") ? "input" : "change", renderQuoteHistory));
    $("gctrl-quote-refresh")?.addEventListener("click", loadFinancialDataThenRender);
    $("gctrl-import-legacy")?.addEventListener("click", importLegacyQuotes);
    updateQuoteTotals();
    renderQuoteHistory();
    setImportNote();
  }
  function setImportNote() {
    const note = $("gctrl-import-note"), button = $("gctrl-import-legacy");
    const legacy = localArray("jslt_cotizaciones");
    let imported = []; try { imported = JSON.parse(localStorage.getItem("jslt_cotizaciones_importadas_v490") || "[]"); } catch (_) {}
    const pending = legacy.filter(x => x?.folio && !imported.includes(String(x.folio)));
    if (note) note.textContent = pending.length ? `Hay ${pending.length} cotización(es) guardada(s) en este navegador pendientes de importar.` : "No se detectan cotizaciones locales pendientes de importar.";
    if (button) button.disabled = !pending.length;
  }
  async function saveQuoteFromForm(event) {
    event.preventDefault();
    try {
      const clientId = $("gctrl-quote-client")?.value || "";
      const clientKnown = state.clients.find(c => String(c.id) === String(clientId));
      const cliente = $("gctrl-quote-client-name")?.value.trim() || clientKnown?.name || "";
      const items = quoteItemsFromForm();
      if (!cliente) throw new Error("Captura el nombre del cliente.");
      if (!items.length) throw new Error("Agrega al menos un concepto con descripción y cantidad válida.");
      const n = quoteNumbers(items);
      if (!(n.total > 0)) throw new Error("El total de la propuesta debe ser mayor que cero.");
      const vigenciaDias = Math.min(365, Math.max(1, Number($("gctrl-quote-vigencia")?.value || 30)));
      const fecha = nowISO();
      const vence = new Date(`${fecha}T12:00:00`); vence.setDate(vence.getDate() + vigenciaDias);
      const folio = `COT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const matterId = $("gctrl-quote-matter")?.value || "";
      const matter = state.matters.find(m => String(m.id) === String(matterId));
      const data = {
        folio, fecha, createdAt: serverTime(), updatedAt: serverTime(), createdByUid: currentUid(),
        createdByNombre: state.session?.nombre || state.session?.usuario || "Usuario", createdByRol: state.session?.rol || "",
        abogadoAsignado: state.session?.usuario || state.session?.correo || "",
        clienteId: clientId, cliente, asunto: $("gctrl-quote-asunto")?.value.trim() || "",
        matterId, matterName: matter?.name || "", servicio: $("gctrl-quote-servicio")?.value || "",
        items, subtotal: n.subtotal, gastos: n.gastos, descuento: n.descuento, total: n.total,
        anticipoPct: n.anticipoPct, anticipo: n.anticipo, saldo: n.saldo,
        vigenciaDias, validaHasta: vence.toISOString().slice(0, 10), formaPago: $("gctrl-quote-forma-pago")?.value.trim() || "",
        incluye: $("gctrl-quote-incluye")?.value || "", noIncluye: $("gctrl-quote-no-incluye")?.value || "",
        observaciones: $("gctrl-quote-observaciones")?.value || "", estado: "BORRADOR", importedFromLocal: false
      };
      const ref = await getDB().collection("cotizaciones").add(data);
      data.id = ref.id; state.quotes = [data, ...state.quotes];
      renderQuotePreview(data);
      renderQuoteHistory();
      alert(`Cotización ${folio} guardada.`);
    } catch (error) {
      console.error("No se pudo guardar la cotización:", error);
      alert(error?.message || "No se pudo guardar la cotización. Revisa tu conexión y permisos.");
    }
  }
  async function importLegacyQuotes() {
    const button = $("gctrl-import-legacy");
    if (!button) return;
    let imported = []; try { imported = JSON.parse(localStorage.getItem("jslt_cotizaciones_importadas_v490") || "[]"); } catch (_) { imported = []; }
    const legacy = localArray("jslt_cotizaciones").filter(x => x?.folio && !imported.includes(String(x.folio)));
    if (!legacy.length) { setImportNote(); return; }
    if (!confirm(`Se importarán ${legacy.length} cotización(es) locales a la base de LegalTech. ¿Continuar?`)) return;
    button.disabled = true;
    try {
      for (const old of legacy) {
        const honor = Number(old.honor || old.honorarios || 0), gastos = Number(old.gastos || 0), descuento = Number(old.descuento ?? old.desc ?? 0);
        const total = Number(old.total || Math.max(0, honor + gastos - descuento));
        const fecha = dateISO(old.fecha) || nowISO();
        const data = {
          folio: String(old.folio), fecha, createdAt: serverTime(), updatedAt: serverTime(), createdByUid: currentUid(),
          createdByNombre: state.session?.nombre || state.session?.usuario || "Usuario", createdByRol: state.session?.rol || "",
          abogadoAsignado: state.session?.usuario || state.session?.correo || "", clienteId: "", cliente: String(old.cliente || "Cliente sin nombre"),
          asunto: String(old.asunto || ""), matterId: "", matterName: "", servicio: String(old.servicio || "Servicios profesionales"),
          metodo: String(old.metodo || "fijo"), items: [{ concepto: String(old.servicio || "Servicios profesionales"), cantidad: 1, precio: honor }],
          subtotal: honor, gastos, descuento, total, anticipoPct: total ? Number(old.anticipo || 0) / total * 100 : 0,
          anticipo: Number(old.anticipo || 0), saldo: Number(old.saldo ?? Math.max(0, total - Number(old.anticipo || 0))),
          vigenciaDias: 30, validaHasta: "", formaPago: "Importada de cotizaciones locales", incluye: "", noIncluye: "",
          observaciones: "Importada desde el historial local de LegalTech.", estado: QUOTE_STATUS.includes(String(old.estado || "").toUpperCase()) ? String(old.estado).toUpperCase() : "BORRADOR", importedFromLocal: true
        };
        await getDB().collection("cotizaciones").add(data);
        imported.push(String(old.folio));
      }
      localStorage.setItem("jslt_cotizaciones_importadas_v490", JSON.stringify([...new Set(imported)]));
      await loadFinancialDataThenRender();
      alert(`Importación terminada: ${legacy.length} cotización(es). Los originales locales se conservaron.`);
    } catch (error) {
      console.error(error);
      alert(`No terminó la importación. Los registros ya guardados no se pierden; revisa el historial antes de repetirla. ${error.message || ""}`);
    } finally { button.disabled = false; setImportNote(); }
  }
  function renderQuoteHistory() {
    const host = $("gctrl-quote-history"); if (!host) return;
    const term = String($("gctrl-quote-search")?.value || "").trim().toLocaleLowerCase("es-MX");
    const status = $("gctrl-quote-filter")?.value || "all";
    const rows = sortByDateDesc(state.quotes, "fecha").filter(q => {
      const text = [q.folio, q.cliente, q.asunto, q.servicio].join(" ").toLocaleLowerCase("es-MX");
      return (!term || text.includes(term)) && (status === "all" || String(q.estado || "BORRADOR").toUpperCase() === status);
    });
    if (!rows.length) { host.innerHTML = `<div class="gctrl-empty">No hay cotizaciones para estos filtros.</div>`; return; }
    host.innerHTML = `<div class="gctrl-table-wrap"><table class="gctrl-table"><thead><tr><th>Folio / fecha</th><th>Cliente y asunto</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(q => `<tr>
      <td><strong>${esc(q.folio || q.id)}</strong><span class="gctrl-muted">${dateMx(q.fecha || q.createdAt)}</span></td>
      <td><strong>${esc(q.cliente || "Sin cliente")}</strong><span class="gctrl-muted">${esc(q.asunto || q.servicio || "Sin referencia")}</span></td>
      <td><strong>${money(q.total || 0)}</strong><span class="gctrl-muted">Saldo: ${money(q.saldo || 0)}</span></td>
      <td><select class="gctrl-inline-select" data-quote-status="${esc(q.id)}" aria-label="Cambiar estado">${QUOTE_STATUS.map(st => `<option ${String(q.estado || "BORRADOR").toUpperCase() === st ? "selected" : ""}>${st}</option>`).join("")}</select></td>
      <td><div class="gctrl-actions" style="margin:0"><button type="button" class="gctrl-btn" data-quote-print="${esc(q.id)}">Imprimir</button>${(isAdmin() || q.createdByUid === currentUid()) ? `<button type="button" class="gctrl-btn danger" data-quote-delete="${esc(q.id)}">Eliminar</button>` : ""}</div></td>
    </tr>`).join("")}</tbody></table></div>`;
    host.querySelectorAll("[data-quote-status]").forEach(sel => sel.addEventListener("change", async () => {
      try {
        const ref = getDB().collection("cotizaciones").doc(sel.dataset.quoteStatus);
        await ref.update({ estado: sel.value, updatedAt: serverTime() });
        const q = state.quotes.find(x => x.id === sel.dataset.quoteStatus); if (q) q.estado = sel.value;
        renderQuoteHistory();
      } catch (error) { alert(`No se pudo actualizar el estado: ${error.message || error}`); }
    }));
    host.querySelectorAll("[data-quote-print]").forEach(btn => btn.addEventListener("click", () => {
      const quote = state.quotes.find(x => x.id === btn.dataset.quotePrint); if (quote) renderQuotePreview(quote, true);
    }));
    host.querySelectorAll("[data-quote-delete]").forEach(btn => btn.addEventListener("click", async () => {
      const quote = state.quotes.find(x => x.id === btn.dataset.quoteDelete); if (!quote || !confirm(`¿Eliminar la cotización ${quote.folio || "seleccionada"}?`)) return;
      try { await getDB().collection("cotizaciones").doc(quote.id).delete(); state.quotes = state.quotes.filter(x => x.id !== quote.id); renderQuoteHistory(); }
      catch (error) { alert(`No se pudo eliminar: ${error.message || error}`); }
    }));
  }
  function renderQuotePreview(q, print = false) {
    const items = Array.isArray(q.items) ? q.items : [];
    const lineas = items.map(i => `<tr><td>${esc(i.concepto || i.service || "Servicio")}</td><td>${Number(i.cantidad || 1)}</td><td>${money(i.precio || i.price || 0)}</td><td>${money((Number(i.cantidad || 1) || 0) * (Number(i.precio || i.price) || 0))}</td></tr>`).join("");
    const includes = String(q.incluye || "").split(/\n+/).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("");
    const excludes = String(q.noIncluye || "").split(/\n+/).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("");
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(q.folio || "Cotización")}</title><style>body{font-family:Arial,sans-serif;color:#1f2937;max-width:900px;margin:30px auto;padding:20px}h1,h2{color:#17365d}.head{border-bottom:3px solid #b8942e;padding-bottom:16px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:18px 0}.panel{background:#f8fafc;padding:12px;border-radius:8px;margin-top:14px}table{border-collapse:collapse;width:100%;margin:14px 0}th,td{border-bottom:1px solid #d5dbe4;padding:8px;text-align:left}th{background:#f1f5f9}.total{font-size:20px;font-weight:900;color:#17365d;text-align:right;margin-top:18px}.note{font-size:11px;color:#667085}@media print{.no-print{display:none}}</style></head><body><header class="head"><h1>Propuesta de servicios jurídicos</h1><strong>${esc(state.session?.nombre || "Despacho jurídico")}</strong><p>Folio ${esc(q.folio || "—")} · Fecha ${dateMx(q.fecha)} · Vigencia ${esc(q.validaHasta || "por confirmar")}</p></header><div class="meta"><div><b>Cliente:</b> ${esc(q.cliente || "—")}</div><div><b>Asunto:</b> ${esc(q.asunto || "—")}</div><div><b>Servicio:</b> ${esc(q.servicio || "—")}</div><div><b>Estado:</b> ${esc(q.estado || "BORRADOR")}</div></div><table><thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio unitario</th><th>Importe</th></tr></thead><tbody>${lineas || `<tr><td>${esc(q.servicio || "Servicio profesional")}</td><td>1</td><td>${money(q.subtotal || 0)}</td><td>${money(q.subtotal || 0)}</td></tr>`}</tbody></table><div class="panel"><div>Subtotal: ${money(q.subtotal || 0)}</div><div>Gastos estimados: ${money(q.gastos || 0)}</div><div>Descuento: ${money(q.descuento || 0)}</div><div class="total">Total: ${money(q.total || 0)}</div><div>Anticipo: ${money(q.anticipo || 0)} · Saldo: ${money(q.saldo || 0)}</div></div><h2>Incluye</h2><ul>${includes || "<li>Servicios descritos en esta propuesta.</li>"}</ul><h2>No incluye</h2><ul>${excludes || "<li>Gastos, derechos, peritos, traslados y erogaciones de terceros, salvo pacto por escrito.</li>"}</ul><p><b>Forma de pago:</b> ${esc(q.formaPago || "Por acordar")}</p><p>${esc(q.observaciones || "")}</p><p class="note">Documento de propuesta; validar alcance, importes, impuestos y condiciones antes de su aceptación. No sustituye el contrato de prestación de servicios.</p><button class="no-print" onclick="window.print()">Imprimir / Guardar PDF</button></body></html>`;
    if (print) {
      const w = window.open("", "_blank", "width=1000,height=800");
      if (!w) { alert("Permite ventanas emergentes para imprimir la cotización."); return; }
      w.document.open(); w.document.write(html); w.document.close(); return;
    }
    let target = $("gctrl-quote-preview");
    if (!target) {
      const host = $("gestion-control-cotizaciones"); if (!host) return;
      const box = document.createElement("div"); box.id = "gctrl-quote-preview"; box.className = "gctrl-card"; box.style.marginTop = "14px"; host.appendChild(box); target = box;
    }
    target.innerHTML = `<div class="gctrl-result"><h4>Cotización guardada · ${esc(q.folio || "")}</h4><p>El registro quedó en la base de LegalTech. Puedes imprimir o abrir una copia para PDF.</p><div class="gctrl-actions"><button class="gctrl-btn primary" id="gctrl-preview-print">Imprimir / PDF</button></div></div>`;
    $("gctrl-preview-print")?.addEventListener("click", () => renderQuotePreview(q, true));
  }

  // ----------------------------- Gastos y costos -----------------------------
  function renderExpensesPage(host) {
    host.innerHTML = `${hero("Gastos y costos", "Registra ingresos, gastos procesales, costos fijos y variables, comprobantes, proveedores y asuntos asociados.", "gastos-costos")}
      <div class="gctrl-toolbar"><label>Mes para la tabla<input type="month" id="gctrl-fin-month" value="${nowISO().slice(0, 7)}"></label><button class="gctrl-btn" id="gctrl-fin-refresh" type="button">Actualizar</button></div>
      <div class="gctrl-card"><div class="gctrl-subnav" role="group" aria-label="Tipo de movimiento"><button type="button" data-fin-tab="expense" class="${state.expenseTab === "expense" ? "active" : ""}">💸 Gastos y costos</button><button type="button" data-fin-tab="income" class="${state.expenseTab === "income" ? "active" : ""}">💰 Ingresos registrados</button></div></div>
      <div class="gctrl-grid"><section class="gctrl-card" id="gctrl-fin-form-card"></section><section class="gctrl-card" id="gctrl-fin-table-card"><div class="gctrl-empty">Cargando movimientos…</div></section></div>
      <p class="gctrl-note">Los datos son registros administrativos capturados por el despacho. No sustituyen contabilidad, facturación electrónica ni asesoría fiscal. Valida clasificación e importes antes de utilizar los reportes.</p>`;
    bindModuleTabs(host);
    host.querySelectorAll("[data-fin-tab]").forEach(button => button.addEventListener("click", () => {
      state.expenseTab = button.dataset.finTab;
      host.querySelectorAll("[data-fin-tab]").forEach(b => b.classList.toggle("active", b === button));
      renderExpenseForm(); renderExpenseTable();
    }));
    $("gctrl-fin-month")?.addEventListener("change", renderExpenseTable);
    $("gctrl-fin-refresh")?.addEventListener("click", loadFinancialDataThenRender);
    renderExpenseForm(); renderExpenseTable();
  }
  function renderExpenseForm() {
    const host = $("gctrl-fin-form-card"); if (!host) return;
    const income = state.expenseTab === "income";
    host.innerHTML = `<h4>${income ? "Registrar ingreso" : "Registrar gasto / costo"}</h4><p class="gctrl-muted" style="margin-bottom:12px">${income ? "Registra honorarios, anticipos y otros ingresos efectivamente recibidos." : "Captura costos y gastos con fecha, clasificador, tercero y soporte documental."}</p>
      <form id="gctrl-fin-form" class="gctrl-form">
        <label>Fecha<input id="gctrl-fin-date" type="date" value="${nowISO()}" required></label>
        <label>Clasificador<select id="gctrl-fin-category">${(income ? INCOME_CATS : CATS).map(c => `<option>${esc(c)}</option>`).join("")}</select></label>
        <label class="full">Concepto<input id="gctrl-fin-concept" required placeholder="Ej. Mensajería, anticipo, renta, perito..."></label>
        <label>Importe (MXN)<input id="gctrl-fin-amount" type="number" min="0.01" step="0.01" required></label>
        <label>Tipo de tercero<select id="gctrl-fin-party-type"><option value="provider">Proveedor / tercero</option><option value="client" ${income ? "selected" : ""}>Cliente</option></select></label>
        <label id="gctrl-fin-party-wrap">Proveedor / referencia<input id="gctrl-fin-party" placeholder="Nombre o referencia"></label>
        <label id="gctrl-fin-client-wrap" style="display:none">Cliente relacionado<select id="gctrl-fin-client">${getClientOptions()}</select></label>
        <label class="full">Asunto relacionado<select id="gctrl-fin-matter">${getMatterOptions()}</select></label>
        ${income ? "" : `<label class="gctrl-inline-check"><span>Cuenta con factura</span><input id="gctrl-fin-invoice" type="checkbox"></label><label>UUID factura<input id="gctrl-fin-uuid" placeholder="Opcional"></label>`}
        <label class="full">Descripción / observaciones<textarea id="gctrl-fin-description"></textarea></label>
        <div class="full gctrl-actions"><button type="submit" class="gctrl-btn primary">Guardar ${income ? "ingreso" : "gasto / costo"}</button></div>
      </form>`;
    const partyType = $("gctrl-fin-party-type");
    const syncParty = () => {
      const client = partyType?.value === "client";
      if ($("gctrl-fin-party-wrap")) $("gctrl-fin-party-wrap").style.display = client ? "none" : "flex";
      if ($("gctrl-fin-client-wrap")) $("gctrl-fin-client-wrap").style.display = client ? "flex" : "none";
    };
    partyType?.addEventListener("change", syncParty); syncParty();
    $("gctrl-fin-form")?.addEventListener("submit", saveFinancialRecord);
  }
  async function saveFinancialRecord(event) {
    event.preventDefault();
    try {
      const partyType = $("gctrl-fin-party-type")?.value || "provider";
      const clientId = partyType === "client" ? ($("gctrl-fin-client")?.value || "") : "";
      const client = state.clients.find(c => String(c.id) === String(clientId));
      const matterId = $("gctrl-fin-matter")?.value || "";
      const matter = state.matters.find(m => String(m.id) === String(matterId));
      const amount = Number($("gctrl-fin-amount")?.value || 0);
      if (!(amount > 0)) throw new Error("El importe debe ser mayor que cero.");
      const data = {
        type: state.expenseTab === "income" ? "income" : "expense",
        date: $("gctrl-fin-date")?.value || nowISO(), category: $("gctrl-fin-category")?.value || "Otros",
        concept: $("gctrl-fin-concept")?.value.trim() || "", amount,
        supplier: partyType === "client" ? (client?.name || "") : ($("gctrl-fin-party")?.value.trim() || ""),
        partyType, clientId, clientName: client?.name || "", matterId, matterName: matter?.name || "",
        invoice: $("gctrl-fin-invoice")?.checked === true, invoiceUuid: $("gctrl-fin-uuid")?.value.trim() || "",
        description: $("gctrl-fin-description")?.value.trim() || "", createdByUid: currentUid(),
        createdByNombre: state.session?.nombre || state.session?.usuario || "Usuario", createdByRol: state.session?.rol || "",
        abogadoAsignado: state.session?.usuario || state.session?.correo || "", createdAt: serverTime(), updatedAt: serverTime()
      };
      if (!data.concept) throw new Error("El concepto es obligatorio.");
      await getDB().collection("registrosFinancieros").add(data);
      alert(`${data.type === "income" ? "Ingreso" : "Gasto / costo"} guardado.`);
      await loadFinancialDataThenRender();
    } catch (error) { console.error(error); alert(error?.message || "No fue posible guardar el movimiento."); }
  }
  function renderExpenseTable() {
    const host = $("gctrl-fin-table-card"); if (!host) return;
    const month = $("gctrl-fin-month")?.value || nowISO().slice(0, 7);
    const items = sortByDateDesc(state.records.filter(r => String(r.date || "").slice(0, 7) === month && r.type === state.expenseTab), "date");
    const total = items.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const invoices = items.filter(r => r.invoice === true).length;
    host.innerHTML = `<h4>${state.expenseTab === "income" ? "Ingresos" : "Gastos y costos"} · ${esc(new Date(`${month}-15T12:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" }))}</h4>
      <div class="gctrl-kpis" style="grid-template-columns:repeat(3,minmax(0,1fr));margin:12px 0"><div class="gctrl-kpi"><span>Registros</span><strong>${items.length}</strong></div><div class="gctrl-kpi"><span>Total del periodo</span><strong>${money(total)}</strong></div><div class="gctrl-kpi"><span>${state.expenseTab === "income" ? "Clientes / origen" : "Con factura"}</span><strong>${state.expenseTab === "income" ? new Set(items.map(r => r.clientId || r.supplier).filter(Boolean)).size : invoices}</strong></div></div>
      ${items.length ? `<div class="gctrl-table-wrap"><table class="gctrl-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Clasificador</th><th>Asunto</th><th>Tercero / factura</th><th>Importe</th><th></th></tr></thead><tbody>${items.map(r => `<tr><td>${dateMx(r.date)}</td><td><strong>${esc(r.concept || "—")}</strong><span class="gctrl-muted">${esc(r.description || "")}</span></td><td><span class="gctrl-badge">${esc(r.category || "Otros")}</span></td><td>${esc(r.matterName || "General")}</td><td>${esc(r.supplier || "—")}<span class="gctrl-muted">${state.expenseTab === "expense" ? (r.invoice ? `Factura: ${esc(r.invoiceUuid || "Sí")}` : "Sin factura marcada") : esc(r.clientName || "Ingreso general")}</span></td><td><strong>${money(r.amount)}</strong></td><td>${isAdmin() || r.createdByUid === currentUid() ? `<button type="button" class="gctrl-btn danger" data-fin-delete="${esc(r.id)}">Eliminar</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<div class="gctrl-empty">No hay movimientos para el mes y tipo seleccionados.</div>`}`;
    host.querySelectorAll("[data-fin-delete]").forEach(btn => btn.addEventListener("click", async () => {
      const record = state.records.find(r => r.id === btn.dataset.finDelete);
      if (!record || !confirm(`¿Eliminar el movimiento «${record.concept || "sin concepto"}» por ${money(record.amount)}?`)) return;
      try { await getDB().collection("registrosFinancieros").doc(record.id).delete(); state.records = state.records.filter(r => r.id !== record.id); renderExpenseTable(); }
      catch (error) { alert(`No se pudo eliminar: ${error.message || error}`); }
    }));
  }

  // ----------------------------- Reportes KPI -----------------------------
  function monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
  function reportRange(period) {
    const now = new Date();
    if (period === "previous-month") return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999) };
    if (period === "quarter") { const q = Math.floor(now.getMonth() / 3); return { from: new Date(now.getFullYear(), q * 3, 1), to: new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999) }; }
    if (period === "year") return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999) };
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) };
  }
  function inRange(value, range) {
    const iso = dateISO(value); if (!iso) return false;
    const d = new Date(`${iso}T12:00:00`); return d >= range.from && d <= range.to;
  }
  function renderReportsPage(host) {
    const month = nowISO().slice(0, 7);
    host.innerHTML = `${hero("Reportes KPI", "Indicadores comerciales, operativos y financieros construidos con los registros del despacho y con filtros temporales.", "reportes-kpi")}
      <div class="gctrl-toolbar"><label>Periodo<select id="gctrl-report-period"><option value="month">Mes actual</option><option value="previous-month">Mes anterior</option><option value="quarter">Trimestre actual</option><option value="year">Año actual</option><option value="custom">Periodo personalizado</option></select></label><label id="gctrl-report-from-wrap" style="display:none">Desde<input id="gctrl-report-from" type="date" value="${month}-01"></label><label id="gctrl-report-to-wrap" style="display:none">Hasta<input id="gctrl-report-to" type="date" value="${nowISO()}"></label><button class="gctrl-btn" id="gctrl-report-refresh" type="button">Actualizar</button><button class="gctrl-btn" id="gctrl-report-print" type="button">Imprimir informe</button></div>
      <div id="gctrl-report-content"><div class="gctrl-empty">Calculando indicadores…</div></div>`;
    bindModuleTabs(host);
    const update = () => {
      const custom = $("gctrl-report-period")?.value === "custom";
      if ($("gctrl-report-from-wrap")) $("gctrl-report-from-wrap").style.display = custom ? "flex" : "none";
      if ($("gctrl-report-to-wrap")) $("gctrl-report-to-wrap").style.display = custom ? "flex" : "none";
      drawReports();
    };
    ["gctrl-report-period", "gctrl-report-from", "gctrl-report-to"].forEach(id => $(id)?.addEventListener(id === "gctrl-report-period" ? "change" : "change", update));
    $("gctrl-report-refresh")?.addEventListener("click", loadFinancialDataThenRender);
    $("gctrl-report-print")?.addEventListener("click", () => window.print());
    drawReports();
  }
  function drawReports() {
    const host = $("gctrl-report-content"); if (!host) return;
    const period = $("gctrl-report-period")?.value || "month";
    let range = reportRange(period);
    if (period === "custom") {
      const from = $("gctrl-report-from")?.value, to = $("gctrl-report-to")?.value;
      if (!from || !to || from > to) { host.innerHTML = `<div class="gctrl-empty">Selecciona un intervalo válido.</div>`; return; }
      range = { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59.999`) };
    }
    const records = state.records.filter(r => inRange(r.date || r.createdAt, range));
    const quotes = state.quotes.filter(q => inRange(q.fecha || q.createdAt, range));
    const incomes = records.filter(r => r.type === "income"), expenses = records.filter(r => r.type !== "income");
    const incomeTotal = incomes.reduce((s, r) => s + Number(r.amount || 0), 0);
    const expenseTotal = expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
    const net = incomeTotal - expenseTotal, margin = incomeTotal ? net / incomeTotal * 100 : 0;
    const quoteValue = quotes.reduce((s, q) => s + Number(q.total || 0), 0);
    const accepted = quotes.filter(q => String(q.estado || "").toUpperCase() === "ACEPTADA");
    const acceptedValue = accepted.reduce((s, q) => s + Number(q.total || 0), 0);
    const acceptance = quotes.length ? accepted.length / quotes.length * 100 : 0;
    const matters = localArray("js_legal_asuntos");
    const clients = localArray("js_legal_clientes");
    const activeMatters = matters.filter(a => !["Concluido", "Cancelado"].includes(a.estado)).length;
    const recordsByMonth = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(range.from.getFullYear(), i, 1); const key = monthKey(d);
      const inc = state.records.filter(r => r.type === "income" && String(dateISO(r.date || r.createdAt)).slice(0, 7) === key).reduce((s,r)=>s+Number(r.amount||0),0);
      const exp = state.records.filter(r => r.type !== "income" && String(dateISO(r.date || r.createdAt)).slice(0, 7) === key).reduce((s,r)=>s+Number(r.amount||0),0);
      return { label: d.toLocaleDateString("es-MX", { month: "short" }), key, inc, exp };
    });
    const maxMonth = Math.max(1, ...recordsByMonth.flatMap(x => [x.inc, x.exp]));
    const quoteStates = QUOTE_STATUS.map(status => ({ status, count: quotes.filter(q => String(q.estado || "BORRADOR").toUpperCase() === status).length })).filter(x => x.count || ["BORRADOR", "ACEPTADA", "RECHAZADA"].includes(x.status));
    const rangeLabel = `${range.from.toLocaleDateString("es-MX")} al ${range.to.toLocaleDateString("es-MX")}`;
    host.innerHTML = `<div class="gctrl-kpis">
      <div class="gctrl-kpi"><span>Ingresos registrados</span><strong>${money(incomeTotal)}</strong><small>${incomes.length} movimiento(s)</small></div>
      <div class="gctrl-kpi"><span>Gastos y costos</span><strong>${money(expenseTotal)}</strong><small>${expenses.length} movimiento(s)</small></div>
      <div class="gctrl-kpi"><span>Resultado neto registrado</span><strong style="color:${net >= 0 ? "#067647" : "#b42318"}">${money(net)}</strong><small>Margen ${margin.toFixed(1)}%</small></div>
      <div class="gctrl-kpi"><span>Valor de cotizaciones</span><strong>${money(quoteValue)}</strong><small>${quotes.length} propuesta(s) · aceptación ${acceptance.toFixed(1)}%</small></div>
      <div class="gctrl-kpi"><span>Cotizaciones aceptadas</span><strong>${money(acceptedValue)}</strong><small>${accepted.length} de ${quotes.length}</small></div>
      <div class="gctrl-kpi"><span>Clientes en caché local</span><strong>${clients.length}</strong><small>Depende de los registros accesibles en el navegador</small></div>
      <div class="gctrl-kpi"><span>Asuntos activos en caché local</span><strong>${activeMatters}</strong><small>De ${matters.length} asunto(s) localmente disponibles</small></div>
      <div class="gctrl-kpi"><span>Facturas marcadas</span><strong>${expenses.length ? (expenses.filter(x => x.invoice === true).length / expenses.length * 100).toFixed(1) + "%" : "0%"}</strong><small>De los gastos del periodo</small></div>
      </div>
      <div class="gctrl-grid" style="margin-top:14px"><section class="gctrl-card"><h4>Ingresos y gastos por mes</h4><p class="gctrl-muted">Vista anual para comparar montos capturados. Selección de periodo: ${esc(rangeLabel)}.</p><div class="gctrl-chart" role="img" aria-label="Gráfica mensual de ingresos y gastos">${recordsByMonth.map(m => `<div class="gctrl-chart-col"><b>${m.inc ? money(m.inc) : ""}</b><div class="gctrl-chart-bar income" title="Ingresos ${m.label}: ${money(m.inc)}" style="height:${Math.max(m.inc ? 3 : 0, m.inc / maxMonth * 115)}px"></div><div class="gctrl-chart-bar expense" title="Gastos ${m.label}: ${money(m.exp)}" style="height:${Math.max(m.exp ? 3 : 0, m.exp / maxMonth * 115)}px"></div><small>${esc(m.label)}</small></div>`).join("")}</div><div class="gctrl-muted" style="margin-top:8px">Verde: ingresos · Dorado: gastos / costos.</div></section>
      <section class="gctrl-card"><h4>Estado de las cotizaciones</h4>${quotes.length ? `<div class="gctrl-table-wrap"><table class="gctrl-table"><thead><tr><th>Estado</th><th>Propuestas</th><th>Valor</th></tr></thead><tbody>${quoteStates.map(x => { const items = quotes.filter(q => String(q.estado || "BORRADOR").toUpperCase() === x.status); return `<tr><td>${statusBadge(x.status)}</td><td>${items.length}</td><td>${money(items.reduce((s,q)=>s+Number(q.total||0),0))}</td></tr>`; }).join("")}</tbody></table></div>` : `<div class="gctrl-empty">No hay cotizaciones en el periodo.</div>`}</section></div>
      <section class="gctrl-card" style="margin-top:14px"><h4>Movimientos financieros del periodo</h4>${records.length ? `<div class="gctrl-table-wrap"><table class="gctrl-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Clasificador</th><th>Importe</th></tr></thead><tbody>${sortByDateDesc(records,"date").slice(0,100).map(r=>`<tr><td>${dateMx(r.date)}</td><td>${r.type === "income" ? "Ingreso" : "Gasto / costo"}</td><td>${esc(r.concept || "—")}</td><td>${esc(r.category || "Otros")}</td><td>${money(r.amount)}</td></tr>`).join("")}</tbody></table></div><p class="gctrl-muted" style="margin-top:8px">Se muestran hasta 100 movimientos. Exporta desde el navegador si necesitas una copia para revisión.</p>` : `<div class="gctrl-empty">No hay movimientos financieros en el periodo seleccionado.</div>`}</section>
      <p class="gctrl-note" style="margin-top:12px">Los KPI son administrativos y se calculan sobre cotizaciones y movimientos registrados. El resultado neto no equivale a utilidad fiscal ni sustituye estados financieros. Los conteos de clientes y asuntos son locales y pueden ser parciales según el perfil y caché del navegador.</p>`;
  }

  async function loadFinancialDataThenRender() {
    const view = state.view;
    try {
      if (!canUseModule()) throw new Error("Tu rol no puede acceder a Gestión y control.");
      [state.quotes, state.records] = await Promise.all([
        fetchOwnedCollection("cotizaciones"), fetchOwnedCollection("registrosFinancieros")
      ]);
      state.clients = getLocalClients();
      state.matters = getLocalMatters();
      renderCurrent();
    } catch (error) {
      console.error("Error al cargar Gestión y control", error);
      const targetId = ({ cotizaciones: "gestion-control-cotizaciones", "gastos-costos": "gestion-control-gastos-costos", "reportes-kpi": "gestion-control-reportes-kpi" })[view];
      const host = $(targetId);
      if (host) host.innerHTML = `<div class="gctrl-wrap">${hero(viewTitle(view), "Control administrativo del despacho.", view)}<div class="gctrl-empty"><strong>No fue posible cargar los datos.</strong><p>${esc(error?.message || error)}</p><p class="gctrl-muted">Verifica conexión, sesión y las reglas de Firestore para cotizaciones y registrosFinancieros.</p><button type="button" class="gctrl-btn" id="gctrl-retry">Reintentar</button></div></div>`;
      bindModuleTabs(host); $("gctrl-retry")?.addEventListener("click", loadFinancialDataThenRender);
    }
  }
  function viewTitle(view) { return ({ cotizaciones: "Cotizaciones", "gastos-costos": "Gastos y costos", "reportes-kpi": "Reportes KPI" })[view] || "Gestión y control"; }
  function renderCurrent() {
    const hostId = ({ cotizaciones: "gestion-control-cotizaciones", "gastos-costos": "gestion-control-gastos-costos", "reportes-kpi": "gestion-control-reportes-kpi" })[state.view];
    const host = $(hostId); if (!host) return;
    if (state.view === "cotizaciones") renderQuotePage(host);
    else if (state.view === "gastos-costos") renderExpensesPage(host);
    else renderReportsPage(host);
  }
  async function renderGestionControl(view = "cotizaciones") {
    if (!["cotizaciones", "gastos-costos", "reportes-kpi"].includes(view)) return;
    state.view = view; state.session = sessionNow(); injectStyles();
    const hostId = ({ cotizaciones: "gestion-control-cotizaciones", "gastos-costos": "gestion-control-gastos-costos", "reportes-kpi": "gestion-control-reportes-kpi" })[view];
    const host = $(hostId); if (!host) return;
    if (!canUseModule()) { host.innerHTML = `<div class="gctrl-empty">Este módulo es exclusivo del personal del despacho.</div>`; return; }
    host.innerHTML = `<div class="gctrl-wrap">${hero(viewTitle(view), "Cargando registros autorizados…", view)}<div class="gctrl-empty">Consultando datos de Gestión y control.</div></div>`;
    await loadFinancialDataThenRender();
  }

  window.renderGestionControl = renderGestionControl;
  window.renderReportesKPI = () => renderGestionControl("reportes-kpi");
})();
