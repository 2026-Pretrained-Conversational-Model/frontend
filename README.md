# frontend — 채팅 UI

> **Multiturn Memory Chat의 웹 클라이언트.** 별도 빌드 없이 동작하는 정적 HTML/JS로, WebSocket 실시간 채팅과 파일 업로드를 제공합니다.

전체 프로젝트 개요는 대표 저장소 [docs](https://github.com/2026-Pretrained-Conversational-Model/docs)를 참고하세요.

```
★[프론트엔드]★ ⇄ WebSocket ⇄ [Node.js 게이트웨이] ⇄ HTTP ⇄ [FastAPI 오케스트레이터]
```

---

## 주요 기능

- WebSocket 기반 실시간 채팅
- 파일(PDF/이미지) 첨부 및 업로드
- 로그인 없이 바로 사용
- 새로고침 시 채팅 기록 초기화(세션은 서버가 관리)

## 기술 스택

- 순수 HTML + JavaScript (프레임워크/빌드 없음)
- 배포: nginx (정적 서빙 + 게이트웨이로 프록시) · Docker

## 파일 구조

```
├── index.html     메인 UI
├── api.js         백엔드 연결 설정(WebSocket·파일 업로드) 및 통신 로직
├── nginx.conf     정적 서빙 + /ws/chat · /api 프록시 설정
└── Dockerfile     nginx 이미지 빌드
```

---

## 설정 위치

서버 주소는 `.env`가 아니라 `api.js`의 `CONFIG`에서 정합니다. 기본값은 현재 호스트를 따라가도록 되어 있어, 게이트웨이와 같은 도메인으로 서빙하면 수정이 필요 없습니다.

```js
export const CONFIG = {
  WS_URL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/chat`,
  FILE_UPLOAD_URL: `${location.origin}/api/upload`,
  MAX_FILE_SIZE_MB: 20,
};
```

게이트웨이를 다른 호스트로 띄운다면 `WS_URL` / `FILE_UPLOAD_URL`을 해당 주소로 바꾸거나, `nginx.conf`에서 프록시 대상을 설정하면 됩니다.

---

## 실행

```bash
# 1) 정적 파일을 직접 열기 (게이트웨이가 같은 호스트일 때)
#    index.html 을 브라우저로 열기

# 2) Docker(nginx)로 서빙
docker build -t mmc-frontend .
docker run -p 8080:80 mmc-frontend
```

> 참고: 이 앱의 git 저장소는 `frontend/frontend/`에 위치합니다(상위 `frontend/`는 컨테이너 폴더). 포폴 정리 시 한 단계로 평탄화하는 것을 권장합니다.

---

## 담당 역할

- 프론트엔드 UI/통신: 팀 공동 (설계·통합: 김예슬)
