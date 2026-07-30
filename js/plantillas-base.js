(() => {
"use strict";

/*
 * Biblioteca estructural v3.3.3
 * Estas plantillas NO copian hechos, nombres, domicilios, artículos,
 * tesis, cantidades ni circunstancias de los escritos de origen.
 * Únicamente conservan una estructura general editable por tipo de documento.
 */

const CATALOGO = [
  {
    "id": "estructura-aclaracion-administrativa-general-imss",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Aclaracion administrativa general IMSS",
    "tipo": "administrativo"
  },
  {
    "id": "estructura-aclaracion-administrativa-pension-imss",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Aclaracion Administrativa-Pension-IMSS",
    "tipo": "administrativo"
  },
  {
    "id": "estructura-demanda-de-amparo-indirecto-en-materia-administrativa",
    "materia": "Amparo",
    "etapa": "Inicio",
    "nombre": "Demanda de amparo indirecto en materia administrativa",
    "tipo": "amparo_indirecto"
  },
  {
    "id": "estructura-aviso-de-privacidad",
    "materia": "Contratos y documentos",
    "etapa": "Documentos generales",
    "nombre": "Aviso de privacidad",
    "tipo": "aviso_privacidad"
  },
  {
    "id": "estructura-aviso-de-rescicion-laboral",
    "materia": "Laboral",
    "etapa": "Promociones",
    "nombre": "Aviso de rescición laboral",
    "tipo": "promocion"
  },
  {
    "id": "estructura-carta-poder-simple",
    "materia": "Contratos y documentos",
    "etapa": "Documentos generales",
    "nombre": "Carta poder simple",
    "tipo": "carta_poder"
  },
  {
    "id": "estructura-certificado-de-deposito-y-bono-de-prenda",
    "materia": "Mercantil",
    "etapa": "Documentos mercantiles",
    "nombre": "certificado de deposito y bono de prenda",
    "tipo": "titulo_credito"
  },
  {
    "id": "estructura-confirmacion-de-criterio-consulta-sat",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Confirmacion de criterio-consulta-SAT",
    "tipo": "administrativo"
  },
  {
    "id": "estructura-contestacion-demanda-ordinaria-mercantil",
    "materia": "Mercantil",
    "etapa": "Contestación",
    "nombre": "Contestacion demanda ordinaria mercantil",
    "tipo": "contestacion"
  },
  {
    "id": "estructura-contestacion-plego-petitorio-huelga",
    "materia": "Laboral",
    "etapa": "Contestación",
    "nombre": "Contestacion plego petitorio huelga",
    "tipo": "contestacion"
  },
  {
    "id": "estructura-contrato-colectivo-de-trabajo",
    "materia": "Laboral",
    "etapa": "Contratos",
    "nombre": "Contrato colectivo de trabajo",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-comodato",
    "materia": "Contratos y documentos",
    "etapa": "Contratos",
    "nombre": "Contrato comodato",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-de-arrendamiento-mercantil",
    "materia": "Mercantil",
    "etapa": "Contratos",
    "nombre": "Contrato de arrendamiento-mercantil",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-de-compraventa-mercantil",
    "materia": "Mercantil",
    "etapa": "Contratos",
    "nombre": "Contrato de compraventa mercantil",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-de-confidencialidad",
    "materia": "Contratos y documentos",
    "etapa": "Contratos",
    "nombre": "CONTRATO DE CONFIDENCIALIDAD",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-de-mutuo",
    "materia": "Contratos y documentos",
    "etapa": "Contratos",
    "nombre": "Contrato de mutuo",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-de-patrocinio-o-esponsorizacion",
    "materia": "Contratos y documentos",
    "etapa": "Contratos",
    "nombre": "Contrato de patrocinio o esponsorizacion",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-de-prestacion-de-servicios-de-mantenimiento",
    "materia": "Contratos y documentos",
    "etapa": "Contratos",
    "nombre": "Contrato de prestacion de servicios de mantenimiento",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-de-prestacion-de-servicios-profesionales",
    "materia": "Contratos y documentos",
    "etapa": "Contratos",
    "nombre": "CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES",
    "tipo": "contrato"
  },
  {
    "id": "estructura-contrato-individual-de-trabajo-temporal",
    "materia": "Laboral",
    "etapa": "Contratos",
    "nombre": "Contrato individual de trabajo temporal",
    "tipo": "contrato"
  },
  {
    "id": "estructura-controvesrsia-de-orden-familiar-reincorporacion-de-los-menores",
    "materia": "Familiar",
    "etapa": "Inicio",
    "nombre": "Controvesrsia de orden familiar-reincorporación de los menores",
    "tipo": "demanda"
  },
  {
    "id": "estructura-promocion-de-cumplimiento-de-ejecutoria-de-amparo",
    "materia": "Amparo",
    "etapa": "Cumplimiento",
    "nombre": "Promoción de cumplimiento de ejecutoria de amparo",
    "tipo": "cumplimiento_amparo"
  },
  {
    "id": "estructura-demanda-de-alimentos",
    "materia": "Familiar",
    "etapa": "Inicio",
    "nombre": "Demanda de Alimentos",
    "tipo": "demanda"
  },
  {
    "id": "estructura-demanda-de-amparo-directo-en-materia-administrativa",
    "materia": "Amparo",
    "etapa": "Inicio",
    "nombre": "Demanda de amparo directo en materia administrativa",
    "tipo": "amparo_directo"
  },
  {
    "id": "estructura-demanda-laboral-despido-injustificado",
    "materia": "Laboral",
    "etapa": "Inicio",
    "nombre": "demanda laboral despido injustificado",
    "tipo": "demanda"
  },
  {
    "id": "estructura-demanda-ordinaria-mercantil-accion-rescisoria",
    "materia": "Mercantil",
    "etapa": "Inicio",
    "nombre": "Demanda ordinaria mercantil accion rescisoria",
    "tipo": "demanda"
  },
  {
    "id": "estructura-divorcio-incausado-ordinario",
    "materia": "Familiar",
    "etapa": "Inicio",
    "nombre": "Divorcio incausado ordinario",
    "tipo": "demanda"
  },
  {
    "id": "estructura-solicitud-de-suspension-del-acto-reclamado",
    "materia": "Amparo",
    "etapa": "Incidentes",
    "nombre": "Solicitud de suspensión del acto reclamado",
    "tipo": "suspension"
  },
  {
    "id": "estructura-demanda-de-amparo-indirecto-en-materia-penal",
    "materia": "Amparo",
    "etapa": "Inicio",
    "nombre": "Demanda de amparo indirecto en materia penal",
    "tipo": "amparo_indirecto"
  },
  {
    "id": "estructura-juicio-civil-incidente-de-ejecucion-de-sentencia",
    "materia": "Civil",
    "etapa": "Ejecución",
    "nombre": "Juicio Civil-Incidente de Ejecución de Sentencia",
    "tipo": "incidente"
  },
  {
    "id": "estructura-juicio-civil-incidente-de-liquidacion-de-sentencia",
    "materia": "Civil",
    "etapa": "Ejecución",
    "nombre": "Juicio Civil-Incidente de Liquidación de Sentencia",
    "tipo": "incidente"
  },
  {
    "id": "estructura-juicio-de-nulidad-multa-stps",
    "materia": "Administrativo",
    "etapa": "Inicio",
    "nombre": "Juicio de nulidad-multa-STPS",
    "tipo": "demanda"
  },
  {
    "id": "estructura-juicio-especial-mercantil-recurso-de-apelacion-en-contra-del-auto",
    "materia": "Mercantil",
    "etapa": "Recursos",
    "nombre": "Juicio Especial Mercantil-Recurso de Apelación en Contra del Auto",
    "tipo": "recurso"
  },
  {
    "id": "estructura-juicio-oral-mercantil-contestacion-demanda-requiere-pago",
    "materia": "Mercantil",
    "etapa": "Contestación",
    "nombre": "Juicio Oral Mercantil-Contestación Demanda Requiere Pago",
    "tipo": "contestacion"
  },
  {
    "id": "estructura-juicio-oral-mercantil-desahogo-de-pruebas",
    "materia": "Mercantil",
    "etapa": "Pruebas",
    "nombre": "Juicio Oral Mercantil-Desahogo de Pruebas",
    "tipo": "pruebas"
  },
  {
    "id": "estructura-juicio-oral-sumarisimo-civil-contestacion-demanda-de-desahucio",
    "materia": "Civil",
    "etapa": "Contestación",
    "nombre": "Juicio Oral sumarísimo Civil- contestación demanda de desahucio",
    "tipo": "contestacion"
  },
  {
    "id": "estructura-juicio-ordinario-ejecutivo-mercantil-accion-de-pago",
    "materia": "Mercantil",
    "etapa": "Inicio",
    "nombre": "Juicio Ordinario Ejecutivo Mercantil- Acción de Pago",
    "tipo": "demanda"
  },
  {
    "id": "estructura-juicio-ordinario-mercantil-demanda-de-oposicion-de-acuerdos-en-asambleas-de-accionistas",
    "materia": "Mercantil",
    "etapa": "Inicio",
    "nombre": "Juicio Ordinario Mercantil-Demanda de oposición de acuerdos en asambleas de accionistas",
    "tipo": "demanda"
  },
  {
    "id": "estructura-juicio-sumario-accion-de-desahucio",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Juicio sumario-accion de desahucio",
    "tipo": "demanda"
  },
  {
    "id": "estructura-modelo-incidente-de-ejecucion-de-sentencia",
    "materia": "Civil",
    "etapa": "Ejecución",
    "nombre": "Modelo_Incidente de Ejecución de sentencia",
    "tipo": "incidente"
  },
  {
    "id": "estructura-ofrecimiento-de-pruebas-laboral",
    "materia": "Laboral",
    "etapa": "Pruebas",
    "nombre": "Ofrecimiento de pruebas laboral",
    "tipo": "pruebas"
  },
  {
    "id": "estructura-pliego-de-peticiones-con-emplazamiento-a-huelga",
    "materia": "Laboral",
    "etapa": "Huelga",
    "nombre": "Pliego de peticiones con emplazamiento a huelga",
    "tipo": "huelga"
  },
  {
    "id": "estructura-prevencion-familiar",
    "materia": "Familiar",
    "etapa": "Promociones",
    "nombre": "Prevencion familiar",
    "tipo": "prevencion"
  },
  {
    "id": "estructura-procedimiento-judicial-de-ejecucion-de-garantia-otorgada-mediante-prenda-sin-transmision-de-posesion",
    "materia": "Mercantil",
    "etapa": "Ejecución",
    "nombre": "Procedimiento Judicial de Ejecución de Garantía Otorgada Mediante Prenda sin Transmisión de Posesión",
    "tipo": "garantia"
  },
  {
    "id": "estructura-promocion-de-procedimiento-paraprocesal-laboral",
    "materia": "Laboral",
    "etapa": "Procedimientos especiales",
    "nombre": "PROMOCIÓN DE PROCEDIMIENTO PARAPROCESAL laboral",
    "tipo": "paraprocesal"
  },
  {
    "id": "estructura-prueba-confesional",
    "materia": "Familiar",
    "etapa": "Pruebas",
    "nombre": "Prueba confesional",
    "tipo": "pruebas"
  },
  {
    "id": "estructura-prueba-testimonial",
    "materia": "Familiar",
    "etapa": "Pruebas",
    "nombre": "Prueba Testimonial",
    "tipo": "pruebas"
  },
  {
    "id": "estructura-recurso-de-apelacion-desechamiento-pruebas",
    "materia": "General",
    "etapa": "Recursos",
    "nombre": "Recurso de apelación-desechamiento pruebas",
    "tipo": "recurso"
  },
  {
    "id": "estructura-recurso-de-inconformidad-automovil",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "RECURSO DE INCONFORMIDAD automovil",
    "tipo": "recurso"
  },
  {
    "id": "estructura-recurso-de-inconformidad-pension-imss",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "Recurso de inconformidad-pension-IMSS",
    "tipo": "recurso"
  },
  {
    "id": "estructura-recurso-de-inconformidad",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "RECURSO DE INCONFORMIDAD",
    "tipo": "recurso"
  },
  {
    "id": "estructura-recurso-de-revision-resolucion-irregularidades",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "Recurso de revision-resolucion irregularidades",
    "tipo": "recurso"
  },
  {
    "id": "estructura-recurso-de-revision-automovil",
    "materia": "General",
    "etapa": "Recursos",
    "nombre": "RECURSO DE REVISIÓN Automovil",
    "tipo": "recurso"
  },
  {
    "id": "estructura-recurso-de-revision",
    "materia": "General",
    "etapa": "Recursos",
    "nombre": "RECURSO DE REVISIÓN",
    "tipo": "recurso"
  },
  {
    "id": "estructura-recurso-de-revocacion-credito-fiscal",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "RECURSO DE REVOCACIÓN-credito fiscal",
    "tipo": "recurso"
  },
  {
    "id": "estructura-reglamento-interior-de-trabajo",
    "materia": "Laboral",
    "etapa": "Reglamentos",
    "nombre": "Reglamento interior de trabajo",
    "tipo": "reglamento"
  },
  {
    "id": "estructura-revocacion-y-designacion-de-abogado-patrono",
    "materia": "General",
    "etapa": "Promociones",
    "nombre": "Revocación y designación de abogado patrono",
    "tipo": "cambio_abogado"
  }
];
const CATALOGO_AMPLIADO = [
  {
    "id": "modelo-demanda-de-cumplimiento-de-contrato",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de cumplimiento de contrato",
    "tipo": "demanda",
    "submateria": "Obligaciones",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-rescision-de-contrato",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de rescisión de contrato",
    "tipo": "demanda",
    "submateria": "Obligaciones",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-pago-de-danos-y-perjuicios",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de pago de daños y perjuicios",
    "tipo": "demanda",
    "submateria": "Responsabilidad civil",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-responsabilidad-civil-objetiva",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de responsabilidad civil objetiva",
    "tipo": "demanda",
    "submateria": "Responsabilidad civil",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-accion-reivindicatoria",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de acción reivindicatoria",
    "tipo": "demanda",
    "submateria": "Derechos reales",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-accion-publiciana",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de acción publiciana",
    "tipo": "demanda",
    "submateria": "Derechos reales",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-prescripcion-positiva",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de prescripción positiva",
    "tipo": "demanda",
    "submateria": "Usucapión",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-nulidad-de-contrato",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de nulidad de contrato",
    "tipo": "demanda",
    "submateria": "Contratos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-otorgamiento-y-firma-de-escritura",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de otorgamiento y firma de escritura",
    "tipo": "demanda",
    "submateria": "Contratos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-terminacion-de-arrendamiento",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de terminación de arrendamiento",
    "tipo": "demanda",
    "submateria": "Arrendamiento",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-desocupacion-y-entrega-de-inmueble",
    "materia": "Civil",
    "etapa": "Inicio",
    "nombre": "Demanda de desocupación y entrega de inmueble",
    "tipo": "demanda",
    "submateria": "Arrendamiento",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-contestacion-de-demanda-civil",
    "materia": "Civil",
    "etapa": "Contestación",
    "nombre": "Contestación de demanda civil",
    "tipo": "contestacion",
    "submateria": "General",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-contestacion-con-reconvencion-civil",
    "materia": "Civil",
    "etapa": "Contestación",
    "nombre": "Contestación con reconvención civil",
    "tipo": "contestacion",
    "submateria": "General",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-incidente-de-nulidad-de-actuaciones",
    "materia": "Civil",
    "etapa": "Incidentes",
    "nombre": "Incidente de nulidad de actuaciones",
    "tipo": "incidente",
    "submateria": "Procesal",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-incidente-de-falta-de-personalidad",
    "materia": "Civil",
    "etapa": "Incidentes",
    "nombre": "Incidente de falta de personalidad",
    "tipo": "incidente",
    "submateria": "Procesal",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-incidente-de-liquidacion-de-intereses",
    "materia": "Civil",
    "etapa": "Incidentes",
    "nombre": "Incidente de liquidación de intereses",
    "tipo": "incidente",
    "submateria": "Ejecución",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-incidente-de-gastos-y-costas",
    "materia": "Civil",
    "etapa": "Incidentes",
    "nombre": "Incidente de gastos y costas",
    "tipo": "incidente",
    "submateria": "Ejecución",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-medidas-cautelares-civiles",
    "materia": "Civil",
    "etapa": "Promociones",
    "nombre": "Solicitud de medidas cautelares civiles",
    "tipo": "promocion",
    "submateria": "Cautelares",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-anotacion-preventiva",
    "materia": "Civil",
    "etapa": "Promociones",
    "nombre": "Solicitud de anotación preventiva",
    "tipo": "promocion",
    "submateria": "Registro público",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-informacion-testimonial-ad-perpetuam",
    "materia": "Civil",
    "etapa": "Jurisdicción voluntaria",
    "nombre": "Información testimonial ad perpetuam",
    "tipo": "promocion",
    "submateria": "Jurisdicción voluntaria",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-apeo-y-deslinde",
    "materia": "Civil",
    "etapa": "Jurisdicción voluntaria",
    "nombre": "Apeo y deslinde",
    "tipo": "promocion",
    "submateria": "Jurisdicción voluntaria",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-consignacion-de-pago",
    "materia": "Civil",
    "etapa": "Jurisdicción voluntaria",
    "nombre": "Consignación de pago",
    "tipo": "promocion",
    "submateria": "Jurisdicción voluntaria",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-ofrecimiento-de-pruebas-en-juicio-civil",
    "materia": "Civil",
    "etapa": "Pruebas",
    "nombre": "Ofrecimiento de pruebas en juicio civil",
    "tipo": "pruebas",
    "submateria": "Pruebas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-pliego-de-posiciones-para-prueba-confesional",
    "materia": "Civil",
    "etapa": "Pruebas",
    "nombre": "Pliego de posiciones para prueba confesional",
    "tipo": "pruebas",
    "submateria": "Pruebas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-interrogatorio-para-prueba-testimonial",
    "materia": "Civil",
    "etapa": "Pruebas",
    "nombre": "Interrogatorio para prueba testimonial",
    "tipo": "pruebas",
    "submateria": "Pruebas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-de-apelacion-civil",
    "materia": "Civil",
    "etapa": "Recursos",
    "nombre": "Recurso de apelación civil",
    "tipo": "recurso",
    "submateria": "Recursos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-de-revocacion-civil",
    "materia": "Civil",
    "etapa": "Recursos",
    "nombre": "Recurso de revocación civil",
    "tipo": "recurso",
    "submateria": "Recursos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-ejecucion-de-sentencia-civil",
    "materia": "Civil",
    "etapa": "Ejecución",
    "nombre": "Solicitud de ejecución de sentencia civil",
    "tipo": "incidente",
    "submateria": "Ejecución",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-por-despido-injustificado",
    "materia": "Laboral",
    "etapa": "Inicio",
    "nombre": "Demanda por despido injustificado",
    "tipo": "demanda",
    "submateria": "Individual",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-rescision-imputable-al-patron",
    "materia": "Laboral",
    "etapa": "Inicio",
    "nombre": "Demanda de rescisión imputable al patrón",
    "tipo": "demanda",
    "submateria": "Individual",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-por-pago-de-prestaciones-laborales",
    "materia": "Laboral",
    "etapa": "Inicio",
    "nombre": "Demanda por pago de prestaciones laborales",
    "tipo": "demanda",
    "submateria": "Individual",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-reconocimiento-de-antig-edad",
    "materia": "Laboral",
    "etapa": "Inicio",
    "nombre": "Demanda de reconocimiento de antigüedad",
    "tipo": "demanda",
    "submateria": "Individual",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-designacion-de-beneficiarios",
    "materia": "Laboral",
    "etapa": "Inicio",
    "nombre": "Demanda de designación de beneficiarios",
    "tipo": "demanda",
    "submateria": "Especial",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-por-riesgo-de-trabajo",
    "materia": "Laboral",
    "etapa": "Inicio",
    "nombre": "Demanda por riesgo de trabajo",
    "tipo": "demanda",
    "submateria": "Seguridad social",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-contestacion-de-demanda-laboral",
    "materia": "Laboral",
    "etapa": "Contestación",
    "nombre": "Contestación de demanda laboral",
    "tipo": "contestacion",
    "submateria": "Individual",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-contestacion-de-demanda-de-beneficiarios",
    "materia": "Laboral",
    "etapa": "Contestación",
    "nombre": "Contestación de demanda de beneficiarios",
    "tipo": "contestacion",
    "submateria": "Especial",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-conciliacion-prejudicial",
    "materia": "Laboral",
    "etapa": "Promociones",
    "nombre": "Solicitud de conciliación prejudicial",
    "tipo": "promocion",
    "submateria": "Conciliación",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-convenio-laboral-de-terminacion",
    "materia": "Laboral",
    "etapa": "Promociones",
    "nombre": "Convenio laboral de terminación",
    "tipo": "promocion",
    "submateria": "Convenios",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-aviso-de-rescision-laboral",
    "materia": "Laboral",
    "etapa": "Promociones",
    "nombre": "Aviso de rescisión laboral",
    "tipo": "promocion",
    "submateria": "Relación laboral",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-carta-de-renuncia-voluntaria",
    "materia": "Laboral",
    "etapa": "Promociones",
    "nombre": "Carta de renuncia voluntaria",
    "tipo": "promocion",
    "submateria": "Relación laboral",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-reinstalacion",
    "materia": "Laboral",
    "etapa": "Promociones",
    "nombre": "Solicitud de reinstalación",
    "tipo": "promocion",
    "submateria": "Individual",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-ofrecimiento-de-pruebas-laboral",
    "materia": "Laboral",
    "etapa": "Pruebas",
    "nombre": "Ofrecimiento de pruebas laboral",
    "tipo": "pruebas",
    "submateria": "Pruebas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-objecion-de-documentos-laborales",
    "materia": "Laboral",
    "etapa": "Pruebas",
    "nombre": "Objeción de documentos laborales",
    "tipo": "pruebas",
    "submateria": "Pruebas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-interrogatorio-laboral-para-testigos",
    "materia": "Laboral",
    "etapa": "Pruebas",
    "nombre": "Interrogatorio laboral para testigos",
    "tipo": "pruebas",
    "submateria": "Pruebas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-incidente-de-liquidacion-laboral",
    "materia": "Laboral",
    "etapa": "Incidentes",
    "nombre": "Incidente de liquidación laboral",
    "tipo": "incidente",
    "submateria": "Ejecución",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-ejecucion-de-sentencia-laboral",
    "materia": "Laboral",
    "etapa": "Ejecución",
    "nombre": "Solicitud de ejecución de sentencia laboral",
    "tipo": "incidente",
    "submateria": "Ejecución",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-de-reconsideracion-laboral",
    "materia": "Laboral",
    "etapa": "Recursos",
    "nombre": "Recurso de reconsideración laboral",
    "tipo": "recurso",
    "submateria": "Recursos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-amparo-directo-laboral",
    "materia": "Laboral",
    "etapa": "Amparo",
    "nombre": "Demanda de amparo directo laboral",
    "tipo": "amparo_directo",
    "submateria": "Amparo",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-contrato-individual-de-trabajo-por-tiempo-indeterminado",
    "materia": "Laboral",
    "etapa": "Contratos",
    "nombre": "Contrato individual de trabajo por tiempo indeterminado",
    "tipo": "contrato",
    "submateria": "Contratos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-contrato-individual-de-trabajo-por-obra-determinada",
    "materia": "Laboral",
    "etapa": "Contratos",
    "nombre": "Contrato individual de trabajo por obra determinada",
    "tipo": "contrato",
    "submateria": "Contratos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-convenio-de-confidencialidad-laboral",
    "materia": "Laboral",
    "etapa": "Contratos",
    "nombre": "Convenio de confidencialidad laboral",
    "tipo": "contrato",
    "submateria": "Contratos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-reglamento-interior-de-trabajo-estructural",
    "materia": "Laboral",
    "etapa": "Reglamentos",
    "nombre": "Reglamento interior de trabajo estructural",
    "tipo": "reglamento",
    "submateria": "Reglamentos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-nulidad-administrativa",
    "materia": "Administrativo",
    "etapa": "Inicio",
    "nombre": "Demanda de nulidad administrativa",
    "tipo": "demanda",
    "submateria": "Contencioso administrativo",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-contra-multa-administrativa",
    "materia": "Administrativo",
    "etapa": "Inicio",
    "nombre": "Demanda contra multa administrativa",
    "tipo": "demanda",
    "submateria": "Sanciones",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-contra-clausura-administrativa",
    "materia": "Administrativo",
    "etapa": "Inicio",
    "nombre": "Demanda contra clausura administrativa",
    "tipo": "demanda",
    "submateria": "Sanciones",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-por-negativa-ficta",
    "materia": "Administrativo",
    "etapa": "Inicio",
    "nombre": "Demanda por negativa ficta",
    "tipo": "demanda",
    "submateria": "Contencioso administrativo",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-escrito-de-derecho-de-peticion",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Escrito de derecho de petición",
    "tipo": "administrativo",
    "submateria": "General",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-acceso-a-expediente-administrativo",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Solicitud de acceso a expediente administrativo",
    "tipo": "administrativo",
    "submateria": "General",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-alegatos-en-procedimiento-administrativo",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Alegatos en procedimiento administrativo",
    "tipo": "administrativo",
    "submateria": "Procedimiento",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-contestacion-a-requerimiento-administrativo",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Contestación a requerimiento administrativo",
    "tipo": "administrativo",
    "submateria": "Procedimiento",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-desahogo-de-prevencion-administrativa",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Desahogo de prevención administrativa",
    "tipo": "administrativo",
    "submateria": "Procedimiento",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-devolucion-de-pago-indebido",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Solicitud de devolución de pago indebido",
    "tipo": "administrativo",
    "submateria": "Fiscal",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-consulta-administrativa-a-autoridad",
    "materia": "Administrativo",
    "etapa": "Promociones",
    "nombre": "Consulta administrativa a autoridad",
    "tipo": "administrativo",
    "submateria": "General",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-de-revision-administrativo",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "Recurso de revisión administrativo",
    "tipo": "recurso",
    "submateria": "Recursos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-de-inconformidad-administrativo",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "Recurso de inconformidad administrativo",
    "tipo": "recurso",
    "submateria": "Recursos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-de-revocacion-fiscal",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "Recurso de revocación fiscal",
    "tipo": "recurso",
    "submateria": "Fiscal",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-de-inconformidad-ante-imss",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "Recurso de inconformidad ante IMSS",
    "tipo": "recurso",
    "submateria": "Seguridad social",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-contra-resolucion-de-movilidad",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "Recurso contra resolución de movilidad",
    "tipo": "recurso",
    "submateria": "Movilidad",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-suspension-del-acto-administrativo",
    "materia": "Administrativo",
    "etapa": "Incidentes",
    "nombre": "Solicitud de suspensión del acto administrativo",
    "tipo": "incidente",
    "submateria": "Cautelares",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-ofrecimiento-de-pruebas-administrativas",
    "materia": "Administrativo",
    "etapa": "Pruebas",
    "nombre": "Ofrecimiento de pruebas administrativas",
    "tipo": "pruebas",
    "submateria": "Pruebas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-amparo-indirecto-administrativo",
    "materia": "Administrativo",
    "etapa": "Amparo",
    "nombre": "Demanda de amparo indirecto administrativo",
    "tipo": "amparo_indirecto",
    "submateria": "Amparo",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-cumplimiento-de-sentencia-administrativa",
    "materia": "Administrativo",
    "etapa": "Ejecución",
    "nombre": "Solicitud de cumplimiento de sentencia administrativa",
    "tipo": "promocion",
    "submateria": "Ejecución",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-denuncia-de-hechos-posiblemente-constitutivos-de-delito",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Denuncia de hechos posiblemente constitutivos de delito",
    "tipo": "promocion",
    "submateria": "Investigación inicial",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-querella",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Querella",
    "tipo": "promocion",
    "submateria": "Investigación inicial",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-ampliacion-de-denuncia-o-querella",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Ampliación de denuncia o querella",
    "tipo": "promocion",
    "submateria": "Investigación inicial",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-actos-de-investigacion",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Solicitud de actos de investigación",
    "tipo": "promocion",
    "submateria": "Investigación complementaria",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-copias-de-carpeta-de-investigacion",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Solicitud de copias de carpeta de investigación",
    "tipo": "promocion",
    "submateria": "Carpeta de investigación",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-designacion-de-asesor-juridico",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Designación de asesor jurídico",
    "tipo": "promocion",
    "submateria": "Víctima u ofendido",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-designacion-de-defensor-particular",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Designación de defensor particular",
    "tipo": "promocion",
    "submateria": "Imputado",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-devolucion-de-bienes-asegurados",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Solicitud de devolución de bienes asegurados",
    "tipo": "promocion",
    "submateria": "Aseguramiento",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-control-de-detencion",
    "materia": "Penal",
    "etapa": "Audiencia inicial",
    "nombre": "Solicitud de control de detención",
    "tipo": "promocion",
    "submateria": "Audiencia inicial",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-argumentos-para-vinculacion-a-proceso",
    "materia": "Penal",
    "etapa": "Audiencia inicial",
    "nombre": "Argumentos para vinculación a proceso",
    "tipo": "promocion",
    "submateria": "Audiencia inicial",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-argumentos-contra-vinculacion-a-proceso",
    "materia": "Penal",
    "etapa": "Audiencia inicial",
    "nombre": "Argumentos contra vinculación a proceso",
    "tipo": "promocion",
    "submateria": "Audiencia inicial",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-modificacion-de-medida-cautelar",
    "materia": "Penal",
    "etapa": "Medidas cautelares",
    "nombre": "Solicitud de modificación de medida cautelar",
    "tipo": "incidente",
    "submateria": "Medidas cautelares",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-revision-de-prision-preventiva",
    "materia": "Penal",
    "etapa": "Medidas cautelares",
    "nombre": "Solicitud de revisión de prisión preventiva",
    "tipo": "incidente",
    "submateria": "Medidas cautelares",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-escrito-de-acusacion-coadyuvante",
    "materia": "Penal",
    "etapa": "Etapa intermedia",
    "nombre": "Escrito de acusación coadyuvante",
    "tipo": "promocion",
    "submateria": "Etapa intermedia",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-contestacion-de-acusacion",
    "materia": "Penal",
    "etapa": "Etapa intermedia",
    "nombre": "Contestación de acusación",
    "tipo": "contestacion",
    "submateria": "Etapa intermedia",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-ofrecimiento-de-pruebas-penales",
    "materia": "Penal",
    "etapa": "Etapa intermedia",
    "nombre": "Ofrecimiento de pruebas penales",
    "tipo": "pruebas",
    "submateria": "Etapa intermedia",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-alegato-de-apertura-penal",
    "materia": "Penal",
    "etapa": "Juicio oral",
    "nombre": "Alegato de apertura penal",
    "tipo": "promocion",
    "submateria": "Juicio oral",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-alegato-de-clausura-penal",
    "materia": "Penal",
    "etapa": "Juicio oral",
    "nombre": "Alegato de clausura penal",
    "tipo": "promocion",
    "submateria": "Juicio oral",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-acuerdo-reparatorio",
    "materia": "Penal",
    "etapa": "Salidas alternas",
    "nombre": "Solicitud de acuerdo reparatorio",
    "tipo": "promocion",
    "submateria": "Salidas alternas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-suspension-condicional-del-proceso",
    "materia": "Penal",
    "etapa": "Salidas alternas",
    "nombre": "Solicitud de suspensión condicional del proceso",
    "tipo": "promocion",
    "submateria": "Salidas alternas",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-procedimiento-abreviado",
    "materia": "Penal",
    "etapa": "Procedimiento abreviado",
    "nombre": "Solicitud de procedimiento abreviado",
    "tipo": "promocion",
    "submateria": "Terminación anticipada",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-recurso-de-apelacion-penal",
    "materia": "Penal",
    "etapa": "Recursos",
    "nombre": "Recurso de apelación penal",
    "tipo": "recurso",
    "submateria": "Recursos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-revocacion-penal",
    "materia": "Penal",
    "etapa": "Recursos",
    "nombre": "Revocación penal",
    "tipo": "recurso",
    "submateria": "Recursos",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-beneficio-preliberacional",
    "materia": "Penal",
    "etapa": "Ejecución penal",
    "nombre": "Solicitud de beneficio preliberacional",
    "tipo": "promocion",
    "submateria": "Ejecución",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-incidente-ante-juez-de-ejecucion",
    "materia": "Penal",
    "etapa": "Ejecución penal",
    "nombre": "Incidente ante juez de ejecución",
    "tipo": "incidente",
    "submateria": "Ejecución",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-demanda-de-amparo-indirecto-penal",
    "materia": "Penal",
    "etapa": "Amparo",
    "nombre": "Demanda de amparo indirecto penal",
    "tipo": "amparo_indirecto",
    "submateria": "Amparo",
    "origen": "Modelo estructural ampliado",
    "revision": true
  },
  {
    "id": "modelo-solicitud-de-suspension-en-amparo-penal",
    "materia": "Penal",
    "etapa": "Amparo",
    "nombre": "Solicitud de suspensión en amparo penal",
    "tipo": "suspension",
    "submateria": "Amparo",
    "origen": "Modelo estructural ampliado",
    "revision": true
  }
];
CATALOGO.push(...CATALOGO_AMPLIADO);
const CATALOGO_MIDESPACHO = [
  {
    "id": "midespacho-acta-constitutiva-y-primera-asamblea-de-una-asociacion-civil",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta Constitutiva y Primera Asamblea de una Asociación Civil",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-de-cambio-de-regimen-juridico-de-s-a-a-s-a-de-c-v",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea de Cambio de Régimen Jurídico de S.A. a S.A. de C.V.",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-especial-de-accionistas-de-la-serie-a",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea Especial de Accionistas de la Serie A",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-extraordinaria-para-fusion-de-sociedades",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea Extraordinaria para Fusión de Sociedades",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-extraordinaria-para-cambio-de-objeto-social",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea Extraordinaria para Cambio de Objeto Social",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-general-extraordinaria-para-aprobar-balance-de-liquidacion",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea General Extraordinaria para Aprobar Balance de Liquidación",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-para-amortizar-acciones-y-emitir-acciones-de-goce",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea para Amortizar Acciones y Emitir Acciones de Goce",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-para-emitir-bonos-u-obligaciones",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea para Emitir Bonos u Obligaciones",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-general-ordinaria",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea General Ordinaria",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-asamblea-para-admision-de-nuevos-socios-y-modificacion-de-estatutos",
    "materia": "Mercantil",
    "etapa": "Actas de asamblea",
    "nombre": "Acta de Asamblea para Admisión de Nuevos Socios y Modificación de Estatutos",
    "tipo": "contrato",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-aclaracion-al-acuerdo-que-fija-dia-y-hora-para-remate",
    "materia": "Civil",
    "etapa": "Acuerdos y promociones",
    "nombre": "Aclaración al Acuerdo que Fija Día y Hora para Remate",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-acuerdo-en-audiencia-de-justicia-alternativa",
    "materia": "Civil",
    "etapa": "Justicia alternativa",
    "nombre": "Acta de Acuerdo en Audiencia de Justicia Alternativa",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-no-acuerdo-en-justicia-alternativa",
    "materia": "Civil",
    "etapa": "Justicia alternativa",
    "nombre": "Acta de No Acuerdo en Justicia Alternativa",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acuerdo-de-admision-del-recurso-de-revision",
    "materia": "Administrativo",
    "etapa": "Recursos",
    "nombre": "Acuerdo de Admisión del Recurso de Revisión",
    "tipo": "administrativo",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acuerdo-de-certificacion-en-juicio-de-arrendamiento",
    "materia": "Civil",
    "etapa": "Arrendamiento",
    "nombre": "Acuerdo de Certificación en Juicio de Arrendamiento",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acuerdo-de-citacion-de-testigos",
    "materia": "Civil",
    "etapa": "Pruebas",
    "nombre": "Acuerdo de Citación de Testigos",
    "tipo": "pruebas",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acuerdo-de-declaratoria-de-ejecutoria-de-sentencia-de-amparo",
    "materia": "Amparo",
    "etapa": "Ejecución",
    "nombre": "Acuerdo de Declaratoria de Ejecutoria de Sentencia de Amparo",
    "tipo": "cumplimiento_amparo",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-contestacion-de-demanda-y-reconvencion-en-juicio-de-filiacion",
    "materia": "Familiar",
    "etapa": "Filiación",
    "nombre": "Contestación de demanda y reconvención en juicio de filiación",
    "tipo": "contestacion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-solicitud-de-devolucion-de-fianza-cancelada",
    "materia": "Civil",
    "etapa": "Garantías",
    "nombre": "Solicitud de devolución de fianza cancelada",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acuerdo-de-ejercicio-de-la-accion-penal",
    "materia": "Penal",
    "etapa": "Investigación",
    "nombre": "Acuerdo de Ejercicio de la Acción Penal",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-agravios-en-apelacion-contra-sentencia-de-embargo-precautorio",
    "materia": "Civil",
    "etapa": "Agravios",
    "nombre": "Agravios en apelación contra sentencia de embargo precautorio",
    "tipo": "recurso",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-agravios-en-apelacion-contra-sentencia-definitiva",
    "materia": "Civil",
    "etapa": "Agravios",
    "nombre": "Agravios en apelación contra sentencia definitiva",
    "tipo": "recurso",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-agravios-en-apelacion-contra-sentencia-ejecutoria",
    "materia": "Civil",
    "etapa": "Agravios",
    "nombre": "Agravios en apelación contra sentencia ejecutoria",
    "tipo": "recurso",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-agravios-en-apelacion-contra-sentencia-interlocutoria",
    "materia": "Civil",
    "etapa": "Agravios",
    "nombre": "Agravios en apelación contra sentencia interlocutoria",
    "tipo": "recurso",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-agravios-en-apelacion-contra-auto-de-formal-prision",
    "materia": "Penal",
    "etapa": "Agravios",
    "nombre": "Agravios en apelación contra auto de formal prisión",
    "tipo": "recurso",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-agravios-por-omision-de-requerimiento-de-la-autoridad-laboral",
    "materia": "Laboral",
    "etapa": "Agravios",
    "nombre": "Agravios por omisión de requerimiento de la autoridad laboral",
    "tipo": "recurso",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-escrito-de-agravios-en-apelacion",
    "materia": "Civil",
    "etapa": "Agravios",
    "nombre": "Escrito de agravios en apelación",
    "tipo": "recurso",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-expresion-de-agravios",
    "materia": "Civil",
    "etapa": "Agravios",
    "nombre": "Expresión de agravios",
    "tipo": "recurso",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-alegatos-en-amparo-indirecto-laboral",
    "materia": "Amparo",
    "etapa": "Alegatos",
    "nombre": "Alegatos en amparo indirecto laboral",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-alegatos-en-materia-familiar",
    "materia": "Familiar",
    "etapa": "Alegatos",
    "nombre": "Alegatos en materia familiar",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-alegatos-de-la-parte-actora-en-contradiccion-de-maternidad",
    "materia": "Familiar",
    "etapa": "Filiación",
    "nombre": "Alegatos de la parte actora en contradicción de maternidad",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-alegatos-de-la-parte-actora-en-impugnacion-de-paternidad",
    "materia": "Familiar",
    "etapa": "Filiación",
    "nombre": "Alegatos de la parte actora en impugnación de paternidad",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-alegatos-dentro-del-termino-constitucional",
    "materia": "Penal",
    "etapa": "Alegatos",
    "nombre": "Alegatos dentro del término constitucional",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-alegatos-en-rectificacion-de-acta-de-nacimiento-con-efectos-de-filiacion",
    "materia": "Familiar",
    "etapa": "Registro civil",
    "nombre": "Alegatos en rectificación de acta de nacimiento con efectos de filiación",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acta-de-notificacion-de-demanda-incidental-de-alimentos",
    "materia": "Familiar",
    "etapa": "Alimentos",
    "nombre": "Acta de notificación de demanda incidental de alimentos",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acuerdo-de-radicacion-de-demanda-de-alimentos-en-via-ordinaria",
    "materia": "Familiar",
    "etapa": "Alimentos",
    "nombre": "Acuerdo de radicación de demanda de alimentos en vía ordinaria",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-ratificacion-de-contestacion-y-allanamiento-en-alimentos",
    "materia": "Familiar",
    "etapa": "Alimentos",
    "nombre": "Ratificación de contestación y allanamiento en alimentos",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-contestacion-de-demanda-de-alimentos",
    "materia": "Familiar",
    "etapa": "Alimentos",
    "nombre": "Contestación de demanda de alimentos",
    "tipo": "contestacion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acuerdo-de-admision-de-pruebas-en-juicio-de-alimentos",
    "materia": "Familiar",
    "etapa": "Alimentos",
    "nombre": "Acuerdo de admisión de pruebas en juicio de alimentos",
    "tipo": "pruebas",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-promocion-para-acusar-rebeldia-de-la-parte-demandada",
    "materia": "Familiar",
    "etapa": "Alimentos",
    "nombre": "Promoción para acusar rebeldía de la parte demandada",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-demanda-de-constitucion-forzosa-de-patrimonio-de-familia",
    "materia": "Familiar",
    "etapa": "Patrimonio de familia",
    "nombre": "Demanda de constitución forzosa de patrimonio de familia",
    "tipo": "demanda",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-demanda-de-amparo-contra-leyes",
    "materia": "Amparo",
    "etapa": "Amparo contra leyes",
    "nombre": "Demanda de amparo contra leyes",
    "tipo": "amparo_indirecto",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-amparo-indirecto-con-suspension-de-plano",
    "materia": "Amparo",
    "etapa": "Amparo indirecto",
    "nombre": "Amparo indirecto con suspensión de plano",
    "tipo": "amparo_indirecto",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-amparo-indirecto-contra-orden-de-aprehension-dictada-fuera-de-procedimiento",
    "materia": "Amparo",
    "etapa": "Amparo indirecto",
    "nombre": "Amparo indirecto contra orden de aprehensión dictada fuera de procedimiento",
    "tipo": "amparo_indirecto",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-amparo-adhesivo-laboral",
    "materia": "Amparo",
    "etapa": "Amparo laboral",
    "nombre": "Amparo adhesivo laboral",
    "tipo": "amparo_directo",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-amparo-indirecto-contra-embargo-de-cuentas-bancarias",
    "materia": "Amparo",
    "etapa": "Amparo fiscal",
    "nombre": "Amparo indirecto contra embargo de cuentas bancarias",
    "tipo": "amparo_indirecto",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-demanda-de-amparo-directo-en-materia-civil",
    "materia": "Amparo",
    "etapa": "Amparo directo",
    "nombre": "Demanda de amparo directo en materia civil",
    "tipo": "amparo_directo",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-demanda-de-amparo-directo-en-materia-laboral",
    "materia": "Amparo",
    "etapa": "Amparo directo",
    "nombre": "Demanda de amparo directo en materia laboral",
    "tipo": "amparo_directo",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-auto-admisorio-de-demanda-de-amparo-directo",
    "materia": "Amparo",
    "etapa": "Amparo directo",
    "nombre": "Auto admisorio de demanda de amparo directo",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-acuerdo-de-tramite-para-amparo-indirecto",
    "materia": "Amparo",
    "etapa": "Amparo indirecto",
    "nombre": "Acuerdo de trámite para amparo indirecto",
    "tipo": "promocion",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-amparo-directo-contra-sentencia-del-tribunal-federal-de-justicia-administrativa",
    "materia": "Amparo",
    "etapa": "Amparo directo",
    "nombre": "Amparo directo contra sentencia del Tribunal Federal de Justicia Administrativa",
    "tipo": "amparo_directo",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-demanda-de-amparo-directo-en-materia-penal",
    "materia": "Amparo",
    "etapa": "Amparo penal",
    "nombre": "Demanda de amparo directo en materia penal",
    "tipo": "amparo_directo",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  },
  {
    "id": "midespacho-demanda-de-amparo-indirecto-contra-orden-de-arresto-administrativo",
    "materia": "Amparo",
    "etapa": "Amparo indirecto",
    "nombre": "Demanda de amparo indirecto contra orden de arresto administrativo",
    "tipo": "amparo_indirecto",
    "origen": "Catálogo público MiDespacho; estructura original LexGear",
    "revision": true
  }
];
CATALOGO.push(...CATALOGO_MIDESPACHO);


window.PLANTILLAS_BASE = {};
window.CATALOGO_PLANTILLAS_BASE = CATALOGO;

function esc(v){return String(v ?? "").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function val(v, defecto){return String(v ?? "").trim() || defecto;}
function partes(a){return a?.partes || {};}
function actor(a){const p=partes(a).actor||{}; return {nombre:val(p.nombre,"[ACTOR / PROMOVENTE]"), representante:val(p.representante,""), caracter:val(p.caracter,""), tipo:val(p.tipo,"persona física")};}
function demandado(a){const p=partes(a).demandado||{}; return {nombre:val(p.nombre,"[DEMANDADO / CONTRAPARTE]"), representante:val(p.representante,""), caracter:val(p.caracter,""), tipo:val(p.tipo,"persona física")};}
function autoridad(a){return val(partes(a).autoridadResponsable?.nombre || a?.autoridadResponsable,"[AUTORIDAD RESPONSABLE]");}
function tercero(a){return val(partes(a).terceroInteresado?.nombre || a?.terceroInteresado,"[TERCERO INTERESADO]");}
function juzgado(a){return val(a?.juzgado,"[ÓRGANO JURISDICCIONAL O AUTORIDAD]");}
function expediente(a){return val(a?.expediente || a?.numeroExpediente,"[NÚMERO DE EXPEDIENTE]");}
function ciudadFecha(){return "[LUGAR Y FECHA]";}
function comparecencia(p){
  if(p.representante) return `<strong>${esc(p.nombre)}</strong>, por conducto de <strong>${esc(p.representante)}</strong>${p.caracter?`, en su carácter de ${esc(p.caracter)}`:""}`;
  return `<strong>${esc(p.nombre)}</strong>, por mi propio derecho`;
}
function rubro(a,titulo){return `<table style="width:100%;margin-bottom:24px"><tr><td><strong>${esc(actor(a).nombre)}</strong><br>VS.<br><strong>${esc(demandado(a).nombre)}</strong></td><td style="text-align:right;vertical-align:top"><strong>EXPEDIENTE: ${esc(expediente(a))}</strong><br>${esc(titulo)}</td></tr></table>`;}
function encabezado(a){return `<h3>${esc(juzgado(a))}</h3><h3>P R E S E N T E</h3>`;}
function aviso(){return `<div class="doc-aviso"><strong>Plantilla estructural.</strong> Complete, adapte y verifique cada apartado conforme al asunto concreto. No contiene fundamentos legales, hechos, nombres, domicilios, cantidades ni argumentos tomados de escritos anteriores.</div>`;}
function cierre(nombre){return `<p>Por lo expuesto, solicito se acuerde conforme corresponda.</p><p style="text-align:center;margin-top:32px"><strong>PROTESTO LO NECESARIO</strong></p><p style="text-align:center">${ciudadFecha()}</p><p style="text-align:center;margin-top:48px"><strong>${esc(nombre)}</strong></p>`;}
function lista(titulo, elementos){return `<h3>${titulo}</h3><ol>${elementos.map(x=>`<li>${x}</li>`).join("")}</ol>`;}

function estructuraDemanda(a,nombre){
 const ac=actor(a); return `${aviso()}${rubro(a,nombre)}${encabezado(a)}<p>${comparecencia(ac)}, señalando como domicilio para recibir notificaciones <strong>[DOMICILIO PROCESAL]</strong> y autorizando a <strong>[PERSONAS AUTORIZADAS]</strong>, comparezco para exponer:</p><p>Por medio del presente promuevo <strong>${esc(nombre)}</strong> en contra de <strong>${esc(demandado(a).nombre)}</strong>, con base en la información que se desarrollará en los apartados siguientes.</p>${lista("P R E S T A C I O N E S",["[PRESTACIÓN PRINCIPAL]","[PRESTACIÓN ACCESORIA, SI APLICA]","[GASTOS, COSTAS U OTRAS CONSECUENCIAS, SI APLICA]"])}${lista("H E C H O S",["[ANTECEDENTE RELEVANTE]","[HECHO GENERADOR DE LA ACCIÓN]","[GESTIONES O INCUMPLIMIENTOS POSTERIORES]","[SITUACIÓN ACTUAL]"])}${lista("P R U E B A S",["[DOCUMENTALES]","[TESTIMONIAL, CONFESIONAL, PERICIAL U OTRAS]","[INSTRUMENTAL Y PRESUNCIONAL, SI PROCEDEN]"])}<h3>D E R E C H O</h3><p>[IDENTIFICAR COMPETENCIA, PROCEDENCIA, VÍA Y FUNDAMENTOS APLICABLES AL CASO CONCRETO.]</p>${lista("P E T I T O R I O S",["Tenerme por presentado en los términos del escrito.","Admitir la promoción y dar el trámite que corresponda.","Resolver conforme a las pretensiones que se acrediten."])}${cierre(ac.nombre)}`;
}
function estructuraContestacion(a,nombre){
 const de=demandado(a); return `${aviso()}${rubro(a,nombre)}${encabezado(a)}<p>${comparecencia(de)}, comparezco para dar contestación a la acción intentada en mi contra.</p>${lista("C O N T E S T A C I Ó N  A  L A S  P R E S T A C I O N E S",["[RESPUESTA A LA PRESTACIÓN PRIMERA]","[RESPUESTA A LA PRESTACIÓN SEGUNDA]","[RESPUESTAS ADICIONALES]"])}${lista("C O N T E S T A C I Ó N  A  L O S  H E C H O S",["[HECHO PRIMERO: SE ADMITE, NIEGA O ACLARA]","[HECHO SEGUNDO: SE ADMITE, NIEGA O ACLARA]","[CONTINUAR SEGÚN LA DEMANDA]"])}${lista("E X C E P C I O N E S  Y  D E F E N S A S",["[EXCEPCIÓN O DEFENSA]","[ELEMENTOS QUE LA SUSTENTAN]"])}${lista("P R U E B A S",["[PRUEBAS RELACIONADAS CON LOS HECHOS CONTROVERTIDOS]"])}<h3>D E R E C H O</h3><p>[DESARROLLAR LOS FUNDAMENTOS APLICABLES A LA CONTESTACIÓN.]</p>${lista("P E T I T O R I O S",["Tener por contestada la demanda en tiempo y forma.","Admitir las excepciones, defensas y pruebas ofrecidas.","Resolver conforme a derecho."])}${cierre(de.nombre)}`;
}
function estructuraPruebas(a,nombre){const ac=actor(a);return `${aviso()}${rubro(a,nombre)}${encabezado(a)}<p>${comparecencia(ac)}, comparezco para ofrecer o desahogar las pruebas que corresponden a la etapa procesal.</p>${lista("P R U E B A S",["[TIPO DE PRUEBA] — [OBJETO, ALCANCE Y HECHOS CON LOS QUE SE RELACIONA]","[FORMA DE PREPARACIÓN O DESAHOGO]","[DATOS DE TESTIGOS, ABSOLVENTE, PERITO, DOCUMENTO O INFORME, SEGÚN APLIQUE]"])}${lista("P E T I T O R I O S",["Tener por ofrecidas o desahogadas las pruebas.","Acordar su admisión, preparación y valoración conforme corresponda."])}${cierre(ac.nombre)}`;}
function estructuraRecurso(a,nombre){const ac=actor(a);return `${aviso()}${rubro(a,nombre)}${encabezado(a)}<p>${comparecencia(ac)}, comparezco para interponer <strong>${esc(nombre)}</strong> contra <strong>[RESOLUCIÓN, ACTO O DETERMINACIÓN IMPUGNADA]</strong>.</p>${lista("A N T E C E D E N T E S",["[FECHA Y CONTENIDO ESENCIAL DEL ACTO IMPUGNADO]","[FECHA Y FORMA DE NOTIFICACIÓN]","[ACTUACIONES PREVIAS RELEVANTES]"])}${lista("A G R A V I O S  O  M O T I V O S  D E  I M P U G N A C I Ó N",["[PRIMER AGRAVIO: PARTE IMPUGNADA, RAZÓN Y EFECTO SOLICITADO]","[SEGUNDO AGRAVIO, SI APLICA]"])}${lista("P R U E B A S  Y  A N E X O S",["[DOCUMENTOS QUE ACREDITAN PROCEDENCIA Y OPORTUNIDAD]","[CONSTANCIAS RELACIONADAS CON LOS AGRAVIOS]"])}${lista("P E T I T O R I O S",["Tener por interpuesto el medio de defensa.","Admitirlo y tramitarlo.","Modificar, revocar o dejar sin efectos el acto en los términos solicitados."])}${cierre(ac.nombre)}`;}
function estructuraAmparo(a,nombre,directo=false){const ac=actor(a);return `${aviso()}<table style="width:100%;margin-bottom:24px"><tr><td><strong>QUEJOSO:</strong> ${esc(ac.nombre)}<br><strong>TERCERO INTERESADO:</strong> ${esc(tercero(a))}</td><td style="text-align:right"><strong>${esc(nombre)}</strong></td></tr></table><h3>${directo?"AUTORIDAD RESPONSABLE PARA REMISIÓN AL TRIBUNAL COLEGIADO":"C. JUEZ DE DISTRITO EN TURNO"}</h3><h3>P R E S E N T E</h3><p>${comparecencia(ac)}, señalando como domicilio procesal <strong>[DOMICILIO]</strong> y autorizando a <strong>[AUTORIZADOS]</strong>, comparezco a solicitar el amparo y protección federal.</p>${lista("I. NOMBRE Y DOMICILIO DEL QUEJOSO",["[COMPLETAR DATOS NECESARIOS]"])}${lista("II. TERCERO INTERESADO",["[IDENTIFICAR O MANIFESTAR DESCONOCIMIENTO, SEGÚN PROCEDA]"])}${lista("III. AUTORIDAD O AUTORIDADES RESPONSABLES",[esc(autoridad(a)),"[OTRAS AUTORIDADES, SI APLICA]"])}${lista("IV. ACTO RECLAMADO",["[IDENTIFICAR CON PRECISIÓN EL ACTO, OMISIÓN O RESOLUCIÓN]"])}${lista("V. ANTECEDENTES",["[RELACIÓN CRONOLÓGICA Y CONCISA DE LOS HECHOS]"])}${lista("VI. CONCEPTOS DE VIOLACIÓN",["[PRIMER CONCEPTO: NORMA O DERECHO AFECTADO, RAZONAMIENTO Y EFECTO]","[CONCEPTOS ADICIONALES]"])}${lista("VII. PRUEBAS Y ANEXOS",["[DOCUMENTOS Y CONSTANCIAS]","[COPIAS PARA TRASLADO, CUANDO CORRESPONDA]"])}${directo?"":lista("VIII. SUSPENSIÓN",["[INDICAR SI SE SOLICITA Y PRECISAR EFECTOS]"])}${lista("P E T I T O R I O S",["Tener por presentada la demanda.","Admitirla y requerir los informes correspondientes.","Otorgar la protección federal en los términos planteados."])}${cierre(ac.nombre)}`;}
function estructuraContrato(a,nombre){const ac=actor(a),de=demandado(a);return `${aviso()}<h2>${esc(nombre)}</h2><p>QUE CELEBRAN, POR UNA PARTE, <strong>${esc(ac.nombre)}</strong>, Y POR LA OTRA <strong>${esc(de.nombre)}</strong>, A QUIENES EN LO SUCESIVO SE LES DENOMINARÁ SEGÚN SE DEFINA EN ESTE INSTRUMENTO, AL TENOR DE LAS SIGUIENTES:</p>${lista("D E C L A R A C I O N E S",["[IDENTIDAD, CAPACIDAD, REPRESENTACIÓN Y DOMICILIO DE LA PRIMERA PARTE]","[IDENTIDAD, CAPACIDAD, REPRESENTACIÓN Y DOMICILIO DE LA SEGUNDA PARTE]","[ANTECEDENTES, TITULARIDAD O INTERÉS SOBRE EL OBJETO]","[RECONOCIMIENTO MUTUO DE PERSONALIDAD Y VOLUNTAD]"])}${lista("C L Á U S U L A S",["OBJETO: [DEFINIR CON PRECISIÓN EL OBJETO Y ALCANCE]","CONTRAPRESTACIÓN O GRATUIDAD: [MONTO, FORMA Y CONDICIONES, SI APLICA]","VIGENCIA: [INICIO, DURACIÓN, PRÓRROGA Y TERMINACIÓN]","OBLIGACIONES DE LAS PARTES: [DESARROLLAR]","RESPONSABILIDAD Y GARANTÍAS: [DESARROLLAR]","CONFIDENCIALIDAD Y DATOS PERSONALES: [SI APLICA]","TERMINACIÓN, RESCISIÓN Y EFECTOS: [DESARROLLAR]","NOTIFICACIONES: [DOMICILIOS Y MEDIOS]","LEGISLACIÓN Y JURISDICCIÓN: [DEFINIR CONFORME AL CASO]"])}<p style="text-align:center;margin-top:48px"><strong>FIRMAS</strong></p><table style="width:100%;margin-top:50px"><tr><td style="width:45%;text-align:center;border-top:1px solid #000">${esc(ac.nombre)}<br>PRIMERA PARTE</td><td style="width:10%"></td><td style="width:45%;text-align:center;border-top:1px solid #000">${esc(de.nombre)}<br>SEGUNDA PARTE</td></tr></table>`;}
function estructuraPromocion(a,nombre){const ac=actor(a);return `${aviso()}${rubro(a,nombre)}${encabezado(a)}<p>${comparecencia(ac)}, comparezco para exponer:</p><h3>O B J E T O  D E  L A  P R O M O C I Ó N</h3><p>[DESCRIBIR DE MANERA CLARA QUÉ SE SOLICITA Y POR QUÉ.]</p>${lista("A N T E C E D E N T E S",["[ACTUACIÓN O SITUACIÓN PREVIA RELEVANTE]","[FECHA O DATO NECESARIO]"])}${lista("P E T I T O R I O S",["Tener por presentado este escrito.","Acordar favorablemente lo solicitado, si resulta procedente."])}${cierre(ac.nombre)}`;}
function estructuraAdministrativo(a,nombre){const ac=actor(a);return `${aviso()}<h3>${esc(val(a?.autoridad,"[AUTORIDAD ADMINISTRATIVA COMPETENTE]"))}</h3><h3>P R E S E N T E</h3><p>${comparecencia(ac)}, señalando como medio o domicilio para notificaciones <strong>[DATO]</strong>, comparezco para formular <strong>${esc(nombre)}</strong>.</p>${lista("A C T O  O  S O L I C I T U D",["[IDENTIFICAR LA RESOLUCIÓN, TRÁMITE, ACLARACIÓN O CRITERIO SOLICITADO]"])}${lista("A N T E C E D E N T E S",["[RELACIÓN CRONOLÓGICA DE LOS DATOS NECESARIOS]"])}${lista("C O N S I D E R A C I O N E S",["[RAZONES ADMINISTRATIVAS Y JURÍDICAS APLICABLES AL CASO]"])}${lista("D O C U M E N T O S  A N E X O S",["[IDENTIFICAR DOCUMENTOS]"])}${lista("P E T I C I O N E S",["Tener por presentada la solicitud o aclaración.","Emitir la determinación que corresponda."])}${cierre(ac.nombre)}`;}
function estructuraIncidente(a,nombre){const ac=actor(a);return `${aviso()}${rubro(a,nombre)}${encabezado(a)}<p>${comparecencia(ac)}, comparezco a promover <strong>${esc(nombre)}</strong>.</p>${lista("A N T E C E D E N T E S",["[RESOLUCIÓN O ACTUACIÓN QUE DA ORIGEN AL INCIDENTE]","[ESTADO PROCESAL Y CUMPLIMIENTO PENDIENTE]"])}${lista("B A S E S  D E  C Á L C U L O  O  E J E C U C I Ó N",["[CONCEPTO] — [PERIODO, MONTO O FORMA DE CUMPLIMIENTO]","[OPERACIONES O DOCUMENTOS DE SOPORTE]"])}${lista("P R U E B A S",["[DOCUMENTOS, PERICIAL U OTRAS PRUEBAS NECESARIAS]"])}${lista("P E T I T O R I O S",["Admitir el incidente.","Dar vista a la contraparte, cuando corresponda.","Aprobar la liquidación o dictar las medidas de ejecución procedentes."])}${cierre(ac.nombre)}`;}
function estructuraHuelga(a,nombre){const ac=actor(a);return `${aviso()}<h2>${esc(nombre)}</h2>${lista("I. IDENTIFICACIÓN DE LAS PARTES",["[ORGANIZACIÓN SINDICAL O REPRESENTACIÓN DE TRABAJADORES]","[PATRÓN O CENTRO DE TRABAJO]"])}${lista("II. OBJETO Y PETICIONES",["[OBJETO PRINCIPAL]","[PETICIONES CONCRETAS Y CONDICIONES SOLICITADAS]"])}${lista("III. ANTECEDENTES",["[RELACIÓN DE NEGOCIACIONES O HECHOS PREVIOS]"])}${lista("IV. PLAZO, FECHA Y HORA",["[DATOS DEL EMPLAZAMIENTO O RESPUESTA]"])}${lista("V. ANEXOS",["[DOCUMENTOS DE REPRESENTACIÓN Y SOPORTE]"])}${cierre(ac.nombre)}`;}
function estructuraReglamento(){return `${aviso()}<h2>REGLAMENTO INTERIOR DE TRABAJO</h2>${lista("CAPÍTULO I. DISPOSICIONES GENERALES",["[OBJETO, ÁMBITO DE APLICACIÓN Y DEFINICIONES]"])}${lista("CAPÍTULO II. JORNADAS Y HORARIOS",["[HORARIOS, DESCANSOS, REGISTRO DE ASISTENCIA Y TOLERANCIAS]"])}${lista("CAPÍTULO III. OBLIGACIONES Y PROHIBICIONES",["[OBLIGACIONES DEL PERSONAL]","[PROHIBICIONES]"])}${lista("CAPÍTULO IV. SEGURIDAD, SALUD E HIGIENE",["[MEDIDAS PREVENTIVAS Y EQUIPO]"])}${lista("CAPÍTULO V. MEDIDAS DISCIPLINARIAS",["[FALTAS, PROCEDIMIENTO Y SANCIONES]"])}${lista("CAPÍTULO VI. DISPOSICIONES FINALES",["[VIGENCIA, PUBLICIDAD Y MODIFICACIONES]"])}<p style="text-align:center;margin-top:48px"><strong>FIRMAS DE REPRESENTACIÓN PATRONAL Y DE LAS PERSONAS TRABAJADORAS</strong></p>`;}
function estructuraAviso(){return `${aviso()}<h2>AVISO DE PRIVACIDAD</h2>${lista("I. IDENTIDAD Y DOMICILIO DEL RESPONSABLE",["[DATOS DEL RESPONSABLE]"])}${lista("II. DATOS PERSONALES TRATADOS",["[CATEGORÍAS DE DATOS]"])}${lista("III. FINALIDADES",["[FINALIDADES PRIMARIAS]","[FINALIDADES SECUNDARIAS, SI APLICA]"])}${lista("IV. TRANSFERENCIAS",["[DESTINATARIOS Y SUPUESTOS]"])}${lista("V. DERECHOS Y MECANISMOS",["[MEDIOS PARA EJERCER DERECHOS, LIMITAR USO O REVOCAR CONSENTIMIENTO]"])}${lista("VI. TECNOLOGÍAS DE RASTREO",["[INFORMACIÓN Y MECANISMO DE DESHABILITACIÓN, SI APLICA]"])}${lista("VII. CAMBIOS AL AVISO",["[MEDIO DE COMUNICACIÓN]"])}<p><strong>Fecha de última actualización:</strong> [FECHA]</p>`;}
function estructuraCartaPoder(a){const ac=actor(a),de=demandado(a);return `${aviso()}<h2>CARTA PODER</h2><p><strong>OTORGANTE:</strong> ${esc(ac.nombre)}</p><p><strong>APODERADO:</strong> ${esc(de.nombre)}</p><p>Por medio de la presente se confiere poder para <strong>[DESCRIBIR ACTOS CONCRETOS Y ALCANCE]</strong>, con las limitaciones siguientes: <strong>[LIMITACIONES]</strong>.</p><p><strong>Vigencia:</strong> [PLAZO O EVENTO DE TERMINACIÓN]</p><p><strong>Lugar y fecha:</strong> ${ciudadFecha()}</p><table style="width:100%;margin-top:60px"><tr><td style="text-align:center;border-top:1px solid #000">OTORGANTE</td><td></td><td style="text-align:center;border-top:1px solid #000">APODERADO</td></tr><tr><td style="padding-top:55px;text-align:center;border-top:1px solid #000">TESTIGO</td><td></td><td style="padding-top:55px;text-align:center;border-top:1px solid #000">TESTIGO</td></tr></table>`;}
function estructuraTituloCredito(nombre){return `${aviso()}<h2>${esc(nombre)}</h2>${lista("DATOS DEL DOCUMENTO",["[EMISOR O DEPOSITARIO]","[TITULAR O BENEFICIARIO]","[BIENES O MERCANCÍAS]","[CANTIDAD, CALIDAD, UBICACIÓN Y ASEGURAMIENTO]","[GRAVAMEN, CRÉDITO O CONDICIONES, SI APLICA]","[FECHA DE EXPEDICIÓN Y VENCIMIENTO]"])}<p style="text-align:center;margin-top:48px"><strong>FIRMAS Y AUTORIZACIONES</strong></p>`;}
function estructuraCambioAbogado(a){const ac=actor(a);return `${aviso()}${rubro(a,"Revocación y designación de abogado patrono")}${encabezado(a)}<p>${comparecencia(ac)}, comparezco para manifestar que revoco las autorizaciones o designaciones previamente otorgadas a <strong>[NOMBRES]</strong> y designo a <strong>[NUEVO PROFESIONISTA]</strong>, con el alcance que se precise.</p>${lista("P E T I T O R I O S",["Tener por revocadas las designaciones indicadas.","Tener por realizada la nueva designación.","Ordenar las anotaciones y notificaciones correspondientes."])}${cierre(ac.nombre)}`;}

function generar(item,a){
 switch(item.tipo){
  case "demanda": return estructuraDemanda(a,item.nombre);
  case "contestacion": return estructuraContestacion(a,item.nombre);
  case "pruebas": return estructuraPruebas(a,item.nombre);
  case "recurso": return estructuraRecurso(a,item.nombre);
  case "amparo_directo": return estructuraAmparo(a,item.nombre,true);
  case "amparo_indirecto": return estructuraAmparo(a,item.nombre,false);
  case "suspension": return estructuraPromocion(a,item.nombre);
  case "cumplimiento_amparo": return estructuraPromocion(a,item.nombre);
  case "contrato": return estructuraContrato(a,item.nombre);
  case "administrativo": return estructuraAdministrativo(a,item.nombre);
  case "incidente": return estructuraIncidente(a,item.nombre);
  case "prevencion": return estructuraPromocion(a,item.nombre);
  case "paraprocesal": return estructuraPromocion(a,item.nombre);
  case "huelga": return estructuraHuelga(a,item.nombre);
  case "reglamento": return estructuraReglamento();
  case "aviso_privacidad": return estructuraAviso();
  case "carta_poder": return estructuraCartaPoder(a);
  case "titulo_credito": return estructuraTituloCredito(item.nombre);
  case "garantia": return estructuraIncidente(a,item.nombre);
  case "cambio_abogado": return estructuraCambioAbogado(a);
  default: return estructuraPromocion(a,item.nombre);
 }
}

CATALOGO.forEach(item=>{
 window.PLANTILLAS_BASE[item.id]={
  materia:item.materia,
  nombre:`${item.etapa} · ${item.nombre}`,
  generar:a=>generar(item,a)
 };
});
})();
