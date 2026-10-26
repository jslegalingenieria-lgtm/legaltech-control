# JS LegalTech Control — Buscador Jurídico completo integrado desde SIGDE 4.5.1

## Qué incluye esta integración

La versión conserva todos los archivos funcionales y módulos que venían en el proyecto `JS-LegalTech-Control(3).zip` y actualiza únicamente el Buscador Jurídico, sus estilos, el registro en caché y las funciones de backend necesarias.

### Interfaz y operación

- Se conservan las seis fuentes oficiales existentes de LegalTech: Tesis y jurisprudencia (SJF), Consejo de la Judicatura Federal, legislación de Jalisco, legislación federal, Diario Oficial de la Federación y Corte Interamericana de Derechos Humanos; también se mantiene la opción de Búsqueda integral.
- El panel de consulta tiene acciones independientes para buscar, ejecutar el agente, copiar la consulta, abrir la fuente oficial y limpiar.
- La búsqueda SJF usa el servicio directo; si no devuelve resultados, consulta el índice web restringido a dominios oficiales judiciales.
- La búsqueda con agente usa reglas deterministas, varias reformulaciones y respaldo indexado; no utiliza IA generativa.
- El respaldo incluye búsqueda normal y por frase exacta en Google, y acceso directo al SJF.
- En escritorio puede preparar la pestaña de respaldo durante el clic; en móvil evita abrir pestañas vacías al inicio de la consulta.
- Se muestra el origen, las consultas intentadas, los errores disponibles, el registro digital y los metadatos. Los resultados indexados llevan etiqueta de «por verificar».
- Se conserva el historial local de las últimas ocho consultas, botón para copiar cada rubro y control para borrar historial.
- Se actualizó la versión del Service Worker para que no siga sirviendo el JavaScript anterior desde la caché.

### Funciones de Firebase

Se encuentran en `functions/index.js`:

- `searchSJF`
- `searchSJFAgent`
- `searchSJFIndexed`

Las funciones validan sesión, perfil activo y rol interno de LegalTech. El agente no inventa tesis; las fuentes indexadas son solo pistas de localización y deben verificarse en el portal oficial.

## Límites de operación

- La búsqueda automática requiere que las tres Cloud Functions estén desplegadas y que el proyecto de Firebase permita ejecutarlas.
- Esta entrega es una modificación del código; no se desplegó en Firebase ni se publicó en GitHub desde esta sesión.
- Si el proyecto de nube está detenido o sin facturación para Functions, sigue disponible la opción manual de abrir las fuentes oficiales, pero no funcionará la recuperación automática del SJF.
- No se puede garantizar que los servicios de consulta del SJF, Google, DuckDuckGo o Bing estén disponibles siempre; los buscadores externos cambian sus formatos y pueden bloquear peticiones automatizadas.
- Antes de citar un criterio, confirma en la fuente oficial el registro digital, rubro, texto íntegro, época, vigencia, obligatoriedad y aplicabilidad al asunto.

## Verificación de esta entrega

Se comprobaron:

- Sintaxis JavaScript de `js/buscador-juridico.js` y `functions/index.js`.
- Sintaxis de `sw.js`.
- Existencia de los IDs del buscador invocados por JavaScript y ausencia de IDs duplicados en `dashboard.html`.
- Integridad del ZIP y presencia de todos los archivos funcionales originales. Se excluyen `.git/`, `.firebase/` y `node_modules/` porque son historial/cachés/dependencias instaladas; las dependencias declaradas y `package-lock.json` se conservan para instalarse localmente.
