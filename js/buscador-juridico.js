/**
 * JS LegalTech Control 3.1.1
 * Buscador Jurídico en fuentes oficiales, sin inteligencia artificial.
 */
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const CLAVE_HISTORIAL = "js_legal_historial_busquedas_juridicas";

  const FUENTES = {
    jurisprudencia: {
      titulo: "Tesis y jurisprudencia",
      descripcion: "Semanario Judicial de la Federación de la Suprema Corte de Justicia de la Nación.",
      icono: "⚖️",
      url: "https://sjf2.scjn.gob.mx/busqueda-principal-tesis"
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
      url: "https://congresoweb.congresojal.gob.mx/BibliotecaVirtual/"
    },
    federal: {
      titulo: "Legislación federal",
      descripcion: "Leyes federales vigentes publicadas por la Cámara de Diputados.",
      icono: "📚",
      url: "https://www.diputados.gob.mx/LeyesBiblio/"
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
      descripcion: "Organiza la consulta y muestra accesos a todas las fuentes oficiales.",
      icono: "🔎",
      url: ""
    }
  };

  let fuenteActual = "jurisprudencia";

  function consultaOriginal() {
    return ($("bj-consulta")?.value || "").trim();
  }

  function consultaPreparada() {
    const consulta = consultaOriginal();
    const materia = ($("bj-materia")?.value || "").trim();
    const tipo = ($("bj-tipo-documento")?.value || "").trim();
    return [consulta, materia && `materia ${materia}`, tipo].filter(Boolean).join(" ");
  }

  function consultaValida(consulta) {
    return consulta.length >= 4;
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

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (_) {
      const auxiliar = document.createElement("textarea");
      auxiliar.value = texto;
      auxiliar.style.position = "fixed";
      auxiliar.style.opacity = "0";
      document.body.appendChild(auxiliar);
      auxiliar.select();
      const resultado = document.execCommand("copy");
      auxiliar.remove();
      return resultado;
    }
  }

  function leerHistorial() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL) || "[]");
      return Array.isArray(datos) ? datos : [];
    } catch (_) {
      return [];
    }
  }

  function guardarEnHistorial(consulta) {
    const actual = leerHistorial().filter(item => item.consulta !== consulta);
    actual.unshift({ consulta, fuente: fuenteActual, fecha: new Date().toISOString() });
    localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(actual.slice(0, 8)));
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
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "bj-historial-item";
      boton.textContent = item.consulta;
      boton.title = "Volver a usar esta consulta";
      boton.addEventListener("click", () => {
        $("bj-consulta").value = item.consulta;
        $("bj-consulta").focus();
      });
      contenedor.appendChild(boton);
    });
  }

  function activarTab(nombre) {
    if (!FUENTES[nombre]) return;
    fuenteActual = nombre;
    document.querySelectorAll(".bj-tab").forEach(boton => {
      boton.classList.toggle("activa", boton.dataset.bjTab === nombre);
      boton.setAttribute("aria-selected", boton.dataset.bjTab === nombre ? "true" : "false");
    });
    const fuente = FUENTES[nombre];
    $("bj-fuente-icono").textContent = fuente.icono;
    $("bj-fuente-titulo").textContent = fuente.titulo;
    $("bj-fuente-descripcion").textContent = fuente.descripcion;
    $("bj-btn-buscar").textContent = nombre === "integral"
      ? "🔎 Preparar búsqueda integral"
      : "🔎 Abrir fuente oficial";
    $("bj-enlaces-integrales").hidden = true;
    ocultarEstado();
  }

  function renderizarFuentesIntegrales() {
    const contenedor = $("bj-enlaces-integrales");
    contenedor.innerHTML = "";
    Object.entries(FUENTES)
      .filter(([clave]) => clave !== "integral")
      .forEach(([clave, fuente]) => {
        const enlace = document.createElement("a");
        enlace.className = "bj-fuente-card";
        enlace.href = fuente.url;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.dataset.fuente = clave;
        enlace.innerHTML = `<span>${fuente.icono}</span><div><strong>${fuente.titulo}</strong><small>${fuente.descripcion}</small></div><b>↗</b>`;
        contenedor.appendChild(enlace);
      });
    contenedor.hidden = false;
  }

  async function buscar() {
    const consulta = consultaPreparada();
    if (!consultaValida(consultaOriginal())) {
      mostrarEstado("Escribe una consulta jurídica de al menos cuatro caracteres.", true);
      $("bj-consulta")?.focus();
      return;
    }

    guardarEnHistorial(consultaOriginal());
    const copiada = await copiar(consulta);

    if (fuenteActual === "integral") {
      renderizarFuentesIntegrales();
      mostrarEstado(copiada
        ? "Consulta preparada y copiada. Abre las fuentes que necesites y pégala en cada buscador oficial."
        : "Consulta preparada. Abre las fuentes que necesites y copia manualmente el texto.");
      return;
    }

    const fuente = FUENTES[fuenteActual];
    const ventana = window.open(fuente.url, "_blank", "noopener,noreferrer");
    if (!ventana) {
      mostrarEstado("El navegador bloqueó la pestaña. Permite las ventanas emergentes o utiliza el enlace mostrado abajo.", true);
      renderizarFuentesIntegrales();
      return;
    }
    mostrarEstado(copiada
      ? `Se abrió ${fuente.titulo}. La consulta quedó copiada para pegarla en el portal oficial.`
      : `Se abrió ${fuente.titulo}. Copia la consulta manualmente en el portal oficial.`);
  }

  function limpiar() {
    $("bj-consulta").value = "";
    $("bj-materia").value = "";
    $("bj-tipo-documento").value = "";
    $("bj-enlaces-integrales").hidden = true;
    ocultarEstado();
    $("bj-consulta").focus();
  }

  function borrarHistorial() {
    localStorage.removeItem(CLAVE_HISTORIAL);
    renderizarHistorial();
    mostrarEstado("Historial de búsquedas eliminado.");
  }

  function iniciar() {
    document.querySelectorAll(".bj-tab").forEach(boton => {
      boton.addEventListener("click", () => activarTab(boton.dataset.bjTab));
    });
    $("bj-btn-buscar")?.addEventListener("click", buscar);
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
