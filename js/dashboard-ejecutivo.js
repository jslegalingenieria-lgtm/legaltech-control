/**
 * JS LegalTech Control — Dashboard Ejecutivo 3.0
 * Firestore en tiempo real.
 */
(() => {
    "use strict";

    const estado = {
        clientes: [],
        asuntos: [],
        agenda: [],
        personal: [],
        alertas: [],
        usuario: null,
        listeners: [],
        charts: {},
        periodo: { desde: null, hasta: null }
    };

    function obtenerDB() {
        if (!window.db) {
            throw new Error("Firestore no está disponible.");
        }
        return window.db;
    }

    function fechaLocalISO(fecha = new Date()) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");
        return `${anio}-${mes}-${dia}`;
    }

    function periodoMesActual() {
        const ahora = new Date();
        return {
            desde: new Date(ahora.getFullYear(), ahora.getMonth(), 1),
            hasta: new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999)
        };
    }

    function establecerPeriodo(desde, hasta) {
        const inicio = inicioDia(desde);
        const fin = new Date(hasta);
        fin.setHours(23, 59, 59, 999);
        estado.periodo = { desde: inicio, hasta: fin };
    }

    function fechaDentroDelPeriodo(fecha) {
        if (!fecha || !estado.periodo.desde || !estado.periodo.hasta) return false;
        return fecha >= estado.periodo.desde && fecha <= estado.periodo.hasta;
    }

    function formatearPeriodo() {
        if (!estado.periodo.desde || !estado.periodo.hasta) return "Mes actual";
        const formato = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" });
        return `${formato.format(estado.periodo.desde)} al ${formato.format(estado.periodo.hasta)}`;
    }

    function sincronizarControlesPeriodo() {
        const desde = document.getElementById("dashboard-fecha-desde");
        const hasta = document.getElementById("dashboard-fecha-hasta");
        if (desde) desde.value = fechaLocalISO(estado.periodo.desde);
        if (hasta) hasta.value = fechaLocalISO(estado.periodo.hasta);
        establecerTexto("dashboard-periodo-texto", formatearPeriodo());
    }

    function convertirFecha(valor) {
        if (!valor) return null;
        if (typeof valor.toDate === "function") return valor.toDate();

        const fecha = new Date(valor);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    function fechaEvento(evento) {
        if (!evento?.fecha) return null;
        const fecha = new Date(`${evento.fecha}T${evento.hora || "00:00"}`);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    function normalizar(valor) {
        return String(valor || "").trim().toLowerCase();
    }

    function filtrarPorUsuario(datos, tipo) {
        const usuario = estado.usuario;
        if (!usuario || usuario.rol === "Administrador") return datos;

        if (usuario.rol === "Cliente") {
            if (tipo === "clientes") {
                return datos.filter(item => String(item.id) === String(usuario.id));
            }

            return datos.filter(item =>
                String(item.clienteId || "") === String(usuario.id) ||
                normalizar(item.cliente) === normalizar(usuario.nombre)
            );
        }

        if (usuario.rol === "Abogado") {
            return datos.filter(item => {
                const asignado =
                    item.abogadoAsignado ||
                    item.abogado ||
                    item.usuarioAbogado ||
                    "";

                return (
                    normalizar(asignado) === normalizar(usuario.usuario) ||
                    normalizar(asignado) === normalizar(usuario.nombre) ||
                    String(item.abogadoId || "") === String(usuario.id)
                );
            });
        }

        return datos;
    }

    function actualizarFechaSuperior() {
        const elemento = document.querySelector(".date-display");
        if (!elemento) return;

        elemento.textContent = `📅 ${new Intl.DateTimeFormat("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(new Date())}`;
    }

    function actualizarSaludo() {
        const saludo = document.getElementById("dashboard-saludo");
        const subtitulo = document.getElementById("dashboard-subtitulo");
        if (!saludo) return;

        const hora = new Date().getHours();
        const periodo =
            hora < 12 ? "Buenos días" :
            hora < 19 ? "Buenas tardes" :
            "Buenas noches";

        const nombre = estado.usuario?.nombre?.split(" ")[0] || "";
        saludo.textContent = `${periodo}${nombre ? `, ${nombre}` : ""}`;

        if (subtitulo && estado.usuario) {
            subtitulo.textContent =
                `Vista ${estado.usuario.rol.toLowerCase()} actualizada en tiempo real.`;
        }
    }

    function establecerTexto(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    }

    function fechaAsunto(asunto) {
        return convertirFecha(
            asunto.fechaRegistro ||
            asunto.creadoEn ||
            asunto.fechaCreacion ||
            asunto.fechaInicio ||
            asunto.fecha
        );
    }

    function datosVisibles() {
        return {
            clientes: filtrarPorUsuario(estado.clientes, "clientes"),
            asuntos: filtrarPorUsuario(estado.asuntos, "asuntos"),
            agenda: filtrarPorUsuario(estado.agenda, "agenda")
        };
    }

    function datosDelPeriodo() {
        const visibles = datosVisibles();
        return {
            clientes: visibles.clientes,
            asuntos: visibles.asuntos.filter(asunto => fechaDentroDelPeriodo(fechaAsunto(asunto))),
            agenda: visibles.agenda.filter(evento => fechaDentroDelPeriodo(fechaEvento(evento)))
        };
    }

    function esAsuntoActivo(asunto) {
        const estadoAsunto = normalizar(asunto.estado);
        return !["concluido", "archivado", "cerrado"].includes(estadoAsunto);
    }

    function actualizarMetricas() {
        const visibles = datosVisibles();
        const datos = datosDelPeriodo();
        const asuntosActivos = datos.asuntos.filter(esAsuntoActivo);
        const audienciasPeriodo = datos.agenda.filter(
            evento => normalizar(evento.tipo) === "audiencia"
        );

        establecerTexto("count-clientes", visibles.clientes.length);
        establecerTexto("count-asuntos", asuntosActivos.length);
        establecerTexto("count-audiencias", datos.agenda.length);
        establecerTexto("count-eventos-hoy", audienciasPeriodo.length);

        establecerTexto("metric-clientes-detalle", "Total registrados");
        establecerTexto("metric-asuntos-detalle", `${datos.asuntos.length} expediente(s) iniciado(s) en el periodo`);
        establecerTexto("metric-agenda-detalle", `${datos.agenda.length} evento(s) programado(s)`);
        establecerTexto("metric-hoy-detalle", `${audienciasPeriodo.length} audiencia(s)`);
    }
    function crearGrafica(idCanvas, tipo, etiquetas, valores, etiqueta) {
        const canvas = document.getElementById(idCanvas);
        if (!canvas || !window.Chart) return;

        if (estado.charts[idCanvas]) {
            estado.charts[idCanvas].destroy();
        }

        estado.charts[idCanvas] = new Chart(canvas, {
            type: tipo,
            data: {
                labels: etiquetas,
                datasets: [{
                    label: etiqueta,
                    data: valores,
                    backgroundColor: [
                        "rgba(37, 99, 235, .78)",
                        "rgba(14, 165, 233, .78)",
                        "rgba(16, 185, 129, .78)",
                        "rgba(245, 158, 11, .78)",
                        "rgba(139, 92, 246, .78)",
                        "rgba(239, 68, 68, .78)"
                    ],
                    borderColor: "#ffffff",
                    borderWidth: tipo === "doughnut" ? 2 : 0,
                    borderRadius: tipo === "bar" ? 7 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: tipo === "doughnut",
                        position: "bottom"
                    }
                },
                scales: tipo === "bar" ? {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    },
                    x: {
                        grid: { display: false }
                    }
                } : {}
            }
        });
    }

    function agrupar(lista, obtenerClave) {
        return lista.reduce((acumulado, elemento) => {
            const clave = obtenerClave(elemento) || "Sin especificar";
            acumulado[clave] = (acumulado[clave] || 0) + 1;
            return acumulado;
        }, {});
    }

    function actualizarGraficas() {
        const { asuntos } = datosDelPeriodo();

        const porMateria = agrupar(asuntos, asunto => asunto.materia);
        crearGrafica(
            "grafica-asuntos-materia",
            "bar",
            Object.keys(porMateria),
            Object.values(porMateria),
            "Asuntos"
        );

        const porEstado = agrupar(asuntos, asunto => asunto.estado);
        crearGrafica(
            "grafica-asuntos-estado",
            "doughnut",
            Object.keys(porEstado),
            Object.values(porEstado),
            "Expedientes"
        );

        const porAbogado = agrupar(
            asuntos,
            asunto => asunto.abogadoAsignado || asunto.abogado || "Sin asignar"
        );

        crearGrafica(
            "grafica-carga-abogados",
            "bar",
            Object.keys(porAbogado),
            Object.values(porAbogado),
            "Asuntos asignados"
        );

        const panelCarga = document.getElementById("panel-carga-abogados");
        if (panelCarga && estado.usuario?.rol !== "Administrador") {
            panelCarga.style.display = "none";
        }
    }

    function escapeHTML(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function renderizarProximosEventos() {
        const contenedor = document.getElementById("dashboard-proximos-eventos");
        if (!contenedor) return;

        const eventos = datosDelPeriodo().agenda
            .map(evento => ({ ...evento, fechaObjeto: fechaEvento(evento) }))
            .filter(evento => evento.fechaObjeto)
            .sort((a, b) => a.fechaObjeto - b.fechaObjeto)
            .slice(0, 5);

        if (!eventos.length) {
            contenedor.innerHTML =
                '<p class="dashboard-empty">No hay eventos en el periodo seleccionado.</p>';
            return;
        }

        contenedor.innerHTML = eventos.map(evento => {
            const fecha = evento.fechaObjeto;
            const fechaCorta = new Intl.DateTimeFormat("es-MX", {
                day: "2-digit",
                month: "short"
            }).format(fecha);

            return `
                <div class="dashboard-list-item">
                    <div class="dashboard-list-date">
                        ${escapeHTML(fechaCorta)}
                    </div>
                    <div class="dashboard-list-content">
                        <strong>${escapeHTML(evento.tipo || "Evento")}</strong>
                        <span>${escapeHTML(evento.expediente || evento.asunto || "Sin expediente")}</span>
                        <small>${escapeHTML(evento.hora || "")} ${escapeHTML(evento.notas || evento.descripcion || "")}</small>
                    </div>
                </div>
            `;
        }).join("");
    }

    function obtenerActuaciones() {
        const asuntos = datosVisibles().asuntos;
        const actuaciones = [];

        asuntos.forEach(asunto => {
            const lista = Array.isArray(asunto.actuaciones)
                ? asunto.actuaciones
                : [];

            lista.forEach(actuacion => {
                actuaciones.push({
                    ...actuacion,
                    expediente: asunto.expediente,
                    cliente: asunto.cliente,
                    fechaObjeto:
                        convertirFecha(actuacion.fechaRegistro) ||
                        convertirFecha(actuacion.fecha) ||
                        new Date(0)
                });
            });
        });

        return actuaciones
            .filter(actuacion => fechaDentroDelPeriodo(actuacion.fechaObjeto))
            .sort((a, b) => b.fechaObjeto - a.fechaObjeto)
            .slice(0, 5);
    }

    function renderizarActividadReciente() {
        const contenedor = document.getElementById("dashboard-actividad-reciente");
        if (!contenedor) return;

        const actuaciones = obtenerActuaciones();

        if (!actuaciones.length) {
            contenedor.innerHTML =
                '<p class="dashboard-empty">No hay actuaciones en el periodo seleccionado.</p>';
            return;
        }

        contenedor.innerHTML = actuaciones.map(actuacion => {
            const fecha = actuacion.fechaObjeto.getTime()
                ? new Intl.DateTimeFormat("es-MX", {
                    day: "2-digit",
                    month: "short"
                }).format(actuacion.fechaObjeto)
                : "—";

            return `
                <div class="dashboard-list-item">
                    <div class="dashboard-list-date">${escapeHTML(fecha)}</div>
                    <div class="dashboard-list-content">
                        <strong>${escapeHTML(actuacion.expediente || "Expediente")}</strong>
                        <span>${escapeHTML(actuacion.descripcion || actuacion.resumen || "Actuación registrada")}</span>
                        <small>${escapeHTML(actuacion.cliente || "")}</small>
                    </div>
                </div>
            `;
        }).join("");
    }

    function actualizarAsistente() {
        const contenedor = document.getElementById("asistente-mensaje");
        if (!contenedor) return;

        const { asuntos, agenda } = datosDelPeriodo();
        const asuntosActivos = asuntos.filter(esAsuntoActivo);
        const audiencias = agenda.filter(evento => normalizar(evento.tipo) === "audiencia").length;
        const terminos = agenda.filter(evento => {
            const tipo = normalizar(evento.tipo);
            return tipo.includes("término") || tipo.includes("termino");
        }).length;

        contenedor.textContent =
            `Periodo ${formatearPeriodo()}: ${asuntosActivos.length} asunto(s) activo(s), ${agenda.length} evento(s), ${audiencias} audiencia(s) y ${terminos} término(s) en agenda.`;
    }
    function inicioDia(fecha = new Date()) {
        const resultado = new Date(fecha);
        resultado.setHours(0, 0, 0, 0);
        return resultado;
    }

    function obtenerFechaVencimiento(alerta) {
        const valor =
            alerta?.fechaVencimiento ||
            alerta?.fechaLimite ||
            alerta?.fechaTermino ||
            alerta?.fecha;

        const fecha = convertirFecha(valor);
        return fecha ? inicioDia(fecha) : null;
    }

    function alertaPerteneceAlUsuario(alerta) {
        const usuario = estado.usuario;
        if (!usuario || usuario.rol === "Administrador") return true;

        const referenciasUsuario = [
            alerta.usuario,
            alerta.usuarioId,
            alerta.abogado,
            alerta.abogadoId,
            alerta.abogadoAsignado,
            alerta.creadoPor,
            alerta.correoAbogado
        ].map(normalizar);

        const referenciasSesion = [
            usuario.id,
            usuario.uid,
            usuario.usuario,
            usuario.nombre,
            usuario.correo,
            usuario.email
        ].map(normalizar).filter(Boolean);

        return referenciasSesion.some(valor =>
            referenciasUsuario.includes(valor)
        );
    }

    function obtenerTerminosPendientes() {
        return estado.alertas.filter(alerta => {
            const tipo = normalizar(alerta.tipo);
            const estadoAlerta = normalizar(alerta.estado);

            return (
                (tipo === "termino" || tipo === "término") &&
                estadoAlerta !== "cumplido" &&
                estadoAlerta !== "cancelado" &&
                alertaPerteneceAlUsuario(alerta) &&
                fechaDentroDelPeriodo(obtenerFechaVencimiento(alerta))
            );
        });
    }

    function actualizarPanelTerminos() {
        const hoy = inicioDia();
        let vencidos = 0;
        let vencenHoy = 0;
        let dentroPeriodo = 0;

        obtenerTerminosPendientes().forEach(alerta => {
            const fecha = obtenerFechaVencimiento(alerta);
            if (!fecha) return;
            if (fecha < hoy) vencidos += 1;
            else if (fecha.getTime() === hoy.getTime()) vencenHoy += 1;
            else dentroPeriodo += 1;
        });

        establecerTexto("count-terminos-vencidos", vencidos);
        establecerTexto("count-terminos-hoy", vencenHoy);
        establecerTexto("count-terminos-proximos", dentroPeriodo);

        const total = vencidos + vencenHoy + dentroPeriodo;
        establecerTexto(
            "resumen-terminos-dashboard",
            total
                ? `${total} término(s) pendiente(s) con vencimiento dentro del periodo seleccionado.`
                : "No hay términos pendientes dentro del periodo seleccionado."
        );
    }
    function abrirAlertasTerminos() {
        if (typeof window.mostrarAlertasTerminos === "function") {
            window.mostrarAlertasTerminos();
            return;
        }

        const modal =
            document.getElementById("modal-alertas-terminos") ||
            document.getElementById("modal-terminos");

        if (modal) {
            modal.style.display = "flex";
            modal.classList.add("activo");
            return;
        }

        const total = obtenerTerminosPendientes().length;
        window.alert(
            total
                ? `Tienes ${total} término(s) procesal(es) pendiente(s).`
                : "No tienes términos procesales pendientes."
        );
    }

    function renderizarDashboard() {
        actualizarMetricas();
        actualizarGraficas();
        renderizarProximosEventos();
        renderizarActividadReciente();
        actualizarAsistente();
        actualizarPanelTerminos();
    }

    function escucharColeccion(nombre) {
        return obtenerDB()
            .collection(nombre)
            .onSnapshot(snapshot => {
                estado[nombre] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                renderizarDashboard();
            }, error => {
                console.error(`Error escuchando ${nombre}:`, error);
                const asistente = document.getElementById("asistente-mensaje");
                if (asistente) {
                    asistente.textContent =
                        `No fue posible consultar la colección ${nombre}.`;
                }
            });
    }

    function cargarChartJS() {
        return new Promise((resolve, reject) => {
            if (window.Chart) {
                resolve();
                return;
            }

            const script = document.createElement("script");
            script.src =
                "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js";
            script.onload = resolve;
            script.onerror = () =>
                reject(new Error("No fue posible cargar Chart.js."));
            document.head.appendChild(script);
        });
    }

    function aplicarPeriodoDesdeControles() {
        const error = document.getElementById("dashboard-periodo-error");
        const valorDesde = document.getElementById("dashboard-fecha-desde")?.value;
        const valorHasta = document.getElementById("dashboard-fecha-hasta")?.value;
        if (error) error.textContent = "";

        if (!valorDesde && !valorHasta) {
            const periodo = periodoMesActual();
            establecerPeriodo(periodo.desde, periodo.hasta);
            sincronizarControlesPeriodo();
            renderizarDashboard();
            return;
        }

        if (!valorDesde || !valorHasta) {
            if (error) error.textContent = "Selecciona las dos fechas para aplicar el periodo.";
            return;
        }

        const desde = new Date(`${valorDesde}T00:00:00`);
        const hasta = new Date(`${valorHasta}T23:59:59`);
        if (hasta < desde) {
            if (error) error.textContent = "La fecha final no puede ser anterior a la fecha inicial.";
            return;
        }

        establecerPeriodo(desde, hasta);
        sincronizarControlesPeriodo();
        renderizarDashboard();
    }

    function usarMesActual() {
        const periodo = periodoMesActual();
        establecerPeriodo(periodo.desde, periodo.hasta);
        sincronizarControlesPeriodo();
        const error = document.getElementById("dashboard-periodo-error");
        if (error) error.textContent = "";
        renderizarDashboard();
    }

    async function iniciarDashboardEjecutivo() {
        const vista = document.getElementById("vista-dashboard");
        if (!vista) return;

        estado.usuario =
            window.obtenerUsuarioSesion?.() ||
            window.verificarSesion?.() ||
            null;

        actualizarFechaSuperior();
        actualizarSaludo();
        usarMesActual();

        try {
            await cargarChartJS();

            estado.listeners.forEach(cancelar => cancelar());
            estado.listeners = [
                escucharColeccion("clientes"),
                escucharColeccion("asuntos"),
                escucharColeccion("agenda"),
                escucharColeccion("personal"),
                escucharColeccion("alertas")
            ];
        } catch (error) {
            console.error("Error iniciando dashboard:", error);
            establecerTexto(
                "asistente-mensaje",
                "No fue posible iniciar el Dashboard Ejecutivo."
            );
        }

        document
            .getElementById("btn-refrescar-dashboard")
            ?.addEventListener("click", renderizarDashboard);

        document
            .getElementById("btn-ver-terminos")
            ?.addEventListener("click", abrirAlertasTerminos);

        document
            .getElementById("btn-aplicar-periodo")
            ?.addEventListener("click", aplicarPeriodoDesdeControles);

        document
            .getElementById("btn-periodo-mes-actual")
            ?.addEventListener("click", usarMesActual);
    }

    document.addEventListener("DOMContentLoaded", iniciarDashboardEjecutivo);

    window.actualizarDashboardEjecutivo = renderizarDashboard;
    window.actualizarContadoresReales = renderizarDashboard;
    window.actualizarAsistenteVirtual = actualizarAsistente;
    window.obtenerPeriodoDashboard = () => ({ ...estado.periodo });
})();
