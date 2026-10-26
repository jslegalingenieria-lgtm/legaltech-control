# Migración SIGDE -> JS LegalTech Control v4.6.0

## Módulos integrados

1. **Constructor Maestro**: registro de 573 constructores, fichas JSON estructuradas, diagnóstico, vía, hechos, pretensiones, pruebas, documentos, fundamentos, teoría del caso, campos dinámicos, borrador editable, descarga Word, impresión y guardado local.
2. **Conocimiento Procesal**: rutas de la base SIGDE, división explícita Civil Jalisco/CPCEJ vs Civil nacional/CNPCF y familiar/sucesorio por régimen, etapas de litigación, indicadores de ruta y consulta de términos contra la Supermatriz V19.
3. **Calculadoras Jurídicas**: motor mejorado de liquidación, alimentos e intereses con reportes Word/PDF, más pensiones IMSS Ley 73/Ley 97 y comparador.

## Compatibilidad y límites

- Las experiencias clásicas de Constructor de Documentos y Asistente de Litigación de LegalTech permanecen disponibles mediante el selector de cada módulo.
- Los borradores del Constructor Maestro se guardan en `localStorage` con la clave `jslt_sigde_constructores_borradores` y los cálculos de pensiones con `jslt_calculos_pensiones`.
- El Constructor Maestro descarga documentos en formato Word HTML (`.doc`) y permite impresión. No guarda automáticamente a expedientes Firestore ni sube documentos a Storage; esa integración requiere conectar el módulo a las APIs existentes de LegalTech.
- Las 573 fichas de `constructores_json/` se cargan por `fetch`, por lo que el proyecto debe servirse mediante HTTP/HTTPS (por ejemplo, Firebase Hosting, un servidor local o GitHub Pages). No abrir `dashboard.html` con `file://`.
- Términos y fundamentos procesales son los datos migrados desde SIGDE. El sistema los presenta como apoyo; no certifica la vigencia de cada plazo ni reemplaza la revisión profesional. La pensión IMSS es una estimación y requiere actualizar/verificar parámetros.
- No se ha desplegado Hosting ni Functions. Las tres migraciones de interfaz funcionan en cliente, pero algunas funciones de backend de LegalTech/buscador requieren la configuración de su proyecto al desplegar.

## Instalación

Extrae el parche ZIP sobre la raíz de la versión LegalTech que ya incluye el buscador SJF v4.5.1 y acepta reemplazar los archivos indicados. Antes de desplegar, haz una copia de seguridad. El ZIP completo v4.6.0 contiene también una copia integrada de todos los archivos.
