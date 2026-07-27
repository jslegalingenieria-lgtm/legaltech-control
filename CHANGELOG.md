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
