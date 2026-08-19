import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const { PDFDocument, degrees, rgb, StandardFonts } = PDFLib;

const tools = [
  {id:'merge', icon:'⧉', name:'Unisci PDF', desc:'Combina più PDF in un unico documento.', accept:'.pdf'},
  {id:'split', icon:'✂', name:'Dividi PDF', desc:'Separa pagine o intervalli di pagine.', accept:'.pdf'},
  {id:'compress', icon:'⇲', name:'Comprimi PDF', desc:'Riduci le dimensioni rasterizzando le pagine.', accept:'.pdf'},
  {id:'pdfjpg', icon:'▧', name:'PDF in JPG', desc:'Converti le pagine PDF in immagini JPG.', accept:'.pdf'},
  {id:'jpgtopdf', icon:'▣', name:'JPG in PDF', desc:'Crea un PDF partendo dalle tue immagini.', accept:'image/jpeg,image/png,image/webp'},
  {id:'rotate', icon:'↻', name:'Ruota PDF', desc:'Ruota facilmente tutte le pagine.', accept:'.pdf'},
  {id:'protect', icon:'🔒', name:'Proteggi PDF', desc:'Aggiungi una password al documento.', accept:'.pdf'},
  {id:'unlock', icon:'🔓', name:'Sblocca PDF', desc:'Rimuovi una password quando autorizzato.', accept:'.pdf'},
  {id:'number', icon:'#', name:'Numeri di pagina', desc:'Inserisci numeri di pagina nel PDF.', accept:'.pdf'},
  {id:'watermark', icon:'◇', name:'Filigrana', desc:'Aggiungi testo come filigrana.', accept:'.pdf'},
  {id:'extract', icon:'⇱', name:'Estrai pagine', desc:'Crea un nuovo PDF con pagine selezionate.', accept:'.pdf'},
  {id:'organize', icon:'☷', name:'Organizza PDF', desc:'Riordina le pagine indicando il nuovo ordine.', accept:'.pdf'}
];

const $ = s => document.querySelector(s);
const grid=$('#toolsGrid'), search=$('#toolSearch'), count=$('#toolCount'), modal=$('#toolModal'), fileInput=$('#fileInput'), dropzone=$('#dropzone'), fileList=$('#fileList'), processBtn=$('#processBtn'), statusText=$('#statusText'), toolOptions=$('#toolOptions');
let selectedTool=null, files=[];

function render(filter=''){
  const q=filter.trim().toLowerCase();
  const shown=tools.filter(t=>`${t.name} ${t.desc}`.toLowerCase().includes(q));
  count.textContent=`${shown.length} strumenti`;
  grid.innerHTML=shown.length?shown.map(t=>`<button class="tool-card" data-id="${t.id}"><span class="tool-arrow">↗</span><div class="tool-icon">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p></button>`).join(''):`<div class="empty">Nessuno strumento trovato.</div>`;
  document.querySelectorAll('.tool-card').forEach(b=>b.onclick=()=>openTool(b.dataset.id));
}
render(); search.oninput=e=>render(e.target.value);
$('#themeBtn').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('pdf-toolbox-theme',document.body.classList.contains('dark')?'dark':'light')};
if(localStorage.getItem('pdf-toolbox-theme')==='dark') document.body.classList.add('dark');

function optionHtml(id){
  if(['split','extract'].includes(id)) return `<label>Pagine / intervalli<input id="pageSpec" placeholder="es. 1-3,5,8-10"></label>`;
  if(id==='rotate') return `<label>Rotazione<select id="rotation"><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>`;
  if(id==='watermark') return `<label>Testo filigrana<input id="watermarkText" value="CONFIDENTIAL"></label><div class="option-row"><label>Dimensione<input id="watermarkSize" type="number" value="48" min="10" max="120"></label><label>Opacità<input id="watermarkOpacity" type="number" value="0.18" min="0.05" max="1" step="0.05"></label></div>`;
  if(id==='number') return `<div class="option-row"><label>Posizione<select id="numberPos"><option value="bottom">In basso</option><option value="top">In alto</option></select></label><label>Dimensione<input id="numberSize" type="number" value="11" min="6" max="30"></label></div>`;
  if(id==='organize') return `<label>Nuovo ordine pagine<input id="pageOrder" placeholder="es. 3,1,2,4"></label>`;
  if(id==='compress') return `<div class="option-row"><label>Qualità JPG<select id="quality"><option value="0.55">Alta compressione</option><option value="0.72" selected>Bilanciata</option><option value="0.88">Alta qualità</option></select></label><label>Risoluzione<select id="scale"><option value="1">Standard</option><option value="1.4" selected>Buona</option><option value="2">Alta</option></select></label></div><div class="warning-box">La compressione converte ogni pagina in immagine: riduce spesso il peso, ma il testo non rimane selezionabile.</div>`;
  if(['protect','unlock'].includes(id)) return `<div class="warning-box"><strong>Richiede backend.</strong> La versione browser inclusa non cifra/decifra PDF protetti per evitare una funzione solo apparente. L'interfaccia è pronta per collegare un servizio server-side.</div>`;
  return '';
}

function openTool(id){
  selectedTool=tools.find(t=>t.id===id); files=[]; refreshFiles(); fileInput.value=''; fileInput.accept=selectedTool.accept;
  $('#modalIcon').textContent=selectedTool.icon; $('#modalTitle').textContent=selectedTool.name; $('#modalDesc').textContent=selectedTool.desc; toolOptions.innerHTML=optionHtml(id);
  statusText.textContent=['protect','unlock'].includes(id)?'Questa funzione necessita di un backend con supporto crittografico PDF.':'Elaborazione locale nel browser.';
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}
function closeModal(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true');fileInput.value='';files=[];}
$('#modalClose').onclick=closeModal; modal.onclick=e=>{if(e.target===modal) closeModal()};
fileInput.onchange=e=>{files=[...e.target.files];refreshFiles()};
['dragenter','dragover'].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>dropzone.addEventListener(ev,e=>{e.preventDefault();dropzone.classList.remove('drag')}));
dropzone.addEventListener('drop',e=>{files=[...e.dataTransfer.files];refreshFiles()});
function prettySize(b){return b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(1)+' MB'}
function refreshFiles(){fileList.innerHTML=files.map(f=>`<div class="file-item"><span>${f.name}</span><span>${prettySize(f.size)}</span></div>`).join('');processBtn.disabled=!files.length||(['protect','unlock'].includes(selectedTool?.id));}
function downloadBlob(data,name,type='application/pdf'){const blob=data instanceof Blob?data:new Blob([data],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
async function ab(file){return await file.arrayBuffer()}
function parsePageSpec(spec,max){
  if(!spec.trim()) return [...Array(max)].map((_,i)=>i);
  const out=[];
  for(const part of spec.split(',')){const p=part.trim();if(!p)continue;if(p.includes('-')){let [a,b]=p.split('-').map(Number);if(!a||!b)throw Error('Intervallo non valido');if(a>b)[a,b]=[b,a];for(let i=a;i<=b;i++)out.push(i-1)}else{const n=Number(p);if(!n)throw Error('Pagina non valida');out.push(n-1)}}
  if(out.some(i=>i<0||i>=max)) throw Error(`Le pagine devono essere tra 1 e ${max}`); return out;
}

processBtn.onclick=async()=>{
  if(!files.length)return; processBtn.disabled=true; statusText.textContent='Elaborazione in corso...';
  try{
    const id=selectedTool.id;
    if(id==='merge') await mergePDFs(); else if(id==='split') await splitPDF(); else if(id==='extract') await extractPDF(); else if(id==='rotate') await rotatePDF(); else if(id==='watermark') await watermarkPDF(); else if(id==='number') await numberPDF(); else if(id==='organize') await organizePDF(); else if(id==='jpgtopdf') await imagesToPdf(files); else if(id==='pdfjpg') await pdfToJpg(); else if(id==='compress') await compressPDF();
    statusText.textContent='Operazione completata.';
  }catch(err){console.error(err);statusText.textContent='Errore: '+(err.message||'operazione non riuscita');}
  finally{processBtn.disabled=false;}
};

async function mergePDFs(){const out=await PDFDocument.create();for(const f of files){const src=await PDFDocument.load(await ab(f));const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p))}downloadBlob(await out.save(),'pdf-uniti.pdf')}
async function extractPDF(){const src=await PDFDocument.load(await ab(files[0]));const idx=parsePageSpec($('#pageSpec').value,src.getPageCount());const out=await PDFDocument.create();(await out.copyPages(src,idx)).forEach(p=>out.addPage(p));downloadBlob(await out.save(),'pagine-estratte.pdf')}
async function splitPDF(){const src=await PDFDocument.load(await ab(files[0]));const idx=parsePageSpec($('#pageSpec').value,src.getPageCount());for(const i of idx){const out=await PDFDocument.create();const [p]=await out.copyPages(src,[i]);out.addPage(p);downloadBlob(await out.save(),`pagina-${i+1}.pdf`)}}
async function rotatePDF(){const doc=await PDFDocument.load(await ab(files[0]));const add=Number($('#rotation').value);doc.getPages().forEach(p=>p.setRotation(degrees((p.getRotation().angle+add)%360)));downloadBlob(await doc.save(),'pdf-ruotato.pdf')}
async function watermarkPDF(){const doc=await PDFDocument.load(await ab(files[0]));const font=await doc.embedFont(StandardFonts.HelveticaBold);const text=$('#watermarkText').value||'CONFIDENTIAL';const size=Number($('#watermarkSize').value)||48;const opacity=Number($('#watermarkOpacity').value)||.18;doc.getPages().forEach(p=>{const {width,height}=p.getSize();const tw=font.widthOfTextAtSize(text,size);p.drawText(text,{x:(width-tw)/2,y:height/2,size,font,color:rgb(.45,.45,.45),opacity,rotate:degrees(35)})});downloadBlob(await doc.save(),'pdf-filigrana.pdf')}
async function numberPDF(){const doc=await PDFDocument.load(await ab(files[0]));const font=await doc.embedFont(StandardFonts.Helvetica);const size=Number($('#numberSize').value)||11;const top=$('#numberPos').value==='top';doc.getPages().forEach((p,i)=>{const t=String(i+1),{width,height}=p.getSize(),tw=font.widthOfTextAtSize(t,size);p.drawText(t,{x:(width-tw)/2,y:top?height-25:18,size,font,color:rgb(.2,.2,.2)})});downloadBlob(await doc.save(),'pdf-numerato.pdf')}
async function organizePDF(){const src=await PDFDocument.load(await ab(files[0]));const raw=$('#pageOrder').value.trim();if(!raw)throw Error('Inserisci il nuovo ordine delle pagine');const idx=raw.split(',').map(x=>Number(x.trim())-1);if(idx.some(i=>i<0||i>=src.getPageCount()||Number.isNaN(i)))throw Error(`Usa numeri da 1 a ${src.getPageCount()}`);const out=await PDFDocument.create();(await out.copyPages(src,idx)).forEach(p=>out.addPage(p));downloadBlob(await out.save(),'pdf-organizzato.pdf')}
async function imagesToPdf(imgFiles){const {jsPDF}=window.jspdf;let pdf=null;for(let i=0;i<imgFiles.length;i++){const file=imgFiles[i],data=await readAsDataURL(file),dims=await getImageDimensions(data),land=dims.width>=dims.height,w=land?297:210,h=land?210:297;if(!pdf)pdf=new jsPDF({orientation:land?'landscape':'portrait',unit:'mm',format:'a4'});else pdf.addPage('a4',land?'landscape':'portrait');const ratio=Math.min(w/dims.width,h/dims.height),iw=dims.width*ratio,ih=dims.height*ratio;pdf.addImage(data,file.type.includes('png')?'PNG':'JPEG',(w-iw)/2,(h-ih)/2,iw,ih)}pdf.save('immagini-convertite.pdf')}
async function pdfToJpg(){const data=new Uint8Array(await ab(files[0]));const pdf=await pdfjsLib.getDocument({data}).promise;for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),vp=page.getViewport({scale:1.8}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));downloadBlob(blob,`pagina-${n}.jpg`,'image/jpeg')}}
async function compressPDF(){const data=new Uint8Array(await ab(files[0]));const pdf=await pdfjsLib.getDocument({data}).promise;const {jsPDF}=window.jspdf;const quality=Number($('#quality').value),scale=Number($('#scale').value);let out=null;for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),vp=page.getViewport({scale}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;const img=c.toDataURL('image/jpeg',quality),land=vp.width>=vp.height,w=land?297:210,h=land?210:297;if(!out)out=new jsPDF({orientation:land?'landscape':'portrait',unit:'mm',format:'a4',compress:true});else out.addPage('a4',land?'landscape':'portrait');const r=Math.min(w/vp.width,h/vp.height),iw=vp.width*r,ih=vp.height*r;out.addImage(img,'JPEG',(w-iw)/2,(h-ih)/2,iw,ih,undefined,'FAST')}out.save('pdf-compresso.pdf')}
function readAsDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function getImageDimensions(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res({width:i.naturalWidth,height:i.naturalHeight});i.onerror=rej;i.src=src})}
