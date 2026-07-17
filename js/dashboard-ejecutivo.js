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
        usuario: null,
        listeners: [],
        charts: {}
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

    function datosVisibles() {
        return {
            clientes: filtrarPorUsuario(estado.clientes, "clientes"),
            asuntos: filtrarPorUsuario(estado.asuntos, "asuntos"),
            agenda: filtrarPorUsuario(estado.agenda, "agenda")
        };
    }

    function esAsuntoActivo(asunto) {
        const estadoAsunto = normalizar(asunto.estado);
        return !["concluido", "archivado", "cerrado"].includes(estadoAsunto);
    }

    function actualizarMetricas() {
        const datos = datosVisibles();
        const ahora = new Date();
        const hoy = fechaLocalISO(ahora);
        const mes = ahora.getMonth();
        const anio = ahora.getFullYear();

        const asuntosActivos = datos.asuntos.filter(esAsuntoActivo);
        const eventosMes = datos.agenda.filter(evento => {
            const fecha = fechaEvento(evento);
            return fecha &&
                fecha.getMonth() === mes &&
                fecha.getFullYear() === anio;
        });

        const eventosHoy = datos.agenda.filter(evento => evento.fecha === hoy);

        establecerTexto("count-clientes", datos.clientes.length);
        establecerTexto("count-asuntos", asuntosActivos.length);
        establecerTexto("count-audiencias", eventosMes.length);
        establecerTexto("count-eventos-hoy", eventosHoy.length);

        establecerTexto(
            "metric-asuntos-detalle",
            `${datos.asuntos.length} expediente(s) total`
        );

        establecerTexto(
            "metric-agenda-detalle",
            `${eventosMes.filter(e => normalizar(e.tipo) === "audiencia").length} audiencia(s)`
        );

        establecerTexto(
            "metric-hoy-detalle",
            eventosHoy.length ? "Requieren atención" : "Sin pendientes"
        );
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
        const { asuntos } = datosVisibles();

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

        const ahora = new Date();

        const eventos = datosVisibles().agenda
            .map(evento => ({ ...evento, fechaObjeto: fechaEvento(evento) }))
            .filter(evento => evento.fechaObjeto && evento.fechaObjeto >= ahora)
            .sort((a, b) => a.fechaObjeto - b.fechaObjeto)
            .slice(0, 5);

        if (!eventos.length) {
            contenedor.innerHTML =
                '<p class="dashboard-empty">No hay eventos próximos.</p>';
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
            .sort((a, b) => b.fechaObjeto - a.fechaObjeto)
            .slice(0, 5);
    }

    function renderizarActividadReciente() {
        const contenedor = document.getElementById("dashboard-actividad-reciente");
        if (!contenedor) return;

        const actuaciones = obtenerActuaciones();

        if (!actuaciones.length) {
            contenedor.innerHTML =
                '<p class="dashboard-empty">No hay actuaciones registradas.</p>';
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

        const { asuntos, agenda } = datosVisibles();
        const hoy = fechaLocalISO();
        const eventosHoy = agenda.filter(evento => evento.fecha === hoy);
        const asuntosActivos = asuntos.filter(esAsuntoActivo);

        if (!eventosHoy.length) {
            contenedor.textContent =
                `No tienes eventos programados para hoy. Hay ${asuntosActivos.length} asunto(s) activo(s) en seguimiento.`;
            return;
        }

        const audiencias = eventosHoy.filter(
            evento => normalizar(evento.tipo) === "audiencia"
        ).length;

        const terminos = eventosHoy.filter(
            evento => normalizar(evento.tipo).includes("término") ||
                      normalizar(evento.tipo).includes("termino")
        ).length;

        const partes = [];
        if (audiencias) partes.push(`${audiencias} audiencia(s)`);
        if (terminos) partes.push(`${terminos} término(s)`);
        if (eventosHoy.length - audiencias - terminos > 0) {
            partes.push(
                `${eventosHoy.length - audiencias - terminos} actividad(es)`
            );
        }

        contenedor.textContent =
            `Para hoy tienes ${eventosHoy.length} evento(s): ${partes.join(", ")}. Revisa la agenda antes de iniciar actividades.`;
    }

    function renderizarDashboard() {
        actualizarMetricas();
        actualizarGraficas();
        renderizarProximosEventos();
        renderizarActividadReciente();
        actualizarAsistente();
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

    async function iniciarDashboardEjecutivo() {
        const vista = document.getElementById("vista-dashboard");
        if (!vista) return;

        estado.usuario =
            window.obtenerUsuarioSesion?.() ||
            window.verificarSesion?.() ||
            null;

        actualizarFechaSuperior();
        actualizarSaludo();

        try {
            await cargarChartJS();

            estado.listeners.forEach(cancelar => cancelar());
            estado.listeners = [
                escucharColeccion("clientes"),
                escucharColeccion("asuntos"),
                escucharColeccion("agenda"),
                escucharColeccion("personal")
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
    }

    document.addEventListener("DOMContentLoaded", iniciarDashboardEjecutivo);

    window.actualizarDashboardEjecutivo = renderizarDashboard;
    window.actualizarContadoresReales = renderizarDashboard;
    window.actualizarAsistenteVirtual = actualizarAsistente;
})();
