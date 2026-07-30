(() => {
  const $ = id => document.getElementById(id);
  const modelos = {
    laboral:{
      "despido-injustificado":{nombre:"Despido injustificado", preguntas:[
        ["despido_escrito","¿Existe aviso escrito de rescisión entregado personalmente o por conducto del Tribunal?"],
        ["contrato","¿Se cuenta con contrato, CFDI de nómina o documentación que acredite la relación?"],
        ["testigos","¿Existen testigos directos del despido o de las condiciones laborales?"],
        ["imss","¿Se cuenta con semanas cotizadas, alta/baja del IMSS u otra constancia?"],
        ["renuncia","¿Existe una renuncia o convenio firmado por la persona trabajadora?"],
        ["conciliacion","¿Ya se solicitó la conciliación prejudicial o existe excepción legal?"],
        ["plazo","¿La separación ocurrió dentro de los últimos dos meses?"],
      ]},
      "prestaciones":{nombre:"Pago de prestaciones devengadas", preguntas:[["contrato","¿Hay comprobantes de la relación laboral?"],["recibos","¿Existen recibos o CFDI para identificar lo pagado y lo pendiente?"],["jornada","¿Puede acreditarse jornada, salario y prestaciones pactadas?"],["conciliacion","¿Se agotó o está en trámite la conciliación prejudicial?"],["plazo","¿Se revisaron los plazos de prescripción de cada prestación?"]]}
    },
    familiar:{"alimentos":{nombre:"Pensión alimenticia",preguntas:[["parentesco","¿Se cuenta con actas que acrediten parentesco?"],["necesidades","¿Están documentadas las necesidades de los acreedores?"],["ingresos","¿Se conoce o puede investigarse la capacidad económica del deudor?"],["urgencia","¿Se requieren alimentos provisionales?"],["domicilio","¿Está identificado el domicilio del demandado?"]]}},
    civil:{"incumplimiento":{nombre:"Incumplimiento contractual",preguntas:[["contrato","¿Existe contrato o documento base?"],["obligacion","¿La obligación es clara, exigible y está vencida?"],["requerimiento","¿Existe requerimiento de cumplimiento?"],["pruebas","¿Se conservan comprobantes, comunicaciones y pagos?"],["prescripcion","¿Se verificó la prescripción de la acción?"]]}},
    mercantil:{"cobro":{nombre:"Cobro de título o adeudo mercantil",preguntas:[["documento","¿Existe título ejecutivo o documento que pruebe el adeudo?"],["vencimiento","¿La obligación está vencida y es exigible?"],["firma","¿La firma y cadena de transmisión son identificables?"],["domicilio","¿Se conoce domicilio para emplazamiento y embargo?"],["prescripcion","¿Se verificó la prescripción o caducidad aplicable?"]]}}
  };
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  function procedimientos(){const mat=$("ep-materia")?.value||"laboral", sel=$("ep-procedimiento"); if(!sel)return; sel.innerHTML=Object.entries(modelos[mat]).map(([id,m])=>`<option value="${id}">${esc(m.nombre)}</option>`).join(""); renderPreguntas();}
  function renderPreguntas(){const mat=$("ep-materia")?.value, id=$("ep-procedimiento")?.value, m=modelos[mat]?.[id], box=$("ep-preguntas");if(!m||!box)return;box.innerHTML=m.preguntas.map(([key,q])=>`<div class="ep-pregunta"><span>${esc(q)}</span><select data-ep="${key}"><option value="">Selecciona</option><option value="si">Sí</option><option value="no">No</option><option value="nd">No determinado</option></select></div>`).join("");}
  function respuesta(k){return document.querySelector(`[data-ep="${k}"]`)?.value||"";}
  function lista(titulo,items,clase=""){return `<section class="ep-bloque ${clase}"><h5>${titulo}</h5><ul>${items.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>`;}
  window.analizarEstrategiaProcesal=()=>{
    const mat=$("ep-materia").value,id=$("ep-procedimiento").value,m=modelos[mat][id], total=m.preguntas.length, contestadas=m.preguntas.filter(([k])=>respuesta(k)).length;
    if(contestadas<total){alert("Responde todas las preguntas para elaborar la estrategia.");return;}
    let riesgos=[],pruebas=[],acciones=[],fundamentos=[],nivel="MEDIO";
    if(mat==="laboral"&&id==="despido-injustificado"){
      if(respuesta("despido_escrito")==="no") acciones.push("Valorar la presunción y carga probatoria derivada de la falta de aviso de rescisión.");
      if(respuesta("contrato")!=="si") riesgos.push("Documentación limitada para acreditar salario, antigüedad o condiciones de trabajo."); else pruebas.push("Contrato, CFDI de nómina, recibos y estados de cuenta.");
      if(respuesta("testigos")==="si") pruebas.push("Testimoniales directas, con identificación precisa de los hechos que presenciaron.");
      if(respuesta("imss")==="si") pruebas.push("Constancias del IMSS, semanas cotizadas y movimientos afiliatorios.");
      if(respuesta("renuncia")==="si") riesgos.push("Existe renuncia o convenio que debe revisarse por autenticidad, alcance y ratificación.");
      if(respuesta("conciliacion")!=="si") acciones.push("Revisar si procede la conciliación prejudicial y obtener la constancia correspondiente antes de demandar.");
      if(respuesta("plazo")!=="si") {riesgos.push("Posible riesgo de prescripción de la acción por separación; verificar fechas inmediatamente."); nivel="ALTO";}
      fundamentos=["Constitución Política, artículo 123, apartado A.","Ley Federal del Trabajo: artículos 47, 48, 50, 784 y correlativos.","Ley Federal del Trabajo: reglas de conciliación prejudicial y prescripción aplicables al caso."];
      acciones.push("Definir pretensión principal y subsidiaria: reinstalación o indemnización, prestaciones devengadas y conceptos accesorios que procedan.","Cuantificar preliminarmente con la Calculadora Jurídica y contrastar el resultado con la documentación.");
    } else {
      m.preguntas.forEach(([k,q])=>{if(respuesta(k)!=="si") riesgos.push(`Pendiente o insuficiente: ${q}`);});
      pruebas=["Documentales públicas y privadas relacionadas con los hechos.","Comprobantes, comunicaciones y constancias de requerimiento.","Pruebas adicionales según la acción y legislación local aplicable."];
      acciones=["Verificar competencia, legitimación, vía y plazo antes de presentar.","Construir cronología de hechos y matriz de pruebas.","Relacionar cada prestación o pretensión con hechos, pruebas y fundamento."];
      fundamentos=["Legislación sustantiva y procesal vigente según la materia y entidad federativa.","Jurisprudencia aplicable que debe verificarse antes de presentar el escrito."];
      if(riesgos.length>=3)nivel="ALTO";
    }
    if(!riesgos.length)riesgos=["No se detectaron alertas básicas en esta entrevista; aún debe revisarse el expediente completo."];
    const result=$("ep-resultado");
    result.innerHTML=`<div class="ep-encabezado"><div><span>Nivel de atención</span><strong class="riesgo-${nivel.toLowerCase()}">${nivel}</strong></div><button class="btn-secundario" onclick="generarReporteLexGear('Estrategia procesal','ep-resultado')">Guardar PDF</button><button class="btn-secundario" onclick="generarWordLexGear('Estrategia procesal','ep-resultado')">Guardar Word editable</button></div><h4>${esc(m.nombre)}</h4>${lista("Objetivo inicial",["Definir una ruta procesal defendible, documentada y verificable."])}${lista("Riesgos y puntos críticos",riesgos,"alerta")}${lista("Pruebas recomendadas",pruebas)}${lista("Acciones siguientes",acciones)}${lista("Fundamento de referencia",fundamentos)}<div class="cc-aviso">Resultado orientativo. No sustituye el análisis del expediente, la legislación vigente ni el criterio profesional del abogado responsable.</div>`;
  };
  window.inicializarEstrategiaProcesal=()=>{procedimientos();};
  document.addEventListener("DOMContentLoaded",()=>{$("ep-materia")?.addEventListener("change",procedimientos);$("ep-procedimiento")?.addEventListener("change",renderPreguntas);procedimientos();});
})();