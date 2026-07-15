/**
 * JS LegalTech Control - Módulo de Agenda Jurídica (Versión en la Nube con Firebase)
 */

// 1. CONFIGURACIÓN DE TU BASE DE DATOS REAL DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCirsdiVuRzrNBFdrurKgH26zX1vMs5xl8",
    authDomain: "legaltech-app.firebaseapp.com",
    projectId: "legaltech-app",
    storageBucket: "legaltech-app.firebasestorage.app",
    messagingSenderId: "1068350106232",
    appId: "1:1068350106232:web:48b2a3510c563c28305b8d"
};

// Inicializar Firebase y la base de datos Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. Control de eventos al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    poblarSelectAsuntos(); 
    cargarAgendaLista(); // Ahora lee desde la nube
    
    document.getElementById("form-agenda")?.addEventListener("submit", guardarEventoAgenda);

    // Verificar alarmas de inmediato y configurar el intervalo de revisión (cada 30 segundos)
    verificarAlarmasAgenda();
    setInterval(verificarAlarmasAgenda, 30000);
});

// Obtener datos del usuario en sesión activa (Se mantiene temporalmente local)
function obtenerUsuarioSesion() {
    const sesionData = localStorage.getItem('js_legal_session') || sessionStorage.getItem('js_legal_usuario');
    return sesionData ? JSON.parse(sesionData) : null;
}

function abrirModalAgenda() {
    document.getElementById("modal-agenda").style.display = "block";
    document.getElementById("agenda-modal-titulo").innerText = "Agendar Evento Procesal";
    document.getElementById("form-agenda").reset();
    document.getElementById("agenda-id").value = "";
    poblarSelectAsuntos();
}

function cerrarModalAgenda() {
    document.getElementById("modal-agenda").style.display = "none";
}

function poblarSelectAsuntos() {
    const select = document.getElementById("age-asunto-id") || 
                   document.getElementById("asunto-id") || 
                   document.getElementById("agenda-asunto-id");

    if (!select) return;

    const usuarioActivo = obtenerUsuarioSesion();
    const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];

    select.innerHTML = '<option value="">-- Selecciona un expediente --</option>';

    let asuntosFiltrados = asuntos;

    if (usuarioActivo && usuarioActivo.rol === 'Abogado') {

        asuntosFiltrados = asuntos.filter(a => 
            String(a.abogadoAsignado) === String(usuarioActivo.id) ||
            String(a.abogadoAsignado) === String(usuarioActivo.usuario)
        );

    }

    if (asuntosFiltrados.length === 0) {
        select.innerHTML = '<option value="">-- No tienes expedientes disponibles --</option>';
        return;
    }

    asuntosFiltrados.forEach(a => {
        const option = document.createElement("option");
        option.value = a.id;
        option.textContent = `Exp. ${a.expediente || 'S/N'} - ${a.materia || 'Asunto'}`;
        select.appendChild(option);
    });
}

// GUARDAR REGISTRO EN LA NUBE (FIREBASE)
async function guardarEventoAgenda(e) {
    e.preventDefault();
    
    const id = document.getElementById("agenda-id").value;
    const asuntoId = document.getElementById("age-asunto-id").value;
    const tipo = document.getElementById("age-tipo").value;
    const fecha = document.getElementById("age-fecha").value;
    const hora = document.getElementById("age-hora").value;
    const textareaNotas = document.getElementById("age-notes") || document.getElementById("age-notas");
    const notas = textareaNotas ? textareaNotas.value.trim() : "";
    
const usuarioActivo = obtenerUsuarioSesion();

const datosEvento = {
    asuntoId: asuntoId,
    tipo: tipo,
    fecha: fecha,
    hora: hora,
    notas: notas,
    abogadoAsignado: usuarioActivo ? usuarioActivo.usuario : "",
    notificado: false
};

    try {
        if (id) {
            // MODO EDICIÓN: Actualiza el documento en la colección de la nube
            await db.collection("agenda").doc(id).update(datosEvento);
            alert("Evento actualizado en la nube con éxito.");
        } else {
            // NUEVO REGISTRO: Crea un ID único automático en la nube
            await db.collection("agenda").add(datosEvento);
            alert("Evento guardado en la nube con éxito.");
        }
        
        cerrarModalAgenda();
        cargarAgendaLista(); // Refrescar vista
    } catch (error) {
        console.error("Error al guardar en Firebase:", error);
        alert("Hubo un error al guardar en la nube.");
    }
}

// LEER DATOS DESDE LA NUBE Y PINTARLOS EN LA PANTALLA
async function cargarAgendaLista() {
    const contenedor = document.getElementById("lista-agenda-contenedor");
    if (!contenedor) return;
    
    const usuarioActivo = obtenerUsuarioSesion();
    const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];
    contenedor.innerHTML = '<div style="text-align:center; padding:2rem;">Cargando agenda desde la nube...</div>';
    
    try {
        // Consultar la colección 'agenda' en Firebase
        const snapshot = await db.collection("agenda").get();
        let eventos = [];
        
        snapshot.forEach(doc => {
            eventos.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar cronológicamente en memoria
        eventos.sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`));

        // Filtrado por rol de usuario
       // Filtrado por rol de usuario
let eventosFiltrados = [];

if (usuarioActivo && usuarioActivo.rol === 'Administrador') {

    // Administrador ve toda la agenda
    eventosFiltrados = eventos;

} else if (usuarioActivo && usuarioActivo.rol === 'Abogado') {

    // Abogado solo ve sus propios eventos
    eventosFiltrados = eventos.filter(ev => {

        return String(ev.abogadoAsignado) === String(usuarioActivo.usuario);

    });

} else {

    // Clientes u otros usuarios
    eventosFiltrados = eventos.filter(ev => {

        const asu = asuntos.find(a => String(a.id) === String(ev.asuntoId));

        return asu && 
        JSON.stringify(asu)
        .toLowerCase()
        .includes(String(usuarioActivo.id).toLowerCase());

    });

}
        
        contenedor.innerHTML = "";
        
        if (eventosFiltrados.length === 0) {
            contenedor.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: white; border: 1px dashed var(--border-color); border-radius: 8px;">
                    No hay audiencias ni vencimientos programados.
                </div>`;
            actualizarContadoresDashboard(0);
            return;
        }
        
        eventosFiltrados.forEach(ev => {
            const asunto = asuntos.find(a => String(a.id) === String(ev.asuntoId));
            const expTexto = asunto ? `Expediente: ${asunto.expediente || 'S/N'} (${asunto.materia || 'General'})` : "Asunto no especificado";
            
            let indicatorColor = "#3b82f6"; 
            if (ev.tipo === "Término Judicial") indicatorColor = "#ef4444"; 
            if (ev.tipo === "Diligencia") indicatorColor = "#f59e0b"; 
            
            const tarjeta = document.createElement("div");
            tarjeta.style.cssText = "background:#ffffff; border-left:5px solid " + indicatorColor + "; padding:1.2rem; border-radius:0 8px 8px 0; display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border:1px solid var(--border-color);";
            
            const fechaLegible = new Date(ev.fecha + "T00:00").toLocaleDateString('es-MX', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });

            tarjeta.innerHTML = `
                <div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: ${indicatorColor}; text-transform: uppercase; margin-bottom: 0.3rem;">${ev.tipo}</div>
                    <h4 style="color: var(--primary-color); margin-bottom: 0.2rem;">${expTexto}</h4>
                    <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.4rem;">${ev.notas || 'Sin notas.'}</p>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">📅 ${fechaLegible} a las 🕒 ${ev.hora} hrs</div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="editarEvento('${ev.id}')" style="background: #f1f5f9; border: none; padding: 0.5rem 0.8rem; border-radius: 6px; cursor: pointer;">✏️</button>
                    <button onclick="eliminarEvento('${ev.id}')" style="background: #f1f5f9; border: none; padding: 0.5rem 0.8rem; border-radius: 6px; cursor: pointer; color: #ef4444;">🗑️</button>
                </div>`;
            contenedor.appendChild(tarjeta);
        });

        actualizarContadoresDashboard(eventosFiltrados.length);
    } catch (error) {
        console.error("Error cargando lista de Firebase:", error);
        contenedor.innerHTML = '<div style="color:red; text-align:center; padding:2rem;">Error al sincronizar con la nube.</div>';
    }
}

// EDITAR (Lee desde la nube el elemento específico)
async function editarEvento(id) {
    try {
        const doc = await db.collection("agenda").doc(id).get();
        if (doc.exists) {
            const ev = doc.data();
            abrirModalAgenda();
            document.getElementById("agenda-modal-titulo").innerText = "Modificar Evento";
            document.getElementById("agenda-id").value = id;
            document.getElementById("age-asunto-id").value = ev.asuntoId;
            document.getElementById("age-tipo").value = ev.tipo;
            document.getElementById("age-fecha").value = ev.fecha;
            document.getElementById("age-hora").value = ev.hora;
            
            const textareaNotas = document.getElementById("age-notes") || document.getElementById("age-notas");
            if (textareaNotas) textareaNotas.value = ev.notes || ev.notas || "";
        }
    } catch (error) {
        console.error("Error al obtener documento para edición:", error);
    }
}

// ELIMINAR DESDE LA NUBE
async function eliminarEvento(id) {
    if (confirm("¿Deseas remover este evento de la agenda en la nube?")) {
        try {
            await db.collection("agenda").doc(id).delete();
            alert("Evento eliminado de forma sincronizada.");
            cargarAgendaLista();
        } catch (error) {
            console.error("Error al eliminar documento:", error);
        }
    }
}

function actualizarContadoresDashboard(conteoReal) {
    const badge = document.getElementById("count-audiencias");
    if (badge) badge.innerText = conteoReal;
}

// MONITOR DE ALARMAS CONECTADO A FIREBASE
async function verificarAlarmasAgenda() {
    try {
        const snapshot = await db.collection("agenda").where("notificado", "==", false).get();
        const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];
        const ahora = new Date();
        
        const año = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        const horas = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        
        const fechaActualStr = `${año}-${mes}-${dia}`;
        const horaActualStr = `${horas}:${minutos}`;

        snapshot.forEach(async (doc) => {
            const evento = doc.data();
            if (evento.fecha === fechaActualStr && evento.hora === horaActualStr) {
                const asu = asuntos.find(a => String(a.id) === String(evento.asuntoId));
                evento.expedienteContexto = asu ? `Exp. ${asu.expediente} (${asu.materia})` : 'Expediente no especificado';
                
                dispararAlarmaAccion(evento);
                
                // Actualizar de forma inmediata en la nube para que no suene en otros dispositivos a la vez
                await db.collection("agenda").doc(doc.id).update({ notificado: true });
            }
        });
    } catch (error) {
        console.error("Error en monitor de alarmas de Firebase:", error);
    }
}

function dispararAlarmaAccion(evento) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime); 
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
    } catch (e) {}

    alert(`⏰ ALARMA GLOBAL SIMULTÁNEA:\n\nTipo: ${evento.tipo}\n${evento.expedienteContexto || ''}\n\nDetalles: ${evento.notas || 'Sin notas.'}`);
}