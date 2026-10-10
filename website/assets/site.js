'use strict';
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Åpne meny');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Lukk meny':'Åpne meny');});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const dialog=document.querySelector('#info-dialog'),content=document.querySelector('#dialog-content');
const panels={
'hungry-launch':['FIX I’M HUNGRY · KOMMER SNART','Gode ting begynner med en idé.','Dette er et konsept og en fungerende nettdemo. Appen er ikke publisert i App Store eller Google Play, og en lanseringsdato er ikke bestemt.','Restaurantene er fiktive. Ingen bestilling, posisjonssporing eller sanntidsdata. Send oss gjerne innspill på e-post.'],
story:['EN IDÉ MED ROM FOR MER','Smarte løsninger. Ett samlingssted.','Fix One er hovedselskapet bak løsningene våre. Vi starter med reelle behov: et hjemmeprosjekt som trenger en plan, en historie som vil bli fortalt, eller et valg som kan gjøres enklere.','Fiks Hjem er løsningen vi utvikler først. Fix Movie og Fix I’m Hungry er ideer vi ønsker å utforske videre. Hver løsning får sitt eget uttrykk – med Fix One som felles utgangspunkt.'],
download:['FIKS HJEM · UNDER UTVIKLING','En god start tar litt omtanke.','Fiks Hjem er ikke lansert i App Store eller Google Play ennå. Vi har ingen bekreftet lanseringsdato, og legger ut ekte nedlastingslenker her når appen er klar.','Du kan allerede prøve materialoverslaget på denne nettsiden. Vil du gi innspill eller spørre om testing? Kontakt oss på e-post.'],
movie:['FIX MOVIE · PÅ IDÉSTADIET','Gi historiene dine plass.','Vi utforsker en løsning for film, ideer og kreativt innhold. Målet er en enklere vei fra tanke til noe du kan vise fram.','Dette er et konsept, ikke en lansert tjeneste. Har du et behov vi bør tenke på? Vi vil gjerne høre fra deg.'],
food:['FIX I’M HUNGRY · PÅ IDÉSTADIET','Litt enklere å velge noe godt.','Vi utforsker hvordan digitale verktøy kan gjøre matvalg og hverdagsplanlegging enklere.','Dette er et konsept. Funksjoner og lansering er ikke bestemt. Del gjerne hva du savner i dag.']};
let opener;
document.querySelectorAll('[data-modal]').forEach(button=>button.addEventListener('click',()=>{const data=panels[button.dataset.modal];if(!data)return;opener=button;content.replaceChildren();const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=data[0];const heading=document.createElement('h2');heading.id='dialog-title';heading.textContent=data[1];content.append(eyebrow,heading);data.slice(2).forEach(text=>{const p=document.createElement('p');p.textContent=text;content.append(p);});dialog.showModal();}));
document.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
dialog?.addEventListener('close',()=>opener?.focus());
const descriptions=[
['Vegg','Start med veggens bredde og høyde. Trekk fra dører og vinduer før du lager din endelige materialliste.'],
['Gulv','Mål rommet og ta hensyn til hjørner, leggemønster og svinn. Et godt underlag er like viktig som overflaten.'],
['Terrasse','Mål uteplassen, planlegg bordretningen og undersøk grunnforholdene. Bærekonstruksjon og rekkverk trenger egne vurderinger.'],
['Dør','Noter karmmål, åpningsretning og veggtykkelse. Endring i bærende vegg må avklares med fagperson.'],
['Vindu','Mål åpningen og planlegg tetting og beslag. Kontroller krav før du endrer fasaden eller lager en ny åpning.'],
['Tak og loft','Start med tilstand, fukt og ventilasjon. Høydearbeid, konstruksjon og brannsikkerhet krever riktig kompetanse.'],
['Trapp','Noter etasjehøyde og tilgjengelig plass. Sjekk krav til trinn, håndløper og rekkverk før du bygger.'],
['Fasade','Vurder underlaget, værbelastning og lufting. Et overslag på flaten er starten; riktig utførelse avgjør levetiden.']];
document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const [title,text]=descriptions[Number(button.dataset.category)];document.querySelector('#category-title').textContent=title;document.querySelector('#category-text').textContent=text;document.querySelector('#category-icon').replaceChildren(button.querySelector('svg').cloneNode(true));}));
const form=document.querySelector('#estimate-form');
if(form){
 const number=new Intl.NumberFormat('nb-NO',{maximumFractionDigits:2});
 const money=new Intl.NumberFormat('nb-NO',{maximumFractionDigits:0});
 const outputs=['area','material','total'].map(id=>document.getElementById(id));
 const copy=document.querySelector('#copy-estimate'),status=document.querySelector('#copy-status');
 function calculate(){status.textContent='';if(!form.checkValidity()){document.querySelector('#estimate-error').textContent='Skriv inn gyldige mål over 0, svinn mellom 0 og 100 og en pris fra 0.';outputs.forEach(o=>o.value='–');copy.disabled=true;return null;}
 const values=Object.fromEntries(new FormData(form));const area=Number(values.length)*Number(values.width);const material=area*(100+Number(values.waste))/100;const total=material*Number(values.price);document.querySelector('#estimate-error').textContent='';outputs[0].value=number.format(area)+' m²';outputs[1].value=number.format(material)+' m²';outputs[2].value=money.format(total)+' kr';copy.disabled=false;return `Fiks Hjem – materialoverslag\nMål: ${values.length} × ${values.width} m\nAreal: ${outputs[0].value}\nSvinn: ${values.waste} %\nMaterialer inkl. svinn: ${outputs[1].value}\nEksempelpris: ${values.price} kr/m²\nMaterialoverslag: ${outputs[2].value}\nKun regneeksempel. Arbeid, innfesting og konstruksjon er ikke inkludert.`;}
 form.addEventListener('input',calculate);form.addEventListener('submit',e=>e.preventDefault());copy.addEventListener('click',async()=>{const text=calculate();if(!text)return;try{await navigator.clipboard.writeText(text);status.textContent='Overslaget er kopiert.';}catch{status.textContent='Nettleseren tillater ikke kopiering. Du kan markere tallene og kopiere dem selv.';}});calculate();
}
