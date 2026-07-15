/**
 * JS LegalTech Control - Módulo de Portal de Consulta (Clientes)
 */

// 1. Inyección con ID ÚNICO e INMUNE para el Portal de Clientes
function inicializarModalBitacoraPortal() {
    if (document.getElementById("modal-bitacora-portal")) return;
    
    const div = document.createElement("div");
    div.id = "modal-bitacora-portal";
    div.style.cssText = "display:none; position:fixed; z-index:999999; left:0; top:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); overflow-y:auto;";
    div.innerHTML = `
        <div id="pdf-contenedor-impresion" style="background:#fff; margin:6% auto; padding:2.5rem; width:92%; max-width:550px; border-radius:12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); position:relative; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            
            <!-- Cabecera del Modal -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:1.2rem; margin-bottom:1.5rem;">
                <h3 style="margin:0; font-size:1.35rem; font-weight:700; color:#1e293b; letter-spacing:-0.025em;">
                    Historial del Expediente: <span id="portal-expediente-titulo" style="color:#8b5cf6;"></span>
                </h3>
                <!-- Este bloque contiene los botones de acción superior (se ocultará automáticamente en el PDF) -->
                <div data-html2pdf-ignore="true" style="display:flex; align-items:center; gap:1rem;">
                    <button onclick="window.descargarBitacoraPDF()" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem; display:inline-flex; align-items:center; gap:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                        📥 PDF
                    </button>
                    <span onclick="window.cerrarModalBitacoraPortal()" style="cursor:pointer; font-size:1.75rem; font-weight:500; color:#94a3b8; line-height:1;">&times;</span>
                </div>
            </div>
            
            <!-- Contenedor de la Línea de Tiempo -->
            <div id="portal-lista-historico" style="max-height:400px; overflow-y:auto; padding: 0.5rem 0.5rem 0.5rem 1.5rem; position:relative; border-left: 2px solid #e2e8f0; margin-left: 0.5rem;"></div>
            
            <!-- Pie de página corporativo exclusivo para el PDF (oculto en la pantalla) -->
            <div id="pdf-pie-pagina" style="display:none; text-align:center; margin-top:2.5rem; padding-top:1rem; border-top:1px solid #f1f5f9; color:#94a3b8; font-size:0.75rem;">
                Documento generado automáticamente por JS LegalTech Control.
            </div>
        </div>
    `;
    document.body.appendChild(div);
}

// Inicialización en cadena
document.addEventListener("DOMContentLoaded", () => {
    inicializarModalBitacoraPortal();
    ejecutarCargaPortal();
});

setTimeout(ejecutarCargaPortal, 200);

function ejecutarCargaPortal() {
    inicializarModalBitacoraPortal();
    const usuarioActivo = JSON.parse(sessionStorage.getItem("js_legal_usuario"));
    if (usuarioActivo && usuarioActivo.rol === "Cliente") {
        cargarExpedientesClientePortal(usuarioActivo.id, usuarioActivo.nombre);
    }
}

function cargarExpedientesClientePortal(clienteId, clienteNombre) {
    const tablaCuerpo = document.getElementById("tabla-portal-cuerpo");
    if (!tablaCuerpo) return;

    const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];
    
    const misAsuntos = asuntos.filter(a => {
        const matchId = a.clienteId && String(a.clienteId).trim() === String(clienteId).trim();
        const matchNombre = a.cliente && clienteNombre && String(a.cliente).toLowerCase().trim() === String(clienteNombre).toLowerCase().trim();
        return matchId || matchNombre;
    });

    if (misAsuntos.length > 0 && tablaCuerpo.children.length === misAsuntos.length) {
        return; 
    }

    tablaCuerpo.innerHTML = "";

    if (misAsuntos.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem;">No hay expedientes vinculados a su cuenta.</td></tr>`;
        return;
    }

    misAsuntos.forEach(a => {
        const fila = document.createElement("tr");
        fila.style.borderBottom = "1px solid var(--border-color)";

        let badgeColor = "#3b82f6";
        if (a.estado === "Concluido") badgeColor = "#10b981";
        if (a.estado === "Suspendido") badgeColor = "#f59e0b";

        const idAsuntoSeguro = a.id || a.expediente || "REF_FALTA";

        fila.innerHTML = `
            <td style="padding: 1rem;">${a.expediente || ''}</td>
            <td style="padding: 1rem;">${a.accion || a.materia || ''}</td>
            <td style="padding: 1rem;">${a.juzgado || ''}</td>
            <td style="padding: 1rem;"><span style="color: ${badgeColor}; font-weight: 600;">${a.estado || 'En Curso'}</span></td>
            <td style="padding: 1rem;">${a.resumen || "Sin resumen"}</td>
            <td style="padding: 1rem;">
                <a href="javascript:void(0)" onclick="window.abrirBitacoraClientePortal('${idAsuntoSeguro}')" style="display: inline-block; background: #8b5cf6; color: white; text-decoration: none; padding: 6px 12px; border-radius: 4px; font-weight: 500; font-size: 13px; text-align: center;">Ver Bitácora</a>
            </td>
        `;
        tablaCuerpo.appendChild(fila);
    });
}

let expedienteActivoParaPDF = "expediente";

function abrirBitacoraClientePortal(asuntoId) {
    inicializarModalBitacoraPortal();

    const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos")) || [];
    const asunto = asuntos.find(a => String(a.id) === String(asuntoId) || String(a.expediente) === String(asuntoId));
    
    if (!asunto) return;

    expedienteActivoParaPDF = asunto.expediente || "expediente";

    const modal = document.getElementById("modal-bitacora-portal");
    if (modal) {
        document.getElementById("portal-expediente-titulo").innerText = expedienteActivoParaPDF;
        modal.style.display = "block";
        
        const historialActuaciones = asunto.actuaciones || asunto.bitacora || [];
        renderizarActuacionesPortal(historialActuaciones);
    }
}

function renderizarActuacionesPortal(actuaciones) {
    const lista = document.getElementById("portal-lista-historico");
    if (!lista) return;
    lista.innerHTML = "";
    
    if (actuaciones.length === 0) {
        lista.style.borderLeft = "none";
        lista.innerHTML = `
            <div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">📋</div>
                <p style="margin:0; font-size:0.95rem;">No hay actualizaciones registradas en este expediente todavía.</p>
            </div>`;
        return;
    }

    lista.style.borderLeft = "2px solid #e2e8f0";

    actuaciones.slice().reverse().forEach((act, index) => {
        const div = document.createElement("div");
        div.style.cssText = "position:relative; margin-bottom:1.75rem;";
        
        const fechaNota = act.fecha || act.date || "Sin fecha";
        const descNota = act.descripcion || act.nota || act.texto || "";
        
        const esUltima = index === 0;
        const puntoColor = esUltima ? "#8b5cf6" : "#cbd5e1"; // Usamos el morado de tu identidad de marca
        const puntoSombra = esUltima ? "box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);" : "";

        div.innerHTML = `
            <!-- Punto de la línea de tiempo perfectamente centrado con la primera línea de la caja -->
            <div style="position:absolute; left:-22px; top:20px; width:10px; height:10px; border-radius:50%; background:${puntoColor}; border:2px solid #fff; ${puntoSombra} z-index: 2;"></div>
            
            <!-- Bloque de contenido estilizado -->
            <div style="background:#f8fafc; padding:1.2rem; border-radius:8px; border:1px solid #e2e8f0;">
                <div style="margin-bottom: 0.6rem; display:flex; align-items:center; gap:0.6rem; flex-wrap: wrap;">
                    <span style="font-size:0.75rem; font-weight:600; background:#fff; border:1px solid #e2e8f0; padding:4px 10px; border-radius:6px; color:#475569; display:inline-flex; align-items:center; gap:4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        📅 ${fechaNota}
                    </span>
                    ${esUltima ? '<span style="font-size:0.7rem; font-weight:700; background:#f5f3ff; color:#6d28d9; border: 1px solid #ddd6fe; padding:3px 8px; border-radius:6px;">Última Actualización</span>' : ''}
                </div>
                <p style="color:#1e293b; font-size:0.95rem; margin:0; line-height:1.6; font-weight:500; font-family: inherit;">
                    ${descNota}
                </p>
            </div>
        `;
        lista.appendChild(div);
    });
}

function cerrarModalBitacoraPortal() {
    const modal = document.getElementById("modal-bitacora-portal");
    if (modal) modal.style.display = "none";
}

// Publicación global limpia
window.abrirBitacoraClientePortal = abrirBitacoraClientePortal;
window.cerrarModalBitacoraPortal = cerrarModalBitacoraPortal;

// 3. Función del Motor de Generación de PDF
function descargarBitacoraPDF() {
    const elemento = document.getElementById("pdf-contenedor-impresion");
    const piePagina = document.getElementById("pdf-pie-pagina");
    const listaHistorico = document.getElementById("portal-lista-historico");
    
    if (!elemento) return;

    // Ajustes estéticos temporales para que el PDF no corte las barras de scroll ni los fondos
    if (piePagina) piePagina.style.display = "block";
    if (listaHistorico) {
        listaHistorico.style.maxHeight = "none"; // Quita el límite de altura para que salgan todas las notas en el PDF
        listaHistorico.style.overflowY = "visible";
    }

    // Configuración del motor html2pdf
    const opciones = {
        margin:       [15, 15, 15, 15], // Márgenes físicos en el documento [arriba, izquierda, abajo, derecha]
        filename:     `Bitacora_Expediente_${expedienteActivoParaPDF.replace(/\//g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    // Ejecución de la promesa de descarga
    html2pdf().set(opciones).from(elemento).save().then(() => {
        // Restaurar la vista del modal en pantalla después de la captura
        if (piePagina) piePagina.style.display = "none";
        if (listaHistorico) {
            listaHistorico.style.maxHeight = "400px";
            listaHistorico.style.overflowY = "auto";
        }
    }).catch(err => {
        console.error("Error al generar PDF:", err);
        // Restaurar en caso de fallo
        if (piePagina) piePagina.style.display = "none";
        if (listaHistorico) {
            listaHistorico.style.maxHeight = "400px";
            listaHistorico.style.overflowY = "auto";
        }
    });
}

// Exportar función al entorno global window
window.descargarBitacoraPDF = descargarBitacoraPDF;