// Lưu trang vào máy để dùng offline. Đổi VERSION mỗi lần cập nhật.
const VERSION='202609291643';
const CACHE='sotap-'+VERSION;
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('sotap-')&&k!==CACHE&&k!=='sotap-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url);
  // font Google: lấy từ bộ nhớ trước, không có mới tải
  if(url.host==='fonts.googleapis.com'||url.host==='fonts.gstatic.com'){
    e.respondWith(caches.open('sotap-fonts').then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{c.put(req,r.clone());return r;}).catch(()=>hit))));return;
  }
  if(url.origin!==location.origin)return;
  // trang chính: thử mạng 2,5 giây để lấy bản mới, không được thì dùng bản đã lưu
  if(req.mode==='navigate'){
    e.respondWith(new Promise(res=>{
      let done=false;
      const fallback=()=>caches.match('./index.html').then(r=>{if(!done){done=true;res(r);}});
      const t=setTimeout(fallback,2500);
      fetch(req).then(r=>{clearTimeout(t);if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));}if(!done){done=true;res(r);}}).catch(()=>{clearTimeout(t);fallback();});
    }));return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return r;})));
});
