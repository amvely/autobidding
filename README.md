# 네이버 검색광고 API 프록시 (Vercel)

네이버 검색광고 API의 CORS 문제를 해결하기 위한 Vercel 서버리스 프록시입니다.

---

## 배포 방법

### 1. GitHub에 올리기

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/본인계정/naver-ad-proxy.git
git push -u origin main
```

### 2. Vercel 연결

1. [vercel.com](https://vercel.com) 접속 후 GitHub 계정으로 로그인
2. **Add New Project** 클릭
3. 방금 올린 `naver-ad-proxy` 레포 선택 → **Deploy**

### 3. 환경변수 등록 (중요!)

Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**

| 변수명 | 값 |
|--------|-----|
| `API_KEY` | 네이버 검색광고 API 키 |
| `SECRET_KEY` | 네이버 검색광고 시크릿 키 |
| `CUSTOMER_ID` | 광고주 ID (숫자) |

등록 후 **Redeploy** 클릭

### 4. HTML 파일 수정

`naver_ad_monitor_v4.html` 상단의 PROXY_BASE를 Vercel 배포 주소로 변경:

```js
// 변경 전
const PROXY_BASE = 'http://localhost:3000/api';

// 변경 후 (본인 Vercel 주소)
const PROXY_BASE = 'https://naver-ad-proxy-xxx.vercel.app/api';
```

---

## 파일 구조

```
naver-ad-proxy/
├── api/
│   └── [...path].js   # 프록시 핸들러 (Vercel 서버리스 함수)
├── .env.local          # 로컬 테스트용 (GitHub에 올라가지 않음)
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

---

## 주의사항

- `.env.local`은 `.gitignore`에 포함되어 있어 GitHub에 올라가지 않습니다.
- API 키는 반드시 Vercel 대시보드 환경변수에만 입력하세요.
- 네이버 API 키는 [searchad.naver.com](https://searchad.naver.com) → 도구 → API 관리에서 발급받으세요.
