// personal.js
const STORAGE_KEY_PERSONAL = 'js_legal_personal';

// 1. Inicializa el LocalStorage asegurando que la estructura exista sin duplicar datos fijos de auth.js
function inicializarPersonal() {
    let personal = JSON.parse(localStorage.getItem(STORAGE_KEY_PERSONAL));
    if (!personal) {
        personal = []; // Inicializa vacío ya que el catálogo base vive en auth.js
        localStorage.setItem(STORAGE_KEY_PERSONAL, JSON.stringify(personal));
    }
    return personal;
}

// 2. Obtiene la lista actual de personal dinámico
function obtenerPersonal() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_PERSONAL)) || inicializarPersonal();
}

// 3. Renderiza los datos dinámicamente en la tabla del HTML
function renderizarTablaPersonal() {
    const tablaCuerpo = document.getElementById('tabla-personal-cuerpo');
    if (!tablaCuerpo) return;

    // Combinamos la lista estática (si existe) con la dinámica para mostrar todo el personal en la tabla
    const personalBase = typeof USUARIOS_MOCK !== 'undefined' ? USUARIOS_MOCK : [];
    const personalDinamico = obtenerPersonal();
    const listaCompleta = [...personalBase, ...personalDinamico];

    tablaCuerpo.innerHTML = '';

    listaCompleta.forEach(empleado => {
        const esEstatico = empleado.id === "1" || empleado.id === "2"; // Usuarios semilla de auth.js
        const fila = document.createElement('tr');
        fila.style.borderBottom = '1px solid #e2e8f0';
        fila.innerHTML = `
            <td style="padding: 12px 24px; color: #1e293b;">${empleado.nombre}</td>
            <td style="padding: 12px 24px; color: #475569;">${empleado.usuario}</td>
            <td style="padding: 12px 24px;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600; 
                    background: ${empleado.rol === 'Administrador' ? '#fee2e2' : '#dbeafe'}; 
                    color: ${empleado.rol === 'Administrador' ? '#991b1b' : '#1e40af'};">
                    ${empleado.rol}
                </span>
            </td>
            <td style="padding: 12px 24px; text-align: center;">
                ${esEstatico 
                    ? `<span style="color: #94a3b8; font-size: 0.85rem; font-style: italic;">Protegido (Sistema)</span>`
                    : `<button onclick="editarPersonal('${empleado.id}')" style="background: #e2e8f0; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; color: #475569; margin-right: 5px;">✏️ Editar</button>
                       <button onclick="eliminarPersonal('${empleado.id}')" style="background: #fee2e2; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; color: #991b1b;">🗑️ Eliminar</button>`
                }
            </td>
        `;
        tablaCuerpo.appendChild(fila);
    });

    if (typeof actualizarSelectAbogadosAsignados === 'function') {
        actualizarSelectAbogadosAsignados();
    }
}

// 4. Controladores del Modal
function abrirModalPersonal() {
    const modal = document.getElementById('modal-personal');
    if (modal) {
        document.getElementById('personal-id').value = '';
        document.getElementById('form-alta-personal').reset();
        document.getElementById('personal-usuario').disabled = false;
        document.getElementById('modal-personal-titulo').textContent = 'Alta de Personal';
        modal.style.display = 'flex';
    }
}

function cerrarModalPersonal() {
    const modal = document.getElementById('modal-personal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('form-alta-personal').reset();
    }
}

// 5. Guarda o actualiza los datos del formulario
function guardarPersonal(event) {
    event.preventDefault();

    const id = document.getElementById('personal-id').value;
    const nombre = document.getElementById('personal-nombre').value.trim();
    const usuario = document.getElementById('personal-usuario').value.trim().toLowerCase();
    const pass = document.getElementById('personal-pass').value;
    const rol = document.getElementById('personal-rol').value;

    let listaPersonal = obtenerPersonal();
    const personalBase = typeof USUARIOS_MOCK !== 'undefined' ? USUARIOS_MOCK : [];

    // Validar duplicados tanto en la lista dinámica como en la estática de auth.js
    const existeEnBase = personalBase.some(emp => emp.usuario === usuario);
    const existeEnDinamica = listaPersonal.some(emp => emp.usuario === usuario && emp.id !== id);

    if (existeEnBase || existeEnDinamica) {
        alert('El nombre de usuario ya está registrado en el sistema. Elige otro.');
        return;
    }

    if (id) {
        // Modo edición
        listaPersonal = listaPersonal.map(emp => {
            if (emp.id === id) return { id, nombre, usuario, pass, rol };
            return emp;
        });
        alert('Datos de personal actualizados correctamente.');
    } else {
        // Modo alta nueva
        const nuevoEmpleado = {
            id: "emp-" + Date.now(),
            nombre,
            usuario,
            pass,
            rol
        };
        listaPersonal.push(nuevoEmpleado);
        alert('Personal dado de alta con éxito.');
    }

    localStorage.setItem(STORAGE_KEY_PERSONAL, JSON.stringify(listaPersonal));
    cerrarModalPersonal();
    renderizarTablaPersonal();
}

// 6. Edición de un registro existente
function editarPersonal(id) {
    const listaPersonal = obtenerPersonal();
    const empleado = listaPersonal.find(emp => emp.id === id);

    if (!empleado) return;

    document.getElementById('personal-id').value = empleado.id;
    document.getElementById('personal-nombre').value = empleado.nombre;
    document.getElementById('personal-usuario').value = empleado.usuario;
    document.getElementById('personal-pass').value = empleado.pass;
    document.getElementById('personal-rol').value = empleado.rol;

    document.getElementById('modal-personal-titulo').textContent = 'Modificar Personal';
    
    const modal = document.getElementById('modal-personal');
    if (modal) modal.style.display = 'flex';
}

// 7. Baja de un registro
function eliminarPersonal(id) {
    let listaPersonal = obtenerPersonal();
    
    const empleadoAEliminar = listaPersonal.find(emp => emp.id === id);
    if (empleadoAEliminar && empleadoAEliminar.rol === 'Administrador') {
        const totalAdmins = listaPersonal.filter(emp => emp.rol === 'Administrador').length;
        if (totalAdmins <= 1) {
            alert('No se puede eliminar este perfil si es el único administrador dinámico activo.');
            return;
        }
    }

    if (confirm('¿Estás seguro de que deseas dar de baja a este elemento del personal?')) {
        listaPersonal = listaPersonal.filter(emp => emp.id !== id);
        localStorage.setItem(STORAGE_KEY_PERSONAL, JSON.stringify(listaPersonal));
        renderizarTablaPersonal();
    }
}

// Ejecutar al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    inicializarPersonal();
    renderizarTablaPersonal();
});