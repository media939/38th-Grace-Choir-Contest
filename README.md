# 38th Grace Choir Contest — YouTube 링크 전용

제38회 은혜성가제 홈페이지입니다.

- 일시: **2026년 12월 13일 주일 오후 2시 (미국 서부시간)**
- 장소: 은혜한인교회 비전센터 본당
- 주소: 150 S. Brookhurst Rd., Fullerton, CA 92833
- 참가: 28개 그룹 + EM + GMI 은혜교회 (총 30팀)
- **참가팀 영상 30개 + 전체 영상 1개 + YouTube Shorts 5개 — 모두 유튜브 링크로 등록**
- 원본 사진 5장, 왼쪽 상단·하단 교회 로고, 모바일/데스크톱 반응형 화면

## 유튜브 영상 등록 방법

관리자 설정을 완료한 후 다음 순서로 등록합니다.

1. 홈페이지 하단 **영상 관리** 또는 `/admin`으로 이동하고 관리자 비밀번호로 로그인합니다.
2. 영상 항목에서 참가팀, 성가제 전체 영상 또는 Shorts를 선택합니다.
3. 참가팀 이름/영상 제목과 찬양곡/설명을 입력합니다.
4. **유튜브 링크**에 영상 주소를 붙여넣고 **유튜브 링크 저장**을 누릅니다.
5. 홈페이지에서 등록한 영상이 재생됩니다. **링크 등록 해제**는 이 홈페이지에서 링크 연결만 해제합니다.

지원되는 주소 형식:

- `https://www.youtube.com/watch?v=영상ID`
- `https://youtu.be/영상ID`
- `https://www.youtube.com/shorts/영상ID`
- `https://www.youtube.com/live/영상ID`
- 공유 주소 뒤의 `?si=...`, `&t=...` 같은 추가 매개변수도 처리합니다.

영상 자체는 유튜브에서 재생됩니다. 파일을 홈페이지에 직접 업로드하는 기능은 없습니다. 유튜브에서 공개 또는 일부 공개로 설정하고, 외부 사이트 재생을 허용해 주세요. 재생이 제한된 영상은 플레이어 아래 **YouTube에서 보기**로 이동할 수 있습니다.

아직 영상이 없는 항목은 **영상 준비 중**으로 표시됩니다. 링크를 등록하지 않은 항목은 이름·설명만 먼저 저장할 수 있습니다.

## GitHub와 Vercel 배포

압축을 풀고 내용물 전체를 GitHub 저장소 최상위에 올리세요. `package.json`과 `vercel.json`이 최상위에 있어야 합니다. GitHub 저장소의 main 브랜치를 Vercel 프로젝트와 연결합니다.

- Framework: **Other**
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `public`
- Node.js: 22 이상

빌드/출력 설정은 `vercel.json`에 포함되어 있습니다. main 브랜치에 변경사항을 올리면 연결된 Vercel 프로젝트에서 자동 배포됩니다.

## 관리자와 링크 저장 설정

관리 화면에서 저장한 링크가 다른 방문자에게도 보이도록 **Vercel Blob**에 작은 JSON 목록을 저장합니다. Blob에는 유튜브 링크, 참가팀 이름, 찬양곡/설명만 저장하며 영상 파일은 저장하지 않습니다.

1. Vercel 프로젝트의 Storage에서 **public Blob store**를 생성하거나 연결합니다.
2. 연결한 저장소의 `BLOB_READ_WRITE_TOKEN`을 프로젝트의 **Production** 환경 변수에 설정합니다. 연결 과정에서 자동 추가되면 해당 값을 그대로 사용합니다.
3. 프로젝트 Settings → Environment Variables에 다음 두 값을 추가합니다.
   - `ADMIN_PASSWORD`: 직접 정한 관리자 비밀번호, 최소 20자
   - `SESSION_SECRET`: 충분히 긴 임의의 문자열, 최소 32자
4. 환경 변수를 저장한 뒤 **Redeploy**합니다.
5. `/admin`에서 설정한 비밀번호로 로그인합니다.

실제 비밀번호와 토큰을 GitHub 파일이나 `.env.example`에 넣지 마세요. Vercel 저장소 이용량은 해당 계정 요금제와 한도를 따릅니다.

링크 목록은 Blob의 `metadata/festival.json`에 저장되고 ETag 조건부 쓰기로 동시 수정 충돌을 감지합니다. 관리자 쿠키는 HttpOnly, Secure, SameSite=Strict이며 12시간 후 만료됩니다. 변경 요청은 같은 출처와 관리자 세션을 검증합니다. 비밀번호와 세션키를 모두 교체해 재배포하면 기존 세션을 해제할 수 있습니다.

## 로컬 실행

```sh
npm ci
npm test
npm run build
npm run dev
```

설정되지 않은 로컬 환경에서는 화면과 사진을 확인할 수 있으며, 관리자 로그인 및 링크 저장은 위 환경 변수 설정 후 사용할 수 있습니다.

## 수정 위치

- `src/page.html`: 디자인, 행사 안내, 메뉴, 사진 설명
- `src/app.js`: 갤러리, 유튜브 재생, 영상 목록, 관리자 화면
- `lib/festival.js`: 36개 영상 항목과 유튜브 주소 검증
- `lib/store.js`: 링크 목록 저장
- `api/router.js`: 관리자 인증 및 링크 등록 API
- `photos/`: 사용자가 제공한 2025년 제37회 성가제 원본 사진 5장
- `assets/gmi-logo.png`: 사용자가 제공한 교회 로고 원본

이 Vercel용 파일의 링크 목록은 기존 ChatGPT 사이트와 별개입니다. 기존 사이트에 등록한 유튜브 주소가 있으면 새 사이트에서 다시 등록해 주세요.
