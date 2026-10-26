const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const ROLES = ["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado", "Pasante"];

async function perfilSolicitante(auth) {
  if (!auth?.uid) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  const snap = await db.collection("personal").doc(auth.uid).get();
  if (!snap.exists) throw new HttpsError("permission-denied", "No tienes un perfil administrativo.");
  const perfil = snap.data();
  if (perfil.estado !== "Activo") throw new HttpsError("permission-denied", "Tu cuenta está inactiva.");
  return perfil;
}

function puedeCrear(solicitante, rolNuevo) {
  if (solicitante.rol === "Superadministrador") return true;
  if (solicitante.rol === "Administrador") return rolNuevo !== "Superadministrador";
  if (solicitante.rol === "Auxiliar Jurídico") {
    return ["Auxiliar Jurídico", "Abogado", "Pasante"].includes(rolNuevo);
  }
  return false;
}

exports.crearUsuarioDelSistema = onCall({ region: "us-central1" }, async request => {
  const solicitante = await perfilSolicitante(request.auth);
  const data = request.data || {};
  const nombre = String(data.nombre || "").trim();
  const correo = String(data.correo || "").trim().toLowerCase();
  const usuario = String(data.usuario || "").trim();
  const passwordTemporal = String(data.passwordTemporal || "");
  const rol = String(data.rol || "");
  const estado = data.estado === "Baja" ? "Baja" : "Activo";

  if (!nombre || !correo || !usuario || !passwordTemporal || !ROLES.includes(rol)) {
    throw new HttpsError("invalid-argument", "Faltan datos obligatorios o el rol no es válido.");
  }
  if (passwordTemporal.length < 8) {
    throw new HttpsError("invalid-argument", "La contraseña temporal debe tener al menos 8 caracteres.");
  }
  if (!puedeCrear(solicitante, rol)) {
    throw new HttpsError("permission-denied", "Tu rol no puede crear este tipo de usuario.");
  }

  let authUser;
  try {
    authUser = await admin.auth().createUser({
      email: correo,
      password: passwordTemporal,
      displayName: nombre,
      disabled: estado !== "Activo"
    });

    await admin.auth().setCustomUserClaims(authUser.uid, { rol });
    await db.collection("personal").doc(authUser.uid).set({
      uid: authUser.uid,
      nombre,
      correo,
      usuario,
      usuarioNormalizado: usuario.toLowerCase(),
      rol,
      estado,
      activo: estado === "Activo",
      abogadoCodigo: data.abogadoCodigo || "",
      abogadoSupervisorUid: rol === "Pasante" ? String(data.abogadoSupervisorUid || "") : "",
      abogadoSupervisorUsuario: rol === "Pasante" ? String(data.abogadoSupervisorUsuario || "") : "",
      debeCambiarPassword: true,
      creadoPorUid: request.auth.uid,
      fechaAlta: admin.firestore.FieldValue.serverTimestamp(),
      fechaModificacion: admin.firestore.FieldValue.serverTimestamp()
    });

    return { uid: authUser.uid, correo };
  } catch (error) {
    if (authUser?.uid) await admin.auth().deleteUser(authUser.uid).catch(() => {});
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "Ese correo ya existe en Firebase Authentication.");
    }
    throw new HttpsError("internal", error.message || "No fue posible crear el usuario.");
  }
});

exports.restablecerPasswordTemporal = onCall({ region: "us-central1" }, async request => {
  const solicitante = await perfilSolicitante(request.auth);
  if (!["Superadministrador", "Administrador"].includes(solicitante.rol)) {
    throw new HttpsError("permission-denied", "Solo un administrador puede restablecer contraseñas.");
  }

  const uid = String(request.data?.uid || "");
  const passwordTemporal = String(request.data?.passwordTemporal || "");
  if (!uid || passwordTemporal.length < 8) {
    throw new HttpsError("invalid-argument", "UID o contraseña temporal no válidos.");
  }

  const objetivo = await db.collection("personal").doc(uid).get();
  if (!objetivo.exists) throw new HttpsError("not-found", "No se encontró el usuario.");
  if (solicitante.rol === "Administrador" && objetivo.data().rol === "Superadministrador") {
    throw new HttpsError("permission-denied", "Un administrador no puede modificar al Superadministrador.");
  }

  await admin.auth().updateUser(uid, { password: passwordTemporal });
  await objetivo.ref.set({
    debeCambiarPassword: true,
    passwordTemporalRestablecidaPorUid: request.auth.uid,
    fechaModificacion: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { ok: true };
});


/* === BUSCADOR JURÍDICO MIGRADO DESDE SIGDE === */

// El buscador jurídico está disponible para personal interno activo de LegalTech.
// Se valida el perfil del despacho en la colección personal, no una lista de roles de SIGDE.
async function autorizarBuscadorJuridico(request) {
  const perfil = await perfilSolicitante(request.auth);
  const rolNormalizado = String(perfil.rol || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-MX");
  const rolesPermitidos = new Set([
    "superadministrador",
    "administrador",
    "auxiliar juridico",
    "abogado",
    "pasante"
  ]);
  if (!rolesPermitidos.has(rolNormalizado)) {
    throw new HttpsError("permission-denied", "Tu perfil no tiene permiso para utilizar el Buscador Jurídico.");
  }
  return perfil;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlTag(block, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = String(block || "").match(re);
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
}

function stripXml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSjfSoap(xml) {
  const blocks = String(xml || "").match(/<CamposComunesBE(?:\s[^>]*)?>[\s\S]*?<\/CamposComunesBE>/gi) || [];
  const resultBlock = String(xml || "").match(/<ObtenerResultadosResult(?:\s[^>]*)?>[\s\S]*?<\/ObtenerResultadosResult>/i)?.[0] || "";
  const records = xmlTag(resultBlock, "Registros");
  const items = blocks.map(block => {
    const id = stripXml(xmlTag(block, "Id"));
    const rubro = stripXml(xmlTag(block, "Rubro"));
    const tesis = stripXml(xmlTag(block, "Tesis"));
    const localizacion = stripXml(xmlTag(block, "Localizacion"));
    const tipo = stripXml(xmlTag(block, "TipoTesis"));
    const asunto = stripXml(xmlTag(block, "TpoAsunto"));
    return {
      registro: id,
      rubro,
      criterio: tesis,
      materia: "",
      instancia: "",
      epoca: "",
      tipo: tipo || "Tesis",
      localizacion,
      asunto,
      url: id ? `https://sjfsemanal.scjn.gob.mx/detalle/tesis/${encodeURIComponent(id)}` : ""
    };
  });
  return { items, total: Number(records) || items.length };
}

async function requestSjfXml(body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("https://sjf.scjn.gob.mx/sjfsem/Servicios/wsResultados.asmx", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '"http://sjf.scjn.gob.mx/ObtenerResultados"',
        "Accept": "text/xml, application/xml"
      },
      body,
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`SJF respondió HTTP ${response.status}`);
    if (!/<ObtenerResultadosResult[\s>]/i.test(text)) throw new Error("Respuesta SOAP no compatible.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function buildSjfSoap(query, filters = {}) {
  const zero = [
    "SoloIds","TATJ","OrdenadoPor","IDPonente","IDAsunto","IDTipoTesis","IDCircuito",
    "Desde","Hasta","index","IDTipoAcuerdo","IDInstancia","Octava","IDParte","TotalElementos",
    "IDTipoPonente","IDTribunalColegiado","IDTipoVoto","Epoca","Anio","Mes","IdTema","IdRaiz",
    "IdCto","IdEpoca","IdTcc","IdMateria","IdProg"
  ];
  const empty = [
    "TesisIDs","FTExpresion","Dominio","Sesion","Tablero","TableroDGI","TableroCIDH","TableroPO",
    "TableroEV","Semanas","Clase","CadenaEpoca","CadenaApendice","Sinonimos","Indice","DescTCC",
    "IdAbc","IdSesion","TablaTema"
  ];
  const fields = { SoloIds: 0, Expresion: query, startRowIndex: 0, maximumRows: 50, SeBuscaPorTema: 0 };
  zero.forEach(k => fields[k] = 0);
  empty.forEach(k => fields[k] = "");
  // El servicio público documenta filtros numéricos, pero no expone en la página
  // pública el catálogo vigente de IDs de materia/instancia. No se inventan IDs.
  const form = [
    ...Object.entries(fields).map(([k,v]) => `<${k}>${xmlEscape(v)}</${k}>`),
  ].join("");
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ObtenerResultados xmlns="http://sjf.scjn.gob.mx/">
      <Url>https://sjfsemanal.scjn.gob.mx/busqueda-principal-tesis</Url>
      <FormMaster>${form}</FormMaster>
    </ObtenerResultados>
  </soap:Body>
</soap:Envelope>`;
}

exports.searchSJF = onCall({ region: "us-central1", timeoutSeconds: 45 }, async request => {
  await autorizarBuscadorJuridico(request);

  const query = String(request.data?.query || "").trim();
  const filters = request.data?.filters || {};
  if (query.length < 2) throw new HttpsError("invalid-argument", "La búsqueda debe contener al menos 2 caracteres.");
  if (query.length > 250) throw new HttpsError("invalid-argument", "La búsqueda es demasiado larga.");

  let lastError = null;
  try {
    const xml = await requestSjfXml(buildSjfSoap(query, filters));
    const parsed = parseSjfSoap(xml);
    let items = parsed.items;
    if (filters.tipo) {
      const wanted = String(filters.tipo).toLowerCase();
      items = items.filter(x => String(x.tipo || "").toLowerCase().includes(wanted));
    }
    return {
      ok: true,
      configured: true,
      results: items.slice(0, 50),
      total: parsed.total,
      source: "SCJN/SJF wsResultados",
      officialSearch: "https://sjfsemanal.scjn.gob.mx/busqueda-principal-tesis"
    };
  } catch (err) {
    lastError = err;
  }

  // Respaldo del microservicio público documentado por la SCJN. Se conserva como
  // segunda vía porque el contrato de esa API no está publicado de forma completa.
  try {
    const base = "https://sjf2.scjn.gob.mx/services/sjftesismicroservice/api/public/tesis";
    const params = new URLSearchParams({ query });
    const response = await fetch(`${base}?${params.toString()}`, { headers: { Accept: "application/json" } });
    const payloadText = await response.text();
    if (!response.ok) throw new Error(`Microservicio HTTP ${response.status}`);
    let payload;
    try { payload = JSON.parse(payloadText); } catch { throw new Error("Microservicio no devolvió JSON."); }
    const raw = Array.isArray(payload) ? payload : (payload.results || payload.data || payload.items || payload.tesis || []);
    const items = raw.map(x => ({
      registro: String(x.registro || x.Registro || x.registroDigital || x.id || x.Id || ""),
      rubro: String(x.rubro || x.Rubro || x.titulo || x.Titulo || ""),
      criterio: String(x.criterio || x.Criterio || x.texto || x.Texto || ""),
      materia: String(x.materia || x.Materia || ""),
      instancia: String(x.instancia || x.Instancia || ""),
      epoca: String(x.epoca || x.Epoca || ""),
      tipo: String(x.tipo || x.Tipo || x.tipoDocumento || "Tesis"),
      url: String(x.url || x.Url || x.liga || (x.id ? `https://sjfsemanal.scjn.gob.mx/detalle/tesis/${encodeURIComponent(x.id)}` : ""))
    })).filter(x => x.rubro || x.registro || x.criterio);
    return { ok: true, configured: true, results: items.slice(0, 50), total: items.length, source: "SCJN/SJF API pública", officialSearch: "https://sjfsemanal.scjn.gob.mx/busqueda-principal-tesis" };
  } catch (err) {
    lastError = err;
  }

  return {
    ok: false,
    configured: true,
    results: [],
    source: "SCJN/SJF",
    message: "No fue posible obtener resultados automáticamente del servicio público del SJF. La consulta se conserva para abrir el buscador oficial.",
    technical: lastError?.message || "Sin respuesta"
  };
});

function decodeHtmlEntities(value) {
  return stripXml(String(value || ""))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

// Agente jurídico SJF V1: orquestación determinista y gratuita sobre el servicio oficial.
// No usa IA generativa ni inventa criterios: reformula la consulta, consulta el SJF y deduplica registros reales.
function buildAgentQueries(query) {
  const original = String(query || "").trim().replace(/\s+/g, " ");
  const variants = [original];
  const q = original.toLocaleLowerCase("es-MX");
  const add = value => { if (value && !variants.some(x => x.toLocaleLowerCase("es-MX") === value.toLocaleLowerCase("es-MX")) && variants.length < 3) variants.push(value); };
  const expansions = [
    { test: /despido|despedid|separaci[oó]n injustificada/, values: ["despido injustificado trabajador", "indemnización constitucional por despido"] },
    { test: /pensi[oó]n alimenticia|alimentos|pensi[oó]n/, values: ["derecho de alimentos obligación alimentaria", "pensión alimenticia proporcionalidad"] },
    { test: /arrendamiento|desahucio/, values: ["contrato de arrendamiento terminación", "juicio de desahucio arrendamiento"] },
    { test: /inter[eé]s superior|niñ[oa]s|menores/, values: ["interés superior de la niñez derechos de niñas niños adolescentes"] },
    { test: /amparo|suspensi[oó]n/, values: ["juicio de amparo suspensión acto reclamado"] },
    { test: /responsabilidad civil|daño moral/, values: ["responsabilidad civil reparación del daño", "daño moral indemnización"] }
  ];
  for (const entry of expansions) {
    if (entry.test.test(q)) { for (const value of entry.values) add(value); break; }
  }
  // Para consultas sin expansión temática, divide una frase larga en términos principales solo si hay suficientes palabras.
  if (variants.length === 1) {
    const words = original.split(/\s+/).filter(x => x.length > 3);
    if (words.length >= 3) add(words.slice(0, Math.min(4, words.length)).join(" "));
  }
  return variants;
}

exports.searchSJFAgent = onCall({ region: "us-central1", timeoutSeconds: 90 }, async request => {
  await autorizarBuscadorJuridico(request);
  const query = String(request.data?.query || "").trim();
  const filters = request.data?.filters || {};
  if (query.length < 2) throw new HttpsError("invalid-argument", "La búsqueda debe contener al menos 2 caracteres.");
  if (query.length > 250) throw new HttpsError("invalid-argument", "La búsqueda es demasiado larga.");

  const queries = buildAgentQueries(query);
  const collected = new Map();
  const attempts = [];
  const errors = [];
  for (const variant of queries) {
    try {
      const xml = await requestSjfXml(buildSjfSoap(variant, filters));
      const parsed = parseSjfSoap(xml);
      let items = parsed.items;
      if (filters.tipo) {
        const wanted = String(filters.tipo).toLowerCase();
        items = items.filter(x => String(x.tipo || "").toLowerCase().includes(wanted));
      }
      attempts.push({ query: variant, count: items.length, total: parsed.total });
      for (const item of items) {
        const key = String(item.registro || item.url || `${item.rubro}|${item.criterio}`).toLocaleLowerCase("es-MX");
        if (!key || key === "|") continue;
        const scoreText = `${item.rubro || ""} ${item.criterio || ""}`.toLocaleLowerCase("es-MX");
        const terms = query.toLocaleLowerCase("es-MX").split(/\s+/).filter(x => x.length > 2);
        const score = terms.reduce((n, term) => n + (scoreText.includes(term) ? 2 : 0), 0) + (scoreText.includes(query.toLocaleLowerCase("es-MX")) ? 5 : 0);
        const existing = collected.get(key);
        if (!existing || score > existing._agentScore) collected.set(key, { ...item, _agentScore: score, queryUsed: variant, source: "SCJN/SJF oficial" });
      }
    } catch (err) {
      attempts.push({ query: variant, count: 0, error: err?.message || "Error de consulta" });
      errors.push(`${variant}: ${err?.message || "Error de consulta"}`);
    }
    if (collected.size >= 30) break;
  }
  let resultSource = "SCJN/SJF wsResultados";
  // Respaldo de localización: si la conexión SOAP falla, buscar enlaces indexados
  // y aceptar únicamente destinos de dominios oficiales judiciales. Estos enlaces
  // NO se presentan como fichas verificadas ni como texto íntegro de una tesis.
  if (collected.size === 0) {
    const scoped = `${query} (site:sjf2.scjn.gob.mx OR site:sjfsemanal.scjn.gob.mx OR site:scjn.gob.mx)`;
    const searchUrls = [
      { name: "Google", url: `https://www.google.com/search?q=${encodeURIComponent(scoped)}` },
      { name: "DuckDuckGo", url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(scoped)}` },
      { name: "Bing", url: `https://www.bing.com/search?q=${encodeURIComponent(scoped)}` }
    ];
    const htmlResults = await Promise.all(searchUrls.map(async provider => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(provider.url, { headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36" }, signal: controller.signal });
        const html = await response.text();
        if (!response.ok) throw new Error(`${provider.name} HTTP ${response.status}`);
        const found = [];
        const patterns = provider.name === "Google"
          ? /<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<h3\b[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<\/a>/gi
          : provider.name === "DuckDuckGo"
            ? /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
            : /<li class=["']b_algo["'][^>]*>[\s\S]*?<h2[^>]*><a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<p[^>]*>([\s\S]*?)<\/p>)?/gi;
        let m;
        while ((m = patterns.exec(html)) && found.length < 10) {
          let href = decodeHtmlEntities(m[1] || "").trim();
          try {
            const u = new URL(href, provider.name === "Google" ? "https://www.google.com" : provider.name === "DuckDuckGo" ? "https://html.duckduckgo.com" : "https://www.bing.com");
            if (provider.name === "Google" && /(^|\.)google\.com$/i.test(u.hostname)) href = u.searchParams.get("q") || u.searchParams.get("url") || href;
            if (provider.name === "DuckDuckGo" && /(^|\.)duckduckgo\.com$/i.test(u.hostname)) href = u.searchParams.get("uddg") || u.searchParams.get("url") || href;
          } catch (_) {}
          try {
            const u = new URL(href);
            const host = u.hostname.toLowerCase();
            if (!/^https?:$/.test(u.protocol) || !/(^|\.)((sjf2\.scjn\.gob\.mx)|(sjfsemanal\.scjn\.gob\.mx)|(scjn\.gob\.mx))$/.test(host)) continue;
            const title = decodeHtmlEntities(String(m[2] || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
            const snippet = decodeHtmlEntities(String(m[3] || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
            if (title) found.push({ registro: "", rubro: title, criterio: snippet, materia: "", instancia: "", epoca: "", tipo: "Resultado indexado", url: u.href, queryUsed: query, source: "Índice externo; no verificado en el documento oficial", _provider: provider.name });
          } catch (_) {}
        }
        return { provider: provider.name, found };
      } catch (err) {
        return { provider: provider.name, found: [], error: err?.name === "AbortError" ? "tiempo de espera agotado" : (err?.message || "error de consulta") };
      } finally { clearTimeout(timer); }
    }));
    const seen = new Set();
    for (const result of htmlResults) {
      attempts.push({ query, provider: result.provider, count: result.found.length, ...(result.error ? { error: result.error } : {}) });
      if (result.error) errors.push(`${result.provider}: ${result.error}`);
      for (const item of result.found) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        collected.set(item.url, { ...item, _agentScore: 0 });
      }
    }
    if (collected.size) resultSource = "web-indexed-fallback";
  }

  const results = [...collected.values()].sort((a,b) => b._agentScore - a._agentScore).slice(0, 30).map(({_agentScore, ...item}) => item);
  return {
    ok: results.length > 0,
    agent: "LegalTech Control · Agente Jurídico SJF V1.1",
    mode: "reglas deterministas; sin IA de pago",
    query,
    queriesTried: queries,
    attempts,
    results,
    total: results.length,
    source: resultSource,
    message: resultSource === "web-indexed-fallback" ? "Se localizaron enlaces mediante un índice externo. No se pudo confirmar automáticamente el contenido íntegro del SJF; abre cada fuente oficial y valida registro, texto, vigencia y aplicabilidad." : results.length ? "Resultados recuperados del servicio oficial. Verifica el texto íntegro, registro y aplicabilidad antes de citar." : "No se recuperaron resultados automáticos. Esto no demuestra que el criterio no exista; abre el buscador oficial y realiza la consulta manualmente.",
    technical: errors.length ? errors.join("; ") : "",
    officialSearch: "https://sjf2.scjn.gob.mx/busqueda-principal-tesis",
    googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(`${query} (site:sjf2.scjn.gob.mx OR site:sjfsemanal.scjn.gob.mx OR site:scjn.gob.mx)`)}`,
    searchedAt: new Date().toISOString()
  };
});

exports.searchSJFIndexed = onCall({ region: "us-central1", timeoutSeconds: 45 }, async request => {
  await autorizarBuscadorJuridico(request);

  const query = String(request.data?.query || "").trim();
  if (query.length < 2) throw new HttpsError("invalid-argument", "La búsqueda debe contener al menos 2 caracteres.");
  if (query.length > 250) throw new HttpsError("invalid-argument", "La búsqueda es demasiado larga.");

  const scopedQuery = `${query} (site:sjf2.scjn.gob.mx OR site:sjfsemanal.scjn.gob.mx OR site:scjn.gob.mx)`;
  const cleanText = value => decodeHtmlEntities(String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")).trim();

  function normalizeResult(href, title, snippet, provider) {
    let url = decodeHtmlEntities(href || "").trim();
    try {
      const parsed = new URL(url, "https://html.duckduckgo.com");
      const redirect = parsed.searchParams.get("uddg") || parsed.searchParams.get("url");
      if (redirect) url = redirect;
    } catch (_) {}
    if (!/^https?:\/\//i.test(url)) return null;
    let host = "";
    try { host = new URL(url).hostname.toLowerCase(); } catch (_) { return null; }
    // This tool is a locator for official judicial sources, not a general web search.
    if (!/(^|\.)((sjf2\.scjn\.gob\.mx)|(sjfsemanal\.scjn\.gob\.mx)|(scjn\.gob\.mx))$/i.test(host)) return null;
    const cleanTitle = cleanText(title).slice(0, 500);
    if (!cleanTitle) return null;
    return { title: cleanTitle, snippet: cleanText(snippet).slice(0, 1200), url, domain: host, source: provider, verified: false };
  }

  function parseDuckDuckGo(html) {
    const out = [];
    // DDG markup varies: extract result anchors first, then use the surrounding result block for snippets.
    const anchorRe = /<a\b(?=[^>]*\bclass=["'][^"']*\bresult__a\b[^"']*["'])[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = anchorRe.exec(html)) && out.length < 12) {
      const tag = match[0];
      const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1] || "";
      const title = match[1];
      const before = html.slice(Math.max(0, match.index - 5000), match.index);
      const blockStart = Math.max(before.lastIndexOf('class="result '), before.lastIndexOf("class='result "), before.lastIndexOf('class="web-result'), before.lastIndexOf("class='web-result"));
      const block = blockStart >= 0 ? html.slice(Math.max(0, match.index - (before.length - blockStart)), Math.min(html.length, match.index + 5000)) : html.slice(match.index, match.index + 5000);
      const snip = (block.match(/<a\b[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)
        || block.match(/<td\b[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)
        || [])[1] || "";
      const item = normalizeResult(href, title, snip, "DuckDuckGo indexado");
      if (item && !out.some(x => x.url === item.url)) out.push(item);
    }
    return out;
  }

  function parseBing(html) {
    const out = [];
    const blockRe = /<li\b[^>]*class=["'][^"']*\bb_algo\b[^"']*["'][^>]*>[\s\S]*?<\/li>/gi;
    let blockMatch;
    while ((blockMatch = blockRe.exec(html)) && out.length < 12) {
      const block = blockMatch[0];
      const link = block.match(/<h2\b[^>]*>\s*<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i)
        || block.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*tilk[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
      if (!link) continue;
      const snip = (block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "";
      const item = normalizeResult(link[1], link[2], snip, "Bing indexado");
      if (item && !out.some(x => x.url === item.url)) out.push(item);
    }
    return out;
  }

  function parseGoogle(html) {
    const out = [];
    // Google cambia con frecuencia el marcado. Se extraen enlaces que contienen un encabezado h3,
    // y se filtran después por dominio oficial en normalizeResult.
    const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<h3\b[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<\/a>/gi;
    let match;
    while ((match = anchorRe.exec(html)) && out.length < 12) {
      let href = decodeHtmlEntities(match[1] || "");
      try {
        const parsed = new URL(href, "https://www.google.com");
        if (parsed.hostname.endsWith("google.com") && parsed.pathname === "/url") {
          href = parsed.searchParams.get("q") || parsed.searchParams.get("url") || href;
        } else if (href.startsWith("/url?")) {
          href = parsed.searchParams.get("q") || parsed.searchParams.get("url") || href;
        }
      } catch (_) {}
      const item = normalizeResult(href, match[2], "", "Google indexado");
      if (item && !out.some(x => x.url === item.url)) out.push(item);
    }
    return out;
  }

  const googleQuery = `${query} (site:sjf2.scjn.gob.mx OR site:sjfsemanal.scjn.gob.mx OR site:scjn.gob.mx)`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
  const officialSearchUrl = `https://sjf2.scjn.gob.mx/busqueda-principal-tesis`;
  const providers = [
    { name: "Google", url: googleSearchUrl, parse: parseGoogle },
    { name: "DuckDuckGo", url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(scopedQuery)}`, parse: parseDuckDuckGo },
    { name: "Bing", url: `https://www.bing.com/search?q=${encodeURIComponent(scopedQuery)}`, parse: parseBing }
  ];
  const errors = [];
  for (const provider of providers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(provider.url, {
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
        },
        signal: controller.signal
      });
      const html = await response.text();
      if (!response.ok) throw new Error(`${provider.name} respondió HTTP ${response.status}`);
      const results = provider.parse(html);
      if (results.length) return { ok: true, source: "web-indexed", provider: provider.name, results: results.slice(0, 8), query, googleSearchUrl, officialSearchUrl, searchedAt: new Date().toISOString() };
      errors.push(`${provider.name}: respuesta sin resultados oficiales parseables`);
    } catch (err) {
      errors.push(`${provider.name}: ${err?.name === "AbortError" ? "tiempo de espera agotado" : (err?.message || "error de consulta")}`);
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    ok: false,
    source: "web-indexed",
    results: [],
    query,
    message: "Los buscadores no entregaron resultados oficiales que pudieran extraerse automáticamente. Puedes continuar con Google restringido a dominios judiciales o con el buscador oficial del SJF.",
    technical: errors.join("; "),
    googleSearchUrl,
    officialSearchUrl,
    searchedAt: new Date().toISOString()
  };
});

// Proxy de solo lectura para PDFs normativos oficiales permitidos. Evita bloqueos CORS del navegador.
const NORMATIVE_PDFS = {
  CNPCF: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CNPCF.pdf",
  CCF: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CCF.pdf",
  Comercio: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CCom.pdf",
  LFT: "https://www.diputados.gob.mx/LeyesBiblio/pdf_mov/Ley_Federal_del_Trabajo.pdf",
  Amparo: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LAmp.pdf",
  Constitucion: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf",
  CNPP: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CNPP.pdf",
  LGRA: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LGRA.pdf",
  CPCEJ: "https://congresoweb.congresojal.gob.mx/bibliotecavirtual/legislacion/C%C3%B3digos/Documentos_PDF-C%C3%B3digos/C%C3%B3digo%20de%20Procedimientos%20Civiles%20del%20Estado%20de%20Jalisco-130324.pdf",
  CCEJ: "https://congresoweb.congresojal.gob.mx/BibliotecaVirtual/legislacion/C%C3%B3digos/Documentos_PDF-C%C3%B3digos/C%C3%B3digo%20Civil%20del%20Estado%20de%20Jalisco-240626.pdf"
};
exports.getNormativePdf = onRequest({ cors: true, timeoutSeconds: 120, memory: "1GiB" }, async (req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });
  const key = String(req.query.key || "");
  const url = NORMATIVE_PDFS[key];
  if (!url) return res.status(400).json({ error: "Ordenamiento no autorizado para descarga automática" });
  try {
    const response = await fetch(url, { headers: { Accept: "application/pdf" }, signal: AbortSignal.timeout(90000) });
    if (!response.ok) return res.status(502).json({ error: `La fuente oficial respondió HTTP ${response.status}` });
    const type = response.headers.get("content-type") || "";
    if (!type.toLowerCase().includes("pdf")) return res.status(502).json({ error: "La fuente no devolvió un PDF" });
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 10000 || bytes.length > 9 * 1024 * 1024) return res.status(502).json({ error: "Tamaño de PDF fuera del rango esperado" });
    res.set("Content-Type", "application/pdf");
    res.set("X-Normative-Source", url);
    return res.status(200).send(bytes);
  } catch (err) {
    return res.status(502).json({ error: "No fue posible recuperar la fuente oficial", detail: String(err.message || err) });
  }
});



