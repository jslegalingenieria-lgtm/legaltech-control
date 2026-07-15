function descargarBitacoraPDF() {

    const elemento = document.getElementById("pdf-contenedor-impresion");

    if (!elemento) {
        alert("No se encontró la bitácora para generar PDF");
        return;
    }

    const expediente =
        document.getElementById("bitacora-expediente-titulo")?.innerText ||
        "Expediente";


    const opciones = {
        margin: 15,
        filename: `Bitacora_${expediente}.pdf`,
        image: {
            type: "jpeg",
            quality: 0.98
        },
        html2canvas: {
            scale: 2
        },
        jsPDF: {
            unit: "mm",
            format: "letter",
            orientation: "portrait"
        }
    };


    html2pdf()
        .set(opciones)
        .from(elemento)
        .save();
}


window.descargarBitacoraPDF = descargarBitacoraPDF;