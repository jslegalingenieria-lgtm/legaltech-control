(() => {
  const C=()=>window.JSLT_PENSIONES_CONFIG.ley97;
  const n=v=>Number(v)||0;
  const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(n(v));
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  function semanasMinimas(anio){ const a=Number(anio)||new Date().getFullYear(); if(a<=2021)return 750; if(a>=2031)return 1000; return 750+25*(a-2021); }
  function rendimientoMensual(realAnual){ return Math.pow(1+Math.max(-.99,n(realAnual)/100),1/12)-1; }
  function saldoFuturo(si,aportacion,nMeses,r,c,densidad){
    const i=(1+r)*(1-c)-1;
    const meses=Math.max(0,Math.floor(nMeses));
    const a=n(aportacion)*(Math.max(0,n(densidad))/100);
    if(!meses)return si;
    const crecimiento=Math.pow(1+i,meses);
    return si*crecimiento+(Math.abs(i)<1e-12?a*meses:a*((crecimiento-1)/i));
  }
  function rangoSalarial(sbcMensual, smMensual, umaMensual){
    const sm=n(smMensual), uma=n(umaMensual), s=n(sbcMensual);
    if(!s)return C().rangosSalariales[0];
    if(sm>0 && s/sm<2)return C().rangosSalariales[0];
    const ratio=uma>0?s/uma:Infinity;
    if(ratio<3)return C().rangosSalariales[1];
    if(ratio<4)return C().rangosSalariales[2];
    if(ratio<5)return C().rangosSalariales[3];
    return C().rangosSalariales[4];
  }
  function columnaSemanas(W){
    const cols=C().columnasSemanas;
    if(W<=cols[0])return 0;
    let idx=0; cols.forEach((v,i)=>{if(W>=v)idx=i;}); return idx;
  }
  function pg97(edad,W,sbc,sm,uma,factor){
    const rango=rangoSalarial(sbc,sm,uma); const idx=columnaSemanas(W); const edadClave=edad>=65?65:Math.max(60,Math.floor(edad));
    const base=C().tablaGarantizadaOrigen2021[rango.id][edadClave][idx];
    return {base,factor:n(factor)||1,monto:base*(n(factor)||1),rango:rango.label,columna:C().columnasSemanas[idx]};
  }
  window.calcularPensionLey97=function(){
    const edad=n(document.getElementById('p97-edad')?.value), anio=n(document.getElementById('p97-anio')?.value)||new Date().getFullYear(), W=n(document.getElementById('p97-semanas')?.value);
    const sbc=n(document.getElementById('p97-sbc')?.value), saldo=n(document.getElementById('p97-saldo')?.value), aport=n(document.getElementById('p97-aportacion')?.value), rendimiento=n(document.getElementById('p97-rendimiento')?.value), comision=n(document.getElementById('p97-comision')?.value)/100, densidad=n(document.getElementById('p97-densidad')?.value)||100, meses=n(document.getElementById('p97-meses-proyeccion')?.value), smDiario=n(document.getElementById('p97-smg')?.value), umaMensual=n(document.getElementById('p97-uma-mensual')?.value), factorINPC=n(document.getElementById('p97-factor-inpc')?.value)||C().factorINPCDefault, factorRV=n(document.getElementById('p97-factor-rv')?.value)||C().factorActuarialDefault, urv=n(document.getElementById('p97-urv')?.value)||C().factorActuarialDefault, prima=n(document.getElementById('p97-seguro-sobrevivencia')?.value);
    if(edad<40||edad>90||W<=0||sbc<=0||saldo<0){alert('Captura edad, semanas, salario base de cotización y saldo AFORE válidos.');return;}
    const req=semanasMinimas(anio), falt=Math.max(0,req-W), elegEdad=edad>=60, cumple=W>=req;
    const r=document.getElementById('calc-pensiones-ley97-resultado');
    if(!elegEdad||!cumple){
      r.innerHTML=`<div class="pension-alerta pension-warning"><strong>${!cumple?'No reúne actualmente el mínimo de semanas para Ley 97.':'Aún no alcanza la edad ordinaria de cesantía/vejez.'}</strong><p>Edad: ${edad.toFixed(0)} · Año de retiro: ${anio} · Semanas actuales: ${W.toFixed(0)} · Semanas requeridas: ${req} · Faltantes: ${falt}.</p><p>El motor puede proyectar el saldo, pero no presenta una pensión ordinaria como derecho adquirido.</p></div>`;
    }
    const rMens=rendimientoMensual(rendimiento), saldoProy=saldoFuturo(saldo,aport,meses,rMens,comision,densidad), capitalRenta=Math.max(0,saldoProy-prima), rentaVitalicia=capitalRenta/(12*Math.max(.0001,factorRV)), retiroProgramado=capitalRenta/(12*Math.max(.0001,urv));
    const pg=pg97(edad,W,sbc,smDiario*365/12,umaMensual,factorINPC);
    const pgMonto=pg.monto;
    const retiroAnticipado=edad<60 && rentaVitalicia>pg97(60,W,sbc,smDiario*365/12,umaMensual,factorINPC).monto*1.30;
    const resultado=Math.max(rentaVitalicia,retiroProgramado,pgMonto);
    const tasaReemplazo=sbc>0?resultado/sbc*100:0;
    r.innerHTML=`<div class="calc-resumen"><div><span>Saldo proyectado</span><strong>${money(saldoProy)}</strong></div><div><span>Pensión garantizada estimada</span><strong>${money(pgMonto)}</strong></div><div class="total"><span>Escenario mayor</span><strong>${money(resultado)}</strong></div></div>
      <div class="calc-meta"><span>Semanas mínimas ${anio}: <strong>${req}</strong></span><span>Renta vitalicia estimada: <strong>${money(rentaVitalicia)}</strong></span><span>Retiro programado estimado: <strong>${money(retiroProgramado)}</strong></span><span>Tasa de reemplazo: <strong>${tasaReemplazo.toFixed(1)}%</strong></span></div>
      <div class="table-responsive"><table class="calc-tabla"><thead><tr><th>Escenario</th><th>Metodología</th><th>Parámetros</th><th>Mensual</th></tr></thead><tbody>
      <tr><td>Renta vitalicia</td><td>(Saldo proyectado − prima de sobrevivencia) ÷ (12 × factor actuarial)</td><td>Factor actuarial RV: ${factorRV.toFixed(4)}</td><td>${money(rentaVitalicia)}</td></tr>
      <tr><td>Retiro programado</td><td>Estimación inicial del saldo disponible ÷ (12 × factor actuarial)</td><td>La modalidad real se recalcula periódicamente conforme a reglas CONSAR</td><td>${money(retiroProgramado)}</td></tr>
      <tr><td>Pensión garantizada</td><td>Tabla art. 170 / Cuarto Transitorio, actualizada por INPC</td><td>${esc(pg.rango)} · columna ${pg.columna}+ semanas · factor INPC ${factorINPC.toFixed(6)}</td><td>${money(pgMonto)}</td></tr>
      <tr><td>Retiro anticipado</td><td>Renta vitalicia &gt; 130% de PG de referencia a 60 años, después del seguro de sobrevivencia</td><td>${retiroAnticipado?'Cumple criterio económico preliminar':'No cumple criterio económico preliminar'}</td><td>${retiroAnticipado?money(rentaVitalicia):'—'}</td></tr>
      </tbody></table></div>
      <section class="calc-fundamento"><h5>Fundamento y advertencias</h5><p><strong>Arts. 154, 157, 158, 159, 170-172 LSS:</strong> Ley 97 funciona mediante cuenta individual y permite renta vitalicia o retiros programados. La pensión garantizada depende de edad, semanas y promedio del salario base de cotización durante la afiliación, actualizado por INPC.</p><p><strong>Proyección:</strong> el saldo futuro es una estimación; no representa una cotización garantizada de una AFORE. El rendimiento, comisión, densidad y aportaciones futuras son supuestos.</p><p><strong>Renta vitalicia:</strong> el monto real depende de la aseguradora y del monto constitutivo, incluyendo el seguro de sobrevivencia. El factor actuarial utilizado aquí es editable.</p><p><strong>Retiro programado:</strong> CONSAR utiliza anualidades y variables actuariales; esta salida es una estimación inicial y debe sustituirse por la tabla/URV oficial vigente cuando se disponga del parámetro.</p><p><strong>Pensión garantizada:</strong> la tabla legal se expresa en pesos de origen y se actualiza por INPC. El factor utilizado debe verificarse antes de emitir un dictamen.</p></section>
      <div class="calc-acciones"><button class="btn-secundario" onclick="guardarCalculoPensiones()">Guardar cálculo</button><button class="btn-secundario" onclick="generarReporteLexGear('Reporte de cálculo de pensión Ley 97','calc-pensiones-ley97-resultado','pensiones')">Guardar PDF</button><button class="btn-secundario" onclick="generarWordLexGear('Reporte de cálculo de pensión Ley 97','calc-pensiones-ley97-resultado','pensiones')">Guardar Word editable</button></div>
      <div class="cc-aviso">Resultado estimativo. No constituye resolución del IMSS ni oferta de aseguradora. Para un expediente deben verificarse semanas reconocidas, promedio salarial actualizado, saldo AFORE, beneficiarios, seguro de sobrevivencia, URV/factor actuarial y parámetros vigentes.</div>`;
    window.__ultimoCalculoPensiones={tipo:'Ley 97',fecha:new Date().toISOString(),edad,anioRetiro:anio,semanas:W,semanasRequeridas:req,sbc,saldo,aportacionMensual:aport,mesesProyeccion:meses,rendimientoReal:rendimiento,comision,densidad,saldoProyectado:saldoProy,urv,primaSobrevivencia:prima,factorRentaVitalicia:factorRV,rentaVitalicia,retiroProgramado,pensionGarantizada:pgMonto,rangoSalarial:pg.rango,factorINPC,tasaReemplazo,retiroAnticipado};
  };
  window.semanasMinimasLey97=semanasMinimas;
})();
