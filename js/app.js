// Variable global para que esté accesible en todo el script por cualquier función
let usuarioActivoGlobal = null;

// Esperar a que la página cargue por completo
document.addEventListener("DOMContentLoaded", () => {
    // 1. Validar seguridad de sesión (Función de auth.js)
    const usuarioActivo = verificarSesion();
    
    if (usuarioActivo) {
        // Almacenar en la variable global para resolver el problema de scope
        usuarioActivoGlobal = usuarioActivo;

        // Mostrar datos en el pie del menú lateral
        const userDisplay = document.getElementById("user-display");
        const roleDisplay = document.getElementById("role-display");
        
        if (userDisplay) userDisplay.innerText = usuarioActivo.nombre;
        if (roleDisplay) roleDisplay.innerText = usuarioActivo.rol;
        
        // 2. Adaptar la interfaz según el ROL
        configurarInterfazPorRol(usuarioActivo.rol);
    }
    
    // El cliente utiliza exclusivamente su portal y no consulta módulos administrativos.
    if (usuarioActivo?.rol !== "Cliente") {
        actualizarContadoresReales();
        actualizarAsistenteVirtual();
    }
});

// Función para hacer que los contadores del panel sean 100% reales
function actualizarContadoresReales() {
    const countClientes = document.getElementById("count-clientes");
    const countAsuntos = document.getElementById("count-asuntos");
    const countAudiencias = document.getElementById("count-audiencias");

    const totalClientes = JSON.parse(localStorage.getItem("js_legal_clientes")) || [];
    const totalAsuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];
    const totalAgenda = JSON.parse(localStorage.getItem("js_legal_agenda")) || [];

    if (countClientes) countClientes.innerText = totalClientes.length;
    if (countAsuntos) countAsuntos.innerText = totalAsuntos.length;
    if (countAudiencias) countAudiencias.innerText = totalAgenda.length;
}

// ===================================================
// ===================================================
// CONTROL DEL ASISTENTE VIRTUAL EN EL DASHBOARD
// ===================================================
async function actualizarAsistenteVirtual() {

    const contenedorAsistente = document.getElementById("asistente-mensaje"); 
    if (!contenedorAsistente) return;

    const usuarioActivo = obtenerUsuarioSesion();

    try {

        // Leer agenda desde Firebase
        const snapshot = await db.collection("agenda").get();

        let agenda = [];

        snapshot.forEach(doc => {
            agenda.push({
                id: doc.id,
                ...doc.data()
            });
        });


        // Fecha actual YYYY-MM-DD
        const ahora = new Date();

        const fechaHoyStr =
            ahora.getFullYear() + "-" +
            String(ahora.getMonth() + 1).padStart(2,'0') + "-" +
            String(ahora.getDate()).padStart(2,'0');


        // Eventos del día
        let eventosDeHoy = agenda.filter(ev => ev.fecha === fechaHoyStr);


        // Si es abogado solo muestra sus eventos
        if (usuarioActivo && ["Abogado", "Pasante"].includes(usuarioActivo.rol)) {

            eventosDeHoy = eventosDeHoy.filter(ev =>
                String(ev.abogadoAsignado) === String(usuarioActivo.usuario)
            );

        }


        if (eventosDeHoy.length === 0) {

            contenedorAsistente.innerText =
            "🤖 Asistente Virtual JS: No tienes compromisos ni audiencias programadas para hoy. ¡Buen día!";

        } else {

            const audiencias = eventosDeHoy.filter(e => e.tipo === "Audiencia").length;
            const terminos = eventosDeHoy.filter(e => e.tipo === "Término Judicial").length;
            const otros = eventosDeHoy.length - (audiencias + terminos);

            let mensaje =
            `🤖 Asistente Virtual JS: Para hoy tienes ${eventosDeHoy.length} evento(s): `;

            let detalles = [];

            if (audiencias > 0)
                detalles.push(`${audiencias} audiencia(s)`);

            if (terminos > 0)
                detalles.push(`${terminos} término(s) crítico(s)`);

            if (otros > 0)
                detalles.push(`${otros} cita(s) o diligencia(s)`);


            mensaje += detalles.join(", ") + 
            ". Revisa la sección Agenda para más detalles.";

            contenedorAsistente.innerText = mensaje;
        }


    } catch(error) {

        console.error("Error cargando asistente virtual:", error);

        contenedorAsistente.innerText =
        "🤖 Asistente Virtual JS: No fue posible consultar la agenda.";

    }
}

// Oculta o muestra módulos dependiendo de quién inició sesión
function configurarInterfazPorRol(rol) {
    const R = window.JSLegalRoles;
    const puede = permiso => R?.tienePermiso(permiso) === true;
    const menuLateral = document.getElementById("menu-lateral");
    const mostrar = (id, visible) => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? "block" : "none";
    };

    mostrar("menu-dashboard", rol !== "Cliente");
    mostrar("menu-clientes", rol !== "Cliente");
    mostrar("menu-entrevistas", rol !== "Cliente");
    mostrar("menu-asuntos", rol !== "Cliente");
    mostrar("menu-expedientes", rol !== "Cliente");
    mostrar("menu-constructor-documentos", rol !== "Cliente");
    mostrar("menu-agenda", rol !== "Cliente");
    mostrar("menu-portal", rol === "Cliente");

    const rolesComunicacion = ["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado"];
    if (rolesComunicacion.includes(rol) && menuLateral && !document.getElementById("menu-comunicacion")) {
        menuLateral.insertAdjacentHTML("beforeend", `<li id="menu-comunicacion"><a href="#" class="menu-item" onclick="switchTab('comunicacion')">💬 Comunicación</a></li>`);
    }

    if (puede("gestionar_personal") && menuLateral && !document.getElementById("menu-personal")) {
        menuLateral.insertAdjacentHTML("beforeend", `<li id="menu-personal"><a href="#" class="menu-item" onclick="switchTab('personal')">👥 Personal</a></li>`);
    }

    if (["Superadministrador", "Administrador"].includes(rol) && menuLateral && !document.getElementById("menu-configuracion")) {
        menuLateral.insertAdjacentHTML("beforeend", `<li id="menu-configuracion"><a href="#" class="menu-item" onclick="switchTab('configuracion')">⚙️ Configuración</a></li>`);
    }

    if (rol === "Cliente") {
        if (usuarioActivoGlobal && typeof cargarExpedientesClientePortal === "function") {
            cargarExpedientesClientePortal(usuarioActivoGlobal.id);
        } else if (usuarioActivoGlobal && typeof cargarPortalCliente === "function") {
            cargarPortalCliente();
        }
        switchTab("portal");
    }
}

// Alterna la Agenda entre lista y calendario sin duplicar opciones en el menú.
function mostrarVistaAgenda(modo = "lista") {
    const vista = modo === "calendario" ? "calendario" : "agenda";
    switchTab(vista);
    document.getElementById("menu-calendario")?.classList.remove("active");
    document.getElementById("menu-agenda")?.classList.add("active");
    document.querySelectorAll(".agenda-view-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.agendaView === modo);
    });
    const titulo = document.getElementById("view-title");
    if (titulo) titulo.innerText = modo === "calendario" ? "Agenda — Vista de calendario" : "Agenda — Vista de lista";
}
window.mostrarVistaAgenda = mostrarVistaAgenda;

// Cambiar de pantallas (SPA) y gestionar estados activos
function switchTab(vista) {
    const usuarioActual = (() => { try { return JSON.parse(sessionStorage.getItem("js_legal_usuario") || localStorage.getItem("js_legal_session") || "null"); } catch (_) { return null; } })();
    if (vista === "comunicacion" && !["Superadministrador", "Administrador", "Auxiliar Jurídico", "Abogado"].includes(usuarioActual?.rol)) {
        alert("No tienes permiso para acceder al Centro de Comunicación.");
        return;
    }
    if (vista === "expedientes" && usuarioActual?.rol === "Cliente") {
        alert("El módulo de Expedientes es exclusivo para personal autorizado del despacho.");
        return;
    }
    if (vista === "mantenimiento" && usuarioActual?.rol !== "Superadministrador") {
        alert("El mantenimiento de consecutivos es exclusivo del Superadministrador.");
        return;
    }
    if (vista === "configuracion" && !["Superadministrador", "Administrador"].includes(usuarioActual?.rol)) {
        alert("La configuración es exclusiva de la administración del despacho.");
        return;
    }
    // Ocultar todas las vistas primero
    document.querySelectorAll('.app-view').forEach(section => {
        section.style.display = 'none';
    });
    
    // Quitar clase activa de todos los elementos li del menú lateral
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Mostrar la vista deseada
    const targetVista = document.getElementById(`vista-${vista}`);
    if (targetVista) targetVista.style.display = 'block';
    
    // Marcar como activo el botón correspondiente en el menú si tiene ID asignado
    const targetMenu = document.getElementById(`menu-${vista}`);
    if (targetMenu) targetMenu.classList.add('active');
    
    // Al regresar al dashboard, refrescar el robot y los números
    if (vista === 'dashboard') {
        actualizarContadoresReales();
        actualizarAsistenteVirtual();
    }
    
    // Ejecutar recarga del portal si el cliente navega manualmente
    if (vista === 'portal' && usuarioActivoGlobal && usuarioActivoGlobal.rol === 'Cliente') {
        if (typeof cargarExpedientesClientePortal === 'function') cargarExpedientesClientePortal(usuarioActivoGlobal.id);
        else if (typeof cargarPortalCliente === 'function') cargarPortalCliente();
    }

    // Inicializar o refrescar la tabla de personal cuando se entra a su vista
    if (vista === 'personal' && typeof renderizarTablaPersonal === 'function') {
        renderizarTablaPersonal();
    }

    if (vista === "expedientes" && typeof window.cargarExpedientes === "function") {
        window.cargarExpedientes();
    }

    if (vista === "clientes" && typeof cargarClientesTabla === "function") {
        cargarClientesTabla();
    }

    if (vista === "calendario" && typeof window.renderizarCalendarioJuridico === "function") {
        window.renderizarCalendarioJuridico();
    }

    if (vista === "comunicacion" && typeof window.cargarCentroComunicacion === "function") {
        window.cargarCentroComunicacion();
    }

    if (vista === "mantenimiento" && typeof window.cargarMantenimientoConsecutivos === "function") {
        window.cargarMantenimientoConsecutivos();
    }
    
    // Cambiar título superior
    const titulos = {
        dashboard: "Dashboard Informativo",
        clientes: "Administración de Clientes",
        asuntos: "Control de Asuntos Jurídicos",
        expedientes: "Expedientes Electrónicos",
        agenda: "Agenda de Audiencias y Términos",
        calendario: "Calendario Jurídico Profesional",
        portal: "Portal de Consulta Ciudadana",
        comunicacion: "Centro de Comunicación",
        personal: "Gestión de Personal y Abogados",
        configuracion: "Configuración del Despacho",
        mantenimiento: "Mantenimiento de Consecutivos"
    };
    
    const viewTitle = document.getElementById("view-title");
    if (viewTitle) viewTitle.innerText = titulos[vista] || "JS LegalTech Control";

       // Cerrar menú lateral en móviles después de seleccionar una opción
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector(".sidebar");

        if (sidebar) {
            sidebar.classList.remove("open");
        }
    }

}
      




// ==========================================
// VIGILANTE DE AGENDA EN TIEMPO REAL
// ==========================================
setInterval(() => {
    const agenda = JSON.parse(localStorage.getItem("js_legal_agenda")) || [];
    if (agenda.length === 0) return;

    const ahora = new Date();
    
    // Obtener fecha actual en formato YYYY-MM-DD
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const fechaActualStr = `${anio}-${mes}-${dia}`;
    
    // Obtener hora actual en formato HH:MM
    const horaActualStr = String(ahora.getHours()).padStart(2, '0') + ":" + String(ahora.getMinutes()).padStart(2, '0');

    // Buscar si hay algún evento programado para este preciso minuto
    const eventoUrgente = agenda.find(ev => ev.fecha === fechaActualStr && ev.hora === horaActualStr);

    if (eventoUrgente) {
        const yaNotificado = sessionStorage.getItem(`alerta_${eventoUrgente.id}`);
        
        if (!yaNotificado) {
            sessionStorage.setItem(`alerta_${eventoUrgente.id}`, "true");
            
            // Sonido de alerta nativo del navegador
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const oscillatorGain = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Nota LA
            
            oscillatorGain.gain.setValueAtTime(0.3, audioCtx.currentTime); // Controlar volumen a nivel moderado
            
            oscillator.connect(oscillatorGain);
            oscillatorGain.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5); // Suena medio segundo

            // Ventana de alerta en pantalla
            alert(`🚨 ¡RECORDATORIO DE ALTA PRIORIDAD!\n\nTienes un evento del tipo [ ${eventoUrgente.tipo || eventoUrgente.type} ] programado para este momento.\n\nNotas: ${eventoUrgente.notas || eventoUrgente.notes || 'Sin detalles adicionales.'}`);
        }
    }
}, 30000); // Revisa cada 30 segundos

document.addEventListener("DOMContentLoaded",()=>{

    const boton = document.getElementById("menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    if(boton && sidebar){

        boton.addEventListener("click",()=>{

            sidebar.classList.toggle("open");

        });

    }

});