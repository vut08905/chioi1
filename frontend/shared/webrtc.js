/**
 * CHỊ ƠI! — WebRTC Voice Call Module
 * Quản lý gọi điện P2P giữa KH và Tasker trong phạm vi đơn hàng.
 * Dùng chung: chatvoitasker.html và chatvoikhachhang.html
 *
 * Yêu cầu: Socket.IO đã kết nối, truyền vào constructor.
 * Cách dùng: var call = new ChiOiCall(socket, user.user_id);
 */

function ChiOiCall(socket, userId) {
  this.socket = socket;
  this.userId = userId;
  this.localStream = null;
  this.peerConnection = null;
  this.isCalling = false;
  this.remoteUserId = null;
  this.currentOrderId = null;
  this.callTimer = null;
  this.callDuration = 0;
  this.ringtoneTimer = null;

  // ICE Servers (STUN miễn phí từ Google)
  this.iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  this._bindSocketEvents();
}

// ===== Gọi đi =====
ChiOiCall.prototype.startCall = async function(orderId, receiverId) {
  if (this.isCalling) {
    showToastMsg('⚠️ Đang trong cuộc gọi');
    return;
  }

  // Xin quyền mic
  try {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (e) {
    showToastMsg('⚠️ Cần cấp quyền microphone để gọi điện');
    return;
  }

  this.isCalling = true;
  this.remoteUserId = receiverId;
  this.currentOrderId = orderId;

  // Hiện UI đang gọi
  this._showCallingOverlay();

  // Gửi yêu cầu gọi qua socket
  this.socket.emit('call_request', { orderId: orderId, receiverId: receiverId });

  // Timeout 30s nếu không ai nghe
  var self = this;
  this.ringtoneTimer = setTimeout(function() {
    if (self.isCalling && !self.peerConnection) {
      showToastMsg('📞 Không có phản hồi');
      self.endCall();
    }
  }, 30000);
};

// ===== Nhận cuộc gọi đến =====
ChiOiCall.prototype._showIncomingCall = function(callerId, orderId) {
  if (this.isCalling) return; // Đang trong cuộc gọi khác

  this.remoteUserId = callerId;
  this.currentOrderId = orderId;

  var popup = document.getElementById('incoming-call-popup');
  if (popup) {
    popup.classList.remove('hidden');
    // Set caller info
    var nameEl = document.getElementById('incoming-name');
    if (nameEl) nameEl.textContent = 'Cuộc gọi từ đơn #' + orderId;
  }

  // Auto reject sau 30s
  var self = this;
  this.ringtoneTimer = setTimeout(function() {
    self.rejectCall(callerId);
  }, 30000);
};

// ===== Chấp nhận cuộc gọi =====
ChiOiCall.prototype.acceptCall = async function(callerId) {
  clearTimeout(this.ringtoneTimer);

  // Ẩn popup
  var popup = document.getElementById('incoming-call-popup');
  if (popup) popup.classList.add('hidden');

  // Xin mic
  try {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (e) {
    showToastMsg('⚠️ Cần cấp quyền microphone');
    this.socket.emit('call_rejected', { callerId: callerId });
    return;
  }

  this.isCalling = true;
  this.remoteUserId = callerId;

  // Hiện overlay cuộc gọi
  this._showCallingOverlay();
  this._updateCallStatus('Đã kết nối');

  // Gửi accepted
  this.socket.emit('call_accepted', { orderId: this.currentOrderId, callerId: callerId });
};

// ===== Từ chối cuộc gọi =====
ChiOiCall.prototype.rejectCall = function(callerId) {
  clearTimeout(this.ringtoneTimer);

  var popup = document.getElementById('incoming-call-popup');
  if (popup) popup.classList.add('hidden');

  this.socket.emit('call_rejected', { callerId: callerId });
  this.remoteUserId = null;
  this.currentOrderId = null;
};

// ===== Kết thúc cuộc gọi =====
ChiOiCall.prototype.endCall = function() {
  clearTimeout(this.ringtoneTimer);
  clearInterval(this.callTimer);

  // Notify đối phương
  if (this.remoteUserId) {
    this.socket.emit('call_ended', { receiverId: this.remoteUserId });
  }

  // Đóng peer connection
  if (this.peerConnection) {
    this.peerConnection.close();
    this.peerConnection = null;
  }

  // Giải phóng mic
  if (this.localStream) {
    this.localStream.getTracks().forEach(function(track) { track.stop(); });
    this.localStream = null;
  }

  // Ẩn overlay
  var overlay = document.getElementById('call-overlay');
  if (overlay) overlay.classList.add('hidden');

  this.isCalling = false;
  this.remoteUserId = null;
  this.currentOrderId = null;
  this.callDuration = 0;
};

// ===== Tạo PeerConnection =====
ChiOiCall.prototype._createPeerConnection = function() {
  var self = this;
  var pc = new RTCPeerConnection(this.iceConfig);

  // Thêm local audio tracks
  if (this.localStream) {
    this.localStream.getTracks().forEach(function(track) {
      pc.addTrack(track, self.localStream);
    });
  }

  // Nhận remote audio
  pc.ontrack = function(event) {
    var remoteAudio = document.getElementById('remote-audio');
    if (remoteAudio && event.streams[0]) {
      remoteAudio.srcObject = event.streams[0];
    }
  };

  // ICE candidates
  pc.onicecandidate = function(event) {
    if (event.candidate && self.remoteUserId) {
      self.socket.emit('ice_candidate', {
        receiverId: self.remoteUserId,
        candidate: event.candidate
      });
    }
  };

  // Connection state
  pc.onconnectionstatechange = function() {
    if (pc.connectionState === 'connected') {
      self._updateCallStatus('Đang gọi');
      self._startCallTimer();
    } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
      showToastMsg('📞 Mất kết nối');
      self.endCall();
    }
  };

  this.peerConnection = pc;
  return pc;
};

// ===== Socket event handlers =====
ChiOiCall.prototype._bindSocketEvents = function() {
  var self = this;

  // Có cuộc gọi đến
  this.socket.on('call_incoming', function(data) {
    self._showIncomingCall(data.callerId, data.orderId);
  });

  // Đối phương chấp nhận → tạo offer
  this.socket.on('call_accepted', async function(data) {
    clearTimeout(self.ringtoneTimer);
    self._updateCallStatus('Đang kết nối...');

    var pc = self._createPeerConnection();
    try {
      var offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      self.socket.emit('webrtc_offer', {
        receiverId: self.remoteUserId,
        sdp: offer
      });
    } catch (e) {
      console.error('[WebRTC] Lỗi tạo offer:', e);
      showToastMsg('⚠️ Lỗi kết nối cuộc gọi');
      self.endCall();
    }
  });

  // Đối phương từ chối
  this.socket.on('call_rejected', function() {
    clearTimeout(self.ringtoneTimer);
    showToastMsg('📞 Cuộc gọi bị từ chối');
    self.endCall();
  });

  // Nhận WebRTC offer → tạo answer
  this.socket.on('webrtc_offer', async function(data) {
    var pc = self._createPeerConnection();
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      self.socket.emit('webrtc_answer', {
        callerId: data.callerId,
        sdp: answer
      });
    } catch (e) {
      console.error('[WebRTC] Lỗi tạo answer:', e);
      self.endCall();
    }
  });

  // Nhận answer
  this.socket.on('webrtc_answer', async function(data) {
    if (self.peerConnection) {
      try {
        await self.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (e) {
        console.error('[WebRTC] Lỗi set remote description:', e);
      }
    }
  });

  // Nhận ICE candidate
  this.socket.on('ice_candidate', async function(data) {
    if (self.peerConnection && data.candidate) {
      try {
        await self.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.error('[WebRTC] Lỗi add ICE candidate:', e);
      }
    }
  });

  // Đối phương kết thúc
  this.socket.on('call_ended', function() {
    showToastMsg('📞 Cuộc gọi đã kết thúc');
    self.endCall();
  });

  // Gọi thất bại
  this.socket.on('call_failed', function(data) {
    showToastMsg('📞 ' + (data.reason || 'Không thể gọi'));
    self.endCall();
  });
};

// ===== UI Helpers =====
ChiOiCall.prototype._showCallingOverlay = function() {
  var overlay = document.getElementById('call-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    this._updateCallStatus('Đang gọi...');
  }
};

ChiOiCall.prototype._updateCallStatus = function(text) {
  var statusEl = document.getElementById('call-status');
  if (statusEl) statusEl.textContent = text;
};

ChiOiCall.prototype._startCallTimer = function() {
  var self = this;
  this.callDuration = 0;
  clearInterval(this.callTimer);
  this.callTimer = setInterval(function() {
    self.callDuration++;
    var mins = Math.floor(self.callDuration / 60);
    var secs = self.callDuration % 60;
    self._updateCallStatus(
      (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs
    );
  }, 1000);
};
