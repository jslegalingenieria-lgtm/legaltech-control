(() => {
"use strict";

const COL = "documentos_juridicos";
let actualId = "";
let asuntoActual = null;

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const texto = (v, reserva) => esc(v || reserva);

function db(){
    if(!window.db) throw new Error("Firestore no disponible");
    return window.db;
}

function fechaLarga(){
    return new Intl.DateTimeFormat("es-MX", {day:"numeric", month:"long", year:"numeric"}).format(new Date());
}

function expediente(a){ return a.expediente || a.numeroExpediente || "PENDIENTE DE ASIGNACIÓN"; }
function juzgado(a){ return a.juzgado || "JUZGADO COMPETENTE"; }
function actor(a){ return a.partes?.actor || {}; }
function demandado(a){ return a.partes?.demandado || {}; }

function comparecencia(p, propio = true){
    if(!p?.nombre) return "[CAPTURAR NOMBRE]";
    if(p.tipo === "moral"){
        return `${esc(p.nombre)}, por conducto de ${texto(p.representante,"[REPRESENTANTE LEGAL]")}, en su carácter de ${texto(p.caracter,"[CARÁCTER]")}`;
    }
    return `${esc(p.nombre)}${propio ? ", por mi propio derecho" : ""}`;
}

function rubro(a, accion){
    return `<p style="text-align:right"><strong>EXPEDIENTE: ${esc(expediente(a))}</strong><br>${esc(accion || a.accion || a.tipoProcedimiento || "ESCRITO")}</p>`;
}

function encabezado(a){
    return `<p style="text-align:center"><strong>C. JUEZ ${esc(juzgado(a).toUpperCase())}<br>P R E S E N T E</strong></p>`;
}

function cierre(nombre){
    return `<p style="text-align:center;margin-top:48px"><strong>PROTESTO LO NECESARIO</strong><br><br>${esc(fechaLarga())}<br><br><br><strong>${texto(nombre,"NOMBRE Y FIRMA")}</strong></p>`;
}

function avisoRevision(){
    return `<p class="doc-aviso"><strong>Nota de revisión:</strong> complete los datos entre corchetes y verifique competencia, vía, plazos, fundamentos y anexos conforme a la legislación vigente antes de presentar.</p>`;
}

function estructuraDemanda(a, titulo, prestaciones, hechos, pruebas, petitorios){
    const ac = actor(a), de = demandado(a);
    return `${rubro(a,titulo)}${encabezado(a)}<p>${comparecencia(ac)}, señalando como domicilio para recibir notificaciones [DOMICILIO PROCESAL] y autorizando para tales efectos a [PROFESIONISTAS AUTORIZADOS], comparezco para exponer:</p><p>Que por medio del presente escrito promuevo <strong>${esc(titulo.toUpperCase())}</strong> en contra de <strong>${comparecencia(de,false)}</strong>, reclamando las siguientes:</p><h3>P R E S T A C I O N E S</h3>${prestaciones}<h3>H E C H O S</h3>${hechos}<h3>D E R E C H O</h3><p>Resultan aplicables las disposiciones constitucionales, sustantivas y procesales correspondientes a la materia y entidad federativa. [DESARROLLAR FUNDAMENTOS Y COMPETENCIA].</p><h3>P R U E B A S</h3>${pruebas}<h3>P E T I T O R I O S</h3>${petitorios}${avisoRevision()}${cierre(ac.nombre)}`;
}

const PLANTILLAS = {
    "demanda-divorcio": { materia:"Familiar", nombre:"Demanda de divorcio incausado", generar:a=>estructuraDemanda(a,"Juicio de divorcio incausado",`<ol><li>La disolución del vínculo matrimonial.</li><li>[MEDIDAS SOBRE HIJAS O HIJOS, ALIMENTOS, BIENES O DOMICILIO CONYUGAL, CUANDO APLIQUE].</li></ol>`,`<ol><li>[Fecha y lugar de celebración del matrimonio.]</li><li>[Último domicilio conyugal.]</li><li>[Existencia de hijas, hijos, bienes y obligaciones.]</li><li>[Voluntad inequívoca de no continuar con el vínculo.]</li></ol>`,`<ol><li><strong>DOCUMENTAL PÚBLICA.</strong> Acta de matrimonio.</li><li><strong>DOCUMENTALES PÚBLICAS.</strong> Actas de nacimiento aplicables.</li><li><strong>INSTRUMENTAL DE ACTUACIONES.</strong></li><li><strong>PRESUNCIONAL LEGAL Y HUMANA.</strong></li></ol>`,`<ol><li>Tenerme por presentado.</li><li>Admitir la demanda y ordenar el emplazamiento.</li><li>Decretar la disolución del vínculo matrimonial.</li><li>Proveer lo demás que en Derecho corresponda.</li></ol>`)},

    "demanda-alimentos": { materia:"Familiar", nombre:"Demanda de alimentos", generar:a=>estructuraDemanda(a,"Demanda de alimentos",`<ol><li>El pago de una pensión alimenticia provisional y definitiva.</li><li>El aseguramiento de la pensión.</li><li>El pago de pensiones vencidas, cuando proceda.</li><li>Gastos y costas, en su caso.</li></ol>`,`<ol><li>[Relación entre las partes y acreditación del parentesco.]</li><li>[Necesidades de la persona acreedora alimentaria.]</li><li>[Capacidad económica de la persona deudora.]</li><li>[Incumplimiento o insuficiencia de aportaciones.]</li></ol>`,`<ol><li><strong>DOCUMENTALES PÚBLICAS.</strong> Actas del estado civil.</li><li><strong>DOCUMENTALES PRIVADAS.</strong> Comprobantes de gastos e ingresos.</li><li><strong>INFORMES.</strong> A cargo de fuente laboral, instituciones bancarias o autoridades.</li><li><strong>TESTIMONIAL.</strong></li><li><strong>INSTRUMENTAL Y PRESUNCIONAL.</strong></li></ol>`,`<ol><li>Admitir la demanda.</li><li>Fijar pensión provisional.</li><li>Ordenar los informes y medidas de aseguramiento solicitadas.</li><li>Dictar sentencia condenatoria.</li></ol>`)},

    "contestacion-familiar": { materia:"Familiar", nombre:"Contestación de demanda familiar", generar:a=>`${rubro(a,"Contestación de demanda")}${encabezado(a)}<p>${comparecencia(demandado(a))}, parte demandada en el asunto citado, comparezco para:</p><h3>C O N T E S T A R</h3><p>En tiempo y forma doy contestación a la demanda instaurada en mi contra.</p><h3>CONTESTACIÓN A LAS PRESTACIONES</h3><ol><li>[Aceptar, negar o precisar cada prestación.]</li></ol><h3>CONTESTACIÓN A LOS HECHOS</h3><ol><li>[Contestar cada hecho en el mismo orden.]</li></ol><h3>EXCEPCIONES Y DEFENSAS</h3><ol><li>[Desarrollar excepciones y defensas.]</li></ol><h3>P R U E B A S</h3><ol><li>[Relacionar cada prueba con los hechos controvertidos.]</li></ol><h3>P E T I T O R I O S</h3><ol><li>Tenerme por presentado contestando la demanda.</li><li>Admitir las excepciones, defensas y pruebas.</li><li>Resolver conforme a Derecho.</li></ol>${avisoRevision()}${cierre(demandado(a).nombre)}`},

    "promocion-pruebas": { materia:"Familiar", nombre:"Promoción de ofrecimiento de pruebas", generar:a=>`${rubro(a,"Ofrecimiento de pruebas")}${encabezado(a)}<p>${comparecencia(actor(a))}, dentro del asunto citado, comparezco para exponer:</p><p>Que dentro del término concedido vengo a ofrecer las siguientes:</p><h3>P R U E B A S</h3><ol><li><strong>CONFESIONAL.</strong> A cargo de [NOMBRE], quien deberá absolver posiciones personalmente.</li><li><strong>TESTIMONIAL.</strong> A cargo de [NOMBRES DE TESTIGOS].</li><li><strong>DOCUMENTALES.</strong> Consistentes en [DESCRIBIR].</li><li><strong>INSTRUMENTAL DE ACTUACIONES.</strong></li><li><strong>PRESUNCIONAL LEGAL Y HUMANA.</strong></li></ol><h3>P E T I T O R I O S</h3><ol><li>Tener por ofrecidas las pruebas.</li><li>Admitirlas y ordenar su preparación y desahogo.</li></ol>${avisoRevision()}${cierre(actor(a).nombre)}`},

    "demanda-desahucio": { materia:"Civil", nombre:"Demanda de desahucio", generar:a=>estructuraDemanda(a,"Juicio de desahucio",`<ol><li>La desocupación y entrega del inmueble ubicado en [DOMICILIO].</li><li>El pago de rentas vencidas por [PERIODO].</li><li>El pago de rentas que se sigan venciendo.</li><li>Servicios, daños, intereses, gastos y costas, cuando procedan.</li></ol>`,`<ol><li>[Celebración del contrato y datos del inmueble.]</li><li>[Monto y forma de pago de la renta.]</li><li>[Incumplimiento y periodos adeudados.]</li><li>[Requerimientos de pago o entrega.]</li></ol>`,`<ol><li><strong>DOCUMENTAL PRIVADA.</strong> Contrato de arrendamiento.</li><li><strong>DOCUMENTALES.</strong> Recibos, transferencias y requerimientos.</li><li><strong>INSPECCIÓN JUDICIAL.</strong> En su caso.</li><li><strong>INSTRUMENTAL Y PRESUNCIONAL.</strong></li></ol>`,`<ol><li>Admitir la demanda en la vía propuesta.</li><li>Requerir el pago y la desocupación.</li><li>Ordenar el emplazamiento.</li><li>Dictar sentencia favorable.</li></ol>`)},

    "contestacion-desahucio": { materia:"Civil", nombre:"Contestación de demanda de desahucio", generar:a=>`${rubro(a,"Contestación de demanda de desahucio")}${encabezado(a)}<p>${comparecencia(demandado(a))}, comparezco para dar contestación a la demanda.</p><h3>PRESTACIONES</h3><p>[Manifestarse respecto de cada prestación.]</p><h3>H E C H O S</h3><ol><li>[Contestar correlativamente.]</li></ol><h3>EXCEPCIONES Y DEFENSAS</h3><ol><li>[Pago.]</li><li>[Falta de acción o derecho.]</li><li>[Improcedencia de la vía u otras que correspondan.]</li></ol><h3>P R U E B A S</h3><ol><li>[Documentales.]</li><li>[Confesional.]</li><li>[Testimonial.]</li><li>[Instrumental y presuncional.]</li></ol><h3>P E T I T O R I O S</h3><ol><li>Tenerme por presentado contestando.</li><li>Admitir excepciones y pruebas.</li><li>Absolverme de las prestaciones improcedentes.</li></ol>${avisoRevision()}${cierre(demandado(a).nombre)}`},

    "jurisdiccion-voluntaria": { materia:"Civil", nombre:"Diligencias de jurisdicción voluntaria", generar:a=>`${rubro(a,"Diligencias de jurisdicción voluntaria")}${encabezado(a)}<p>${comparecencia(actor(a))}, comparezco para promover diligencias de jurisdicción voluntaria a efecto de [OBJETO DE LAS DILIGENCIAS].</p><h3>H E C H O S</h3><ol><li>[Antecedentes relevantes.]</li><li>[Necesidad de la intervención judicial.]</li></ol><h3>D E R E C H O</h3><p>[Fundamentos de competencia, legitimación y procedimiento.]</p><h3>P R U E B A S</h3><ol><li>[Documentales.]</li><li>[Testimonial o información ad perpetuam, cuando corresponda.]</li></ol><h3>P E T I T O R I O S</h3><ol><li>Admitir las diligencias.</li><li>Ordenar las citaciones y publicaciones necesarias.</li><li>Declarar lo procedente conforme a Derecho.</li></ol>${avisoRevision()}${cierre(actor(a).nombre)}`},

    "recurso-apelacion": { materia:"Civil", nombre:"Recurso de apelación", generar:a=>`${rubro(a,"Recurso de apelación")}${encabezado(a)}<p>${comparecencia(actor(a))}, comparezco para interponer <strong>RECURSO DE APELACIÓN</strong> contra la resolución de fecha [FECHA], notificada el [FECHA].</p><h3>AGRAVIOS</h3><ol><li><strong>PRIMERO.</strong> [Identificar la parte de la resolución que causa agravio y explicar la infracción.]</li><li><strong>SEGUNDO.</strong> [Desarrollar perjuicio y trascendencia.]</li></ol><h3>P E T I T O R I O S</h3><ol><li>Tener por interpuesto el recurso en tiempo.</li><li>Admitirlo en el efecto legal procedente.</li><li>Remitir las constancias al superior.</li><li>Revocar o modificar la resolución recurrida.</li></ol>${avisoRevision()}${cierre(actor(a).nombre)}`},

    "demanda-ejecutiva-mercantil": { materia:"Mercantil", nombre:"Demanda ejecutiva mercantil", generar:a=>estructuraDemanda(a,"Juicio ejecutivo mercantil",`<ol><li>El pago de la cantidad principal de $[CAPITAL].</li><li>Intereses ordinarios y/o moratorios.</li><li>Gastos y costas.</li></ol>`,`<ol><li>[Origen de la obligación y título ejecutivo.]</li><li>[Fecha de vencimiento.]</li><li>[Incumplimiento.]</li><li>[Requerimientos extrajudiciales.]</li></ol>`,`<ol><li><strong>DOCUMENTAL BASE DE LA ACCIÓN.</strong> [Pagaré, cheque, contrato u otro título.]</li><li><strong>CONFESIONAL.</strong></li><li><strong>INSTRUMENTAL Y PRESUNCIONAL.</strong></li></ol>`,`<ol><li>Admitir la demanda en la vía ejecutiva.</li><li>Dictar auto con efectos de mandamiento en forma.</li><li>Requerir de pago y, en su defecto, embargar bienes.</li><li>Condenar al pago de las prestaciones.</li></ol>`)},

    "contestacion-mercantil": { materia:"Mercantil", nombre:"Contestación de demanda mercantil", generar:a=>`${rubro(a,"Contestación de demanda mercantil")}${encabezado(a)}<p>${comparecencia(demandado(a))}, comparezco para contestar la demanda.</p><h3>CONTESTACIÓN A LAS PRESTACIONES</h3><p>[Responder una por una.]</p><h3>CONTESTACIÓN A LOS HECHOS</h3><ol><li>[Aceptar, negar o manifestar desconocimiento en forma precisa.]</li></ol><h3>EXCEPCIONES Y DEFENSAS</h3><ol><li>[Desarrollar.]</li></ol><h3>RECONVENCIÓN</h3><p>[ELIMINAR ESTE APARTADO SI NO SE RECONVIENE.]</p><h3>P R U E B A S</h3><ol><li>[Relacionar pruebas.]</li></ol><h3>P E T I T O R I O S</h3><ol><li>Tener por contestada la demanda.</li><li>Admitir excepciones, defensas y pruebas.</li><li>Absolver a la parte demandada.</li></ol>${avisoRevision()}${cierre(demandado(a).nombre)}`},

    "oposicion-acuerdos": { materia:"Mercantil", nombre:"Demanda de oposición a acuerdos de asamblea", generar:a=>estructuraDemanda(a,"Oposición a acuerdos de asamblea",`<ol><li>La nulidad o ineficacia de los acuerdos adoptados en la asamblea de fecha [FECHA].</li><li>La suspensión de sus efectos, cuando proceda.</li><li>La cancelación de inscripciones o actos derivados.</li><li>Gastos y costas.</li></ol>`,`<ol><li>[Calidad de accionista y participación.]</li><li>[Convocatoria y celebración de la asamblea.]</li><li>[Acuerdos impugnados.]</li><li>[Violaciones legales, estatutarias o al interés social.]</li></ol>`,`<ol><li><strong>DOCUMENTALES.</strong> Actas, convocatoria, estatutos, títulos y libros sociales.</li><li><strong>PERICIAL CONTABLE.</strong> Cuando resulte necesaria.</li><li><strong>INSTRUMENTAL Y PRESUNCIONAL.</strong></li></ol>`,`<ol><li>Admitir la demanda.</li><li>Conceder la medida cautelar solicitada, si procede.</li><li>Declarar la nulidad o ineficacia de los acuerdos.</li></ol>`)},

    "demanda-laboral": { materia:"Laboral", nombre:"Demanda por despido injustificado", generar:a=>estructuraDemanda(a,"Demanda laboral por despido injustificado",`<ol><li>Reinstalación o indemnización constitucional, según se elija.</li><li>Salarios vencidos e intereses.</li><li>Prestaciones devengadas: vacaciones, prima vacacional, aguinaldo y demás aplicables.</li><li>Prima de antigüedad y aportaciones de seguridad social, cuando procedan.</li></ol>`,`<ol><li>[Fecha de ingreso, puesto, jornada y salario.]</li><li>[Forma de subordinación y centro de trabajo.]</li><li>[Circunstancias de modo, tiempo y lugar del despido.]</li><li>[Conciliación prejudicial y constancia correspondiente.]</li></ol>`,`<ol><li><strong>CONFESIONAL.</strong></li><li><strong>DOCUMENTALES.</strong> Recibos, contrato, comunicaciones y constancia de no conciliación.</li><li><strong>INSPECCIÓN.</strong> Sobre nóminas, controles y expedientes.</li><li><strong>INFORMES.</strong> IMSS, INFONAVIT, SAT u otras instituciones.</li><li><strong>INSTRUMENTAL Y PRESUNCIONAL.</strong></li></ol>`,`<ol><li>Admitir la demanda.</li><li>Emplazar a la parte demandada.</li><li>Reconocer la relación laboral y condiciones reclamadas.</li><li>Condenar al pago de las prestaciones.</li></ol>`)},

    "aclaracion-imss": { materia:"Laboral", nombre:"Escrito de aclaración administrativa ante IMSS", generar:a=>`${rubro(a,"Aclaración administrativa") }<p style="text-align:center"><strong>INSTITUTO MEXICANO DEL SEGURO SOCIAL<br>[SUBDELEGACIÓN O UNIDAD ADMINISTRATIVA]<br>P R E S E N T E</strong></p><p>${comparecencia(actor(a))}, con número de seguridad social [NSS], comparezco para solicitar la aclaración de [MOVIMIENTO, SEMANAS, SALARIO, BAJA, ALTA U OTRO].</p><h3>H E C H O S</h3><ol><li>[Antecedente.]</li><li>[Dato incorrecto o situación a corregir.]</li><li>[Gestiones previas.]</li></ol><h3>D O C U M E N T O S</h3><ol><li>[Identificación.]</li><li>[Constancias laborales.]</li><li>[Reportes o certificaciones.]</li></ol><h3>S O L I C I T U D</h3><ol><li>Tener por presentada la aclaración.</li><li>Realizar la revisión administrativa.</li><li>Emitir respuesta fundada y, en su caso, corregir los registros.</li></ol>${avisoRevision()}${cierre(actor(a).nombre)}`},

    "amparo-indirecto": { materia:"Amparo", nombre:"Demanda de amparo indirecto", generar:a=>`${rubro(a,"Demanda de amparo indirecto")}<p style="text-align:center"><strong>C. JUEZ DE DISTRITO EN TURNO<br>P R E S E N T E</strong></p><p>${comparecencia(actor(a))}, en mi carácter de parte quejosa, comparezco para solicitar el amparo y protección de la Justicia Federal.</p><h3>I. NOMBRE Y DOMICILIO DE LA PARTE QUEJOSA</h3><p>${texto(actor(a).nombre,"[QUEJOSO]")}; domicilio: [DOMICILIO].</p><h3>II. TERCERO INTERESADO</h3><p>${texto(a.partes?.terceroInteresado,"[INDICAR O MANIFESTAR QUE SE DESCONOCE]")}</p><h3>III. AUTORIDADES RESPONSABLES</h3><p>${texto(a.partes?.autoridadResponsable,"[AUTORIDADES ORDENADORAS Y EJECUTORAS]")}</p><h3>IV. ACTOS RECLAMADOS</h3><p>[PRECISAR ACTOS U OMISIONES.]</p><h3>V. HECHOS O ANTECEDENTES</h3><ol><li>[Desarrollar bajo protesta de decir verdad.]</li></ol><h3>VI. PRECEPTOS Y DERECHOS VIOLADOS</h3><p>[IDENTIFICAR].</p><h3>VII. CONCEPTOS DE VIOLACIÓN</h3><ol><li><strong>PRIMERO.</strong> [Desarrollar.]</li></ol><h3>S U S P E N S I Ó N</h3><p>[Solicitar suspensión provisional y definitiva, cuando proceda.]</p><h3>P E T I T O R I O S</h3><ol><li>Admitir la demanda.</li><li>Requerir informes justificados.</li><li>Conceder la suspensión solicitada.</li><li>Otorgar el amparo y protección federal.</li></ol>${avisoRevision()}${cierre(actor(a).nombre)}`},

    "amparo-directo": { materia:"Amparo", nombre:"Demanda de amparo directo", generar:a=>`${rubro(a,"Demanda de amparo directo")}<p style="text-align:center"><strong>H. TRIBUNAL COLEGIADO DE CIRCUITO EN TURNO<br>POR CONDUCTO DE LA AUTORIDAD RESPONSABLE<br>P R E S E N T E</strong></p><p>${comparecencia(actor(a))}, en mi carácter de parte quejosa, promuevo juicio de amparo directo contra la sentencia o laudo de fecha [FECHA].</p><h3>AUTORIDAD RESPONSABLE</h3><p>${texto(a.partes?.autoridadResponsable,"[AUTORIDAD QUE EMITIÓ LA RESOLUCIÓN]")}</p><h3>TERCERO INTERESADO</h3><p>${texto(a.partes?.terceroInteresado,"[NOMBRE Y DOMICILIO]")}</p><h3>ACTO RECLAMADO</h3><p>[SENTENCIA, LAUDO O RESOLUCIÓN QUE PONE FIN AL JUICIO.]</p><h3>ANTECEDENTES</h3><ol><li>[Síntesis procesal.]</li></ol><h3>CONCEPTOS DE VIOLACIÓN</h3><ol><li><strong>PRIMERO.</strong> [Desarrollar violación procesal o de fondo.]</li></ol><h3>P E T I T O R I O S</h3><ol><li>Tener por presentada la demanda.</li><li>Ordenar el trámite y remisión de autos.</li><li>Conceder el amparo solicitado.</li></ol>${avisoRevision()}${cierre(actor(a).nombre)}`},

    "suspension-amparo": { materia:"Amparo", nombre:"Incidente o escrito de suspensión", generar:a=>`${rubro(a,"Solicitud de suspensión")}${encabezado(a)}<p>${comparecencia(actor(a))}, dentro del juicio de amparo citado, comparezco para solicitar la suspensión del acto reclamado.</p><h3>ACTO CUYA SUSPENSIÓN SE SOLICITA</h3><p>[DESCRIBIR CON PRECISIÓN].</p><h3>APARIENCIA DEL BUEN DERECHO Y PELIGRO EN LA DEMORA</h3><p>[DESARROLLAR].</p><h3>EFECTOS SOLICITADOS</h3><p>[PRECISAR LA SITUACIÓN QUE DEBE CONSERVARSE Y LOS EFECTOS CONCRETOS.]</p><h3>P E T I T O R I O S</h3><ol><li>Conceder la suspensión provisional.</li><li>Señalar audiencia incidental.</li><li>Conceder la suspensión definitiva.</li></ol>${avisoRevision()}${cierre(actor(a).nombre)}`},

    "contrato-arrendamiento": { materia:"Contratos", nombre:"Contrato de arrendamiento", generar:a=>contratoBase(a,"CONTRATO DE ARRENDAMIENTO",[`El arrendador entrega en arrendamiento el inmueble ubicado en [DOMICILIO Y DESCRIPCIÓN].`,`La renta será de $[MONTO] mensuales, pagadera el día [DÍA] de cada mes.`,`La vigencia será de [PLAZO].`,`El depósito en garantía será de $[MONTO].`,`El inmueble se destinará exclusivamente a [DESTINO].`,`Serán causas de terminación las previstas en la ley y las pactadas en este instrumento.`])},
    "contrato-comodato": { materia:"Contratos", nombre:"Contrato de comodato", generar:a=>contratoBase(a,"CONTRATO DE COMODATO",[`El comodante entrega gratuitamente a la parte comodataria el bien descrito como [DESCRIPCIÓN].`,`El bien será usado exclusivamente para [USO].`,`La vigencia será de [PLAZO].`,`La parte comodataria conservará el bien y responderá por su uso indebido.`,`Al terminar el contrato, el bien deberá devolverse en [CONDICIONES].`])},
    "contrato-compraventa": { materia:"Contratos", nombre:"Contrato de compraventa", generar:a=>contratoBase(a,"CONTRATO DE COMPRAVENTA",[`La parte vendedora transmite la propiedad de [BIEN].`,`El precio total es de $[MONTO], pagadero de la siguiente forma: [FORMA].`,`La entrega se realizará el [FECHA] en [LUGAR].`,`La parte vendedora manifiesta que el bien se encuentra libre de gravamen, salvo [EXCEPCIONES].`,`Las partes pactan saneamiento, garantías y responsabilidades conforme a [DETALLAR].`])},
    "contrato-servicios": { materia:"Contratos", nombre:"Contrato de prestación de servicios profesionales", generar:a=>contratoBase(a,"CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES",[`La parte prestadora realizará los servicios consistentes en [OBJETO Y ALCANCE].`,`Los honorarios serán de $[MONTO], más impuestos cuando correspondan.`,`La forma y calendario de pago será [DETALLAR].`,`La vigencia será de [PLAZO].`,`La información intercambiada tendrá carácter confidencial.`,`La relación es de naturaleza civil o mercantil y no genera subordinación laboral.`])},

    "escrito-libre": { materia:"General", nombre:"Escrito libre / promoción", generar:a=>`${rubro(a,"Escrito libre")}${encabezado(a)}<p>${comparecencia(actor(a))}, dentro del asunto citado al rubro, comparezco para exponer:</p><p>[ESCRIBA AQUÍ EL CONTENIDO DE LA PROMOCIÓN.]</p><h3>P E T I T O R I O S</h3><ol><li>[PRIMERO.]</li><li>[SEGUNDO.]</li></ol>${cierre(actor(a).nombre)}`}
};

Object.assign(PLANTILLAS, window.PLANTILLAS_BASE || {});

// Compatibilidad con identificadores usados por el Centro de Conocimiento.
const ALIAS_PLANTILLAS = {
    "fam-divorcio-incausado":"demanda-divorcio",
    "fam-convenio-divorcio":"escrito-libre",
    "promocion-generica":"escrito-libre",
    "fam-demanda-alimentos":"demanda-alimentos",
    "fam-alimentos-provisionales":"demanda-alimentos",
    "incidente-generico":"estructura-juicio-civil-incidente-de-liquidacion-de-sentencia",
    "fam-guarda-custodia":"contestacion-familiar",
    "fam-medidas-provisionales":"escrito-libre",
    "fam-convivencias":"escrito-libre",
    "fam-liquidacion-sociedad":"estructura-juicio-civil-incidente-de-liquidacion-de-sentencia",
    "fam-inventario-avaluo":"escrito-libre"
};
function resolverPlantilla(id){
    const resuelta = ALIAS_PLANTILLAS[id] || id;
    return PLANTILLAS[resuelta] ? resuelta : "";
}

function contratoBase(a, titulo, clausulas){
    const ac=actor(a), de=demandado(a);
    return `<h2>${esc(titulo)}</h2><p>QUE CELEBRAN, POR UNA PARTE, <strong>${comparecencia(ac,false)}</strong>, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ “LA PRIMERA PARTE”, Y POR LA OTRA <strong>${comparecencia(de,false)}</strong>, A QUIEN SE LE DENOMINARÁ “LA SEGUNDA PARTE”, AL TENOR DE LAS SIGUIENTES:</p><h3>D E C L A R A C I O N E S</h3><p><strong>I. Declara la primera parte:</strong></p><ol><li>[Identidad, capacidad, domicilio y datos fiscales.]</li><li>[Titularidad o facultades relacionadas con el objeto.]</li></ol><p><strong>II. Declara la segunda parte:</strong></p><ol><li>[Identidad, capacidad, domicilio y datos fiscales.]</li><li>[Interés y facultades para contratar.]</li></ol><p><strong>III. Declaran ambas partes:</strong> que se reconocen personalidad y capacidad para obligarse.</p><h3>C L Á U S U L A S</h3><ol>${clausulas.map((c,i)=>`<li><strong>${["PRIMERA","SEGUNDA","TERCERA","CUARTA","QUINTA","SEXTA","SÉPTIMA","OCTAVA"][i] || (i+1)}.</strong> ${c}</li>`).join("")}</ol><p><strong>JURISDICCIÓN.</strong> Para la interpretación y cumplimiento, las partes se someten a [TRIBUNALES Y LEGISLACIÓN], renunciando al fuero que pudiera corresponderles.</p>${avisoRevision()}<p style="text-align:center;margin-top:48px"><strong>FIRMAS</strong></p><table style="width:100%;margin-top:50px"><tr><td style="width:45%;text-align:center;border-top:1px solid #000">${texto(ac.nombre,"PRIMERA PARTE")}</td><td style="width:10%"></td><td style="width:45%;text-align:center;border-top:1px solid #000">${texto(de.nombre,"SEGUNDA PARTE")}</td></tr></table>`;
}

async function cargarAsuntos(){
    const sel=$("doc-asunto"); if(!sel) return;
    sel.innerHTML='<option value="">Selecciona un asunto</option>';
    const snap=await db().collection("asuntos").get();
    snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.folioInterno||"").localeCompare(b.folioInterno||"")).forEach(a=>{
        const o=document.createElement("option");
        o.value=a.id;
        o.textContent=`${a.folioInterno||a.expediente||"Asunto"} · ${a.cliente||"Sin cliente"} · ${a.accion||a.materia||""}`;
        o.dataset.asunto=JSON.stringify(a);
        sel.appendChild(o);
    });
}

function cargarTipos(){
    const sel=$("doc-tipo"); if(!sel) return;
    const grupos={};
    Object.entries(PLANTILLAS).forEach(([id,p])=>{(grupos[p.materia] ||= []).push({id,...p});});
    sel.innerHTML="";
    Object.keys(grupos).sort((a,b)=>a==="General"?1:b==="General"?-1:a.localeCompare(b)).forEach(m=>{
        const g=document.createElement("optgroup"); g.label=m;
        grupos[m].sort((a,b)=>a.nombre.localeCompare(b.nombre)).forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.nombre;g.appendChild(o)});
        sel.appendChild(g);
    });
}

async function listar(){
    const c=$("constructor-lista"); if(!c) return;
    try{
        const snap=await db().collection(COL).orderBy("fechaActualizacion","desc").get();
        if(snap.empty){c.innerHTML='<p class="constructor-vacio">No hay borradores guardados.</p>';return;}
        c.innerHTML=snap.docs.map(d=>{const x=d.data();return `<div class="constructor-item"><div><strong>${esc(x.titulo||"Documento")}</strong><div><small>${esc(x.tipoNombre||x.materia||"")} · ${esc(x.asuntoReferencia||"")} · ${esc(x.estado||"Borrador")}</small></div></div><button class="btn-secundario" onclick="abrirDocumentoJuridico('${d.id}')">Abrir</button></div>`}).join("");
    }catch(e){console.error(e);c.innerHTML='<p class="constructor-vacio">No se pudieron cargar los borradores. Revisa las reglas de Firestore.</p>';}
}

window.nuevoDocumentoJuridico=async()=>{
    actualId=""; asuntoActual=null;
    $("constructor-inicio").hidden=true;
    $("constructor-editor-panel").hidden=true;
    $("constructor-asistente").hidden=false;
    cargarTipos();
    await cargarAsuntos();
    const pendiente=sessionStorage.getItem("jslt_plantilla_pendiente");
    const tipoResuelto=resolverPlantilla(pendiente);
    if(tipoResuelto && $("doc-tipo")?.querySelector(`option[value="${CSS.escape(tipoResuelto)}"]`)){
        $("doc-tipo").value=tipoResuelto;
        $("doc-tipo").dispatchEvent(new Event("change", { bubbles:true }));
        sessionStorage.removeItem("jslt_plantilla_pendiente");
        $("doc-tipo").scrollIntoView({block:"center",behavior:"smooth"});
    }
};

window.cancelarDocumentoJuridico=()=>{
    $("constructor-asistente").hidden=true;
    $("constructor-editor-panel").hidden=true;
    $("constructor-inicio").hidden=false;
    listar();
};

window.generarBorradorJuridico=()=>{
    const sel=$("doc-asunto");
    if(!sel.value){alert("Selecciona un asunto.");return;}
    asuntoActual=JSON.parse(sel.selectedOptions[0].dataset.asunto);
    asuntoActual.id=sel.value;
    const tipo=$("doc-tipo").value;
    const plantilla=PLANTILLAS[tipo];
    if(!plantilla){alert("La plantilla seleccionada no está disponible.");return;}
    $("doc-titulo").value=`${plantilla.nombre} - ${actor(asuntoActual).nombre||asuntoActual.cliente||asuntoActual.folioInterno||""}`;
    $("doc-editor").innerHTML=plantilla.generar(asuntoActual);
    $("doc-editor").dataset.tipo=tipo;
    $("constructor-asistente").hidden=true;
    $("constructor-editor-panel").hidden=false;
};

window.guardarDocumentoJuridico=async()=>{
    if(!asuntoActual){alert("Primero genera o abre un documento.");return;}
    const tipo=$("doc-editor").dataset.tipo||"escrito-libre";
    const plantilla=PLANTILLAS[tipo]||PLANTILLAS["escrito-libre"];
    const datos={titulo:$("doc-titulo").value.trim()||"Documento jurídico",estado:$("doc-estado").value,contenidoHtml:$("doc-editor").innerHTML,tipo,tipoNombre:plantilla.nombre,asuntoId:asuntoActual.id||"",asuntoReferencia:asuntoActual.folioInterno||asuntoActual.expediente||asuntoActual.cliente||"",materia:plantilla.materia||asuntoActual.materia||"",fechaActualizacion:firebase.firestore.FieldValue.serverTimestamp()};
    try{
        if(actualId) await db().collection(COL).doc(actualId).set(datos,{merge:true});
        else {datos.fechaRegistro=firebase.firestore.FieldValue.serverTimestamp();actualId=(await db().collection(COL).add(datos)).id;}
        alert("Documento guardado correctamente.");
    }catch(e){console.error(e);alert("No se pudo guardar. Revisa las reglas de Firestore.");}
};

window.abrirDocumentoJuridico=async id=>{
    const d=await db().collection(COL).doc(id).get(); if(!d.exists) return;
    const x=d.data(); actualId=id;
    asuntoActual={id:x.asuntoId,folioInterno:x.asuntoReferencia,materia:x.materia};
    $("doc-titulo").value=x.titulo||""; $("doc-estado").value=x.estado||"Borrador";
    $("doc-editor").innerHTML=x.contenidoHtml||""; $("doc-editor").dataset.tipo=x.tipo||"escrito-libre";
    $("constructor-inicio").hidden=true; $("constructor-asistente").hidden=true; $("constructor-editor-panel").hidden=false;
};

window.descargarDocumentoWord=()=>{
    const title=($("doc-titulo").value||"documento").replace(/[^a-z0-9áéíóúñ_-]+/gi,"_");
    const html=`<html><head><meta charset="utf-8"><style>body{font-family:Garamond,'Times New Roman',serif;font-size:12pt;line-height:1.5;text-align:justify;margin:2.5cm}h2,h3{text-align:center;letter-spacing:.12em}.doc-aviso{border:1px solid #999;padding:8px;background:#f3f3f3;font-size:10pt}table{border-collapse:collapse}</style></head><body>${$("doc-editor").innerHTML}</body></html>`;
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\ufeff",html],{type:"application/msword"})); a.download=title+".doc"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};

window.imprimirDocumentoJuridico=()=>window.print();

document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll(".editor-barra [data-cmd]").forEach(b=>b.addEventListener("click",()=>{document.execCommand(b.dataset.cmd,false,null);$("doc-editor")?.focus();}));
    cargarTipos(); listar();
});
})();
