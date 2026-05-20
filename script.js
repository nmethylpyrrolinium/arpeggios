const projects=[
{id:'001',title:'EchoVault',year:'2026',type:'Cinematic archive product',description:'Private vault interface for preserving voice notes, writings, and memory artifacts with calm navigation.',live:'https://nmethylpyrrolinium.github.io/echovault/',github:'https://github.com/nmethylpyrrolinium/echovault',slug:'projects/echovault.html',role:'Frontend + product direction',tools:'HTML, CSS, JS',tone:'echovault',label:'Vault preview',size:'lead'},
{id:'002',title:'Asna Needle & Co.',year:'2026',type:'Brand commerce experience',description:'Tailoring brand site focused on craft storytelling, product confidence, and boutique conversion flow.',live:'https://nmethylpyrrolinium.github.io/asna-needle-and-co/',github:'https://github.com/nmethylpyrrolinium/asna-needle-and-co',slug:'projects/asna-needle.html',role:'Frontend + art direction',tools:'HTML, CSS, JS',tone:'asna',label:'Textile study',size:'wide'},
{id:'003',title:'Ink of Arabia',year:'2025',type:'Editorial cultural microsite',description:'Narrative web essay around calligraphy, typography history, and digital ink composition.',live:'https://nmethylpyrrolinium.github.io/ink-of-arabia/',github:'',slug:'projects/ink-of-arabia.html',role:'Design + frontend',tools:'HTML, CSS',tone:'ink',label:'Editorial manuscript',size:'default'},
{id:'004',title:'Zyphoria',year:'2025',type:'Experimental landing',description:'Speculative interface experiment blending neon gradients with grounded conversion structure.',live:'https://nmethylpyrrolinium.github.io/zyphoria/',github:'https://github.com/nmethylpyrrolinium/zyphoria',slug:'projects/zyphoria.html',role:'Creative frontend',tools:'HTML, CSS, JS',tone:'zyphoria',label:'Neon concept frame',size:'default'},
{id:'005',title:'Archive / Portfolio experiment',year:'2026',type:'Portfolio system',description:'This evolving archive portfolio, rebuilt for clarity, accessibility, and maintainability.',live:'https://nmethylpyrrolinium.github.io/gay-baboon/',github:'https://github.com/nmethylpyrrolinium/gay-baboon',slug:'projects/archive.html',role:'Frontend architecture + direction',tools:'HTML, CSS, JS',tone:'archive',label:'Analog collage',size:'wide'}
];

const grid=document.getElementById('works-grid');
projects.forEach(p=>{
  const a=document.createElement('article');
  a.className=`work-card ${p.size==='lead'?'lead':''} ${p.size==='wide'?'wide':''}`.trim();
  a.setAttribute('data-reveal','');
  a.innerHTML=`
    <p class="card-index">${p.id}</p>
    <div class="thumb tone-${p.tone}" data-label="${p.label}" role="img" aria-label="${p.title} cinematic preview frame"></div>
    <p class="meta">${p.type} · ${p.year}</p>
    <h3>${p.title}</h3>
    <p class="card-description">${p.description}</p>
    <p class="card-meta"><strong>Role</strong> ${p.role}<br><strong>Tools</strong> ${p.tools}</p>
    <div class="links-row">${p.live?`<a href="${p.live}">Live</a>`:''}${p.github?`<a href="${p.github}">GitHub</a>`:''}<a href="${p.slug}">Case study</a></div>`;
  grid.appendChild(a)
});

const loader=document.getElementById('loader');
const closeLoader=()=>loader.classList.add('done');
window.addEventListener('load',()=>setTimeout(closeLoader,450));
document.getElementById('skip-loader').addEventListener('click',closeLoader);

const menuBtn=document.querySelector('.menu-toggle');
const navLinks=document.getElementById('nav-links');
menuBtn.addEventListener('click',()=>{const exp=menuBtn.getAttribute('aria-expanded')==='true';menuBtn.setAttribute('aria-expanded',String(!exp));navLinks.classList.toggle('open');});

const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealTargets=document.querySelectorAll('[data-reveal]');
if(reduce){revealTargets.forEach(el=>el.classList.add('is-visible'));}
else if('IntersectionObserver' in window){
  const revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}});},{threshold:.16,rootMargin:'0px 0px -10% 0px'});
  revealTargets.forEach(el=>revealObserver.observe(el));
}else{revealTargets.forEach(el=>el.classList.add('is-visible'));}
