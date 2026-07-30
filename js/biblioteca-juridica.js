(() => {
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let catalogo=[];
function normal(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function init(){
  catalogo=(window.CATALOGO_PLANTILLAS_BASE||[]).map(x=>({...x,submateria:x.submateria||x.etapa,origen:x.origen||"Biblioteca del sistema",revision:x.revision!==false}));
  llenarFiltros(); render();
}
function opciones(id,valores,placeholder){const s=$(id);if(!s)return;s.innerHTML=`<option value="">${placeholder}</option>`+[...new Set(valores.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es")).map(v=>`<option>${esc(v)}</option>`).join("");}
function llenarFiltros(){opciones("bib-materia",catalogo.map(x=>x.materia),"Todas las materias");opciones("bib-etapa",catalogo.map(x=>x.etapa),"Todas las etapas");}
function filtrados(){const q=normal($("bib-buscar")?.value),m=$("bib-materia")?.value||"",e=$("bib-etapa")?.value||"";return catalogo.filter(x=>(!m||x.materia===m)&&(!e||x.etapa===e)&&(!q||normal(`${x.nombre} ${x.materia} ${x.etapa} ${x.submateria}`).includes(q)));}
function render(){const items=filtrados(),c=$("biblioteca-resultados"),n=$("bib-contador");if(n)n.textContent=`${items.length} plantilla${items.length===1?"":"s"}`;if(!c)return;if(!items.length){c.innerHTML='<div class="bib-vacio">No se encontraron plantillas con esos filtros.</div>';return;}c.innerHTML=items.map(x=>`<article class="bib-card"><div class="bib-card-top"><span class="bib-materia">${esc(x.materia)}</span><span class="bib-etapa">${esc(x.etapa)}</span></div><h4>${esc(x.nombre)}</h4><p>${esc(x.submateria||x.etapa)} · Plantilla estructural editable</p><div class="bib-aviso">Requiere revisión profesional antes de su uso.</div><div class="bib-acciones"><button class="btn-primary" onclick="usarPlantillaBiblioteca('${esc(x.id)}')">Usar plantilla</button><button class="btn-secundario" onclick="verFichaPlantilla('${esc(x.id)}')">Ver ficha</button></div></article>`).join("");}
window.filtrarBibliotecaJuridica=render;
window.limpiarFiltrosBiblioteca=()=>{if($("bib-buscar"))$("bib-buscar").value="";if($("bib-materia"))$("bib-materia").value="";if($("bib-etapa"))$("bib-etapa").value="";render();};
window.usarPlantillaBiblioteca=id=>{sessionStorage.setItem("jslt_plantilla_pendiente",id);window.switchTab?.("constructor-documentos");setTimeout(()=>window.nuevoDocumentoJuridico?.(),80);};
window.verFichaPlantilla=id=>{const x=catalogo.find(i=>i.id===id);if(!x)return;alert(`${x.nombre}\n\nMateria: ${x.materia}\nEtapa: ${x.etapa}\nSubmateria: ${x.submateria||x.etapa}\nOrigen: ${x.origen}\n\nContenido: estructura general sin hechos, artículos ni datos particulares.\nRevisión jurídica obligatoria antes de presentar.`);};
document.addEventListener("DOMContentLoaded",()=>{init();["bib-buscar","bib-materia","bib-etapa"].forEach(id=>$(id)?.addEventListener(id==="bib-buscar"?"input":"change",render));});
})();
