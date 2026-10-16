'use strict';
(() => {
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
let ready=false;
function finishLoading(){if(ready)return;ready=true;root.classList.add('loaded');document.querySelector('.loader-count').textContent='100';document.querySelector('.loader-line').style.transform='scaleX(1)';const loader=document.querySelector('.loader');loader.classList.add('leaving');document.body.classList.remove('locked');setTimeout(()=>loader.hidden=true,1100)}
document.body.classList.add('locked');
const start=performance.now(),duration=reduced?450:1900;
let assetsReady=false;
const avatarImage=document.querySelector('.avatar');
Promise.allSettled([document.fonts?.ready??Promise.resolve(),avatarImage.decode?avatarImage.decode():Promise.resolve()]).then(()=>assetsReady=true);
function loadingTick(t){const progress=clamp((t-start)/duration,0,1);const value=Math.floor((1-Math.pow(1-progress,2))*99);document.querySelector('.loader-count').textContent=String(value).padStart(3,'0');document.querySelector('.loader-line').style.transform=`scaleX(${value/100})`;if(progress>=1&&(assetsReady||t-start>3500))finishLoading();else requestAnimationFrame(loadingTick)}requestAnimationFrame(loadingTick);setTimeout(finishLoading,4500);
function strokeCursorGlow(points,time,color,maxOpacity){
 if(points.length<3)return;
 const first=points[0],last=points[points.length-1];
 const freshness=clamp(1-(time-last.t)/650,0,1);
 if(freshness<=0)return;
 ink.save();
 const glow=ink.createLinearGradient(first.x,first.y,last.x,last.y);
 glow.addColorStop(0,`rgba(${color},0)`);
 glow.addColorStop(.45,`rgba(${color},${freshness*maxOpacity*.36})`);
 glow.addColorStop(1,`rgba(${color},${freshness*maxOpacity})`);
 ink.strokeStyle=glow;ink.lineWidth=13;ink.lineCap='round';ink.lineJoin='round';
 ink.filter='blur(6px)';ink.shadowColor=`rgba(${color},${maxOpacity*.5})`;ink.shadowBlur=14;
 ink.beginPath();ink.moveTo(first.x,first.y);
 for(let i=1;i<points.length-1;i++){const p=points[i],n=points[i+1];ink.quadraticCurveTo(p.x,p.y,(p.x+n.x)/2,(p.y+n.y)/2)}
 ink.lineTo(last.x,last.y);ink.stroke();ink.restore();
}
function drawCursorGlow(points,time){
 const green=document.querySelector('.contact').getBoundingClientRect();
 // Clip the same continuous trail into the two surfaces, so its color changes exactly at the edge.
 ink.save();ink.beginPath();ink.rect(0,0,inkWidth,inkHeight);ink.rect(green.left,green.top,green.width,green.height);ink.clip('evenodd');
 const dark=root.dataset.theme==='dark';
 strokeCursorGlow(points,time,dark?'176,218,111':'63,105,31',dark ? .44 : .42);ink.restore();
 ink.save();ink.beginPath();ink.rect(green.left,green.top,green.width,green.height);ink.clip();
 strokeCursorGlow(points,time,'24,34,14',.52);ink.restore();
}
// Each letter responds locally to the pointer, rather than moving the entire heading.
document.querySelectorAll('[data-letters]').forEach(line=>{const walker=document.createTreeWalker(line,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(node=>{const fragment=document.createDocumentFragment();for(const char of node.textContent){const span=document.createElement('span');span.className='letter';span.textContent=char;fragment.appendChild(span)}node.replaceWith(fragment)})});
const cursor=document.querySelector('.cursor');const cursorLabel=cursor.querySelector('span');
const pointer={x:innerWidth*.5,y:innerHeight*.4,seen:false};let cursorX=pointer.x,cursorY=pointer.y;
const inkCanvas=document.querySelector('#ink-canvas'),ink=inkCanvas.getContext('2d');let pixelRatio=1,inkWidth=0,inkHeight=0;
function resizeInk(){pixelRatio=Math.min(devicePixelRatio||1,1.5);inkWidth=innerWidth;inkHeight=innerHeight;inkCanvas.width=Math.round(inkWidth*pixelRatio);inkCanvas.height=Math.round(inkHeight*pixelRatio);ink.setTransform(pixelRatio,0,0,pixelRatio,0,0)}resizeInk();
const trail=[];let lastPointerTime=0;let inkDirty=false;
document.addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.seen=true;lastPointerTime=performance.now();if(fine&&!reduced){cursor.classList.add('show');trail.push({x:e.clientX,y:e.clientY,t:lastPointerTime});if(trail.length>35)trail.shift();inkDirty=true}},{passive:true});
document.addEventListener('pointerover',e=>{if(!fine||reduced)return;cursor.classList.toggle('on-green',!!e.target.closest('.contact'));const target=e.target.closest('a,button,[data-cursor]');cursor.classList.toggle('hover',!!target);cursorLabel.textContent=target?.dataset.cursor||'VER'});
document.addEventListener('pointerdown',()=>cursor.classList.add('click'));
document.addEventListener('pointerup',()=>cursor.classList.remove('click'));
document.documentElement.addEventListener('pointerleave',()=>{pointer.seen=false;cursor.classList.remove('show');cursor.classList.remove('hover')});
const avatarScene=document.querySelector('.avatar-scene');const avatarMotion=document.querySelector('.avatar-motion');const hero=document.querySelector('.hero');let avatarX=0,avatarY=0,avatarR=0;let heroVisible=true;
let greetingTimer;const messages=['Opa, tudo bem?','Bora criar alguma coisa?','Curiosidade me trouxe até aqui.','Gostei da sua visita :)'];let messageIndex=0;
function greet(){avatarScene.querySelector('.avatar-message').textContent=messages[messageIndex++%messages.length];avatarScene.classList.add('greet');clearTimeout(greetingTimer);greetingTimer=setTimeout(()=>avatarScene.classList.remove('greet'),2500)}
avatarScene.addEventListener('click',greet);avatarScene.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();greet()}});
let letterRects=[];const letters=[...document.querySelectorAll('.letter')];
function measureLetters(){letterRects=letters.map(el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+scrollY+r.height/2}})}setTimeout(measureLetters,2200);document.fonts?.ready.then(measureLetters);
let scrollPending=false;function updateScroll(){const total=document.documentElement.scrollHeight-innerHeight;document.querySelector('.scroll-progress').style.transform=`scaleX(${total>0?scrollY/total:0})`;scrollPending=false}window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll)}},{passive:true});
// Magnetic movement is limited to controls, with a small displacement so they stay easy to click.
if(fine&&!reduced)document.querySelectorAll('[data-magnetic]').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.15}px,${(e.clientY-r.top-r.height/2)*.15}px)`});el.addEventListener('pointerleave',()=>el.style.transform='')});
const themeButton=document.querySelector('.theme-button');function syncThemeButton(){const dark=root.dataset.theme==='dark';themeButton.setAttribute('aria-label',dark?'Ativar tema claro':'Ativar tema escuro');themeButton.setAttribute('aria-pressed',String(dark));document.querySelector('meta[name="theme-color"]').content=dark?'#171b16':'#f3f4ed'}syncThemeButton();themeButton.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('gl-theme',root.dataset.theme)}catch{}syncThemeButton();drawPlay(performance.now())});
const menuButton=document.querySelector('.menu-button'),menu=document.querySelector('.site-menu'),main=document.querySelector('main'),footer=document.querySelector('footer');
function toggleMenu(open){menuButton.setAttribute('aria-expanded',String(open));menuButton.querySelector('.menu-word').textContent=open?'Fechar':'Menu';menu.classList.toggle('open',open);menu.inert=!open;main.inert=open;footer.inert=open;document.body.classList.toggle('locked',open);if(open)setTimeout(()=>menu.querySelector('a').focus(),200)}
menuButton.addEventListener('click',()=>toggleMenu(menuButton.getAttribute('aria-expanded')!=='true'));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{toggleMenu(false);if(a.getAttribute('href').startsWith('#')){const section=document.querySelector(a.getAttribute('href'));section?.setAttribute('tabindex','-1');setTimeout(()=>section?.focus({preventScroll:true}),50)}}));
document.addEventListener('keydown',e=>{if(menuButton.getAttribute('aria-expanded')!=='true')return;if(e.key==='Escape'){toggleMenu(false);menuButton.focus()}if(e.key==='Tab'){const focusable=[...document.querySelectorAll('.header a,.header button,.site-menu a')].filter(el=>el.getClientRects().length>0);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
// Reveal words with native scrolling; content remains readable with reduced motion or no JS.
const revealWords=[];document.querySelectorAll('[data-reveal-words]').forEach(el=>{const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{const f=document.createDocumentFragment();n.textContent.split(/(\s+)/).forEach(word=>{if(!word.trim())f.appendChild(document.createTextNode(word));else{const span=document.createElement('span');span.className='word';span.textContent=word;f.appendChild(span);revealWords.push(span)}});n.replaceWith(f)})});
if('IntersectionObserver' in window){const wordObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){const index=revealWords.indexOf(entry.target);entry.target.style.transitionDelay=`${index*35}ms`;entry.target.classList.add('lit');wordObserver.unobserve(entry.target)}})},{threshold:1,rootMargin:'0px 0px -8% 0px'});revealWords.forEach(w=>wordObserver.observe(w));new IntersectionObserver(e=>heroVisible=e[0].isIntersecting).observe(hero)}else revealWords.forEach(w=>w.classList.add('lit'));
const playground=document.querySelector('.playground'),playCanvas=document.querySelector('#ribbon-canvas'),ctx=playCanvas.getContext('2d');let playW=1,playH=1,playDpr=1,playVisible=true,paletteIndex=0,playTouch=false,activeUntil=0;
const playPointer={x:.5,y:.5,sx:.5,sy:.5};
const palettes=[['#6c9544','#a2c667','#c5f265'],['#446a49','#83a667','#d1e89b'],['#819646','#cedc83','#8bac73']];
function resizePlay(){const r=playground.getBoundingClientRect();playW=r.width;playH=r.height;playDpr=Math.min(devicePixelRatio||1,1.5);playCanvas.width=Math.round(playW*playDpr);playCanvas.height=Math.round(playH*playDpr);ctx.setTransform(playDpr,0,0,playDpr,0,0);drawPlay(performance.now())}
function playMove(e){const r=playground.getBoundingClientRect();playPointer.x=clamp((e.clientX-r.left)/r.width,0,1);playPointer.y=clamp((e.clientY-r.top)/r.height,0,1);activeUntil=performance.now()+1500}
playground.addEventListener('pointermove',playMove,{passive:true});playground.addEventListener('pointerdown',e=>{playTouch=true;playMove(e)});playground.addEventListener('pointerup',()=>playTouch=false);playground.addEventListener('pointerleave',()=>{playTouch=false;activeUntil=0});
document.querySelector('.reset-play').addEventListener('click',()=>{paletteIndex=(paletteIndex+1)%palettes.length;drawPlay(performance.now());notify('Uma nova energia. Continue explorando.')});
function drawPlay(time){if(!ctx||playW<2)return;const t=reduced?1:time*.00023;const active=time<activeUntil;const tx=active?playPointer.x:.5+Math.sin(t*.7)*.2,ty=active?playPointer.y:.5+Math.cos(t*.9)*.15;playPointer.sx=lerp(playPointer.sx,tx,.045);playPointer.sy=lerp(playPointer.sy,ty,.045);ctx.clearRect(0,0,playW,playH);const dark=root.dataset.theme==='dark';const palette=palettes[paletteIndex];const count=innerWidth<=1024?32:46;
 for(let i=0;i<count;i++){const n=i/(count-1);ctx.beginPath();for(let j=0;j<=70;j++){const x=j/70*playW;const u=j/70;const wave=Math.sin(u*5.8+t+n*.9)*playH*.17;const wave2=Math.cos(u*10-t*.8+n*1.5)*playH*.06;const influence=Math.exp(-Math.pow((u-playPointer.sx)*3,2));const bend=(playPointer.sy-.5)*playH*.75*influence;const y=playH*.18+n*playH*.6+wave+wave2+bend+Math.sin(n*4+t)*playH*.035;if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle=palette[Math.floor(n*2.99)];ctx.globalAlpha=dark?.46:.4;ctx.lineWidth=i%6===0?1.4:.65;ctx.stroke()}
 ctx.globalAlpha=1;
}
resizePlay();if('ResizeObserver' in window)new ResizeObserver(resizePlay).observe(playground);if('IntersectionObserver' in window)new IntersectionObserver(entries=>playVisible=entries[0].isIntersecting,{rootMargin:'100px'}).observe(playground);
let lastFrame=0;
function tick(time){requestAnimationFrame(tick);if(document.hidden||reduced||time-lastFrame<(innerWidth<=1024?33:25))return;lastFrame=time;
 if(fine){cursorX=lerp(cursorX,pointer.x,.24);cursorY=lerp(cursorY,pointer.y,.24);cursor.style.left=cursorX+'px';cursor.style.top=cursorY+'px';if(inkDirty){ink.clearRect(0,0,inkWidth,inkHeight);while(trail.length&&time-trail[0].t>650)trail.shift();drawCursorGlow(trail,time);if(!trail.length)inkDirty=false}
 if(heroVisible&&ready){const normX=(pointer.x/innerWidth-.5),normY=(pointer.y/innerHeight-.5);avatarX=lerp(avatarX,normX*14,.07);avatarY=lerp(avatarY,normY*9,.07);avatarR=lerp(avatarR,normX*3,.07);avatarMotion.style.setProperty('--ax',avatarX+'px');avatarMotion.style.setProperty('--ay',avatarY+'px');avatarMotion.style.setProperty('--ar',avatarR+'deg');letters.forEach((letter,i)=>{const r=letterRects[i];if(!r)return;const dx=pointer.x-r.x,dy=pointer.y-(r.y-scrollY),distance=Math.hypot(dx,dy);const force=pointer.seen?Math.max(0,1-distance/155):0;letter.style.setProperty('--ly',(-force*19)+'px');letter.style.setProperty('--lr',(force*dx*.055)+'deg')})}}
 if(playVisible)drawPlay(time);
}if(!reduced)requestAnimationFrame(tick);else drawPlay(1000);
window.addEventListener('resize',()=>{resizeInk();resizePlay();measureLetters()},{passive:true});
const toast=document.querySelector('.toast');let toastTimeout;function notify(text){toast.textContent=text;toast.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toast.classList.remove('show'),3000)}
document.querySelector('.copy-email').addEventListener('click',async e=>{const email=e.currentTarget.dataset.email;try{await navigator.clipboard.writeText(email);notify('E-mail copiado. Agora é só dizer oi.')}catch{notify(email)}});
function updateTime(){document.querySelector('#local-time').textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}).format(new Date())}updateTime();setInterval(updateTime,60000);
})();
