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
