/** Configuración básica del despacho y preferencias de interfaz. */
(function () {
    "use strict";
    const CLAVE = "js_legal_configuracion";
    const defaults = {
        despachoNombre: "",
        responsable: "",
        telefono: "",
        correo: "",
        agendaVista: "lista",
        alertaDias: 3,
        formatoFecha: "dd/mm/aaaa",
        sistemaNombre: "JS LegalTech Control",
        menuModo: "normal"
    };

    function leer() {
        try { return { ...defaults, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; }
        catch (_) { return { ...defaults }; }
    }
    function valor(id) { return document.getElementById(id)?.value ?? ""; }
    function poner(id, value) { const el=document.getElementById(id); if(el) el.value=value ?? ""; }

    function aplicar(cfg) {
        document.body.classList.toggle("menu-compacto", cfg.menuModo === "compacto");
        const brand = document.querySelector(".sidebar-brand-copy strong");
        if (brand) brand.textContent = cfg.sistemaNombre || defaults.sistemaNombre;
    }

    window.cargarConfiguracionSistema = function () {
        const cfg=leer();
        poner("cfg-despacho-nombre",cfg.despachoNombre); poner("cfg-responsable",cfg.responsable);
        poner("cfg-telefono",cfg.telefono); poner("cfg-correo",cfg.correo);
        poner("cfg-agenda-vista",cfg.agendaVista); poner("cfg-alerta-dias",cfg.alertaDias);
        poner("cfg-formato-fecha",cfg.formatoFecha); poner("cfg-sistema-nombre",cfg.sistemaNombre);
        poner("cfg-menu-modo",cfg.menuModo); aplicar(cfg);
    };

    window.guardarConfiguracionSistema = function () {
        const cfg={
            despachoNombre:valor("cfg-despacho-nombre").trim(), responsable:valor("cfg-responsable").trim(),
            telefono:valor("cfg-telefono").trim(), correo:valor("cfg-correo").trim(),
            agendaVista:valor("cfg-agenda-vista") || "lista", alertaDias:Number(valor("cfg-alerta-dias")||3),
            formatoFecha:valor("cfg-formato-fecha") || "dd/mm/aaaa", sistemaNombre:valor("cfg-sistema-nombre").trim() || defaults.sistemaNombre,
            menuModo:valor("cfg-menu-modo") || "normal"
        };
        localStorage.setItem(CLAVE,JSON.stringify(cfg)); aplicar(cfg);
        const estado=document.getElementById("cfg-estado"); if(estado){estado.textContent="✓ Configuración guardada correctamente."; setTimeout(()=>estado.textContent="",3000);}
    };

    window.cambiarVistaAgenda = function (vista) {
        const destino=vista === "calendario" ? "calendario" : "agenda";
        switchTab(destino);
    };
    window.abrirVistaAgendaPreferida = function () {
        const cfg=leer(); window.cambiarVistaAgenda(cfg.agendaVista);
    };

    document.addEventListener("DOMContentLoaded",()=>aplicar(leer()));
})();
