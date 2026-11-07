/* Mis Turnos (versión nueva): funciona sin conexión. Sube el número de CACHE al publicar cambios.
   Solo borra cachés con su propio prefijo, para no tocar los de la app antigua (mismo dominio). */
const PREFIX="turnos2-";
const CACHE=PREFIX+"v2";
const FILES=["./","index.html","manifest.webmanifest","icon.svg","icon-192.png","icon-512-1.png"];

self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>Promise.allSettled(FILES.map(u=>c.add(u))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

/* Responde desde caché y actualiza en segundo plano. */
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request);
    const net=fetch(e.request).then(r=>{
      if(r&&(r.ok||r.type==="opaque"))c.put(e.request,r.clone());
      return r;
    }).catch(()=>hit);
    return hit||net;
  }));
});
