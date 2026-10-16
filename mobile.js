'use strict';
(() => {
const mobile=matchMedia('(max-width:1024px)');
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const scene=document.querySelector('.avatar-scene');
const motion=document.querySelector('.avatar-motion');
const dock=document.querySelector('.mobile-dock');
const menuButton=document.querySelector('.menu-button');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let dragging=false,startX=0,startY=0,waveTimers=[];
function resetAvatar(){dragging=false;motion.style.setProperty('--touch-x','0px');motion.style.setProperty('--touch-y','0px');motion.style.setProperty('--touch-rotate','0deg')}
scene.addEventListener('pointerdown',e=>{if(!mobile.matches||reduced)return;dragging=true;startX=e.clientX;startY=e.clientY});
scene.addEventListener('pointermove',e=>{if(!dragging||!mobile.matches||reduced)return;const x=clamp((e.clientX-startX)*.22,-22,22),y=clamp((e.clientY-startY)*.12,-10,10);motion.style.setProperty('--touch-x',x+'px');motion.style.setProperty('--touch-y',y+'px');motion.style.setProperty('--touch-rotate',x*.2+'deg')},{passive:true});
['pointerup','pointercancel','pointerleave'].forEach(event=>scene.addEventListener(event,resetAvatar));
// A touch gives the heading the same sense of response as proximity on desktop.
document.querySelector('h1').addEventListener('pointerdown',()=>{if(!mobile.matches||reduced)return;waveTimers.forEach(clearTimeout);waveTimers=[];document.querySelectorAll('.letter').forEach((letter,i)=>{waveTimers.push(setTimeout(()=>{letter.style.setProperty('--ly','-8px');letter.style.setProperty('--lr',i%2?'3deg':'-3deg')},i*22));waveTimers.push(setTimeout(()=>{letter.style.setProperty('--ly','0px');letter.style.setProperty('--lr','0deg')},i*22+210))})});
function syncMenu(){const open=menuButton.getAttribute('aria-expanded')==='true';document.body.classList.toggle('mobile-menu-open',open);dock.inert=open||!mobile.matches}
new MutationObserver(syncMenu).observe(menuButton,{attributes:true,attributeFilter:['aria-expanded']});syncMenu();
const links=[...dock.querySelectorAll('a')];
function activate(id){links.forEach(link=>{const active=link.hash==='#'+id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})}
links.forEach(link=>link.addEventListener('click',()=>activate(link.hash.slice(1))));
if('IntersectionObserver' in window){const sections=[...document.querySelectorAll('main>section[id]')];const visible=new Map();const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>visible.set(entry.target.id,entry.isIntersecting));const section=sections.filter(s=>visible.get(s.id)).sort((a,b)=>Math.abs(a.getBoundingClientRect().top-innerHeight*.25)-Math.abs(b.getBoundingClientRect().top-innerHeight*.25))[0];if(section)activate(section.id)},{rootMargin:'-15% 0px -45% 0px',threshold:0});sections.forEach(s=>observer.observe(s))}
mobile.addEventListener('change',()=>{resetAvatar();syncMenu();waveTimers.forEach(clearTimeout);document.querySelectorAll('.letter').forEach(l=>{l.style.removeProperty('--ly');l.style.removeProperty('--lr')})});
})();
