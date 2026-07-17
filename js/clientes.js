/**
 * JS LegalTech Control - Módulo de Clientes
 * CRUD (Crear, Leer, Actualizar, Borrar) en LocalStorage.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Si existe la tabla del listado de administración, la cargamos
    if (document.getElementById("tabla-clientes-cuerpo")) {
        cargarClientesTabla();
    }
    
    // Carga automáticamente el Portal de Consulta Ciudadana si el cliente inició sesión
    cargarAsuntosConsultaCiudadana();
    
    // Escuchar el guardado del formulario si existe en el HTML
    document.getElementById("form-cliente")?.addEventListener("submit", guardarCliente);
});

// Obtener clientes guardados o inicializar vacío
function obtenerClientes() {
    const clientes = localStorage.getItem("js_legal_clientes");
    return clientes ? JSON.parse(clientes) : [];
}

// FUNCIÓN CORREGIDA: Cargar expedientes usando el ID real del HTML del Portal
function cargarAsuntosConsultaCiudadana() {
    const contenedorTabla = document.getElementById("tabla-portal-cuerpo");
    if (!contenedorTabla) return;

    // Obtener los datos de sesión activa
    const sesionData = localStorage.getItem('js_legal_session') || sessionStorage.getItem('js_legal_usuario');
    const usuarioActivo = sesionData ? JSON.parse(sesionData) : null;
    const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];
    
    contenedorTabla.innerHTML = "";

    if (usuarioActivo) {
        const idUsuario = String(usuarioActivo.id || usuarioActivo.usuario || '').toLowerCase().trim();
        const idLimpio = idUsuario.replace('cli-', '');
        const nombreUsuarioActivo = String(usuarioActivo.nombre || '').toLowerCase().trim();

        // Filtrar asuntos cruzando ID de manera flexible
        const asuntosFiltrados = asuntos.filter(a => {
            if (!a.clienteId && !a.cliente) return false;
            
            const idClienteAsunto = String(a.clienteId || '').toLowerCase().trim();
            const idClienteAsuntoLimpio = idClienteAsunto.replace('cli-', '');
            const nombreClienteAsunto = String(a.cliente || '').toLowerCase().trim();

            return idClienteAsunto === idUsuario || 
                   idClienteAsuntoLimpio === idLimpio || 
                   nombreClienteAsunto.includes(idLimpio) ||
                   (nombreUsuarioActivo && nombreClienteAsunto.includes(nombreUsuarioActivo)) ||
                   idUsuario.includes(idClienteAsuntoLimpio);
        });

        if (asuntosFiltrados.length === 0) {
            contenedorTabla.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted); background: white;">
                        No se encontraron asuntos vigentes registrados a su nombre en este momento.
                    </td>
                </tr>
            `;
            return;
        }

        // Renderizar expedientes que coincidan
        asuntosFiltrados.forEach(a => {
            const fila = document.createElement("tr");
            fila.style.borderBottom = "1px solid var(--border-color)";
            
            const exp = a.expediente || 'S/N';
            const mat = a.materia || a.juicio || 'General';
            const juz = a.juzgado || a.organo || 'No especificado';
            const est = a.estado || 'En Trámite';
            const act = a.ultimaActualizacion || a.resumen || 'Sin actualizaciones recientes';



           fila.innerHTML = `
    <td style="padding: 12px; font-weight: 600; color: var(--primary-color);">${exp}</td>
    <td style="padding: 12px;">${mat}</td>
    <td style="padding: 12px;">${juz}</td>
    <td style="padding: 12px;">
        <span style="background:#e0f2fe;color:#0369a1;padding:4px 8px;border-radius:50px;font-size:13px;font-weight:600;">
            ${est}
        </span>
    </td>
    <td style="padding: 12px; font-size: 14px; color: var(--text-muted);">${act}</td>
    <td style="padding: 12px; text-align:center;">
        <button
            type="button"
            onclick="abrirBitacoraCliente('${a.id}')"
            style="background:#8b5cf6;color:white;border:none;padding:7px 12px;border-radius:5px;cursor:pointer;font-weight:600;">
            📜 Línea de tiempo
        </button>
    </td>
`;




            contenedorTabla.appendChild(fila);
        });
    }
}

// Abrir el formulario de registro/edición
function abrirModalCliente() {
    document.getElementById("modal-cliente").style.display = "block";
    document.getElementById("modal-titulo").innerText = "Registrar Nuevo Cliente";
    document.getElementById("form-cliente").reset();
    document.getElementById("cliente-id").value = "";
    document.getElementById("cli-password").value = ""; 
}

// Cerrar el formulario
function cerrarModalCliente() {
    document.getElementById("modal-cliente").style.display = "none";
}

// Guardar o Editar un Cliente
function guardarCliente(event) {
    event.preventDefault();
    
    const id = document.getElementById('cliente-id').value;
    const nombre = document.getElementById('cli-nombre').value.trim();
    const curp = document.getElementById('cli-curp').value.trim();
    const telefono = document.getElementById('cli-telefono').value.trim();
    const correo = document.getElementById('cli-correo').value.trim();
    const direccion = document.getElementById('cli-direccion').value.trim();
    const password = document.getElementById('cli-password').value;
    const abogadoId = document.getElementById('cliente-abogado').value;

    let listaClientes = obtenerClientes();
    
    if (id) {
        // Modo Edición: Actualizar cliente existente
        listaClientes = listaClientes.map(c => {
            if (String(c.id) === String(id)) {
                const nuevaPassword = password || c.password || "cliente123";
                return { 
                    ...c, 
                    nombre, 
                    curp, 
                    telefono, 
                    correo, 
                    direccion, 
                    abogadoAsignado: abogadoId, 
                    password: nuevaPassword 
                };
            }
            return c;
        });
        alert('Cliente actualizado con éxito.');
    } else {
        // Modo Creación: Guardamos un registro nuevo
        const nuevoCliente = {
            id: "cli-" + Date.now(), 
            nombre: nombre,
            curp: curp,
            telefono: telefono,
            correo: correo,
            direccion: direccion,
            abogadoAsignado: abogadoId,
            password: password || "cliente123"
        };
        listaClientes.push(nuevoCliente);
        alert('Cliente registrado con éxito.');
    }
    
    localStorage.setItem("js_legal_clientes", JSON.stringify(listaClientes));
    cerrarModalCliente();
    cargarClientesTabla();
    
    if (typeof actualizarContadoresDashboard === "function") {
        actualizarContadoresDashboard();
    }
}

// Renderizar tabla de clientes con botones de Editar y Eliminar claros
function cargarClientesTabla() {
    const contenedorTabla = document.getElementById("tabla-clientes-cuerpo");
    if (!contenedorTabla) return;

    const clientes = obtenerClientes();
    contenedorTabla.innerHTML = "";

    if (clientes.length === 0) {
        contenedorTabla.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b; background: white;">
                    No hay clientes registrados en el directorio.
                </td>
            </tr>
        `;
        return;
    }

    clientes.forEach(cliente => {
        const fila = document.createElement("tr");
        fila.style.borderBottom = "1px solid #e2e8f0";
        fila.style.backgroundColor = "white";

        fila.innerHTML = `
            <td style="padding: 1rem; color: #1e293b; font-weight: 500;">${cliente.nombre || 'Sin nombre'}</td>
            <td style="padding: 1rem; color: #475569;">${cliente.curp || 'No provista'}</td>
            <td style="padding: 1rem; color: #475569;">${cliente.telefono || 'S/N'}</td>
            <td style="padding: 1rem; color: #475569;">${cliente.correo || 'S/N'}</td>
            <td style="padding: 1rem; text-align: center; display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                <button onclick="editarCliente('${cliente.id}')" style="background: #3b82f6; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.85rem; cursor: pointer; font-weight: 500;">
                    ✏️ Editar
                </button>
                <button onclick="eliminarCliente('${cliente.id}')" style="background: #ef4444; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.85rem; cursor: pointer; font-weight: 500;">
                    🗑️ Eliminar
                </button>
            </td>
        `;
        contenedorTabla.appendChild(fila);
    });
}

// Cargar datos para editar
function editarCliente(id) {
    const clientes = obtenerClientes();
    const cliente = clientes.find(c => String(c.id) === String(id)); 
    
    if (cliente) {
        abrirModalCliente();
        document.getElementById("modal-titulo").innerText = "Editar Cliente";
        document.getElementById("cliente-id").value = cliente.id;
        document.getElementById("cli-nombre").value = cliente.nombre;
        document.getElementById("cli-curp").value = cliente.curp || "";
        document.getElementById("cli-telefono").value = cliente.telefono;
        document.getElementById("cli-correo").value = cliente.correo;
        document.getElementById("cli-direccion").value = cliente.direccion;
        document.getElementById("cliente-abogado").value = cliente.abogadoAsignado || "";
        document.getElementById("cli-password").value = cliente.password || "";
    }
}

// Eliminar un cliente
function eliminarCliente(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.")) {
        let clientes = obtenerClientes();
        clientes = clientes.filter(c => String(c.id) !== String(id));
        localStorage.setItem("js_legal_clientes", JSON.stringify(clientes));
        cargarClientesTabla();
        if (typeof actualizarContadoresDashboard === "function") {
            actualizarContadoresDashboard();
        }
    }
}

// Actualizar contadores del panel superior
function actualizarContadoresDashboard() {
    const totalClientes = obtenerClientes().length;
    const badge = document.getElementById("count-clientes");
    if (badge) badge.innerText = totalClientes;
}

function abrirBitacoraCliente(asuntoId) {
    const asuntos =
        JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];

    const asunto = asuntos.find(
        a => String(a.id) === String(asuntoId)
    );

    if (!asunto) {
        alert("No se encontró el expediente.");
        return;
    }

    const modal = document.getElementById("modal-bitacora");
    const titulo = document.getElementById("bitacora-expediente-titulo");
    const formulario = document.getElementById("form-actuacion");
    const botonPDF = document.getElementById("btn-descargar-pdf");

    if (!modal) {
        console.error("No existe el modal-bitacora.");
        return;
    }

    /*
     * El modal está originalmente dentro de vista-asuntos.
     * Lo movemos al body para que también pueda mostrarse
     * desde el Portal del Cliente.
     */
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    if (titulo) {
        titulo.innerText = asunto.expediente || "Sin número";
    }

    // Cliente: solo lectura
    if (formulario) {
        formulario.style.display = "none";
    }

    if (botonPDF) {
        botonPDF.style.display = "inline-block";
    }

    renderizarActuacionesCliente(asunto.actuaciones || []);

    modal.style.display = "block";
}

window.abrirBitacoraCliente = abrirBitacoraCliente;


function renderizarActuacionesCliente(actuaciones) {

    const lista = document.getElementById("bitacora-lista-historico");

    if (!lista) {
        console.error("No existe el contenedor bitacora-lista-historico");
        return;
    }

    lista.innerHTML = "";

    if (!actuaciones || actuaciones.length === 0) {
        lista.innerHTML = "<p>No hay actuaciones registradas.</p>";
        return;
    }


    actuaciones.slice().reverse().forEach(act => {

        const div = document.createElement("div");

        div.style.padding = "0.8rem";
        div.style.borderBottom = "1px solid #eee";

        div.innerHTML = `
            <strong>${act.fecha}</strong>
            <br>
            ${act.descripcion}
        `;

        lista.appendChild(div);

    });
}

function actualizarSelectAbogadosAsignados() {
    const select = document.getElementById('cliente-abogado');
    if (!select) return;

    const listaPersonal = JSON.parse(localStorage.getItem('js_legal_personal')) || [];
    const abogados = listaPersonal.filter(emp => emp.rol === 'Abogado');

    select.innerHTML = '<option value="">-- Sin abogado asignado --</option>';
    abogados.forEach(ab => {
        const opt = document.createElement('option');
        opt.value = ab.id;
        opt.textContent = ab.nombre;
        select.appendChild(opt);
    });
}

// ==========================================
// EXPOSICIÓN GLOBAL PARA PREVENIR ERRORES DE ALCANCE (SCOPE)
// ==========================================
window.editarCliente = editarCliente;
window.eliminarCliente = eliminarCliente;
window.abrirModalCliente = abrirModalCliente;
window.cerrarModalCliente = cerrarModalCliente;
window.abrirBitacoraCliente = abrirBitacoraCliente;