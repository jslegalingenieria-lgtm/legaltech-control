# LegalTech Control v4.8.0 — Términos procesales

## Cambios
- Se incorpora el módulo **Términos procesales** con tres secciones: catálogo canónico, rutas/etapas de la Supermatriz V19 y control de vencimientos.
- Catálogo canónico: 291 registros; se conservan los campos de validación, fundamento, regla ejecutable, cómputo y observaciones de origen.
- Supermatriz procesal: consulta de 121 rutas registradas, con etapas y términos asociados.
- Control de vencimientos: usa la colección existente `alertas`, con `tipo: "termino"`, `fechaVencimiento`, `usuario` y `estado`, compatibles con el sistema de alertas actual.
- Se retira el submódulo independiente **Estrategia Procesal** del menú, la vista, el script cargado y la caché PWA.

## Precauciones jurídicas
El módulo NO calcula automáticamente fechas de vencimiento. Aunque una fila registre un plazo numérico o `Regla_ejecutable = SI`, no debe utilizarse como fecha límite sin verificación profesional. Deben revisarse procedimiento, régimen, acto y efectos de notificación, calendario aplicable, suspensiones y texto vigente de la norma. La fecha límite del control se captura manualmente por el profesional responsable. La matriz conserva registros en distintos estados de revisión; no todos los fundamentos se han auditado individualmente en esta integración.

## Almacenamiento y despliegue
- Los vencimientos se guardan en Firestore, colección `alertas`, por lo que requieren sesión activa y permisos actuales de LegalTech. El catálogo y las rutas se pueden consultar desde los archivos incluidos.
- No se modificaron `firebase.json`, `.firebaserc`, `firestore.rules` ni `storage.rules`. No se desplegó Firebase ni se publicó en GitHub.

## Validación técnica
Se comprobará la sintaxis del módulo JavaScript, la estructura de los registros y las rutas del menú/vista. No se ha ejecutado una prueba autenticada contra Firestore ni una validación jurídica exhaustiva de cada término.
