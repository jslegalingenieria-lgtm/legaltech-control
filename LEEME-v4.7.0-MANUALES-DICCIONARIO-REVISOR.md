# LegalTech Control v4.7.0 — módulos jurídicos migrados

Esta versión agrega a LegalTech Control los Manuales de litigación, Diccionario Jurídico y Revisor Jurídico, usando como fuente los manuales y datos de consulta de la versión SIGDE aportada y el Revisor Jurídico estable V2.9.

## Cambios de interfaz
- Agregados los apartados Manuales de litigación, Diccionario Jurídico y Revisor Jurídico al Centro de conocimiento.
- Retirado el enlace lateral independiente de Jurisprudencia. La pestaña de tesis y jurisprudencia dentro del Buscador jurídico permanece.
- Retirado el Constructor clásico. El módulo queda como **Constructor** y usa el constructor maestro previamente integrado.
- El menú abre los módulos migrados desde la navegación de LegalTech Control.

## Archivos relevantes
- `manuales-practicos/` y `manuales-practicos-html/`: manuales en Word y lectura HTML.
- `js/manuales-practicos-data.js`: fichas estructuradas de los manuales. Rutas normalizadas a los archivos incluidos.
- `js/biblioteca-juridica-practica-data.js`: términos procesales, diccionario y locuciones latinas.
- `js/legaltech-manuales-diccionario.js` / `css/legaltech-modulos-litigacion.css`: interfaz local de consulta.
- `js/revisor-juridico.js` / `css/revisor-juridico.css`: Revisor Jurídico estable V2.9, adaptado a la vista de LegalTech.
- `functions/index.js`: añade el proxy de lectura para PDFs normativos autorizados.

## Límites y seguridad
- Esta entrega no se ha desplegado en Firebase ni publicado en GitHub.
- El Revisor procesa el documento en el navegador; las comprobaciones contra PDF normativo requieren que se despliegue `getNormativePdf` en el proyecto configurado.
- Las fuentes de CDN y los enlaces externos requieren conexión a internet.
- Los manuales y entradas son material de consulta; antes de litigación real se debe verificar la legislación y jurisprudencia aplicable.
- El archivo `.firebaserc` y `firebase.json` se mantienen intactos respecto de la base v4.6.0. No ejecutar `firebase deploy` sin revisar el proyecto seleccionado y la facturación.
