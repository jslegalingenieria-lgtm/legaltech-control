# LegalTech Control v4.9.1 — Kanban + Gestión y control

## Cambios

- Asuntos: se agregó una vista Kanban que queda seleccionada por defecto. La vista Tabla se mantiene como alternativa.
- Kanban: columnas En proceso, Suspendido, Concluido y Cancelado; tarjetas con accesos a bitácora, edición y cambio de estado según permisos.
- Orden: Kanban y Tabla ordenan por número de expediente descendente.
- Menú: Cotizaciones, Gastos y costos y Reportes KPI quedan dentro del grupo Gestión y control. El acceso independiente a Cotizaciones se sustituyó para evitar una opción duplicada.
- Backend: el módulo financiero utiliza las colecciones raíz `cotizaciones` y `registrosFinancieros` de LegalTech.
- Seguridad: se añadieron reglas para que Superadministrador/Administrador tengan acceso global a esos registros, mientras que el resto del personal autorizado solo acceda a registros propios.
- PWA: caché incrementada a `js-legaltech-v4.9.1-kanban-gestion-control`.

## Aplicación

1. Haz una copia de seguridad de la carpeta de proyecto antes de reemplazar archivos.
2. Para probar el proyecto completo, extrae el ZIP en una carpeta nueva y abre el proyecto con el flujo habitual de LegalTech.
3. Para actualizar una copia que ya contiene la base v4.8.0, aplica el parche `PARCHE_KANBAN_GESTION_CONTROL_v4_9_1.zip` sobre la raíz del proyecto.
4. La vista financiera requiere sesión autorizada y Firestore. Si se usa en línea, las reglas nuevas de `firestore.rules` deben desplegarse por separado cuando decidas hacerlo. No se ha ejecutado ningún deploy.

## Datos y alcance

- Nuevas cotizaciones se guardan en `cotizaciones`; ingresos y gastos/costos se guardan en `registrosFinancieros`.
- El paquete no convierte automáticamente los registros financieros del modelo SIGDE (`companies/...`) al modelo raíz de LegalTech.
- Los KPI de clientes y asuntos consultan la caché local que mantienen los módulos existentes, por lo que pueden ser parciales si la caché no contiene todos los registros disponibles.
- La tabla Kanban es una vista de presentación; no se ha añadido arrastre de tarjetas para cambiar estados. El cambio de estado usa la acción ya existente del módulo Asuntos.

## Validación

Se validaron sintaxis de `js/app.js`, `js/asuntos.js`, `js/gestion-control.js` y `sw.js`; referencias de scripts, rutas de vistas e integridad del paquete. No se ejecutaron pruebas reales con una sesión autenticada ni despliegue de Firebase.
