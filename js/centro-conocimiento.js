(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const normal = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let temaActivo = null;
  let tabActivo = "explicacion";
  let materiaActiva = "Familiar";

  function datos() { return Array.isArray(window.LEXGEAR_CENTRO_CONOCIMIENTO) ? window.LEXGEAR_CENTRO_CONOCIMIENTO : []; }
  function asuntos() {
    try {
      if (typeof window.obtenerAsuntos === "function") return window.obtenerAsuntos() || [];
      return JSON.parse(localStorage.getItem("js_legal_asuntos") || "[]");
    } catch (_) { return []; }
  }

  function coincideAsunto(asunto, tema) {
    const texto = normal([asunto.materia, asunto.accion, asunto.resumen, asunto.expediente, asunto.estado].join(" "));
    const claves = [tema.titulo, ...(tema.etiquetas || []), ...(tema.palabrasClave || [])].map(normal).filter(Boolean);
    return normal(asunto.materia).includes(normal(tema.materia)) && claves.some(k => texto.includes(k));
  }

  function asuntosRelacionados(tema = temaActivo) { return tema ? asuntos().filter(a => coincideAsunto(a, tema)) : []; }

  function renderTemas() {
    const q = normal($("cc-buscar")?.value);
    const items = datos().filter(x => {
      const coincideMateria = !materiaActiva || x.materia === materiaActiva;
      const coincideTexto = !q || normal(`${x.titulo} ${x.subtitulo} ${x.resumen} ${(x.etiquetas || []).join(" ")} ${(x.palabrasClave || []).join(" ")}`).includes(q);
      return coincideMateria && coincideTexto;
    });
    const tituloPanel = $("cc-titulo-materia");
    if (tituloPanel) tituloPanel.textContent = materiaActiva ? `Temas de Derecho ${materiaActiva}` : "Todos los temas";
    const cont = $("cc-contador");
    if (cont) cont.textContent = `${items.length} tema${items.length === 1 ? "" : "s"}`;
    const target = $("cc-resultados");
    if (!target) return;
    if (!items.length) {
      target.innerHTML = `<div class="cc-vacio"><strong>No encontramos ese tema.</strong><span>Prueba con divorcio, alimentos, custodia, convivencias o sociedad legal.</span></div>`;
      return;
    }
    target.innerHTML = items.map(x => {
      const relacionados = asuntosRelacionados(x).length;
      return `<article class="cc-tema-card">
        <div class="cc-tema-top"><span class="cc-tag">${esc(x.materia)}</span><span class="cc-dificultad">Complejidad: ${esc(x.dificultad)}</span></div>
        <h4>${esc(x.titulo)}</h4><p class="cc-subtitulo">${esc(x.subtitulo)}</p><p>${esc(x.resumen)}</p>
        <div class="cc-etiquetas">${(x.etiquetas || []).map(e => `<span>${esc(e)}</span>`).join("")}</div>
        <div class="cc-tema-metricas"><span>📚 ${esc(x.recursos)} recursos</span><span>📂 ${relacionados} casos del despacho</span></div>
        <div class="cc-tema-footer"><span>Objeto jurídico integrado</span><button class="btn-primary" type="button" onclick="abrirFichaCentro('${esc(x.id)}')">Abrir tema</button></div>
      </article>`;
    }).join("");
  }

  function contenidoLista(items, ordered = false) {
    const tag = ordered ? "ol" : "ul";
    return `<${tag} class="cc-lista">${(items || []).map(i => `<li>${esc(i)}</li>`).join("")}</${tag}>`;
  }

  function renderRecomendaciones(x) {
    const docs = x.recomendaciones || x.documentos || [];
    return `<div class="cc-recomendacion-intro"><strong>Recursos sugeridos para este procedimiento</strong><p>LexGear propone estos apoyos con base en el objeto jurídico seleccionado. El abogado decide cuáles utilizar.</p></div>
      <div class="cc-recomendaciones">${docs.map((r, i) => {
        const nombre = r.nombre || r;
        const motivo = r.motivo || "Documento frecuente en esta clase de asunto.";
        const plantilla = r.plantilla || "";
        return `<article><div class="cc-recomendacion-num">${i + 1}</div><div><strong>${esc(nombre)}</strong><p>${esc(motivo)}</p></div>${plantilla ? `<button class="btn-secundario" onclick="usarDocumentoCentro('${esc(plantilla)}')">Usar</button>` : ""}</article>`;
      }).join("")}</div>`;
  }

  function renderCasos(x) {
    const lista = asuntosRelacionados(x);
    const concluidos = lista.filter(a => normal(a.estado).includes("conclu")).length;
    const tramite = lista.filter(a => !["concluido", "cancelado"].includes(normal(a.estado))).length;
    const cancelados = lista.filter(a => normal(a.estado).includes("cancel")).length;
    if (!lista.length) return `<div class="cc-vacio"><strong>Aún no hay casos relacionados.</strong><span>Cuando registres asuntos de ${esc(x.titulo)}, aparecerán aquí automáticamente.</span></div>`;
    return `<div class="cc-casos-resumen"><div><strong>${lista.length}</strong><span>Total</span></div><div><strong>${tramite}</strong><span>En trámite</span></div><div><strong>${concluidos}</strong><span>Concluidos</span></div><div><strong>${cancelados}</strong><span>Cancelados</span></div></div>
      <div class="cc-casos-lista">${lista.slice(0, 12).map(a => `<article><div><strong>${esc(a.folioInterno || a.expediente || "Sin folio")}</strong><span>${esc(a.cliente || "Cliente no indicado")}</span></div><div><span>${esc(a.accion || x.titulo)}</span><small>${esc(a.juzgado || "Sin juzgado")}</small></div><span class="cc-estado">${esc(a.estado || "En proceso")}</span><button class="btn-secundario" onclick="abrirAsuntoRelacionado('${esc(a.id)}')">Ver asunto</button></article>`).join("")}</div>`;
  }

  function renderFicha() {
    if (!temaActivo) return;
    const panel = $("cc-ficha-panel");
    if (!panel) return;
    const x = temaActivo;
    const bloques = {
      explicacion: `<div class="cc-texto">${(x.explicacion || []).map(p => `<p>${esc(p)}</p>`).join("")}</div><div class="cc-enlaces"><button class="btn-secundario" onclick="abrirModuloCentro('biblioteca')">Abrir Biblioteca Jurídica</button></div>`,
      procesal: `<h4>Ruta práctica sugerida</h4>${contenidoLista(x.procesal, true)}<div class="cc-enlaces"><button class="btn-primary" onclick="abrirModuloCentro('procesal')">Ver ficha procesal completa</button></div>`,
      legislacion: `<h4>Fuentes normativas relacionadas</h4>${contenidoLista(x.legislacion)}<div class="cc-aviso">La legislación debe verificarse antes de presentar cualquier escrito.</div>`,
      documentos: `<h4>Documentos relacionados</h4><div class="cc-documentos">${(x.documentos || []).map(d => `<div><span>📄</span><strong>${esc(d.nombre)}</strong><button class="btn-secundario" onclick="usarDocumentoCentro('${esc(d.plantilla)}')">Usar</button></div>`).join("")}</div>`,
      checklist: `<h4>Checklist inicial</h4>${contenidoLista(x.checklist)}<button class="btn-secundario" onclick="imprimirChecklistCentro()">Imprimir checklist</button>`,
      estrategia: `<h4>Criterios de estrategia</h4>${contenidoLista(x.estrategia)}<div class="cc-aviso">Estas pautas son orientativas. La estrategia final corresponde al abogado responsable.</div>`,
      recomendaciones: renderRecomendaciones(x),
      casos: renderCasos(x)
    };
    panel.innerHTML = bloques[tabActivo] || bloques.explicacion;
  }

  function actualizarIndicadores() {
    if (!temaActivo || !$("cc-ficha-indicadores")) return;
    const relacionados = asuntosRelacionados(temaActivo).length;
    $("cc-ficha-indicadores").innerHTML = `<div><strong>${esc(temaActivo.dificultad)}</strong><span>Complejidad</span></div><div><strong>${esc(temaActivo.tiempo)}</strong><span>Prioridad</span></div><div><strong>${esc(temaActivo.recursos)}</strong><span>Recursos</span></div><div><strong>${relacionados}</strong><span>Casos relacionados</span></div>`;
  }

  function renderMaterias() {
    const panel = $("cc-lista-materias");
    if (!panel) return;
    const iconos = { Familiar:"👨‍👩‍👧", Civil:"🏛️", Mercantil:"💼", Sucesorio:"📜", Laboral:"👷", Administrativo:"🏢", Amparo:"🛡️", Penal:"⚖️", Contratos:"📝" };
    const materias = [...new Set(datos().map(x => x.materia).filter(Boolean))].sort((a,b) => {
      const orden = ["Familiar","Civil","Mercantil","Sucesorio","Laboral","Administrativo","Amparo","Penal","Contratos"];
      return (orden.indexOf(a) === -1 ? 99 : orden.indexOf(a)) - (orden.indexOf(b) === -1 ? 99 : orden.indexOf(b)) || a.localeCompare(b);
    });
    const contador = $("cc-materias-contador");
    if (contador) contador.textContent = `${materias.length} activas`;
    panel.innerHTML = materias.map(m => {
      const cantidad = datos().filter(x => x.materia === m).length;
      return `<button class="cc-materia ${m === materiaActiva ? "activa" : ""}" type="button" onclick="seleccionarMateriaCentro('${esc(m)}')"><span>${iconos[m] || "📚"}</span><div><strong>${m === "Sucesorio" ? "Derecho Sucesorio" : m === "Amparo" ? "Juicio de Amparo" : m === "Contratos" ? "Contratos" : `Derecho ${esc(m)}`}</strong><small>${cantidad} tema${cantidad === 1 ? "" : "s"} integrado${cantidad === 1 ? "" : "s"}</small></div></button>`;
    }).join("");
  }

  window.inicializarCentroConocimiento = () => {
    renderMaterias();
    renderTemas();
    const input = $("cc-buscar");
    if (input && !input.dataset.ccListener) {
      input.addEventListener("input", renderTemas);
      input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); renderTemas(); } });
      input.dataset.ccListener = "1";
    }
  };
  window.buscarCentroConocimiento = renderTemas;
  window.seleccionarMateriaCentro = materia => { materiaActiva = materia || ""; renderMaterias(); renderTemas(); if ($("cc-ficha")) $("cc-ficha").hidden = true; temaActivo = null; };
  window.abrirFichaCentro = id => {
    temaActivo = datos().find(x => x.id === id);
    if (!temaActivo) return;
    tabActivo = "explicacion";
    $("cc-ficha-materia").textContent = `Derecho ${temaActivo.materia}`;
    $("cc-ficha-titulo").textContent = temaActivo.titulo;
    $("cc-ficha-resumen").textContent = temaActivo.resumen;
    actualizarIndicadores();
    document.querySelectorAll("[data-cc-tab]").forEach(b => b.classList.toggle("activo", b.dataset.ccTab === "explicacion"));
    $("cc-ficha").hidden = false;
    renderFicha();
    $("cc-ficha").scrollIntoView({behavior:"smooth", block:"start"});
  };
  window.cerrarFichaCentro = () => { if ($("cc-ficha")) $("cc-ficha").hidden = true; temaActivo = null; };
  window.cambiarTabCentro = tab => { tabActivo = tab; document.querySelectorAll("[data-cc-tab]").forEach(b => b.classList.toggle("activo", b.dataset.ccTab === tab)); renderFicha(); };
  window.abrirModuloCentro = modulo => {
    const rutas = { biblioteca:"biblioteca-juridica", procesal:"conocimiento-juridico", documentos:"constructor-documentos", formularios:"entrevistas", jurisprudencia:"buscador-juridico" };
    if (rutas[modulo]) { window.switchTab?.(rutas[modulo]); return; }
    const nombres = { legislacion:"Legislación", estrategia:"Estrategia Procesal", calculadoras:"Calculadoras Jurídicas" };
    alert(`${nombres[modulo] || "Este módulo"} se integrará en una siguiente etapa del Centro de Conocimiento.`);
  };
  window.usarDocumentoCentro = plantilla => { sessionStorage.setItem("jslt_plantilla_pendiente", plantilla); window.switchTab?.("constructor-documentos"); setTimeout(() => window.nuevoDocumentoJuridico?.(), 80); };
  window.abrirAsuntoRelacionado = id => { sessionStorage.setItem("jslt_asunto_abrir", id); window.switchTab?.("asuntos"); setTimeout(() => window.abrirBitacoraAsunto?.(id), 180); };
  window.imprimirChecklistCentro = () => window.print();
  window.addEventListener("asuntosActualizados", () => { renderTemas(); if (temaActivo) { actualizarIndicadores(); if (tabActivo === "casos") renderFicha(); } });
  document.addEventListener("DOMContentLoaded", window.inicializarCentroConocimiento);
})();
