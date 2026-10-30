# JS LegalTech Control — archivos locales sin Firebase Storage

## Arquitectura
- Firebase Authentication y Cloud Firestore continúan funcionando para usuarios, permisos, expedientes y metadatos.
- Firebase Storage no se carga ni se inicializa.
- El contenido binario de PDF/JPG/PNG se guarda en IndexedDB del navegador (base `js_legaltech_archivos_locales`).
- Firestore conserva únicamente metadatos documentales y referencias; no recibe el contenido de los archivos.

## Límites y advertencias
- Máximo 10 MB por archivo y 20 archivos por expediente, conforme a la lógica existente.
- Los archivos locales solo están disponibles en el mismo navegador, perfil y origen (dominio/puerto). No se sincronizan entre computadoras ni navegadores.
- Borrar datos del sitio, limpiar el almacenamiento del navegador o cambiar de equipo puede eliminar o dejar inaccesibles los archivos.
- Se recomienda conservar respaldos externos de los documentos importantes.
- Los archivos que ya estaban en Firebase Storage antes de esta versión no se migran ni se eliminan. Los registros remotos antiguos siguen pudiendo abrir su URL si aún existe.

## Prueba
1. Descomprimir el proyecto completo.
2. Abrir `dashboard.html` con Live Server (no usar `file://`).
3. Iniciar sesión con Firebase Authentication.
4. En el panel de Superadministrador, habilitar Gestión documental.
5. Adjuntar un PDF o fotografía a un expediente y guardar una actuación con adjuntos.
6. Recargar la página y comprobar que el archivo sigue disponible en el mismo navegador.
7. Revisar Firebase Console: no debe haber nuevas cargas a Storage; Firestore sí tendrá metadatos.
