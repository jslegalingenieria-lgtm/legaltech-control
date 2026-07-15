/**
 * JS LegalTech Control - Módulo de Asuntos (Expedientes)
 */

let asuntoHistorialIdSeleccionado = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Inyectamos el modal primero
    inicializarModalBitacora();
    
    // 2. Cargamos la tabla
    cargarAsuntosTabla();
    
    // 3. Escuchamos formularios (si existen)
    document.getElementById("form-asunto")?.addEventListener("submit", guardarAsunto);
    document.getElementById("form-actuacion")?.addEventListener("submit", guardarActuacion);
});

// --- FUNCIÓN DE INYECCIÓN DEL MODAL (HTML DENTRO DE JS) ---
function inicializarModalBitacora() {
    if (document.getElementById("modal-bitacora")) return; 

    const div = document.createElement("div");
    div.id = "modal-bitacora";
    div.style.display = "none";
    div.style.position = "fixed";
    div.style.zIndex = "1000";
    div.style.left = "0";
    div.style.top = "0";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.backgroundColor = "rgba(0,0,0,0.5)";
    div.style.overflowY = "auto";

    div.innerHTML = `
    <div style="background-color: #ffffff; margin: 5% auto; padding: 2rem; width: 90%; max-width: 600px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1rem;">
            <h3 style="margin: 0; font-size: 1.3rem; color: #1e293b;">Historial de Actuaciones: <span id="bitacora-expediente-titulo" style="color: #8b5cf6;"></span></h3>
            <span onclick="cerrarModalBitacora()" style="cursor: pointer; font-size: 1.5rem; color: #94a3b8; font-weight: bold;">&times;</span>
        </div>
        <form id="form-actuacion" style="background-color: #f8fafc; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 0.8rem 0; font-size: 0.95rem; color: #475569;">📍 Registrar Nueva Actuación / Acuerdo</h4>
            <div style="margin-bottom: 0.8rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.3rem;">Fecha:</label>
                <input type="date" id="act-fecha" style="width: 100%; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 0.8rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.3rem;">Descripción:</label>
                <textarea id="act-descripcion" required rows="3" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px;"></textarea>
            </div>
            <button type="submit" style="background-color: #8b5cf6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; width: 100%;">Agregar al Historial</button>
        </form>
        <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem; color: #1e293b;">📜 Línea del Tiempo del Juicio</h4>
        <div id="bitacora-lista-historico" style="max-height: 250px; overflow-y: auto; padding-right: 5px;"></div>
    </div>`;

    document.body.appendChild(div);
}

// Función auxiliar para recuperar de forma adaptativa el contenedor select de abogados sin depender de IDs rígidos
function obtenerSelectAbogadoElemento() {
    let select = document.getElementById('asu-abogado-id') || 
                 document.getElementById('asunto-abogado') || 
                 document.getElementById('abogado-asignado');

    if (!select) {
        const todosLosSelects = document.querySelectorAll("select");
        todosLosSelects.forEach(sel => {
            const idLower = sel.id.toLowerCase();
            const nameLower = (sel.name || "").toLowerCase();
            if (idLower.includes("abogado") || idLower.includes("resp") || nameLower.includes("abogado")) {
                select = sel;
            }
        });
    }

    if (!select) {
        const todosLosLabels = document.querySelectorAll("label");
        todosLosLabels.forEach(label => {
            if (label.textContent.toLowerCase().includes("abogado")) {
                const contenedor = label.parentElement;
                const selectCercano = contenedor ? contenedor.querySelector("select") : null;
                if (selectCercano) select = selectCercano;
            }
        });
    }
    return select;
}

// Renderiza la tabla de expedientes considerando el Rol del usuario activo
function cargarAsuntosTabla() {
    const tablaCuerpo = document.getElementById("tabla-asuntos-cuerpo") || document.getElementById("tabla-expedientes-cuerpo");
    if (!tablaCuerpo) return;

    const usuarioActivo = JSON.parse(sessionStorage.getItem("js_legal_usuario"));
    let asuntos = obtenerAsuntos();
    
    // FILTRO DE ROL PARA EXPENDIENTES: Si es Abogado, sólo ve los que explícitamente tiene asignados
    if (usuarioActivo && usuarioActivo.rol === "Abogado") {
        asuntos = asuntos.filter(a => a.abogadoAsignado && String(a.abogadoAsignado) === String(usuarioActivo.usuario));
    }

    tablaCuerpo.innerHTML = "";

    if (asuntos.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1rem;">No tienes expedientes registrados o asignados.</td></tr>`;
        return;
    }

    asuntos.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${a.expediente}</td>
            <td>${a.juzgado}</td>
            <td>${a.materia}</td>
            <td><span class="badge ${a.estado}">${a.estado}</span></td>
            <td>${a.fechaRegistro}</td>
            <td>
                <button onclick="editarAsunto(${a.id})" style="color: #3b82f6; background:none; border:none; cursor:pointer; margin-right:5px;">✏️</button>
                <button onclick="abrirBitacoraAsunto(${a.id})" style="color: #8b5cf6; background:none; border:none; cursor:pointer; margin-right:5px;">📜</button>
                <button onclick="eliminarAsunto(${a.id})" style="color: #ef4444; background:none; border:none; cursor:pointer;">❌</button>
            </td>
        `;
        tablaCuerpo.appendChild(tr);
    });
    
    // Sincronizar simultáneamente la tabla de clientes vinculada si existe en el DOM de la vista actual
    if (document.getElementById("tabla-clientes-cuerpo")) {
        cargarTablaClientes();
    }
}

// Obtener asuntos de LocalStorage
function obtenerAsuntos() {
    const asuntos = localStorage.getItem("js_legal_asuntos");
    return asuntos ? JSON.parse(asuntos) : [];
}

// Abrir Modal de Asunto y rellenar los selects
function abrirModalAsunto() {
    const modal = document.getElementById("modal-asunto");
    if (modal) modal.style.display = "block";
    
    const titulo = document.getElementById("asunto-modal-titulo");
    if (titulo) titulo.innerText = "Registrar Nuevo Expediente";
    
    document.getElementById("form-asunto")?.reset();
    
    const idInput = document.getElementById("asunto-id");
    if (idInput) idInput.value = "";
    
    poblarSelectClientes();
    cargarAbogadosEnAsuntos(); 
}

function cerrarModalAsunto() {
    const modal = document.getElementById("modal-asunto");
    if (modal) modal.style.display = "none";
}

// Llenar el select con los clientes de LocalStorage
function poblarSelectClientes() {
    const select = document.getElementById("asu-cliente-id");
    if (!select) return;
    
    const clientes = JSON.parse(localStorage.getItem("js_legal_clientes")) || [];
    select.innerHTML = '<option value="">-- Selecciona un cliente --</option>';
    
    clientes.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id;
        option.textContent = c.nombre;
        select.appendChild(option);
    });
}

// Carga dinámica de Abogados responsables en el selector
function cargarAbogadosEnAsuntos() {
    const selectAbogado = obtenerSelectAbogadoElemento();

    if (!selectAbogado) {
        console.error("Error crítico: No se encontró la etiqueta <select> para los abogados en el HTML.");
        return;
    }

    const listaPersonal = JSON.parse(localStorage.getItem('js_legal_personal')) || [];
    const abogados = listaPersonal.filter(emp => emp.rol === 'Abogado' || emp.rol === 'Administrador');

    selectAbogado.innerHTML = '<option value="">-- Seleccione un Abogado Responsable --</option>';
    
    abogados.forEach(abogado => {
        const option = document.createElement('option');
        option.value = abogado.usuario; 
        option.textContent = abogado.nombre;
        selectAbogado.appendChild(option);
    });
}

// Guardar o Editar Asunto - CORREGIDO (Ya extrae el valor correctamente y no falla)
function guardarAsunto(e) {
    e.preventDefault();
    
    const id = document.getElementById("asunto-id")?.value;
    const clienteId = document.getElementById("asu-cliente-id")?.value;
    const materia = document.getElementById("asu-materia")?.value;
    const expediente = document.getElementById("asu-expediente")?.value.trim();
    const juzgado = document.getElementById("asu-juzgado")?.value.trim();
    const accion = document.getElementById("asu-accion")?.value.trim();
    const estado = document.getElementById("asu-estado")?.value;
    const resumen = document.getElementById("asu-resumen")?.value.trim();
    
    // Capturar usando la función adaptativa para evitar fallos por IDs
    const selectAbogado = obtenerSelectAbogadoElemento();
    const abogadoAsignado = selectAbogado ? selectAbogado.value : "";
    
    let listaAsuntos = obtenerAsuntos();
    
    if (id) {
        listaAsuntos = listaAsuntos.map(a => {
            if (String(a.id) === String(id)) {
                return { ...a, clienteId, materia, expediente, juzgado, accion, estado, resumen, abogadoAsignado };
            }
            return a;
        });
    } else {
        const nuevoAsunto = {
            id: Date.now(),
            clienteId,
            materia,
            expediente,
            juzgado,
            accion,
            estado,
            resumen,
            abogadoAsignado, 
            fechaRegistro: new Date().toLocaleDateString('es-MX'),
            actuaciones: [] 
        };
        listaAsuntos.push(nuevoAsunto);
    }
    
    localStorage.setItem("js_legal_asuntos", JSON.stringify(listaAsuntos));
    cerrarModalAsunto();
    cargarAsuntosTabla();
    if (typeof actualizarContadoresDashboard === "function") {
        actualizarContadoresDashboard();
    }
}

// Cargar para Editar - CORREGIDO
function editarAsunto(id) {
    const asuntos = obtenerAsuntos();
    const asunto = asuntos.find(a => a.id == id);
    
    if (asunto) {
        abrirModalAsunto();
        document.getElementById("asunto-modal-titulo").innerText = "Editar Expediente";
        document.getElementById("asunto-id").value = asunto.id;
        document.getElementById("asu-cliente-id").value = asunto.clienteId;
        document.getElementById("asu-materia").value = asunto.materia;
        document.getElementById("asu-expediente").value = asunto.expediente;
        document.getElementById("asu-juzgado").value = asunto.juzgado;
        document.getElementById("asu-accion").value = asunto.accion;
        document.getElementById("asu-estado").value = asunto.estado;
        document.getElementById("asu-resumen").value = asunto.resumen;
        
        const selectAbogado = obtenerSelectAbogadoElemento();
        if (selectAbogado) selectAbogado.value = asunto.abogadoAsignado || "";
    }
}

// Eliminar Asunto
function eliminarAsunto(id) {
    if (confirm("¿Seguro de que deseas eliminar este expediente del sistema?")) {
        let asuntos = obtenerAsuntos();
        asuntos = asuntos.filter(a => a.id != id);
        localStorage.setItem("js_legal_asuntos", JSON.stringify(asuntos));
        cargarAsuntosTabla();
        if (typeof actualizarContadoresDashboard === "function") {
            actualizarContadoresDashboard();
        }
    }
}

// Filtro estricto para la tabla de Clientes según el Rol del usuario activo
function cargarTablaClientes() {
    const tablaCuerpo = document.getElementById("tabla-clientes-cuerpo");
    if (!tablaCuerpo) return;

    const usuarioActivo = JSON.parse(sessionStorage.getItem("js_legal_usuario"));
    if (!usuarioActivo) return;

    let clientes = JSON.parse(localStorage.getItem("js_legal_clientes")) || [];
    const asuntos = obtenerAsuntos();

    // FILTRO DE ROL PARA CLIENTES: El Abogado sólo ve clientes vinculados a expedientes que explícitamente tiene asignados
    if (usuarioActivo.rol === "Abogado") {
        const misClientesIds = asuntos
            .filter(a => a.abogadoAsignado && String(a.abogadoAsignado) === String(usuarioActivo.usuario))
            .map(a => String(a.clienteId));

        clientes = clientes.filter(c => misClientesIds.includes(String(c.id)));
    }

    tablaCuerpo.innerHTML = "";
    
    if (clientes.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1rem;">No tienes clientes asignados o vinculados a tus expedientes.</td></tr>`;
        return;
    }

    clientes.forEach(cliente => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.telefono || 'N/A'}</td>
            <td>${cliente.correo || 'N/A'}</td>
            <td>
                <button onclick="editarCliente(${cliente.id})" style="color: #3b82f6; background:none; border:none; cursor:pointer;">✏️</button>
            </td>
        `;
        tablaCuerpo.appendChild(tr);
    });
}

function abrirBitacoraAsunto(asuntoId) {
    asuntoHistorialIdSeleccionado = asuntoId;
    const asuntos = obtenerAsuntos();
    const asunto = asuntos.find(a => a.id == asuntoId);
    
    if (!asunto) return;
    
    document.getElementById("bitacora-expediente-titulo").innerText = asunto.expediente;
    document.getElementById("modal-bitacora").style.display = "block";
    document.getElementById("form-actuacion").reset();
    
    cargarHistorialActuacionesLista(asunto);
}

function cerrarModalBitacora() {
    document.getElementById("modal-bitacora").style.display = "none";
    asuntoHistorialIdSeleccionado = null;

    const formulario = document.getElementById("form-actuacion");
if (formulario) formulario.style.display = "block";
}

function cargarHistorialActuacionesLista(asunto) {
    const listaContenedor = document.getElementById("bitacora-lista-historico");
    if (!listaContenedor) return;
    
    listaContenedor.innerHTML = "";
    const actuaciones = asunto.actuaciones || [];
    
    if (actuaciones.length === 0) {
        listaContenedor.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No hay actuaciones registradas en este expediente aún.</p>`;
        return;
    }
    
    actuaciones.slice().reverse().forEach((act, index) => {
        const realIndex = actuaciones.length - 1 - index; 
        const div = document.createElement("div");
        div.style.backgroundColor = "#f8fafc";
        div.style.borderLeft = "4px solid #8b5cf6";
        div.style.padding = "0.8rem";
        div.style.marginBottom = "0.5rem";
        div.style.borderRadius = "0 6px 6px 0";
        div.style.display = "flex";
        div.style.justifyContent = "between";
        div.style.alignItems = "start";
        
        div.innerHTML = `
            <div style="flex-grow: 1; margin-right: 10px;">
                <span style="font-size: 0.8rem; font-weight: bold; color: #64748b; display: block;">📅 ${act.fecha}</span>
                <p style="margin: 0.2rem 0 0 0; font-size: 0.9rem; color: #1e293b; line-height: 1.4;">${act.descripcion}</p>
            </div>
            <button onclick="eliminarActuacion(${realIndex})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem;">❌</button>
        `;
        listaContenedor.appendChild(div);
    });
}

function guardarActuacion(e) {
    e.preventDefault();
    if (!asuntoHistorialIdSeleccionado) return;
    
    const descripcion = document.getElementById("act-descripcion").value.trim();
    const fecha = document.getElementById("act-fecha").value;
    
    const fechaFormateada = fecha ? new Date(fecha + "T00:00:00").toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');
    
    let listaAsuntos = obtenerAsuntos();
    
    listaAsuntos = listaAsuntos.map(a => {
        if (String(a.id) === String(asuntoHistorialIdSeleccionado)) {
            if (!a.actuaciones) a.actuaciones = [];
            a.actuaciones.push({ fecha: fechaFormateada, descripcion: descripcion });
        }
        return a;
    });
    
    localStorage.setItem("js_legal_asuntos", JSON.stringify(listaAsuntos));
    
    const asuntoActualizado = listaAsuntos.find(a => a.id == asuntoHistorialIdSeleccionado);
    document.getElementById("form-actuacion").reset();
    cargarHistorialActuacionesLista(asuntoActualizado);
}

function eliminarActuacion(index) {
    if (!confirm("¿Deseas borrar esta actuación del historial?")) return;
    
    let listaAsuntos = obtenerAsuntos();
    listaAsuntos = listaAsuntos.map(a => {
        if (String(a.id) === String(asuntoHistorialIdSeleccionado)) {
            a.actuaciones.splice(index, 1);
        }
        return a;
    });
    
    localStorage.setItem("js_legal_asuntos", JSON.stringify(listaAsuntos));
    
    const asuntoActualizado = listaAsuntos.find(a => a.id == asuntoHistorialIdSeleccionado);
    cargarHistorialActuacionesLista(asuntoActualizado);
}

function actualizarContadoresDashboard() {
    const totalAsuntos = obtenerAsuntos().length;
    const badge = document.getElementById("count-asuntos");
    if (badge) badge.innerText = totalAsuntos;
}