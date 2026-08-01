/** Generadores profesionales reutilizables de reportes LexGear. */
(function(){"use strict";
const C={azul:"#17365d",oro:"#c59a2d",texto:"#1f2937",gris:"#64748b",borde:"#cbd5e1"};
const esc=s=>String(s??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const clean=s=>String(s||"Reporte").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");
function prepararContenido(elementoId){
 const src=document.getElementById(elementoId); if(!src)return null;
 const clon=src.cloneNode(true);
 clon.querySelectorAll('button,.calc-acciones,.cj-acciones,.reporte-solo-pantalla,[data-no-export],.cc-aviso,.configuracion-aviso,.cj-alerta,.calc-links').forEach(x=>x.remove());
 clon.querySelectorAll('input,textarea,select').forEach(el=>{
   const span=document.createElement('span');
   span.textContent=el.tagName==='SELECT'?(el.selectedOptions?.[0]?.textContent||''):el.value;
   span.style.whiteSpace='pre-wrap'; el.replaceWith(span);
 });
 return clon;
}
function leerConfiguracionReporte(){
 try{return JSON.parse(localStorage.getItem("js_legal_configuracion")||"{}")}catch(_){return {}}
}
function crearDocumento(titulo,elementoId,meta={}){
 const clon=prepararContenido(elementoId); if(!clon)return null;
 const fecha=new Date(), cfg=leerConfiguracionReporte();
 const documento=document.createElement('div');
 const logoUrl=new URL('img/logo-js-legal.png',window.location.href).href;
 const responsable=cfg.responsable||'Mtro. Jorge Sánchez Flores';
 const despacho=cfg.despachoNombre||'JS Legal & Ingeniería — Despacho Jurídico';
 const contacto=[cfg.correo,cfg.telefono].filter(Boolean).join(' · ');
 documento.style.cssText='position:fixed;left:0;top:0;width:760px;padding:12px 18px 28px;background:#fff;color:#1f2937;font:13px Arial,Helvetica,sans-serif;z-index:2147483647;pointer-events:none;';
 documento.innerHTML=`<header style="text-align:center;margin-bottom:20px"><img src="${esc(logoUrl)}" alt="Logotipo" style="max-width:220px;max-height:86px;object-fit:contain;margin:0 auto 10px;display:block"><div style="height:3px;background:${C.oro};margin:0 0 13px"></div><div style="color:${C.azul};font-size:22px;font-weight:900;letter-spacing:.3px">REPORTE EJECUTIVO</div><div style="color:${C.oro};font-size:15px;font-weight:800;margin-top:4px">${esc(String(titulo).toUpperCase())}</div>${meta.referencia?`<div style="color:${C.gris};font-size:12px;margin-top:5px">${esc(meta.referencia)}</div>`:''}</header><table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:13px"><tr><td style="width:31%;padding:10px 12px;background:${C.azul};color:#fff;font-weight:800;border:1px solid ${C.borde}">FECHA DE EMISIÓN</td><td style="padding:10px 12px;border:1px solid ${C.borde};font-weight:700">${esc(fecha.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}))}</td></tr><tr><td style="padding:10px 12px;background:${C.azul};color:#fff;font-weight:800;border:1px solid ${C.borde}">HORA DE EMISIÓN</td><td style="padding:10px 12px;border:1px solid ${C.borde};font-weight:700">${esc(fecha.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}))}</td></tr><tr><td style="padding:10px 12px;background:${C.azul};color:#fff;font-weight:800;border:1px solid ${C.borde}">DOCUMENTO</td><td style="padding:10px 12px;border:1px solid ${C.borde};font-weight:700">${esc(titulo)}</td></tr><tr><td style="padding:10px 12px;background:${C.azul};color:#fff;font-weight:800;border:1px solid ${C.borde}">REFERENCIA</td><td style="padding:10px 12px;border:1px solid ${C.borde};font-weight:700">${esc(meta.referencia||'LexGear')}</td></tr></table><div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;padding-bottom:7px;border-bottom:2px solid ${C.oro}"><span style="color:${C.oro};font-size:21px;font-weight:900">I.</span><span style="color:${C.azul};font-size:18px;font-weight:900">${esc(String(titulo).toUpperCase())}</span></div><div id="reporte-contenido"></div><footer style="margin-top:26px;padding-top:10px;border-top:2px solid ${C.oro};color:${C.gris};font-size:10px"><div style="text-align:center;color:${C.azul};font-weight:800">${esc(responsable)} | Abogado Postulante</div><div style="display:flex;justify-content:space-between;gap:16px;margin-top:5px"><span>${esc(contacto)}</span><span>${esc(despacho)}</span></div></footer>`;
 const box=documento.querySelector('#reporte-contenido'); box.appendChild(clon);
 box.querySelectorAll('*').forEach(el=>{el.style.maxWidth='100%'; if(el.tagName==='TABLE'){el.style.width='100%';el.style.borderCollapse='collapse';} if(['TD','TH'].includes(el.tagName)){el.style.border='1px solid #cbd5e1';el.style.padding='7px';}});
 return documento;
}
window.generarReporteLexGear=async function(titulo,elementoId,meta={}){
 const documento=crearDocumento(titulo,elementoId,meta); if(!documento){alert("No se encontró el contenido del reporte.");return;}
 if(typeof html2canvas==="undefined"||!window.jspdf?.jsPDF){alert("No se cargaron las librerías para generar PDF.");return;}
 document.body.appendChild(documento);
 try{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); const canvas=await html2canvas(documento,{scale:2,useCORS:true,backgroundColor:'#fff',logging:false,windowWidth:820}); const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'letter'}); const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),mx=10,top=15,bottom=15,uw=pw-2*mx,uh=ph-top-bottom,ih=canvas.height*uw/canvas.width,total=Math.max(1,Math.ceil(ih/uh)),img=canvas.toDataURL('image/jpeg',.96); for(let pg=0;pg<total;pg++){if(pg)pdf.addPage();pdf.addImage(img,'JPEG',mx,top-pg*uh,uw,ih,undefined,'FAST');pdf.setFillColor(255,255,255);pdf.rect(0,0,pw,top-1,'F');pdf.rect(0,ph-bottom,pw,bottom,'F');pdf.setFontSize(8);pdf.setTextColor(100);pdf.text(`${titulo}`,mx,ph-7);pdf.text(`pág. ${pg+1} de ${total}`,pw-mx,ph-7,{align:'right'});} pdf.save(`${clean(titulo)}.pdf`);
 }catch(e){console.error(e);alert('No fue posible generar el PDF.');}finally{documento.remove();}
};
window.generarWordLexGear=function(titulo,elementoId,meta={}){
 const documento=crearDocumento(titulo,elementoId,meta); if(!documento){alert("No se encontró el contenido del reporte.");return;}
 documento.style.cssText='width:auto;padding:24px;background:#fff;color:#1f2937;font:11pt Arial,Helvetica,sans-serif;';
 const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>@page{size:letter;margin:2cm}body{font-family:Arial,sans-serif;font-size:11pt;color:#1f2937}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:7px}h1,h2,h3,h4,h5{color:#17365d}p{line-height:1.45}</style></head><body>${documento.innerHTML}</body></html>`;
 const blob=new Blob(['\ufeff',html],{type:'application/msword'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${clean(titulo)}.doc`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
})();
