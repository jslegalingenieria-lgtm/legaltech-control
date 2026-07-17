/**
 * JS LegalTech Control
 * Generador profesional de PDF para la Línea del Tiempo.
 *
 * Requiere en dashboard.html, antes de cargar este archivo:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 */

(() => {
    "use strict";

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function limpiarNombreArchivo(valor) {
        return String(valor || "Expediente")
            .replace(/[\/\\:*?"<>|]/g, "-")
            .replace(/\s+/g, "_");
    }

    function esperarImagen(imagen) {
        return new Promise(resolve => {
            if (!imagen) {
                resolve();
                return;
            }

            if (imagen.complete && imagen.naturalWidth > 0) {
                resolve();
                return;
            }

            imagen.onload = resolve;

            imagen.onerror = () => {
                console.warn("No se pudo cargar el logo del PDF.");
                imagen.remove();
                resolve();
            };

            setTimeout(resolve, 2500);
        });
    }

    async function descargarBitacoraPDF() {
        if (typeof html2canvas === "undefined") {
            alert("No se cargó html2canvas.");
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("No se cargó jsPDF.");
            return;
        }

        const lineaTiempo = document.getElementById("bitacora-lista-historico");
        const titulo = document.getElementById("bitacora-expediente-titulo");

        if (!lineaTiempo) {
            alert("No se encontró la Línea del Tiempo.");
            return;
        }

        if (!lineaTiempo.children.length) {
            alert("La Línea del Tiempo no contiene actuaciones.");
            return;
        }

        const expediente = titulo?.innerText?.trim() || "Expediente";
        const ahora = new Date();

        const fecha = ahora.toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        const hora = ahora.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const logoURL = new URL(
            "img/logo-js-legal.png",
            window.location.href
        ).href;

        const documento = document.createElement("div");

        documento.id = "documento-pdf-profesional";

        documento.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 760px;
            min-height: 980px;
            padding: 34px;
            box-sizing: border-box;
            background: #ffffff;
            color: #1e293b;
            font-family: Arial, Helvetica, sans-serif;
            z-index: 2147483647;
            opacity: 1;
            visibility: visible;
            pointer-events: none;
        `;

        documento.innerHTML = `
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:24px;
                padding-bottom:18px;
                margin-bottom:24px;
                border-bottom:4px solid #2563eb;
            ">
                <div style="flex:1;">
                    <img
                        id="logo-temporal-pdf"
                        src="${logoURL}"
                        alt="JS Legal & Ingeniería"
                        style="
                            width:250px;
                            max-width:100%;
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
                    min-width:190px;
                    text-align:right;
                    font-size:11px;
                    line-height:1.7;
                    color:#475569;
                ">
                    <div>
                        <strong>Expediente:</strong>
                        ${escaparHTML(expediente)}
                    </div>

                    <div>
                        <strong>Fecha:</strong>
                        ${escaparHTML(fecha)}
                    </div>

                    <div>
                        <strong>Hora:</strong>
                        ${escaparHTML(hora)}
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
                gap:20px;
                margin-top:30px;
                padding-top:12px;
                border-top:1px solid #cbd5e1;
                color:#64748b;
                font-size:9px;
                line-height:1.5;
            ">
                <span>
                    Documento generado automáticamente por
                    <strong>JS LegalTech Control</strong>.
                </span>

                <span style="text-align:right;">
                    JS Legal &amp; Ingeniería
                </span>
            </div>
        `;

        const clon = lineaTiempo.cloneNode(true);

        clon.removeAttribute("id");
        clon.style.maxHeight = "none";
        clon.style.height = "auto";
        clon.style.overflow = "visible";
        clon.style.padding = "0";
        clon.style.margin = "0";
        clon.style.background = "#ffffff";

        clon.querySelectorAll("button").forEach(boton => boton.remove());

        documento
            .querySelector("#contenido-linea-tiempo-pdf")
            .appendChild(clon);

        document.body.appendChild(documento);

        try {
            const logo = documento.querySelector("#logo-temporal-pdf");
            await esperarImagen(logo);

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
                logging: false,
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
            const anchoUtil = anchoPagina - margen * 2;
            const altoUtil = altoPagina - margen * 2;

            const altoImagen = canvas.height * anchoUtil / canvas.width;

            let posicionY = margen;
            let alturaRestante = altoImagen;

            pdf.addImage(
                imagen,
                "JPEG",
                margen,
                posicionY,
                anchoUtil,
                altoImagen
            );

            alturaRestante -= altoUtil;

            while (alturaRestante > 0) {
                pdf.addPage();

                posicionY = margen - (altoImagen - alturaRestante);

                pdf.addImage(
                    imagen,
                    "JPEG",
                    margen,
                    posicionY,
                    anchoUtil,
                    altoImagen
                );

                alturaRestante -= altoUtil;
            }

            const totalPaginas = pdf.internal.getNumberOfPages();

            for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
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
                `Bitacora_${limpiarNombreArchivo(expediente)}.pdf`
            );

        } catch (error) {
            console.error("Error al generar el PDF:", error);
            alert("No fue posible generar el PDF.");
        } finally {
            documento.remove();
        }
    }

    window.descargarBitacoraPDF = descargarBitacoraPDF;
})();
