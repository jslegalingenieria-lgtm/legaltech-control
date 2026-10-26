import { TERMINOS_PROCESALES, DICCIONARIO_JURIDICO, LOCUCIONES_LATINAS } from "./biblioteca-juridica-practica-data.js";

const htmlEsc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX");
const asText = value => {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map((x, i) => `${i + 1}. ${asText(x)}`).join("\n");
  if (typeof value === "object") return Object.entries(value).map(([k, v]) => `${k}: ${asText(v)}`).join("\n");
  return String(value);
};
const listHtml = arr => Array.isArray(arr) && arr.length ? `<ul>${arr.map(x => `<li>${htmlEsc(asText(x))}</li>`).join("")}</ul>` : "";

let dicTab = "procesal";
let manualsReady = false;
let dictionaryReady = false;

function manualPath(value) {
  const p = String(value || "").split("?")[0].replace(/\\/g, "/");
  if (!p || p.startsWith("/") || p.includes("..") || !/^(manuales-practicos|manuales-practicos-html)\/[\w\-. áéíóúÁÉÍÓÚ()]+\.((docx)|(html))$/i.test(p)) return "";
  return p;
}
function renderManualCards() {
  const root = document.getElementById("lt-manuales-contenido");
  if (!root) return;
  const data = Array.isArray(window.SIGDE_MANUALES_PRACTICOS) ? window.SIGDE_MANUALES_PRACTICOS : [];
  const q = norm(root.querySelector("#lt-manuales-buscar")?.value || "");
  const matter = root.querySelector("#lt-manuales-materia")?.value || "";
  const items = data.filter(m => (!matter || m.materia === matter) && (!q || norm(JSON.stringify(m)).includes(q)));
  const detailId = root.querySelector("[data-manual-detalle-activo]")?.getAttribute("data-manual-detalle-activo") || "";
  root.querySelector("#lt-manuales-contador").textContent = `${items.length} de ${data.length} manuales`;
  root.querySelector("#lt-manuales-lista").innerHTML = items.map(m => {
    const html = manualPath(m.archivoHtml);
    const docx = manualPath(m.archivoDocx);
    const active = detailId === m.id;
    const facts = [
      ["Ruta procesal", listHtml(m.ruta)], ["Lista de verificación", listHtml(m.checklist)],
      ["Estrategia inicial", listHtml(m.estrategia)], ["Errores frecuentes", listHtml(m.errores)],
      ["Fundamentos a revisar", listHtml(m.fundamento)], ["Honorarios por etapas", listHtml(m.honorarios)]
    ].filter(([, v]) => v);
    return `<article class="lt-manual-card"><header class="lt-manual-card-head"><div><span class="lt-manual-tag">${htmlEsc(m.materia || "Materia no indicada")}</span><h4>${htmlEsc(m.titulo || "Manual de litigación")}</h4><p>${htmlEsc(m.subtitulo || "")}</p><small>${htmlEsc(m.estado || "Material de consulta")}</small></div><button class="btn-secundario" type="button" data-manual-toggle="${htmlEsc(m.id)}" aria-expanded="${active}">${active ? "Ocultar ficha" : "Ver ficha"}</button></header><div class="lt-manual-actions">${html ? `<a class="btn-primary lt-manual-link" href="${htmlEsc(html)}" target="_blank" rel="noopener noreferrer">Abrir manual completo</a>` : `<span class="lt-manual-muted">No hay versión HTML asociada.</span>`}${docx ? `<a class="btn-secundario lt-manual-link" href="${htmlEsc(docx)}" download>Descargar Word</a>` : ""}</div>${active ? `<div class="lt-manual-detail" data-manual-detalle-activo="${htmlEsc(m.id)}">${facts.map(([title, body]) => `<section><h5>${title}</h5>${body}</section>`).join("") || "<p>Sin ficha estructurada adicional.</p>"}<p class="lt-manual-disclaimer">Material de apoyo. Confirma competencia, vía, vigencia normativa, hechos, pruebas y plazos antes de usarlo en un asunto real.</p></div>` : ""}</article>`;
  }).join("") || `<div class="lt-manual-empty">No se encontraron manuales con los filtros seleccionados.</div>`;
}
window.legaltechVerFichaManual = id => {
  const root = document.getElementById("lt-manuales-contenido");
  if (!root) return;
  const active = root.querySelector("[data-manual-detalle-activo]")?.getAttribute("data-manual-detalle-activo");
  if (active === id) root.querySelector("[data-manual-detalle-activo]")?.removeAttribute("data-manual-detalle-activo");
  renderManualCards();
};
window.renderManualesLitigacion = function renderManualesLitigacion() {
  const root = document.getElementById("lt-manuales-contenido");
  if (!root) return;
  if (!manualsReady) {
    const manuals = Array.isArray(window.SIGDE_MANUALES_PRACTICOS) ? window.SIGDE_MANUALES_PRACTICOS : [];
    const matters = [...new Set(manuals.map(m => m.materia).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
    root.innerHTML = `<div class="lt-manuals-shell"><div class="lt-module-filters"><div class="form-group"><label for="lt-manuales-buscar">Buscar manual</label><input id="lt-manuales-buscar" type="search" placeholder="Materia, tema, procedimiento, error…"></div><div class="form-group"><label for="lt-manuales-materia">Materia</label><select id="lt-manuales-materia"><option value="">Todas las materias</option>${matters.map(m => `<option value="${htmlEsc(m)}">${htmlEsc(m)}</option>`).join("")}</select></div><strong id="lt-manuales-contador">${manuals.length} manuales</strong></div><div id="lt-manuales-lista" class="lt-manuals-list"></div><p class="lt-module-notice">Los manuales son herramientas de trabajo. Verifica la legislación vigente y las circunstancias del expediente antes de elaborar o presentar escritos.</p></div>`;
    root.querySelector("#lt-manuales-buscar").addEventListener("input", renderManualCards);
    root.querySelector("#lt-manuales-materia").addEventListener("change", renderManualCards);
    root.addEventListener("click", e => { const btn = e.target.closest("[data-manual-toggle]"); if (!btn) return; const id = btn.dataset.manualToggle; const active = root.querySelector("[data-manual-detalle-activo]")?.getAttribute("data-manual-detalle-activo"); root.querySelectorAll("[data-manual-detalle-activo]").forEach(x => x.removeAttribute("data-manual-detalle-activo")); if (active !== id) { const temp = document.createElement("span"); temp.setAttribute("data-manual-detalle-activo", id); root.querySelector("#lt-manuales-lista").appendChild(temp); } renderManualCards(); });
    manualsReady = true;
  }
  renderManualCards();
};

const dictionaryCollections = {
  procesal: { title: "Términos procesales", data: TERMINOS_PROCESALES, hint: "Términos de actuación y trámite." },
  diccionario: { title: "Diccionario jurídico", data: DICCIONARIO_JURIDICO, hint: "Conceptos jurídicos generales." },
  latin: { title: "Locuciones latinas", data: LOCUCIONES_LATINAS, hint: "Expresiones jurídicas y su uso." }
};
function dicEntryHtml(item, index) {
  const title = item.t || `Entrada ${index + 1}`;
  const description = item.d || "";
  const extras = Object.entries(item).filter(([key, val]) => !["t", "d"].includes(key) && val != null && val !== "").map(([key, val]) => {
    const labels = {cuando:"Cuándo se utiliza", por:"Finalidad", cuida:"Qué revisar", alcance:"Alcance y límites", uso:"Uso", ej:"Ejemplo", requisitos:"Requisitos", pasos:"Pasos", consecuencias:"Consecuencias", fundamento:"Fundamento", advertencia:"Advertencia"};
    const label = labels[key] || key.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());
    const valHtml = Array.isArray(val) ? listHtml(val) : `<p>${htmlEsc(asText(val)).replace(/\n/g, "<br>")}</p>`;
    return `<section class="lt-dict-field"><h5>${htmlEsc(label)}</h5>${valHtml}</section>`;
  }).join("");
  return `<details class="lt-dict-entry"><summary><strong>${htmlEsc(title)}</strong><span>${htmlEsc(description)}</span></summary><div class="lt-dict-entry-body">${extras || `<p>${htmlEsc(description)}</p>`}</div></details>`;
}
function renderDictionaryEntries() {
  const root = document.getElementById("lt-diccionario-contenido");
  if (!root) return;
  const collection = dictionaryCollections[dicTab] || dictionaryCollections.procesal;
  const q = norm(root.querySelector("#lt-diccionario-buscar")?.value || "");
  const rows = collection.data.filter(item => !q || norm(JSON.stringify(item)).includes(q));
  root.querySelectorAll("[data-lt-dic-tab]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.ltDicTab === dicTab);
    btn.setAttribute("aria-pressed", btn.dataset.ltDicTab === dicTab ? "true" : "false");
  });
  root.querySelector("#lt-diccionario-contador").textContent = `${rows.length} entradas`;
  root.querySelector("#lt-diccionario-ayuda").textContent = collection.hint;
  root.querySelector("#lt-diccionario-lista").innerHTML = rows.slice(0, 600).map(dicEntryHtml).join("") || `<div class="lt-dict-empty">No hay coincidencias. Prueba con otra palabra.</div>`;
  if (rows.length > 600) root.querySelector("#lt-diccionario-lista").insertAdjacentHTML("beforeend", `<p class="lt-module-notice">Se muestran 600 coincidencias; utiliza una búsqueda más específica para reducir la lista.</p>`);
}
window.legaltechCambiarTabDiccionario = tab => { if (!dictionaryCollections[tab]) return; dicTab = tab; renderDictionaryEntries(); };
window.renderDiccionarioJuridico = function renderDiccionarioJuridico() {
  const root = document.getElementById("lt-diccionario-contenido");
  if (!root) return;
  if (!dictionaryReady) {
    const counts = Object.fromEntries(Object.entries(dictionaryCollections).map(([k,v]) => [k, v.data.length]));
    root.innerHTML = `<div class="lt-dict-shell"><div class="lt-dict-tabs" role="tablist" aria-label="Tipo de entrada"><button type="button" data-lt-dic-tab="procesal" onclick="legaltechCambiarTabDiccionario('procesal')">Términos procesales <span>${counts.procesal}</span></button><button type="button" data-lt-dic-tab="diccionario" onclick="legaltechCambiarTabDiccionario('diccionario')">Diccionario jurídico <span>${counts.diccionario}</span></button><button type="button" data-lt-dic-tab="latin" onclick="legaltechCambiarTabDiccionario('latin')">Locuciones latinas <span>${counts.latin}</span></button></div><div class="lt-module-filters"><div class="form-group"><label for="lt-diccionario-buscar">Buscar término</label><input id="lt-diccionario-buscar" type="search" placeholder="Escribe una palabra o concepto…"></div><strong id="lt-diccionario-contador">0 entradas</strong></div><p id="lt-diccionario-ayuda" class="lt-dict-hint"></p><div id="lt-diccionario-lista" class="lt-dict-list"></div><p class="lt-module-notice">El diccionario es una herramienta de consulta. El alcance de cada término debe confirmarse conforme al ordenamiento, la materia, la jurisdicción y los hechos del caso.</p></div>`;
    root.querySelector("#lt-diccionario-buscar").addEventListener("input", renderDictionaryEntries);
    dictionaryReady = true;
  }
  renderDictionaryEntries();
};
