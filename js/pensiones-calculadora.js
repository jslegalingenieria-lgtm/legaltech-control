(() => {
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const oldMostrar=window.mostrarCalculadora;
  window.mostrarCalculadora=function(tipo){
    const pension=document.getElementById('calc-pensiones-panel');
    if(tipo!=='pensiones'){
      if(pension) pension.style.display='none';
      oldMostrar?.(tipo);
      return;
    }
    document.querySelectorAll('.calc-tipo[data-calculadora]').forEach(b=>b.classList.toggle('activo',b.dataset.calculadora===tipo));
    const laboral=document.getElementById('calc-laboral-form')?.parentElement;
    const alimentos=document.getElementById('calc-alimentos-panel');
    if(laboral) laboral.style.display='none';
    if(alimentos) alimentos.style.display='none';
    if(pension) pension.style.display='block';
    if(pension && pension.dataset.pensionesInicializadas!=='1') window.renderCalculadoraPensiones?.();
  };
  window.guardarCalculoPensiones=function(){
    if(!window.__ultimoCalculoPensiones){alert('Primero realiza el cálculo.');return;}
    const k='jslt_calculos_pensiones', lista=JSON.parse(localStorage.getItem(k)||'[]');
    lista.unshift(window.__ultimoCalculoPensiones);localStorage.setItem(k,JSON.stringify(lista.slice(0,100)));alert('Cálculo de pensión guardado en el historial local de LegalTech Control.');
  };
  window.renderCalculadoraPensiones = function(){
    const root=document.getElementById('calc-pensiones-panel'); if(!root || root.dataset.pensionesInicializadas==='1')return; root.dataset.pensionesInicializadas='1';
    const year=new Date().getFullYear();
    root.innerHTML=`<div class="pension-shell">
      <div class="pension-header"><div><span class="pension-eyebrow">JS LegalTech Control · CALCULADORAS</span><h3>Calculadora de Pensiones IMSS</h3><p>Motor separado para Ley 73 y Ley 97 · estimación jurídica y actuarial.</p></div><div class="pension-version">Parámetros ${esc(window.JSLT_PENSIONES_CONFIG?.version||'')}</div></div>
      <div class="pension-tabs"><button type="button" class="pension-tab active" data-tab="73">Ley 73</button><button type="button" class="pension-tab" data-tab="97">Ley 97</button><button type="button" class="pension-tab" data-tab="comparador">Comparador 73 vs 97</button></div>
      <section id="pension-tab-73" class="pension-tab-panel active"><form class="mj-card pension-form" id="form-pension-73" onsubmit="event.preventDefault();calcularPensionLey73()"><h4>Régimen Ley 73 · Cesantía / Vejez</h4><p class="pension-help">Promedio salarial de las últimas 250 semanas. El grupo salarial se determina con el salario mínimo de referencia histórico, no con UMA.</p><div class="calc-form-grid">
        <div class="form-group"><label>Semanas reconocidas<input id="p73-semanas" type="number" min="500" step="1" required></label></div>
        <div class="form-group"><label>Edad (años)<input id="p73-edad" type="number" min="60" max="65" step="1" value="60" required></label></div>
        <div class="form-group"><label>Meses adicionales<input id="p73-meses" type="number" min="0" max="11" step="1" value="0"><small>64 años + 6 meses se considera 65.</small></label></div>
        <div class="form-group"><label>Promedio SBC diario últimas 250 semanas<input id="p73-promedio-250" type="number" min="0" step="0.01" required></label></div>
        <div class="form-group"><label>Salario mínimo diario de referencia<input id="p73-smg" type="number" min="0" step="0.01" value="315.04" required><small>No usar UMA para la tabla del art. 167.</small></label></div>
        <div class="form-group"><label>Cónyuge / concubina(o)<select id="p73-conyuge"><option value="1">Sí</option><option value="0">No</option></select></label></div>
        <div class="form-group"><label>Hijos con derecho<input id="p73-hijos" type="number" min="0" step="1" value="0"></label></div>
        <div class="form-group"><label>Padres dependientes<input id="p73-padres" type="number" min="0" step="1" value="0"><small>Se consideran cuando no hay cónyuge/concubina(o) ni hijos con derecho.</small></label></div>
      </div><div class="calc-checks"><label><input id="p73-asistencia-medica" type="checkbox"> Requiere ayuda asistencial por estado físico</label><label>Porcentaje médico (máx. 20%) <input id="p73-asistencia-pct" type="number" min="0" max="20" step="1" value="20"></label></div><button class="btn-primary" type="submit">Calcular Ley 73</button></form><div class="mj-card mj-resultado" id="calc-pensiones-ley73-resultado"><div class="mj-vacio"><span>🧮</span><strong>Captura los datos</strong><p>Se mostrará el cálculo paso a paso, asignaciones, mínimo e incremento de 11%.</p></div></div></section>
      <section id="pension-tab-97" class="pension-tab-panel"><form class="mj-card pension-form" id="form-pension-97" onsubmit="event.preventDefault();calcularPensionLey97()"><h4>Régimen Ley 97 · Cuenta individual</h4><p class="pension-help">La calculadora separa saldo proyectado, renta vitalicia, retiro programado y pensión garantizada.</p><div class="calc-form-grid">
        <div class="form-group"><label>Edad de retiro<input id="p97-edad" type="number" min="40" max="90" step="1" value="60" required></label></div>
        <div class="form-group"><label>Año de retiro<input id="p97-anio" type="number" min="2021" max="2100" step="1" value="${year}"></label></div>
        <div class="form-group"><label>Semanas cotizadas<input id="p97-semanas" type="number" min="0" step="1" required></label></div>
        <div class="form-group"><label>SBC mensual promedio de afiliación<input id="p97-sbc" type="number" min="0" step="0.01" required></label></div>
        <div class="form-group"><label>Saldo actual AFORE<input id="p97-saldo" type="number" min="0" step="0.01" required></label></div>
        <div class="form-group"><label>Aportación mensual futura<input id="p97-aportacion" type="number" min="0" step="0.01" value="0"></label></div>
        <div class="form-group"><label>Meses hasta retiro<input id="p97-meses-proyeccion" type="number" min="0" step="1" value="0"><small>Si ya tiene edad de retiro, puede dejar 0.</small></label></div>
        <div class="form-group"><label>Rendimiento real anual antes de comisión (%)<input id="p97-rendimiento" type="number" step="0.01" value="4"></label></div>
        <div class="form-group"><label>Comisión anual (%)<input id="p97-comision" type="number" min="0" step="0.01" value="0.57"></label></div>
        <div class="form-group"><label>Densidad de cotización (%)<input id="p97-densidad" type="number" min="0" max="100" step="0.01" value="100"></label></div>
        <div class="form-group"><label>Salario mínimo diario<input id="p97-smg" type="number" min="0" step="0.01" value="315.04"></label></div>
        <div class="form-group"><label>UMA mensual vigente<input id="p97-uma-mensual" type="number" min="0" step="0.01" value="3566.22"><small>Actualizar anualmente.</small></label></div>
        <div class="form-group"><label>Factor INPC tabla art. 170<input id="p97-factor-inpc" type="number" min="0.1" step="0.000001" value="1"><small>Editable; verificar contra INEGI a la fecha de retiro.</small></label></div>
        <div class="form-group"><label>Factor actuarial renta vitalicia<input id="p97-factor-rv" type="number" min="0.0001" step="0.0001" value="20"><small>Parámetro actuarial editable; no es esperanza de vida.</small></label></div>
        <div class="form-group"><label>URV retiro programado<input id="p97-urv" type="number" min="0.0001" step="0.0001" value="20"><small>Parámetro actuarial editable; no es esperanza de vida.</small></label></div>
        <div class="form-group"><label>Prima seguro de sobrevivencia (monto)<input id="p97-seguro-sobrevivencia" type="number" min="0" step="0.01" value="0"></label></div>
      </div><button class="btn-primary" type="submit">Calcular Ley 97</button></form><div class="mj-card mj-resultado" id="calc-pensiones-ley97-resultado"><div class="mj-vacio"><span>📊</span><strong>Captura los datos</strong><p>Se mostrará la proyección y los tres escenarios pensionarios.</p></div></div></section>
      <section id="pension-tab-comparador" class="pension-tab-panel"><div class="mj-card pension-comparator"><h4>Comparador Ley 73 vs Ley 97</h4><p>Realiza primero un cálculo en ambos motores. El comparador toma los últimos resultados guardados en memoria.</p><button type="button" class="btn-primary" id="btn-comparar-pensiones">Comparar escenarios</button><div id="comparador-pensiones-resultado" class="mj-resultado" style="margin-top:16px"><div class="mj-vacio"><span>⚖️</span><strong>Sin comparación</strong><p>Calcula ambos regímenes y después compara.</p></div></div></div></section>
      <div class="pension-disclaimer"><strong>Advertencia profesional:</strong> JS LegalTech Control genera una estimación. La resolución oficial corresponde al IMSS y, en Ley 97, la renta vitalicia depende de la aseguradora y del monto constitutivo. Antes de usar el resultado en demanda, convenio, asesoría o dictamen deben verificarse semanas, salarios, conservación de derechos, beneficiarios, tablas y parámetros actuariales vigentes.</div>
    </div>`;
    root.querySelectorAll('.pension-tab').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('.pension-tab').forEach(x=>x.classList.remove('active'));root.querySelectorAll('.pension-tab-panel').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.getElementById('pension-tab-'+btn.dataset.tab)?.classList.add('active');}));
    const conyuge=document.getElementById('p73-conyuge'); if(conyuge) Object.defineProperty(conyuge,'checked',{get(){return this.value==='1'},set(v){this.value=v?'1':'0'},configurable:true});
    document.getElementById('btn-comparar-pensiones').onclick=()=>{
      const a=window.__ultimoCalculoPensiones?.tipo==='Ley 73'?window.__ultimoCalculoPensiones:null;
      const b=window.__ultimoCalculoPensiones?.tipo==='Ley 97'?window.__ultimoCalculoPensiones:null;
      // Mantener un registro separado porque el último cálculo global sólo contiene una modalidad.
      const l73=window.__ultimoCalculoLey73, l97=window.__ultimoCalculoLey97;
      const x=l73||a, y=l97||b;
      const out=document.getElementById('comparador-pensiones-resultado');
      if(!x||!y){out.innerHTML='<div class="pension-alerta pension-warning"><strong>Faltan cálculos.</strong><p>Realiza primero un cálculo de Ley 73 y otro de Ley 97.</p></div>';return;}
      const p73=x.pensionFinal||0,p97=Math.max(y.rentaVitalicia||0,y.retiroProgramado||0,y.pensionGarantizada||0);
      out.innerHTML=`<div class="calc-resumen"><div><span>Ley 73</span><strong>${new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(p73)}</strong></div><div><span>Ley 97</span><strong>${new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(p97)}</strong></div><div class="total"><span>Diferencia estimada</span><strong>${new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Math.abs(p73-p97))}</strong></div></div><section class="calc-fundamento"><h5>Conclusión</h5><p>${p73>p97?'Con los supuestos capturados, Ley 73 produce una estimación mensual mayor.':'Con los supuestos capturados, Ley 97 produce una estimación mensual mayor.'}</p><p>No se debe concluir la conveniencia jurídica únicamente por el mayor monto: deben revisarse régimen de transición, conservación de derechos, semanas, saldo AFORE, beneficiarios y modalidad pensionaria.</p></section>`;
    };
  };
  const old73=window.calcularPensionLey73, old97=window.calcularPensionLey97;
  window.calcularPensionLey73=function(){old73(); if(window.__ultimoCalculoPensiones?.tipo==='Ley 73')window.__ultimoCalculoLey73=window.__ultimoCalculoPensiones;};
  window.calcularPensionLey97=function(){old97(); if(window.__ultimoCalculoPensiones?.tipo==='Ley 97')window.__ultimoCalculoLey97=window.__ultimoCalculoPensiones;};
})();
