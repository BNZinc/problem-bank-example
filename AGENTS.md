# 이 프로젝트에서 일하는 에이전트에게

이 프로젝트는 QuestiVibe 스타터 `fullstack`(웹 + 서버)에서 시작했어요. 사용자는 개발자가 아닐 수 있어요. 결과를 쉬운 한국어로 짧게 알려 주세요.

## 두 덩어리 (바꾸지 마세요)
| 어디 | 무엇 | 스택 |
|---|---|---|
| 루트 (`src/`, `drizzle/`) | **서버(백엔드)** — 데이터 저장, 계산, AI | NestJS 12(ESM, `.js` 붙여 import), SQLite(`node:sqlite`) + Drizzle ORM, Mastra(AI), zod |
| `web/` | **화면** — 사람이 보는 곳 | Next 16 App Router, Radix UI Themes, Pretendard |

- 화면은 서버에 **`/api/...`로만** 요청해요(`web/lib/api.ts`의 `api()`). `web/app/api/[...path]/route.ts`가 서버로 넘겨 줘요. 서버 주소(`API_URL`)는 QuestiVibe가 미리보기 때, Railway에서는 `scripts/serve.mjs`가 넣어요. 화면 코드에 서버 주소를 직접 쓰지 마세요.
- 서버 경로는 모두 `/api`로 시작해요(`src/main.ts`의 `setGlobalPrefix`). 새 기능은 `src/<이름>/`에 module·controller·service를 만들고 `src/app.module.ts`에 넣어요. 입력 검사는 zod(`src/common/zod.pipe.ts`의 `ZodPipe` — 새 칸은 `NAMES`에 한국어 이름을 더해요), 주소의 번호는 `IdPipe`, 오류는 `{ code, message }`(message는 쉬운 한국어)로 돌려줘요. 고치기 스키마에는 `.default()`를 두지 마세요(보내지 않은 칸이 기본값으로 덮여요).
- Nest는 생성자 주입이 타입 정보로 돼요. 서비스는 `@Injectable()`, DB는 `@Inject(DB) private readonly db: Db`.
- 비밀값·키가 필요한 일(AI 호출, 외부 API)은 **서버에서만** 해요. 화면(`web/`)은 키를 몰라요.

## 데이터 (SQLite + Drizzle)
- 표(테이블)는 `src/db/schema.ts`에 있어요. 바꾸면 `pnpm db:generate`로 `drizzle/`에 마이그레이션을 만들어요. 서버가 다시 켜질 때 저절로 적용돼요. 이미 만든 마이그레이션 파일은 고치지 말고 새로 만들어요.
- 데이터 파일은 `data/app.db`(이 컴퓨터), Railway에서는 볼륨(`/data`)에 있어요. 저장소에 넣지 않아요(`.gitignore`).
- 처음 보여 줄 예시 데이터가 필요하면 서버가 켜질 때 표가 비어 있을 때만 넣어요(사용자 데이터를 덮어쓰지 않기).

## AI (Mastra)
- 에이전트는 `src/mastra/agents/`에 만들고 `src/mastra/index.ts`의 `agents`에 넣어요. 모델은 `src/mastra/models.ts`의 `currentModel()`이 골라요: 비밀값 탭의 `ANTHROPIC_API_KEY` → `OPENAI_API_KEY` → `GEMINI_API_KEY` 중 처음 있는 것. **셋 중 하나만 있으면 돼요.** 모델 이름을 바꿀 때는 `PROVIDERS`의 `model`만 고쳐요.
- 결과를 표에 넣을 거면 `structuredOutput: { schema }`(zod)로 모양을 정해 받아요. 사진·PDF는 `AiService.content(text, files)`로 넣어요(예: `src/detect/detect.ts`).
- AI를 부르는 곳은 늘 `this.ai.run(async () => ...)`으로 감싸요. 키가 없으면 503 `AI_KEY_MISSING`으로, 키가 틀리면 쉬운 말로 바꿔 줘요. 키가 없을 때 문구는 `noKeyMessage()`가 정해요: QuestiVibe 미리보기(`QV_PREVIEW=1`)에서는 만드는 사람에게 "비밀값 탭에 키를 넣어 주세요", 배포된 사이트에서는 손님에게 "AI 기능은 지금 꺼져 있어요". 손님 화면에 "비밀값 탭" 같은 말을 쓰지 마세요. **키가 없어도 AI 아닌 기능은 다 돼야 해요.** 화면은 `/api/ai/status`를 보고 AI 버튼 옆에 안내를 보여 줘요(`web/components/AiNotice.tsx`).
- 키를 대화로 달라고 하지 말고 "비밀값 탭에 GEMINI_API_KEY(또는 OPENAI_API_KEY, ANTHROPIC_API_KEY) 중 하나를 넣어 주세요"라고 말해요. 키를 직접 만들거나 파일에 쓰지 마세요.

## 분업 (팀으로 일할 때)
- **빌더**: 서버(`src/`, `drizzle/`)와 화면 코드(`web/app/`, `web/components/`, `web/lib/`)를 맡아요.
- **SVG 담당**: 로고·아이콘·빈 화면 그림을 SVG 코드로 직접 그려 `web/public/svg/<이름>.svg`에 두고 `web/public/svg/SVG.md`에 표(파일 · 무엇 · 크기 · 쓸 곳)를 적어요. 코드는 고치지 않아요.
- **에셋 담당**: 사진·그림 파일은 `web/public/assets/`에 두고 `web/public/assets/ASSETS.md`에 출처·라이선스를 적어요. 출처를 모르는 그림은 쓰지 않아요.
- 그림 도구가 없으면 빈 자리를 남기지 말고 SVG·CSS로 그리거나 한 줄로 부탁해요.

## 디자인 다듬기 (unslop 스킬)
이 프로젝트에는 `unslop` 스킬이 들어 있어요(`.agents/skills/unslop`, Claude는 `.claude/skills/unslop`).

**언제 쓰나**
- 이미 있는 화면을 다듬어 달라고 할 때만 써요: "디자인 다듬어 줘", "AI가 만든 것 같지 않게", "더 세련되게"(Claude `/unslop`, Codex `$unslop`).
- 처음 만들기·기능 추가·버그 고치기에는 스킬 전체를 돌리지 마세요. 대신 `.agents/skills/unslop/references/signs.md`를 조용히 읽고 그 실수(보라 그라데이션, 빛나는 효과, 이모지 라벨, 들쭉날쭉한 간격 등)만 피해서 만들어요.
- 두 에이전트가 함께 일하는 팀 작업 중에는 쓰지 않아요. 혼자 맡은 대화에서만 써요.

**사용자와 이야기하는 법**
- 문제와 방향은 쉬운 한국어로 3~5줄만 쓰고, 마지막에 "이 방향으로 바꿀까요?" 한 가지만 물어요. 영어 디자인 용어·토큰 이름·px 값은 쓰지 않아요.
- 사용자가 "알아서 해 줘"라고 했으면 묻지 말고 바로 고쳐요.
- 사용자가 원한 스타일(예: 보라 그라데이션)은 스킬의 규칙보다 우선이에요.

**이 프로젝트에 맞추기**
- 화면은 QuestiVibe가 이미 띄운 미리보기 주소로만 봐요. dev 서버를 새로 띄우지 마세요. 볼 수 없으면 코드로 판단해요.
- 스타터는 일부러 무채색(`accentColor="gray"`, `grayColor="sand"`)으로 시작해요. 강조색은 이 서비스의 세계에 맞게 하나 골라요(예: 빵집은 따뜻한 amber, 바다는 teal). 보라→파랑 계열은 사용자가 원할 때만.
- 색·둥글기·글꼴은 Radix UI Themes로 바꿔요: `<Theme accentColor grayColor radius scaling>`와 Radix 색 단계(`var(--accent-9)` 등). Tailwind 예시는 이 방식으로 옮겨요.
- 아이콘은 `@radix-ui/react-icons`만 써요(이미 `web/`에 들어 있어요). 다른 패키지는 사용자에게 먼저 물어요.
- 글꼴은 한글이 되는 것을 써요. 기본은 Pretendard예요(`web/app/layout.tsx`에서 불러옴). 다른 글꼴을 더하려면 사용자에게 먼저 물어요. 영어 전용 규칙(대소문자, 자간)은 한글에는 적용하지 않아요.
- 이미지가 필요한데 그림 도구가 없으면 빈 자리를 남기지 말고 코드로 그린 그림(SVG·CSS)을 쓰거나, "가게 사진을 넣어 주시면 더 좋아져요"처럼 한 줄로 부탁해요.
- 스냅샷·스토리 영상(Playwright·ffmpeg)은 사용자가 원할 때만 쓰고, 설치는 먼저 물어본 뒤 `pnpm --dir web add -D playwright`로 해요(npm 쓰지 않기).

**라이선스**
- 이 스킬은 CC BY 4.0이에요. `.agents/skills/unslop`의 LICENSE·NOTICE.md와 SKILL.md의 작가 표시를 지우지 마세요.
- `references/refs`의 그림은 참고용이에요. 사이트(`web/public/` 등)에 넣지 마세요.

## 규칙
- 미리보기는 QuestiVibe 앱이 **서버와 화면을 함께** 켜 두었어요. `pnpm dev`·`next dev`·`nest start`를 직접 실행하지 마세요. 저장하면 화면은 바로, 서버는 몇 초 뒤 저절로 다시 켜져요.
- 패키지는 서버는 루트에서 `pnpm add <이름>`, 화면은 `pnpm --dir web add <이름>`으로 더해요(npm 쓰지 않기). 새 패키지는 꼭 필요할 때만, 먼저 사용자에게 물어요.
- 비밀값을 파일에 쓰지 마세요(`.env` 파일 금지). 서버 코드에서 `process.env.이름`으로 읽고, 꼭 있어야 하는 이름만 루트 `.env.example`에 적어요(값은 비워 둠). 없어도 되는 키(AI 키처럼)는 `.env.example`에 `#`을 붙여 적어요. 값은 사용자가 앱 오른쪽의 **비밀값** 탭에 넣어요 — 미리보기와 배포가 같은 값을 써요.
- 서명용 키(`SESSION_SECRET` 등)는 앱이 만들어 줘요. 직접 만들어 코드에 넣지 마세요.
- 다 고치면 `pnpm typecheck`(서버와 화면 타입 확인)와 `pnpm test`를 돌려 주세요.
- 배포(Railway)는 서비스 하나로 서버와 화면을 함께 올려요(`pnpm build` → `scripts/serve.mjs`). 이 구조는 바꾸지 마세요.

## Git · GitHub
- `git init`·`git commit`·`git push`·`git tag`를 하지 마세요. 기록(.git)·저장 지점·버전·GitHub 올리기와 GitHub 쪽 변경 합치기는 QuestiVibe 앱이 해요.
- 앱이 GitHub 쪽 변경과 겹친 파일에 `<<<<<<<` `=======` `>>>>>>>` 표시로 두 내용을 같이 넣어 두면, 두 쪽을 살려 맞추고 표시 줄만 지우면 돼요(git 명령 없이). 끝나면 앱의 [합치고 올리기]를 누르게 해 주세요.
- 예외는 하나: 사용자가 **대화에서** git이나 GitHub 문제를 고쳐 달라고 직접 부탁한 그 턴에만, 그 문제를 고치는 데 필요한 git 명령을 써도 돼요. 샌드박스 안에서는 기록 폴더에 쓸 수 없으니, 읽기(`git status`·`git log`·`git diff`)로 원인을 찾아 쉬운 말로 알려 주세요.
- 예외일 때도 하지 마세요: `push --force`, 올린 기록 바꾸기·지우기(`reset --hard`, `rebase` 등), `.git` 파일·git 설정·훅 고치기, 로그인·토큰 다루기. GitHub 로그인은 앱의 [GitHub에 로그인] 버튼으로만 해요.
- `README.md`와 `.gitignore`는 고쳐도 돼요. `.env`·키 파일은 저장소에 넣지 마세요.
- 끝나면 한 일을 쉬운 한국어로 알려 주고, 올리기는 앱의 [지금 올리기]를 누르게 해 주세요.
