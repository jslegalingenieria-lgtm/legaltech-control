const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function legaltechFunctionUrl(name){const projectId=window.FIREBASE_CONFIG?.projectId||'legaltech-app';return `https://us-central1-${projectId}.cloudfunctions.net/${name}`;}
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function loadScript(src, globalName){
  if(window[globalName]) return Promise.resolve();
  return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error('No se pudo cargar '+src));document.head.appendChild(s);});
}
function detectarOrdenamientos(texto){
  const rules=[
    ['CNPCF',/\b(?:CNPCF|Código Nacional de Procedimientos Civiles y Familiares)\b/ig],
    ['CPCEJ',/\b(?:CPCEJ|Código de Procedimientos Civiles del Estado de Jalisco|Código de Procedimientos Civiles de Jalisco)\b/ig],
    ['CCEJ',/\b(?:CCEJ|Código Civil del Estado de Jalisco)\b/ig],
    ['Código de Comercio',/\b(?:Código de Comercio|CCom)\b/ig],
    ['Ley Federal del Trabajo',/\b(?:Ley Federal del Trabajo|LFT)\b/ig],
    ['Constitución Política de los Estados Unidos Mexicanos',/\b(?:Constitución Política de los Estados Unidos Mexicanos|Constitución Federal|CPEUM)\b/ig],
    ['Ley de Amparo',/\b(?:Ley de Amparo)\b/ig],
    ['Código Civil Federal',/\b(?:Código Civil Federal|CCF)\b/ig],
    ['Código Nacional de Procedimientos Penales',/\b(?:Código Nacional de Procedimientos Penales|CNPP)\b/ig],
    ['Ley General de Responsabilidades Administrativas',/\b(?:Ley General de Responsabilidades Administrativas|LGRA)\b/ig]
  ];
  const found=[]; for(const [name,re] of rules) if(re.test(texto)) found.push(name); return found;
}
function revisarDeterminista(texto, ordenamientos){
  const findings=[]; const lines=String(texto).split(/\n/); const add=(line,title,body)=>findings.push({line:Math.max(0,Math.min(lines.length-1,line)),title,body});
  lines.forEach((line,i)=>{
    const placeholders=line.match(/\{\{[^}]+\}\}|\[\[?\s*(?:NOMBRE|FECHA|DOMICILIO|EXPEDIENTE|JUZGADO|ACTOR|DEMANDADO)[^\]]*\]\]?/ig);
    if(placeholders) add(i,'Posible campo de plantilla sin completar',`Se detectó el marcador “${placeholders[0]}”. Confirme si debe sustituirse antes de presentar el escrito.`);
  });
  const arts=[...String(texto).matchAll(/\b(?:art[ií]culo|arts?\.?|numeral(?:es)?)\s*(\d+[a-z]?(?:\s*(?:bis|ter|qu[aá]ter))?)/ig)];
  if(arts.length && !ordenamientos.length){
    const first=arts[0]; const line=String(texto).slice(0,first.index).split('\n').length-1;
    add(line,'Cita normativa sin ordenamiento identificable','Se detectó una referencia a un artículo, pero no se identificó con suficiente certeza el ordenamiento al que pertenece. Verifique el fundamento.');
  }
  const hasCNPCF=/\b(?:CNPCF|Código Nacional de Procedimientos Civiles y Familiares)\b/i.test(texto);
  const hasCPCEJ=/\b(?:CPCEJ|Código de Procedimientos Civiles del Estado de Jalisco|Código de Procedimientos Civiles de Jalisco)\b/i.test(texto);
  if(hasCNPCF&&hasCPCEJ){
    const line=lines.findIndex(l=>/CNPCF|Código Nacional de Procedimientos Civiles y Familiares|CPCEJ|Código de Procedimientos Civiles/i.test(l));
    add(line,'Posible mezcla de regímenes procesales','El escrito menciona CNPCF y CPCEJ. No necesariamente es incorrecto, pero debe comprobarse cuál régimen corresponde al asunto y si las referencias a ambos se justifican por las reglas transitorias.');
  }
  return {findings,ordenamientos,lines};
}
function xmlText(s){return esc(s).replace(/\r/g,'').replace(/\n/g,' ');}
function xmlDecode(s){return String(s||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&amp;/g,'&');}
function paragraphText(xml){return [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m=>xmlDecode(m[1])).join('');}
function insertCommentIntoParagraph(pxml,id){
  const start=`<w:commentRangeStart w:id="${id}"/>`, end=`<w:commentRangeEnd w:id="${id}"/><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="${id}"/></w:r>`;
  // Preserve paragraph properties in their required first-child position.
  const pPr=pxml.match(/^<w:p\b[^>]*>(\s*<w:pPr\b[\s\S]*?<\/w:pPr>)/);
  if(pPr) pxml=pxml.replace(pPr[1],pPr[1]+start); else pxml=pxml.replace(/^(<w:p\b[^>]*>)/,`$1${start}`);
  return pxml.replace(/<\/w:p>$/,`${end}</w:p>`);
}
async function generarDocx(texto, findings, filename, originalArrayBuffer=null){
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js','JSZip');
  let zip, docXml='', commentsXml='', relsXml='', typesXml='';
  if(originalArrayBuffer){
    // DOCX: modify the original package in-place so page layout, headers, footers,
    // tables, numbering, images, styles and existing relationships remain intact.
    zip=await window.JSZip.loadAsync(originalArrayBuffer);
    const docFile=zip.file('word/document.xml'); if(!docFile) throw new Error('El DOCX no contiene word/document.xml.');
    docXml=await docFile.async('string');
    const commentsFile=zip.file('word/comments.xml');
    commentsXml=commentsFile?await commentsFile.async('string'):'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"> </w:comments>';
    const relFile=zip.file('word/_rels/document.xml.rels');
    relsXml=relFile?await relFile.async('string'):'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
    typesXml=await zip.file('[Content_Types].xml').async('string');
    const existingIds=[...commentsXml.matchAll(/<w:comment\b[^>]*w:id="(\d+)"/g)].map(m=>Number(m[1])); let nextId=existingIds.length?Math.max(...existingIds)+1:0;
    const paras=[...docXml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)].map(m=>({xml:m[0],index:m.index,text:paragraphText(m[0])}));
    const used=new Set(); const comments=[]; const replacements=[];
    for(const f of findings){
      const target=String(f.anchorText||f.fragment||'').trim();
      let para=paras.find((p,i)=>!used.has(i)&&target&&norm(p.text).includes(norm(target).slice(0,Math.min(90,norm(target).length))));
      if(!para && f.lineText) para=paras.find((p,i)=>!used.has(i)&&norm(p.text).includes(norm(f.lineText).slice(0,Math.min(90,norm(f.lineText).length))));
      if(!para) continue; const pi=paras.indexOf(para); used.add(pi); const id=nextId++;
      replacements.push({start:para.index,end:para.index+para.xml.length,xml:insertCommentIntoParagraph(para.xml,id)});
      comments.push(`<w:comment w:id="${id}" w:author="LegalTech Control · Revisor Jurídico" w:initials="LT" w:date="${new Date().toISOString().replace(/\.\d{3}Z$/,'Z')}"><w:p><w:pPr><w:pStyle w:val="CommentText"/></w:pPr><w:r><w:t>${xmlText(f.title+': '+f.body)}</w:t></w:r></w:p></w:comment>`);
    }
    for(const r of replacements.sort((a,b)=>b.start-a.start)) docXml=docXml.slice(0,r.start)+r.xml+docXml.slice(r.end);
    if(comments.length){commentsXml=commentsXml.replace(/<\/w:comments>\s*$/,comments.join('')+'</w:comments>');zip.file('word/comments.xml',commentsXml);
      if(!/relationships\/comments/.test(relsXml)){const ids=[...relsXml.matchAll(/\bId="rId(\d+)"/g)].map(m=>Number(m[1]));const rid='rId'+(ids.length?Math.max(...ids)+1:1);relsXml=relsXml.replace('</Relationships>',`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/></Relationships>`);zip.file('word/_rels/document.xml.rels',relsXml);}
      if(!/comments\.xml/.test(typesXml)) typesXml=typesXml.replace('</Types>','<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/></Types>');
      zip.file('[Content_Types].xml',typesXml);
    }
    // If findings exist but none can be anchored, do not claim a reviewed document was created.
    if(findings.length && !comments.length) throw new Error('Se detectaron observaciones, pero no fue posible vincularlas con párrafos del Word original. No se generó una copia engañosa; verifica la extracción del texto.');
    zip.file('word/document.xml',docXml);
  } else {
    // PDF/TXT/HTML: the original visual layout is not available as editable Word structure.
    // Rebuild with page margins, readable typography and detected headings; PDF page breaks are
    // represented by blank separators when extraction supplies them.
    zip=new window.JSZip(); const lines=String(texto).replace(/\r/g,'').split('\n');
    const byLine=new Map(); findings.forEach((f,i)=>{if(!byLine.has(f.line))byLine.set(f.line,[]);byLine.get(f.line).push({...f,id:i});});
    const paras=lines.map((line,i)=>{const fs=byLine.get(i)||[];let pPr='';if(!line.trim())return '<w:p/>';if(line.trim().length<100&&(/^(?:EXPEDIENTE|ASUNTO|C\.?\s*\w+|[IVX]+\.|PRIMERO\.?|SEGUNDO\.?|TERCERO\.?|ANTECEDENTES|HECHOS|DERECHO|PETICIONES|PUNTOS PETITORIOS|PROTESTO)/i.test(line.trim())))pPr='<w:pPr><w:keepNext/><w:spacing w:before="160" w:after="100"/><w:rPr><w:b/></w:rPr></w:pPr>';let inner=`<w:r><w:t xml:space="preserve">${xmlText(line)}</w:t></w:r>`;if(fs.length){inner=fs.map(f=>`<w:commentRangeStart w:id="${f.id}"/>`).join('')+inner+fs.map(f=>`<w:commentRangeEnd w:id="${f.id}"/><w:r><w:commentReference w:id="${f.id}"/></w:r>`).join('');}return `<w:p>${pPr}${inner}</w:p>`;}).join('');
    const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${paras}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const comments=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${findings.map(f=>`<w:comment w:id="${f.id}" w:author="LegalTech Control · Revisor Jurídico" w:initials="LT" w:date="${new Date().toISOString().replace(/\.\d{3}Z$/,'Z')}"><w:p><w:r><w:t>${xmlText(f.title+': '+f.body)}</w:t></w:r></w:p></w:comment>`).join('')}</w:comments>`;
    zip.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
    zip.folder('_rels').file('.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);zip.folder('word').file('document.xml',doc);zip.folder('word').file('comments.xml',comments);zip.folder('word').file('styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="CommentText"><w:name w:val="comment text"/></w:style></w:styles>`);zip.folder('word').folder('_rels').file('document.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdComments" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  }
  const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);return findings.length;
}
async function verificarArticulos(texto, ordenamientos){
  const maps={'CNPCF':'CNPCF','Código Civil Federal':'CCF','Código de Comercio':'Comercio','Ley Federal del Trabajo':'LFT','Ley de Amparo':'Amparo','Constitución Política de los Estados Unidos Mexicanos':'Constitucion','Código Nacional de Procedimientos Penales':'CNPP','Ley General de Responsabilidades Administrativas':'LGRA','CPCEJ':'CPCEJ','CCEJ':'CCEJ'};
  const aliases={
    'CNPCF':/\b(?:CNPCF|Código Nacional de Procedimientos Civiles y Familiares)\b/i,
    'CPCEJ':/\b(?:CPCEJ|Código de Procedimientos Civiles del Estado de Jalisco|Código de Procedimientos Civiles de Jalisco)\b/i,
    'CCEJ':/\b(?:CCEJ|Código Civil del Estado de Jalisco)\b/i,
    'Código de Comercio':/\b(?:Código de Comercio|CCom)\b/i,
    'Ley Federal del Trabajo':/\b(?:Ley Federal del Trabajo|LFT)\b/i,
    'Constitución Política de los Estados Unidos Mexicanos':/\b(?:Constitución Política de los Estados Unidos Mexicanos|Constitución Federal|CPEUM)\b/i,
    'Ley de Amparo':/\bLey de Amparo\b/i,
    'Código Civil Federal':/\b(?:Código Civil Federal|CCF)\b/i,
    'Código Nacional de Procedimientos Penales':/\b(?:Código Nacional de Procedimientos Penales|CNPP)\b/i,
    'Ley General de Responsabilidades Administrativas':/\b(?:Ley General de Responsabilidades Administrativas|LGRA)\b/i
  };
  const source=String(texto||'');
  const citations=[...source.matchAll(/\b(?:art[ií]culo|arts?\.?|numeral(?:es)?)\s*(\d+[a-z]?(?:-[a-z])?(?:\s*(?:bis|ter|quáter))?)/ig)];
  if(!citations.length) return {checked:0,findings:[],skipped:0,unavailable:0};
  const mentions=[];
  for(const law of ordenamientos){const base=aliases[law];if(!base)continue;const re=new RegExp(base.source,base.flags.includes('g')?base.flags:base.flags+'g');for(const m of source.matchAll(re))mentions.push({law,index:m.index});}
  const assigned=citations.map(c=>{
    let law=null;
    if(ordenamientos.length===1) law=ordenamientos[0];
    else {
      const nearby=mentions.filter(m=>Math.abs(m.index-c.index)<=260).sort((a,b)=>Math.abs(a.index-c.index)-Math.abs(b.index-c.index));
      if(nearby.length===1 || (nearby.length>1 && Math.abs(nearby[0].index-c.index)+35<Math.abs(nearby[1].index-c.index))) law=nearby[0].law;
    }
    return {citation:c,number:c[1].replace(/\s+/g,' ').trim(),law};
  });
  const groups=new Map();
  for(const item of assigned){if(!item.law||!maps[item.law])continue;const key=item.law+'|'+item.number;if(!groups.has(key))groups.set(key,{law:item.law,number:item.number,citation:item.citation});}
  const extraFindings=[];let checked=0,unavailable=0;
  try{
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','pdfjsLib');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }catch(e){return {checked:0,findings:[],skipped:assigned.filter(x=>!x.law||!maps[x.law]).length,unavailable:groups.size};}
  const pdfCache=new Map();
  for(const item of groups.values()){
    let normalized=pdfCache.get(item.law);
    if(!normalized){
      try{
        const response=await fetch(`${legaltechFunctionUrl("getNormativePdf")}?key=${encodeURIComponent(maps[item.law])}`);
        if(!response.ok)throw new Error('Fuente no disponible');
        const buf=await response.arrayBuffer();const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;let normative='';
        for(let n=1;n<=pdf.numPages;n++){const pg=await pdf.getPage(n);const tc=await pg.getTextContent();normative+=' '+tc.items.map(x=>x.str).join(' ');}
        normalized=norm(normative).replace(/\s+/g,' ');pdfCache.set(item.law,normalized);
      }catch(e){unavailable++;continue;}
    }
    checked++;
    const number=norm(item.number).replace(/\s+/g,' ').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    // Only count a citation as located when it resembles an article heading, not merely a cross-reference in another provision.
    const heading=new RegExp('\\barticulo\\s+'+number+'(?:\\s*(?:o|º|°))?\\s*(?:\\.|:|[-–—])','i');
    if(!heading.test(normalized)){
      const line=source.slice(0,item.citation.index).split('\n').length-1;const lines=source.split('\n');
      extraFindings.push({line,title:'Cita no localizada como encabezado en la fuente consultada',body:`No se localizó un encabezado de artículo ${item.number} en el texto extraído de ${item.law}. Esto no demuestra que el artículo sea inexistente: verifique versión, reformas, numeración y extracción de la fuente oficial.`,fragment:lines[line]||''});
    }
  }
  return {checked,findings:extraFindings,skipped:assigned.filter(x=>!x.law||!maps[x.law]).length,unavailable};
}

export function renderRevisorJuridico(){
 const content=document.getElementById('revisor-juridico-root'); if(!content)return;
 content.innerHTML=`<section class="module-header"><div><h2>Revisor Jurídico</h2><p>Carga un escrito y recibe una copia Word con comentarios únicamente en los puntos que requieren revisión.</p></div></section><section class="rj-panel rj-one-click"><div class="form-group"><label for="rj-archivo">Documento Word o PDF</label><input id="rj-archivo" type="file" accept=".docx,.pdf,.txt,.html,.htm,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html"><small>El archivo original no se modifica. Los PDF se convierten a Word reconstruyendo el texto; el diseño de página puede variar.</small></div><div class="form-group"><label for="rj-documento">Texto extraído (puedes corregirlo si la importación lo requiere)</label><textarea id="rj-documento" rows="18" placeholder="Selecciona un documento para extraer su texto…"></textarea></div><button class="btn-primary" id="rj-iniciar" type="button">Iniciar revisión jurídica</button><p id="rj-estado" role="status" aria-live="polite">Elige un archivo para comenzar.</p><div id="rj-resumen" class="rj-summary" hidden></div><div id="rj-ordenamientos" class="rj-results"></div></section><p class="rj-disclaimer">Motor determinista: detecta marcadores de plantilla, citas sin ordenamiento identificable, posible mezcla CNPCF/CPCEJ y referencias de artículos asociadas con suficiente certeza a fuentes configuradas. La comprobación textual no determina por sí sola vigencia, aplicabilidad ni corrección sustantiva del argumento.</p>`;
 const $=id=>document.getElementById(id); let filename='escrito_revisado.docx'; let originalDocxBuffer=null; let originalDocxText='';
 $('rj-archivo').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;filename=f.name.replace(/\.(pdf|docx?|txt|html?)$/i,'')+'_revisado.docx';$('rj-estado').textContent='Leyendo documento…';try{const name=f.name.toLowerCase();originalDocxBuffer=null;originalDocxText='';if(name.endsWith('.txt'))$('rj-documento').value=await f.text();else if(name.endsWith('.html')||name.endsWith('.htm'))$('rj-documento').value=new DOMParser().parseFromString(await f.text(),'text/html').body.innerText;else if(name.endsWith('.docx')){originalDocxBuffer=await f.arrayBuffer();await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js','mammoth');const r=await window.mammoth.extractRawText({arrayBuffer:originalDocxBuffer.slice(0)});$('rj-documento').value=r.value;originalDocxText=r.value;if(r.messages?.length)$('rj-estado').textContent='Texto extraído; algunos elementos de Word podrían no haberse recuperado.';else $('rj-estado').textContent='Documento leído. Verifica visualmente el texto extraído.';}else if(name.endsWith('.pdf')){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','pdfjsLib');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const pdf=await window.pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;const pages=[];for(let n=1;n<=pdf.numPages;n++){const p=await pdf.getPage(n);const tc=await p.getTextContent();pages.push(tc.items.map(x=>x.str).join(' '));}$('rj-documento').value=pages.join('\n\n');$('rj-estado').textContent=$('rj-documento').value.trim()?'PDF leído; se conservará el texto, no necesariamente el diseño.':'No se extrajo texto; probablemente requiere OCR.';}else throw new Error('Formato no compatible. Usa PDF, DOCX, TXT o HTML.');}catch(err){console.error(err);$('rj-estado').textContent='No se pudo leer el archivo: '+err.message;}});
 $('rj-iniciar').addEventListener('click',async()=>{const text=$('rj-documento').value.trim();if(!text){$('rj-estado').textContent='Primero carga un documento o pega el texto.';return;}const btn=$('rj-iniciar');btn.disabled=true;try{$('rj-estado').textContent='Identificando ordenamientos y comprobaciones…';const ord=detectarOrdenamientos(text);const {findings,lines}=revisarDeterminista(text,ord);$('rj-estado').textContent='Verificando citas contra fuentes normativas disponibles…';const verification=await verificarArticulos(text,ord);findings.push(...verification.findings);findings.forEach(f=>{f.fragment=f.fragment||lines[f.line]||'';f.lineText=lines[f.line]||'';f.anchorText=f.fragment;});$('rj-ordenamientos').innerHTML=`<p><strong>Ordenamientos identificados:</strong> ${ord.length?ord.map(esc).join('; '):'No se identificaron con certeza.'}</p><p><strong>Comentarios incorporados al Word:</strong> ${findings.length}</p>`;$('rj-estado').textContent='Generando copia Word con comentarios…';const added=await generarDocx(text,findings,filename,originalDocxBuffer && text===originalDocxText ? originalDocxBuffer : null);$('rj-estado').textContent=added?`Copia Word generada con ${added} observación(es). Referencias comprobadas: ${verification.checked}; citas omitidas por ambigüedad: ${verification.skipped}; fuentes no disponibles: ${verification.unavailable}. Si el origen era DOCX y no editaste el texto extraído, se conservó su estructura original; en PDF se reconstruyó el formato. El archivo original permanece intacto.`:'Copia Word generada sin comentarios porque las comprobaciones implementadas no detectaron puntos cuestionables. Esto no certifica la corrección jurídica integral. El original permanece intacto.';}catch(err){console.error(err);$('rj-estado').textContent='No se pudo generar el Word: '+err.message;}finally{btn.disabled=false;}});
}


// Exposición para la navegación SPA de LegalTech Control.
window.renderRevisorJuridico = renderRevisorJuridico;
