(() => {
  const $=id=>document.getElementById(id), num=id=>Number($(id)?.value||0), money=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(n)||0);
  const MS=86400000;
  function fechaUTC(v){const [y,m,d]=String(v).split("-").map(Number);return new Date(Date.UTC(y,m-1,d));}
  function diasEntre(a,b){return Math.max(0,Math.floor((b-a)/MS));}
  function vacPorAntiguedad(anios){if(anios<=0)return 12;if(anios<=5)return 10+anios*2;return 20+Math.ceil((anios-5)/5)*2;}
  function fila(cat,concepto,fund,monto){return `<tr><td data-label="Categoría">${cat}</td><td data-label="Concepto">${concepto}</td><td data-label="Fundamento">${fund}</td><td data-label="Monto">${money(monto)}</td></tr>`;}
  window.calcularLiquidacionLaboral=()=>{
    const ingreso=fechaUTC($("cl-fecha-ingreso").value), baja=fechaUTC($("cl-fecha-baja").value);
    if(!ingreso||!baja||baja<=ingreso){alert("Verifica las fechas de ingreso y baja.");return;}
    const totalDias=diasEntre(ingreso,baja), antig=totalDias/365, anios=Math.floor(antig), meses=Math.floor((antig-anios)*12);
    const sd=num("cl-salario-diario"), sm=num("cl-salario-minimo"), aguinaldo=num("cl-aguinaldo-dias"), prima=num("cl-prima-vacacional")/100, vales=num("cl-vales");
    let vac=num("cl-vacaciones-dias"); if(!vac){vac=vacPorAntiguedad(Math.max(1,Math.ceil(antig)));$("cl-vacaciones-dias").value=vac;}
    const inicioAnio=new Date(Date.UTC(baja.getUTCFullYear(),0,1)), diasAnio=diasEntre(inicioAnio,baja)+1;
    const sdi=sd+(aguinaldo*sd/365)+(vac*sd*prima/365)+(vales*12/365);
    const incluirLiquidacion=$("cl-incluir-liquidacion")?.checked !== false;
    const indemn3=incluirLiquidacion?sdi*90:0;
    const veinte=incluirLiquidacion && $("cl-incluir-20").checked?sdi*20*antig:0;
    const basePrima=Math.min(sdi,sm*2), primaAnt=incluirLiquidacion && $("cl-prima-antiguedad").checked?basePrima*12*antig:0;
    const aguinaldoProp=sd*aguinaldo*(diasAnio/365);
    const vacProp=sd*vac*((totalDias%365)/365);
    const primaVac=vacProp*prima;
    const vacAnt=sd*num("cl-vacaciones-anteriores");
    const fondoTrabajador=num("cl-fondo-trabajador"), fondoPatron=num("cl-fondo-patron"), fondoPeriodos=Math.max(0,Math.floor(num("cl-fondo-periodos")));
    const fondoAhorro=(fondoTrabajador+fondoPatron)*fondoPeriodos;
    const finiquito=num("cl-pago-pendiente")+aguinaldoProp+vacProp+primaVac+vacAnt+fondoAhorro+num("cl-otros");
    const liquidacion=indemn3+veinte+primaAnt,total=liquidacion+finiquito;
    const r=$("calc-laboral-resultado");
    r.innerHTML=`<div class="calc-resumen">${incluirLiquidacion?`<div><span>Liquidación</span><strong>${money(liquidacion)}</strong></div>`:""}<div><span>Finiquito</span><strong>${money(finiquito)}</strong></div><div class="total"><span>${incluirLiquidacion?"Total preliminar":"Total del finiquito"}</span><strong>${money(total)}</strong></div></div>
    <div class="calc-meta"><span>Antigüedad: <strong>${anios} años, ${meses} meses</strong></span><span>SDI estimado: <strong>${money(sdi)}</strong></span><span>Vacaciones usadas: <strong>${vac} días</strong></span></div>
    <div class="table-responsive"><table class="calc-tabla"><thead><tr><th>Categoría</th><th>Concepto</th><th>Fundamento</th><th>Monto</th></tr></thead><tbody>
    ${incluirLiquidacion?fila("Liquidación","Indemnización constitucional (90 días)","Arts. 48 y 50 LFT",indemn3):""}
    ${veinte?fila("Liquidación","Veinte días por año — escenario seleccionado","Art. 50 LFT; procedencia sujeta al caso",veinte):""}
    ${primaAnt?fila("Liquidación","Prima de antigüedad (12 días por año y proporción)","Art. 162 LFT",primaAnt):""}
    ${fila("Finiquito","Aguinaldo proporcional","Art. 87 LFT",aguinaldoProp)}
    ${fila("Finiquito","Vacaciones proporcionales","Arts. 76 y 79 LFT",vacProp)}
    ${fila("Finiquito","Prima vacacional","Art. 80 LFT",primaVac)}
    ${vacAnt?fila("Finiquito","Vacaciones pendientes anteriores","Arts. 76, 79 y 81 LFT",vacAnt):""}
    ${num("cl-pago-pendiente")?fila("Finiquito","Salarios o nómina pendiente","Arts. 82 y 88 LFT",num("cl-pago-pendiente")):""}
    ${fondoAhorro?fila("Finiquito",`Fondo de ahorro: (${money(fondoTrabajador)} trabajador + ${money(fondoPatron)} patrón) × ${fondoPeriodos} periodos`,"Contrato, plan de previsión social, recibos de nómina y condiciones aplicables",fondoAhorro):""}
    ${num("cl-otros")?fila("Finiquito","Otros conceptos capturados","Verificar fuente contractual o legal",num("cl-otros")):""}
    </tbody></table></div>
    <section class="calc-fundamento"><h5>Metodología y referencias</h5><p><strong>Salario Diario Integrado:</strong> cuota diaria más proporciones de aguinaldo, prima vacacional y vales capturados, como estimación basada en los artículos 84 y 89 de la LFT.</p><p><strong>Tope de prima de antigüedad:</strong> se aplicó el menor entre el SDI estimado y dos salarios mínimos diarios, conforme a los artículos 162 y 486 de la LFT.</p><p><strong>Parámetro anual:</strong> salario mínimo general capturado ${money(sm)} diarios. La interfaz inicia con $315.04 para 2026.</p><div class="calc-links"><a target="_blank" rel="noopener" href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf">Consultar Ley Federal del Trabajo vigente</a><a target="_blank" rel="noopener" href="https://www.conasami.gob.mx/">Consultar CONASAMI</a></div></section>
    <div class="calc-acciones"><button class="btn-secundario" onclick="guardarCalculoLaboral()">Guardar cálculo</button><button class="btn-secundario" onclick="generarReporteLexGear('Reporte de cálculo laboral','calc-laboral-resultado')">Guardar PDF</button><button class="btn-secundario" onclick="generarWordLexGear('Reporte de cálculo laboral','calc-laboral-resultado')">Guardar Word editable</button></div><div class="cc-aviso">Estimación preliminar. La procedencia de cada indemnización y la integración salarial dependen de hechos, pruebas, prestaciones pactadas, criterios jurisdiccionales y legislación vigente. No incluye ISR, salarios vencidos, intereses ni conceptos no capturados.</div>`;
    window.__ultimoCalculoLaboral={fecha:new Date().toISOString(),ingreso:$("cl-fecha-ingreso").value,baja:$("cl-fecha-baja").value,sdi,total,liquidacion,finiquito,fondoAhorro,incluirLiquidacion,antiguedad:`${anios} años, ${meses} meses`};
  };


  window.actualizarModoCalculoLaboral=()=>{
    const incluir=$("cl-incluir-liquidacion")?.checked !== false;
    document.querySelectorAll(".calc-opcion-liquidacion").forEach(el=>{
      el.classList.toggle("calc-opcion-deshabilitada",!incluir);
      el.querySelectorAll("input").forEach(input=>{ input.disabled=!incluir; });
    });
  };

  window.mostrarCalculadora=(tipo)=>{
    document.querySelectorAll('.calc-tipo[data-calculadora]').forEach(b=>b.classList.toggle('activo',b.dataset.calculadora===tipo));
    const laboral=$("calc-laboral-form")?.parentElement;
    const alimentos=$("calc-alimentos-panel"), intereses=$("calc-intereses-panel");
    if(laboral) laboral.style.display=tipo==='laboral'?'grid':'none';
    if(alimentos) alimentos.style.display=tipo==='alimentos'?'grid':'none';
    if(intereses) intereses.style.display=tipo==='intereses'?'grid':'none';
  };
  window.calcularPensionAlimenticia=()=>{
    const ingreso=num('pa-ingreso-neto-deudor'), otro=num('pa-ingreso-otro-progenitor'), acreedores=Math.max(1,Math.floor(num('pa-num-acreedores')));
    if(ingreso<=0){alert('Captura el ingreso neto mensual del deudor.');return;}
    const gastos=['pa-vivienda','pa-alimentacion','pa-educacion','pa-salud','pa-vestido','pa-transporte','pa-recreacion','pa-otros-gastos'].reduce((a,id)=>a+num(id),0);
    if(gastos<=0){alert('Captura al menos un gasto o necesidad mensual.');return;}
    const ingresoFamiliar=ingreso+otro;
    const proporcionDeudor=ingresoFamiliar>0?ingreso/ingresoFamiliar:1;
    const necesidadProporcional=gastos*proporcionDeudor;
    const pisoCapacidad=Math.max(0,ingreso*0.15), techoPrudencial=Math.max(0,ingreso*0.50);
    const escenarioBajo=Math.min(necesidadProporcional*0.85,techoPrudencial);
    const escenarioBase=Math.min(necesidadProporcional,techoPrudencial);
    const escenarioAlto=Math.min(necesidadProporcional*1.15,techoPrudencial);
    const porBase=ingreso?escenarioBase/ingreso*100:0;
    const r=$("calc-alimentos-resultado");
    r.innerHTML=`<div class="calc-resumen"><div><span>Necesidades acreditadas</span><strong>${money(gastos)}</strong></div><div><span>Participación económica estimada del deudor</span><strong>${money(escenarioBase)}</strong></div><div class="total"><span>Equivalencia orientativa</span><strong>${porBase.toFixed(1)}%</strong></div></div>
    <div class="calc-meta"><span>Acreedores: <strong>${acreedores}</strong></span><span>Capacidad conjunta: <strong>${money(ingresoFamiliar)}</strong></span><span>Proporción de ingreso del deudor: <strong>${(proporcionDeudor*100).toFixed(1)}%</strong></span></div>
    <div class="table-responsive"><table class="calc-tabla"><thead><tr><th>Escenario</th><th>Metodología</th><th>Monto mensual</th><th>% ingreso deudor</th></tr></thead><tbody>
    <tr><td data-label="Escenario">Conservador</td><td data-label="Metodología">85% de la participación proporcional estimada</td><td data-label="Monto mensual">${money(escenarioBajo)}</td><td data-label="% ingreso deudor">${(escenarioBajo/ingreso*100).toFixed(1)}%</td></tr>
    <tr><td data-label="Escenario">Base documental</td><td data-label="Metodología">Necesidades × participación de ingresos</td><td data-label="Monto mensual">${money(escenarioBase)}</td><td data-label="% ingreso deudor">${porBase.toFixed(1)}%</td></tr>
    <tr><td data-label="Escenario">Necesidad reforzada</td><td data-label="Metodología">115% del escenario base, sujeto a prueba</td><td data-label="Monto mensual">${money(escenarioAlto)}</td><td data-label="% ingreso deudor">${(escenarioAlto/ingreso*100).toFixed(1)}%</td></tr></tbody></table></div>
    <section class="calc-fundamento"><h5>Fundamento y criterio aplicado</h5><p><strong>Código Civil del Estado de Jalisco:</strong> aplicar el principio de proporcionalidad entre las posibilidades de quien debe proporcionar alimentos y las necesidades de quien debe recibirlos. Verifica la numeración vigente en el texto oficial al usar el resultado.</p><p><strong>Jurisprudencia 1a./J. 22/2017 (10a.), registro 2014566:</strong> en asuntos de Jalisco, la necesidad debe acreditarse en mayor o menor medida y la decisión debe responder al principio de proporcionalidad.</p><p><strong>Jurisprudencia 1a./J. 27/2017 (10a.), registro 2014571:</strong> el juzgador debe valorar vida digna, capacidad propia del acreedor y suficiencia de la pensión.</p><p><strong>Jurisprudencia VI.2o.C. J/248, registro 179683:</strong> una división aritmética simple es insuficiente; deben valorarse necesidades particulares, posibilidades reales y pruebas.</p><p><strong>Base salarial:</strong> se utiliza ingreso neto después de deducciones legales obligatorias; las deudas voluntarias no se descuentan automáticamente del ingreso disponible.</p><div class="calc-links"><a target="_blank" rel="noopener" href="https://congresoweb.congresojal.gob.mx/BibliotecaVirtual/busquedasleyes/ListadoCr.cfm">Código Civil de Jalisco vigente</a><a target="_blank" rel="noopener" href="https://sjf2.scjn.gob.mx/detalle/tesis/2014566">Registro 2014566</a><a target="_blank" rel="noopener" href="https://sjf2.scjn.gob.mx/detalle/tesis/2014571">Registro 2014571</a></div></section>
    <div class="calc-acciones"><button class="btn-secundario" onclick="guardarCalculoAlimentos()">Guardar cálculo</button><button class="btn-secundario" onclick="generarReporteLexGear('Reporte de pensión alimenticia','calc-alimentos-resultado')">Guardar PDF</button><button class="btn-secundario" onclick="generarWordLexGear('Reporte de pensión alimenticia','calc-alimentos-resultado')">Guardar Word editable</button></div>
    <div class="cc-aviso">Herramienta de análisis, no resolución judicial. El monto definitivo depende de pruebas, necesidades individualizadas, capacidad económica real, aportaciones en especie, cuidado directo, otros dependientes y prudente arbitrio judicial. El sistema no recomienda un porcentaje fijo.</div>`;
    window.__ultimoCalculoAlimentos={id:`ALI-${Date.now()}`,fecha:new Date().toISOString(),ingresoDeudor:ingreso,ingresoOtroProgenitor:otro,acreedores,gastos,ingresoFamiliar,proporcionDeudor,escenarioBajo,escenarioBase,escenarioAlto,porcentajeBase:porBase};
  };
  window.guardarCalculoAlimentos=()=>{if(!window.__ultimoCalculoAlimentos){alert('Primero realiza el cálculo.');return;}const k='jslt_calculos_alimentos',a=JSON.parse(localStorage.getItem(k)||'[]');a.unshift(window.__ultimoCalculoAlimentos);localStorage.setItem(k,JSON.stringify(a.slice(0,100)));alert('Cálculo de pensión alimenticia guardado.');};


  window.calcularInteresesJuridicos=()=>{
    const capital=num('ci-capital'), tasa=num('ci-tasa')/100, pagos=num('ci-pagos'), ivaPct=num('ci-iva')/100;
    const inicio=fechaUTC($('ci-fecha-inicio').value), fin=fechaUTC($('ci-fecha-fin').value);
    if(!capital||!tasa||!inicio||!fin||fin<=inicio){alert('Verifica capital, tasa y fechas.');return;}
    const dias=diasEntre(inicio,fin), base=Number($('ci-base').value||365), metodo=$('ci-metodo').value, n=Number($('ci-capitalizacion').value||12);
    const principal=Math.max(0,capital-pagos), tiempo=dias/base;
    const monto=metodo==='compuesto'?principal*Math.pow(1+tasa/n,n*tiempo):principal*(1+tasa*tiempo);
    const interes=Math.max(0,monto-principal), iva=interes*ivaPct, total=principal+interes+iva;
    const tipo=$('ci-tipo').selectedOptions[0].textContent;
    const formula=metodo==='compuesto'?`M = C × (1 + i/${n})^(${n} × ${tiempo.toFixed(6)})`:`I = C × i × (${dias}/${base})`;
    $('calc-intereses-resultado').innerHTML=`<div class="calc-resumen"><div><span>Capital insoluto</span><strong>${money(principal)}</strong></div><div><span>Intereses</span><strong>${money(interes)}</strong></div><div class="total"><span>Total estimado</span><strong>${money(total)}</strong></div></div><div class="calc-meta"><span>Días: <strong>${dias}</strong></span><span>Tasa anual: <strong>${(tasa*100).toFixed(4)}%</strong></span><span>Tipo: <strong>${tipo}</strong></span><span>Método: <strong>${metodo==='simple'?'Simple':'Compuesto'}</strong></span></div><section class="calc-fundamento"><h5>Metodología</h5><p><strong>Fórmula:</strong> ${formula}</p><p>Se utilizó una base anual de ${base} días. Los abonos capturados se descontaron del capital antes del cálculo. IVA estimado sobre intereses: ${money(iva)}.</p><h5>Validación jurídica indispensable</h5><p>Antes de usar el resultado en una demanda, convenio o liquidación, el profesional debe validar la procedencia del interés, la tasa aplicable, la fecha de mora, la base de días, la capitalización y cualquier límite legal o jurisprudencial. La capitalización no debe aplicarse automáticamente si no está jurídicamente permitida.</p></section><div class="calc-acciones"><button class="btn-secundario" onclick="guardarCalculoIntereses()">Guardar cálculo</button><button class="btn-secundario" onclick="generarReporteLexGear('Reporte de intereses','calc-intereses-resultado')">Guardar PDF</button><button class="btn-secundario" onclick="generarWordLexGear('Reporte de intereses','calc-intereses-resultado')">Guardar Word editable</button></div><div class="cc-aviso">Resultado orientativo y editable. No sustituye la revisión del contrato, título de crédito, sentencia, legislación vigente ni criterios judiciales aplicables.</div>`;
    window.__ultimoCalculoIntereses={id:`INT-${Date.now()}`,fecha:new Date().toISOString(),capital,principal,tasa:tasa*100,dias,base,metodo,interes,iva,total,tipo};
  };
  window.guardarCalculoIntereses=()=>{if(!window.__ultimoCalculoIntereses){alert('Primero realiza el cálculo.');return;}const k='jslt_calculos_intereses',a=JSON.parse(localStorage.getItem(k)||'[]');a.unshift(window.__ultimoCalculoIntereses);localStorage.setItem(k,JSON.stringify(a.slice(0,100)));alert('Cálculo de intereses guardado.');};

  window.guardarCalculoLaboral=()=>{if(!window.__ultimoCalculoLaboral){alert("Primero realiza el cálculo.");return;}const k="jslt_calculos_juridicos",lista=JSON.parse(localStorage.getItem(k)||"[]");lista.unshift({...window.__ultimoCalculoLaboral,id:`CAL-${Date.now()}`});localStorage.setItem(k,JSON.stringify(lista.slice(0,100)));alert("Cálculo guardado en el historial local de LexGear.");};
  document.addEventListener("DOMContentLoaded",()=>{const baja=$("cl-fecha-baja");if(baja&&!baja.value)baja.value=new Date().toISOString().slice(0,10);});
})();