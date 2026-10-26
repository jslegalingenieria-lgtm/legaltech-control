window.SIGDE_CONOCIMIENTO_PROCESAL = [
  {
    "id": "civil",
    "orden": 1,
    "icono": "⚖️",
    "nombre": "Civil",
    "fuentes": [
      "Manual de Litigación en Derecho Civil Patrimonial — Jalisco, edición 2026.",
      "Código Civil del Estado de Jalisco.",
      "Código de Procedimientos Civiles del Estado de Jalisco, texto aportado: Título Sexto, Título Décimo Primero, Título Décimo Segundo, Título Décimo Tercero y Título Décimo Cuarto."
    ],
    "procedimientos": [
      {
        "id": "civil-ordinario",
        "tipo": "Ordinario civil",
        "icono": "⚖️",
        "constructorId": "CIV-DEM-001",
        "nombre": "Juicio ordinario civil — vía residual",
        "objetivo": "Atender las controversias que no tengan señalada una tramitación especial, desde la demanda hasta sentencia, convenio y ejecución.",
        "inicio": "Presentación de la demanda",
        "etapas": [
          {
            "nombre": "1. Presentación de la demanda",
            "queHacer": "Presentar la demanda con autoridad competente, partes, prestaciones, hechos, derecho, pruebas y documentos que correspondan a la acción y vía elegida.",
            "despues": "El órgano jurisdiccional debe proveer sobre admisión, prevención o desechamiento; revisar inmediatamente el acuerdo que recaiga.",
            "control": "Fecha y sello de presentación, expediente, competencia, anexos y copia para traslado.",
            "resultado": "Inicio del proceso",
            "fundamento": "CPCEJ: disposiciones sobre demanda y contestación, arts. 267-279."
          },
          {
            "nombre": "2. Admisión o prevención",
            "queHacer": "Analizar el auto: identificar requisitos que deban subsanarse y atender cualquier prevención dentro del plazo fijado por la autoridad.",
            "despues": "Si se admite, continúa el emplazamiento; si existe prevención, primero se subsana y se espera nuevo acuerdo.",
            "control": "Acuerdo completo, plazo, prevención concreta y constancia de cumplimiento.",
            "fundamento": "CPCEJ: régimen de demanda, admisión y prevención aplicable a la vía."
          },
          {
            "nombre": "3. Emplazamiento",
            "queHacer": "Verificar que el emplazamiento se practique legalmente y que exista constancia suficiente en autos.",
            "despues": "Una vez emplazada la contraparte comienza el término para contestar conforme a la vía.",
            "control": "Domicilio, diligencia, fecha de emplazamiento y cómputo del término.",
            "fundamento": "CPCEJ: reglas de emplazamiento y contestación aplicables."
          },
          {
            "nombre": "4. Contestación y reconvención",
            "queHacer": "Analizar cada hecho, prestación y fundamento; formular excepciones y defensas y, cuando proceda, reconvención.",
            "despues": "El tribunal provee las contestaciones y fija la continuación del procedimiento hacia la etapa probatoria o audiencia correspondiente.",
            "control": "Término, hechos admitidos/negados, excepciones, reconvención y pruebas ofrecidas.",
            "fundamento": "CPCEJ arts. 267-279 y reglas de la vía correspondiente."
          },
          {
            "nombre": "5. Pruebas",
            "queHacer": "Relacionar cada hecho controvertido con el medio de prueba idóneo y preparar su admisión y desahogo.",
            "despues": "Después de la admisión, preparar el desahogo de documentales, testimoniales, periciales, inspecciones y demás medios admitidos.",
            "control": "Acuerdo de admisión, cargas procesales, citaciones, peritos y fechas de desahogo.",
            "fundamento": "CPCEJ: disposiciones sobre prueba y su desahogo."
          },
          {
            "nombre": "6. Audiencia y desahogo",
            "queHacer": "Comparecer con expediente de trabajo, teoría del caso, pruebas preparadas y objeciones o incidencias previstas.",
            "despues": "Concluido el desahogo, revisar si procede la etapa de alegatos o la conclusión procesal prevista por la vía.",
            "control": "Acta, pruebas efectivamente desahogadas, incidencias y acuerdos dictados.",
            "fundamento": "CPCEJ: régimen probatorio y de audiencias según la vía."
          },
          {
            "nombre": "7. Alegatos",
            "queHacer": "Relacionar hechos acreditados, pruebas, normas y pretensiones; responder las defensas relevantes.",
            "despues": "El expediente queda en estado de resolución conforme a la vía y al acuerdo del órgano jurisdiccional.",
            "control": "Que cada pretensión tenga prueba y argumento; conservar copia de la promoción o constancia de audiencia."
          },
          {
            "nombre": "8. Sentencia o convenio",
            "queHacer": "Analizar el sentido de la resolución o, si existe convenio susceptible de aprobación, verificar que abarque todas las cuestiones litigiosas.",
            "despues": "Si hay sentencia, valorar recursos; si hay convenio aprobado, controlar su cumplimiento. Si la resolución queda firme, preparar ejecución.",
            "control": "Notificación, congruencia, puntos resolutivos, condenas y efectos del convenio.",
            "resultado": "Sentencia o solución convenida"
          },
          {
            "nombre": "9. Recursos y ejecución",
            "queHacer": "Determinar inmediatamente si existe medio de impugnación procedente y, una vez firme la resolución, promover o vigilar su ejecución.",
            "despues": "La ejecución continúa hasta el cumplimiento material de lo resuelto.",
            "control": "Fecha de notificación, término de impugnación, firmeza, liquidaciones y cumplimiento.",
            "fundamento": "CPCEJ: recursos y ejecución; arts. 477-504 para ejecución."
          }
        ],
        "acuerdo": "Si las partes alcanzan convenio durante el proceso, documentarlo, someterlo a aprobación cuando la vía lo requiera y controlar su cumplimiento.",
        "sentencia": "Si no existe solución convenida, la resolución debe analizarse inmediatamente para determinar firmeza, recurso y ejecución.",
        "fundamentos": [
          "CPCEJ art. 266; reglas del juicio ordinario y disposiciones generales aplicables."
        ],
        "kpis": [
          "Asuntos ordinarios activos",
          "Cumplimiento de términos",
          "Duración por etapa",
          "Sentencias/convenios",
          "Ejecuciones pendientes"
        ],
        "fuentes": [
          "Manual de Litigación en Derecho Civil Patrimonial — Jalisco, edición 2026.",
          "Código Civil del Estado de Jalisco.",
          "Código de Procedimientos Civiles del Estado de Jalisco, texto aportado: Título Sexto, Título Décimo Primero, Título Décimo Segundo, Título Décimo Tercero y Título Décimo Cuarto."
        ]
      },
      {
        "id": "civil-sumario-general",
        "tipo": "Sumario civil",
        "nombre": "Juicio sumario — ruta especial",
        "objetivo": "Llevar los asuntos que el CPCEJ identifica expresamente como sumarios, aplicando sus reglas especiales y, supletoriamente, las del ordinario.",
        "inicio": "Presentación de la demanda",
        "constructorId": "",
        "icono": "⚖️",
        "etapas": [
          {
            "nombre": "1. Identificación de la vía",
            "queHacer": "Verificar que la acción encuadre en alguno de los supuestos del artículo 618 antes de presentar.",
            "despues": "Si la vía es procedente, preparar demanda y anexos conforme a la acción concreta.",
            "control": "Acción, competencia, documentos y supuesto del art. 618.",
            "fundamento": "CPCEJ arts. 618-620."
          },
          {
            "nombre": "2. Demanda y emplazamiento",
            "queHacer": "Presentar la demanda y vigilar el auto de emplazamiento.",
            "despues": "El demandado cuenta con el término especial para contestar y aportar sus medios de convicción.",
            "control": "Fecha de admisión, emplazamiento y cómputo del término.",
            "fundamento": "CPCEJ arts. 621-623."
          },
          {
            "nombre": "3. Contestación y pruebas",
            "queHacer": "Analizar defensas, excepciones y medios de convicción; preparar el desahogo.",
            "despues": "El juez cita a audiencia de pruebas y alegatos dentro del marco temporal previsto.",
            "control": "Pruebas admitidas, citaciones y preparación.",
            "fundamento": "CPCEJ arts. 623-625."
          },
          {
            "nombre": "4. Audiencia",
            "queHacer": "Desahogar pruebas y formular alegatos dentro de la audiencia.",
            "despues": "El juez cita para sentencia.",
            "control": "Acta, pruebas efectivamente desahogadas y alegatos.",
            "fundamento": "CPCEJ arts. 624-625."
          },
          {
            "nombre": "5. Sentencia y recurso",
            "queHacer": "Analizar la sentencia y determinar si procede apelación.",
            "despues": "Si queda firme, controlar ejecución.",
            "control": "Notificación, firmeza, apelación y cumplimiento.",
            "fundamento": "CPCEJ arts. 639-640."
          }
        ],
        "kpis": [
          "Sumarios activos",
          "Tiempo demanda-audiencia",
          "Cumplimiento de audiencia",
          "Sentencias/convenios"
        ],
        "fuentes": [
          "CPCEJ arts. 618-640."
        ]
      },
      {
        "id": "civil-ejecutivo",
        "tipo": "Ejecutivo civil",
        "nombre": "Juicio ejecutivo civil",
        "objetivo": "Exigir judicialmente una obligación sustentada en un título que lleve aparejada ejecución, desde el requerimiento y embargo hasta el pago o resolución.",
        "inicio": "Demanda con título ejecutivo",
        "constructorId": "",
        "icono": "⚡",
        "etapas": [
          {
            "nombre": "1. Verificación del título",
            "queHacer": "Comprobar que el documento encuadre en los supuestos legales de título con ejecución aparejada.",
            "despues": "Si reúne requisitos, presentar demanda ejecutiva.",
            "control": "Original/título, vencimiento, legitimación y exigibilidad.",
            "fundamento": "CPCEJ art. 642."
          },
          {
            "nombre": "2. Demanda y auto ejecutivo",
            "queHacer": "Solicitar requerimiento de pago y las medidas que correspondan conforme al título.",
            "despues": "El órgano provee y, si procede, se practica requerimiento y embargo.",
            "control": "Auto, título base, domicilio y bienes.",
            "fundamento": "CPCEJ arts. 642 y siguientes."
          },
          {
            "nombre": "3. Requerimiento y embargo",
            "queHacer": "Comparecer a la diligencia y controlar que se documenten pago, embargo y emplazamiento cuando procedan.",
            "despues": "El demandado puede oponerse con las defensas y excepciones legalmente admisibles.",
            "control": "Acta, bienes embargados, depositario y emplazamiento.",
            "fundamento": "CPCEJ arts. 649 y siguientes."
          },
          {
            "nombre": "4. Oposición y pruebas",
            "queHacer": "Responder excepciones y preparar las pruebas vinculadas con el título y la obligación.",
            "despues": "Concluida la etapa probatoria, se pasa a alegatos y sentencia conforme a la vía.",
            "control": "Excepciones, pruebas, incidentes y términos.",
            "fundamento": "CPCEJ arts. 650 y siguientes."
          },
          {
            "nombre": "5. Sentencia y ejecución",
            "queHacer": "Determinar condena, liquidación, remate/adjudicación o pago.",
            "despues": "Controlar la ejecución hasta satisfacer el crédito.",
            "control": "Firmeza, liquidación, avalúo, remate y aplicación del producto.",
            "fundamento": "CPCEJ Título Octavo; arts. 477 y siguientes."
          }
        ],
        "kpis": [
          "Ejecutivos activos",
          "Monto recuperado",
          "Embargos realizados",
          "Tiempo requerimiento-cobro"
        ],
        "fuentes": [
          "CPCEJ arts. 642 y siguientes."
        ]
      },
      {
        "id": "civil-hipotecario",
        "tipo": "Hipotecario",
        "nombre": "Juicio hipotecario",
        "objetivo": "Llevar la acción hipotecaria desde la demanda, cédula y contestación hasta sentencia y remate o la salida procesal que corresponda.",
        "inicio": "Demanda hipotecaria",
        "constructorId": "",
        "icono": "🏠",
        "etapas": [
          {
            "nombre": "1. Revisión de la garantía",
            "queHacer": "Acreditar la hipoteca, obligación exigible, inscripción y demás requisitos de la acción.",
            "despues": "Presentar demanda y solicitar las medidas previstas por la vía.",
            "control": "Escritura, inscripción, saldo, vencimiento y garantías.",
            "fundamento": "CPCEJ arts. 669-672."
          },
          {
            "nombre": "2. Admisión y emplazamiento",
            "queHacer": "Vigilar admisión, cédula hipotecaria y emplazamiento conforme al capítulo.",
            "despues": "El demandado contesta y puede oponer defensas y excepciones.",
            "control": "Cédula, notificación, contestación y términos.",
            "fundamento": "CPCEJ arts. 673-680."
          },
          {
            "nombre": "3. Pruebas",
            "queHacer": "Ofrecer y preparar pruebas sobre obligación, incumplimiento, garantía y excepciones.",
            "despues": "Concluido el desahogo, se pasa a alegatos y sentencia.",
            "control": "Pruebas admitidas, avalúo y constancias registrales.",
            "fundamento": "CPCEJ arts. 680 y correlativos."
          },
          {
            "nombre": "4. Sentencia",
            "queHacer": "Verificar si se declara procedente la vía y si existe lugar al remate.",
            "despues": "Si procede, iniciar o continuar ejecución; si no, atender los efectos que determine la sentencia.",
            "control": "Puntos resolutivos, remate, cancelación o restitución.",
            "fundamento": "CPCEJ art. 681."
          },
          {
            "nombre": "5. Ejecución",
            "queHacer": "Controlar avalúo, almonedas/remate o adjudicación y aplicación del producto.",
            "despues": "Cerrar cuando se materialice el cumplimiento.",
            "control": "Avalúo, remate, adjudicación, pago y cancelación registral.",
            "fundamento": "CPCEJ arts. 681-682 y Título Octavo."
          }
        ],
        "kpis": [
          "Hipotecarios activos",
          "Saldo recuperable",
          "Tiempo demanda-remate",
          "Recuperación por ejecución"
        ],
        "fuentes": [
          "CPCEJ arts. 669-682."
        ]
      },
      {
        "id": "civil-desocupacion",
        "tipo": "Sumario de desocupación",
        "nombre": "Juicio sumario de desocupación",
        "objetivo": "Tramitar la desocupación por las causas expresamente previstas por el CPCEJ, incluyendo rentas vencidas y lanzamiento cuando proceda.",
        "inicio": "Demanda de desocupación",
        "constructorId": "",
        "icono": "🏠",
        "etapas": [
          {
            "nombre": "1. Causa de desocupación",
            "queHacer": "Acreditar que la acción se funda en una de las causas del artículo 683 y revisar el plazo especial aplicable.",
            "despues": "Presentar demanda con contrato y documentos de arrendamiento.",
            "control": "Contrato, vencimiento, rentas, domicilio y causa.",
            "fundamento": "CPCEJ arts. 683-684."
          },
          {
            "nombre": "2. Admisión y medidas iniciales",
            "queHacer": "Solicitar y vigilar las medidas legalmente previstas, incluyendo requerimiento y embargo cuando se actualicen sus supuestos.",
            "despues": "Se practica emplazamiento y corre el término especial de contestación.",
            "control": "Auto, diligencia, requerimiento, embargo y emplazamiento.",
            "fundamento": "CPCEJ arts. 685-686."
          },
          {
            "nombre": "3. Contestación y solución por pago",
            "queHacer": "Analizar contestación y cualquier comprobación de pago.",
            "despues": "Si se acredita pago en los supuestos legales, puede concluir; de lo contrario continúa el procedimiento.",
            "control": "Comprobantes, vista, aceptación u oposición y costas.",
            "fundamento": "CPCEJ art. 686."
          },
          {
            "nombre": "4. Sentencia",
            "queHacer": "Analizar procedencia de la desocupación y efectos sobre entrega del inmueble.",
            "despues": "Si se declara procedente, controlar plazo de gracia y lanzamiento.",
            "control": "Sentencia, plazo de gracia y notificación.",
            "fundamento": "CPCEJ arts. 687-688."
          },
          {
            "nombre": "5. Lanzamiento y cumplimiento",
            "queHacer": "Preparar la diligencia de lanzamiento y, cuando proceda, embargo de bienes para cubrir pensiones y costas.",
            "despues": "Cerrar con entrega material y constancia del cumplimiento.",
            "control": "Acta, inventario, depósito y entrega.",
            "fundamento": "CPCEJ arts. 688-690."
          }
        ],
        "kpis": [
          "Desocupaciones activas",
          "Rentas recuperadas",
          "Tiempo demanda-lanzamiento",
          "Lanzamientos pendientes"
        ],
        "fuentes": [
          "CPCEJ arts. 683-692 Bis."
        ]
      },
      {
        "id": "civil-alimentos",
        "tipo": "Sumario de alimentos",
        "nombre": "Juicio sobre alimentos",
        "objetivo": "Llevar una reclamación de alimentos desde la solicitud hasta fijación, sentencia/convenio y cumplimiento periódico.",
        "inicio": "Demanda o solicitud de alimentos",
        "constructorId": "",
        "icono": "🍽️",
        "etapas": [
          {
            "nombre": "1. Demanda y urgencia",
            "queHacer": "Precisar acreedores, deudor, necesidades, capacidad económica y medidas urgentes que correspondan.",
            "despues": "Revisar admisión y las medidas provisionales decretadas.",
            "control": "Parentesco, necesidades, ingresos, domicilio y medidas.",
            "fundamento": "CPCEJ arts. 693 y siguientes."
          },
          {
            "nombre": "2. Emplazamiento y contestación",
            "queHacer": "Controlar emplazamiento y analizar defensas, ingresos y cargas familiares.",
            "despues": "Preparar pruebas y audiencia.",
            "control": "Términos, pruebas de ingresos y necesidades.",
            "fundamento": "CPCEJ capítulo de alimentos."
          },
          {
            "nombre": "3. Pruebas y audiencia",
            "queHacer": "Acreditar necesidades y capacidad económica con medios idóneos.",
            "despues": "El juez resuelve conforme al procedimiento especial.",
            "control": "Pruebas, informes, depósitos y medidas.",
            "fundamento": "CPCEJ arts. 693 y siguientes."
          },
          {
            "nombre": "4. Convenio o sentencia",
            "queHacer": "Revisar monto, periodicidad, garantía, actualización y demás obligaciones.",
            "despues": "Controlar cumplimiento y, ante incumplimiento, promover la actuación correspondiente.",
            "control": "Monto, fechas, depósitos, garantía y notificaciones.",
            "fundamento": "CPCEJ capítulo de alimentos."
          },
          {
            "nombre": "5. Cumplimiento y modificación",
            "queHacer": "Dar seguimiento a pagos y a cambios relevantes de necesidad o capacidad.",
            "despues": "Si existe incumplimiento o cambio sustancial, determinar la promoción correspondiente.",
            "control": "Adeudo, pagos, incidentes y términos.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Pensiones fijadas",
          "Cumplimiento de pagos",
          "Adeudos",
          "Incidentes de modificación"
        ],
        "fuentes": [
          "CPCEJ arts. 693 y siguientes; Código Civil del Estado de Jalisco, disposiciones sustantivas de alimentos."
        ]
      },
      {
        "id": "civil-interdictos",
        "tipo": "Interdicto",
        "nombre": "Interdictos",
        "objetivo": "Tramitar la tutela posesoria provisional prevista por el CPCEJ, diferenciándola de la acción de fondo que eventualmente corresponda.",
        "inicio": "Demanda interdictal",
        "constructorId": "",
        "icono": "🛡️",
        "etapas": [
          {
            "nombre": "1. Diagnóstico posesorio",
            "queHacer": "Determinar el acto de perturbación, despojo u objeto específico de tutela y la procedencia del interdicto.",
            "despues": "Presentar demanda con evidencia inmediata de la posesión y del hecho.",
            "control": "Posesión, fecha del acto, violencia/perturbación y evidencia.",
            "fundamento": "CPCEJ art. 618, fracción IV y capítulo especial aplicable."
          },
          {
            "nombre": "2. Admisión y emplazamiento",
            "queHacer": "Vigilar admisión y notificación.",
            "despues": "La contraparte contesta y se prepara la prueba.",
            "control": "Términos, diligencias y estado posesorio.",
            "fundamento": "CPCEJ arts. 620 y siguientes."
          },
          {
            "nombre": "3. Pruebas y audiencia",
            "queHacer": "Desahogar pruebas enfocadas en la posesión y el hecho perturbador.",
            "despues": "Concluida la audiencia, se pasa a resolución.",
            "control": "Pruebas, inspección y testimonios.",
            "fundamento": "CPCEJ régimen sumario."
          },
          {
            "nombre": "4. Resolución",
            "queHacer": "Analizar la tutela posesoria concedida y sus efectos.",
            "despues": "Determinar cumplimiento y, si existe controversia de fondo, la acción posterior correspondiente.",
            "control": "Puntos resolutivos y cumplimiento.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Interdictos activos",
          "Medidas posesorias",
          "Tiempo a resolución",
          "Conflictos recurrentes"
        ],
        "fuentes": [
          "CPCEJ Título Décimo Primero, régimen de juicios sumarios; artículo 618, fracción IV y disposiciones especiales aplicables."
        ]
      },
      {
        "id": "civil-tramitacion-especial",
        "tipo": "Tramitación especial",
        "nombre": "Negocios de tramitación especial",
        "objetivo": "Identificar y conducir los procedimientos que el CPCEJ ubica expresamente en el Título Décimo Segundo, sin confundirlos con el ordinario o sumario.",
        "inicio": "Promoción inicial según el negocio",
        "constructorId": "",
        "icono": "📚",
        "etapas": [
          {
            "nombre": "1. Clasificación",
            "queHacer": "Determinar qué capítulo especial corresponde: rebeldía, arbitraje, modificación de actas, divorcio por mutuo consentimiento, concurso u otro regulado en el título.",
            "despues": "Aplicar las reglas especiales del capítulo correspondiente.",
            "control": "Tipo de negocio, legitimación y requisitos especiales.",
            "fundamento": "CPCEJ Título Décimo Segundo."
          },
          {
            "nombre": "2. Trámite especial",
            "queHacer": "Cumplir los actos, publicaciones, comparecencias o documentos específicos.",
            "despues": "Seguir la secuencia particular del capítulo, sin sustituirla por la ruta ordinaria.",
            "control": "Constancias y requisitos especiales.",
            "fundamento": "CPCEJ arts. 722 y siguientes."
          },
          {
            "nombre": "3. Resolución o laudo",
            "queHacer": "Controlar la resolución judicial o, en arbitraje, el laudo y sus efectos.",
            "despues": "Determinar recurso, homologación o ejecución según el procedimiento.",
            "control": "Notificación, firmeza y efectos.",
            "fundamento": "CPCEJ arts. 730-757 para arbitraje; demás capítulos según negocio."
          },
          {
            "nombre": "4. Cumplimiento",
            "queHacer": "Ejecutar o vigilar el cumplimiento de la resolución o convenio.",
            "despues": "Cerrar con constancia de cumplimiento.",
            "control": "Actos de ejecución y registros.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Especiales activos",
          "Tiempo por procedimiento",
          "Cumplimiento de actos especiales"
        ],
        "fuentes": [
          "CPCEJ Título Décimo Segundo, arts. 722 y siguientes."
        ]
      },
      {
        "id": "civil-divorcio-mutuo",
        "tipo": "Tramitación especial familiar",
        "nombre": "Divorcio por mutuo consentimiento",
        "objetivo": "Conducir la solicitud conjunta, convenio, ratificación/aprobación y ejecución de los efectos del divorcio.",
        "inicio": "Solicitud conjunta y convenio",
        "constructorId": "FAM-DIV-001",
        "icono": "💍",
        "etapas": [
          {
            "nombre": "1. Solicitud y convenio",
            "queHacer": "Integrar actas y convenio con guarda, alimentos, convivencia, habitación y patrimonio en los términos exigibles.",
            "despues": "Presentar y esperar examen judicial.",
            "control": "Actas, convenio y anexos.",
            "fundamento": "CPCEJ art. 764."
          },
          {
            "nombre": "2. Examen y ratificación",
            "queHacer": "Comparecer a ratificación cuando corresponda y atender prevenciones.",
            "despues": "El juez resuelve sobre aprobación y medidas.",
            "control": "Ratificación, prevenciones y términos.",
            "fundamento": "CPCEJ arts. 765-766."
          },
          {
            "nombre": "3. Intervención de autoridades",
            "queHacer": "Atender la vista a Procuraduría Social y, cuando haya niñas, niños o adolescentes, a la autoridad de protección correspondiente.",
            "despues": "Una vez satisfechos los requisitos, continúa hacia resolución.",
            "control": "Vistas y manifestaciones.",
            "fundamento": "CPCEJ arts. 767-768."
          },
          {
            "nombre": "4. Sentencia y registro",
            "queHacer": "Revisar la sentencia y sus efectos.",
            "despues": "Una vez ejecutoriada, verificar remisión al Registro Civil.",
            "control": "Sentencia, ejecutoria y oficio registral.",
            "fundamento": "CPCEJ arts. 774-775."
          }
        ],
        "kpis": [
          "Divorcios por convenio",
          "Tiempo solicitud-sentencia",
          "Convenios aprobados",
          "Cumplimiento de convenios"
        ],
        "fuentes": [
          "CPCEJ arts. 764-775; Código Civil del Estado de Jalisco, disposiciones sustantivas de divorcio."
        ]
      },
      {
        "id": "civil-jurisdiccion-voluntaria",
        "tipo": "Jurisdicción voluntaria",
        "nombre": "Jurisdicción voluntaria",
        "objetivo": "Tramitar actos que requieren intervención judicial o notarial auxiliar sin controversia entre partes determinadas.",
        "inicio": "Solicitud de jurisdicción voluntaria",
        "constructorId": "",
        "icono": "📄",
        "etapas": [
          {
            "nombre": "1. Determinar procedencia",
            "queHacer": "Confirmar que no exista controversia entre partes determinadas y que la ley requiera o permita intervención en jurisdicción voluntaria.",
            "despues": "Presentar solicitud y anexos.",
            "control": "Objeto, legitimación y ausencia de controversia.",
            "fundamento": "CPCEJ arts. 954-955."
          },
          {
            "nombre": "2. Solicitud y admisión",
            "queHacer": "Presentar por escrito y atender el acuerdo inicial.",
            "despues": "Se practican diligencias y pruebas necesarias.",
            "control": "Acuerdo, documentos y diligencias.",
            "fundamento": "CPCEJ arts. 955 y siguientes."
          },
          {
            "nombre": "3. Diligencias",
            "queHacer": "Impulsar las actuaciones y, cuando proceda, solicitar auxilio notarial conforme al régimen legal.",
            "despues": "Concluidas las diligencias, obtener resolución o constancia final.",
            "control": "Actas, testimonios y constancias.",
            "fundamento": "CPCEJ art. 955 Bis y correlativos."
          },
          {
            "nombre": "4. Conclusión",
            "queHacer": "Obtener resolución, certificación o instrumento correspondiente.",
            "despues": "Si surge controversia, evaluar la vía contenciosa que corresponda.",
            "control": "Documento final y efectos jurídicos.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Diligencias voluntarias activas",
          "Tiempo solicitud-conclusión",
          "Actos notariales auxiliares"
        ],
        "fuentes": [
          "CPCEJ arts. 954 y siguientes."
        ]
      },
      {
        "id": "civil-juez-paz",
        "tipo": "Juez de Paz",
        "nombre": "Negocios de competencia de los Jueces de Paz",
        "objetivo": "Aplicar la vía especial de menor cuantía prevista por el CPCEJ, verificando siempre la cuantía y competencia.",
        "inicio": "Demanda ante Juez de Paz",
        "constructorId": "",
        "icono": "⚖️",
        "etapas": [
          {
            "nombre": "1. Verificar cuantía y competencia",
            "queHacer": "Determinar si el asunto está dentro de la competencia del Juez de Paz conforme al valor previsto por el Código.",
            "despues": "Presentar demanda escrita o verbal en los supuestos permitidos.",
            "control": "Cuantía, materia, territorio y competencia.",
            "fundamento": "CPCEJ arts. 1065-1066."
          },
          {
            "nombre": "2. Demanda y contestación",
            "queHacer": "Exponer hechos, interés y petición; presentar documentos.",
            "despues": "Seguir la secuencia especial y las reglas generales supletorias.",
            "control": "Acta o escrito, documentos y notificación.",
            "fundamento": "CPCEJ arts. 1069 y siguientes."
          },
          {
            "nombre": "3. Pruebas y resolución",
            "queHacer": "Desahogar los medios de prueba y formular las manifestaciones correspondientes.",
            "despues": "Obtener sentencia y controlar cumplimiento o recurso cuando proceda.",
            "control": "Pruebas, sentencia y términos.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Asuntos de cuantía menor",
          "Tiempo resolución",
          "Cumplimiento de sentencias"
        ],
        "fuentes": [
          "CPCEJ Título Décimo Cuarto, arts. 1065 y siguientes."
        ]
      }
    ]
  },
  {
    "id": "familiar",
    "orden": 2,
    "icono": "👨‍👩‍👧",
    "nombre": "Familiar",
    "fuentes": [
      "Manual de Litigación en Derecho Familiar — Jalisco, edición 2026.",
      "Código Civil del Estado de Jalisco, disposiciones de divorcio, alimentos, guarda y custodia y convivencia.",
      "Código de Procedimientos Civiles del Estado de Jalisco, incluyendo juicio sumario y tramitación especial."
    ],
    "procedimientos": [
      {
        "id": "familiar-contencioso",
        "tipo": "Familiar contencioso",
        "icono": "👨‍👩‍👧",
        "constructorId": "FAM-DIV-001",
        "nombre": "Controversia familiar contenciosa",
        "objetivo": "Organizar un asunto familiar desde la demanda, incluyendo medidas provisionales cuando procedan, hasta convenio, sentencia y cumplimiento.",
        "inicio": "Presentación de demanda o promoción inicial",
        "etapas": [
          {
            "nombre": "1. Presentación",
            "queHacer": "Presentar la demanda o solicitud con pretensiones concretas, hechos, documentos y pruebas; identificar desde el inicio niñas, niños, adolescentes o personas en situación de riesgo.",
            "despues": "Revisar admisión, prevención y medidas provisionales que haya decretado el órgano.",
            "control": "Competencia, legitimación, domicilios, documentos y solicitudes urgentes."
          },
          {
            "nombre": "2. Admisión y medidas provisionales",
            "queHacer": "Analizar el auto inicial y ejecutar las medidas ordenadas sobre alimentos, custodia, convivencia, protección u otros aspectos cuando procedan.",
            "despues": "Se practica el emplazamiento y se controla el término de contestación.",
            "control": "Notificación de medidas, cumplimiento inmediato y protección de personas vulnerables."
          },
          {
            "nombre": "3. Emplazamiento y contestación",
            "queHacer": "Verificar emplazamiento y preparar respuesta a hechos, prestaciones y pruebas de la contraparte.",
            "despues": "El procedimiento avanza a la audiencia o etapa probatoria que corresponda.",
            "control": "Términos, excepciones, reconvención y hechos controvertidos."
          },
          {
            "nombre": "4. Pruebas y preparación de audiencia",
            "queHacer": "Vincular cada hecho relevante con documental, testimonial, pericial, informes y demás medios admitidos.",
            "despues": "Desahogar las pruebas y atender las cuestiones que el órgano plantee en audiencia.",
            "control": "Pruebas admitidas, citaciones, peritos, informes y preparación de alegatos."
          },
          {
            "nombre": "5. Audiencia y alegatos",
            "queHacer": "Presentar la teoría del caso, controlar el desahogo probatorio y formular la petición concreta al órgano.",
            "despues": "El asunto queda para resolución o puede concluir por convenio aprobado cuando legalmente proceda.",
            "control": "Acta, acuerdos, pruebas desahogadas y medidas vigentes."
          },
          {
            "nombre": "6. Convenio o sentencia",
            "queHacer": "Revisar integralmente el convenio o sentencia respecto de hijos, alimentos, patrimonio y demás puntos controvertidos.",
            "despues": "Si es convenio, controlar su cumplimiento; si es sentencia, revisar recursos y posteriormente ejecución.",
            "control": "Notificación, alcance de obligaciones y fechas de cumplimiento.",
            "resultado": "Convenio aprobado o sentencia"
          },
          {
            "nombre": "7. Cumplimiento y ejecución",
            "queHacer": "Dar seguimiento al cumplimiento de alimentos, convivencia, entrega de bienes, liquidación o cualquier condena.",
            "despues": "Si existe incumplimiento, promover la actuación procesal correspondiente y actualizar el control de términos.",
            "control": "Pagos, depósitos, convivencias, medidas de protección y obligaciones periódicas."
          }
        ],
        "acuerdo": "El convenio debe resolver expresamente las cuestiones familiares relevantes y quedar aprobado por la autoridad cuando corresponda.",
        "sentencia": "La sentencia debe analizarse punto por punto y transformarse en un plan de cumplimiento y, en su caso, ejecución.",
        "kpis": [
          "Asuntos familiares activos",
          "Cumplimiento de términos",
          "Medidas provisionales",
          "Convenios",
          "Sentencias"
        ],
        "fuentes": [
          "Manual de Litigación en Derecho Familiar — Jalisco, edición 2026.",
          "Código Civil del Estado de Jalisco.",
          "Código de Procedimientos Civiles del Estado de Jalisco y régimen procesal familiar aplicable."
        ],
        "fundamentos": [
          "CPCEJ arts. 618 fracciones I y VI, y disposiciones familiares aplicables; CCEJ arts. 410-422 y correlativos según pretensión."
        ]
      },
      {
        "id": "familiar-alimentos",
        "tipo": "Sumario familiar",
        "icono": "🍽️",
        "nombre": "Alimentos",
        "objetivo": "Conducir la reclamación de alimentos con enfoque en necesidad, capacidad, urgencia y cumplimiento periódico.",
        "inicio": "Demanda de alimentos",
        "constructorId": "",
        "fundamentos": [
          "CPCEJ art. 618 fracción I y capítulo de alimentos; CCEJ arts. 432-452."
        ],
        "kpis": [
          "Pensiones fijadas",
          "Cumplimiento de pagos",
          "Adeudos",
          "Incidentes"
        ],
        "etapas": [
          {
            "nombre": "1. Diagnóstico",
            "queHacer": "Acreditar parentesco, necesidad y capacidad económica y solicitar medidas urgentes cuando procedan.",
            "despues": "Presentar demanda y revisar medidas provisionales.",
            "control": "Parentesco, ingresos, necesidades y domicilio.",
            "fundamento": "CCEJ arts. 432-446; CPCEJ art. 618 fracción I."
          },
          {
            "nombre": "2. Emplazamiento y contestación",
            "queHacer": "Controlar notificación y analizar defensas.",
            "despues": "Preparar pruebas.",
            "control": "Términos y hechos controvertidos.",
            "fundamento": ""
          },
          {
            "nombre": "3. Pruebas y audiencia",
            "queHacer": "Acreditar necesidades y capacidad económica.",
            "despues": "Pasar a resolución.",
            "control": "Documentos, informes y periciales.",
            "fundamento": "CPCEJ capítulo de alimentos."
          },
          {
            "nombre": "4. Sentencia/convenio",
            "queHacer": "Revisar monto, garantía y periodicidad.",
            "despues": "Controlar pagos y promover ante incumplimiento.",
            "control": "Monto, fechas y garantía.",
            "fundamento": "CCEJ arts. 448-450."
          }
        ]
      },
      {
        "id": "familiar-divorcio-unilateral",
        "tipo": "Divorcio",
        "icono": "💔",
        "nombre": "Divorcio solicitado por uno de los cónyuges",
        "objetivo": "Conducir el divorcio solicitado unilateralmente y resolver sus efectos sobre hijos, alimentos, convivencia y patrimonio.",
        "inicio": "Solicitud/demanda de divorcio",
        "constructorId": "FAM-DIV-001",
        "fundamentos": [
          "CCEJ arts. 410-422; medidas provisionales art. 414 Bis; efectos de la sentencia art. 415 y siguientes."
        ],
        "kpis": [
          "Divorcios unilaterales",
          "Tiempo demanda-sentencia",
          "Medidas provisionales",
          "Cumplimiento de efectos"
        ],
        "etapas": [
          {
            "nombre": "1. Demanda",
            "queHacer": "Presentar solicitud y propuestas sobre efectos del divorcio.",
            "despues": "El juez provee y dicta medidas provisionales cuando procedan.",
            "control": "Acta matrimonial, hijos, domicilio, alimentos y bienes.",
            "fundamento": "CCEJ arts. 410-414 Bis."
          },
          {
            "nombre": "2. Medidas provisionales",
            "queHacer": "Controlar alimentos, custodia y convivencia mientras dura el proceso.",
            "despues": "Se practica emplazamiento y continúa el litigio sobre efectos.",
            "control": "Medidas vigentes y cumplimiento.",
            "fundamento": "CCEJ art. 414 Bis."
          },
          {
            "nombre": "3. Contestación y pruebas",
            "queHacer": "Analizar oposición y acreditar los hechos relevantes sobre efectos.",
            "despues": "Preparar audiencia/resolución.",
            "control": "Pruebas familiares, patrimoniales y de convivencia.",
            "fundamento": ""
          },
          {
            "nombre": "4. Sentencia",
            "queHacer": "Revisar efectos sobre hijos, convivencia, alimentos y patrimonio.",
            "despues": "Controlar recurso y ejecución.",
            "control": "Puntos resolutivos y notificación.",
            "fundamento": "CCEJ art. 415 y siguientes."
          },
          {
            "nombre": "5. Ejecutoria y cumplimiento",
            "queHacer": "Verificar inscripción, división de bienes y obligaciones.",
            "despues": "Cerrar cuando se acrediten los efectos.",
            "control": "Registro Civil, bienes, pagos y convivencia.",
            "fundamento": "CCEJ arts. 418-422."
          }
        ]
      },
      {
        "id": "familiar-custodia-convivencia",
        "tipo": "Sumario familiar",
        "icono": "👨‍👩‍👧",
        "nombre": "Guarda, custodia, visitas y convivencia autónomas",
        "objetivo": "Llevar la controversia sobre custodia y convivencia cuando se tramite de manera autónoma al divorcio.",
        "inicio": "Demanda o solicitud",
        "constructorId": "",
        "fundamentos": [
          "CPCEJ art. 618 fracción VI; CCEJ disposiciones sobre patria potestad, guarda, custodia y convivencia."
        ],
        "kpis": [
          "Asuntos de custodia",
          "Cumplimiento de convivencias",
          "Incidencias",
          "Medidas de protección"
        ],
        "etapas": [
          {
            "nombre": "1. Diagnóstico",
            "queHacer": "Identificar régimen actual, necesidades de niñas, niños o adolescentes y riesgo.",
            "despues": "Solicitar medidas urgentes cuando procedan.",
            "control": "Interés superior, domicilio y situación actual.",
            "fundamento": "CPCEJ art. 618 fracción VI."
          },
          {
            "nombre": "2. Demanda y medidas",
            "queHacer": "Presentar pretensiones concretas y controlar medidas provisionales.",
            "despues": "Se emplaza y continúa la controversia.",
            "control": "Medidas, notificaciones y términos.",
            "fundamento": ""
          },
          {
            "nombre": "3. Pruebas",
            "queHacer": "Acreditar condiciones familiares, capacidad parental y circunstancias relevantes.",
            "despues": "Desahogar pruebas y escuchar a quien corresponda conforme a la ley.",
            "control": "Periciales, estudios, testimonios y opinión de NNA cuando proceda.",
            "fundamento": "CCEJ y CPCEJ régimen familiar."
          },
          {
            "nombre": "4. Resolución",
            "queHacer": "Analizar custodia, convivencia y medidas de protección.",
            "despues": "Controlar cumplimiento y modificación si cambian las circunstancias.",
            "control": "Sentencia, calendario y medidas.",
            "fundamento": ""
          }
        ]
      },
      {
        "id": "familiar-divorcio-administrativo",
        "tipo": "No jurisdiccional",
        "icono": "📜",
        "nombre": "Divorcio administrativo o notarial",
        "objetivo": "Identificar cuándo el divorcio puede tramitarse fuera de juicio y conducir el procedimiento hasta el acta o instrumento correspondiente.",
        "inicio": "Solicitud ante autoridad competente",
        "constructorId": "",
        "fundamentos": [
          "CCEJ art. 405 Bis y disposiciones correlativas; requisitos específicos deben verificarse según el supuesto."
        ],
        "kpis": [
          "Divorcios no jurisdiccionales",
          "Tiempo solicitud-acta",
          "Casos rechazados por requisitos"
        ],
        "etapas": [
          {
            "nombre": "1. Verificar requisitos",
            "queHacer": "Comprobar que los cónyuges encuadren en los supuestos legales y que no existan impedimentos.",
            "despues": "Presentar solicitud ante la autoridad competente.",
            "control": "Edad, estado civil, hijos, alimentos y demás requisitos.",
            "fundamento": "CCEJ art. 405 Bis."
          },
          {
            "nombre": "2. Comparecencia y plazo",
            "queHacer": "Cumplir comparecencias y plazo legal.",
            "despues": "Si se satisfacen los requisitos, se levanta el acta o instrumento correspondiente.",
            "control": "Comparecencias y documentos.",
            "fundamento": ""
          },
          {
            "nombre": "3. Acta y registro",
            "queHacer": "Obtener acta/instrumento y verificar anotaciones registrales.",
            "despues": "Cerrar con constancia de disolución.",
            "control": "Acta y registro.",
            "fundamento": ""
          }
        ]
      }
    ]
  },
  {
    "id": "sucesorio",
    "orden": 3,
    "icono": "📜",
    "nombre": "Sucesorio",
    "fuentes": [
      "Manual de Litigación en Derecho Sucesorio y de Herencias — Jalisco, edición 2026.",
      "Código Civil del Estado de Jalisco.",
      "Código de Procedimientos Civiles del Estado de Jalisco, Título Décimo Segundo, Capítulo VI y disposiciones sucesorias."
    ],
    "procedimientos": [
      {
        "id": "sucesorio-testamentario",
        "tipo": "Sucesorio testamentario",
        "nombre": "Sucesión testamentaria",
        "objetivo": "Llevar la sucesión con testamento desde su radicación y reconocimiento hasta inventario, liquidación, partición y adjudicación.",
        "inicio": "Denuncia/promoción de testamentaría",
        "constructorId": "CIV-SUC-001",
        "icono": "📜",
        "etapas": [
          {
            "nombre": "1. Radicación",
            "queHacer": "Presentar acta de defunción, testamento y documentos de legitimación.",
            "despues": "El juez determina la radicación y las citaciones/publicaciones correspondientes.",
            "control": "Testamento, defunción, competencia y herederos.",
            "fundamento": "CPCEJ arts. 823 y 837 y siguientes."
          },
          {
            "nombre": "2. Reconocimiento de herederos",
            "queHacer": "Atender la junta y posibles oposiciones o cuestiones de capacidad.",
            "despues": "Determinar herederos y albacea conforme al testamento y la ley.",
            "control": "Comparecencias, publicaciones y oposición.",
            "fundamento": "CPCEJ arts. 837-842."
          },
          {
            "nombre": "3. Inventario y avalúo",
            "queHacer": "Integrar bienes, derechos, cargas y avalúos.",
            "despues": "Concluido el inventario, pasar a administración y liquidación.",
            "control": "Inventario, avalúos y pasivos.",
            "fundamento": "CPCEJ arts. 856 y siguientes."
          },
          {
            "nombre": "4. Liquidación y partición",
            "queHacer": "Determinar pasivos, gastos, cargas y proyecto de partición.",
            "despues": "Someter la partición a aprobación.",
            "control": "Créditos, impuestos, cuentas y proyecto.",
            "fundamento": "CPCEJ régimen sucesorio."
          },
          {
            "nombre": "5. Adjudicación",
            "queHacer": "Obtener resolución de adjudicación y documentos para su inscripción.",
            "despues": "Controlar entrega e inscripción de bienes.",
            "control": "Sentencia, adjudicación, registros y entrega.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Sucesiones testamentarias activas",
          "Tiempo radicación-adjudicación",
          "Inventarios pendientes",
          "Adjudicaciones concluidas"
        ],
        "fuentes": [
          "CPCEJ arts. 817 y siguientes; disposiciones específicas de testamentaría, arts. 837 y siguientes."
        ]
      },
      {
        "id": "sucesorio-intestado",
        "tipo": "Sucesorio intestamentario",
        "nombre": "Sucesión intestamentaria",
        "objetivo": "Llevar la denuncia de intestado hasta la declaración de herederos, designación de albacea, inventario, partición y adjudicación.",
        "inicio": "Denuncia de intestado",
        "constructorId": "CIV-SUC-001",
        "icono": "📜",
        "etapas": [
          {
            "nombre": "1. Denuncia",
            "queHacer": "Presentar acta de defunción y documentos que acrediten el vínculo o interés.",
            "despues": "El juez ordena publicaciones y actuaciones iniciales.",
            "control": "Parentesco, defunción, competencia y posibles herederos.",
            "fundamento": "CPCEJ arts. 843-846."
          },
          {
            "nombre": "2. Declaratoria de herederos",
            "queHacer": "Atender publicaciones, comparecencias y oposiciones.",
            "despues": "Emitida la declaratoria, se designa albacea conforme al régimen aplicable.",
            "control": "Publicaciones, comparecencias y oposición.",
            "fundamento": "CPCEJ arts. 847-851."
          },
          {
            "nombre": "3. Albacea e inventario",
            "queHacer": "Entregar bienes y formar inventario y avalúo.",
            "despues": "Continuar con liquidación y partición.",
            "control": "Inventario, avalúos, bienes litigiosos y pasivos.",
            "fundamento": "CPCEJ arts. 852 y 856 y siguientes."
          },
          {
            "nombre": "4. Partición y adjudicación",
            "queHacer": "Preparar proyecto de partición y atender objeciones.",
            "despues": "Obtener adjudicación e inscripciones.",
            "control": "Proyecto, aprobación, sentencia y registros.",
            "fundamento": "CPCEJ régimen sucesorio."
          }
        ],
        "kpis": [
          "Intestados activos",
          "Tiempo denuncia-declaratoria",
          "Herederos reconocidos",
          "Adjudicaciones pendientes"
        ],
        "fuentes": [
          "CPCEJ arts. 843-855 y disposiciones sucesorias posteriores."
        ]
      }
    ]
  },
  {
    "id": "mercantil",
    "orden": 4,
    "icono": "🏢",
    "nombre": "Mercantil",
    "fuentes": [
      "Código de Comercio, texto aportado.",
      "Ley General de Títulos y Operaciones de Crédito.",
      "Manual de Litigación Mercantil — edición 2026."
    ],
    "procedimientos": [
      {
        "id": "mercantil-ejecutivo",
        "tipo": "Juicio ejecutivo mercantil",
        "icono": "💰",
        "constructorId": "MERC-EJE-001",
        "nombre": "Cobro en vía ejecutiva mercantil",
        "objetivo": "Llevar el cobro de una obligación ejecutiva desde la demanda hasta sentencia y ejecución.",
        "inicio": "Presentación de demanda con documento base",
        "etapas": [
          {
            "nombre": "1. Demanda y documento base",
            "queHacer": "Presentar demanda y exhibir el título o documento que sustente la vía ejecutiva, identificando obligación, vencimiento y accesorios.",
            "despues": "El órgano revisa admisión y, si procede, ordena requerimiento de pago y embargo conforme a la vía.",
            "control": "Título, legitimación, vencimiento, cuantía, domicilio y prescripción."
          },
          {
            "nombre": "2. Requerimiento, embargo y emplazamiento",
            "queHacer": "Verificar la diligencia y que el embargo se practique conforme al auto y a la ley.",
            "despues": "La parte demandada puede contestar y oponer excepciones dentro del término aplicable.",
            "control": "Acta de diligencia, bienes, depositario, domicilio y emplazamiento."
          },
          {
            "nombre": "3. Contestación y excepciones",
            "queHacer": "Analizar defensas, excepciones y documentos de la contraparte y preparar respuesta procesal.",
            "despues": "El órgano determina la continuación hacia pruebas y audiencia conforme a la vía.",
            "control": "Excepciones, objeciones al título, pagos, vencimiento y legitimación."
          },
          {
            "nombre": "4. Pruebas y audiencia",
            "queHacer": "Preparar y desahogar los medios admitidos; centrar la prueba en existencia, exigibilidad, pago y defensas.",
            "despues": "Concluida la etapa probatoria, formular alegatos si la vía los contempla.",
            "control": "Acuerdos de admisión, documentos, periciales, testimoniales y actas."
          },
          {
            "nombre": "5. Sentencia",
            "queHacer": "Analizar condena, absolución, accesorios y efectos sobre bienes embargados.",
            "despues": "Determinar recurso procedente o, si queda firme, iniciar/continuar ejecución.",
            "control": "Notificación, puntos resolutivos y firmeza."
          },
          {
            "nombre": "6. Ejecución",
            "queHacer": "Solicitar las actuaciones necesarias para hacer efectivo el fallo sobre bienes, pagos o garantías.",
            "despues": "Cerrar cuando exista cumplimiento material y documental de la sentencia.",
            "control": "Liquidación, avalúo, remate/adjudicación cuando corresponda y pago."
          }
        ],
        "acuerdo": "La transacción o convenio puede plantearse durante el juicio; debe documentarse y producir los efectos procesales que correspondan.",
        "sentencia": "La sentencia firme se convierte en la base de la ejecución hasta lograr el pago o cumplimiento.",
        "fundamentos": [
          "Código de Comercio arts. 1055, 1391-1414."
        ],
        "kpis": [
          "Asuntos activos",
          "Cumplimiento de términos",
          "Resultados por etapa"
        ],
        "fuentes": [
          "Código de Comercio, texto aportado.",
          "Ley General de Títulos y Operaciones de Crédito.",
          "Manual de Litigación Mercantil — edición 2026."
        ]
      },
      {
        "id": "mercantil-ordinario",
        "tipo": "Juicio mercantil",
        "icono": "🏢",
        "constructorId": "MERC-ORD-001",
        "nombre": "Juicio ordinario mercantil — ruta base",
        "objetivo": "Tramitar una controversia mercantil que no corresponda a la vía ejecutiva u otra vía especial.",
        "inicio": "Presentación de demanda",
        "etapas": [
          {
            "nombre": "1. Demanda",
            "queHacer": "Precisar acto de comercio, relación jurídica, prestaciones, hechos y documentos.",
            "despues": "Revisar admisión o prevención y posteriormente emplazamiento.",
            "control": "Competencia, vía, prescripción, documentos y legitimación.",
            "fundamento": "Código de Comercio, arts. 1377-1390."
          },
          {
            "nombre": "2. Emplazamiento y contestación",
            "queHacer": "Controlar notificación y analizar excepciones, defensas y, en su caso, reconvención.",
            "despues": "Continuar a pruebas y audiencia conforme al procedimiento.",
            "control": "Términos y hechos controvertidos."
          },
          {
            "nombre": "3. Pruebas",
            "queHacer": "Ofrecer y preparar pruebas vinculadas a cada hecho controvertido.",
            "despues": "Desahogar las pruebas admitidas y cerrar la etapa correspondiente.",
            "control": "Admisión, desahogo y constancias."
          },
          {
            "nombre": "4. Alegatos y sentencia",
            "queHacer": "Relacionar prueba y derecho con cada prestación.",
            "despues": "Analizar sentencia, recursos y, si queda firme, ejecución.",
            "control": "Notificación, congruencia y puntos resolutivos."
          },
          {
            "nombre": "5. Ejecución",
            "queHacer": "Promover y controlar las actuaciones necesarias para obtener el cumplimiento.",
            "despues": "Cerrar expediente cuando se cumpla materialmente la resolución.",
            "control": "Pago, bienes, liquidación y constancias de cumplimiento."
          }
        ],
        "acuerdo": "El convenio puede evitar la continuación del litigio cuando las partes lo formalicen y sea jurídicamente procedente.",
        "sentencia": "La sentencia firme da paso a la ejecución conforme al régimen mercantil aplicable.",
        "fundamentos": [
          "Código de Comercio art. 1055 y arts. 1377-1390."
        ],
        "kpis": [
          "Asuntos activos",
          "Cumplimiento de términos",
          "Resultados por etapa"
        ],
        "fuentes": [
          "Código de Comercio, texto aportado.",
          "Ley General de Títulos y Operaciones de Crédito.",
          "Manual de Litigación Mercantil — edición 2026."
        ]
      },
      {
        "id": "mercantil-oral",
        "tipo": "Oral mercantil",
        "nombre": "Juicio oral mercantil",
        "objetivo": "Llevar una contienda mercantil sujeta al juicio oral, desde demanda y contestación hasta audiencias y sentencia.",
        "inicio": "Demanda escrita",
        "constructorId": "",
        "icono": "🎙️",
        "etapas": [
          {
            "nombre": "1. Demanda",
            "queHacer": "Presentar demanda escrita con requisitos, documentos y pruebas.",
            "despues": "El juez admite, previene o desecha; si admite, ordena emplazamiento.",
            "control": "Requisitos, anexos y plazo.",
            "fundamento": "Código de Comercio arts. 1390 Bis 11-14."
          },
          {
            "nombre": "2. Contestación",
            "queHacer": "Revisar contestación, reconvención y excepciones.",
            "despues": "Se desahoga vista y se prepara audiencia preliminar.",
            "control": "Términos, hechos controvertidos y pruebas.",
            "fundamento": "Código de Comercio arts. 1390 Bis 16-20."
          },
          {
            "nombre": "3. Audiencia preliminar",
            "queHacer": "Depurar procedimiento, resolver excepciones procesales, fijar hechos y acuerdos probatorios y procurar convenio.",
            "despues": "Si no concluye por convenio, se prepara audiencia de juicio.",
            "control": "Acuerdos, hechos no controvertidos y pruebas admitidas.",
            "fundamento": "Código de Comercio arts. 1390 Bis 32-37."
          },
          {
            "nombre": "4. Audiencia de juicio",
            "queHacer": "Desahogar pruebas y formular alegatos orales.",
            "despues": "El juez emite la resolución en los términos de la vía.",
            "control": "Registro audiovisual, pruebas y alegatos.",
            "fundamento": "Código de Comercio arts. 1390 Bis 38-50."
          },
          {
            "nombre": "5. Sentencia y ejecución",
            "queHacer": "Analizar sentencia y cumplimiento.",
            "despues": "Controlar ejecución de convenios o sentencia firme.",
            "control": "Notificación, firmeza y ejecución.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Orales activos",
          "Tiempo demanda-audiencia preliminar",
          "Tiempo audiencia-sentencia",
          "Convenios en audiencia"
        ],
        "fuentes": [
          "Código de Comercio arts. 1390 Bis-1390 Bis 50."
        ]
      },
      {
        "id": "mercantil-ejecutivo-oral",
        "tipo": "Ejecutivo mercantil oral",
        "nombre": "Juicio ejecutivo mercantil oral",
        "objetivo": "Combinar la exigibilidad de un título ejecutivo con la estructura oral prevista por el Código de Comercio.",
        "inicio": "Demanda ejecutiva",
        "constructorId": "MERC-EJE-001",
        "icono": "⚡",
        "etapas": [
          {
            "nombre": "1. Título y demanda",
            "queHacer": "Verificar documento base y requisitos de la vía; presentar demanda.",
            "despues": "Se dicta auto con efectos de requerimiento y embargo cuando proceda.",
            "control": "Título, vencimiento, legitimación y bienes.",
            "fundamento": "Código de Comercio arts. 1390 Ter y 1390 Ter 5."
          },
          {
            "nombre": "2. Requerimiento, embargo y emplazamiento",
            "queHacer": "Controlar diligencia y documentación del embargo.",
            "despues": "El demandado contesta dentro del plazo legal.",
            "control": "Acta, bienes y notificación.",
            "fundamento": "Código de Comercio arts. 1390 Ter 5-7."
          },
          {
            "nombre": "3. Contestación y audiencia preliminar",
            "queHacer": "Analizar excepciones y pruebas; preparar audiencia.",
            "despues": "Se depura el procedimiento y se fijan pruebas.",
            "control": "Excepciones, acuerdos y pruebas.",
            "fundamento": "Código de Comercio arts. 1390 Ter 6-11."
          },
          {
            "nombre": "4. Audiencia de juicio",
            "queHacer": "Desahogar pruebas y alegatos conforme a reglas orales.",
            "despues": "Se dicta sentencia.",
            "control": "Registro, pruebas y alegatos.",
            "fundamento": "Código de Comercio arts. 1390 Ter 12-14."
          },
          {
            "nombre": "5. Ejecución",
            "queHacer": "Controlar pago, remate o aplicación del embargo según sentencia.",
            "despues": "Cerrar con satisfacción del crédito.",
            "control": "Liquidación, remate y pago.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Ejecutivos orales activos",
          "Monto recuperado",
          "Embargos",
          "Tiempo requerimiento-cobro"
        ],
        "fuentes": [
          "Código de Comercio arts. 1390 Ter-1390 Ter 15."
        ]
      },
      {
        "id": "mercantil-especial",
        "tipo": "Especial mercantil",
        "nombre": "Juicios mercantiles especiales",
        "objetivo": "Identificar si una ley mercantil establece una tramitación especial y evitar encauzar el asunto indebidamente por ordinario u oral.",
        "inicio": "Promoción conforme a ley especial",
        "constructorId": "",
        "icono": "📚",
        "etapas": [
          {
            "nombre": "1. Identificación de ley especial",
            "queHacer": "Determinar si la acción tiene procedimiento especial en el Código de Comercio o en otra ley mercantil.",
            "despues": "Aplicar primero las reglas especiales y supletoriamente las generales que correspondan.",
            "control": "Ley especial, acción, competencia y requisitos.",
            "fundamento": "Código de Comercio art. 1055."
          },
          {
            "nombre": "2. Inicio",
            "queHacer": "Presentar la promoción inicial conforme al régimen especial.",
            "despues": "Vigilar admisión, emplazamiento y actos específicos.",
            "control": "Requisitos especiales y términos.",
            "fundamento": "Código de Comercio y ley especial."
          },
          {
            "nombre": "3. Tramitación",
            "queHacer": "Cumplir las etapas propias del procedimiento.",
            "despues": "Preparar resolución y medios de defensa previstos.",
            "control": "Actuaciones, pruebas y audiencias.",
            "fundamento": "Ley especial aplicable."
          },
          {
            "nombre": "4. Resolución y ejecución",
            "queHacer": "Analizar resolución y ejecutar cuando corresponda.",
            "despues": "Cerrar con cumplimiento o impugnación.",
            "control": "Firmeza y ejecución.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Especiales mercantiles activos",
          "Tiempo por tipo",
          "Incidencias de improcedencia de vía"
        ],
        "fuentes": [
          "Código de Comercio art. 1055; la ley mercantil especial aplicable determina la vía y reglas específicas."
        ]
      }
    ]
  },
  {
    "id": "laboral",
    "orden": 5,
    "icono": "👥",
    "nombre": "Laboral",
    "fuentes": [
      "Ley Federal del Trabajo, texto vigente consultado en archivo LFT.pdf, última reforma DOF 14-05-2026.",
      "Manual de Litigación Laboral — edición 2026."
    ],
    "procedimientos": [
      {
        "id": "laboral-ordinario",
        "tipo": "Procedimiento ordinario laboral",
        "icono": "👥",
        "constructorId": "LAB-JUI-001",
        "nombre": "Procedimiento ordinario laboral individual",
        "objetivo": "Llevar un conflicto individual desde la conciliación prejudicial y demanda hasta sentencia y ejecución.",
        "inicio": "Demanda, después de la conciliación prejudicial cuando sea exigible",
        "etapas": [
          {
            "nombre": "1. Conciliación prejudicial",
            "queHacer": "Presentar la solicitud de conciliación cuando sea requisito y preparar una posición de negociación.",
            "despues": "Si no hay convenio, obtener la constancia correspondiente y preparar la demanda; si hay convenio, controlar su cumplimiento.",
            "control": "Solicitud, citas, constancia de no conciliación o convenio.",
            "fundamento": "LFT arts. 684-B a 684-E."
          },
          {
            "nombre": "2. Demanda",
            "queHacer": "Presentar demanda con hechos, prestaciones, pruebas y datos necesarios para el emplazamiento.",
            "despues": "Revisar admisión y atender prevenciones; después controlar el emplazamiento.",
            "control": "Plazos, prescripción, competencia, prestaciones y documentos.",
            "fundamento": "LFT arts. 872-873-K."
          },
          {
            "nombre": "3. Contestación y réplica/contrarréplica",
            "queHacer": "Analizar defensas, excepciones y pruebas de la contraparte y preparar la respuesta procesal que corresponda.",
            "despues": "El tribunal convoca a audiencia preliminar.",
            "control": "Hechos admitidos, controversias y términos.",
            "fundamento": "LFT arts. 873-B y 873-C."
          },
          {
            "nombre": "4. Audiencia preliminar",
            "queHacer": "Participar en depuración, fijación de hechos controvertidos y admisión de pruebas.",
            "despues": "Preparar el desahogo de las pruebas admitidas para la audiencia de juicio.",
            "control": "Pruebas admitidas, hechos no controvertidos y acuerdos.",
            "fundamento": "LFT arts. 873-E a 873-G."
          },
          {
            "nombre": "5. Audiencia de juicio",
            "queHacer": "Desahogar pruebas, formular alegatos y sostener la teoría del caso con base en lo producido en audiencia.",
            "despues": "El tribunal emite la resolución conforme al procedimiento.",
            "control": "Acta, pruebas efectivamente desahogadas y alegatos.",
            "fundamento": "LFT arts. 873-H a 873-J."
          },
          {
            "nombre": "6. Sentencia",
            "queHacer": "Analizar condenas, absoluciones, prestaciones y efectos.",
            "despues": "Si procede medio de impugnación, controlar su plazo; si queda firme, pasar a ejecución.",
            "control": "Notificación, cálculo de condenas y firmeza.",
            "resultado": "Sentencia"
          },
          {
            "nombre": "7. Ejecución",
            "queHacer": "Solicitar cumplimiento, pago, requerimiento y medidas de ejecución cuando exista incumplimiento.",
            "despues": "Cerrar hasta acreditar cumplimiento material.",
            "control": "Liquidación, requerimientos, embargo y pago.",
            "fundamento": "LFT arts. 939-966."
          }
        ],
        "acuerdo": "El convenio puede celebrarse en conciliación o durante el proceso en los términos legales; debe quedar documentado y controlarse su cumplimiento.",
        "sentencia": "La sentencia firme se lleva a ejecución hasta el pago o cumplimiento de las obligaciones reconocidas.",
        "fundamentos": [
          "LFT arts. 870-873 y siguientes; conciliación prejudicial arts. 684-A a 684-E."
        ],
        "kpis": [
          "Cumplimiento de conciliación",
          "Términos laborales",
          "Tiempo conciliación-demanda",
          "Casos ganados/convenidos"
        ],
        "fuentes": [
          "Ley Federal del Trabajo, texto vigente consultado en archivo LFT.pdf, última reforma DOF 14-05-2026.",
          "Manual de Litigación Laboral — edición 2026."
        ]
      },
      {
        "id": "laboral-especial",
        "tipo": "Procedimiento especial laboral",
        "nombre": "Procedimientos especiales laborales",
        "objetivo": "Atender conflictos que la LFT remite a procedimiento especial, evitando llevarlos por ordinario cuando existe una tramitación específica.",
        "inicio": "Demanda o promoción especial",
        "constructorId": "",
        "icono": "👷",
        "etapas": [
          {
            "nombre": "1. Clasificación",
            "queHacer": "Determinar si la pretensión está comprendida en el procedimiento especial.",
            "despues": "Presentar demanda con los requisitos específicos.",
            "control": "Materia, legitimación y supuesto legal.",
            "fundamento": "LFT arts. 892 y siguientes."
          },
          {
            "nombre": "2. Inicio y emplazamiento",
            "queHacer": "Vigilar admisión y emplazamiento conforme a la modalidad.",
            "despues": "Seguir las actuaciones especiales previstas.",
            "control": "Términos y constancias.",
            "fundamento": "LFT arts. 893-897 y correlativos."
          },
          {
            "nombre": "3. Pruebas y audiencia",
            "queHacer": "Preparar y desahogar las pruebas conforme a la vía.",
            "despues": "El Tribunal emite la resolución correspondiente.",
            "control": "Pruebas, peritos y audiencia.",
            "fundamento": "LFT procedimiento especial aplicable."
          },
          {
            "nombre": "4. Resolución",
            "queHacer": "Analizar sentencia y medios de impugnación.",
            "despues": "Controlar ejecución.",
            "control": "Notificación, recurso y firmeza.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Especiales activos",
          "Tiempo por tipo",
          "Cumplimiento de audiencias"
        ],
        "fuentes": [
          "LFT arts. 892-897 y disposiciones especiales según el supuesto."
        ]
      },
      {
        "id": "laboral-seguridad-social",
        "tipo": "Conflicto individual de seguridad social",
        "nombre": "Conflicto individual de seguridad social",
        "objetivo": "Conducir reclamaciones de prestaciones de seguridad social que la LFT ubica en su régimen especial.",
        "inicio": "Demanda laboral especial",
        "constructorId": "",
        "icono": "🩺",
        "etapas": [
          {
            "nombre": "1. Diagnóstico",
            "queHacer": "Determinar prestación, institución obligada, semanas, dictámenes y documentos necesarios.",
            "despues": "Preparar demanda y documentación médica/laboral/administrativa.",
            "control": "Vigencia, aseguramiento, semanas y acto reclamado.",
            "fundamento": "LFT arts. 899-A y siguientes."
          },
          {
            "nombre": "2. Demanda y contestación",
            "queHacer": "Presentar demanda y analizar defensa del organismo.",
            "despues": "Preparar pruebas y audiencia.",
            "control": "Expediente administrativo, historia laboral y pruebas.",
            "fundamento": "LFT régimen de conflictos individuales de seguridad social."
          },
          {
            "nombre": "3. Pruebas",
            "queHacer": "Acreditar hechos laborales y médicos con documentos, informes y periciales cuando procedan.",
            "despues": "Concluir instrucción conforme al procedimiento.",
            "control": "Dictámenes, semanas, documentos y pruebas.",
            "fundamento": "LFT régimen especial."
          },
          {
            "nombre": "4. Sentencia y cumplimiento",
            "queHacer": "Analizar reconocimiento de prestación y obligaciones del organismo.",
            "despues": "Controlar cumplimiento y, si procede, impugnación.",
            "control": "Sentencia, cálculo y cumplimiento.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Conflictos de seguridad social",
          "Tiempo demanda-sentencia",
          "Prestaciones reconocidas",
          "Cumplimiento de sentencias"
        ],
        "fuentes": [
          "LFT arts. 899-A y siguientes; Ley del Seguro Social y legislación de seguridad social aplicable."
        ]
      },
      {
        "id": "laboral-colectivo-economico",
        "tipo": "Conflicto colectivo de naturaleza económica",
        "nombre": "Conflictos colectivos de naturaleza económica",
        "objetivo": "Llevar la controversia colectiva cuyo objeto sea modificar o implantar condiciones de trabajo, o suspender o terminar relaciones colectivas.",
        "inicio": "Demanda de conflicto colectivo económico",
        "constructorId": "",
        "icono": "🏭",
        "etapas": [
          {
            "nombre": "1. Demanda",
            "queHacer": "Precisar hechos, causas, pretensiones y documentación económica.",
            "despues": "El Tribunal cita a audiencia y procura conciliación.",
            "control": "Personalidad, situación económica y pruebas.",
            "fundamento": "LFT arts. 900-905."
          },
          {
            "nombre": "2. Audiencia y conciliación",
            "queHacer": "Presentar la posición económica y jurídica y valorar un arreglo.",
            "despues": "Si hay convenio se termina; si no, se continúa con pruebas.",
            "control": "Propuesta, convenio o puntos controvertidos.",
            "fundamento": "LFT arts. 901-906."
          },
          {
            "nombre": "3. Pruebas y pericial",
            "queHacer": "Preparar información económica, relación de trabajadores y dictámenes.",
            "despues": "El Tribunal recibe y valora la prueba.",
            "control": "Pericial, nóminas, estados financieros y documentos.",
            "fundamento": "LFT arts. 903-918."
          },
          {
            "nombre": "4. Resolución",
            "queHacer": "Analizar la resolución y sus efectos sobre condiciones colectivas.",
            "despues": "Controlar cumplimiento o medios de defensa.",
            "control": "Puntos resolutivos, condiciones y fechas.",
            "fundamento": "LFT arts. 916-919."
          }
        ],
        "kpis": [
          "Conflictos económicos activos",
          "Tiempo de negociación",
          "Convenios logrados",
          "Impacto económico"
        ],
        "fuentes": [
          "LFT arts. 900-919."
        ]
      },
      {
        "id": "laboral-huelga",
        "tipo": "Procedimiento de huelga",
        "nombre": "Procedimiento de huelga",
        "objetivo": "Conducir el emplazamiento, conciliación, estallamiento y calificación de la huelga conforme a la LFT.",
        "inicio": "Pliego de peticiones con emplazamiento",
        "constructorId": "",
        "icono": "✊",
        "etapas": [
          {
            "nombre": "1. Pliego y emplazamiento",
            "queHacer": "Verificar objeto, requisitos, fecha y hora de suspensión y competencia; presentar el escrito.",
            "despues": "El Tribunal notifica al patrón y se activa la secuencia legal.",
            "control": "Pliego, objeto, fecha de estallamiento y notificaciones.",
            "fundamento": "LFT arts. 920-923."
          },
          {
            "nombre": "2. Contestación y audiencia",
            "queHacer": "Controlar manifestaciones patronales y la audiencia previa al estallamiento.",
            "despues": "Determinar si procede la suspensión y continuar la ruta.",
            "control": "Notificación, objeciones y acuerdos.",
            "fundamento": "LFT arts. 924-930."
          },
          {
            "nombre": "3. Estallamiento",
            "queHacer": "Coordinar el cumplimiento de los requisitos y servicios indispensables.",
            "despues": "El estado de huelga queda sujeto a las reglas de calificación y continuidad.",
            "control": "Acta, suspensión y servicios indispensables.",
            "fundamento": "LFT arts. 930-936."
          },
          {
            "nombre": "4. Calificación o terminación",
            "queHacer": "Atender inexistencia o ilicitud cuando se planteen y analizar efectos.",
            "despues": "Si el conflicto se somete al Tribunal, se sigue el procedimiento correspondiente.",
            "control": "Resolución de inexistencia/ilicitud, convenio o sometimiento.",
            "fundamento": "LFT arts. 932-938."
          },
          {
            "nombre": "5. Terminación",
            "queHacer": "Documentar convenio, allanamiento, resolución o causa legal de terminación.",
            "despues": "Controlar reanudación y obligaciones económicas.",
            "control": "Convenio, salarios, cumplimiento.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Huelgas activas",
          "Cumplimiento de plazos",
          "Convenios antes del estallamiento",
          "Duración de huelgas"
        ],
        "fuentes": [
          "LFT arts. 920-938; objetivos y requisitos de huelga arts. 450-451."
        ]
      },
      {
        "id": "laboral-paraprocesal",
        "tipo": "Paraprocesal o voluntario",
        "nombre": "Procedimientos paraprocesales o voluntarios",
        "objetivo": "Atender actuaciones laborales en las que no existe controversia jurisdiccional contenciosa, conforme al régimen de la LFT.",
        "inicio": "Solicitud paraprocesal",
        "constructorId": "",
        "icono": "📑",
        "etapas": [
          {
            "nombre": "1. Identificar el acto",
            "queHacer": "Determinar que la petición puede tramitarse como paraprocesal/voluntaria y precisar el efecto jurídico buscado.",
            "despues": "Presentar solicitud con documentos.",
            "control": "Acto, legitimación y ausencia de controversia.",
            "fundamento": "LFT régimen paraprocesal."
          },
          {
            "nombre": "2. Presentación",
            "queHacer": "Ingresar la solicitud y atender prevención o requerimiento.",
            "despues": "Esperar acuerdo y diligencia correspondiente.",
            "control": "Acuerdo, documentos y términos.",
            "fundamento": ""
          },
          {
            "nombre": "3. Diligencia o resolución",
            "queHacer": "Comparecer y documentar la actuación.",
            "despues": "Obtener constancia y cerrar o, si surge controversia, evaluar la vía contenciosa.",
            "control": "Acta y constancia final.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Paraprocesales activos",
          "Tiempo solicitud-resolución",
          "Actuaciones concluidas"
        ],
        "fuentes": [
          "LFT, Título relativo a procedimientos paraprocesales o voluntarios y disposiciones aplicables al acto solicitado."
        ]
      }
    ]
  },
  {
    "id": "penal",
    "orden": 6,
    "icono": "⚔️",
    "nombre": "Penal",
    "fuentes": [
      "Código Nacional de Procedimientos Penales, texto aportado.",
      "Manual de Litigación Penal — edición 2026."
    ],
    "procedimientos": [
      {
        "id": "penal-acusatorio",
        "tipo": "Proceso penal acusatorio",
        "icono": "⚔️",
        "constructorId": "PEN-INI-001",
        "nombre": "Del inicio de la investigación al juicio o salida alterna",
        "objetivo": "Llevar la defensa o asesoría de víctima desde denuncia/querella e investigación hasta salida alterna, procedimiento abreviado, juicio y sentencia.",
        "inicio": "Denuncia o querella / acto de investigación que origine la carpeta",
        "etapas": [
          {
            "nombre": "1. Inicio de investigación",
            "queHacer": "Identificar calidad procesal, carpeta, delito, hechos, riesgos y evidencia; preservar derechos y datos relevantes.",
            "despues": "La investigación continúa y, si se judicializa, debe prepararse la audiencia inicial.",
            "control": "Carpeta, registros, legalidad de actos, evidencia y medidas urgentes."
          },
          {
            "nombre": "2. Judicialización y audiencia inicial",
            "queHacer": "Preparar control de detención cuando exista, formulación de imputación, declaración y debate sobre medidas cautelares.",
            "despues": "El juez resuelve vinculación o no vinculación y las medidas correspondientes.",
            "control": "Legalidad de detención, imputación, datos de prueba y riesgos procesales."
          },
          {
            "nombre": "3. Vinculación y medidas",
            "queHacer": "Construir la teoría del caso y controvertir o sostener el estándar de vinculación; definir estrategia cautelar.",
            "despues": "Si continúa el proceso, se abre la etapa de investigación complementaria.",
            "control": "Resolución de vinculación, medidas y plazo de investigación."
          },
          {
            "nombre": "4. Investigación complementaria y salidas alternas",
            "queHacer": "Completar actos de investigación, preservar evidencia y evaluar acuerdo reparatorio, suspensión condicional o procedimiento abreviado cuando legalmente procedan.",
            "despues": "Si no hay salida alterna, el asunto avanza a acusación y etapa intermedia.",
            "control": "Plazos de investigación, descubrimiento y condiciones de salida."
          },
          {
            "nombre": "5. Etapa intermedia",
            "queHacer": "Analizar acusación, descubrir/contradecir pruebas, plantear acuerdos probatorios y exclusiones.",
            "despues": "El auto de apertura define qué llegará al juicio.",
            "control": "Prueba admitida, exclusiones, acuerdos y auto de apertura."
          },
          {
            "nombre": "6. Juicio oral",
            "queHacer": "Ejecutar teoría del caso mediante alegatos de apertura, interrogatorios, contrainterrogatorios, objeciones y clausura.",
            "despues": "El tribunal emite sentencia conforme a lo probado.",
            "control": "Contradicción, inmediación, autenticidad y suficiencia probatoria."
          },
          {
            "nombre": "7. Sentencia",
            "queHacer": "Analizar absolución o condena, reparación del daño y fundamentos de la decisión.",
            "despues": "Evaluar medios de impugnación y, si queda firme, ejecución penal.",
            "control": "Notificación, plazos de recurso, reparación y efectos."
          },
          {
            "nombre": "8. Recursos y ejecución",
            "queHacer": "Interponer o contestar el medio procedente y, en su caso, vigilar la ejecución de la sentencia.",
            "despues": "El expediente pasa a cierre o continúa por la vía de ejecución correspondiente.",
            "control": "Resolución, recurso, firmeza y cumplimiento."
          }
        ],
        "acuerdo": "Las salidas alternas y el procedimiento abreviado tienen requisitos propios; deben evaluarse antes de llegar al juicio cuando legalmente procedan.",
        "sentencia": "Si no existe salida alterna, la sentencia es el punto de decisión y puede abrir la etapa de impugnación y ejecución.",
        "fundamentos": [
          "CNPP arts. 211 y siguientes; etapa de investigación, intermedia y juicio."
        ],
        "kpis": [
          "Carpetas activas",
          "Tiempo investigación",
          "Audiencias cumplidas",
          "Resultados por salida"
        ],
        "fuentes": [
          "Código Nacional de Procedimientos Penales, texto aportado.",
          "Manual de Litigación Penal — edición 2026."
        ]
      },
      {
        "id": "penal-acuerdo-reparatorio",
        "tipo": "Solución alterna",
        "nombre": "Acuerdo reparatorio",
        "objetivo": "Determinar si el asunto puede resolverse mediante acuerdo reparatorio y llevarlo hasta aprobación, cumplimiento y efectos procesales.",
        "inicio": "Propuesta o solicitud de acuerdo",
        "constructorId": "",
        "icono": "🤝",
        "etapas": [
          {
            "nombre": "1. Procedencia",
            "queHacer": "Verificar que el caso sea susceptible de acuerdo reparatorio y que las partes tengan capacidad para convenir.",
            "despues": "Promover ante la autoridad competente y participar en el mecanismo.",
            "control": "Delito, oportunidad procesal y voluntad de las partes.",
            "fundamento": "CNPP arts. 183-190."
          },
          {
            "nombre": "2. Negociación",
            "queHacer": "Definir reparación, obligaciones, plazos y garantías.",
            "despues": "El acuerdo se somete a aprobación en los términos legales.",
            "control": "Monto, forma de reparación y consentimiento.",
            "fundamento": "CNPP arts. 186-188."
          },
          {
            "nombre": "3. Aprobación",
            "queHacer": "Verificar que el acuerdo sea aprobado por la autoridad competente.",
            "despues": "Se suspenden/terminan efectos procesales conforme al cumplimiento.",
            "control": "Resolución de aprobación y obligaciones.",
            "fundamento": "CNPP arts. 189-190."
          },
          {
            "nombre": "4. Cumplimiento",
            "queHacer": "Controlar pagos y obligaciones hasta su total cumplimiento.",
            "despues": "Concluido el cumplimiento, verificar efectos legales sobre la persecución penal.",
            "control": "Comprobantes y constancia de cumplimiento.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Acuerdos propuestos",
          "Acuerdos aprobados",
          "Cumplimiento de acuerdos",
          "Tiempo de cierre"
        ],
        "fuentes": [
          "CNPP arts. 183-190."
        ]
      },
      {
        "id": "penal-suspension-condicional",
        "tipo": "Solución alterna",
        "nombre": "Suspensión condicional del proceso",
        "objetivo": "Llevar la solicitud de suspensión condicional, plan de reparación y condiciones hasta su cumplimiento o reanudación.",
        "inicio": "Solicitud de suspensión",
        "constructorId": "",
        "icono": "⏸️",
        "etapas": [
          {
            "nombre": "1. Verificación de requisitos",
            "queHacer": "Analizar procedencia y oportunidad procesal.",
            "despues": "Presentar solicitud y plan de reparación.",
            "control": "Delito, etapa procesal y requisitos.",
            "fundamento": "CNPP arts. 191-196."
          },
          {
            "nombre": "2. Audiencia",
            "queHacer": "Someter el plan a audiencia y controvertir objeciones.",
            "despues": "El juez determina procedencia y condiciones.",
            "control": "Plan, condiciones y resolución.",
            "fundamento": "CNPP arts. 194-196."
          },
          {
            "nombre": "3. Cumplimiento",
            "queHacer": "Controlar periódicamente las condiciones y reparación.",
            "despues": "Si se cumple, solicitar los efectos de conclusión; si se incumple, atender revocación.",
            "control": "Fechas, pagos, prohibiciones y reportes.",
            "fundamento": "CNPP arts. 197-200."
          },
          {
            "nombre": "4. Conclusión o revocación",
            "queHacer": "Documentar cumplimiento o defender la posición ante una solicitud de revocación.",
            "despues": "Determinar si el proceso se extingue o continúa.",
            "control": "Resolución y constancias.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Suspensiones activas",
          "Cumplimiento de condiciones",
          "Revocaciones",
          "Cierres exitosos"
        ],
        "fuentes": [
          "CNPP arts. 191-200."
        ]
      },
      {
        "id": "penal-abreviado",
        "tipo": "Terminación anticipada",
        "nombre": "Procedimiento abreviado",
        "objetivo": "Conducir la terminación anticipada mediante reconocimiento y requisitos legales hasta sentencia.",
        "inicio": "Solicitud de procedimiento abreviado",
        "constructorId": "",
        "icono": "⚡",
        "etapas": [
          {
            "nombre": "1. Requisitos",
            "queHacer": "Verificar requisitos de procedencia, consentimiento y oportunidad.",
            "despues": "Preparar solicitud y posición de la víctima cuando corresponda.",
            "control": "Acusación, consentimiento y reparación.",
            "fundamento": "CNPP art. 201."
          },
          {
            "nombre": "2. Audiencia",
            "queHacer": "Comparecer y verificar que el juez controle los requisitos.",
            "despues": "Si se autoriza, se desarrolla la resolución abreviada.",
            "control": "Admisión de hechos, consentimiento y acuerdos.",
            "fundamento": "CNPP arts. 202-205."
          },
          {
            "nombre": "3. Sentencia",
            "queHacer": "Analizar sentencia y sus consecuencias.",
            "despues": "Controlar reparación, cumplimiento y recursos procedentes.",
            "control": "Sentencia, reparación y notificación.",
            "fundamento": "CNPP art. 206."
          },
          {
            "nombre": "4. Cumplimiento",
            "queHacer": "Vigilar obligaciones y efectos de la sentencia.",
            "despues": "Cerrar cuando se acredite cumplimiento.",
            "control": "Pago/reparación y constancias.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Abreviados solicitados",
          "Abreviados aprobados",
          "Tiempo acusación-sentencia",
          "Resultados de reparación"
        ],
        "fuentes": [
          "CNPP arts. 201-206."
        ]
      },
      {
        "id": "penal-accion-particular",
        "tipo": "Procedimiento especial",
        "nombre": "Acción penal por particulares",
        "objetivo": "Conducir el ejercicio de la acción penal por particulares en los supuestos y condiciones previstos por el CNPP.",
        "inicio": "Solicitud ante órgano jurisdiccional",
        "constructorId": "",
        "icono": "⚔️",
        "etapas": [
          {
            "nombre": "1. Verificar procedencia",
            "queHacer": "Determinar si el hecho y la legitimación permiten acción penal particular.",
            "despues": "Preparar solicitud con hechos, clasificación, pruebas y pretensiones.",
            "control": "Legitimación, delito y prueba inicial.",
            "fundamento": "CNPP arts. 426 y siguientes."
          },
          {
            "nombre": "2. Presentación y admisión",
            "queHacer": "Presentar ante el juez competente y atender control de requisitos.",
            "despues": "Si se admite, se emplaza/notifica a la persona imputada conforme al procedimiento.",
            "control": "Admisión, notificaciones y términos.",
            "fundamento": "CNPP régimen de acción penal particular."
          },
          {
            "nombre": "3. Audiencias y prueba",
            "queHacer": "Preparar la etapa procesal y pruebas conforme al CNPP.",
            "despues": "Continuar hacia salida alterna, abreviado o juicio cuando proceda.",
            "control": "Pruebas, audiencias y acuerdos.",
            "fundamento": "CNPP arts. 426 y siguientes."
          },
          {
            "nombre": "4. Resolución",
            "queHacer": "Analizar la salida procesal y sus efectos.",
            "despues": "Controlar cumplimiento o impugnación.",
            "control": "Sentencia/resolución y recursos.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Acciones particulares",
          "Admisiones",
          "Tiempo a audiencia",
          "Resultados"
        ],
        "fuentes": [
          "CNPP arts. 426 y siguientes."
        ]
      }
    ]
  },
  {
    "id": "administrativo",
    "orden": 7,
    "icono": "🏛️",
    "nombre": "Administrativo",
    "fuentes": [
      "Manual de Litigación — Derecho Administrativo, Fiscal y Responsabilidades | edición ampliada 2026.",
      "Ley del Procedimiento Administrativo del Estado de Jalisco y sus Municipios, texto aportado.",
      "Ley de Justicia Administrativa del Estado de Jalisco, versión vigente reportada en el manual.",
      "LFPA, LFPCA, CFF, LGRA y legislación especial federal cuando corresponda."
    ],
    "procedimientos": [
      {
        "id": "adm-procedimiento-jalisco",
        "tipo": "Procedimiento administrativo Jalisco",
        "nombre": "Procedimiento administrativo estatal o municipal en Jalisco",
        "objetivo": "Conducir el procedimiento administrativo ante autoridad estatal o municipal, desde inicio hasta resolución y medios de defensa.",
        "inicio": "Promoción de parte o inicio de oficio",
        "constructorId": "ADM-IMP-001",
        "icono": "🏛️",
        "etapas": [
          {
            "nombre": "1. Diagnóstico de competencia",
            "queHacer": "Identificar autoridad, acto, procedimiento especial y régimen aplicable.",
            "despues": "Determinar si el procedimiento inicia a petición o de oficio.",
            "control": "Competencia, legitimación, acto y plazo.",
            "fundamento": "Ley del Procedimiento Administrativo de Jalisco."
          },
          {
            "nombre": "2. Inicio y admisión",
            "queHacer": "Presentar promoción con requisitos y anexos o atender inicio de oficio.",
            "despues": "Vigilar admisión, prevención y notificación.",
            "control": "Acuerdo inicial, expediente y términos.",
            "fundamento": "Ley del Procedimiento Administrativo de Jalisco arts. 35 y siguientes."
          },
          {
            "nombre": "3. Pruebas y actuaciones",
            "queHacer": "Aportar pruebas y participar en las diligencias permitidas.",
            "despues": "La autoridad continúa instrucción hasta estar en posibilidad de resolver.",
            "control": "Pruebas, diligencias y constancias.",
            "fundamento": "Ley del Procedimiento Administrativo de Jalisco."
          },
          {
            "nombre": "4. Resolución",
            "queHacer": "Analizar legalidad, fundamentación, motivación y efectos.",
            "despues": "Determinar si procede recurso administrativo o juicio.",
            "control": "Notificación, plazo y medio de defensa.",
            "fundamento": "Ley del Procedimiento Administrativo de Jalisco art. 117 y correlativos."
          },
          {
            "nombre": "5. Recurso administrativo",
            "queHacer": "Cuando proceda, decidir entre revisión o inconformidad según el acto y régimen.",
            "despues": "Seguir la resolución del recurso o acudir al tribunal cuando corresponda.",
            "control": "Oportunidad, agravios y efectos.",
            "fundamento": "Ley del Procedimiento Administrativo de Jalisco arts. 134-144."
          }
        ],
        "kpis": [
          "Procedimientos administrativos activos",
          "Tiempo autoridad-resolución",
          "Recursos interpuestos",
          "Resoluciones favorables"
        ],
        "fuentes": [
          "Ley del Procedimiento Administrativo del Estado de Jalisco y sus Municipios, arts. 35 y siguientes; terminación art. 117; recurso de revisión arts. 134-141; recurso de inconformidad arts. 142-144."
        ]
      },
      {
        "id": "adm-juicio-jalisco",
        "tipo": "Juicio administrativo",
        "nombre": "Juicio ante el Tribunal de Justicia Administrativa de Jalisco",
        "objetivo": "Llevar el control jurisdiccional local del acto administrativo hasta sentencia y, en su caso, recurso y ejecución.",
        "inicio": "Demanda ante la jurisdicción administrativa local",
        "constructorId": "ADM-IMP-001",
        "icono": "⚖️",
        "etapas": [
          {
            "nombre": "1. Diagnóstico y demanda",
            "queHacer": "Identificar acto impugnable, autoridad, oportunidad, conceptos de impugnación y pretensión.",
            "despues": "Presentar demanda y solicitar suspensión/medidas cuando proceda.",
            "control": "Acto definitivo, notificación, plazo y competencia.",
            "fundamento": "Ley de Justicia Administrativa de Jalisco."
          },
          {
            "nombre": "2. Admisión y contestación",
            "queHacer": "Analizar auto y contestación de la autoridad.",
            "despues": "Preparar ampliación o respuesta cuando la ley lo permita.",
            "control": "Expediente administrativo, contestación y plazos.",
            "fundamento": "Ley de Justicia Administrativa de Jalisco."
          },
          {
            "nombre": "3. Pruebas y alegatos",
            "queHacer": "Relacionar ilegalidades con constancias del expediente administrativo y pruebas admisibles.",
            "despues": "Cerrar instrucción conforme al procedimiento.",
            "control": "Pruebas, expediente y alegatos.",
            "fundamento": "Ley de Justicia Administrativa de Jalisco."
          },
          {
            "nombre": "4. Sentencia",
            "queHacer": "Analizar nulidad, reconocimiento de derechos, efectos y condenas.",
            "despues": "Determinar recurso o amparo según procedencia.",
            "control": "Puntos resolutivos, notificación y efectos.",
            "fundamento": "Ley de Justicia Administrativa de Jalisco."
          },
          {
            "nombre": "5. Ejecución",
            "queHacer": "Vigilar cumplimiento material de la sentencia.",
            "despues": "Cerrar cuando la autoridad cumpla integralmente.",
            "control": "Actos de cumplimiento y plazos.",
            "fundamento": "Ley de Justicia Administrativa de Jalisco, régimen de ejecución."
          }
        ],
        "kpis": [
          "Juicios administrativos activos",
          "Cumplimiento de términos",
          "Suspensiones concedidas",
          "Sentencias favorables",
          "Ejecuciones pendientes"
        ],
        "fuentes": [
          "Ley de Justicia Administrativa del Estado de Jalisco, texto vigente; competencia, demanda, suspensión, sentencia, recursos y ejecución conforme al régimen aplicable."
        ]
      },
      {
        "id": "adm-federal-administrativo",
        "tipo": "Procedimiento administrativo federal",
        "nombre": "Procedimiento administrativo federal",
        "objetivo": "Conducir el procedimiento administrativo federal conforme a la LFPA cuando ésta resulte aplicable, sin confundirlo con el juicio contencioso federal.",
        "inicio": "Promoción ante autoridad federal o inicio de oficio",
        "constructorId": "",
        "icono": "🇲🇽",
        "etapas": [
          {
            "nombre": "1. Competencia y vía",
            "queHacer": "Determinar autoridad federal y si aplica LFPA o una ley especial.",
            "despues": "Presentar promoción o atender inicio de oficio.",
            "control": "Competencia, ley especial y plazo.",
            "fundamento": "LFPA."
          },
          {
            "nombre": "2. Instrucción",
            "queHacer": "Atender notificaciones, pruebas y diligencias.",
            "despues": "Esperar resolución.",
            "control": "Expediente y términos.",
            "fundamento": "LFPA."
          },
          {
            "nombre": "3. Resolución",
            "queHacer": "Revisar fundamentación, motivación y efectos.",
            "despues": "Determinar recurso o medio jurisdiccional procedente conforme a la materia.",
            "control": "Notificación, plazo y definitividad.",
            "fundamento": "LFPA."
          },
          {
            "nombre": "4. Impugnación",
            "queHacer": "Preparar el medio de defensa que corresponda; no asumir que siempre existe el mismo recurso.",
            "despues": "Continuar ante la autoridad o tribunal competente.",
            "control": "Acto, vía y término.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Procedimientos federales activos",
          "Tiempo de resolución",
          "Recursos",
          "Resultados"
        ],
        "fuentes": [
          "LFPA, texto vigente; disposiciones generales del procedimiento, pruebas, terminación y medios de defensa conforme al acto."
        ]
      }
    ]
  },
  {
    "id": "amparo",
    "orden": 8,
    "icono": "🛡️",
    "nombre": "Amparo",
    "fuentes": [
      "Ley de Amparo, texto vigente aportado, última reforma DOF 16-10-2025.",
      "Manual de Litigación de Amparo — edición 2026."
    ],
    "procedimientos": [
      {
        "id": "amparo-indirecto",
        "tipo": "Juicio de amparo indirecto",
        "icono": "🛡️",
        "constructorId": "AMP-IND-001",
        "nombre": "Amparo indirecto — demanda a sentencia",
        "objetivo": "Controlar un acto de autoridad mediante amparo indirecto, incluyendo admisión, suspensión, informe, pruebas y sentencia.",
        "inicio": "Presentación de demanda de amparo",
        "etapas": [
          {
            "nombre": "1. Demanda",
            "queHacer": "Precisar quejoso, autoridad, acto reclamado, antecedentes, conceptos de violación, pruebas y peticiones de suspensión cuando proceda.",
            "despues": "El órgano puede prevenir, admitir, desechar o requerir aclaraciones; revisar inmediatamente el acuerdo.",
            "control": "Plazo, acto reclamado, autoridades y conceptos de violación.",
            "fundamento": "Ley de Amparo, art. 108."
          },
          {
            "nombre": "2. Admisión y suspensión",
            "queHacer": "Atender prevención y litigar la suspensión provisional/definitiva cuando proceda.",
            "despues": "La autoridad rinde informe y se desarrollan las actuaciones del incidente y del juicio.",
            "control": "Notificaciones, efectos de suspensión, garantía y cumplimiento.",
            "fundamento": "Ley de Amparo, art. 128 y disposiciones correlativas."
          },
          {
            "nombre": "3. Informe y pruebas",
            "queHacer": "Analizar informe justificado, controvertir lo necesario y preparar las pruebas admisibles.",
            "despues": "Se celebra la audiencia constitucional cuando proceda.",
            "control": "Acto reclamado, existencia, causales de improcedencia y pruebas."
          },
          {
            "nombre": "4. Audiencia constitucional",
            "queHacer": "Sostener conceptos de violación y controvertir causales y argumentos de la autoridad.",
            "despues": "El órgano dicta sentencia concediendo, negando o sobreseyendo.",
            "control": "Constancias, pruebas y puntos debatidos."
          },
          {
            "nombre": "5. Sentencia",
            "queHacer": "Analizar efectos concretos de la protección o razones de negativa/sobreseimiento.",
            "despues": "Determinar si procede recurso de revisión u otro medio y controlar cumplimiento.",
            "control": "Notificación, plazo de impugnación y efectos."
          },
          {
            "nombre": "6. Recurso y cumplimiento",
            "queHacer": "Interponer o contestar el medio procedente y, si se concede el amparo, vigilar el cumplimiento de la ejecutoria.",
            "despues": "Cerrar hasta que la autoridad cumpla en los términos ordenados.",
            "control": "Ejecutoria, actos de cumplimiento y eventual exceso o defecto."
          }
        ],
        "acuerdo": "El amparo no se cierra por un simple convenio privado; debe analizarse la figura procesal aplicable y los efectos jurídicos del acto reclamado.",
        "sentencia": "La sentencia de amparo produce efectos específicos que deben traducirse en actos de cumplimiento verificables.",
        "kpis": [
          "Asuntos activos",
          "Cumplimiento de términos",
          "Resultados por etapa"
        ],
        "fuentes": [
          "Ley de Amparo, texto vigente aportado, última reforma DOF 16-10-2025.",
          "Manual de Litigación de Amparo — edición 2026."
        ]
      },
      {
        "id": "amparo-directo",
        "tipo": "Amparo directo",
        "icono": "🛡️",
        "constructorId": "AMP-DIR-001",
        "nombre": "Amparo directo contra sentencia definitiva",
        "objetivo": "Impugnar una sentencia definitiva, laudo o resolución que ponga fin al juicio cuando proceda el amparo directo.",
        "inicio": "Presentación de demanda de amparo directo ante la autoridad responsable",
        "etapas": [
          {
            "nombre": "1. Demanda",
            "queHacer": "Formular conceptos de violación y señalar la resolución reclamada y autoridad responsable.",
            "despues": "La autoridad responsable recibe la demanda, realiza las actuaciones de ley y remite al Tribunal Colegiado.",
            "control": "Oportunidad, sentencia reclamada y conceptos de violación.",
            "fundamento": "Ley de Amparo, art. 175."
          },
          {
            "nombre": "2. Trámite y turno",
            "queHacer": "Revisar admisión, prevención y turno al órgano colegiado.",
            "despues": "Atender el trámite del expediente hasta que quede listo para resolución.",
            "control": "Acuerdos, notificaciones y expediente remitido."
          },
          {
            "nombre": "3. Proyecto y resolución",
            "queHacer": "Analizar el proyecto y sostener los conceptos planteados en los términos procesales correspondientes.",
            "despues": "Se dicta sentencia de amparo y, en su caso, se ordena efecto a la autoridad responsable.",
            "control": "Sentido y efectos."
          },
          {
            "nombre": "4. Cumplimiento",
            "queHacer": "Vigilar que la autoridad responsable cumpla exactamente la ejecutoria.",
            "despues": "Cerrar una vez acreditado el cumplimiento.",
            "control": "Nuevo acto, efectos y cumplimiento."
          }
        ],
        "acuerdo": "La solución del litigio de origen puede afectar el interés procesal, pero debe analizarse su efecto en el juicio de amparo conforme a la Ley de Amparo.",
        "sentencia": "La sentencia debe analizarse por sus efectos y controlarse su cumplimiento ante el órgano competente.",
        "kpis": [
          "Asuntos activos",
          "Cumplimiento de términos",
          "Resultados por etapa"
        ],
        "fuentes": [
          "Ley de Amparo, texto vigente aportado, última reforma DOF 16-10-2025.",
          "Manual de Litigación de Amparo — edición 2026."
        ]
      },
      {
        "id": "amparo-recursos",
        "tipo": "Medios de impugnación",
        "nombre": "Recursos dentro del juicio de amparo",
        "objetivo": "Identificar y conducir el recurso procedente contra la resolución impugnable, sin confundirlo con una tercera vía de amparo.",
        "inicio": "Notificación de la resolución",
        "constructorId": "",
        "icono": "↩️",
        "etapas": [
          {
            "nombre": "1. Clasificar la resolución",
            "queHacer": "Determinar qué resolución se combate y qué recurso prevé la Ley de Amparo.",
            "despues": "Calcular el término y preparar agravios.",
            "control": "Resolución, notificación y oportunidad.",
            "fundamento": "Ley de Amparo, arts. 81-88 y disposiciones del recurso aplicable."
          },
          {
            "nombre": "2. Interposición",
            "queHacer": "Presentar el recurso ante la autoridad competente y cumplir requisitos.",
            "despues": "Atender trámite y traslado.",
            "control": "Fecha, agravios y anexos.",
            "fundamento": ""
          },
          {
            "nombre": "3. Resolución",
            "queHacer": "Analizar la decisión del órgano revisor.",
            "despues": "Determinar efectos, cumplimiento o siguiente medio constitucional si legalmente procede.",
            "control": "Resolución, efectos y firmeza.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Recursos de amparo",
          "Tiempo notificación-interposición",
          "Resoluciones confirmadas/revocadas"
        ],
        "fuentes": [
          "Ley de Amparo, Título de recursos; en especial arts. 81-88 para revisión, además de las reglas aplicables al recurso concreto."
        ]
      }
    ]
  },
  {
    "id": "agraria",
    "orden": 9,
    "icono": "🌾",
    "nombre": "Agraria",
    "fuentes": [
      "Ley Agraria, texto vigente aportado, última reforma DOF 14-11-2025.",
      "Ley Orgánica de los Tribunales Agrarios.",
      "Manual de Litigación Agraria — edición 2026."
    ],
    "procedimientos": [
      {
        "id": "agrario-juicio",
        "tipo": "Juicio agrario",
        "icono": "🌾",
        "constructorId": "AGR-DEM-001",
        "nombre": "Juicio agrario — de la demanda a la sentencia",
        "objetivo": "Llevar una controversia agraria ante el Tribunal Unitario Agrario desde la demanda hasta sentencia, convenio o ejecución.",
        "inicio": "Presentación de demanda ante el Tribunal Agrario competente",
        "etapas": [
          {
            "nombre": "1. Demanda",
            "queHacer": "Precisar núcleo, ejidatario, comunero, posesionario u otro sujeto, tierra o derecho controvertido, hechos, pretensiones y pruebas.",
            "despues": "El tribunal provee sobre admisión, prevención y emplazamiento.",
            "control": "Competencia territorial, legitimación, documentos agrarios y ubicación de la tierra.",
            "fundamento": "Ley Agraria, procedimiento jurisdiccional; Ley Orgánica de los Tribunales Agrarios, art. 18."
          },
          {
            "nombre": "2. Emplazamiento y contestación",
            "queHacer": "Verificar emplazamiento y analizar defensas, excepciones y documentos de la contraparte.",
            "despues": "Se prepara la audiencia del juicio y las pruebas.",
            "control": "Notificación, hechos controvertidos y documentos del núcleo."
          },
          {
            "nombre": "3. Audiencia",
            "queHacer": "Comparecer con pruebas, testigos, peritos y documentación; buscar conciliación cuando sea viable.",
            "despues": "Si hay convenio susceptible de aprobación, se documenta; si no, continúa el juicio hacia sentencia.",
            "control": "Acta, pruebas, acuerdos y puntos controvertidos.",
            "fundamento": "Ley Agraria, arts. 185 y correlativos."
          },
          {
            "nombre": "4. Pruebas y alegatos",
            "queHacer": "Acreditar posesión, derechos, actos de asamblea, límites, sucesión u objeto específico del litigio.",
            "despues": "El tribunal queda en estado de resolución.",
            "control": "Relación hecho-prueba y constancias registrales."
          },
          {
            "nombre": "5. Sentencia o convenio",
            "queHacer": "Analizar los efectos concretos sobre derechos agrarios, tierras y sujetos involucrados.",
            "despues": "Si procede revisión, controlar el término; si queda firme, pasar a cumplimiento.",
            "control": "Notificación, sentido, efectos y firmeza.",
            "resultado": "Sentencia o convenio"
          },
          {
            "nombre": "6. Revisión y ejecución",
            "queHacer": "Determinar si el caso encuadra en los supuestos del recurso de revisión y, si no o una vez resuelto, controlar ejecución.",
            "despues": "Cerrar cuando la resolución se cumpla materialmente y, cuando corresponda, se actualicen registros.",
            "control": "Término de revisión, cumplimiento y actuaciones ante RAN.",
            "fundamento": "Ley Agraria arts. 198-200; Ley Orgánica de los Tribunales Agrarios."
          }
        ],
        "acuerdo": "La conciliación puede ser una vía de solución dentro del litigio; el convenio debe quedar asentado y aprobado conforme a la ley.",
        "sentencia": "La sentencia agraria debe convertirse en actos concretos de restitución, reconocimiento, entrega, inscripción o cumplimiento según su contenido.",
        "fundamentos": [
          "Ley Agraria arts. 163-200; en especial 185 y 198-200."
        ],
        "kpis": [
          "Juicios agrarios activos",
          "Audiencias",
          "Convenios",
          "Sentencias",
          "Cumplimiento"
        ],
        "fuentes": [
          "Ley Agraria, texto vigente aportado, última reforma DOF 14-11-2025.",
          "Ley Orgánica de los Tribunales Agrarios.",
          "Manual de Litigación Agraria — edición 2026."
        ]
      },
      {
        "id": "agrario-revision",
        "tipo": "Recurso de revisión agraria",
        "nombre": "Recurso de revisión agraria",
        "objetivo": "Determinar si la sentencia del tribunal agrario encuadra en los supuestos de revisión y conducir el recurso ante el Tribunal Superior Agrario.",
        "inicio": "Notificación de sentencia",
        "constructorId": "",
        "icono": "↩️",
        "etapas": [
          {
            "nombre": "1. Verificar procedencia",
            "queHacer": "Comprobar que la sentencia trate límites, restitución de tierras ejidales o nulidad de resoluciones agrarias en los supuestos legales.",
            "despues": "Si procede, preparar agravios dentro del término.",
            "control": "Supuesto legal, sentencia y fecha de notificación.",
            "fundamento": "Ley Agraria art. 198."
          },
          {
            "nombre": "2. Interposición",
            "queHacer": "Presentar el recurso ante el tribunal que emitió la resolución dentro del plazo legal.",
            "despues": "El tribunal admite y da vista a las partes.",
            "control": "Plazo, agravios y constancias.",
            "fundamento": "Ley Agraria art. 199."
          },
          {
            "nombre": "3. Remisión y resolución",
            "queHacer": "Atender la vista y preparar argumentos ante el Tribunal Superior Agrario.",
            "despues": "El Tribunal Superior resuelve en definitiva conforme a la ley.",
            "control": "Expediente, agravios y vista.",
            "fundamento": "Ley Agraria art. 200."
          },
          {
            "nombre": "4. Amparo o cumplimiento",
            "queHacer": "Si procede amparo contra la sentencia definitiva, determinar vía constitucional; de lo contrario, controlar cumplimiento.",
            "despues": "Cerrar cuando exista resolución firme y cumplimiento.",
            "control": "Firmeza y ejecución.",
            "fundamento": "Ley Agraria art. 200."
          }
        ],
        "kpis": [
          "Revisiones interpuestas",
          "Tiempo interposición-resolución",
          "Sentencias confirmadas/revocadas"
        ],
        "fuentes": [
          "Ley Agraria arts. 198-200."
        ]
      }
    ]
  },
  {
    "id": "corporativo",
    "orden": 10,
    "icono": "💼",
    "nombre": "Corporativo",
    "fuentes": [
      "Manual de Litigación en Derecho Corporativo — México · Jalisco · edición ampliada 2026.",
      "Ley General de Sociedades Mercantiles.",
      "Código de Comercio y legislación mercantil aplicable."
    ],
    "procedimientos": [
      {
        "id": "corp-societario",
        "tipo": "Controversia societaria",
        "nombre": "Controversia societaria",
        "objetivo": "Conducir un conflicto sobre actos societarios, derechos de socios/accionistas o administración mediante la vía mercantil que corresponda.",
        "inicio": "Demanda o acción mercantil",
        "constructorId": "",
        "icono": "🏢",
        "etapas": [
          {
            "nombre": "1. Diagnóstico societario",
            "queHacer": "Determinar sociedad, órgano, acto, legitimación y remedio solicitado.",
            "despues": "Seleccionar la vía mercantil procedente.",
            "control": "Estatutos, actas, títulos, libros y legitimación.",
            "fundamento": "LGSM y Código de Comercio."
          },
          {
            "nombre": "2. Demanda y contestación",
            "queHacer": "Presentar acción y analizar defensa de sociedad/socios.",
            "despues": "Preparar pruebas corporativas y contables.",
            "control": "Actas, convocatorias, quórum y términos.",
            "fundamento": ""
          },
          {
            "nombre": "3. Pruebas",
            "queHacer": "Acreditar acuerdos, votaciones, administración, daños o derechos económicos.",
            "despues": "Pasar a audiencia/alegatos según la vía.",
            "control": "Libros, actas y pericial contable.",
            "fundamento": ""
          },
          {
            "nombre": "4. Resolución",
            "queHacer": "Analizar efectos sobre actos y órganos societarios.",
            "despues": "Determinar recurso y cumplimiento.",
            "control": "Sentencia, nulidad, restitución o condena.",
            "fundamento": ""
          },
          {
            "nombre": "5. Cumplimiento",
            "queHacer": "Materializar la resolución mediante actos corporativos y registros.",
            "despues": "Cerrar con evidencia documental.",
            "control": "Actas, inscripciones y pagos.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Litigios societarios",
          "Actos corporativos impugnados",
          "Tiempo resolución",
          "Impacto económico"
        ],
        "fuentes": [
          "LGSM; Código de Comercio art. 1055 y vía mercantil que corresponda según la acción."
        ]
      },
      {
        "id": "corp-disolucion-liquidacion",
        "tipo": "Régimen societario",
        "nombre": "Disolución y liquidación societaria con intervención jurídica",
        "objetivo": "Conducir jurídicamente una disolución/liquidación cuando exista conflicto o necesidad de formalización, distinguiendo el trámite corporativo de un litigio.",
        "inicio": "Acuerdo o causa de disolución",
        "constructorId": "",
        "icono": "🏢",
        "etapas": [
          {
            "nombre": "1. Causa de disolución",
            "queHacer": "Identificar causa legal/estatutaria y acuerdo corporativo.",
            "despues": "Formalizar acuerdo y designación de liquidador.",
            "control": "Acta, quórum y causa.",
            "fundamento": "LGSM régimen de disolución."
          },
          {
            "nombre": "2. Liquidación",
            "queHacer": "Integrar inventario, créditos, pasivos y activos.",
            "despues": "Atender obligaciones y realizar activos conforme a la ley.",
            "control": "Balance, acreedores y activos.",
            "fundamento": ""
          },
          {
            "nombre": "3. Cierre",
            "queHacer": "Preparar balance final y distribución.",
            "despues": "Formalizar aprobación y cancelaciones registrales.",
            "control": "Balance, aprobación y registros.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Sociedades en liquidación",
          "Tiempo disolución-liquidación",
          "Pasivos pendientes",
          "Cierres concluidos"
        ],
        "fuentes": [
          "LGSM, disposiciones sobre disolución y liquidación de sociedades; estatutos y Código de Comercio cuando corresponda."
        ]
      }
    ]
  },
  {
    "id": "propiedad-industrial",
    "orden": 11,
    "icono": "💡",
    "nombre": "Propiedad Intelectual",
    "fuentes": [
      "Manual de Litigación en Derechos de Autor y Propiedad Industrial — México 2026.",
      "LFPPI, texto vigente, última reforma DOF 03-04-2026."
    ],
    "procedimientos": [
      {
        "id": "pi-declaracion-admin",
        "tipo": "Declaración administrativa",
        "nombre": "Declaración administrativa ante IMPI",
        "objetivo": "Llevar procedimientos de nulidad, caducidad, cancelación o infracción administrativa ante IMPI hasta resolución y defensa posterior.",
        "inicio": "Solicitud de declaración administrativa o promoción por infracción",
        "constructorId": "PI-PRO-004",
        "icono": "💡",
        "etapas": [
          {
            "nombre": "1. Diagnóstico",
            "queHacer": "Identificar derecho, registro, conducta y tipo de declaración o infracción.",
            "despues": "Preparar solicitud y pruebas.",
            "control": "Registro, titularidad, fechas y causal.",
            "fundamento": "LFPPI."
          },
          {
            "nombre": "2. Solicitud y traslado",
            "queHacer": "Presentar solicitud y atender prevención; controlar notificación a contraparte.",
            "despues": "Analizar contestación.",
            "control": "Expediente, términos y documentos.",
            "fundamento": "LFPPI régimen de declaraciones administrativas."
          },
          {
            "nombre": "3. Pruebas y medidas",
            "queHacer": "Impulsar pruebas, inspecciones y medidas provisionales cuando procedan.",
            "despues": "Cerrar instrucción conforme al procedimiento.",
            "control": "Evidencia, inspección y medidas.",
            "fundamento": "LFPPI, disposiciones de investigación y medidas."
          },
          {
            "nombre": "4. Resolución",
            "queHacer": "Analizar nulidad, caducidad, cancelación, infracción o efectos.",
            "despues": "Determinar medio de defensa procedente.",
            "control": "Notificación, efectos y plazo.",
            "fundamento": "LFPPI."
          },
          {
            "nombre": "5. Impugnación",
            "queHacer": "Preparar la defensa jurisdiccional o constitucional que corresponda.",
            "despues": "Controlar resolución firme y cumplimiento.",
            "control": "Oportunidad, vía y efectos.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Procedimientos IMPI activos",
          "Tiempo IMPI-resolución",
          "Resoluciones favorables",
          "Medidas provisionales"
        ],
        "fuentes": [
          "LFPPI arts. 258-268 para nulidad/caducidad/cancelación de marcas y disposiciones de procedimientos administrativos; arts. 327 Bis y siguientes para el procedimiento especial de resolución obligatoria cuando corresponda."
        ]
      },
      {
        "id": "pi-oposicion",
        "tipo": "Oposición",
        "nombre": "Procedimiento de oposición en materia de marcas",
        "objetivo": "Participar en la oposición frente a una solicitud de registro, distinguiéndola de la posterior declaración administrativa de nulidad.",
        "inicio": "Publicación de solicitud de marca",
        "constructorId": "PI-MAR-001",
        "icono": "🔎",
        "etapas": [
          {
            "nombre": "1. Detectar publicación",
            "queHacer": "Identificar solicitud potencialmente conflictiva y fundamento de oposición.",
            "despues": "Presentar oposición dentro del plazo legal.",
            "control": "Fecha de publicación, expediente y signos comparables.",
            "fundamento": "LFPPI régimen de oposición."
          },
          {
            "nombre": "2. Oposición",
            "queHacer": "Presentar argumentos y pruebas admisibles.",
            "despues": "El solicitante y terceros participan conforme al procedimiento.",
            "control": "Plazo, pruebas y objeciones.",
            "fundamento": "LFPPI."
          },
          {
            "nombre": "3. Resolución",
            "queHacer": "Analizar la determinación del IMPI y sus efectos en el trámite registral.",
            "despues": "Si el problema persiste, evaluar declaración administrativa posterior.",
            "control": "Resolución y estrategia posterior.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Oposiciones presentadas",
          "Oposiciones favorables",
          "Tiempo publicación-resolución"
        ],
        "fuentes": [
          "LFPPI disposiciones de oposición y procedimiento de registro de marcas; la oposición no sustituye las acciones posteriores de nulidad, caducidad o cancelación."
        ]
      },
      {
        "id": "pi-resolucion-obligatoria",
        "tipo": "Procedimiento especial",
        "nombre": "Resolución obligatoria ante Comité Técnico",
        "objetivo": "Atender el procedimiento especial incorporado a la LFPPI para los supuestos en que el solicitante opte por este mecanismo.",
        "inicio": "Solicitud de resolución obligatoria",
        "constructorId": "",
        "icono": "🧪",
        "etapas": [
          {
            "nombre": "1. Verificar procedencia",
            "queHacer": "Determinar si el asunto está dentro del ámbito del mecanismo previsto.",
            "despues": "Presentar la solicitud conforme a los requisitos legales.",
            "control": "Materia, solicitud y oportunidad.",
            "fundamento": "LFPPI art. 327 Bis."
          },
          {
            "nombre": "2. Trámite ante Comité",
            "queHacer": "Atender requerimientos y participar en el procedimiento.",
            "despues": "Esperar resolución dentro del régimen especial.",
            "control": "Expediente, plazos y requerimientos.",
            "fundamento": "LFPPI arts. 327 Bis y siguientes."
          },
          {
            "nombre": "3. Resolución",
            "queHacer": "Analizar la resolución y sus efectos.",
            "despues": "Determinar actuación posterior conforme a la ley.",
            "control": "Resolución, efectos y oportunidad.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Solicitudes de resolución obligatoria",
          "Tiempo Comité-resolución",
          "Resoluciones emitidas"
        ],
        "fuentes": [
          "LFPPI arts. 327 Bis y siguientes."
        ]
      }
    ]
  },
  {
    "id": "derechos-autor",
    "orden": 12,
    "icono": "©️",
    "nombre": "Derechos de Autor",
    "fuentes": [
      "Manual de Litigación en Derechos de Autor y Propiedad Industrial — México 2026.",
      "LFDA, texto vigente, última reforma DOF 14-05-2026."
    ],
    "procedimientos": [
      {
        "id": "da-avenencia",
        "tipo": "Avenencia",
        "nombre": "Procedimiento de avenencia",
        "objetivo": "Buscar una solución acordada ante la autoridad en una controversia de derechos de autor, sin confundir avenencia con la acción judicial de fondo.",
        "inicio": "Solicitud de avenencia",
        "constructorId": "DA-PRO-001",
        "icono": "🤝",
        "etapas": [
          {
            "nombre": "1. Diagnóstico",
            "queHacer": "Acreditar titularidad, obra, conducta y facultad de negociación.",
            "despues": "Presentar solicitud y propuesta de solución.",
            "control": "Titularidad, licencias, evidencia y pretensión.",
            "fundamento": "LFDA régimen de avenencia."
          },
          {
            "nombre": "2. Citación y negociación",
            "queHacer": "Participar en reuniones/actuaciones y documentar propuestas.",
            "despues": "Si existe acuerdo, formalizarlo; si no, valorar otra vía.",
            "control": "Propuestas, términos y consentimiento.",
            "fundamento": "LFDA."
          },
          {
            "nombre": "3. Convenio o cierre",
            "queHacer": "Formalizar el acuerdo y controlar su cumplimiento.",
            "despues": "Si no hay acuerdo, determinar infracción administrativa o acción judicial.",
            "control": "Convenio, pagos, licencias y cese de uso.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Avenencias iniciadas",
          "Acuerdos logrados",
          "Tiempo de cierre",
          "Cumplimiento de convenios"
        ],
        "fuentes": [
          "LFDA, Título XI y disposiciones relativas a avenencia y arbitraje; texto vigente."
        ]
      },
      {
        "id": "da-infraccion-admin",
        "tipo": "Infracción administrativa",
        "nombre": "Infracción en materia de derechos de autor",
        "objetivo": "Llevar la denuncia/procedimiento administrativo por infracción ante la autoridad competente y controlar la impugnación de la resolución.",
        "inicio": "Denuncia o promoción administrativa",
        "constructorId": "DA-PRO-001",
        "icono": "⚖️",
        "etapas": [
          {
            "nombre": "1. Clasificación",
            "queHacer": "Determinar si la conducta encuadra en infracción en materia de derechos de autor o en materia de comercio.",
            "despues": "Presentar denuncia o promoción ante la autoridad competente.",
            "control": "Conducta, obra, titularidad y competencia.",
            "fundamento": "LFDA arts. 229-234."
          },
          {
            "nombre": "2. Investigación",
            "queHacer": "Aportar pruebas y atender actuaciones administrativas.",
            "despues": "La autoridad integra el expediente y resuelve.",
            "control": "Pruebas, inspecciones y notificaciones.",
            "fundamento": "LFDA y régimen administrativo aplicable."
          },
          {
            "nombre": "3. Resolución",
            "queHacer": "Analizar sanción, medidas y efectos.",
            "despues": "Determinar medio de defensa.",
            "control": "Notificación, sanción y plazo.",
            "fundamento": "LFDA arts. 230-234."
          },
          {
            "nombre": "4. Impugnación",
            "queHacer": "Interponer el medio de defensa procedente.",
            "despues": "Controlar resolución firme y cumplimiento.",
            "control": "Oportunidad y vía.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Infracciones activas",
          "Sanciones",
          "Tiempo procedimiento-resolución",
          "Impugnaciones"
        ],
        "fuentes": [
          "LFDA arts. 229-230 y disposiciones del procedimiento administrativo aplicable; infracciones en materia de comercio arts. 231-234 cuando correspondan."
        ]
      },
      {
        "id": "da-judicial",
        "tipo": "Controversia judicial",
        "nombre": "Controversia judicial por derechos de autor",
        "objetivo": "Llevar la controversia de derechos de autor ante el tribunal competente cuando la pretensión requiera tutela judicial.",
        "inicio": "Demanda o acción judicial",
        "constructorId": "DA-PRO-001",
        "icono": "⚔️",
        "etapas": [
          {
            "nombre": "1. Determinar competencia",
            "queHacer": "Identificar si la controversia corresponde a jurisdicción federal o, cuando sólo afecte intereses particulares, a tribunales locales conforme a LFDA.",
            "despues": "Elegir la vía procesal compatible con la competencia y pretensión.",
            "control": "Jurisdicción, titularidad y acción.",
            "fundamento": "LFDA art. 213."
          },
          {
            "nombre": "2. Demanda y contestación",
            "queHacer": "Presentar acción con obra, titularidad, uso, daño y pretensiones.",
            "despues": "Controlar emplazamiento y contestación.",
            "control": "Pruebas, contratos y evidencia digital.",
            "fundamento": "LFDA y legislación procesal aplicable."
          },
          {
            "nombre": "3. Pruebas",
            "queHacer": "Acreditar titularidad, infracción, autorización, daños y excepciones.",
            "despues": "Concluir instrucción y formular alegatos.",
            "control": "Periciales, documentales y evidencia digital.",
            "fundamento": "LFDA y ley procesal aplicable."
          },
          {
            "nombre": "4. Sentencia",
            "queHacer": "Analizar condenas, medidas y daños.",
            "despues": "Determinar recurso y ejecución.",
            "control": "Puntos resolutivos y firmeza.",
            "fundamento": ""
          },
          {
            "nombre": "5. Ejecución",
            "queHacer": "Controlar pago, cese, entrega o demás efectos.",
            "despues": "Cerrar con cumplimiento.",
            "control": "Liquidación y cumplimiento.",
            "fundamento": ""
          }
        ],
        "kpis": [
          "Juicios de autor activos",
          "Tiempo demanda-sentencia",
          "Convenios",
          "Recuperación de daños"
        ],
        "fuentes": [
          "LFDA art. 213 y disposiciones de acciones judiciales; Código de Comercio/Código Nacional de Procedimientos Civiles y Familiares o legislación procesal aplicable según competencia y vigencia."
        ]
      }
    ]
  }
];
