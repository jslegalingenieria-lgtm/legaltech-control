/**
 * JS LegalTech Control
 * Generador profesional de PDF para la Bitácora / Línea del Tiempo.
 * Diseño institucional inspirado en los reportes ejecutivos de
 * JS Legal & Ingeniería.
 *
 * Requiere en dashboard.html, antes de cargar este archivo:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 */

(() => {
    "use strict";

    const COLORES = {
        azul: "#0b1d38",
        oro: "#c5a246",
        texto: "#1f2937",
        gris: "#6b7280",
        borde: "#d8d5ca",
        fondoAlterno: "#f4f1e8"
    };

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function limpiarNombreArchivo(valor) {
        return String(valor || "Expediente")
            .replace(/[\/\\:*?\"<>|]/g, "-")
            .replace(/\s+/g, "_");
    }

    function esperarImagen(imagen) {
        return new Promise(resolve => {
            if (!imagen) return resolve();
            if (imagen.complete && imagen.naturalWidth > 0) return resolve();

            imagen.onload = resolve;
            imagen.onerror = () => {
                console.warn("No se pudo cargar el logo del PDF.");
                resolve();
            };
            setTimeout(resolve, 3000);
        });
    }

    function imagenADataURL(imagen) {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = imagen.naturalWidth || imagen.width;
            canvas.height = imagen.naturalHeight || imagen.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(imagen, 0, 0);
            return canvas.toDataURL("image/png");
        } catch (error) {
            console.warn("No fue posible convertir el logo a imagen embebida.", error);
            return null;
        }
    }

    function obtenerTextoExpediente(titulo) {
        return titulo?.innerText?.trim() || "Expediente";
    }

    function prepararActuaciones(lineaTiempo) {
        const clon = lineaTiempo.cloneNode(true);
        clon.removeAttribute("id");
        clon.style.cssText = "margin:0;padding:0;background:#fff;overflow:visible;height:auto;max-height:none;";
        clon.querySelectorAll("button").forEach(boton => boton.remove());

        const elementos = Array.from(clon.children);
        elementos.forEach((elemento, indice) => {
            elemento.style.cssText = `
                display:block;
                position:relative;
                margin:0 0 14px 18px;
                padding:14px 16px 14px 20px;
                background:${indice % 2 === 0 ? "#ffffff" : COLORES.fondoAlterno};
                border:1px solid ${COLORES.borde};
                border-left:5px solid ${COLORES.oro};
                border-radius:0;
                box-sizing:border-box;
                page-break-inside:avoid;
            `;

            const fecha = elemento.querySelector("span");
            if (fecha) {
                fecha.textContent = fecha.textContent.replace("📅", "").trim();
                fecha.style.cssText = `
                    display:block;
                    margin:0 0 5px;
                    color:${COLORES.azul};
                    font-size:13px;
                    font-weight:800;
                    letter-spacing:.15px;
                `;
            }

            const descripcion = elemento.querySelector("p");
            if (descripcion) {
                descripcion.style.cssText = `
                    margin:0;
                    color:${COLORES.texto};
                    font-size:13px;
                    line-height:1.55;
                    text-align:justify;
                `;
            }

            const punto = document.createElement("span");
            punto.style.cssText = `
                position:absolute;
                left:-25px;
                top:16px;
                width:12px;
                height:12px;
                border-radius:50%;
                background:${COLORES.azul};
                border:3px solid ${COLORES.oro};
                box-sizing:border-box;
            `;
            elemento.appendChild(punto);
        });

        clon.style.borderLeft = `2px solid ${COLORES.oro}`;
        clon.style.marginLeft = "8px";
        return clon;
    }

    function dibujarEncabezado(pdf, logoDataURL, anchoPagina, expediente) {
        if (logoDataURL) {
            const anchoLogo = 50;
            const altoLogo = 18;
            pdf.addImage(
                logoDataURL,
                "PNG",
                (anchoPagina - anchoLogo) / 2,
                8,
                anchoLogo,
                altoLogo,
                undefined,
                "FAST"
            );
        }

        pdf.setDrawColor(197, 162, 70);
        pdf.setLineWidth(0.8);
        pdf.line(10, 30, anchoPagina - 10, 30);

        pdf.setTextColor(11, 29, 56);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.text("REPORTE EJECUTIVO", anchoPagina / 2, 38, { align: "center" });

        pdf.setTextColor(197, 162, 70);
        pdf.setFontSize(10.5);
        pdf.text(
            "BITÁCORA Y LÍNEA DEL TIEMPO DEL EXPEDIENTE",
            anchoPagina / 2,
            44,
            { align: "center" }
        );

        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        const expedienteCorto = String(expediente).slice(0, 85);
        pdf.text(expedienteCorto, anchoPagina / 2, 48.5, { align: "center" });
    }

    function dibujarPie(pdf, anchoPagina, altoPagina, pagina, totalPaginas) {
        const y = altoPagina - 14;
        pdf.setDrawColor(197, 162, 70);
        pdf.setLineWidth(0.5);
        pdf.line(10, y, anchoPagina - 10, y);

        pdf.setTextColor(11, 29, 56);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.text(
            "Mtro. Jorge Sánchez Flores  |  Abogado Postulante",
            anchoPagina / 2,
            y + 4.5,
            { align: "center" }
        );

        pdf.setTextColor(70, 80, 95);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.text(
            "jslegal.ingenieria@gmail.com  ·  JS Legal & Ingeniería — Despacho Jurídico",
            10,
            y + 9
        );
        pdf.text(
            `pág. ${pagina} de ${totalPaginas}`,
            anchoPagina - 10,
            y + 9,
            { align: "right" }
        );
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

        const expediente = obtenerTextoExpediente(titulo);
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

        const logoURL = new URL("img/logo-js-legal.png", window.location.href).href;
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = logoURL;
        await esperarImagen(logo);
        const logoDataURL = logo.naturalWidth ? imagenADataURL(logo) : null;

        const documento = document.createElement("div");
        documento.id = "documento-pdf-profesional";
        documento.style.cssText = `
            position:fixed;
            top:0;
            left:0;
            width:760px;
            padding:0 6px 18px;
            box-sizing:border-box;
            background:#ffffff;
            color:${COLORES.texto};
            font-family:Arial, Helvetica, sans-serif;
            z-index:2147483647;
            opacity:1;
            visibility:visible;
            pointer-events:none;
        `;

        documento.innerHTML = `
            <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 24px;font-size:13px;">
                <tr>
                    <td style="width:31%;padding:11px 13px;background:${COLORES.azul};color:#fff;font-weight:800;border:1px solid ${COLORES.borde};">
                        FECHA DE EMISIÓN
                    </td>
                    <td style="padding:11px 13px;border:1px solid ${COLORES.borde};font-weight:700;">
                        ${escaparHTML(fecha)}
                    </td>
                </tr>
                <tr>
                    <td style="padding:11px 13px;background:${COLORES.azul};color:#fff;font-weight:800;border:1px solid ${COLORES.borde};">
                        HORA DE EMISIÓN
                    </td>
                    <td style="padding:11px 13px;border:1px solid ${COLORES.borde};font-weight:700;">
                        ${escaparHTML(hora)}
                    </td>
                </tr>
                <tr>
                    <td style="padding:11px 13px;background:${COLORES.azul};color:#fff;font-weight:800;border:1px solid ${COLORES.borde};">
                        EXPEDIENTE
                    </td>
                    <td style="padding:11px 13px;border:1px solid ${COLORES.borde};font-weight:700;">
                        ${escaparHTML(expediente)}
                    </td>
                </tr>
                <tr>
                    <td style="padding:11px 13px;background:${COLORES.azul};color:#fff;font-weight:800;border:1px solid ${COLORES.borde};">
                        DOCUMENTO
                    </td>
                    <td style="padding:11px 13px;border:1px solid ${COLORES.borde};font-weight:700;">
                        Reporte cronológico de actuaciones
                    </td>
                </tr>
            </table>

            <div style="display:flex;align-items:center;gap:10px;margin:0 0 16px;padding-bottom:6px;border-bottom:2px solid ${COLORES.oro};">
                <span style="color:${COLORES.oro};font-size:21px;font-weight:900;">I.</span>
                <span style="color:${COLORES.azul};font-size:18px;font-weight:900;">LÍNEA DEL TIEMPO DEL JUICIO</span>
            </div>

            <div id="contenido-linea-tiempo-pdf"></div>

            <div style="margin-top:22px;padding-top:12px;border-top:1px solid ${COLORES.oro};font-size:10px;line-height:1.55;color:${COLORES.gris};font-style:italic;">
                <strong style="color:${COLORES.azul};">Nota:</strong>
                El presente reporte reproduce las actuaciones registradas en JS LegalTech Control y constituye un documento de seguimiento interno. La información deberá cotejarse con el expediente judicial y las constancias oficiales correspondientes.
            </div>
        `;

        documento
            .querySelector("#contenido-linea-tiempo-pdf")
            .appendChild(prepararActuaciones(lineaTiempo));

        document.body.appendChild(documento);

        try {
            await new Promise(resolve => {
                requestAnimationFrame(() => requestAnimationFrame(resolve));
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

            const imagen = canvas.toDataURL("image/jpeg", 0.96);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "letter"
            });

            const anchoPagina = pdf.internal.pageSize.getWidth();
            const altoPagina = pdf.internal.pageSize.getHeight();
            const margenX = 10;
            const inicioContenido = 53;
            const finContenido = altoPagina - 18;
            const altoUtil = finContenido - inicioContenido;
            const anchoUtil = anchoPagina - margenX * 2;
            const altoImagen = canvas.height * anchoUtil / canvas.width;
            const totalPaginas = Math.max(1, Math.ceil(altoImagen / altoUtil));

            for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
                if (pagina > 1) pdf.addPage();

                dibujarEncabezado(pdf, logoDataURL, anchoPagina, expediente);

                const desplazamiento = (pagina - 1) * altoUtil;
                pdf.addImage(
                    imagen,
                    "JPEG",
                    margenX,
                    inicioContenido - desplazamiento,
                    anchoUtil,
                    altoImagen,
                    undefined,
                    "FAST"
                );

                pdf.setFillColor(255, 255, 255);
                pdf.rect(0, 0, anchoPagina, inicioContenido - 1, "F");
                pdf.rect(0, finContenido, anchoPagina, altoPagina - finContenido, "F");

                dibujarEncabezado(pdf, logoDataURL, anchoPagina, expediente);
                dibujarPie(pdf, anchoPagina, altoPagina, pagina, totalPaginas);
            }

            pdf.save(`Bitacora_${limpiarNombreArchivo(expediente)}.pdf`);
        } catch (error) {
            console.error("Error al generar el PDF:", error);
            alert("No fue posible generar el PDF.");
        } finally {
            documento.remove();
        }
    }

    window.descargarBitacoraPDF = descargarBitacoraPDF;
})();
