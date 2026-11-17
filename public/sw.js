// Service worker mínimo (habilita a instalação). Sem cache offline: os dados vêm do Supabase.
self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',()=>{});
