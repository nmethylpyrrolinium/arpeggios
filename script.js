/* ═══════════════════════════════════════════════════════════
   ARCHIVE PORTFOLIO — CINEMATIC INTERACTION SYSTEM
   ═══════════════════════════════════════════════════════════ */

// ── LOADER ────────────────────────────────────────────────
const loader = document.getElementById('loader');
const skipBtn = document.getElementById('skip-loader');

function closeLoader() {
  loader.classList.add('done');
}

window.addEventListener('load', () => {
  // Small dramatic pause before dismissing
  setTimeout(closeLoader, 800);
});
skipBtn.addEventListener('click', closeLoader);

// ── CLOCK ─────────────────────────────────────────────────
const timeEl = document.getElementById('nav-time');
function tick() {
  if (!timeEl) return;
  const t = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  timeEl.textContent = 'Mumbai · ' + t;
}
tick();
setInterval(tick, 30000);

// ── MOBILE NAV ────────────────────────────────────────────
const menuBtn = document.querySelector('.menu-toggle');
const navLinks = document.getElementById('nav-links');

menuBtn.addEventListener('click', () => {
  const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!expanded));
  navLinks.classList.toggle('open');
});

// Close nav when a link is clicked (mobile)
navLinks.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', () => {
    menuBtn.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  });
});

// Close nav on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('nav')) {
    menuBtn.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  }
});

// ── HEADER SCROLL STATE ───────────────────────────────────
const header = document.getElementById('site-header');
let lastScroll = 0;
let headerVisible = true;

window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;
  const delta = currentScroll - lastScroll;

  // Fade header at top
  if (currentScroll < 60) {
    header.style.background = '';
    header.style.color = '';
  } else {
    header.style.background = 'rgba(245,242,236,0.94)';
    header.style.color = '#0E0C09';
  }

  // Hide/show on scroll direction (with threshold)
  if (Math.abs(delta) < 5) { lastScroll = currentScroll; return; }
  if (delta > 0 && currentScroll > 200 && headerVisible) {
    header.style.transform = 'translateY(-100%)';
    header.style.transition = 'transform .4s cubic-bezier(0.19,1,0.22,1), background .4s';
    headerVisible = false;
  } else if (delta < 0 && !headerVisible) {
    header.style.transform = '';
    headerVisible = true;
  }
  lastScroll = currentScroll;
}, { passive: true });

// ── CINEMATIC REVEAL SYSTEM ───────────────────────────────
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealTargets = document.querySelectorAll('[data-cinematic]');

if (reduce) {
  revealTargets.forEach(el => el.classList.add('revealed'));
} else if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger children within a revealed block
        const el = entry.target;
        el.classList.add('revealed');
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -6% 0px'
  });

  revealTargets.forEach(el => observer.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('revealed'));
}

// Also reveal project-pair children with stagger
const pairs = document.querySelectorAll('.project-pair');
if ('IntersectionObserver' in window && !reduce) {
  const pairObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const children = entry.target.querySelectorAll('.project-half');
        children.forEach((child, i) => {
          setTimeout(() => {
            child.style.opacity = '1';
            child.style.transform = 'none';
          }, i * 120);
        });
        pairObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });

  // Init hidden state for pair children
  pairs.forEach(pair => {
    pair.querySelectorAll('.project-half').forEach(child => {
      if (!reduce) {
        child.style.opacity = '0';
        child.style.transform = 'translateY(28px)';
        child.style.transition = 'opacity 1s cubic-bezier(0.19,1,0.22,1), transform 1.1s cubic-bezier(0.19,1,0.22,1)';
      }
    });
    pairObserver.observe(pair);
  });
}

// ── SCROLL CUE AUTO-HIDE ──────────────────────────────────
const scrollCue = document.querySelector('.scroll-cue');
if (scrollCue) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 120) {
      scrollCue.style.opacity = '0';
      scrollCue.style.transition = 'opacity .6s';
    }
  }, { passive: true, once: false });
}

// ── SMOOTH HASH NAVIGATION ────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
});

// ── PROJECT FRAME PARALLAX (subtle, desktop only) ─────────
if (!reduce && window.matchMedia('(min-width: 900px)').matches) {
  const frames = document.querySelectorAll('.project-frame');
  const handleScroll = () => {
    frames.forEach(frame => {
      const rect = frame.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      const dist = (center - viewCenter) / window.innerHeight;
      // Very subtle background-position shift for depth
      frame.style.backgroundPositionY = `calc(50% + ${dist * 18}px)`;
    });
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
}

// ── TERRAIN ENGINE — custom WebGL height-field expedition ──
(() => {
  const canvas = document.getElementById('terrain-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.style.background = 'radial-gradient(circle at 65% 35%, #625844, #100f0c 65%)'; return; }

  const vertex = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fragment = `
    precision highp float;
    uniform vec2 r; uniform float t; uniform vec2 m;
    #define PI 3.14159265
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;mat2 q=mat2(.8,-.6,.6,.8);for(int i=0;i<6;i++){v+=a*noise(p);p=q*p*2.03;a*=.5;}return v;}
    float terrain(vec2 p){
      float ridges=1.-abs(2.*fbm(p*.19)-1.);
      float massif=pow(max(0.,1.-length((p-vec2(4.,4.))*vec2(.055,.085))),2.2)*15.;
      float peak=pow(max(0.,1.-length((p-vec2(-5.,11.))*vec2(.08,.055))),2.8)*11.;
      return ridges*ridges*5.2+massif+peak-2.5;
    }
    vec3 normal(vec3 p){float e=.08,h=terrain(p.xz);return normalize(vec3(h-terrain(p.xz-vec2(e,0.)),e,h-terrain(p.xz-vec2(0,e))));}
    void main(){
      vec2 uv=(gl_FragCoord.xy*2.-r)/r.y;
      vec3 ro=vec3(-1.5+m.x*1.8,7.5+m.y*1.1,-12.+sin(t*.08)*.5);
      vec3 ta=vec3(1.5,3.3,8.);
      vec3 ww=normalize(ta-ro),uu=normalize(cross(ww,vec3(0,1,0))),vv=cross(uu,ww);
      vec3 rd=normalize(uv.x*uu+uv.y*vv+1.65*ww);
      float d=0., hit=0.; vec3 p;
      for(int i=0;i<92;i++){p=ro+rd*d;float h=p.y-terrain(p.xz);if(h<.025){hit=1.;break;}d+=max(.035,h*.19);if(d>65.)break;}
      vec3 col=vec3(.055,.052,.043);
      if(hit>0.){
        vec3 n=normal(p);vec3 sun=normalize(vec3(-.55,.7,-.35));float dif=max(dot(n,sun),0.);
        float contour=smoothstep(.035,.0,abs(fract(p.y*.58)-.5)-.47);
        float strata=.5+.5*sin(p.y*5.+fbm(p.xz)*5.);
        vec3 rock=mix(vec3(.12,.115,.095),vec3(.54,.48,.35),dif);
        rock+=vec3(.14,.105,.05)*pow(dif,3.);rock*=.82+.18*strata;rock+=contour*.08;
        float fog=1.-exp(-d*d*.0012);col=mix(rock,vec3(.07,.067,.056),fog);
      } else {
        float glow=pow(max(dot(rd,normalize(vec3(-.3,.35,.8))),0.),10.);
        col+=vec3(.32,.27,.17)*glow;
      }
      float vign=1.-smoothstep(.5,1.4,length(uv*.72));col*=.62+.38*vign;
      col+= (hash(gl_FragCoord.xy+fract(t))-0.5)/255.;
      col=pow(col,vec3(.88));gl_FragColor=vec4(col,1.);
    }`;
  const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); return shader; };
  const program = gl.createProgram(); gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program); gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'r'), time = gl.getUniformLocation(program, 't'), mouse = gl.getUniformLocation(program, 'm');
  let mx = 0, my = 0, tx = 0, ty = 0, raf;
  const resize = () => { const d = Math.min(devicePixelRatio, 1.35); canvas.width = innerWidth*d; canvas.height = canvas.clientHeight*d; gl.viewport(0,0,canvas.width,canvas.height); };
  addEventListener('resize', resize); addEventListener('pointermove', e => { tx=(e.clientX/innerWidth-.5);ty=(.5-e.clientY/innerHeight); }, {passive:true}); resize();
  const draw = ms => { mx+=(tx-mx)*.025;my+=(ty-my)*.025;gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,ms*.001);gl.uniform2f(mouse,mx,my);gl.drawArrays(gl.TRIANGLES,0,3);if(!reduce)raf=requestAnimationFrame(draw); };
  if (!reduce) raf=requestAnimationFrame(draw); else draw(0);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else if(!reduce)raf=requestAnimationFrame(draw);});
})();

// ── PROJECT DEPTH — restrained physical tilt, never neon ──
if (!reduce && matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.project-frame').forEach(frame => {
    frame.addEventListener('pointermove', e => {
      const b=frame.getBoundingClientRect(), x=(e.clientX-b.left)/b.width-.5, y=(e.clientY-b.top)/b.height-.5;
      frame.style.transform=`rotateX(${-y*4}deg) rotateY(${x*5}deg) translateZ(8px)`;
    });
    frame.addEventListener('pointerleave',()=>{ frame.style.transform=''; });
  });
}
