const CACHE='neo-cache-v3';
const ASSETS=['/','/manifest.webmanifest','/images/icon.svg','/offline.html'];
const CACHE_PATTERNS=[/^\/css\//,/^\/js\//,/^\/images\//];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);
  if(!CACHE_PATTERNS.some(function(p){return p.test(url.pathname)})&&e.request.mode!=='navigate')return;
  e.respondWith(caches.match(e.request).then(function(r){
    if(r)return r;
    return fetch(e.request).then(function(res){
      if(res.ok&&res.type==='basic'){
        var clone=res.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,clone)});
      }
      return res;
    });
  }).catch(function(){
    if(e.request.mode==='navigate')return caches.match('/offline.html').then(function(r){return r||caches.match('/')});
    return new Response('Offline',{status:503});
  }));
});
self.addEventListener('sync',e=>{
  if(e.tag==='analytics-sync'){
    e.waitUntil(caches.open(CACHE).then(function(c){
      var data=localStorage.getItem('neo-analytics');
      if(data)return c.put('/analytics-sync',new Response(data,{headers:{'Content-Type':'application/json'}}));
    }));
  }
});
