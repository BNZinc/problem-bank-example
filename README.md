# 문제곳간 — AI 문제은행

문제를 모아 두고, 찾고, 골라서 **문제지(PDF)** 로 뽑는 웹 서비스예요. 시험지·학습지 **사진이나 PDF** 를 올리면 AI가 문항·보기·정답·유형·난이도·태그를 옮겨 적어 주고, 사람이 확인한 것만 문제은행에 들어가요.

> [QuestiVibe](https://github.com/BNZinc) 스타터 `fullstack`(웹 + 서버)으로 만든 예시예요. 개발 지식 없이도 "이런 서비스 만들어 줘"라고 말하면 에이전트가 만드는 데스크톱 앱이에요. 이 저장소를 **fork**해서 마음대로 고쳐 보세요.

**해 보기:** 아직 공개 주소는 없어요. QuestiVibe 홈 화면의 AI 웹 서비스 카드에서 **[예시 해 보기]**를 누르면 내 컴퓨터에서 켜서 브라우저로 열어 줘요. 아래 [직접 돌려 보기](#직접-돌려-보기)대로 켜도 돼요.

## 들어 있는 것
- **문제** (`/`): 과목·유형·난이도·태그로 거르기, 문제·보기·해설·태그에서 찾기, 정렬, 정답 보기, 고치기·지우기, 여러 문제를 골라 **문제지에 담기**
- **새 문제 / 고치기** (`/problems/new`, `/problems/[id]`): 객관식(보기 2~6개, 정답 하나 또는 "정답이 여러 개예요")·단답형·서술형·O/X, 난이도 1~5, 태그, 출처, 문제지 미리 보기
- **가져오기** (`/import`): 사진(PNG·JPG·WebP)·PDF·붙여 넣은 글 → **AI 문제 인식**(Mastra 에이전트) → 하나씩 확인·고치기 → 고른 것만 저장. 자료에 정답이 없으면 AI가 풀어서 "AI가 푼 답 · 확인" 표시를 붙여요. **AI 없이 나누기**는 키 없이 번호(1. · 1) · 1번. · [1])·보기(①② 또는 줄마다 1) 2))·"정답:"·"해설:"로 글을 나누고, 끝에 정답만 모은 표("정답" 아래 1. ③ …)도 읽어요. 한 번에 50문제까지.
- **문제지** (`/worksheets`): 순서 바꾸기, 1단/2단, 끝에 정답·해설 붙이기, 자동 저장 → **인쇄 · PDF로 저장**(A4, 브라우저 인쇄 창)
- 처음 켜면 직접 쓴 예시 문항 24개와 문제지 2개가 들어 있어요(지워도 다시 생기지 않아요).

## 구조
| 어디 | 무엇 |
|---|---|
| 루트 `src/` | **서버** — NestJS 12. `problems/`(문제 CRUD·거르기·집계), `worksheets/`, `detect/`(AI 인식 + AI 없이 나누기), `workspace/`(체험판 방문자별 공간), `mastra/`(AI 에이전트·모델 고르기), `db/`(SQLite 표) |
| `drizzle/` | 데이터베이스 마이그레이션. 서버가 켜질 때 저절로 적용 |
| `web/` | **화면** — Next 16 + Radix Themes. `/api/*`는 `web/app/api/[...path]/route.ts`가 서버로 넘겨요 |
| `scripts/serve.mjs` | 배포용 시작: 서버(안쪽의 빈 포트)와 화면(`PORT`)을 함께 켜요 |

데이터는 SQLite 파일 하나(`data/app.db`, Railway에서는 볼륨)에 있어요. Node에 들어 있는 `node:sqlite`를 써서 따로 컴파일할 것이 없어요.

## AI 키
`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` 중 **하나만** 있으면 AI 인식이 켜져요(여럿이면 Anthropic → OpenAI → Gemini 순). 쓰는 모델은 `src/mastra/models.ts`에 있어요: `claude-sonnet-5-5`, `gpt-6.1-sol`, `gemini-3.8-flash`(2026-11 기준, 모두 사진·PDF를 읽어요). 키가 없으면 AI 버튼만 꺼지고 안내가 보여요(QuestiVibe 미리보기에서는 "비밀값 탭에 키를 넣어 주세요", 배포된 사이트의 손님에게는 "AI 기능은 지금 꺼져 있어요"). 나머지 기능은 그대로 돼요. 키는 서버에서만 쓰고 화면(브라우저)으로 가지 않아요. 로그에는 AI 오류의 종류와 상태 코드만 남겨요.

> 학생 자료를 올린다면: AI 회사의 **무료 등급**은 올린 내용을 서비스 개선에 쓸 수 있어요(각 회사 약관을 확인하세요). 학생 개인정보가 든 자료는 유료 키로 써 주세요.

## 내 것으로 가져가기 (fork)
터미널 없이도 돼요.
1. 이 페이지 오른쪽 위 **Fork** → **Create fork**. 내 GitHub에 복사본이 생겨요.
2. 초록 **Code › Download ZIP**으로 받아 풀고, QuestiVibe에서 **[이미 있는 폴더 열기]**로 그 폴더를 열어요. 앱이 서버와 화면을 함께 켜서 미리보기로 보여 줘요. "과목에 '정보'를 더해 줘"처럼 말하면 돼요.
3. AI 문제 인식을 쓰려면 QuestiVibe **비밀값** 탭에 AI 키 하나를 넣어요(아래 [AI 키](#ai-키)). 키가 없어도 나머지는 다 돼요.
4. 인터넷에 올리려면 QuestiVibe의 **[배포]**(Railway)를 써요. 이렇게 연 폴더는 데이터 보관함(볼륨)을 저절로 붙이지 않아요. Railway에서 서비스에 **볼륨을 `/data`에 붙여야** 다시 배포해도 넣은 문제가 남아요. 모르는 사람도 들어오는 공개 주소라면 먼저 아래 [공개 체험판으로 올릴 때](#공개-체험판으로-올릴-때)를 읽어 주세요.

## 직접 돌려 보기
Node 24 이상과 pnpm이 있으면:

```bash
pnpm install && pnpm --dir web install
pnpm build                        # 서버(dist/) + 화면(web/.next/standalone)
PORT=3000 pnpm start              # http://127.0.0.1:3000
pnpm test                         # 서버 시험(vitest: 문제 거르기, AI 없이 나누기, 키 없을 때 안내) + 화면 시험(정답 번호 다시 매기기)
pnpm typecheck                    # 서버·화면 타입 확인
```
QuestiVibe 앱에서 이 폴더를 열면 앱이 서버와 화면을 함께 켜서 미리보기로 보여 줘요.

## 공개 체험판으로 올릴 때
- `DEMO_MODE=1`: 방문자마다 쿠키로 자기 공간을 받아요(예시 문항으로 시작). 남의 것은 보이지도 바뀌지도 않고, 3일 동안 안 쓴 공간은 지워져요(쿠키도 쓸 때마다 3일로 다시 늘어나요). 화면 위 띠가 그렇게 알려 줘요. 한도: 문제 300개·문제지 30개, 공간 3000개.
- 봇 막기: 공간은 이 앱의 화면이 보낸 요청(`x-qb-client` 머리글)에만, 주소(IP)당 한 시간에 10개까지 만들어요. 가득 차면 하루 안에 쓴 공간은 지우지 않고, 새 방문자는 읽기 전용 예시를 보며 띠가 이유를 알려 줘요.
- AI: 체험판에서는 기본으로 꺼져요. `AI_DAILY_LIMIT=<하루 전체 횟수>`와 키를 함께 넣으면 방문자당 하루 5번까지 켜져요(키 비용이 나와요). AI가 실패하면 그 번은 세지 않아요. 전체 횟수는 서버 메모리에만 있어서 서버를 다시 켜면 0부터 다시 세요. "AI 없이 나누기"는 늘 돼요.
- Railway: `railway.json`(시작 `node scripts/serve.mjs`, 헬스체크 `/api/health`), 볼륨을 `/data`에 붙이면 다시 배포해도 데이터가 남아요.

## 라이선스 · 출처
- **코드: MIT** (`LICENSE`). 예시 문항·로고·그림도 이 예시를 위해 직접 만든 것이라 MIT로 함께 써도 돼요.
- MIT(`LICENSE`)가 덮지 않는 것: Pretendard 글꼴(SIL OFL 1.1), 설치 때 받는 npm 패키지(각자의 라이선스), 에이전트 스킬 `.agents/skills/unslop`(CC BY 4.0, 폴더 안 LICENSE·NOTICE.md). 자세한 목록은 [`CREDITS.md`](CREDITS.md)에 있어요.

| 에셋 | 무엇 | 라이선스 |
|---|---|---|
| `web/components/Logo.tsx`, `web/app/icon.svg` | 문제곳간 로고(곳간 지붕 + 문제지 + 체크) | 직접 만듦 · MIT |
| `web/components/EmptyShelf.tsx` | 빈 곳간 그림 | 직접 만듦 · MIT |
| `src/seed/samples.ts` | 예시 문항 24개 · 문제지 2개 | 직접 씀 · MIT |
| Pretendard | 글꼴 | SIL OFL 1.1 |

---

**English:** A small AI problem bank — keep questions, filter and search them, print worksheets as PDF, and let AI (Mastra; Claude, OpenAI or Gemini, one key) read questions from photos and PDFs, with a no-AI splitter for plain text. Server: NestJS + SQLite (`node:sqlite` + Drizzle); screen: Next 16. Made with the QuestiVibe `fullstack` starter. Code is MIT; the logo, drawings and 24 sample questions are original; Pretendard is OFL. Run: `pnpm install && pnpm --dir web install && pnpm build && PORT=3000 pnpm start`.
