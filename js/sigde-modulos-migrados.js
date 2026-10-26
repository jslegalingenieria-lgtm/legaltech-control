/* SIGDE -> JS LegalTech Control: migración de módulos jurídicos.
 * Las fichas se consumen desde constructores_json y los borradores se guardan localmente.
 * No accede a la sesión, Firestore ni Storage de SIGDE.
 */
(() => {
  "use strict";
  const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const norm = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX");
  const asText = value => {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map((v,i) => {
      if (v == null) return "";
      if (typeof v === "object") return Object.entries(v).map(([k,x]) => `${k}: ${asText(x)}`).join(" · ");
      return `${i+1}. ${asText(v)}`;
    }).filter(Boolean).join("\n");
    return Object.entries(value).map(([k,v]) => `${k}: ${asText(v)}`).join("\n");
  };
  const listHtml = (value, pick) => {
    const arr = Array.isArray(value) ? value : value ? [value] : [];
    if (!arr.length) return '<p class="sigde-empty-note">No hay información estructurada en esta ficha.</p>';
    return `<ul>${arr.map(item => `<li>${esc(pick ? pick(item) : asText(item))}</li>`).join("")}</ul>`;
  };
  const constructorRoot = () => document.getElementById("sigde-constructor-root");
  let currentConstructor = null;
  let currentFieldValues = {};
  let constructorInitialized = false;

  function renderConstructorShell() {
    const root = constructorRoot();
    if (!root || root.dataset.initialized === "1") return;
    root.dataset.initialized = "1";
    const registry = Array.isArray(window.CONSTRUCTORES_SIGDE_LEGALTECH) ? window.CONSTRUCTORES_SIGDE_LEGALTECH : [];
    const materias = [...new Set(registry.map(x => x.materia).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
    root.innerHTML = `
      <div class="sigde-module-heading"><div><span class="sigde-module-kicker">CONSTRUCTORES MAESTROS</span><h3>Constructor</h3><p>Selecciona una ficha estructurada, revisa el diagnóstico, completa campos dinámicos y genera un borrador editable. No se presenta automáticamente en tribunal.</p></div><span class="sigde-source-chip">${registry.length} fichas</span></div>
      <div class="sigde-constructor-layout">
        <aside class="sigde-constructor-list-panel">
          <div class="sigde-filter-grid"><div class="form-group"><label for="sigde-constructor-materia">Materia</label><select id="sigde-constructor-materia"><option value="">Todas las materias</option>${materias.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join("")}</select></div><div class="form-group"><label for="sigde-constructor-search">Buscar constructor</label><input id="sigde-constructor-search" type="search" placeholder="Nombre, ID, etapa, materia..."></div></div>
          <div class="sigde-list-summary"><strong id="sigde-constructor-count">${registry.length} constructores</strong><span>Selecciona para abrir la ficha</span></div>
          <div id="sigde-constructor-list" class="sigde-constructor-list"></div>
          <div class="sigde-drafts-panel"><div class="sigde-section-title"><h4>Borradores locales</h4><button type="button" class="btn-secundario" id="sigde-refresh-drafts">Actualizar</button></div><div id="sigde-constructor-drafts"></div><small>Se guardan en el almacenamiento local de este navegador, no en la nube.</small></div>
        </aside>
        <main id="sigde-constructor-detail" class="sigde-constructor-detail"><div class="sigde-empty-state"><span>📄</span><strong>Selecciona un constructor</strong><p>Se mostrarán su ruta, fundamentos capturados, pruebas sugeridas y campos para preparar el documento.</p></div></main>
      </div>`;
    const search = root.querySelector("#sigde-constructor-search");
    const materia = root.querySelector("#sigde-constructor-materia");
    search.addEventListener("input", drawConstructorList);
    materia.addEventListener("change", drawConstructorList);
    root.querySelector("#sigde-refresh-drafts").addEventListener("click", drawDrafts);
    drawConstructorList(); drawDrafts();
  }

  function drawConstructorList() {
    const root = constructorRoot(); if (!root) return;
    const list = root.querySelector("#sigde-constructor-list"); if (!list) return;
    const all = Array.isArray(window.CONSTRUCTORES_SIGDE_LEGALTECH) ? window.CONSTRUCTORES_SIGDE_LEGALTECH : [];
    const q = norm(root.querySelector("#sigde-constructor-search")?.value || "");
    const m = root.querySelector("#sigde-constructor-materia")?.value || "";
    const filtered = all.filter(x => (!m || x.materia === m) && (!q || norm(`${x.id} ${x.materia} ${x.submateria} ${x.constructor}`).includes(q)));
    root.querySelector("#sigde-constructor-count").textContent = `${filtered.length} de ${all.length} constructores`;
    list.innerHTML = filtered.slice(0,250).map(x => `<button type="button" class="sigde-constructor-item ${currentConstructor?.id===x.id?'active':''}" data-constructor-id="${esc(x.id)}"><span class="sigde-constructor-icon">📄</span><span><strong>${esc(x.constructor || x.id)}</strong><small>${esc(x.materia || "Sin materia")} · ${esc(x.submateria || x.id)} · ${esc(x.id)}</small></span><span class="sigde-arrow">›</span></button>`).join("") || `<div class="sigde-empty-note">No se encontraron fichas con esos criterios.</div>`;
    if (filtered.length > 250) list.insertAdjacentHTML("beforeend", `<p class="sigde-list-cap">Se muestran las primeras 250 coincidencias. Refina la búsqueda para encontrar otra ficha.</p>`);
    list.querySelectorAll("[data-constructor-id]").forEach(btn=>btn.addEventListener("click",()=>loadConstructor(btn.dataset.constructorId)));
  }

  const fieldDefault = cfg => {
    if (cfg == null) return "";
    if (typeof cfg !== "object") return String(cfg);
    return String(cfg.valor_por_defecto ?? cfg.valor ?? cfg.default ?? cfg.ejemplo ?? "");
  };
  const fieldLabel = (cfg,key) => typeof cfg === "object" && cfg ? (cfg.etiqueta || cfg.label || key.replace(/_/g," ")) : key.replace(/_/g," ");
  const fieldType = (cfg,key) => {
    const hint = norm(`${typeof cfg === "object" && cfg ? cfg.tipo || "" : ""} ${key}`);
    if (/fecha/.test(hint)) return "date";
    if (/telefono|numero|monto|salario|importe|cantidad|porcentaje|dias|semanas|edad|folio/.test(hint)) return "text";
    if (/hechos|antecedentes|pretension|peticion|argumento|observaciones|descripcion|clausula|domicilio|narrativa|prueba|fundamento|concepto|texto|relato|circunstancia|situacion|resumen/.test(hint)) return "textarea";
    return "text";
  };
  function getFieldValues() {
    const root=constructorRoot(), box=root?.querySelector("#sigde-constructor-fields");
    const values={};
    box?.querySelectorAll("[data-sigde-field]").forEach(input=>{ values[input.dataset.sigdeField]=String(input.value ?? "").trim(); });
    return values;
  }
  function renderDynamicFields(cfg) {
    const fields = cfg.campos_dinamicos && typeof cfg.campos_dinamicos === "object" ? Object.entries(cfg.campos_dinamicos) : [];
    currentFieldValues = Object.fromEntries(fields.map(([key,value]) => [key, fieldDefault(value)]));
    if (!fields.length) return '<p class="sigde-empty-note">Esta ficha no contiene campos dinámicos definidos; puedes editar el borrador directamente.</p>';
    return `<div class="sigde-fields-grid">${fields.map(([key, field])=>{
      const label = fieldLabel(field,key), value = fieldDefault(field), type=fieldType(field,key), required = typeof field === "object" && field ? field.obligatorio === true : false;
      const meta = typeof field === "object" && field ? [field.fuente, field.obligatorio ? "Obligatorio" : "Opcional"].filter(Boolean).join(" · ") : "";
      return `<div class="form-group sigde-dynamic-field ${type==='textarea'?'wide':''}"><label for="sigde-field-${esc(key)}">${esc(label)}${required?' *':''}</label>${type==='textarea'?`<textarea id="sigde-field-${esc(key)}" data-sigde-field="${esc(key)}" rows="3" ${required?'required':''}>${esc(value)}</textarea>`:`<input id="sigde-field-${esc(key)}" data-sigde-field="${esc(key)}" type="${type}" value="${esc(value)}" ${required?'required':''}>`}${meta?`<small>${esc(meta)}</small>`:''}</div>`;
    }).join("")}</div>`;
  }

  async function loadConstructor(id) {
    const root=constructorRoot(); if(!root)return;
    const entry=(window.CONSTRUCTORES_SIGDE_LEGALTECH||[]).find(x=>x.id===id);
    if(!entry){ alert("No se encontró el constructor solicitado."); return; }
    const detail=root.querySelector("#sigde-constructor-detail");
    detail.innerHTML='<div class="sigde-empty-state"><span>⏳</span><strong>Cargando ficha</strong><p>Abriendo la plantilla estructurada…</p></div>';
    try {
      const response=await fetch(entry.json,{cache:"no-store"});
      if(!response.ok) throw new Error(`HTTP ${response.status} al leer ${entry.json}`);
      const cfg=await response.json();
      currentConstructor={...entry,...cfg};
      const diagnosis=cfg.diagnostico||{}, classification=cfg.clasificacion||{}, via=cfg.via_procedimiento||{};
      const teoria=cfg.teoria_caso||{};
      detail.innerHTML=`
        <div class="sigde-constructor-detail-head"><div><span class="sigde-tag">${esc(cfg.materia||entry.materia)} · ${esc(cfg.id||entry.id)}</span><h3>${esc(classification.constructor||entry.constructor||entry.id)}</h3><p>${esc(diagnosis.objetivo||"Completa el diagnóstico y los datos requeridos para definir el escrito.")}</p></div><button type="button" class="btn-secundario" id="sigde-constructor-clear">Cerrar ficha</button></div>
        <div class="sigde-info-grid">
          <section class="sigde-info-card"><h4>Diagnóstico y entrevista</h4>${listHtml(diagnosis.preguntas)}${diagnosis.datos_minimos?.length?`<h5>Datos mínimos</h5>${listHtml(diagnosis.datos_minimos)}`:""}${diagnosis.resultado?`<p><strong>Resultado:</strong> ${esc(asText(diagnosis.resultado))}</p>`:""}</section>
          <section class="sigde-info-card"><h4>Vía y requisitos</h4><p><strong>Vía:</strong> ${esc(via.via||"Por determinar según competencia y norma vigente")}</p>${listHtml(via.requisitos)}${via.nota?`<p class="sigde-note">${esc(via.nota)}</p>`:""}</section>
          <section class="sigde-info-card"><h4>Hechos propuestos</h4>${listHtml(cfg.hechos,x=>typeof x==="object"?(x.texto||asText(x)):x)}</section>
          <section class="sigde-info-card"><h4>Pretensiones</h4>${listHtml(cfg.pretensiones,x=>typeof x==="object"?(x.texto||asText(x)):x)}</section>
          <section class="sigde-info-card"><h4>Pruebas sugeridas</h4>${listHtml(cfg.pruebas,x=>typeof x==="object"?[x.medio,x.objeto,x.estatus].filter(Boolean).join(" — "):x)}</section>
          <section class="sigde-info-card"><h4>Documentos y anexos</h4>${listHtml(cfg.documentos)}</section>
          <section class="sigde-info-card"><h4>Fundamentos registrados</h4>${listHtml(cfg.fundamento,x=>typeof x==="object"?[x.ordenamiento,x.tema,x.articulos,x.estatus].filter(Boolean).join(" · "):x)}<p class="sigde-note">Verifica el texto normativo vigente y la pertinencia del fundamento antes de presentar.</p></section>
          <section class="sigde-info-card"><h4>Teoría del caso</h4><p>${esc(asText(teoria.texto||teoria))}</p>${teoria.elementos?listHtml(teoria.elementos):""}</section>
        </div>
        <section class="sigde-dynamic-form"><div class="sigde-section-title"><div><h4>Datos para completar el documento</h4><p>Los valores iniciales se toman de la ficha; comprueba y sustituye los marcadores antes de generar.</p></div><span>${Object.keys(cfg.campos_dinamicos||{}).length} campos</span></div><div id="sigde-constructor-fields">${renderDynamicFields(cfg)}</div></section>
        <div class="sigde-document-controls"><div class="sigde-section-title"><div><h4>Borrador editable</h4><p>El texto se genera con los campos capturados y puedes corregirlo antes de exportar.</p></div><span class="sigde-warning-chip">Revisión profesional obligatoria</span></div><div class="sigde-constructor-actions"><button type="button" class="btn-primary" id="sigde-generate-document">Generar / actualizar borrador</button><button type="button" class="btn-secundario" id="sigde-save-document">Guardar borrador local</button><button type="button" class="btn-secundario" id="sigde-download-word">Descargar Word</button><button type="button" class="btn-secundario" id="sigde-print-document">Imprimir / PDF</button></div><article id="sigde-constructor-editor" class="sigde-document-editor" contenteditable="true"><p>Selecciona «Generar / actualizar borrador» para crear el documento.</p></article><div id="sigde-alerts" class="sigde-alert-list"><h4>Alertas antes de usar</h4>${listHtml(cfg.alertas||cfg.advertencias)}${cfg.requiere_revision_abogado!==false?'<p class="sigde-note"><strong>Revisión jurídica:</strong> obligatoria antes de firmar o presentar.</p>':''}</div></div>
        <div class="sigde-source-footer"><strong>Control de fuente:</strong> ficha ${esc(cfg.id||entry.id)} · materia ${esc(cfg.materia||entry.materia)}. Estado de auditoría: ${esc(cfg.auditoria_juridica?.estado||cfg.auditoria_juridica?.resultado||"revisión individual pendiente cuando así se indique")}. Los fundamentos y artículos contenidos en la ficha no se consideran verificados automáticamente por el sistema.</div>`;
      detail.querySelector("#sigde-constructor-clear").addEventListener("click",()=>{currentConstructor=null;currentFieldValues={};detail.innerHTML='<div class="sigde-empty-state"><span>📄</span><strong>Selecciona un constructor</strong><p>La ficha se cerró. Puedes elegir otra plantilla.</p></div>';drawConstructorList();});
      detail.querySelector("#sigde-generate-document").addEventListener("click",generateDraft);
      detail.querySelector("#sigde-save-document").addEventListener("click",saveDraft);
      detail.querySelector("#sigde-download-word").addEventListener("click",downloadWord);
      detail.querySelector("#sigde-print-document").addEventListener("click",()=>{document.body.classList.add("sigde-migrated-print");const cleanup=()=>{document.body.classList.remove("sigde-migrated-print");window.removeEventListener("afterprint",cleanup);};window.addEventListener("afterprint",cleanup);window.print();setTimeout(cleanup,1500);});
      detail.querySelectorAll("[data-sigde-field]").forEach(input=>input.addEventListener("input",()=>{currentFieldValues=getFieldValues();}));
      drawConstructorList();
      detail.scrollIntoView({behavior:"smooth",block:"start"});
    } catch(err) {
      console.error("No fue posible cargar la ficha del constructor",err);
      detail.innerHTML=`<div class="sigde-error"><strong>No se pudo abrir esta ficha.</strong><p>${esc(err.message||err)}</p><p>Comprueba que el proyecto se abre mediante un servidor HTTP/HTTPS y que la carpeta constructores_json esté en la raíz junto al dashboard.html.</p></div>`;
    }
  }

  function generateDraft() {
    if(!currentConstructor)return;
    currentFieldValues=getFieldValues();
    const editor=constructorRoot()?.querySelector("#sigde-constructor-editor"); if(!editor)return;
    let text=String(currentConstructor.documento_generado||"").trim();
    Object.entries(currentFieldValues).forEach(([key,value])=>{
      const keys=[`{{${key}}}`,`[${key}]`,`[${key.toUpperCase()}]`];
      keys.forEach(k=>{text=text.split(k).join(value);});
    });
    text=text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g,(_,key)=>`[PENDIENTE: ${key}]`);
    const pending=[...new Set((text.match(/\[PENDIENTE:[^\]]+\]|\[CAPTURAR INFORMACIÓN\]|\[COMPLETAR[^\]]*\]/gi)||[]))];
    const docHtml=text.split(/\r?\n/).map(line=>line.trim()?`<p>${esc(line)}</p>`:"<p>&nbsp;</p>").join("");
    editor.innerHTML=docHtml||"<p>La ficha no contiene una plantilla de documento. Puedes redactar el borrador manualmente.</p>";
    const alerts=constructorRoot()?.querySelector("#sigde-alerts");
    if(alerts){let pendingBox=alerts.querySelector(".sigde-pending-fields");if(!pendingBox){pendingBox=document.createElement("div");pendingBox.className="sigde-pending-fields";alerts.prepend(pendingBox);}pendingBox.innerHTML=pending.length?`<p class="sigde-warning-chip">Marcadores que requieren completar: ${esc(pending.join(", "))}</p>`:'<p class="sigde-success-note">No se detectaron marcadores pendientes del tipo {{campo}}. Revisa hechos, pruebas y competencia.</p>';}
  }
  function saveDraft() {
    if(!currentConstructor){alert("Selecciona primero un constructor.");return;}
    const root=constructorRoot(), editor=root?.querySelector("#sigde-constructor-editor");
    const item={id:`SLT-${Date.now()}`,constructorId:currentConstructor.id,materia:currentConstructor.materia,titulo:currentConstructor.clasificacion?.constructor||currentConstructor.constructor||currentConstructor.id,fecha:new Date().toISOString(),campos:getFieldValues(),contenido:editor?.innerHTML||"",plainText:editor?.innerText||""};
    try{const key="jslt_sigde_constructores_borradores";const old=JSON.parse(localStorage.getItem(key)||"[]");old.unshift(item);localStorage.setItem(key,JSON.stringify(old.slice(0,100)));drawDrafts();alert("Borrador guardado localmente en este navegador.");}catch(e){alert("No fue posible guardar localmente: "+(e.message||e));}
  }
  function drawDrafts() {
    const root=constructorRoot(), box=root?.querySelector("#sigde-constructor-drafts"); if(!box)return;
    let drafts=[];try{drafts=JSON.parse(localStorage.getItem("jslt_sigde_constructores_borradores")||"[]");if(!Array.isArray(drafts))drafts=[];}catch(_){}
    box.innerHTML=drafts.length?drafts.slice(0,15).map(d=>`<div class="sigde-draft-row"><div><strong>${esc(d.titulo||d.constructorId||"Borrador")}</strong><small>${esc(d.materia||"")} · ${esc(new Date(d.fecha||Date.now()).toLocaleDateString("es-MX"))}</small></div><div><button class="btn-secundario" type="button" data-open-draft="${esc(d.id)}">Abrir</button><button class="btn-secundario" type="button" data-delete-draft="${esc(d.id)}">Eliminar</button></div></div>`).join(""):'<p class="sigde-empty-note">No hay borradores locales guardados.</p>';
    box.querySelectorAll("[data-open-draft]").forEach(btn=>btn.addEventListener("click",()=>openDraft(btn.dataset.openDraft)));
    box.querySelectorAll("[data-delete-draft]").forEach(btn=>btn.addEventListener("click",()=>{if(!confirm("¿Eliminar este borrador local?"))return;const ds=JSON.parse(localStorage.getItem("jslt_sigde_constructores_borradores")||"[]").filter(x=>x.id!==btn.dataset.deleteDraft);localStorage.setItem("jslt_sigde_constructores_borradores",JSON.stringify(ds));drawDrafts();}));
  }
  async function openDraft(id) {
    let d;try{d=(JSON.parse(localStorage.getItem("jslt_sigde_constructores_borradores")||"[]")).find(x=>x.id===id);}catch(_){}
    if(!d)return;
    await loadConstructor(d.constructorId);
    const root=constructorRoot();
    Object.entries(d.campos||{}).forEach(([key,value])=>{const el=root?.querySelector(`[data-sigde-field="${CSS.escape(key)}"]`);if(el)el.value=value;});
    currentFieldValues=getFieldValues();
    const ed=root?.querySelector("#sigde-constructor-editor");if(ed)ed.innerHTML=d.contenido||`<p>${esc(d.plainText||"")}</p>`;
  }
  function downloadWord() {
    const root=constructorRoot(), editor=root?.querySelector("#sigde-constructor-editor"); if(!editor){alert("Genera un borrador antes de exportar.");return;}
    const title=currentConstructor?.clasificacion?.constructor||currentConstructor?.constructor||"Documento jurídico";
    const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Times New Roman,serif;font-size:12pt;line-height:1.5;margin:2.5cm;color:#111}p{margin:0 0 .6em;text-align:justify}h1,h2,h3{text-align:center}</style></head><body>${editor.innerHTML}<p style="margin-top:2cm;font-size:9pt;color:#666">Borrador generado por JS LegalTech Control. Revisar y validar jurídicamente antes de firmar o presentar.</p></body></html>`;
    const blob=new Blob(["\ufeff",html],{type:"application/msword;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${String(title).replace(/[^a-z0-9áéíóúñ_-]+/gi,"_").slice(0,90)||"documento_juridico"}.doc`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  }

  /* Full procedural knowledge engine copied from SIGDE, retaining V19 term matching. */
  function renderProcesalSIGDELegalTech() {
    const db = Array.isArray(window.SIGDE_CONOCIMIENTO_PROCESAL) ? window.SIGDE_CONOCIMIENTO_PROCESAL : [];

    // V23: separación explícita por régimen/ordenamiento procesal.
    // La Supermatriz sigue siendo única; aquí solamente se crean categorías
    // virtuales de navegación para impedir que Civil/Familiar/Sucesorio
    // mezclen CPCEJ y CNPCF.
    const regimeProfiles = {
      civil: [
        { id:"civil-jalisco", label:"Civil — Jalisco / CPCEJ", short:"CPCEJ", matrixMateria:"Civil Jalisco", matrixRegimen:"Civil Jalisco", matrixOrdenamiento:"Código de Procedimientos Civiles de Jalisco", badge:"Jalisco" },
        { id:"civil-cnpcf", label:"Civil — Nacional / CNPCF", short:"CNPCF", matrixMateria:"CNPCF", matrixRegimen:"Civil", matrixOrdenamiento:"Código Nacional de Procedimientos Civiles y Familiares", badge:"CNPCF" }
      ],
      familiar: [
        { id:"familiar-jalisco", label:"Familiar — Jalisco / régimen local", short:"Jalisco", matrixMateria:"__LOCAL_FAMILIAR_JALISCO__", matrixRegimen:"Familiar Jalisco", matrixOrdenamiento:"", badge:"Jalisco" },
        { id:"familiar-cnpcf", label:"Familiar — Nacional / CNPCF", short:"CNPCF", matrixMateria:"CNPCF", matrixRegimen:"Familiar", matrixOrdenamiento:"Código Nacional de Procedimientos Civiles y Familiares", badge:"CNPCF" }
      ],
      sucesorio: [
        { id:"sucesorio-jalisco", label:"Sucesorio — Jalisco / régimen local", short:"Jalisco", matrixMateria:"__LOCAL_SUCESORIO_JALISCO__", matrixRegimen:"Sucesorio Jalisco", matrixOrdenamiento:"", badge:"Jalisco" },
        { id:"sucesorio-cnpcf", label:"Sucesorio — Nacional / CNPCF", short:"CNPCF", matrixMateria:"CNPCF", matrixRegimen:"Sucesorio", matrixOrdenamiento:"Código Nacional de Procedimientos Civiles y Familiares", badge:"CNPCF" }
      ]
    };

    const matters = db.slice().flatMap(m => {
      const profiles = regimeProfiles[m.id];
      if (!profiles) return [m];
      return profiles.map((profile, i) => ({
        ...m,
        id: profile.id,
        nombre: profile.label,
        orden: (m.orden || 99) + i * 0.1,
        _baseMatterId: m.id,
        _matrixMateria: profile.matrixMateria,
        _matrixRegimen: profile.matrixRegimen,
        _matrixOrdenamiento: profile.matrixOrdenamiento,
        _regimeBadge: profile.badge,
        _regimeShort: profile.short
      }));
    }).sort((a,b) => (a.orden||99)-(b.orden||99));

    const selected = { materia: matters[0]?.id || "", procedimiento: "" };
    const mount = document.getElementById("sigde-procesal-root");
    if (!mount) return;
    mount.innerHTML = `
      <section class="kp-wrap">
        <div class="kp-intro">
          <div><span class="kp-kicker">CENTRO DE CONOCIMIENTO PROCESAL</span><h3>¿Qué sigue después de cada actuación?</h3><p>Esta sección ya no es un catálogo de machotes. Explica la ruta de litigación: qué hace el abogado en cada etapa, qué debe revisar, qué actuación sigue y en qué momento puede terminar el asunto por sentencia, convenio o salida legal.</p></div>
          <div class="kp-flow"><span>Diagnóstico</span><b>→</b><span>Inicio</span><b>→</b><span>Tramitación</span><b>→</b><span>Prueba</span><b>→</b><span>Resolución</span></div>
        </div>
        <div class="kp-layout">
          <aside class="kp-matters"><div class="kp-side-title">Materias</div><div id="kp-matter-list"></div></aside>
          <main class="kp-main">
            <div class="kp-toolbar"><input id="kp-search" type="search" placeholder="Buscar procedimiento, etapa o actuación..."><span id="kp-count"></span></div>
            <div id="kp-procedures" class="kp-procedure-grid"></div>
            <section id="kp-detail" class="kp-detail" hidden></section>
          </main>
        </div>
      </section>`;

    const matterList = document.getElementById("kp-matter-list");
    const procBox = document.getElementById("kp-procedures");
    const detail = document.getElementById("kp-detail");
    const search = document.getElementById("kp-search");
    const count = document.getElementById("kp-count");

    function currentMatter(){ return matters.find(m => m.id === selected.materia) || matters[0]; }
    function drawMatters(){
      matterList.innerHTML = matters.map(m => `<button type="button" class="kp-matter ${m.id===selected.materia?'activo':''}" data-kp-materia="${esc(m.id)}"><span>${esc(m.icono||'⚖️')}</span><div><strong>${esc(m.nombre)}</strong><small>${m.procedimientos.length} rutas · ${esc(m._regimeShort || 'ordenamiento')}</small></div></button>`).join("");
      matterList.querySelectorAll('[data-kp-materia]').forEach(b=>b.addEventListener('click',()=>{selected.materia=b.dataset.kpMateria;selected.procedimiento="";detail.hidden=true;drawMatters();drawProcedures();}));
    }
    function drawProcedures(){
      const m=currentMatter(), q=normal(search?.value||"");
      const items=(m?.procedimientos||[]).filter(p=>!q || normal([p.nombre,p.tipo,p.objetivo,p.inicio,...p.etapas.flatMap(e=>[e.nombre,e.queHacer,e.despues,e.control])].join(" ")).includes(q));
      count.textContent=`${items.length} ruta${items.length===1?'':'s'} de ${m?.nombre||''}`;
      procBox.innerHTML=items.map(p=>`<button type="button" class="kp-procedure-card" data-kp-proc="${esc(p.id)}"><span class="kp-procedure-icon">${esc(p.icono||'⚖️')}</span><div><span class="kp-tag">${esc(p.tipo||'Procedimiento')}</span><h4>${esc(p.nombre)}</h4><p>${esc(p.objetivo)}</p><small>Inicio: ${esc(p.inicio)}</small><strong>${p.etapas.length} etapas</strong></div><span class="kp-arrow">›</span></button>`).join("") || `<div class="kp-empty">No se encontró una ruta con ese criterio.</div>`;
      // Delegación de eventos: evita que una tarjeta pierda el click por
      // listeners individuales o por una excepción producida al renderizar otra tarjeta.
      procBox.onclick = (ev) => {
        const b = ev.target.closest?.('[data-kp-proc]');
        if (!b || !procBox.contains(b)) return;
        ev.preventDefault();
        ev.stopPropagation();
        selected.procedimiento = b.dataset.kpProc || '';
        drawDetail();
      };
    }
    // ===== Términos procesales desde la Supermatriz V19 =====
    // La Supermatriz es la fuente maestra. No se usa el antiguo motor V11
    // para pintar términos en el Centro de Conocimiento.
    const superMatrix = () => window.SIGDE_SUPERMATRIZ_V19 || null;

    const articleTokens = value => {
      const s=String(value||''); const out=[]; const re=/(?:art(?:ículo|iculo)?\.?\s*)(\d+[A-Za-z]?)/gi;
      let m; while((m=re.exec(s))) out.push(m[1]); return [...new Set(out)];
    };

    const normal = value => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

    const matterToMatrix = {
      mercantil: ['mercantil'],
      laboral: ['laboral'],
      penal: ['penal'],
      administrativo: ['administrativo federal','administrativo jalisco'],
      amparo: ['amparo'],
      agraria: ['agrario'],
      corporativo: ['mercantil'],
      'propiedad-industrial': ['propiedad industrial'],
      'derechos-autor': ['derechos de autor']
    };

    function matrixMatterMatches(m, r){
      // Para Civil/Familiar/Sucesorio se exige coincidencia de materia,
      // régimen y ordenamiento. Nunca se permite el cruce CPCEJ <-> CNPCF.
      if (m?._matrixMateria) {
        if (normal(r?.materia) !== normal(m._matrixMateria)) return false;
        if (m._matrixRegimen && normal(r?.regimen) !== normal(m._matrixRegimen)) return false;
        if (m._matrixOrdenamiento && normal(r?.ordenamiento) !== normal(m._matrixOrdenamiento)) return false;
        return true;
      }
      const mn=normal(m?.id||m?.nombre), rm=normal(r?.materia);
      const aliases=matterToMatrix[mn] || [mn];
      return aliases.some(x=>rm===normal(x));
    }

    function matrixRouteScore(m,p,r){
      if(!matrixMatterMatches(m,r)) return -1;
      const text=normal([p?.id,p?.nombre,p?.tipo].join(' '));
      const route=normal(r?.ruta);
      let score=0;

      // Correspondencias explícitas para las rutas que comparten nombre jurídico
      // pero no necesariamente la misma denominación en el Centro de Conocimiento.
      const aliases = [
        ['ordinario civil','ordinario'],
        ['sumario civil','sumario'],
        ['juicio sumario','sumario'],
        ['ejecutivo civil','juicio ejecutivo civil oral'],
        ['hipotecario','juicio especial hipotecario oral'],
        ['alimentos','juicio oral familiar'],
        ['controversia familiar','juicio oral familiar'],
        ['guarda','juicio oral familiar'],
        ['custodia','juicio oral familiar'],
        ['divorcio','divorcio bilateral judicial'],
        ['jurisdiccion voluntaria','jurisdiccion voluntaria'],
        ['sucesion testamentaria','juicio sucesorio testamentario'],
        ['sucesion intestamentaria','juicio sucesorio intestamentario'],
        ['testamentaria','juicio sucesorio testamentario'],
        ['intestamentaria','juicio sucesorio intestamentario'],
        ['cobro en via ejecutiva mercantil','juicio ejecutivo mercantil'],
        ['ejecutivo mercantil oral','juicio ejecutivo mercantil oral'],
        ['juicio oral mercantil','juicio oral mercantil'],
        ['ordinario mercantil','juicio ordinario mercantil'],
        ['ordinario laboral','procedimiento ordinario laboral'],
        ['procedimientos especiales laborales','procedimiento especial'],
        ['juicio agrario','juicio agrario'],
        ['recurso de revision agraria','recurso de revision'],
        ['amparo indirecto','amparo indirecto'],
        ['amparo directo','amparo'],
        ['recurso de revision','recurso de revision'],
        ['recurso de queja','recurso de queja'],
        ['recurso de reclamacion','recurso de reclamacion'],
        ['recurso de inconformidad','recurso de inconformidad'],
        ['declaracion administrativa','declaracion administrativa'],
        ['oposicion en materia de marcas','oposicion en marcas'],
        ['procedimiento de avenencia','accion judicial por infraccion'],
        ['infraccion en materia de derechos de autor','accion judicial por infraccion']
      ];

      for(const [needle,target] of aliases){
        if(text.includes(normal(needle)) && route===normal(target)) return 120;
      }

      if(text===route || text.includes(route) || route.includes(text)) score=100;

      const words=text.split(' ').filter(x=>x.length>4);
      for(const w of words) if(route.includes(w)) score+=12;
      if(text.includes('revision') && route.includes('revision')) score+=35;
      if(text.includes('recurso') && route.includes('recursos')) score+=30;
      if(text.includes('especial') && route.includes('especial')) score+=20;

      return score;
    }

    function matrixRouteFor(m,p){
      const matrix=superMatrix();
      if(!matrix || !Array.isArray(matrix.routes)) return null;
      let best=null;
      for(const r of matrix.routes){
        const score=matrixRouteScore(m,p,r);
        if(score<0) continue;
        if(!best || score>best.score) best={r,score};
      }
      // Evitar asociar una ruta genérica a un procedimiento distinto.
      return best && best.score>=45 ? best.r : null;
    }

    function matrixStagesForKnowledgeStage(e){
      // La clasificación se hace por el NOMBRE de la etapa, no por la
      // explicación narrativa. Así evitamos que palabras como "autoridad"
      // o "notificación" dentro de una descripción contaminen la etapa.
      const x=normal([e?.nombre,e?.fundamento].join(' '));
      const out=[];
      const add=(stage)=>{ if(!out.includes(stage)) out.push(stage); };

      if(/presentacion|demanda|denuncia|inicio/.test(x)) add('Inicio / demanda / denuncia');
      if(/admision/.test(x)) add('Admisión');
      if(/prevencion|subsan|corregir|completar/.test(x)) add('Prevención');
      if(/emplazamiento|notificacion|citacion/.test(x)) add('Emplazamiento / notificación');
      if(/contestacion/.test(x)) add('Contestación');
      if(/reconvencion/.test(x)) add('Reconvención / contestación reconvención');
      if(/replica/.test(x)) add('Réplica');
      if(/contrarreplica/.test(x)) add('Contrarréplica');
      if(/ofrecimiento.*prueba|ofrecer.*prueba/.test(x)) add('Ofrecimiento de pruebas');
      if(/admision.*prueba/.test(x)) add('Admisión de pruebas');
      if(/preparacion.*prueba/.test(x)) add('Preparación de pruebas');
      if(/audiencia.*preliminar|audiencia.*inicial/.test(x)) add('Audiencia preliminar / inicial');
      if(/audiencia/.test(x) && !/preliminar|inicial/.test(x)) add('Audiencia de juicio');
      if(/desahogo.*prueba/.test(x)) add('Desahogo de pruebas');
      if(/prueba/.test(x) && !/ofrecimiento|ofrecer|admision|preparacion|desahogo/.test(x)){
        add('Ofrecimiento de pruebas'); add('Desahogo de pruebas');
      }
      if(/alegato/.test(x)) add('Alegatos');
      if(/cierre.*instruccion/.test(x)) add('Cierre de instrucción');
      if(/sentencia|laudo|resolucion/.test(x)) add('Sentencia');
      if(/recurso|apelacion|revision|impugnacion|inconformidad|queja|reclamacion|interposicion/.test(x)) add('Recurso / impugnación');
      if(/ejecucion|cumplimiento|remate|liquidacion/.test(x)) add('Cumplimiento / ejecución');
      if(/computo|termino.*general|dias.*habiles|dias.*naturales/.test(x)) add('Cómputo / reglas generales');
      if(/medida.*cautelar|suspension/.test(x)) add('Medidas cautelares');
      if(/autoridad|tramite|diligencia|remision/.test(x)) add('Actuación de autoridad / trámite');

      return out;
    }

    function termsForStage(m,p,e){
      const route=matrixRouteFor(m,p);
      if(!route || !route.stages) return [];

      const wanted=matrixStagesForKnowledgeStage(e);
      const stageText=normal([e?.nombre,e?.queHacer,e?.despues,e?.control,e?.fundamento].join(' '));
      const terms=[];

      // 1) Primero usamos la correspondencia estructural de etapa.
      const addFromStage=(stageName)=>{
        const list=Array.isArray(route.stages[stageName]) ? route.stages[stageName] : [];
        for(const t of list){
          terms.push({...t,__sourceStage:stageName});
        }
      };
      for(const stageName of wanted) addFromStage(stageName);

      // 2) Si la etapa narrativa no coincide exactamente con la nomenclatura
      //    de la Supermatriz, hacemos una segunda pasada por actuación/evento.
      //    Esto es necesario porque Centro de Conocimiento usa nombres como
      //    "Audiencia", "Pruebas y alegatos" o "Revisión y ejecución".
      const hasUseful=terms.length>0;
      if(!hasUseful){
        const candidates=[];
        for(const [stageName,list] of Object.entries(route.stages)){
          if(!Array.isArray(list)) continue;
          for(const t of list){
            const tx=normal([stageName,t.actuacion,t['Actuación / evento'],t.texto,t.inicio,t.consecuencia].join(' '));
            let score=0;
            if(/audiencia/.test(stageText) && /audiencia/.test(tx)) score+=60;
            if(/prueba|alegato/.test(stageText) && /prueba|alegato/.test(tx)) score+=45;
            if(/contestacion/.test(stageText) && /contestacion/.test(tx)) score+=60;
            if(/reconvencion/.test(stageText) && /reconvencion/.test(tx)) score+=60;
            if(/demanda|inicio/.test(stageText) && /demanda|inicio/.test(tx)) score+=45;
            if(/emplazamiento|notificacion/.test(stageText) && /emplazamiento|notificacion/.test(tx)) score+=55;
            if(/recurso|revision|impugnacion/.test(stageText) && /recurso|revision|impugnacion/.test(tx)) score+=60;
            if(/ejecucion|cumplimiento/.test(stageText) && /ejecucion|cumplimiento/.test(tx)) score+=60;
            if(score>=45) candidates.push({...t,__sourceStage:stageName,__score:score});
          }
        }
        candidates.sort((a,b)=>b.__score-a.__score);
        terms.push(...candidates);
      }

      const seen=new Set();
      return terms.filter(t=>{
        const k=[t.ID_Termino||t.id||'',t['Actuación / evento']||t.actuacion||'',t.texto||'',t.numero??'',t.unidad||'',t.fundamento||''].join('|');
        if(seen.has(k)) return false;
        seen.add(k); return true;
      }).map(t=>({
        ...t,
        Materia: route.materia,
        Ordenamiento: route.ordenamiento,
        Procedimiento: route.ruta,
        Ruta: route.ruta,
        Actuación_evento: t.actuacion || t['Actuación / evento'] || t.__sourceStage || '',
        'Actuación / evento': t.actuacion || t['Actuación / evento'] || t.__sourceStage || '',
        'Inicio / cómputo': t.inicio || t['Inicio / cómputo'] || '',
        'Consecuencia / efecto': t.consecuencia || t['Consecuencia / efecto'] || '',
        ID_Termino: t.id || t.ID_Termino || '',
        Regla_ejecutable: t.reglaEjecutable || t.Regla_ejecutable || 'NO'
      })).slice(0,8);
    }

    function renderTermPanel(m,p,e){
      const terms=termsForStage(m,p,e);
      if(!terms.length) return `<section class="kp-terms-panel kp-terms-empty"><div class="kp-terms-head"><span>⏱️</span><div><h5>Términos procesales</h5><p>No se identificó un término expreso para esta etapa en la ruta de la Supermatriz V19. Esto no significa que no exista un plazo legal; significa que todavía no está asociado a esta etapa en la matriz.</p></div></div></section>`;

      const cards=terms.map(t=>{
        const numero=t.numero;
        const unidad=t.unidad||'días';
        const plazo=numero==null ? (t.texto||'Según regla') : `${numero} ${unidad}`;
        const comp=t['Inicio / cómputo']||t.inicio||'Según la norma';
        const fundamento=t.fundamento||t.Fundamento||'';
        const pending=numero==null || String(t.Regla_ejecutable||'NO').toUpperCase()!=='SI';
        return `<article class="kp-term-card ${pending?'pendiente':''}">
          <div class="kp-term-top"><strong>${esc(plazo)}</strong><span>${pending?'⚠️ Regla no automatizable':'✓ Regla disponible'}</span></div>
          <h6>${esc(t['Actuación / evento']||'Actuación procesal')}</h6>
          <p><b>Inicio/cómputo:</b> ${esc(comp)}</p>
          <p><b>Fundamento:</b> ${esc(fundamento)}</p>
          ${t['Consecuencia / efecto']?`<p><b>Consecuencia:</b> ${esc(t['Consecuencia / efecto'])}</p>`:''}
          <div class="kp-term-meta"><span>${esc(t.ID_Termino||'')}</span><span>Supermatriz V19</span></div>
        </article>`;
      }).join('');

      return `<section class="kp-terms-panel"><div class="kp-terms-head"><span>⏱️</span><div><h5>Términos procesales</h5><p>Reglas encontradas directamente en la Supermatriz procesal V19 para esta ruta y etapa.</p></div></div><div class="kp-terms-grid">${cards}</div></section>`;
    }

    function drawDetail(){
      const m=currentMatter(), p=m.procedimientos.find(x=>x.id===selected.procedimiento); if(!p)return;
      const sourceList=(p.fuentes||m.fuentes||[]).map(x=>`<li>${esc(x)}</li>`).join("");
      detail.hidden=false;
      const regimeNote = m._regimeShort ? `<div class="kp-regime-badge"><b>Régimen:</b> ${esc(m._regimeShort)} · <b>Ordenamiento:</b> ${esc(m._matrixOrdenamiento || 'Régimen local aplicable')}</div>` : '';
      detail.innerHTML=`<div class="kp-detail-head"><div><span class="kp-tag">${esc(m.nombre)} · ${esc(p.tipo||'Ruta procesal')}</span>${regimeNote}<h3>${esc(p.nombre)}</h3><p>${esc(p.objetivo)}</p></div><button type="button" class="btn-secundario" id="kp-close">Cerrar ruta</button></div>
        <div class="kp-legal-note"><strong>Cómo usar esta ruta:</strong> cada etapa responde tres preguntas: <b>qué hace el abogado</b>, <b>qué sigue</b> y <b>qué debe controlar</b>. Los términos mostrados provienen de la matriz procesal integrada y no se inventan desde el texto de la ruta.</div>
        <div class="kp-timeline">${p.etapas.map((e,i)=>`<article class="kp-step"><div class="kp-step-num">${i+1}</div><div class="kp-step-body"><div class="kp-step-title"><h4>${esc(e.nombre)}</h4>${e.resultado?`<span>${esc(e.resultado)}</span>`:''}</div><div class="kp-step-grid"><section><b>Qué hace el abogado</b><p>${esc(e.queHacer)}</p></section><section class="kp-next"><b>¿Qué sigue?</b><p>${esc(e.despues)}</p></section><section><b>Control del expediente</b><p>${esc(e.control)}</p></section></div>${renderTermPanel(m,p,e)}${e.fundamento?`<div class="kp-foundation"><b>Fundamento jurídico de la ruta:</b> ${esc(e.fundamento)}</div>`:''}</div></article>`).join('')}</div>
        <section class="kp-kpi-panel"><div><span class="kp-kpi-kicker">INDICADORES GERENCIALES DE LA RUTA</span><h4>¿Qué puede medir el despacho?</h4></div><div class="kp-kpi-list">${(p.kpis||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div></section><div class="kp-endpoints"><section><h4>Salida por acuerdo / convenio</h4><p>${esc(p.acuerdo||'Cuando la materia y la vía permitan una solución convenida, registrar el convenio, someterlo a la autoridad competente cuando corresponda y controlar su cumplimiento.')}</p></section><section><h4>Salida por sentencia</h4><p>${esc(p.sentencia||'Revisar el sentido de la resolución, notificación, medios de impugnación y, si queda firme, iniciar o controlar su ejecución.')}</p></section></div>
        <section class="kp-sources"><h4>Fuentes utilizadas para esta ruta</h4><ul>${sourceList}</ul></section>
        <div class="kp-actions"><button type="button" class="btn-primary" onclick="window.abrirConstructorSIGDELegalTech('${esc(p.constructorId||'')}')" ${p.constructorId?'':'disabled'}>🧩 Abrir constructor relacionado</button><button type="button" class="btn-secundario" onclick="window.irTerminosSIGDELegalTech?.()">⏱️ Abrir Términos procesales</button></div>`;
      document.getElementById('kp-close')?.addEventListener('click',()=>{detail.hidden=true;detail.innerHTML='';});
      detail.scrollIntoView({behavior:'smooth',block:'start'});
    }
    search?.addEventListener('input',drawProcedures);
    drawMatters(); drawProcedures();
  }


  function setMode(moduleName, mode) {
    const ids = moduleName === "constructor"
      ? {basic:"constructor-legaltech-mode", migrated:"constructor-sigde-mode", root:"sigde-constructor-root"}
      : {basic:"conocimiento-legaltech-mode", migrated:"conocimiento-sigde-mode", root:"sigde-procesal-root"};
    const basic=document.getElementById(ids.basic), migrated=document.getElementById(ids.migrated);
    if(!migrated) return;
    // LegalTech conserva únicamente el Constructor maestro; no existe modo clásico en esta vista.
    const masterOnly = !basic;
    const isMigrated = masterOnly || mode === "sigde";
    if (basic) basic.hidden=isMigrated;
    migrated.hidden=!isMigrated;
    document.querySelectorAll(`[data-sigde-module-switch="${moduleName}"]`).forEach(btn=>{
      btn.classList.toggle("active",btn.dataset.sigdeMode===mode);
      btn.setAttribute("aria-pressed",btn.dataset.sigdeMode===mode ? "true":"false");
    });
    if(isMigrated) {
      if(moduleName === "constructor") renderConstructorShell();
      else renderProcesalSIGDELegalTech();
    }
  }

  window.setSIGDEModuleMode = setMode;
  window.abrirConstructorSIGDELegalTech = async id => {
    window.switchTab?.("constructor-documentos");
    setMode("constructor","sigde");
    if(id) await loadConstructor(id);
  };
  window.seleccionarConstructorSIGDELegalTech = id => loadConstructor(id);
  window.abrirTerminosProcesales = () => window.switchTab?.("terminos-procesales");
  // Compatibilidad con la referencia del botón en fichas de conocimiento ya migradas.
  window.irTerminosSIGDELegalTech = window.abrirTerminosProcesales;

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-sigde-module-switch]").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.sigdeModuleSwitch,btn.dataset.sigdeMode)));
  });
})();
