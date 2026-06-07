/**
 * api.js — 백엔드 연결 설정
 * WebSocket 및 파일 업로드 API 엔드포인트를 여기서 관리합니다.
 */

// ─────────────────────────────────────────
// 환경 설정 (배포 시 이 값들을 수정하세요)
// ─────────────────────────────────────────
export const CONFIG = {
  // 현재 페이지 기준 상대경로로 WS 접속 (nginx가 /ws/chat 을 backend로 프록시)
  WS_URL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/chat`,

  // 파일 업로드도 마찬가지로 상대경로
  FILE_UPLOAD_URL: `${location.origin}/api/upload`,

  RECONNECT_INTERVAL_MS: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  ALLOWED_FILE_TYPES: ["image/*", ".pdf", ".txt", ".doc", ".docx", ".xlsx", ".csv"],
  MAX_FILE_SIZE_MB: 20,
};

// ─────────────────────────────────────────
// WebSocket 클라이언트
// ─────────────────────────────────────────
export class ChatWebSocket {
  constructor(handlers = {}) {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.handlers = {
      onMessage: handlers.onMessage || (() => {}),
      onOpen: handlers.onOpen || (() => {}),
      onClose: handlers.onClose || (() => {}),
      onError: handlers.onError || (() => {}),
    };
  }

  connect() {
    try {
      this.ws = new WebSocket(CONFIG.WS_URL);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.handlers.onOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.onMessage(data);
        } catch {
          // plain text 응답 처리
          this.handlers.onMessage({ type: "text", content: event.data });
        }
      };

      this.ws.onclose = () => {
        this.handlers.onClose();
        this._tryReconnect();
      };

      this.ws.onerror = (err) => {
        this.handlers.onError(err);
      };
    } catch (err) {
      this.handlers.onError(err);
    }
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  disconnect() {
    this.reconnectAttempts = CONFIG.MAX_RECONNECT_ATTEMPTS; // 재연결 방지
    if (this.ws) {
      this.ws.close();
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  _tryReconnect() {
    if (this.reconnectAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) return;
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), CONFIG.RECONNECT_INTERVAL_MS);
  }
}

// ─────────────────────────────────────────
// 파일 업로드 API
// ─────────────────────────────────────────

/**
 * 파일을 서버에 업로드하고 파일 메타데이터를 반환합니다.
 * @param {File} file - 업로드할 파일 객체
 * @returns {Promise<{ fileId: string, fileName: string, fileUrl: string }>}
 */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(CONFIG.FILE_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`파일 업로드 실패: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result; // { fileId, fileName, fileUrl, ... }
}

/**
 * 파일 크기 및 타입 유효성 검사
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
  const maxBytes = CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `파일 크기는 ${CONFIG.MAX_FILE_SIZE_MB}MB 이하여야 합니다.` };
  }
  return { valid: true };
}

// ─────────────────────────────────────────
// 메시지 포맷 헬퍼
// ─────────────────────────────────────────

/**
 * 텍스트 메시지 WebSocket 페이로드 생성
 */
export function buildTextMessage(text, sessionId) {
  return {
    type: "message",
    sessionId,
    content: text,
    timestamp: Date.now(),
  };
}

/**
 * 파일 첨부 메시지 WebSocket 페이로드 생성
 * (파일 업로드 후 받은 fileId를 사용)
 */
export function buildFileMessage(text, fileId, fileName, sessionId) {
  return {
    type: "message_with_file",
    sessionId,
    content: text,
    fileId,
    fileName,
    timestamp: Date.now(),
  };
}
