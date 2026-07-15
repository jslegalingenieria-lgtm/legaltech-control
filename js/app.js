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
    
    // Inicializar contadores dinámicos del Dashboard desde LocalStorage
    actualizarContadoresReales();

    // Activar el Asistente Virtual Inteligente
    actualizarAsistenteVirtual();
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
// CONTROL DEL ASISTENTE VIRTUAL EN EL DASHBOARD
// ===================================================
function actualizarAsistenteVirtual() {
    const contenedorAsistente = document.getElementById("asistente-mensaje"); 
    if (!contenedorAsistente) return;

    const agenda = JSON.parse(localStorage.getItem("js_legal_agenda")) || [];
    
    // Obtener la fecha de hoy en formato YYYY-MM-DD
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const fechaHoyStr = `${anio}-${mes}-${dia}`;

    // Filtrar TODOS los eventos de hoy (Audiencias, Términos, Reuniones, etc.)
    const eventosDeHoy = agenda.filter(ev => ev.fecha === fechaHoyStr);

    if (eventosDeHoy.length === 0) {
        contenedorAsistente.innerText = "🤖 Asistente Virtual JS: Revisando la agenda... No tienes compromisos ni audiencias programadas para hoy. ¡Buen día!";
    } else {
        const audiencias = eventosDeHoy.filter(e => e.tipo === "Audiencia").length;
        const terminos = eventosDeHoy.filter(e => e.tipo === "Término Judicial").length;
        const otros = eventosDeHoy.length - (audiencias + terminos);

        let mensaje = `🤖 Asistente Virtual JS: ¡Atención, Lic. Sánchez! Para hoy tienes ${eventosDeHoy.length} evento(s) en agenda: `;
        
        let detalles = [];
        if (audiencias > 0) detalles.push(`${audiencias} audiencia(s)`);
        if (terminos > 0) detalles.push(`${terminos} término(s) crítico(s)`);
        if (otros > 0) detalles.push(`${otros} cita(s) o diligencia(s)`);

        mensaje += detalles.join(", ") + ". Revisa la sección de Agenda para ver los detalles.";
        
        contenedorAsistente.innerText = mensaje;
    }
}

// Oculta o muestra módulos dependiendo de quién inició sesión
function configurarInterfazPorRol(rol) {
    const menuDashboard = document.getElementById("menu-dashboard");
    const menuClientes = document.getElementById("menu-clientes");
    const menuAsuntos = document.getElementById("menu-asuntos");
    const menuAgenda = document.getElementById("menu-agenda");
    const menuPortal = document.getElementById("menu-portal");
    const menuLateral = document.getElementById("menu-lateral");

    // Inyectar dinámicamente el botón de Personal de forma limpia si es Administrador
    if (rol === "Administrador" && menuLateral) {
        // Evitamos duplicar el botón si ya existe
        if (!document.getElementById("menu-personal")) {
            menuLateral.innerHTML += `<li id="menu-personal"><a href="#" class="menu-item" onclick="switchTab('personal')">👥 Personal</a></li>`;
        }
    }

    if (rol === "Cliente") {
        // Ocultar herramientas de abogado
        if (menuDashboard) menuDashboard.style.display = "none";
        if (menuClientes) menuClientes.style.display = "none";
        if (menuAsuntos) menuAsuntos.style.display = "none";
        if (menuAgenda) menuAgenda.style.display = "none";
        
        // Mostrar portal de consulta
        if (menuPortal) menuPortal.style.display = "block";
        
        // Usar la referencia global segura corregida
        if (usuarioActivoGlobal && typeof cargarExpedientesClientePortal === 'function') {
            cargarExpedientesClientePortal(usuarioActivoGlobal.id);
        } else if (usuarioActivoGlobal && typeof cargarPortalCliente === 'function') {
            cargarPortalCliente();
        }
        
        switchTab('portal');
    }
}

// Cambiar de pantallas (SPA) y gestionar estados activos
function switchTab(vista) {
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
    
    // Cambiar título superior
    const titulos = {
        dashboard: "Dashboard Informativo",
        clientes: "Administración de Clientes",
        asuntos: "Control de Asuntos Jurídicos",
        agenda: "Agenda de Audiencias y Términos",
        portal: "Portal de Consulta Ciudadana",
        personal: "Gestión de Personal y Abogados"
    };
    
    const viewTitle = document.getElementById("view-title");
    if (viewTitle) viewTitle.innerText = titulos[vista] || "JS LegalTech Control";

    // Cambiar de pantallas (SPA) y gestionar estados activos
function switchTab(vista) {
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
    
    // Cambiar título superior
    const titulos = {
        dashboard: "Dashboard Informativo",
        clientes: "Administración de Clientes",
        asuntos: "Control de Asuntos Jurídicos",
        agenda: "Agenda de Audiencias y Términos",
        portal: "Portal de Consulta Ciudadana",
        personal: "Gestión de Personal y Abogados"
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

const boton=document.getElementById("menu-toggle");

const sidebar=document.querySelector(".sidebar");

if(boton){

    boton.addEventListener("click",()=>{

        sidebar.classList.toggle("open");

    });

}

});