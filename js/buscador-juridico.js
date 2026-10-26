/**
 * JS LegalTech Control 3.1.3
 * Buscador jurídico de LegalTech con el flujo completo del buscador de SIGDE.
 * Incluye consulta SJF, agente determinista, respaldo indexado, enlaces externos,
 * copiar/abrir fuente, historial y tratamiento de ventanas emergentes.
 * No usa IA generativa. Los resultados indexados siempre se marcan como no verificados.
 */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const CLAVE_HISTORIAL = "js_legal_historial_busquedas_juridicas";
  const SJF_OFICIAL = "https://sjfsemanal.scjn.gob.mx/busqueda-principal-tesis";
  const DOMINIOS_SJF = /(^|\.)(sjf2\.scjn\.gob\.mx|sjfsemanal\.scjn\.gob\.mx|scjn\.gob\.mx)$/i;

  const FUENTES = {
    jurisprudencia: {
      titulo: "Tesis y jurisprudencia",
      descripcion: "Semanario Judicial de la Federación de la Suprema Corte de Justicia de la Nación.",
      icono: "⚖️",
      url: SJF_OFICIAL
    },
    cjf: {
      titulo: "Consejo de la Judicatura Federal",
      descripcion: "Normativa, acuerdos, directorios y servicios oficiales del Consejo de la Judicatura Federal.",
      icono: "🏛️",
      url: "https://www.cjf.gob.mx/"
    },
    jalisco: {
      titulo: "Legislación de Jalisco",
      descripcion: "Biblioteca Virtual del Congreso del Estado de Jalisco.",
      icono: "📘",
      url: "https://congresoweb.congresojal.gob.mx/BibliotecaVirtual/LeyesEstatales.cfm"
    },
    federal: {
      titulo: "Legislación federal",
      descripcion: "Leyes federales vigentes publicadas por la Cámara de Diputados.",
      icono: "📚",
      url: "https://www.diputados.gob.mx/LeyesBiblio/index.htm"
    },
    dof: {
      titulo: "Diario Oficial de la Federación",
      descripcion: "Publicaciones, decretos, reformas, acuerdos y disposiciones federales.",
      icono: "📰",
      url: "https://www.dof.gob.mx/"
    },
    corteidh: {
      titulo: "Corte Interamericana de Derechos Humanos",
      descripcion: "Sentencias, opiniones consultivas, resoluciones y jurisprudencia interamericana.",
      icono: "🌎",
      url: "https://www.corteidh.or.cr/"
    },
    integral: {
      titulo: "Búsqueda integral",
      descripcion: "Prepara una misma consulta para utilizarla en todas las fuentes oficiales.",
      icono: "🔎",
      url: ""
    }
  };

  let fuenteActual = "jurisprudencia";

  const escapar = valor => String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  function consultaOriginal() {
    return ($("bj-consulta")?.value || "").trim();
  }

  function materiaElegida() {
    return ($("bj-materia")?.value || "").trim();
  }

  function tipoElegido() {
    return ($("bj-tipo-documento")?.value || "").trim();
  }

  function consultaPreparada() {
    return [consultaOriginal(), materiaElegida() && `materia ${materiaElegida()}`, tipoElegido()]
      .filter(Boolean).join(" ").trim();
  }

  function consultaSJF() {
    // Conserva el comportamiento de SIGDE: consulta, materia y tipo se envían como términos.
    return [consultaOriginal(), materiaElegida() && `materia ${materiaElegida()}`, tipoElegido()]
      .filter(Boolean).join(" ").trim();
  }

  function filtroTipoSJF() {
    const tipo = tipoElegido().toLocaleLowerCase("es-MX");
    const filtros = {
      "jurisprudencia": "jurisprudencia",
      "tesis aislada": "tesis aislada",
      "tesis": "tesis",
      "ejecutoria": "ejecutoria",
      "sentencia": "sentencia"
    };
    // Otros conceptos (reforma, decreto, ley, etc.) se usan como texto; no se finge
    // que sean filtros oficiales de la API de tesis del SJF.
    return filtros[tipo] || "";
  }

  function consultaValida(consulta) {
    return consulta.length >= 2;
  }

  function mostrarEstado(mensaje, error = false) {
    const estado = $("bj-estado");
    if (!estado) return;
    estado.hidden = false;
    estado.textContent = mensaje;
    estado.classList.toggle("error", error);
  }

  function ocultarEstado() {
    const estado = $("bj-estado");
    if (estado) estado.hidden = true;
  }

  function limpiarResultados() {
    const contenedor = $("bj-resultados");
    if (contenedor) contenedor.innerHTML = "";
  }

  async function copiar(texto) {
    const valor = String(texto || "");
    if (!valor) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(valor);
        return true;
      }
    } catch (_) { /* Continúa con el respaldo local. */ }
    try {
      const auxiliar = document.createElement("textarea");
      auxiliar.value = valor;
      auxiliar.setAttribute("readonly", "");
      auxiliar.style.position = "fixed";
      auxiliar.style.left = "-9999px";
      auxiliar.style.top = "0";
      document.body.appendChild(auxiliar);
      auxiliar.focus();
      auxiliar.select();
      auxiliar.setSelectionRange(0, auxiliar.value.length);
      const correcto = document.execCommand("copy");
      auxiliar.remove();
      if (correcto) return true;
    } catch (_) { /* El último respaldo será un cuadro manual. */ }
    try { window.prompt("No fue posible copiar automáticamente. Copia la consulta de este cuadro:", valor); } catch (_) {}
    return false;
  }

  function leerHistorial() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || "[]");
      return Array.isArray(datos) ? datos : [];
    } catch (_) { return []; }
  }

  function guardarEnHistorial(consulta) {
    const valor = String(consulta || "").trim();
    if (!valor) return;
    const actual = leerHistorial().filter(item => (typeof item === "string" ? item : item?.consulta) !== valor);
    actual.unshift({ consulta: valor, fuente: fuenteActual, fecha: new Date().toISOString() });
    try { localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(actual.slice(0, 8))); } catch (_) {}
    renderizarHistorial();
  }

  function renderizarHistorial() {
    const contenedor = $("bj-historial-lista");
    if (!contenedor) return;
    const historial = leerHistorial();
    contenedor.innerHTML = "";
    if (!historial.length) {
      contenedor.innerHTML = '<p class="bj-vacio">Todavía no hay búsquedas guardadas.</p>';
      return;
    }
    historial.forEach(item => {
      const consulta = typeof item === "string" ? item : String(item?.consulta || "");
      if (!consulta) return;
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "bj-historial-item";
      boton.textContent = consulta;
      boton.title = "Volver a usar esta consulta";
      boton.addEventListener("click", () => {
        $("bj-consulta").value = consulta;
        $("bj-consulta").focus();
      });
      contenedor.appendChild(boton);
    });
  }

  function urlSegura(valor) {
    try {
      const url = new URL(String(valor || ""));
      if (url.protocol !== "https:") return "";
      if (!DOMINIOS_SJF.test(url.hostname.toLowerCase())) return "";
      return url.href;
    } catch (_) { return ""; }
  }

  function urlBusquedaSJF(query, exacta = false) {
    const q = String(query || "").trim();
    const term = exacta ? `"${q}"` : q;
    return `https://www.google.com/search?q=${encodeURIComponent(`${term} (site:sjf2.scjn.gob.mx OR site:sjfsemanal.scjn.gob.mx OR site:scjn.gob.mx)`)}`;
  }

  function prepararPestanaGoogle(query) {
    // Igual que SIGDE: en escritorio se abre una pestaña durante el clic del usuario;
    // en móvil se evita abrir una pestaña vacía que pueda cambiar el contexto de la PWA.
    const movil = window.matchMedia?.("(max-width: 768px)")?.matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    let ventana = null;
    if (!movil) {
      try {
        ventana = window.open("about:blank", "_blank");
        if (ventana) {
          ventana.document.title = "LegalTech · Búsqueda jurídica";
          ventana.document.body.innerHTML = '<main style="font-family:Arial,sans-serif;max-width:680px;margin:12vh auto;padding:24px;color:#17324d"><h2>Consultando fuentes judiciales…</h2><p>Si el servicio no devuelve resultados, esta pestaña abrirá una búsqueda restringida a dominios oficiales.</p></main>';
        }
      } catch (_) { ventana = null; }
    }
    return {
      ir: () => {
        const destino = urlBusquedaSJF(query);
        try {
          if (ventana && !ventana.closed) ventana.location.replace(destino);
          else window.open(destino, "_blank", "noopener,noreferrer");
        } catch (_) { /* Los enlaces de respaldo visibles siguen disponibles. */ }
      },
      cerrar: () => { try { if (ventana && !ventana.closed) ventana.close(); } catch (_) {} }
    };
  }

  function activarTab(nombre) {
    if (!FUENTES[nombre]) return;
    fuenteActual = nombre;
    document.querySelectorAll(".bj-tab").forEach(boton => {
      const activo = boton.dataset.bjTab === nombre;
      boton.classList.toggle("activa", activo);
      boton.setAttribute("aria-selected", activo ? "true" : "false");
    });
    const fuente = FUENTES[nombre];
    if ($("bj-fuente-icono")) $("bj-fuente-icono").textContent = fuente.icono;
    if ($("bj-fuente-titulo")) $("bj-fuente-titulo").textContent = fuente.titulo;
    if ($("bj-fuente-descripcion")) $("bj-fuente-descripcion").textContent = fuente.descripcion;
    const buscarBtn = $("bj-btn-buscar");
    if (buscarBtn) {
      buscarBtn.textContent = nombre === "jurisprudencia"
        ? "🔎 Buscar en el SJF"
        : nombre === "integral" ? "🔎 Preparar búsqueda integral" : "🌐 Abrir fuente oficial";
    }
    const agente = $("bj-btn-agente");
    if (agente) agente.hidden = nombre !== "jurisprudencia";
    const abrir = $("bj-btn-abrir");
    if (abrir) abrir.textContent = nombre === "integral" ? "🌐 Mostrar fuentes" : "🌐 Abrir fuente oficial";
    const integrales = $("bj-enlaces-integrales");
    if (integrales) integrales.hidden = true;
    limpiarResultados();
    ocultarEstado();
  }

  function renderizarFuentesIntegrales() {
    const contenedor = $("bj-enlaces-integrales");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    Object.entries(FUENTES).filter(([clave]) => clave !== "integral").forEach(([clave, fuente]) => {
      const enlace = document.createElement("a");
      enlace.className = "bj-fuente-card";
      enlace.href = fuente.url;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      enlace.dataset.fuente = clave;
      enlace.innerHTML = `<span>${escapar(fuente.icono)}</span><div><strong>${escapar(fuente.titulo)}</strong><small>${escapar(fuente.descripcion)}</small></div><b>↗</b>`;
      contenedor.appendChild(enlace);
    });
    contenedor.hidden = false;
  }

  async function llamarFuncion(nombre, datos) {
    if (!window.firebaseFunctions || typeof window.firebaseFunctions.httpsCallable !== "function") {
      throw new Error("Firebase Functions no está disponible. Abre la fuente oficial o utiliza la búsqueda web de respaldo.");
    }
    const respuesta = await window.firebaseFunctions.httpsCallable(nombre)(datos);
    return respuesta?.data || { ok: false, results: [] };
  }

  function renderizarSinResultados(query, detalles = []) {
    const contenedor = $("bj-resultados");
    if (!contenedor) return;
    const detalle = detalles.filter(Boolean).join("; ");
    contenedor.innerHTML = `<article class="bj-resultado-card">
      <h4>No se localizaron resultados automáticos</h4>
      <p>Esto no demuestra que el criterio no exista. El servicio oficial o los buscadores pueden estar temporalmente inaccesibles o haber cambiado su respuesta.</p>
      ${detalle ? `<p class="bj-detalle-tecnico"><strong>Detalle técnico:</strong> ${escapar(detalle)}</p>` : ""}
      <p>La búsqueda web es una pista de localización; verifica registro digital, texto íntegro, vigencia, obligatoriedad y aplicabilidad en la fuente oficial.</p>
      <div class="bj-resultado-acciones">
        <a class="bj-btn-principal bj-link-respaldo" target="_blank" rel="noopener noreferrer" href="${escapar(urlBusquedaSJF(query))}">🔎 Abrir búsqueda judicial en Google ↗</a>
        <a class="bj-btn-secundario" target="_blank" rel="noopener noreferrer" href="${escapar(urlBusquedaSJF(query, true))}">“ ” Buscar frase exacta ↗</a>
        <a class="bj-btn-secundario" target="_blank" rel="noopener noreferrer" href="${escapar(SJF_OFICIAL)}">⚖️ Abrir SJF oficial ↗</a>
      </div>
    </article>`;
  }

  function renderizarResultadosSJF(datos, query, modo = "directo") {
    const contenedor = $("bj-resultados");
    const resultados = Array.isArray(datos?.results) ? datos.results : [];
    if (!contenedor) return;
    if (!resultados.length) {
      renderizarSinResultados(query, [datos?.technical, datos?.message]);
      return;
    }

    const indexado = modo === "indexado" || datos?.source === "web-indexed-fallback" || datos?.source === "web-indexed";
    const intentos = Array.isArray(datos?.attempts) ? datos.attempts : [];
    const consultasIntentadas = Array.isArray(datos?.queriesTried) ? datos.queriesTried : [];
    let html = `<article class="bj-resultado-card bj-resumen-resultados">
      <h4>${modo === "agente" ? "🤖 Informe del agente jurídico" : indexado ? "Resultados web indexados · Por verificar" : "Resultados del SJF"}</h4>
      <p><strong>Consulta:</strong> ${escapar(datos?.query || query)}</p>
      <p>${escapar(datos?.message || (indexado ? "Estos enlaces son pistas; no son fichas validadas por la API oficial." : "Resultados recibidos del servicio público del SJF. Verifica el criterio y su aplicabilidad antes de citar."))}</p>`;
    if (datos?.source) html += `<p><strong>Origen:</strong> ${escapar(datos.source)}${datos?.provider ? ` · Proveedor: ${escapar(datos.provider)}` : ""}</p>`;
    if (intentos.length) {
      html += `<p><strong>Consultas ejecutadas:</strong> ${intentos.map(a => `${escapar(a.query || a.provider || "Consulta")}: ${Number(a.count) || 0}${a.error ? ` (${escapar(a.error)})` : ""}`).join("; ")}</p>`;
    } else if (consultasIntentadas.length) {
      html += `<p><strong>Consultas intentadas:</strong> ${consultasIntentadas.map(escapar).join("; ")}</p>`;
    }
    html += `<div class="bj-resultado-acciones"><a class="bj-btn-secundario" target="_blank" rel="noopener noreferrer" href="${escapar(SJF_OFICIAL)}">Abrir SJF oficial ↗</a><a class="bj-link-respaldo" target="_blank" rel="noopener noreferrer" href="${escapar(urlBusquedaSJF(query))}">Búsqueda web restringida ↗</a></div></article>`;

    resultados.forEach((item, index) => {
      const titulo = item.rubro || item.title || "Resultado sin título";
      const texto = item.criterio || item.snippet || "La fuente no proporcionó un fragmento de texto.";
      const url = urlSegura(item.url);
      const esIndexado = indexado || item.verified === false || /indexad|no verificado|por verificar/i.test(String(item.source || item.tipo || ""));
      const tipo = item.tipo || (esIndexado ? "Resultado indexado · Por verificar" : "Tesis o jurisprudencia");
      html += `<article class="bj-resultado-card bj-item-resultado">
        <div class="bj-result-meta-top"><span class="bj-resultado-etiqueta ${esIndexado ? "bj-no-verificado" : ""}">${escapar(tipo)}</span><span>Registro: <strong>${escapar(item.registro || "No disponible")}</strong></span></div>
        <h4>${url ? `<a href="${escapar(url)}" target="_blank" rel="noopener noreferrer">${escapar(titulo)} ↗</a>` : escapar(titulo)}</h4>
        <p>${escapar(texto)}</p>
        <div class="bj-metadatos"><span>Materia: ${escapar(item.materia || "No disponible")}</span><span>Instancia: ${escapar(item.instancia || "No disponible")}</span><span>Época: ${escapar(item.epoca || "No disponible")}</span>${item.domain ? `<span>Dominio: ${escapar(item.domain)}</span>` : ""}${item._provider ? `<span>Proveedor: ${escapar(item._provider)}</span>` : ""}${item.queryUsed ? `<span>Consulta: ${escapar(item.queryUsed)}</span>` : ""}</div>
        <div class="bj-resultado-acciones"><button class="bj-btn-secundario bj-copiar-rubro" type="button" data-result-index="${index}">📋 Copiar rubro</button>${url ? `<a class="bj-btn-secundario" href="${escapar(url)}" target="_blank" rel="noopener noreferrer">Abrir resultado ↗</a>` : ""}<a class="bj-btn-secundario" href="${escapar(`${SJF_OFICIAL}?q=${encodeURIComponent(String(titulo || query))}`)}" target="_blank" rel="noopener noreferrer">Buscar en SJF ↗</a></div>
      </article>`;
    });

    contenedor.innerHTML = html;
    contenedor.querySelectorAll(".bj-copiar-rubro").forEach(boton => {
      boton.addEventListener("click", async () => {
        const item = resultados[Number(boton.dataset.resultIndex)];
        const texto = item?.rubro || item?.title || query;
        const ok = await copiar(texto);
        mostrarEstado(ok ? "Rubro o título copiado al portapapeles." : "No se pudo copiar automáticamente; utiliza el cuadro manual si apareció.", !ok);
      });
    });
  }

  async function buscarEnSJF({ agente = false } = {}) {
    const original = consultaOriginal();
    if (!consultaValida(original)) {
      mostrarEstado("Escribe al menos dos caracteres para consultar el SJF.", true);
      $("bj-consulta")?.focus();
      return;
    }

    const query = consultaSJF();
    const materia = materiaElegida();
    const tipoElegidoTexto = tipoElegido();
    const tipo = filtroTipoSJF();
    const googleTab = prepararPestanaGoogle(query); // Debe hacerse antes del primer await por el bloqueador de ventanas.
    guardarEnHistorial(original);
    await copiar(query);

    const boton = agente ? $("bj-btn-agente") : $("bj-btn-buscar");
    const textoInicial = boton?.textContent || "Buscar";
    if (boton) { boton.disabled = true; boton.textContent = agente ? "🤖 Consultando…" : "Buscando…"; }
    limpiarResultados();

    const detalles = [];
    if (tipoElegidoTexto && !tipo) {
      detalles.push(`El tipo «${tipoElegidoTexto}» se usa como término de búsqueda porque no es un filtro de tipo compatible documentado para el servicio de tesis.`);
    }
    mostrarEstado((detalles.length ? `${detalles.join(" ")} ` : "") + (agente
      ? "El agente está reformulando la consulta y consultando el SJF. No utiliza IA generativa."
      : "Consultando el servicio público del SJF…"));

    try {
      let datos = null;
      let directoError = "";
      if (agente) {
        try {
          datos = await llamarFuncion("searchSJFAgent", { query, filters: { materia, tipo } });
          if (Array.isArray(datos.results) && datos.results.length) {
            googleTab.cerrar();
            mostrarEstado(`Agente jurídico: ${datos.results.length} resultado(s) recuperados. Verifica las fuentes antes de citarlas.`);
            renderizarResultadosSJF(datos, query, "agente");
            return;
          }
          detalles.push(datos?.technical || datos?.message || "El agente no devolvió resultados.");
        } catch (error) {
          directoError = error?.message || "Fallo al llamar al agente jurídico.";
          detalles.push(`Agente: ${directoError}`);
        }
      } else {
        try {
          datos = await llamarFuncion("searchSJF", { query, filters: { materia, tipo } });
          if (Array.isArray(datos.results) && datos.results.length) {
            googleTab.cerrar();
            mostrarEstado(`${datos.results.length} resultado(s) recibidos del servicio público del SJF.`);
            renderizarResultadosSJF(datos, query, "directo");
            return;
          }
          detalles.push(datos?.technical || datos?.message || "El SJF no devolvió fichas.");
        } catch (error) {
          directoError = error?.message || "Fallo al llamar al SJF.";
          detalles.push(`SJF: ${directoError}`);
        }
      }

      mostrarEstado("No hay fichas del servicio principal. Intentando localizar enlaces en índices web judiciales…");
      let indexados;
      try {
        indexados = await llamarFuncion("searchSJFIndexed", { query });
      } catch (error) {
        detalles.push(`Búsqueda indexada: ${error?.message || "fallo de consulta"}`);
        indexados = { ok: false, results: [], technical: error?.message || "No se pudo consultar el índice externo." };
      }
      if (Array.isArray(indexados.results) && indexados.results.length) {
        googleTab.cerrar();
        mostrarEstado(`${indexados.results.length} enlace(s) judicial(es) localizados. Son pistas y deben verificarse en la fuente oficial.`);
        renderizarResultadosSJF(indexados, query, "indexado");
        return;
      }

      const detalleFinal = [datos?.technical, datos?.message, indexados?.technical, indexados?.message, ...detalles].filter(Boolean);
      googleTab.ir();
      mostrarEstado("No hubo resultados automáticos. Se intentó abrir Google restringido a fuentes judiciales; también tienes enlaces de respaldo abajo.", true);
      renderizarSinResultados(query, detalleFinal);
    } catch (error) {
      // Último control para que un error inesperado no deje el botón bloqueado ni la vista vacía.
      detalles.push(error?.message || "Error inesperado en la búsqueda.");
      googleTab.ir();
      mostrarEstado("La búsqueda automática no pudo completarse. Usa los enlaces de respaldo y verifica en la fuente oficial.", true);
      renderizarSinResultados(query, detalles);
    } finally {
      if (boton) { boton.disabled = false; boton.textContent = textoInicial; }
    }
  }

  async function buscar() {
    const consulta = consultaPreparada();
    if (!consultaValida(consultaOriginal())) {
      mostrarEstado("Escribe al menos dos caracteres en la consulta jurídica.", true);
      $("bj-consulta")?.focus();
      return;
    }
    guardarEnHistorial(consultaOriginal());

    if (fuenteActual === "jurisprudencia") {
      await buscarEnSJF({ agente: false });
      return;
    }
    if (fuenteActual === "integral") {
      const ok = await copiar(consulta);
      renderizarFuentesIntegrales();
      mostrarEstado(ok ? "Consulta preparada y copiada. Abre las fuentes que necesites y pégala en cada portal." : "Consulta preparada. Puedes copiarla manualmente y abrir las fuentes que necesites.");
      return;
    }

    const ok = await copiar(consulta);
    const fuente = FUENTES[fuenteActual];
    const ventana = window.open(fuente.url, "_blank", "noopener,noreferrer");
    if (!ventana) {
      mostrarEstado("El navegador bloqueó la pestaña. Usa «Abrir fuente oficial» o permite ventanas emergentes.", true);
      renderizarFuentesIntegrales();
      return;
    }
    mostrarEstado(ok ? `Se abrió ${fuente.titulo}. La consulta quedó copiada para pegarla en el portal.` : `Se abrió ${fuente.titulo}. Copia manualmente la consulta en el portal.`);
  }

  async function copiarConsulta() {
    const consulta = consultaPreparada();
    if (!consultaValida(consultaOriginal())) {
      mostrarEstado("Escribe una consulta antes de copiar.", true);
      $("bj-consulta")?.focus();
      return;
    }
    const ok = await copiar(consulta);
    guardarEnHistorial(consultaOriginal());
    mostrarEstado(ok ? "Consulta copiada al portapapeles." : "No fue posible copiar automáticamente; utiliza el cuadro manual si apareció.", !ok);
  }

  async function abrirFuenteOficial() {
    const consulta = consultaPreparada();
    if (!consultaValida(consultaOriginal())) {
      mostrarEstado("Escribe una consulta antes de abrir la fuente.", true);
      $("bj-consulta")?.focus();
      return;
    }
    guardarEnHistorial(consultaOriginal());
    await copiar(consulta);
    if (fuenteActual === "integral") {
      renderizarFuentesIntegrales();
      mostrarEstado("Se muestran las seis fuentes oficiales. Selecciona la que necesites y pega la consulta.");
      return;
    }
    const fuente = FUENTES[fuenteActual];
    const destino = fuenteActual === "jurisprudencia" ? `${SJF_OFICIAL}?q=${encodeURIComponent(consulta)}` : fuente.url;
    const ventana = window.open(destino, "_blank", "noopener,noreferrer");
    if (!ventana) {
      mostrarEstado("El navegador bloqueó la pestaña. Usa el enlace de la fuente o permite ventanas emergentes.", true);
      renderizarFuentesIntegrales();
      return;
    }
    mostrarEstado(`Se abrió ${fuente.titulo}. Pega la consulta en el buscador oficial.`);
  }

  function limpiar() {
    if ($("bj-consulta")) $("bj-consulta").value = "";
    if ($("bj-materia")) $("bj-materia").value = "";
    if ($("bj-tipo-documento")) $("bj-tipo-documento").value = "";
    if ($("bj-enlaces-integrales")) $("bj-enlaces-integrales").hidden = true;
    limpiarResultados();
    ocultarEstado();
    $("bj-consulta")?.focus();
  }

  function borrarHistorial() {
    try { localStorage.removeItem(CLAVE_HISTORIAL); } catch (_) {}
    renderizarHistorial();
    mostrarEstado("Historial de búsquedas eliminado.");
  }

  function iniciar() {
    document.querySelectorAll(".bj-tab").forEach(boton => {
      boton.addEventListener("click", () => activarTab(boton.dataset.bjTab));
    });
    $("bj-btn-buscar")?.addEventListener("click", buscar);
    $("bj-btn-agente")?.addEventListener("click", () => buscarEnSJF({ agente: true }));
    $("bj-btn-copiar")?.addEventListener("click", copiarConsulta);
    $("bj-btn-abrir")?.addEventListener("click", abrirFuenteOficial);
    $("bj-btn-limpiar")?.addEventListener("click", limpiar);
    $("bj-borrar-historial")?.addEventListener("click", borrarHistorial);
    $("bj-consulta")?.addEventListener("keydown", evento => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key === "Enter") buscar();
    });
    activarTab("jurisprudencia");
    renderizarHistorial();
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
