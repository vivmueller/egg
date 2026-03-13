// app.js

/* Service worker */
// --- Service worker registration + automatic update/reload ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(reg => {
    // If a worker is already waiting, activate it immediately
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // When an update is found, wait until it's installed and then ask it to skipWaiting
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          // new worker installed -> ask it to become active
          newSW.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
  }).catch(() => { /* ignore registration errors here */ });

  // When the new SW takes control, reload once
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload(true);
  });
}

/* Helpers */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function safeOpen(url){
  try{ window.open(url, '_blank', 'noopener'); } catch (e){ window.location.href = url; }
}

/* External and internal handlers (explicit per-element plus delegated fallback) */
$$('.cal-btn').forEach(b => {
  b.addEventListener('click', e => {
    const url = b.dataset.external;
    if (url){ safeOpen(url); e.stopPropagation(); }
  });
});
$$('.nav-btn').forEach(b => {
  const target = b.dataset.internal;
  if (target){
    b.addEventListener('click', e => {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      e.stopPropagation();
    });
  }
});
document.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  // Ticket handled separately below
  if (btn.id === 'ticket-button') return;
  const ext = btn.dataset.external;
  const int = btn.dataset.internal;
  if (ext){ safeOpen(ext); return; }
  if (int){
    const el = document.getElementById(int);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }
});

/* Ticket logic */
const ticketButton = document.getElementById('ticket-button');
const ticketInput = document.getElementById('ticket-input');
const ticketMenu = document.getElementById('ticket-menu');

/* Shows ticket in overlay and can be closed */
function viewTicket(){
  const data = localStorage.getItem('egg_ticket_data');
  if (!data) return alert('No ticket saved.');

  // If overlay already exists, just reopen it and update content
  let overlay = document.getElementById('egg-ticket-overlay');
  if (overlay){
    overlay.style.display = 'flex';
    const sheet = overlay.querySelector('.egg-ticket-inner');
    // remove previous content (img or iframe) but keep the close button
    const prev = sheet.querySelector('.egg-ticket-content');
    if (prev) prev.remove();

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'egg-ticket-content';
    contentWrapper.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:center;';

    if (data.startsWith('data:image/')){
      const img = document.createElement('img');
      img.src = data;
      img.style.cssText = 'max-width:100%;max-height:80vh;object-fit:contain;';
      contentWrapper.appendChild(img);
    } else {
      const ifr = document.createElement('iframe');
      ifr.src = data;
      ifr.style.cssText = 'border:0;width:100%;height:80vh;';
      contentWrapper.appendChild(ifr);
    }
    sheet.insertBefore(contentWrapper, sheet.firstChild);
    return;
  }

  // create overlay
  overlay = document.createElement('div');
  overlay.id = 'egg-ticket-overlay';
  overlay.style.cssText = [
    'position:fixed','inset:0','display:flex','align-items:center','justify-content:center',
    'background:rgba(0,0,0,0.6)','z-index:9999','padding:20px'
  ].join(';');

  // inner sheet
  const sheet = document.createElement('div');
  sheet.className = 'egg-ticket-inner';
  sheet.style.cssText = 'background:#fff;border-radius:10px;max-width:980px;width:100%;max-height:90vh;overflow:hidden;position:relative;display:flex;flex-direction:column;align-items:center;';

  // close button
  const close = document.createElement('button');
  close.type = 'button';
  close.innerText = '✕';
  close.title = 'Close ticket';
  close.style.cssText = 'position:absolute;right:8px;top:8px;border:0;background:transparent;font-size:20px;cursor:pointer;';
  close.addEventListener('click', ()=> overlay.style.display = 'none');

  // content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'egg-ticket-content';
  contentWrapper.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:center;';

  if (data.startsWith('data:image/')){
    const img = document.createElement('img');
    img.src = data;
    img.style.cssText = 'max-width:100%;max-height:80vh;object-fit:contain;';
    contentWrapper.appendChild(img);
  } else {
    const ifr = document.createElement('iframe');
    ifr.src = data;
    ifr.style.cssText = 'border:0;width:100%;height:80vh;';
    contentWrapper.appendChild(ifr);
  }

  sheet.appendChild(contentWrapper);
  sheet.appendChild(close);
  overlay.appendChild(sheet);

  // clicking backdrop closes
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  // Escape to close
  document.addEventListener('keydown', function escHandler(e){
    if (e.key === 'Escape'){
      if (overlay.style.display !== 'none') overlay.style.display = 'none';
    }
  });

  document.body.appendChild(overlay);
}

function replaceTicket(){
  if (ticketInput){ ticketInput.value=''; ticketInput.click(); }
}
function removeTicket(){
  if (!confirm('Remove saved ticket?')) return;
  localStorage.removeItem('egg_ticket_data');
  localStorage.removeItem('egg_ticket_name');
  ticketButton?.classList.remove('has-ticket');
  alert('Ticket removed.');
  if (ticketMenu) ticketMenu.setAttribute('aria-hidden','true');
}

if (ticketInput){
  ticketInput.addEventListener('change', function(){
    const f = this.files && this.files[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024){ alert('File too large. Max 10MB.'); this.value=''; return; }
    const reader = new FileReader();
    reader.onload = function(ev){
      localStorage.setItem('egg_ticket_data', ev.target.result);
      localStorage.setItem('egg_ticket_name', f.name);
      ticketButton?.classList.add('has-ticket');
      alert('Ticket saved locally.');
    };
    reader.readAsDataURL(f);
  }, { passive: true });
}

if (ticketButton){
  ticketButton.addEventListener('click', function(ev){
    const hasTicket = !!localStorage.getItem('egg_ticket_data');

    // Shift click = remove
    if (ev.shiftKey){
      if (hasTicket) removeTicket();
      else alert('No ticket to remove.');
      return;
    }
    // Ctrl/Cmd click = replace
    if (ev.ctrlKey || ev.metaKey){
      replaceTicket();
      return;
    }
    // No ticket: open picker
    if (!hasTicket){
      replaceTicket();
      return;
    }
    // With ticket: toggle floating menu
    if (!ticketMenu){ viewTicket(); return; }
    const opened = ticketMenu.getAttribute('aria-hidden') === 'false';
    ticketMenu.setAttribute('aria-hidden', opened ? 'true' : 'false');
  });
}
if (ticketMenu){
  ticketMenu.addEventListener('click', function(e){
    const id = e.target.id;
    if (!id) return;
    if (id === 'ticket-menu-view'){ ticketMenu.setAttribute('aria-hidden','true'); viewTicket(); }
    if (id === 'ticket-menu-replace'){ ticketMenu.setAttribute('aria-hidden','true'); replaceTicket(); }
    if (id === 'ticket-menu-remove'){ ticketMenu.setAttribute('aria-hidden','true'); removeTicket(); }
  });
  document.addEventListener('click', (e) => {
    if (!ticketMenu.contains(e.target) && e.target !== ticketButton) ticketMenu.setAttribute('aria-hidden','true');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') ticketMenu.setAttribute('aria-hidden','true'); });
}

/* Back-to-top logic (based on happy-egg separator) */
const backBtn = document.getElementById('back-to-top');
const happyEggWrap = document.querySelector('.happy-egg-wrap');

// threshold measured in px from the TOP of the viewport.
// - 0 => show exactly when the egg top reaches the viewport top.
// - 100 => show when the egg top is 100px below the viewport top (i.e. earlier).
// - -50 => show only after egg top moved 50px above the viewport top (i.e. later).
const thresholdFromTopPx = -10;

function checkBackToTop(){
  if (!backBtn || !happyEggWrap) return;
  const r = happyEggWrap.getBoundingClientRect();
  // r.top is distance from viewport top to the element top.
  if (r.top <= thresholdFromTopPx) backBtn.style.display = 'flex';
  else backBtn.style.display = 'none';
}

// attach listeners (idempotent enough; remove duplicate listeners if you run this twice)
window.removeEventListener('scroll', checkBackToTop, { passive: true });
window.removeEventListener('resize', checkBackToTop);
window.addEventListener('scroll', checkBackToTop, { passive: true });
window.addEventListener('resize', checkBackToTop);
checkBackToTop(); // initial check

// click behavior (keeps previous behavior)
if (backBtn){
  backBtn.addEventListener('click', () => {
    const topEl = document.getElementById('top');
    if (topEl) topEl.scrollIntoView({ behavior:'smooth' });
    else window.scrollTo({ top: 0, behavior:'smooth' });
  });
}

/* Ensure guests button opens external */
const guestsBtn = document.getElementById('guests-button');
if (guestsBtn){
  guestsBtn.addEventListener('click', () => {
    const url = guestsBtn.dataset.external || 'http://www.placeholder.com/guests';
    safeOpen(url);
  });
}

/* Initialize: mark ticket button if stored */
if (localStorage.getItem('egg_ticket_data')) ticketButton?.classList.add('has-ticket');