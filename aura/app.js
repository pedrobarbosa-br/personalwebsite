const header=document.querySelector('.header');
window.addEventListener('scroll',()=>header.classList.toggle('scrolled',window.scrollY>20),{passive:true});
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#mobile-nav');
function setMenu(open,restoreFocus=false){
 toggle.setAttribute('aria-expanded',String(open));
 toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
 nav.inert=!open;
 nav.setAttribute('aria-hidden',String(!open));
 nav.classList.toggle('is-open',open);
 if(restoreFocus)toggle.focus({preventScroll:true});
}
function closeMenu(restoreFocus=false){setMenu(false,restoreFocus);}
toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu(true);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')closeMenu(true);});
document.addEventListener('click',e=>{if(toggle.getAttribute('aria-expanded')==='true'&&!nav.contains(e.target)&&!toggle.contains(e.target))closeMenu();});
header.addEventListener('focusout',e=>{if(toggle.getAttribute('aria-expanded')==='true'&&!header.contains(e.relatedTarget))closeMenu();});
window.matchMedia('(min-width: 761px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const dialog=document.querySelector('#contact-dialog');
const dialogTitle=document.querySelector('#dialog-title'),dialogDescription=document.querySelector('#dialog-description'),demoNumber=document.querySelector('.demo-number');
function showDemo(channel='WhatsApp'){
 closeMenu();
 dialogTitle.innerHTML=channel==='WhatsApp'?'Uma conversa.<br>Um novo começo.':'Um espaço para<br>conhecer a Aura.';
 dialogDescription.textContent=channel==='WhatsApp'?'Esta clínica é fictícia. Em um site real, este botão abriria uma conversa com a equipe no WhatsApp.':`O ${channel} faz parte da proposta deste site. Como a clínica é fictícia, não há ${channel==='Instagram'?'perfil real vinculado':'endereço real cadastrado'}.`;
 demoNumber.hidden=channel!=='WhatsApp';
 document.querySelector('.dialog-note').textContent=channel==='WhatsApp'?'Nenhuma mensagem será enviada.':'Este projeto não direciona a negócios reais.';
 dialog.showModal();document.body.classList.add('modal-open');
}
function closeDialog(){dialog.close();}
dialog.addEventListener('close',()=>document.body.classList.remove('modal-open'));
document.querySelector('.dialog-close').addEventListener('click',closeDialog);
document.querySelector('.dialog-done').addEventListener('click',closeDialog);
dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();});
document.querySelectorAll('[data-contact]').forEach(button=>button.addEventListener('click',()=>{
 const contact=window.AURA_CONFIG.whatsapp;
 if(contact.enabled&&/^\d{10,15}$/.test(contact.number)&&contact.number!=='5511000000000')window.open(`https://wa.me/${contact.number}?text=${encodeURIComponent(contact.message)}`,'_blank','noopener,noreferrer');
 else showDemo();
}));
document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{
 const channel=button.dataset.demo,url=channel==='Instagram'?window.AURA_CONFIG.instagramUrl:window.AURA_CONFIG.mapsUrl;
 if(url&&url.startsWith('https://'))window.open(url,'_blank','noopener,noreferrer');else showDemo(channel);
}));
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.faq-item h3 button').forEach(button=>button.addEventListener('click',()=>{
 const panel=document.getElementById(button.getAttribute('aria-controls')),opening=button.getAttribute('aria-expanded')!=='true';
 button.setAttribute('aria-expanded',String(opening));
 if(opening){panel.hidden=false;panel.style.height='0px';requestAnimationFrame(()=>{panel.style.height=panel.scrollHeight+'px';});}
 else{panel.style.height=panel.scrollHeight+'px';requestAnimationFrame(()=>{panel.style.height='0px';});}
 if(reduced.matches){panel.hidden=!opening;panel.style.height=opening?'auto':'0px';}
}));
document.querySelectorAll('.faq-answer').forEach(panel=>panel.addEventListener('transitionend',event=>{if(event.propertyName!=='height')return;const open=document.querySelector(`[aria-controls="${panel.id}"]`).getAttribute('aria-expanded')==='true';panel.hidden=!open;panel.style.height=open?'auto':'0px';}));
if(!reduced.matches&&'IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -20px 0px'});
 document.querySelectorAll('.reveal').forEach(el=>{if(el.getBoundingClientRect().top>window.innerHeight){el.classList.add('pending');observer.observe(el);}});
}

// No celular, o contato fixo assume o lugar do CTA quando ele passa sob o header.
const mobileContactQuery=window.matchMedia('(max-width: 760px)');
const heroContact=document.querySelector('.hero-actions [data-contact]');
const floatingContact=document.querySelector('.floating-contact');
let contactFrame=0;
function updateFloatingContact(){
 contactFrame=0;
 const visible=!mobileContactQuery.matches||heroContact.getBoundingClientRect().bottom<=header.getBoundingClientRect().bottom;
 floatingContact.classList.toggle('is-visible',visible);
 floatingContact.inert=!visible;
 floatingContact.setAttribute('aria-hidden',String(!visible));
}
function scheduleContactUpdate(){if(!contactFrame)contactFrame=requestAnimationFrame(updateFloatingContact);}
window.addEventListener('scroll',scheduleContactUpdate,{passive:true});
window.addEventListener('resize',scheduleContactUpdate,{passive:true});
window.addEventListener('pageshow',scheduleContactUpdate);
mobileContactQuery.addEventListener('change',scheduleContactUpdate);
if('ResizeObserver' in window){const contactResize=new ResizeObserver(scheduleContactUpdate);contactResize.observe(header);contactResize.observe(document.querySelector('.hero-copy'));}
document.fonts.ready.then(scheduleContactUpdate);
updateFloatingContact();
