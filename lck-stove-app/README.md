# LCK 2027 스토브리그 시뮬레이터

빌드 과정이 없는 정적 웹앱입니다. 폴더를 그대로 웹 서버에 올리면 됩니다.

## 구성
```
index.html              화면 뼈대
css/style.css           디자인 (다크/라이트, 반응형)
js/data.js              로스터 데이터 ← 선수 정보를 고칠 때는 이 파일만 수정
js/app.js               동작
sw.js                   오프라인 실행 · 앱 설치용 서비스 워커
manifest.webmanifest    홈 화면 설치 정보
fonts/                  Pretendard 폰트 (SIL OFL 1.1)
icons/                  앱 아이콘
```

## 서버에 올리기
- Nginx / Apache / GitHub Pages / Netlify / Vercel / Cloudflare Pages 어디든 정적 파일로 올리면 됩니다.
- **https** 로 서비스해야 폰·태블릿에서 '홈 화면에 설치'와 오프라인 실행이 됩니다.
- 하위 경로(예: `example.com/stove/`)에 올려도 동작합니다. 모든 경로가 상대 경로입니다.
- `.webmanifest` 확장자는 `application/manifest+json` 으로 내려가는 게 좋습니다 (대부분 서버 기본값).

로컬에서 확인: 이 폴더에서 `python3 -m http.server 8000` → http://localhost:8000

## 데이터 수정
`js/data.js`의 `ROSTERS`에서 `[닉네임, 포지션, 1군=1/2군=2, 계약만료연도]` 형식으로 고칩니다.
- 계약 만료 연도가 2027 이상이면 이적 불가(고정)로 표시됩니다.
- 고친 뒤에는 `sw.js`의 `VERSION`을 바꿔 주면 이미 설치한 사람에게도 새 파일이 확실히 반영됩니다.

## 저장
배치, 즐겨찾기, 팀 순서·숨김, 글자 크기, 화면 모드는 각 사용자의 기기(브라우저 localStorage)에 저장됩니다.
서버에는 아무것도 저장되지 않습니다. 기기 간 이동은 설정 → 내보내기/불러오기를 쓰면 됩니다.

## 출처
로스터·계약: Riot 글로벌 계약 데이터베이스(GCD) 집계 (2026-11-08 기준), 1군/2군 구분과 감독은 언론 보도 기준.
폰트: Pretendard (https://github.com/orioncactus/pretendard, SIL Open Font License 1.1)
