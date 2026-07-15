// 1. Catálogo Base de Usuarios (Hardcoded)
const USUARIOS_MOCK = [
    {
        id: "1",
        usuario: "jorge.sanchez",
        nombre: "Jorge Sánchez Flores",
        rol: "Administrador",
        pass: "admin2026"
    },
    {
        id: "2",
        usuario: "abogado.demo",
        nombre: "Lic. Alejandro Martínez",
        rol: "Abogado",
        pass: "abogado123"
    }
];

// 2. Manejador del Formulario de Login Centralizado
function procesarLogin(e) {
    if (e) e.preventDefault();
    
    const usuarioInput = document.getElementById('usuario').value.trim().toLowerCase();
    const passwordInput = document.getElementById('password').value;
    
    console.log("Intentando iniciar sesión con:", usuarioInput);
    
    // Obtener el personal dinámico creado desde la App
    const personalRegistrado = JSON.parse(localStorage.getItem("js_legal_personal")) || [];
    
    // Combinamos el catálogo base con el del LocalStorage
    const todoElPersonal = [...USUARIOS_MOCK, ...personalRegistrado];
    
    // Buscar coincidencia en la lista unificada de personal administrativo/abogados
    let usuarioValido = todoElPersonal.find(u => {
        if (!u.usuario) return false;
        // Validamos que coincida el usuario y soportamos tanto 'pass' como 'password'
        const passwordAlmacenado = u.pass || u.password;
        return u.usuario.toLowerCase() === usuarioInput && passwordAlmacenado === passwordInput;
    });
    
    // Si no es interno, buscar en clientes de LocalStorage
    if (!usuarioValido) {
        const clientesRegistrados = JSON.parse(localStorage.getItem("js_legal_clientes")) || [];
        
        // Limpieza absoluta para evitar fallos por espacios o puntos (ej: "juan sanchez" -> "juansanchez")
        const inputLimpio = usuarioInput.normalize("NFD")
                                        .replace(/[\u0300-\u036f]/g, "")
                                        .replace(/\s+/g, '')
                                        .replace(/\./g, '');

        const clienteEncontrado = clientesRegistrados.find(c => {
            if (!c.nombre) return false;
            
            const nombreBD = c.nombre.toLowerCase()
                                     .normalize("NFD")
                                     .replace(/[\u0300-\u036f]/g, "")
                                     .replace(/\s+/g, '')
                                     .replace(/\./g, '');
                                     
            const correoBD = c.correo ? c.correo.toLowerCase().trim() : "";
            
            return inputLimpio === nombreBD || usuarioInput === correoBD;
        });

        if (clienteEncontrado) {
            console.log("Cliente encontrado en la base de datos:", clienteEncontrado.nombre);
            
            if (passwordInput === clienteEncontrado.password) {
                usuarioValido = {
                    id: clienteEncontrado.id,
                    nombre: clienteEncontrado.nombre,
                    rol: "Cliente",
                    usuario: clienteEncontrado.correo || inputLimpio
                };
            }
        }
    }
    
    // Ejecución del inicio de sesión o alerta de error
    if (usuarioValido) {
        const sesion = {
            id: usuarioValido.id,
            nombre: usuarioValido.nombre,
            rol: usuarioValido.rol,
            usuario: usuarioValido.usuario, // Conservamos el nombre de usuario para los filtros de asignación
            token: "tk_" + Math.random().toString(36).substring(2, 11)
        };
        
        localStorage.setItem('js_legal_session', JSON.stringify(sesion));
        sessionStorage.setItem('js_legal_usuario', JSON.stringify(sesion));
        
        console.log("Redirigiendo a la aplicación con rol:", usuarioValido.rol);
        window.location.href = 'dashboard.html';
    } else {
        alert('❌ Usuario o contraseña incorrectos. Verifica tus datos.');
    }
}

// Vinculación segura de eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    // CORRECCIÓN: Escuchar ÚNICAMENTE el submit del formulario maneja tanto clicks como 'Enter' de forma limpia
    document.getElementById('login-form')?.addEventListener('submit', procesarLogin);
});

// 3. Guardián de Seguridad
function verificarSesion() {
    const sesionData = localStorage.getItem('js_legal_session') || sessionStorage.getItem('js_legal_usuario');
    
    if (!sesionData) {
        if (!window.location.href.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return null;
    }
    
    const usuarioActivo = JSON.parse(sesionData);
    sessionStorage.setItem('js_legal_usuario', JSON.stringify(usuarioActivo));
    return usuarioActivo;
}

// 4. Salida Segura
function cerrarSesion() {
    localStorage.removeItem('js_legal_session');
    sessionStorage.removeItem('js_legal_usuario');
    window.location.href = 'index.html';
}