# 38th Grace Choir Contest

제38회 은혜성가제 홈페이지입니다.

- 일시: **2026년 12월 13일 주일 오후 2시 (미국 서부시간)**
- 장소: 은혜한인교회 비전센터 본당
- 주소: 150 S. Brookhurst Rd., Fullerton, CA 92833
- 참가: 28개 그룹 + EM + GMI 은혜교회 (총 30팀)
- 30개 참가팀 영상, 전체 영상 1개, Shorts 5개
- 원본 사진 5장, 모바일/데스크톱 반응형 화면

## 실행과 배포

Node.js 22 이상을 사용합니다.

```sh
npm ci
npm test
npm run build
npm run dev
```

GitHub 저장소의 main 브랜치를 Vercel 프로젝트와 연결합니다. Framework는 Other이며 빌드/출력 설정은 vercel.json에 포함되어 있습니다. main에 변경사항을 올리면 Vercel에서 자동 배포합니다.

## 관리자와 영상 저장소

Vercel에 **public Vercel Blob store**를 연결하고 아래 값을 Production 환경 변수로 설정합니다. 실제 비밀값은 저장소에 올리지 않습니다.

- BLOB_READ_WRITE_TOKEN: 연결한 Blob 저장소의 쓰기 토큰. 클라이언트 업로드 SDK에서 필요합니다.
- ADMIN_PASSWORD: 관리자 비밀번호 (최소 20자)
- SESSION_SECRET: 임의의 세션 서명키 (최소 32자)

홈페이지 하단 **영상 관리** 또는 `/admin`에서 로그인합니다. 항목을 선택하고 YouTube 주소(Shorts 포함)를 입력하거나 MP4/WebM 파일을 업로드합니다. 이름/찬양곡 수정, 영상 등록 해제를 지원합니다. 파일 업로드는 최대 10GiB이고 실제 이용 가능 용량과 트래픽은 Vercel 요금제 및 Blob 한도를 따릅니다. 긴 전체 영상은 YouTube 일부 공개 영상 링크로 등록할 수 있습니다.

영상 파일은 브라우저에서 Blob에 직접 전송됩니다. Vercel Function의 업로드 본문 크기 제한을 거치지 않습니다. 홈페이지 메타데이터는 Blob의 `metadata/festival.json`에 저장되며 ETag 조건부 쓰기로 동시 수정 충돌을 감지합니다. public 저장소에는 게시용 영상과 공개 제목/설명만 저장합니다.

관리자 쿠키는 HttpOnly, Secure, SameSite=Strict이고 12시간 후 만료됩니다. 변경 요청은 같은 출처와 관리자 세션을 검증합니다. 비밀번호와 세션키를 모두 교체해 재배포하면 기존 세션을 해제할 수 있습니다. 로그인 시도 제한은 함수 인스턴스별 보조 제한입니다. 강한 비밀번호를 사용하세요.

업로드 도중 브라우저를 닫으면 등록되지 않은 파일이 저장소에 남을 수 있습니다. 사용하지 않는 파일은 Vercel Storage에서 정리할 수 있습니다. 영상 삭제가 실패할 때 공개 목록에서의 해제는 유지되고 서버에 정리 실패가 기록됩니다.

## 수정 위치

- `src/page.html`: 디자인, 행사 안내, 메뉴, 사진 설명
- `src/app.js`: 갤러리, 영상 목록, 관리자 화면
- `lib/festival.js`: 36개 영상 슬롯과 입력 검증
- `lib/store.js`: Blob 메타데이터와 영상 저장
- `api/router.js`: 관리자 인증 및 API
- `photos/`: 사용자가 제공한 2025년 제37회 성가제 원본 사진 5장

현재 배포는 기존 ChatGPT Sites의 R2 저장소와 별개입니다. 이전 사이트에 이미 등록한 영상이 있다면 게시 전에 목록과 파일을 옮겨야 합니다.
