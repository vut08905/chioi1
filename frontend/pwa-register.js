// Chị Ơi! — PWA registration helper
// Inject vào trang nào cần PWA: <script src="/pwa-register.js" defer></script>
// Trang đầu tiên user vào sẽ tự register SW + show install prompt nếu eligible.

(function() {
  if (!('serviceWorker' in navigator)) return;

  // Register SW khi trang load xong
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function(reg) {
        console.log('[PWA] SW registered scope:', reg.scope);

        // Check update mỗi 1 giờ
        setInterval(function() { reg.update().catch(() => {}); }, 60 * 60 * 1000);

        // Khi có version mới: prompt user reload
        reg.addEventListener('updatefound', function() {
          var newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', function() {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              if (typeof showToastMsg === 'function') {
                showToastMsg('Có phiên bản mới — tải lại để cập nhật', 5000);
              }
            }
          });
        });
      })
      .catch(function(err) { console.warn('[PWA] SW register fail:', err); });
  });

  // Install prompt — capture event để show button "Cài app"
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    window.__chioi_install_ready = true;
    console.log('[PWA] Install prompt sẵn sàng — gọi window.__chioi_install() để hiện');
  });

  // Public function — gọi từ HTML để trigger install: <button onclick="__chioi_install()">Cài app</button>
  window.__chioi_install = function() {
    if (!deferredPrompt) {
      if (typeof showToastMsg === 'function') {
        showToastMsg('Trình duyệt chưa sẵn sàng — vui lòng thử lại sau hoặc dùng "Add to Home Screen" thủ công');
      }
      return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choice) {
      console.log('[PWA] User choice:', choice.outcome);
      deferredPrompt = null;
      window.__chioi_install_ready = false;
    });
  };

  // Track installed
  window.addEventListener('appinstalled', function() {
    console.log('[PWA] App installed');
    if (typeof showToastMsg === 'function') showToastMsg('Đã cài Chị Ơi! lên màn hình chính');
  });
})();
