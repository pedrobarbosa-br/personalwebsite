'use strict';
// Replace the placeholder with a real international number and set demo to false to activate WhatsApp.
const CONTACT = { demo: true, whatsapp: '5511000000000' };
const header = document.querySelector('#header');
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#mobile-nav');
let selectedService = '';
function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu');document.body.style.overflow='';}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';menu.hidden=open;toggle.setAttribute('aria-expanded',String(!open));toggle.setAttribute('aria-label',open?'Abrir menu':'Fechar menu');document.body.style.overflow=open?'':'hidden';});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();toggle.focus();}});
matchMedia('(min-width: 801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
function updateHeader(){header.classList.toggle('scrolled',window.scrollY>40);}window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();
document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',()=>{selectedService=a.dataset.service;document.querySelector('#contact-selection').textContent='Vamos conversar sobre: '+selectedService;}));
const dialog=document.querySelector('#contact-dialog');
const message=()=>selectedService?'Olá, Nexo! Gostaria de conversar sobre '+selectedService.toLowerCase()+' para minha empresa.':'Olá, Nexo! Gostaria de conhecer as soluções contábeis para minha empresa.';
document.querySelectorAll('.contact-trigger').forEach(button=>button.addEventListener('click',()=>{if(!CONTACT.demo){window.open('https://wa.me/'+CONTACT.whatsapp+'?text='+encodeURIComponent(message()),'_blank','noopener,noreferrer');return;}document.querySelector('#message-preview').textContent=message();document.querySelector('.copy-status').textContent='';dialog.showModal();}));
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
document.querySelector('#copy-message').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(message());document.querySelector('.copy-status').textContent='Mensagem copiada. Nenhuma mensagem foi enviada.';}catch{document.querySelector('.copy-status').textContent='Selecione e copie o texto da mensagem acima.';}});

// One-time, restrained entrances; never hide content for reduced-motion users.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll('.about-copy, .office-photo, .section-heading, .service-explorer, .businesses, .faq-heading, .faq-list, .contact-inner > div');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); } });
  }, { threshold: .08, rootMargin: '0px 0px 24px 0px' });
  revealTargets.forEach((element, index) => {
    element.setAttribute('data-reveal', '');
    revealObserver.observe(element);
  });
  document.body.classList.add('motion-ready');
  reduceMotion.addEventListener('change', event => { if (event.matches) { document.body.classList.remove('motion-ready'); revealObserver.disconnect(); } });
}

// Accessible service exploration with mouse, touch, and keyboard.
const serviceTabs = [...document.querySelectorAll('.service-tab')];
const tabList = document.querySelector('.service-tabs');
const compactServices = matchMedia('(max-width: 600px)');
function updateTabOrientation(){ tabList.setAttribute('aria-orientation', compactServices.matches ? 'horizontal' : 'vertical'); }
updateTabOrientation(); compactServices.addEventListener('change', updateTabOrientation);
function selectServiceTab(tab, focus = false) {
  serviceTabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  });
  if (focus) tab.focus({preventScroll:true});
}
serviceTabs.forEach((tab,index) => {
  tab.addEventListener('click',()=>selectServiceTab(tab));
  tab.addEventListener('keydown',event=>{
    let next;
    const rowStep=compactServices.matches?2:1;
    if(event.key==='ArrowDown')next=(index+rowStep)%serviceTabs.length;
    if(event.key==='ArrowUp')next=(index-rowStep+serviceTabs.length)%serviceTabs.length;
    if(event.key==='ArrowRight')next=(index+1)%serviceTabs.length;
    if(event.key==='ArrowLeft')next=(index-1+serviceTabs.length)%serviceTabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=serviceTabs.length-1;
    if(next!==undefined){event.preventDefault();selectServiceTab(serviceTabs[next],true);}
  });
});
// A restrained reading indicator and navigation state.
const navigationLinks = [...document.querySelectorAll('.desktop-nav a')];
const navigationSections = navigationLinks.map(link=>document.querySelector(link.getAttribute('href')));
let navigationScheduled = false;
function updateNavigation(){
  const maxScroll=document.documentElement.scrollHeight-innerHeight;
  header.style.setProperty('--reading-progress', (maxScroll>0?Math.min(100,Math.max(0,scrollY/maxScroll*100)):0)+'%');
  let current=0;
  navigationSections.forEach((section,index)=>{if(section&&section.getBoundingClientRect().top<Math.min(260,innerHeight*.3))current=index;});
  navigationLinks.forEach((link,index)=>{if(index===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  navigationScheduled=false;
}
window.addEventListener('scroll',()=>{if(!navigationScheduled){navigationScheduled=true;requestAnimationFrame(updateNavigation);}},{passive:true});
window.addEventListener('resize',updateNavigation);updateNavigation();

// Exclusive FAQ, including browsers without native details grouping.
const faqItems=[...document.querySelectorAll('.faq details')];
faqItems.forEach(item=>item.addEventListener('toggle',()=>{if(item.open)faqItems.forEach(other=>{if(other!==item)other.open=false;});}));
