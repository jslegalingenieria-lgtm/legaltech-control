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

let cancelarEscuchaPortal = null;

setTimeout(ejecutarCargaPortal, 200);

function ejecutarCargaPortal() {
    inicializarModalBitacoraPortal();
    let usuarioActivo = null;
    try {
        usuarioActivo = JSON.parse(
            sessionStorage.getItem("js_legal_usuario") ||
            localStorage.getItem("js_legal_session") ||
            "null"
        );
    } catch (_) {}

    if (usuarioActivo?.rol === "Cliente") {
        cargarExpedientesClientePortal(usuarioActivo.clienteId || usuarioActivo.id, usuarioActivo.nombre);
    }
}

function renderizarExpedientesCliente(misAsuntos) {
    const tablaCuerpo = document.getElementById("tabla-portal-cuerpo");
    if (!tablaCuerpo) return;
    tablaCuerpo.innerHTML = "";

    if (!misAsuntos.length) {
        tablaCuerpo.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;">No hay expedientes vinculados a su cuenta.</td></tr>`;
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

async function esperarAutenticacionCliente() {
    if (!window.firebaseAuth) throw new Error("Firebase Authentication no está disponible.");
    if (window.firebaseAuth.currentUser) return window.firebaseAuth.currentUser;

    return new Promise((resolve, reject) => {
        const cancelar = window.firebaseAuth.onAuthStateChanged(usuario => {
            cancelar();
            if (usuario) resolve(usuario);
            else reject(new Error("La sesión de Firebase todavía no está activa."));
        }, reject);
    });
}

async function cargarExpedientesClientePortal(clienteId, clienteNombre) {
    if (!window.db || !clienteId) return;
    if (cancelarEscuchaPortal) return;

    const tablaCuerpo = document.getElementById("tabla-portal-cuerpo");
    if (tablaCuerpo) {
        tablaCuerpo.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;">Consultando sus expedientes...</td></tr>`;
    }

    try {
        await esperarAutenticacionCliente();
    } catch (error) {
        console.error("No se pudo confirmar la sesión del cliente:", error);
        if (tablaCuerpo) {
            tablaCuerpo.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;color:#991b1b;">Su sesión no pudo sincronizarse. Cierre sesión e ingrese nuevamente.</td></tr>`;
        }
        return;
    }

    cancelarEscuchaPortal = window.db
        .collection("asuntos")
        .where("clienteId", "==", String(clienteId))
        .onSnapshot(snapshot => {
            const asuntos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem("js_legal_asuntos_cliente", JSON.stringify(asuntos));
            renderizarExpedientesCliente(asuntos);
        }, error => {
            console.error("Error consultando expedientes del cliente:", error);
            const cache = JSON.parse(localStorage.getItem("js_legal_asuntos_cliente") || "[]");
            if (cache.length) {
                renderizarExpedientesCliente(cache);
            } else if (tablaCuerpo) {
                tablaCuerpo.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;color:#991b1b;">No fue posible consultar sus expedientes.</td></tr>`;
            }
        });
}

let expedienteActivoParaPDF = "expediente";

function abrirBitacoraClientePortal(asuntoId) {
    inicializarModalBitacoraPortal();

    const asuntos = JSON.parse(localStorage.getItem("js_legal_asuntos_cliente") || "[]");
    const asunto = asuntos.find(a => String(a.id) === String(asuntoId) || String(a.expediente) === String(asuntoId));
    
    if (!asunto) return;

    expedienteActivoParaPDF = asunto.expediente || "expediente";

    const modal = document.getElementById("modal-bitacora-portal");
    if (modal) {
        document.getElementById("portal-expediente-titulo").innerText = expedienteActivoParaPDF;
        modal.style.display = "block";
        
        const historialActuaciones = (asunto.actuaciones || asunto.bitacora || [])
            .filter(actuacion => actuacion.visibleCliente === true);
        renderizarActuacionesPortal(historialActuaciones);
    }
}

function renderizarActuacionesPortal(actuaciones) {
   const listaHistorico = document.getElementById("portal-lista-historico") ||
                       document.getElementById("bitacora-lista-historico");
    const lista = listaHistorico;
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
async function descargarBitacoraPDF() {
    const lineaTiempo = document.getElementById("portal-lista-historico");
    const titulo = document.getElementById("portal-expediente-titulo");

    if (!lineaTiempo) {
        alert("No se encontró la Línea del Tiempo.");
        return;
    }

    if (!lineaTiempo.children.length) {
        alert("No existen actuaciones para descargar.");
        return;
    }

    if (typeof html2canvas === "undefined") {
        alert("No se cargó html2canvas.");
        return;
    }

    if (!window.jspdf?.jsPDF) {
        alert("No se cargó jsPDF.");
        return;
    }

    const expediente = titulo?.innerText?.trim() || "Expediente";

    const documento = document.createElement("div");

    documento.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        transform: translateX(-200vw);
        width: 760px;
        padding: 35px;
        box-sizing: border-box;
        background: #ffffff;
        color: #1e293b;
        font-family: Arial, Helvetica, sans-serif;
        opacity: 1;
        visibility: visible;
        pointer-events: none;
    `;

    const logoURL = new URL(
        "img/logo-js-legal.png",
        window.location.href
    ).href;

    documento.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:25px;
            padding-bottom:18px;
            margin-bottom:24px;
            border-bottom:4px solid #2563eb;
        ">
            <div>
                <img
                    id="logo-temporal-pdf"
                    src="${logoURL}"
                    alt="JS Legal & Ingeniería"
                    style="
                        width:250px;
                        height:auto;
                        display:block;
                        margin-bottom:12px;
                    "
                >

                <div style="
                    font-size:18px;
                    font-weight:800;
                    color:#2563eb;
                    text-transform:uppercase;
                    letter-spacing:1px;
                ">
                    Reporte de actuaciones
                </div>
            </div>

            <div style="
                text-align:right;
                font-size:11px;
                line-height:1.7;
                color:#475569;
            ">
                <div>
                    <strong>Expediente:</strong>
                    ${escaparHTMLPDF(expediente)}
                </div>

                <div>
                    <strong>Fecha:</strong>
                    ${new Date().toLocaleDateString("es-MX")}
                </div>

                <div>
                    <strong>Hora:</strong>
                    ${new Date().toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}
                </div>
            </div>
        </div>

        <div style="
            margin-bottom:18px;
            padding-bottom:8px;
            border-bottom:2px solid #cbd5e1;
            font-size:16px;
            font-weight:800;
            color:#0f172a;
        ">
            Línea del Tiempo del Juicio
        </div>

        <div id="contenido-linea-tiempo-pdf"></div>

        <div style="
            display:flex;
            justify-content:space-between;
            margin-top:30px;
            padding-top:12px;
            border-top:1px solid #cbd5e1;
            color:#64748b;
            font-size:9px;
        ">
            <span>
                Documento generado por
                <strong>JS LegalTech Control</strong>
            </span>

            <span>JS Legal &amp; Ingeniería</span>
        </div>
    `;

    const clon = lineaTiempo.cloneNode(true);

    clon.removeAttribute("id");
    clon.style.maxHeight = "none";
    clon.style.height = "auto";
    clon.style.overflow = "visible";
    clon.style.padding = "0";
    clon.style.margin = "0";

    clon.querySelectorAll("button").forEach(boton => boton.remove());

    documento
        .querySelector("#contenido-linea-tiempo-pdf")
        .appendChild(clon);

    document.body.appendChild(documento);

    try {
        const logo = documento.querySelector("#logo-temporal-pdf");

        if (logo && !logo.complete) {
            await new Promise(resolve => {
                logo.onload = resolve;

                logo.onerror = () => {
                    logo.remove();
                    resolve();
                };

                setTimeout(resolve, 2000);
            });
        }

        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });

        const canvas = await html2canvas(documento, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0,
            windowWidth: 820
        });

        const imagen = canvas.toDataURL("image/jpeg", 0.98);
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "letter"
        });

        const anchoPagina = pdf.internal.pageSize.getWidth();
        const altoPagina = pdf.internal.pageSize.getHeight();

        const margen = 10;
        const anchoImagen = anchoPagina - margen * 2;
        const altoImagen = canvas.height * anchoImagen / canvas.width;

        let posicionY = margen;
        let alturaRestante = altoImagen;

        pdf.addImage(
            imagen,
            "JPEG",
            margen,
            posicionY,
            anchoImagen,
            altoImagen
        );

        alturaRestante -= altoPagina - margen * 2;

        while (alturaRestante > 0) {
            pdf.addPage();

            posicionY =
                margen - (altoImagen - alturaRestante);

            pdf.addImage(
                imagen,
                "JPEG",
                margen,
                posicionY,
                anchoImagen,
                altoImagen
            );

            alturaRestante -= altoPagina - margen * 2;
        }

        const totalPaginas = pdf.internal.getNumberOfPages();

        for (let pagina = 1; pagina <= totalPaginas; pagina++) {
            pdf.setPage(pagina);
            pdf.setFontSize(8);
            pdf.setTextColor(100);

            pdf.text(
                `Página ${pagina} de ${totalPaginas}`,
                anchoPagina - 30,
                altoPagina - 6
            );
        }

        pdf.save(
            `Bitacora_${expediente.replace(
                /[\/\\:*?"<>|]/g,
                "-"
            )}.pdf`
        );

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("No fue posible generar el PDF.");
    } finally {
        documento.remove();
    }
}

function escaparHTMLPDF(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// El generador global unificado se publica desde js/pdf.js.



