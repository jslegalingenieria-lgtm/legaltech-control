// personal.js
const STORAGE_KEY_PERSONAL = 'js_legal_personal';

// 1. Inicializa el almacenamiento local.
// Se conserva este mecanismo para no romper el login actual por usuario y contraseña.
function inicializarPersonal() {
    let personal = JSON.parse(localStorage.getItem(STORAGE_KEY_PERSONAL));

    if (!Array.isArray(personal)) {
        personal = [];
        localStorage.setItem(STORAGE_KEY_PERSONAL, JSON.stringify(personal));
    }

    return personal;
}

// 2. Obtiene la lista actual de personal dinámico.
function obtenerPersonal() {
    const personal = JSON.parse(localStorage.getItem(STORAGE_KEY_PERSONAL));
    return Array.isArray(personal) ? personal : inicializarPersonal();
}

// Escapa texto antes de insertarlo en HTML.
function escaparHTML(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// 3. Renderiza la tabla de Personal.
function renderizarTablaPersonal() {
    const tablaCuerpo = document.getElementById('tabla-personal-cuerpo');
    if (!tablaCuerpo) return;

    const personalBase = typeof USUARIOS_MOCK !== 'undefined' ? USUARIOS_MOCK : [];
    const personalDinamico = obtenerPersonal();
    const listaCompleta = [...personalBase, ...personalDinamico];

    tablaCuerpo.innerHTML = '';

    listaCompleta.forEach(empleado => {
        const esEstatico = empleado.id === '1' || empleado.id === '2';
        const estado = empleado.estado || 'Activo';
        const correo = empleado.correo || 'Sin correo registrado';

        const fila = document.createElement('tr');
        fila.style.borderBottom = '1px solid #e2e8f0';

        fila.innerHTML = `
            <td style="padding: 12px 24px; color: #1e293b;">${escaparHTML(empleado.nombre)}</td>
            <td style="padding: 12px 24px; color: #475569;">${escaparHTML(correo)}</td>
            <td style="padding: 12px 24px; color: #475569;">${escaparHTML(empleado.usuario)}</td>
            <td style="padding: 12px 24px;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;
                    background: ${empleado.rol === 'Administrador' ? '#fee2e2' : '#dbeafe'};
                    color: ${empleado.rol === 'Administrador' ? '#991b1b' : '#1e40af'};">
                    ${escaparHTML(empleado.rol)}
                </span>
            </td>
            <td style="padding: 12px 24px;">
                <span style="padding: 4px 8px; border-radius: 999px; font-size: 0.82rem; font-weight: 600;
                    background: ${estado === 'Activo' ? '#dcfce7' : '#f1f5f9'};
                    color: ${estado === 'Activo' ? '#166534' : '#64748b'};">
                    ${escaparHTML(estado)}
                </span>
            </td>
            <td style="padding: 12px 24px; text-align: center;">
                ${esEstatico
                    ? '<span style="color: #94a3b8; font-size: 0.85rem; font-style: italic;">Protegido (Sistema)</span>'
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

// 4. Controladores del modal.
function abrirModalPersonal() {
    const modal = document.getElementById('modal-personal');
    const form = document.getElementById('form-alta-personal');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('personal-id').value = '';
    document.getElementById('personal-usuario').disabled = false;
    document.getElementById('personal-estado').value = 'Activo';
    document.getElementById('modal-personal-titulo').textContent = 'Alta de Personal';
    modal.style.display = 'flex';
}

function cerrarModalPersonal() {
    const modal = document.getElementById('modal-personal');
    const form = document.getElementById('form-alta-personal');

    if (modal) modal.style.display = 'none';
    if (form) form.reset();
}

// 5. Guarda o actualiza los datos del formulario.
function guardarPersonal(event) {
    event.preventDefault();

    const id = document.getElementById('personal-id').value;
    const nombre = document.getElementById('personal-nombre').value.trim();
    const correo = document.getElementById('personal-correo').value.trim().toLowerCase();
    const usuario = document.getElementById('personal-usuario').value.trim().toLowerCase();
    const pass = document.getElementById('personal-pass').value;
    const rol = document.getElementById('personal-rol').value;
    const estado = document.getElementById('personal-estado').value;

    if (!nombre || !correo || !usuario || !pass || !rol || !estado) {
        alert('Completa todos los campos.');
        return;
    }

    let listaPersonal = obtenerPersonal();
    const personalBase = typeof USUARIOS_MOCK !== 'undefined' ? USUARIOS_MOCK : [];

    const existeUsuarioEnBase = personalBase.some(
        emp => String(emp.usuario || '').toLowerCase() === usuario
    );

    const existeUsuarioEnDinamica = listaPersonal.some(
        emp => String(emp.usuario || '').toLowerCase() === usuario && emp.id !== id
    );

    if (existeUsuarioEnBase || existeUsuarioEnDinamica) {
        alert('El nombre de usuario ya está registrado en el sistema. Elige otro.');
        return;
    }

    const existeCorreoEnDinamica = listaPersonal.some(
        emp => String(emp.correo || '').toLowerCase() === correo && emp.id !== id
    );

    if (existeCorreoEnDinamica) {
        alert('El correo electrónico ya está registrado para otro usuario.');
        return;
    }

    const ahora = new Date().toISOString();

    if (id) {
        listaPersonal = listaPersonal.map(emp => {
            if (emp.id !== id) return emp;

            return {
                ...emp,
                id,
                nombre,
                correo,
                usuario,
                pass,
                rol,
                estado,
                fechaAlta: emp.fechaAlta || ahora,
                fechaModificacion: ahora
            };
        });

        alert('Datos de personal actualizados correctamente.');
    } else {
        const nuevoEmpleado = {
            id: 'emp-' + Date.now(),
            nombre,
            correo,
            usuario,
            pass,
            rol,
            estado,
            fechaAlta: ahora,
            fechaModificacion: ahora
        };

        listaPersonal.push(nuevoEmpleado);
        alert('Personal dado de alta con éxito.');
    }

    localStorage.setItem(STORAGE_KEY_PERSONAL, JSON.stringify(listaPersonal));
    cerrarModalPersonal();
    renderizarTablaPersonal();
}

// 6. Edición de un registro existente.
function editarPersonal(id) {
    const listaPersonal = obtenerPersonal();
    const empleado = listaPersonal.find(emp => emp.id === id);

    if (!empleado) return;

    document.getElementById('personal-id').value = empleado.id;
    document.getElementById('personal-nombre').value = empleado.nombre || '';
    document.getElementById('personal-correo').value = empleado.correo || '';
    document.getElementById('personal-usuario').value = empleado.usuario || '';
    document.getElementById('personal-pass').value = empleado.pass || '';
    document.getElementById('personal-rol').value = empleado.rol || 'Abogado';
    document.getElementById('personal-estado').value = empleado.estado || 'Activo';

    document.getElementById('modal-personal-titulo').textContent = 'Modificar Personal';

    const modal = document.getElementById('modal-personal');
    if (modal) modal.style.display = 'flex';
}

// 7. Baja de un registro.
function eliminarPersonal(id) {
    let listaPersonal = obtenerPersonal();

    const empleadoAEliminar = listaPersonal.find(emp => emp.id === id);

    if (empleadoAEliminar && empleadoAEliminar.rol === 'Administrador') {
        const totalAdminsActivos = listaPersonal.filter(
            emp => emp.rol === 'Administrador' && (emp.estado || 'Activo') === 'Activo'
        ).length;

        if (totalAdminsActivos <= 1) {
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

// Ejecutar al cargar el documento.
document.addEventListener('DOMContentLoaded', () => {
    inicializarPersonal();
    renderizarTablaPersonal();
});
