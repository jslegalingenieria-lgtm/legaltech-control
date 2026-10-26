(() => {
  const C = () => window.JSLT_PENSIONES_CONFIG.ley73;
  const n = v => Number(v)||0;
  const money = v => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(n(v));
  const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function edadEfectiva(anios, meses){
    let a=Math.floor(n(anios)), m=Math.floor(n(meses));
    if(m>=6) a+=1;
    return Math.min(65,Math.max(0,a));
  }
  function grupoSalarial(cociente){ return C().tablaArt167.find(x=>cociente<=x.max) || C().tablaArt167.at(-1); }
  function incrementos(W, ia){
    const extra=Math.max(0,n(W)-500);
    const completos=Math.floor(extra/52);
    const resto=Math.round(extra-completos*52);
    let fraccion=0;
    if(resto>=13 && resto<=26) fraccion=.5;
    else if(resto>26) fraccion=1;
    return {extra,completos,resto,fraccion,porcentaje:(completos+fraccion)*ia};
  }
  function asignaciones(base, datos){
    const conyuge=datos.conyuge?base*.15:0;
    const hijos=Math.max(0,Math.floor(n(datos.hijos)));
    const asignHijos=datos.conyuge?0:base*.10*hijos;
    const padres=Math.max(0,Math.floor(n(datos.padres)));
    let asignPadres=0, ayudaSinFamilia=0;
    if(!datos.conyuge && hijos===0 && padres>0) asignPadres=base*.10*padres;
    if(!datos.conyuge && hijos===0 && padres===0) ayudaSinFamilia=base*.15;
    const asistenciaMedica=datos.asistenciaMedica?base*Math.min(.20,Math.max(0,n(datos.porcentajeAsistencia)/100)):0;
    return {conyuge,asignHijos,asignPadres,ayudaSinFamilia,asistenciaMedica,total:conyuge+asignHijos+asignPadres+ayudaSinFamilia+asistenciaMedica};
  }

  window.calcularPensionLey73 = function(){
    const W=n(document.getElementById('p73-semanas')?.value);
    const edad=n(document.getElementById('p73-edad')?.value);
    const meses=n(document.getElementById('p73-meses')?.value);
    const S=n(document.getElementById('p73-promedio-250')?.value);
    const SM=n(document.getElementById('p73-smg')?.value)||C().salarioMinimoReferenciaDiarioDefault;
    const factorEdad=C().factoresEdad[edadEfectiva(edad,meses)];
    const datos={
      conyuge:document.getElementById('p73-conyuge')?.checked,
      hijos:n(document.getElementById('p73-hijos')?.value),
      padres:n(document.getElementById('p73-padres')?.value),
      asistenciaMedica:document.getElementById('p73-asistencia-medica')?.checked,
      porcentajeAsistencia:n(document.getElementById('p73-asistencia-pct')?.value)||20
    };
    if(W<500){
      document.getElementById('calc-pensiones-ley73-resultado').innerHTML=`<div class="pension-alerta pension-error"><strong>No reúne el mínimo de semanas para Ley 73.</strong><p>Semanas registradas: ${W.toFixed(0)} · Mínimo: 500 · Faltantes: ${Math.max(0,500-W).toFixed(0)}.</p><p>La calculadora no continúa al monto de pensión mientras no se cumpla el requisito mínimo.</p></div>`;
      return;
    }
    if(S<=0||SM<=0||!factorEdad){alert('Captura salario promedio, salario mínimo de referencia y una edad válida.');return;}
    const cociente=S/SM;
    const grupo=grupoSalarial(cociente);
    const inc=incrementos(W,grupo.ia);
    const pctTotal=(grupo.cb+inc.porcentaje)/100;
    const anual65=S*365*pctTotal;
    const mensual65=anual65/12;
    const pensionEdad=mensual65*factorEdad;
    const asig=asignaciones(pensionEdad,datos);
    const minimoMensual=SM*365/12;
    let antes11=pensionEdad+asig.total;
    const pisoAplicado=antes11<minimoMensual;
    let pensionConMinimo=Math.max(antes11,minimoMensual);
    const factor11=edadEfectiva(edad,meses)>=60 ? C().factor2004 : 1;
    const pension11=pensionConMinimo*factor11;
    const capPromedio=S*365/12;
    const topeAplica=!pisoAplicado;
    const pensionFinal=topeAplica?Math.min(pension11,capPromedio):pension11;
    const r=document.getElementById('calc-pensiones-ley73-resultado');
    r.innerHTML=`<div class="calc-resumen"><div><span>Pensión base por edad</span><strong>${money(pensionEdad)}</strong></div><div><span>Asignaciones / asistencia</span><strong>${money(asig.total)}</strong></div><div class="total"><span>Pensión estimada Ley 73</span><strong>${money(pensionFinal)}</strong></div></div>
      <div class="calc-meta"><span>Grupo salarial: <strong>${esc(grupo.grupo)}</strong></span><span>Veces SMGDF: <strong>${cociente.toFixed(4)}</strong></span><span>Cuantía básica: <strong>${grupo.cb.toFixed(3)}%</strong></span><span>Incrementos: <strong>${inc.porcentaje.toFixed(3)}%</strong></span><span>Factor edad: <strong>${(factorEdad*100).toFixed(0)}%</strong></span></div>
      <div class="table-responsive"><table class="calc-tabla"><thead><tr><th>Etapa</th><th>Fórmula / criterio</th><th>Fundamento</th><th>Resultado</th></tr></thead><tbody>
      <tr><td>Promedio salarial</td><td>Promedio diario de las últimas 250 semanas</td><td>Art. 167 LSS 1973</td><td>${money(S)} diario</td></tr>
      <tr><td>Incrementos</td><td>${inc.completos} años completos + ${inc.resto} semanas remanentes</td><td>Arts. 167 y 168 LSS 1973</td><td>${inc.porcentaje.toFixed(3)}%</td></tr>
      <tr><td>Cuantía a 65</td><td>S × 365 × (${(grupo.cb+inc.porcentaje).toFixed(3)}%) ÷ 12</td><td>Art. 167 LSS 1973</td><td>${money(mensual65)}</td></tr>
      <tr><td>Cesantía</td><td>Cuantía de vejez × ${(factorEdad*100).toFixed(0)}%</td><td>Art. 171 LSS 1973</td><td>${money(pensionEdad)}</td></tr>
      <tr><td>Prestaciones familiares</td><td>Aplicación separada sobre la cuantía de pensión</td><td>Arts. 164-166 LSS 1973</td><td>${money(asig.total)}</td></tr>
      <tr><td>Mínimo</td><td>Se compara contra 100% del salario mínimo de referencia</td><td>Art. 168 LSS 1973</td><td>${money(minimoMensual)}</td></tr>
      <tr><td>Incremento 2004</td><td>${factor11===1.11?'× 1.11 aplicado':'No aplicado'}</td><td>Art. Décimo Cuarto Transitorio; criterio IMSS</td><td>${money(pension11)}</td></tr>
      </tbody></table></div>
      <section class="calc-fundamento"><h5>Lectura jurídica</h5><p>La cuantía base se determina con el promedio de las últimas 250 semanas y la tabla del artículo 167 de la LSS 1973. Las fracciones de año se computan con 13–26 semanas al 50% del incremento anual y más de 26 semanas al 100%.</p><p>La edad de cesantía utiliza 75%, 80%, 85%, 90% y 95% a los 60–64 años; cuando la edad excede en seis meses se considera cumplido el año siguiente.</p><p>Las asignaciones familiares se calculan por separado. La ayuda asistencial médica puede llegar hasta 20% cuando exista dictamen que justifique asistencia permanente o continua.</p><p>El incremento de 11% se muestra como regla separada y se activa en el supuesto de pensión de 60 años o más conforme al criterio documentado por el IMSS sobre la reforma de 2004. Debe verificarse el expediente concreto.</p></section>
      <div class="calc-acciones"><button class="btn-secundario" onclick="guardarCalculoPensiones()">Guardar cálculo</button><button class="btn-secundario" onclick="generarReporteLexGear('Reporte de cálculo de pensión Ley 73','calc-pensiones-ley73-resultado','pensiones')">Guardar PDF</button><button class="btn-secundario" onclick="generarWordLexGear('Reporte de cálculo de pensión Ley 73','calc-pensiones-ley73-resultado','pensiones')">Guardar Word editable</button></div>
      <div class="cc-aviso">Estimación jurídica y actuarial. No sustituye la resolución del IMSS. El salario mínimo de referencia, semanas reconocidas, conservación de derechos, topes y procedencia del incremento 2004 deben verificarse con el expediente.</div>`;
    window.__ultimoCalculoPensiones={tipo:'Ley 73',fecha:new Date().toISOString(),semanas:W,edad,meses,promedio250:S,smg:SM,grupo:grupo.grupo,cociente,cuantiaBasica:grupo.cb,incrementoAnual:grupo.ia,incrementos:inc.porcentaje,factorEdad,pensionEdad,asignaciones:asig,pensionAntes11:pensionConMinimo,factor11,pensionFinal,minimoMensual};
  };
})();
