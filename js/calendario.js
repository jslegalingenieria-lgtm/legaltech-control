/**
 * JS LegalTech Control — Calendario Jurídico Profesional
 * Lee la agenda existente; no crea una segunda fuente de datos.
 */
(() => {
    "use strict";

    let fechaVisible = new Date();
    fechaVisible = new Date(fechaVisible.getFullYear(), fechaVisible.getMonth(), 1);
    let filtroTipo = "todos";

    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const diasSemana = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

    function obtenerEventos() {
        const lista = typeof window.obtenerAgenda === "function"
            ? window.obtenerAgenda()
            : JSON.parse(localStorage.getItem("js_legal_agenda") || "[]");
        return Array.isArray(lista) ? lista : [];
    }

    function obtenerAsuntos() {
        const lista = typeof window.obtenerAsuntos === "function"
            ? window.obtenerAsuntos()
            : JSON.parse(localStorage.getItem("js_legal_asuntos") || "[]");
        return Array.isArray(lista) ? lista : [];
    }

    function clasificarTipo(tipo = "") {
        const texto = String(tipo).toLowerCase();
        if (texto.includes("audiencia")) return "audiencia";
        if (texto.includes("término") || texto.includes("termino") || texto.includes("vencimiento")) return "termino";
        if (texto.includes("reunión") || texto.includes("reunion") || texto.includes("cliente")) return "reunion";
        return "otro";
    }

    function parseFechaLocal(valor) {
        if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
        const [y,m,d] = valor.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    function claveFecha(fecha) {
        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2,"0");
        const d = String(fecha.getDate()).padStart(2,"0");
        return `${y}-${m}-${d}`;
    }

    function escapar(valor) {
        return String(valor ?? "")
            .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }

    function contextoEvento(evento) {
        const asunto = obtenerAsuntos().find(a => String(a.id) === String(evento.asuntoId));
        return {
            asunto,
            expediente: asunto?.expediente || "Sin expediente",
            cliente: asunto?.cliente || "Sin cliente asignado",
            juzgado: asunto?.juzgado || "Sin juzgado registrado",
            materia: asunto?.materia || asunto?.accion || "Sin materia registrada"
        };
    }

    function eventosDelMes() {
        const y = fechaVisible.getFullYear();
        const m = fechaVisible.getMonth();
        return obtenerEventos().filter(e => {
            const fecha = parseFechaLocal(e.fecha);
            if (!fecha || fecha.getFullYear() !== y || fecha.getMonth() !== m) return false;
            return filtroTipo === "todos" || clasificarTipo(e.tipo) === filtroTipo;
        }).sort((a,b) => `${a.fecha}T${a.hora || "00:00"}`.localeCompare(`${b.fecha}T${b.hora || "00:00"}`));
    }

    function actualizarResumen(eventos) {
        const contar = tipo => eventos.filter(e => clasificarTipo(e.tipo) === tipo).length;
        const asignar = (id, valor) => { const el = document.getElementById(id); if (el) el.textContent = valor; };
        asignar("cal-total", eventos.length);
        asignar("cal-audiencias", contar("audiencia"));
        asignar("cal-terminos", contar("termino"));
        asignar("cal-otros", contar("reunion") + contar("otro"));
    }

    function renderizarCalendario() {
        const grid = document.getElementById("calendario-grid");
        const titulo = document.getElementById("calendario-mes-titulo");
        if (!grid || !titulo) return;

        titulo.textContent = `${meses[fechaVisible.getMonth()]} ${fechaVisible.getFullYear()}`;
        const eventos = eventosDelMes();
        actualizarResumen(eventos);

        const porFecha = eventos.reduce((acc, e) => {
            (acc[e.fecha] ||= []).push(e);
            return acc;
        }, {});

        const primerDia = new Date(fechaVisible.getFullYear(), fechaVisible.getMonth(), 1);
        const ultimoDia = new Date(fechaVisible.getFullYear(), fechaVisible.getMonth() + 1, 0);
        const desplazamientoLunes = (primerDia.getDay() + 6) % 7;
        const inicio = new Date(primerDia);
        inicio.setDate(primerDia.getDate() - desplazamientoLunes);
        const hoy = claveFecha(new Date());

        let html = diasSemana.map(d => `<div class="calendario-dia-semana">${d}</div>`).join("");
        for (let i = 0; i < 42; i++) {
            const dia = new Date(inicio);
            dia.setDate(inicio.getDate() + i);
            const clave = claveFecha(dia);
            const lista = porFecha[clave] || [];
            const fuera = dia.getMonth() !== fechaVisible.getMonth();
            const clases = ["calendario-celda", fuera ? "fuera-mes" : "", clave === hoy ? "hoy" : ""].filter(Boolean).join(" ");
            const visibles = lista.slice(0,3);
            html += `<div class="${clases}" data-fecha="${clave}">
                <div class="calendario-numero"><span>${dia.getDate()}</span>${lista.length ? `<span class="calendario-contador">${lista.length}</span>` : ""}</div>
                ${visibles.map(e => {
                    const c = contextoEvento(e);
                    const tipoClase = clasificarTipo(e.tipo);
                    const texto = `${e.hora || ""} ${e.tipo || "Evento"} · ${c.expediente}`.trim();
                    return `<button type="button" class="calendario-evento ${tipoClase}" data-evento-id="${escapar(e.id)}" title="${escapar(texto)}">${escapar(texto)}</button>`;
                }).join("")}
                ${lista.length > 3 ? `<button type="button" class="calendario-evento otro calendario-ver-dia" data-fecha="${clave}">+${lista.length - 3} más</button>` : ""}
            </div>`;
        }
        grid.innerHTML = html;

        grid.querySelectorAll("[data-evento-id]").forEach(btn => btn.addEventListener("click", () => abrirDetalleEvento(btn.dataset.eventoId)));
        grid.querySelectorAll(".calendario-ver-dia").forEach(btn => btn.addEventListener("click", () => abrirEventosDia(btn.dataset.fecha)));
    }

    function abrirDetalleEvento(id) {
        const evento = obtenerEventos().find(e => String(e.id) === String(id));
        if (!evento) return;
        const c = contextoEvento(evento);
        const modal = document.getElementById("calendario-modal");
        const cuerpo = document.getElementById("calendario-modal-cuerpo");
        const abrir = document.getElementById("calendario-abrir-expediente");
        if (!modal || !cuerpo) return;
        cuerpo.innerHTML = `<dl class="calendario-detalle">
            <dt>Tipo</dt><dd>${escapar(evento.tipo || "Evento")}</dd>
            <dt>Fecha y hora</dt><dd>${escapar(evento.fecha || "Sin fecha")} ${escapar(evento.hora || "")}</dd>
            <dt>Expediente</dt><dd>${escapar(c.expediente)}</dd>
            <dt>Cliente</dt><dd>${escapar(c.cliente)}</dd>
            <dt>Materia</dt><dd>${escapar(c.materia)}</dd>
            <dt>Juzgado</dt><dd>${escapar(c.juzgado)}</dd>
            <dt>Responsable</dt><dd>${escapar(evento.abogadoAsignado || "Sin asignar")}</dd>
            <dt>Descripción</dt><dd>${escapar(evento.notas || "Sin notas")}</dd>
        </dl>`;
        if (abrir) {
            abrir.style.display = c.asunto ? "inline-block" : "none";
            abrir.dataset.asuntoId = c.asunto?.id || "";
        }
        modal.classList.add("abierto");
    }

    function abrirEventosDia(fecha) {
        const lista = obtenerEventos().filter(e => e.fecha === fecha && (filtroTipo === "todos" || clasificarTipo(e.tipo) === filtroTipo));
        const modal = document.getElementById("calendario-modal");
        const cuerpo = document.getElementById("calendario-modal-cuerpo");
        const abrir = document.getElementById("calendario-abrir-expediente");
        if (!modal || !cuerpo) return;
        cuerpo.innerHTML = `<h4 style="margin:.1rem 0 1rem;color:#0f172a">Eventos del ${escapar(fecha)}</h4>` + (lista.length ? lista.map(e => {
            const c = contextoEvento(e);
            return `<button type="button" class="calendario-evento ${clasificarTipo(e.tipo)} calendario-evento-dia" data-evento-id="${escapar(e.id)}" style="padding:.7rem;margin:.45rem 0">${escapar(e.hora || "")} ${escapar(e.tipo || "Evento")} · ${escapar(c.expediente)} · ${escapar(c.cliente)}</button>`;
        }).join("") : `<p class="calendario-vacio">No hay eventos para esta fecha.</p>`);
        if (abrir) abrir.style.display = "none";
        modal.classList.add("abierto");
        cuerpo.querySelectorAll(".calendario-evento-dia").forEach(btn => btn.addEventListener("click", () => abrirDetalleEvento(btn.dataset.eventoId)));
    }

    function cerrarModal() {
        document.getElementById("calendario-modal")?.classList.remove("abierto");
    }

    function abrirExpediente() {
        const id = document.getElementById("calendario-abrir-expediente")?.dataset.asuntoId;
        cerrarModal();
        if (!id) return;
        if (typeof window.abrirExpedienteAgenda === "function") {
            window.abrirExpedienteAgenda(id);
        } else if (typeof window.switchTab === "function") {
            window.switchTab("asuntos");
        }
    }


    async function agendarEventoDesdeCalendario() {
        // El formulario de agenda vive dentro de la vista Agenda.
        // Primero cambiamos de pantalla y después abrimos el modal.
        if (typeof window.switchTab === "function") {
            window.switchTab("agenda");
        } else if (typeof switchTab === "function") {
            switchTab("agenda");
        }

        // Esperar un ciclo de renderizado asegura que la vista Agenda ya sea visible.
        await new Promise(resolve => requestAnimationFrame(() => resolve()));

        if (typeof window.abrirModalAgenda === "function") {
            await window.abrirModalAgenda();
        } else {
            console.error("No se encontró la función abrirModalAgenda().");
            alert("No fue posible abrir el formulario de agenda.");
        }
    }

    function irMes(delta) {
        fechaVisible = new Date(fechaVisible.getFullYear(), fechaVisible.getMonth() + delta, 1);
        renderizarCalendario();
    }

    function irHoy() {
        const hoy = new Date();
        fechaVisible = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        renderizarCalendario();
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("cal-anterior")?.addEventListener("click", () => irMes(-1));
        document.getElementById("cal-siguiente")?.addEventListener("click", () => irMes(1));
        document.getElementById("cal-hoy")?.addEventListener("click", irHoy);
        document.getElementById("cal-filtro-tipo")?.addEventListener("change", e => { filtroTipo = e.target.value; renderizarCalendario(); });
        document.getElementById("calendario-modal-cerrar")?.addEventListener("click", cerrarModal);
        document.getElementById("calendario-modal")?.addEventListener("click", e => { if (e.target.id === "calendario-modal") cerrarModal(); });
        document.getElementById("calendario-abrir-expediente")?.addEventListener("click", abrirExpediente);
        window.addEventListener("agendaActualizada", renderizarCalendario);
        window.addEventListener("asuntosActualizados", renderizarCalendario);
        renderizarCalendario();
    });

    window.renderizarCalendarioJuridico = renderizarCalendario;
    window.agendarEventoDesdeCalendario = agendarEventoDesdeCalendario;
})();
