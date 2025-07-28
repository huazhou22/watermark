const CACHE_NAME = 'watermark-cache-v1';
const urlsToCache = [
  '/',                    // 根路径，通常映射到 index.html
  '/index.html',         // 主页面
  '/offline.html',       // 离线回退页面
  '/static/js/main.c972b482.js',   // 替换为实际的 JS 文件名
  '/static/css/main.540eafe2.css', // 替换为实际的 CSS 文件名
  '/static/media/icon-192.png',    // 图标
  '/static/media/icon-512.png'     // 图标
];

// 安装 Service Worker，缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        // 逐个添加资源，跳过失败的请求
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.error(`缓存 ${url} 失败: ${err}`);
              return null; // 忽略失败的资源
            });
          })
        );
      })
      .catch(err => {
        console.error('缓存打开失败:', err);
      })
  );
});

// 拦截网络请求，优先返回缓存资源
self.addEventListener('fetch', event => {
  // 仅处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存命中，返回缓存
        if (response) {
          return response;
        }
        // 否则发起网络请求
        return fetch(event.request)
          .then(networkResponse => {
            // 检查响应是否有效
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // 缓存新的响应（可选，动态缓存）
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            // 离线时返回 offline.html（确保已缓存）
            return caches.match('/offline.html')
              .then(response => {
                if (response) {
                  return response;
                }
                // 如果 offline.html 未缓存，返回默认错误
                return new Response('离线模式：无法加载资源', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
              });
          });
      })
  );
});

// 更新 Service Worker，清理旧缓存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});