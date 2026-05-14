/**
 * CHỊ ƠI! — Shared API Client
 * File dùng chung cho tất cả Frontend (Khachhang, Giupviec, Admin)
 * Cung cấp: BASE_URL, fetch wrapper (tự đính JWT), và Socket.IO helpers.
 *
 * Cách dùng: <script src="../shared/api.js"></script>
 */

// ==============================================================
// 1. CẤU HÌNH - TỰ ĐỘNG DETECT MÔI TRƯỜNG
// ==============================================================
// Production (Nginx port 80/443): API proxy cùng origin → không cần port
// Dev local (http-server port 8080): API chạy riêng port 3000
const _port = window.location.port;
const _isProduction = (!_port || _port === '80' || _port === '443');
const API_BASE = _isProduction
  ? `${window.location.protocol}//${window.location.hostname}`
  : `${window.location.protocol}//${window.location.hostname}:3000`;

// ==============================================================
// 2. TOKEN MANAGEMENT
// ==============================================================
const ChiOiAuth = {
  /** Lưu token + user info sau khi đăng nhập thành công */
  saveLogin(data) {
    localStorage.setItem('chioi_token', data.access_token);
    localStorage.setItem('chioi_user', JSON.stringify(data.user));
  },

  /** Lấy JWT token đã lưu */
  getToken() {
    return localStorage.getItem('chioi_token');
  },

  /** Lấy thông tin user đã lưu */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('chioi_user'));
    } catch (e) {
      return null;
    }
  },

  /** Đăng xuất — xóa token và chuyển về trang đăng nhập */
  logout(redirectUrl) {
    localStorage.removeItem('chioi_token');
    localStorage.removeItem('chioi_user');
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  /** Kiểm tra đã đăng nhập chưa */
  isLoggedIn() {
    return !!this.getToken();
  },

  /** Bắt buộc đăng nhập — nếu chưa có token thì redirect */
  requireAuth(loginPageUrl) {
    if (!this.isLoggedIn()) {
      window.location.href = loginPageUrl || 'dangnhap.html';
      return false;
    }
    return true;
  }
};

// ==============================================================
// 3. FETCH WRAPPER — Tự động gắn JWT vào mọi request
// ==============================================================
/**
 * Gọi API Backend. Tự động:
 * - Gắn Authorization: Bearer <token>
 * - Gắn Content-Type: application/json
 * - Parse JSON response
 * - Throw lỗi nếu status >= 400
 *
 * @param {string} endpoint - Ví dụ: '/api/services'
 * @param {object} options - { method, body, ... }
 * @returns {Promise<any>} - parsed JSON
 */
async function apiFetch(endpoint, options = {}) {
  const url = API_BASE + endpoint;
  const token = ChiOiAuth.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const config = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  // Nếu có body và là object, stringify
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkErr) {
    // Lỗi 7 FIX: Catch network error (mất mạng, DNS fail, etc.)
    throw new Error('Không có kết nối mạng. Vui lòng kiểm tra Internet và thử lại.');
  }

  const data = await response.json().catch(() => null);

  // Lỗi 4,10 FIX: Phân biệt 401 khi login vs 401 token expired
  if (response.status === 401) {
    // Nếu đang gọi endpoint login → KHÔNG logout, chỉ throw message từ backend
    if (endpoint.includes('/auth/login')) {
      const errorMsg = (data && data.message) || 'Sai số điện thoại hoặc mật khẩu.';
      throw new Error(errorMsg);
    }
    // Các endpoint khác → token hết hạn → logout
    ChiOiAuth.logout();
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    const errorMsg = (data && data.message) || 'Lỗi hệ thống. Vui lòng thử lại.';
    throw new Error(errorMsg);
  }

  return data;
}

// ==============================================================
// 4. SOCKET.IO WRAPPER
// ==============================================================
/**
 * Kết nối Socket.IO đến backend (dùng cho realtime: đơn hàng, chat).
 * Yêu cầu: trang HTML phải thêm <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
 *
 * @returns {Socket|null} - Socket.IO instance hoặc null nếu chưa đăng nhập
 */
function connectSocket() {
  if (typeof io === 'undefined') {
    console.warn('[ChiOi] Socket.IO chưa được load. Hãy thêm <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>');
    return null;
  }

  const token = ChiOiAuth.getToken();
  if (!token) {
    console.warn('[ChiOi] Chưa đăng nhập, không thể kết nối Socket.');
    return null;
  }

  const socket = io(API_BASE, {
    auth: { token: token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[ChiOi] Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[ChiOi] Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[ChiOi] Socket disconnected:', reason);
  });

  return socket;
}

// ==============================================================
// 5. UTILITY FUNCTIONS
// ==============================================================
/** Format tiền VNĐ: 150000 → "150.000 đ" */
function formatVND(amount) {
  if (amount == null || isNaN(amount)) return '0 đ';
  return Number(amount).toLocaleString('vi-VN') + ' đ';
}

/** Format ngày giờ: ISO string → "12/05/2026, 14:30" */
function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN') + ', ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/** Format ngày: ISO string → "12/05/2026" */
function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('vi-VN');
}

/** Hiển thị toast notification */
function showToastMsg(message, duration) {
  duration = duration || 3000;
  // Tìm toast element sẵn có hoặc tạo mới
  var toast = document.getElementById('api-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'api-toast';
    toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:10000;padding:12px 24px;border-radius:12px;background:#303030;color:#fff;font-size:14px;font-family:Be Vietnam Pro,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.15);transition:opacity 0.3s;opacity:0;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.pointerEvents = 'auto';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
  }, duration);
}

/** Hiển thị loading overlay */
function showLoading() {
  var overlay = document.getElementById('api-loading');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'api-loading';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="width:48px;height:48px;border:4px solid #ffdbcc;border-top-color:#a04100;border-radius:50%;animation:spin 0.8s linear infinite;"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

/** Ẩn loading overlay */
function hideLoading() {
  var overlay = document.getElementById('api-loading');
  if (overlay) overlay.style.display = 'none';
}

// ==============================================================
// 6. HELPER FUNCTIONS
// ==============================================================

/** Hiển thị toast message tạm thời */
function showToastMsg(message, duration) {
  duration = duration || 3000;
  var existing = document.getElementById('chioi-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'chioi-toast';
  toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:10000;background:#241914;color:white;padding:12px 24px;border-radius:12px;font-size:14px;font-family:"Be Vietnam Pro",sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.15);max-width:90%;text-align:center;animation:toastIn 0.3s ease-out;';
  toast.textContent = message;

  // Add animation keyframes
  if (!document.getElementById('toast-style')) {
    var style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes toastOut{from{opacity:1}to{opacity:0}}';
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.animation = 'toastOut 0.3s ease-in forwards';
    setTimeout(function() { toast.remove(); }, 300);
  }, duration);
}

/** Format datetime sang dạng tiếng Việt */
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  var day = ('0' + d.getDate()).slice(-2);
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var year = d.getFullYear();
  var hours = ('0' + d.getHours()).slice(-2);
  var mins = ('0' + d.getMinutes()).slice(-2);
  return day + '/' + month + '/' + year + ' ' + hours + ':' + mins;
}

/** Format số tiền VNĐ */
function formatVND(amount) {
  if (!amount && amount !== 0) return '0đ';
  var num = Number(amount);
  if (isNaN(num)) return '0đ';
  return num.toLocaleString('vi-VN') + 'đ';
}
