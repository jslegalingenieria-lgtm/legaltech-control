# CHANGELOG — JS LegalTech Control

## v4.9.1 — Kanban de Asuntos y Gestión y control
- Se agregó vista Kanban a Asuntos como vista predeterminada, conservando la vista de tabla como alternativa.
- La vista Kanban separa los asuntos en En proceso, Suspendido, Concluido y Cancelado; las tarjetas conservan accesos a bitácora, edición y cambio de estado según permisos.
- Ambas vistas ordenan los asuntos de forma descendente por el número de expediente.
- Se migró Gestión y control con Cotizaciones, Gastos y costos y Reportes KPI bajo un solo grupo de menú.
- Se sustituyó el antiguo acceso independiente a Cotizaciones por el grupo Gestión y control, evitando duplicidad en navegación.
- Se añadió a Firestore rules acceso a las colecciones raíz cotizaciones y registrosFinancieros: administración para administradores y acceso por autor para el resto del personal autorizado.
- Se incrementó la versión de caché PWA para cargar el nuevo módulo y los estilos.
- La sintaxis JavaScript y las referencias estructurales se validaron; no se ejecutaron pruebas de navegador/Firestore y no se desplegó a Firebase ni GitHub.
- Las cotizaciones/movimientos antiguos de SIGDE no se migran automáticamente: el módulo escribe nuevos registros en las colecciones de LegalTech.

## v4.7.0 — Manuales, diccionario y revisor jurídico
- Se agregaron Manuales de litigación, Diccionario Jurídico y Revisor Jurídico (base estable V2.9).
- Se quitó del menú la opción Jurisprudencia duplicada del Buscador jurídico.
- Se retiró el Constructor clásico; la vista se presenta como Constructor y usa el constructor maestro existente.
- Se agregaron reglas de caché y el proxy de lectura getNormativePdf para fuentes normativas permitidas.

# CHANGELOG — JS LegalTech Control

## v4.5.0 — Integración del buscador jurídico de SIGDE
- El buscador de LegalTech consulta automáticamente el servicio público del Semanario Judicial de la Federación cuando la pestaña Tesis y jurisprudencia está activa.
- Se migraron las funciones `searchSJF`, `searchSJFAgent` y `searchSJFIndexed` al backend de LegalTech, adaptando autenticación y permisos al perfil activo de `personal/{uid}` y a los roles internos de LegalTech.
- Se agregaron tarjetas de resultados, copia de rubros, acceso al registro/fuente oficial, búsqueda web de respaldo y advertencias para enlaces indexados no verificados.
- Se conserva el flujo de apertura manual en CJF, legislación de Jalisco, legislación federal, DOF, Corte IDH y búsqueda integral.
- Se renovó la caché de Service Worker para entregar los archivos actualizados.
- Las funciones automáticas requieren desplegar Cloud Functions en el proyecto LegalTech; ese despliegue no se ha realizado desde este paquete. No usa IA generativa, aunque el consumo de Functions está sujeto a la facturación/cuotas vigentes.

## v4.0.1 — Encabezado fijo, menú desplazable y Configuración
- Encabezado fijo en escritorio y móvil.
- Navegación lateral desplazable con LexGear fijo.
- Agenda con vistas lista/calendario.
- Configuración sustituye a Mantenimiento en el menú.

# v4.0.0 — Integración Mercantil

- Nueva materia Mercantil en Conocimiento Procesal.
- Fichas de diagnóstico, ejecutivo, títulos de crédito, oral, ordinario y arbitraje.
- Selector orientativo de vía.
- Control de prescripción.
- Errores críticos.
- Entrevistas, documentos, revisión, ruta y pruebas adaptados por procedimiento.

## v3.7.0 - Entrevistas jurídicas
- Nuevo módulo de entrevistas persistentes en Firestore.
- Edición, búsqueda y estados de seguimiento.
- Conversión de entrevista en asunto con vinculación bidireccional.
- Nuevas reglas de seguridad para la colección entrevistas.

# v3.6.0 — Base sucesoria integrada

- Integración completa del Manual de Derecho Sucesorio y de Herencias de Jalisco.
- Diez fichas sucesorias activas con entrevistas, checklists, revisión, rutas y pruebas.
- Eliminación de la ficha provisional de sucesiones.
- Actualización de caché PWA para los archivos del módulo de conocimiento.

## 3.0.2 - Corrección documental y adjuntos en actuaciones
- Toggle trasladado al Dashboard del Superadministrador.
- Adjuntos en captura de actuaciones.
- Reglas Storage corregidas.
- Archivos ocultos al Portal Cliente.

# v2.1.11 — Agenda de pasantes

- La Agenda consulta eventos del pasante únicamente mediante su UID autenticado.
- Se elimina el falso error provocado por consultas auxiliares rechazadas.
- Un error secundario ya no reemplaza eventos que sí fueron sincronizados.

# JS LegalTech Control v2.1.9

- Corrige definitivamente la agenda de pasantes.
- La agenda se consulta por los asuntos donde el pasante fue seleccionado.
- Los eventos antiguos se muestran aunque todavía no tengan colaboradorIds sincronizado.
- Se agrega validación de acceso mediante el asunto relacionado en Firestore.
- Actualiza la caché de la PWA.

# JS LegalTech Control v2.1.8

- Corrige la carga de agenda en la sesión de pasante.
- La consulta espera a que Firebase Authentication confirme el UID antes de consultar eventos.
- Mantiene el acceso únicamente a eventos de asuntos donde el pasante fue seleccionado.
- Actualiza la caché de la PWA.

# v2.1.7

- Corrige la sincronización de clientes para pasantes.
- El pasante solo visualiza clientes vinculados con asuntos donde fue seleccionado.
- La agenda del pasante muestra únicamente eventos de esos asuntos.
- Los eventos nuevos heredan los colaboradores del asunto.
- Al guardar un asunto se sincronizan sus colaboradores con los eventos existentes.
- Actualiza reglas de Firestore y caché PWA.

# v2.1.6

- Los pasantes ya no heredan automáticamente todos los asuntos de su responsable.
- Un pasante solo puede consultar un asunto cuando está seleccionado expresamente como colaborador.
- Se reforzaron las reglas de Firestore para aplicar el mismo criterio.

# v2.1.5

- Corrige el filtrado final de la tabla de asuntos para incluir asuntos donde el abogado está marcado como colaborador.
- Conserva la restricción de pasantes únicamente a los asuntos de su responsable.
- Actualiza la caché PWA.

# Versión 2.1.4

- Corrige la consulta de asuntos compartidos usando el UID real de Firebase Authentication.
- Conserva compatibilidad con usuario, correo e identificadores anteriores.
- Actualiza la caché de la PWA.

## v2.1.3 — Selección y acceso de colaboradores
- Se incorporaron casillas visibles para marcar y desmarcar colaboradores.
- Cada selección muestra nombre, rol y contador de colaboradores.
- Un abogado marcado puede consultar el asunto aunque no sea el titular.
- El acceso se reconoce por UID, identificador, usuario o correo para conservar compatibilidad.
- Se actualizó la caché PWA.


## v2.1.1 — Responsable del pasante por rol
- El pasante puede asignarse a un Abogado, Administrador o Superadministrador activo.
- El selector muestra el nombre y rol del responsable.
- Se conserva la estructura interna de supervisor para mantener compatibilidad con permisos y registros existentes.
## v1.5.1 — Configuración inicial del Superadministrador

- Se conserva una credencial temporal únicamente para abrir la primera configuración.
- El Superadministrador asigna su nombre, usuario, correo real y contraseña definitiva.
- Al guardar, Firebase Authentication sustituye el correo y la contraseña temporales.
- La contraseña temporal deja de funcionar después de completar el proceso.
- La contraseña definitiva nunca se guarda en Firestore.

# CHANGELOG — JS LegalTech Control

## v1.5.0 — Arquitectura de roles

- Se incorporó la matriz central de permisos en `js/roles.js`.
- Se añadieron los roles Superadministrador, Administrador, Auxiliar Jurídico, Abogado, Pasante y Cliente.
- El Superadministrador se define como el enlace técnico designado por el despacho para la implementación, Firebase, facturación y servicios externos.
- El Administrador conserva el control operativo total de la plataforma.
- El Auxiliar Jurídico puede dar altas y operar el sistema, pero no puede dar de baja personal ni clientes.
- El Abogado queda limitado a sus clientes, asuntos y agenda asignados.
- El Pasante debe estar vinculado a un abogado responsable y hereda su ámbito de consulta, sin permisos de cancelación o baja.
- El Cliente mantiene acceso exclusivo a su portal, línea de tiempo y documentos autorizados.
- Se actualizaron las reglas de Firestore para reflejar los nuevos roles y evitar eliminaciones físicas.
- Se actualizó el Service Worker y la caché de la PWA.
- Se confirmó `favicon3.png` como icono de instalación móvil.


## 2.0.1 Beta - Correcciones de validación
- Restaurado y robustecido el botón de respaldo para Administrador y Superadministrador.
- Corregida la edición de asuntos (espera la carga del modal antes de rellenar campos).
- Sustituido el ingreso manual del estado por un selector controlado.
- Corregido el portal del cliente para consultar por clienteId real.
- Consultas de Abogado y Pasante configuradas en modo seguro cuando falta responsable/supervisor.

## v2.0 Enterprise - Centro de Atención
- Encabezado móvil fijo con menú, título y fecha siempre visibles.
- Mensajería entre cliente, abogado responsable y administración.
- Solicitudes de cita sujetas a confirmación del despacho y aviso de posibles honorarios.
- Gestión de citas: confirmar, proponer fecha, rechazar y convertir citas confirmadas en eventos de Agenda.
- Reglas de Firestore para `mensajes` y `solicitudesCitas` según rol y propiedad del cliente.

## v2.1 - Mantenimiento de consecutivos
- Se agregó un módulo exclusivo para Superadministrador.
- Permite sincronizar o reiniciar los consecutivos de personal, clientes y asuntos.
- Impide establecer un valor menor al código máximo que todavía exista en la base.
- Requiere escribir REINICIAR y aceptar una confirmación antes de guardar.
- Registra cada cambio en la colección `auditoriaSistema`.
- No elimina registros ni reutiliza números mientras existan códigos superiores.


## v2.1.2 - Colaboradores de asuntos
- Los abogados asignados como colaboradores ahora visualizan el asunto compartido, aunque no sean el responsable principal.
- La consulta combina asuntos propios y colaboraciones sin duplicar registros.
- El selector múltiple ambiguo fue sustituido por casillas visibles para marcar y desmarcar colaboradores.
- Los pasantes conservan el acceso únicamente mediante su responsable.
- Se renovó la caché de la PWA.

## v2.1.10 - Agenda de pasantes
- La agenda del pasante se consulta directamente mediante `colaboradorIds`.
- Se elimina la consulta indirecta por `asuntoId` que podía ser rechazada por Firestore.
- El pasante solo recibe eventos de asuntos donde fue seleccionado expresamente.

## 3.0.0 - Expedientes electrónicos
- Se añadió el módulo Expedientes como consulta separada de Asuntos.
- Tabla de asuntos por renglón con filtros y ordenamiento.
- Vista detallada con línea del tiempo y relación de archivos.
- Acceso restringido al personal interno conforme a los asuntos ya autorizados por rol.
- Se preparó la interfaz para la siguiente etapa de gestión documental.

## 3.0.1 — Gestión documental
- Firebase Storage integrado.
- Carga de PDF, JPG, JPEG y PNG desde Expedientes.
- Validación de 10 MB por archivo y 20 archivos activos por expediente.
- Vista, descarga, papelera, restauración y eliminación definitiva por Superadministrador.
- Interruptor de gestión documental controlado por Superadministrador.
- Metadatos documentales almacenados en Firestore.
- Reglas de Firestore y Storage incluidas.

## v4.1.0 — Centro de Conocimiento Jurídico (piloto)
- Se unificaron Biblioteca Jurídica, Conocimiento Procesal y Constructor de Documentos bajo un nuevo acceso principal: Centro de Conocimiento.
- Se añadió una interfaz de búsqueda por problema jurídico y navegación por recursos relacionados.
- Se incorporó Derecho Familiar como materia piloto con fichas de Divorcio, Alimentos, Guarda y Custodia, Convivencias y Liquidación de Sociedad Legal.
- Cada ficha integra explicación, ruta procesal, legislación, documentos, checklist y estrategia.
- Se conservaron los módulos anteriores y sus datos para una migración gradual sin pérdida de funcionalidad.

## v4.4.4
- Resultados de calculadoras adaptados a pantallas móviles.
- Opción para calcular únicamente finiquito sin liquidación.

## v4.6.0 — Migración de tres módulos SIGDE a LegalTech Control
- Se incorporó el Constructor Maestro con registro de 573 fichas JSON, filtro por materia, campos dinámicos, diagnóstico, vía, pruebas y generación de borrador editable.
- Los borradores del constructor maestro se guardan localmente en el navegador, separados del constructor clásico.
- Se incorporó Conocimiento Procesal SIGDE con rutas, etapas, control del expediente y consulta de términos relacionados con la Supermatriz V19.
- Se separaron perfiles de navegación para Civil Jalisco/CPCEJ y Civil nacional/CNPCF, así como los regímenes local/nacional en Familiar y Sucesorio.
- Se migraron calculadoras jurídicas mejoradas y las calculadoras IMSS Ley 73/Ley 97 con comparador y guardado local de cálculos.
- Se conservaron las experiencias clásicas de Constructor y Asistente, seleccionables desde la propia interfaz.
- Se renovó la versión de caché de la PWA para cargar los módulos nuevos.
- Los módulos migrados no guardan automáticamente en expedientes Firestore ni en Firebase Storage. Los borradores locales permanecen en el navegador de este equipo.
- Se comprobó sintaxis JavaScript, integridad de las 573 fichas JSON y referencias internas del dashboard. No se desplegó a Firebase ni se verificó el cómputo jurídico de cada parámetro de las calculadoras.

## v4.8.0 — Términos procesales y retiro de Estrategia Procesal
- Se añade módulo independiente de Términos procesales con catálogo canónico (291 registros) y consulta de rutas/etapas de la Supermatriz V19 (121 rutas).
- Se añade control de vencimientos en la colección existente `alertas`, con estado pendiente/cumplido/cancelado y resumen de vencimientos.
- Los vencimientos requieren fecha manual verificada; no se generan fechas automáticamente a partir de registros de catálogo.
- Se retira el submódulo independiente Estrategia Procesal del menú, la vista, el script y la caché PWA.
- No se cambió `firebase.json`, `.firebaserc`, `firestore.rules` ni se desplegaron servicios.
