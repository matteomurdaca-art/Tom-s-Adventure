const VERSION='tom-v23';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-180.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // pagina: prima la rete (per gli aggiornamenti), poi la copia salvata
    // ogni pagina (gioco principale e giochi della Sala giochi) viene salvata con il suo indirizzo
    if(req.mode==='navigate'){ const main=/\/$|\/index\.html$/.test(url.pathname)&&url.pathname.indexOf('/giochi/')<0;
      e.respondWith(fetch(req).then(r=>{ const cp=r.clone(), cp2=main?r.clone():null; caches.open(VERSION).then(c=>{ c.put(url.pathname,cp); if(cp2) c.put('index.html',cp2); }); return r; })
        .catch(()=>caches.match(url.pathname).then(m=>m||caches.match(main?'index.html':url.pathname)).then(m=>m||caches.match('index.html')))); return; }
    // altri file (es. il motore 3D): salvati alla prima apertura, poi usati anche offline
    e.respondWith(caches.match(req).then(m=>m||fetch(req).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(VERSION).then(c=>c.put(req,cp)); } return r; })));
    return;
  }
  // caratteri di Google Fonts: salvati alla prima apertura, poi usati anche offline
  if(url.host==='fonts.googleapis.com'||url.host==='fonts.gstatic.com'){
    e.respondWith(caches.open(VERSION+'-fonts').then(c=>c.match(req).then(m=>m||fetch(req).then(r=>{ c.put(req,r.clone()); return r; }))));
  }
});
