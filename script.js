/* ═══════════════════════════════════════════════════════════
   ALAM'S DUMP — BLACK HOLE EXTRACTION SYSTEM
   ═══════════════════════════════════════════════════════════ */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const loader = document.getElementById('loader');
const skipBtn = document.getElementById('skip-loader');
const closeLoader = () => loader?.classList.add('done');
window.addEventListener('load', () => setTimeout(closeLoader, 520));
skipBtn?.addEventListener('click', closeLoader);

// ── CLOCK + MOBILE NAV ─────────────────────────────────────
const timeEl = document.getElementById('nav-time');
function tick() {
  if (!timeEl) return;
  timeEl.textContent = `UTC · ${new Date().toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false })}`;
}
tick();
setInterval(tick, 30000);

const menuBtn = document.querySelector('.menu-toggle');
const navLinks = document.getElementById('nav-links');
menuBtn?.addEventListener('click', () => {
  const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!expanded));
  navLinks?.classList.toggle('open');
});
navLinks?.querySelectorAll('.nav-item').forEach(link => link.addEventListener('click', () => {
  menuBtn?.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('open');
}));

document.addEventListener('click', event => {
  if (!event.target.closest('nav')) {
    menuBtn?.setAttribute('aria-expanded', 'false');
    navLinks?.classList.remove('open');
  }
});

// ── DEVICE TILT (MOBILE CAMERA INPUT) ─────────────────────
// Feeds the same pointer-driven systems (shader warp + fragment
// orbit + camera parallax) so mobile gets real 3D reactivity
// instead of the previously-inert static orbit.
const motionBtn = document.getElementById('enable-motion');
let tiltX = 0, tiltY = 0;
let lastInputTime = performance.now();
function applyTiltEvent(event) {
  if (event.gamma == null || event.beta == null) return;
  tiltX = Math.max(-1, Math.min(1, event.gamma / 45));
  tiltY = Math.max(-1, Math.min(1, (event.beta - 45) / 45)) * -1;
  lastInputTime = performance.now();
}
function startTilt() {
  window.addEventListener('deviceorientation', applyTiltEvent, { passive: true });
}
if (coarsePointer && !reduce && window.DeviceOrientationEvent) {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+: requires a user gesture before motion data is available.
    motionBtn?.removeAttribute('hidden');
    motionBtn?.addEventListener('click', async () => {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result === 'granted') {
          startTilt();
          motionBtn.setAttribute('hidden', '');
        }
      } catch (_) { /* user dismissed the permission dialog */ }
    });
  } else {
    // Android + other browsers expose motion data without a prompt.
    startTilt();
  }
}

// ── HEADER + EVENT HORIZON SCROLL STATE ───────────────────
const header = document.getElementById('site-header');
const hero = document.getElementById('hero');
let lastScroll = 0;
let headerVisible = true;
function handleScroll() {
  const y = window.scrollY;
  const delta = y - lastScroll;
  const progress = Math.min(1, y / Math.max(1, window.innerHeight * .72));
  hero?.style.setProperty('--hero-progress', progress.toFixed(3));
  hero?.classList.toggle('is-scrolling', progress > .02 && progress < 1);

  if (header) {
    if (y < 60) {
      header.style.background = '';
      header.style.color = '';
    } else {
      header.style.background = 'rgba(245,242,236,0.94)';
      header.style.color = '#0E0C09';
    }
    if (Math.abs(delta) >= 5 && delta > 0 && y > 200 && headerVisible) {
      header.style.transform = 'translateY(-100%)';
      header.style.transition = 'transform .4s cubic-bezier(0.19,1,0.22,1), background .4s';
      headerVisible = false;
    } else if (delta < 0 && !headerVisible) {
      header.style.transform = '';
      headerVisible = true;
    }
  }
  lastScroll = y;
}
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// ── CINEMATIC REVEALS ─────────────────────────────────────
const revealTargets = document.querySelectorAll('[data-cinematic]');
if (reduce || !('IntersectionObserver' in window)) {
  revealTargets.forEach(el => el.classList.add('revealed'));
} else {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach(el => observer.observe(el));
}

const pairs = document.querySelectorAll('.project-pair');
if ('IntersectionObserver' in window && !reduce) {
  const pairObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.project-half').forEach((child, index) => setTimeout(() => {
      child.style.opacity = '1';
      child.style.transform = 'none';
    }, index * 120));
    pairObserver.unobserve(entry.target);
  }), { threshold: .06 });
  pairs.forEach(pair => {
    pair.querySelectorAll('.project-half').forEach(child => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(28px)';
      child.style.transition = 'opacity 1s cubic-bezier(0.19,1,0.22,1), transform 1.1s cubic-bezier(0.19,1,0.22,1)';
    });
    pairObserver.observe(pair);
  });
}

// ── BLACK HOLE WEBGL FIELD ────────────────────────────────
(() => {
  const canvas = document.getElementById('black-hole-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) {
    canvas.style.background = 'radial-gradient(circle at 58% 47%, #000 0 11%, #8d8269 11.3%, #08090b 14%, #020303 45%)';
    return;
  }
  const vertex = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fragment = `
    precision highp float;
    uniform vec2 r; uniform float t; uniform vec2 m; uniform float s; uniform float collapse;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    mat2 rot(float a){float c=cos(a),q=sin(a);return mat2(c,-q,q,c);}
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;
      vec2 center=vec2((.58-.5)*r.x/r.y,.5-.47);
      if(r.x/r.y<1.1)center=vec2(0.,.5-.47);
      vec2 q=uv-center; q+=m*.018/(1.+length(q)*8.);
      q*=rot(-.08); float d=length(q); float a=atan(q.y,q.x);
      float ringRadius=mix(.145,.012,collapse); float warp=1./max(.035,d);
      vec2 starUv=uv+normalize(q)*warp*.008*(1.-collapse);
      float stars=step(.9965,hash(floor(starUv*r.y*.42)));
      float tiny=step(.991,hash(floor(starUv*r.y*.19)))*.35;
      float twinkle=.65+.35*sin(t*1.8+hash(floor(starUv*r.y*.42))*20.);
      vec3 col=vec3((stars+tiny)*twinkle);
      float dust=noise(vec2(a*7.-t*.025,d*85.));
      float disc=exp(-abs(q.y)*78.)*smoothstep(.42,.1,abs(q.x))*smoothstep(.075,.16,d);
      disc*=.3+.7*dust; col+=vec3(.42,.38,.29)*disc*.32;
      float ring=exp(-abs(d-ringRadius)*260.)+exp(-abs(d-ringRadius*.96)*85.)*.28;
      float beam=pow(max(0.,1.-abs(q.y)/(ringRadius*.09+.002)),5.)*smoothstep(ringRadius*.65,ringRadius*1.7,abs(q.x))*smoothstep(ringRadius*3.8,ringRadius*1.1,abs(q.x));
      vec3 warm=vec3(1.,.82,.5), cool=vec3(.48,.64,.82);
      col+=mix(cool,warm,smoothstep(-.2,.22,q.x))*ring*(1.-collapse)*.82;
      col+=mix(cool,warm,smoothstep(-.25,.25,q.x))*beam*.42*(1.-collapse);
      col*=smoothstep(ringRadius*.86,ringRadius*1.02,d);
      col+=vec3(1.)*exp(-d*480.)*collapse*2.4;
      vec2 emberUv=uv+m*.12;
      float embers=step(.997,hash(floor(emberUv*r.y*.16+t*.02)));
      float emberTwinkle=.5+.5*sin(t*3.1+hash(floor(emberUv*r.y*.16))*30.);
      col+=vec3(1.,.78,.42)*embers*emberTwinkle*.9*(1.-collapse);
      float vign=1.-smoothstep(.35,1.15,length(uv*vec2(.7,1.))); col*=.25+.75*vign;
      col+=(hash(gl_FragCoord.xy+fract(t))-.5)/280.;
      gl_FragColor=vec4(pow(max(col,0.),vec3(.82)),1.);
    }`;
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'r');
  const time = gl.getUniformLocation(program, 't');
  const mouse = gl.getUniformLocation(program, 'm');
  const scroll = gl.getUniformLocation(program, 's');
  const collapse = gl.getUniformLocation(program, 'collapse');
  let mx = 0, my = 0, tx = 0, ty = 0, raf;
  const resize = () => {
    const density = Math.min(devicePixelRatio, coarsePointer ? 1 : 1.35);
    canvas.width = innerWidth * density;
    canvas.height = canvas.clientHeight * density;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  addEventListener('resize', resize);
  addEventListener('pointermove', event => {
    tx = event.clientX / innerWidth - .5;
    ty = .5 - event.clientY / innerHeight;
  }, { passive: true });
  if (coarsePointer) {
    // Mirror the page-level tilt values into this shader's own
    // mouse-warp input so the lensing reacts to device orientation.
    addEventListener('deviceorientation', () => {
      tx = tiltX * .5;
      ty = tiltY * .5;
    }, { passive: true });
  }
  resize();
  const draw = ms => {
    mx += (tx - mx) * .025; my += (ty - my) * .025;
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, ms * .001);
    gl.uniform2f(mouse, mx, my);
    gl.uniform1f(scroll, Math.min(1, scrollY / innerHeight));
    gl.uniform1f(collapse, hero?.classList.contains('is-collapsed') ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) raf = requestAnimationFrame(draw);
  };
  if (reduce) draw(0); else raf = requestAnimationFrame(draw);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduce) raf = requestAnimationFrame(draw);
  });
})();

// ── ORBIT, LOCK, EXTRACTION, AND RECOVERY ─────────────────
const fragments = [...document.querySelectorAll('.orbit-fragment')];
const lockLine = document.querySelector('.lock-line');
const cursor = document.querySelector('.gravity-cursor');
const rig = document.querySelector('.cinematic-rig');
const status = document.querySelector('.sr-status');
const countEl = document.getElementById('extraction-count');
const archiveUnlock = document.getElementById('archive-unlock');
let pointerX = innerWidth * .5;
let pointerY = innerHeight * .5;
let lockedFragment = null;
let mobilePrimed = null;
let orbitRaf;
let recovered = new Set();
try { recovered = new Set(JSON.parse(localStorage.getItem('nm-recovered') || '[]')); } catch (_) { recovered = new Set(); }

function setLock(fragment) {
  lockedFragment?.classList.remove('is-locked');
  lockedFragment = fragment;
  fragment?.classList.add('is-locked');
}
function clearLock(fragment) {
  if (lockedFragment !== fragment) return;
  fragment.classList.remove('is-locked');
  lockedFragment = null;
  lockLine?.classList.remove('visible');
}
function updateRecoveredState() {
  fragments.forEach(fragment => fragment.classList.toggle('is-recovered', recovered.has(fragment.dataset.target)));
  if (countEl) countEl.textContent = String(recovered.size).padStart(2, '0');
  const unlocked = recovered.size >= 3;
  archiveUnlock?.classList.toggle('is-unlocked', unlocked);
  if (archiveUnlock) archiveUnlock.querySelector('.archive-unlock-copy').innerHTML = unlocked
    ? '<b>Direct transmission open</b><small>Gravity threshold cleared. The archive is listening.</small>'
    : `<b>Direct transmission sealed</b><small>Recover ${3 - recovered.size} more artifact${3 - recovered.size === 1 ? '' : 's'} to stabilize the archive.</small>`;
  hero?.classList.toggle('is-collapsed', recovered.size >= fragments.length);
}
updateRecoveredState();

function orbit(ms = 0) {
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  const mobile = innerWidth <= 900;
  const cx = rect.width * (mobile ? .5 : .58);
  const cy = rect.height * (mobile ? .44 : .47);
  const rx = Math.min(rect.width * (mobile ? .39 : .31), mobile ? 185 : 430);
  const ry = Math.min(rect.height * (mobile ? .29 : .31), mobile ? 245 : 300);
  fragments.forEach((fragment, index) => {
    const base = Number(fragment.dataset.angle);
    const radius = Number(fragment.dataset.radius);
    const locked = fragment === lockedFragment;
    const speed = reduce ? 0 : ms * (mobile ? .000018 : .000024) * (index % 2 ? -1 : 1);
    const angle = base + (locked ? speed * .08 : speed);
    let x = cx + Math.cos(angle) * rx * radius;
    let y = cy + Math.sin(angle) * ry * radius;
    if (!locked) {
      if (!mobile) {
        const dx = pointerX - x, dy = pointerY - y;
        const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 280);
        x += dx * influence * .035;
        y += dy * influence * .035;
      } else {
        // Device tilt stands in for cursor influence on touch devices.
        x += tiltX * rx * .14;
        y += tiltY * ry * .14;
      }
    }
    const depth = .65 + (Math.sin(angle) + 1) * .2;
    fragment.style.opacity = locked ? '1' : String(.38 + depth * .55);
    fragment.style.filter = locked ? 'none' : `blur(${Math.max(0, (1 - depth) * 1.7)}px)`;
    fragment.style.transform = `translate3d(${x - fragment.offsetWidth / 2}px, ${y - fragment.offsetHeight / 2}px, ${(depth - .78) * 240}px) rotateX(${Math.sin(angle) * -7}deg) rotateY(${Math.cos(angle) * 9}deg) rotateZ(${Math.cos(angle) * (locked ? 1 : 6)}deg) scale(${locked ? 1.08 : depth})`;
    fragment.style.zIndex = locked ? '20' : String(Math.round(depth * 10));
  });
  if (lockedFragment && lockLine) {
    const b = lockedFragment.getBoundingClientRect();
    const hx = rect.left + cx, hy = rect.top + cy;
    const fx = b.left + b.width / 2, fy = b.top + b.height / 2;
    lockLine.style.width = `${Math.hypot(fx - hx, fy - hy)}px`;
    lockLine.style.transform = `rotate(${Math.atan2(fy - hy, fx - hx)}rad)`;
    lockLine.classList.add('visible');
  }
  if (rig && !reduce) {
    const idle = performance.now() - lastInputTime > 10000;
    const camX = idle ? Math.sin(ms * .00012) * .4 : (mobile ? tiltX : (pointerX / innerWidth - .5) * 2);
    const camY = idle ? Math.cos(ms * .00009) * .25 : (mobile ? tiltY : (pointerY / innerHeight - .5) * 2);
    rig.style.setProperty('--cam-x', camX.toFixed(3));
    rig.style.setProperty('--cam-y', camY.toFixed(3));
  }
  orbitRaf = requestAnimationFrame(orbit);
}
orbitRaf = requestAnimationFrame(orbit);

window.addEventListener('pointermove', event => {
  pointerX = event.clientX; pointerY = event.clientY;
  lastInputTime = performance.now();
  if (cursor) cursor.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
}, { passive: true });

fragments.forEach(fragment => {
  fragment.addEventListener('pointerenter', () => !coarsePointer && setLock(fragment));
  fragment.addEventListener('pointerleave', () => !coarsePointer && clearLock(fragment));
  fragment.addEventListener('focus', () => setLock(fragment));
  fragment.addEventListener('blur', () => clearLock(fragment));
  fragment.addEventListener('click', event => {
    if (coarsePointer && mobilePrimed !== fragment) {
      event.preventDefault();
      mobilePrimed = fragment;
      setLock(fragment);
      status.textContent = `${fragment.querySelector('b').textContent} stabilized. Tap again to extract.`;
      return;
    }
    mobilePrimed = null;
    extract(fragment);
  });
});

function extract(fragment) {
  if (!fragment || hero?.classList.contains('is-extracting')) return;
  const target = document.getElementById(fragment.dataset.target);
  if (!target) return;
  setLock(fragment);
  hero.classList.add('is-extracting');
  const rect = fragment.getBoundingClientRect();
  const ghost = fragment.querySelector('.artifact-glass').cloneNode(true);
  ghost.classList.add('extraction-ghost');
  Object.assign(ghost.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height * .72}px` });
  document.body.appendChild(ghost);
  requestAnimationFrame(() => Object.assign(ghost.style, {
    left: `${innerWidth * .18}px`, top: `${innerHeight * .19}px`, width: `${innerWidth * .64}px`, height: `${innerHeight * .62}px`, transform: 'rotate(0deg) scale(1)', filter: 'brightness(1.5)'
  }));
  const name = fragment.querySelector('b').textContent;
  status.textContent = `Extracting ${name}.`;
  setTimeout(() => {
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    recovered.add(fragment.dataset.target);
    try { localStorage.setItem('nm-recovered', JSON.stringify([...recovered])); } catch (_) { /* storage is optional */ }
    updateRecoveredState();
    target.classList.add('is-recovered-now');
    target.querySelector('.recovered-signal')?.remove();
    const signal = document.createElement('span');
    signal.className = 'recovered-signal';
    signal.textContent = `Artifact ${fragment.dataset.index} · recovered`;
    target.appendChild(signal);
    status.textContent = `${name} recovered.`;
    setTimeout(() => { ghost.remove(); hero.classList.remove('is-extracting'); clearLock(fragment); }, 350);
    setTimeout(() => target.classList.remove('is-recovered-now'), 2400);
  }, reduce ? 20 : 820);
}

document.getElementById('extract-first')?.addEventListener('click', () => extract(fragments[0]));

// ── SMOOTH HASH NAVIGATION + PROJECT DEPTH ────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}));

if (!reduce && window.matchMedia('(min-width: 900px)').matches) {
  const frames = document.querySelectorAll('.project-frame');
  window.addEventListener('scroll', () => frames.forEach(frame => {
    const rect = frame.getBoundingClientRect();
    frame.style.backgroundPositionY = `calc(50% + ${((rect.top + rect.height / 2 - innerHeight / 2) / innerHeight) * 18}px)`;
  }), { passive: true });
  frames.forEach(frame => {
    frame.addEventListener('pointermove', event => {
      const b = frame.getBoundingClientRect(), x = (event.clientX - b.left) / b.width - .5, y = (event.clientY - b.top) / b.height - .5;
      frame.style.transform = `rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateZ(8px)`;
    });
    frame.addEventListener('pointerleave', () => { frame.style.transform = ''; });
  });
}


// ── REAL-TIME REPO CONSTELLATION DEPTH ───────────────────
const repoCards = [...document.querySelectorAll('[data-repo-card]')];
repoCards.forEach((card, index) => {
  card.style.setProperty('--repo-phase', String(index * 0.37));
  card.addEventListener('pointermove', event => {
    if (reduce) return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    card.style.setProperty('--repo-x', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--repo-y', `${(y * 100).toFixed(1)}%`);
    card.style.transform = `translate3d(${x * 8}px, ${y * 8}px, 28px) rotateX(${-y * 9}deg) rotateY(${x * 12}deg)`;
  });
  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
    card.style.removeProperty('--repo-x');
    card.style.removeProperty('--repo-y');
  });
});
