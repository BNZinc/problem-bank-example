import type { NewProblem } from "../db/schema.js";

/**
 * Sample problems every new bank starts with. All written for this example (no exam or textbook
 * items copied); facts are basic curriculum knowledge. `source` says so on screen.
 */
type Sample = Omit<NewProblem, "workspace" | "id" | "createdAt" | "updatedAt">;
const S = "예시 문항 · 직접 만듦";

export const SAMPLE_PROBLEMS: Sample[] = [
  // 0–6 수학
  { subject: "수학", grade: "중1", type: "multiple", difficulty: 2, stem: "다음 중 소수가 아닌 것은?", choices: ["2", "13", "21", "29", "31"], answer: "3", explanation: "21 = 3 × 7 이므로 1과 자기 자신 말고도 약수가 있어요.", tags: ["소인수분해", "소수"], source: S },
  { subject: "수학", grade: "중1", type: "short", difficulty: 2, stem: "일차방정식 3x − 7 = 11 의 해를 구하시오.", choices: [], answer: "x = 6", explanation: "3x = 18 이므로 x = 6", tags: ["일차방정식"], source: S },
  { subject: "수학", grade: "중2", type: "multiple", difficulty: 3, stem: "연립방정식 x + y = 7, x − y = 1 의 해 (x, y)는?", choices: ["(3, 4)", "(4, 3)", "(5, 2)", "(2, 5)", "(6, 1)"], answer: "2", explanation: "두 식을 더하면 2x = 8, x = 4. 그러면 y = 3", tags: ["연립방정식"], source: S },
  { subject: "수학", grade: "중3", type: "short", difficulty: 3, stem: "이차방정식 x² − 5x + 6 = 0 의 두 근의 합을 구하시오.", choices: [], answer: "5", explanation: "(x − 2)(x − 3) = 0 이므로 두 근은 2, 3이고 합은 5", tags: ["이차방정식", "근과 계수"], source: S },
  { subject: "수학", grade: "고1", type: "essay", difficulty: 4, stem: "두 실수 a, b 에 대하여 a + b = 4, ab = 1 일 때, a² + b² 의 값을 구하는 과정을 쓰시오.", choices: [], answer: "14", explanation: "a² + b² = (a + b)² − 2ab = 16 − 2 = 14. 곱셈 공식의 변형을 쓰는 것이 핵심이에요.", tags: ["곱셈 공식"], source: S },
  { subject: "수학", grade: "중2", type: "ox", difficulty: 1, stem: "삼각형의 세 내각의 크기의 합은 180° 이다.", choices: [], answer: "O", explanation: "", tags: ["삼각형", "도형"], source: S },
  { subject: "수학", grade: "중1", type: "multiple", difficulty: 2, stem: "반지름의 길이가 5 cm 인 원의 둘레의 길이는?", choices: ["5π cm", "10π cm", "25π cm", "50π cm", "100π cm"], answer: "2", explanation: "원의 둘레 = 2πr = 2 × π × 5 = 10π", tags: ["원", "도형"], source: S },
  // 7–10 국어
  { subject: "국어", grade: "중1", type: "multiple", difficulty: 2, stem: "다음 중 맞춤법이 바른 문장은?", choices: ["오늘은 왠지 기분이 좋다.", "몇일 뒤에 다시 만나자.", "숙제를 금새 끝냈다.", "어의없는 실수를 했다.", "현관문을 잠궜다."], answer: "1", explanation: "며칠, 금세, 어이없는, 잠갔다가 바른 표기예요.", tags: ["맞춤법"], source: S },
  { subject: "국어", grade: "중1", type: "short", difficulty: 1, stem: "'높다'와 뜻이 반대인 낱말을 쓰시오.", choices: [], answer: "낮다", explanation: "", tags: ["어휘", "반의어"], source: S },
  { subject: "국어", grade: "중3", type: "ox", difficulty: 2, stem: "'먹이다'는 '먹다'의 사동사이다.", choices: [], answer: "O", explanation: "주어가 남에게 어떤 행동을 하게 하는 '사동'이에요.", tags: ["문법", "사동"], source: S },
  { subject: "국어", grade: "고1", type: "short", difficulty: 3, stem: "다음 문장에서 높임 표현이 어색한 부분을 찾아 바르게 고쳐 쓰시오.\n\"할머니께서 지금 집에 있으시다.\"", choices: [], answer: "할머니께서 지금 집에 계시다.", explanation: "'있다'의 주체 높임은 '계시다'예요.", tags: ["문법", "높임 표현"], source: S },
  // 11–14 영어
  { subject: "영어", grade: "중1", type: "multiple", difficulty: 1, stem: "'도서관'을 뜻하는 영어 낱말은?", choices: ["hospital", "library", "museum", "station", "bakery"], answer: "2", explanation: "", tags: ["어휘"], source: S },
  { subject: "영어", grade: "중2", type: "multiple", difficulty: 2, stem: "빈칸에 알맞은 것은?\nShe ______ to school every day.", choices: ["go", "goes", "going", "gone", "to go"], answer: "2", explanation: "주어가 3인칭 단수이고 습관을 말하므로 현재형 goes", tags: ["문법", "현재 시제"], source: S },
  { subject: "영어", grade: "중2", type: "short", difficulty: 3, stem: "다음 문장을 과거 시제로 바꾸어 쓰시오.\nI eat breakfast at seven.", choices: [], answer: "I ate breakfast at seven.", explanation: "eat의 과거형은 불규칙 변화 ate", tags: ["문법", "과거 시제"], source: S },
  { subject: "영어", grade: "고1", type: "ox", difficulty: 3, stem: "\"If I were a bird, I could fly.\" 는 현재 사실과 반대되는 상황을 가정하는 문장이다.", choices: [], answer: "O", explanation: "가정법 과거: If + 주어 + 동사 과거형(be동사는 were), 주어 + 조동사 과거형 + 동사원형", tags: ["문법", "가정법"], source: S },
  // 15–18 과학
  { subject: "과학", grade: "중1", type: "multiple", difficulty: 2, stem: "물질의 상태 변화 중 기체가 액체로 변하는 것은?", choices: ["융해", "응고", "기화", "액화", "승화"], answer: "4", explanation: "차가운 컵 겉에 물방울이 맺히는 것이 액화예요.", tags: ["상태 변화"], source: S },
  { subject: "과학", grade: "중2", type: "short", difficulty: 2, stem: "식물이 빛에너지를 이용하여 이산화 탄소와 물로 양분(포도당)을 만드는 과정을 무엇이라고 하는가?", choices: [], answer: "광합성", explanation: "", tags: ["식물", "광합성"], source: S },
  { subject: "과학", grade: "고1", type: "multiple", difficulty: 4, stem: "질량이 2 kg 인 물체에 4 N 의 알짜힘이 작용할 때, 물체의 가속도의 크기는?", choices: ["0.5 m/s²", "1 m/s²", "2 m/s²", "4 m/s²", "8 m/s²"], answer: "3", explanation: "a = F / m = 4 / 2 = 2 m/s²", tags: ["힘과 운동", "가속도"], source: S },
  { subject: "과학", grade: "고1", type: "ox", difficulty: 2, stem: "원자 번호는 원자핵 속 양성자의 수와 같다.", choices: [], answer: "O", explanation: "", tags: ["원자"], source: S },
  // 19–22 사회
  { subject: "사회", grade: "중1", type: "multiple", difficulty: 2, stem: "적도를 기준으로 남북의 위치를 나타내는 것은?", choices: ["위도", "경도", "고도", "표준시", "날짜 변경선"], answer: "1", explanation: "경도는 본초 자오선을 기준으로 동서의 위치를 나타내요.", tags: ["지리", "위치"], source: S },
  { subject: "사회", grade: "중2", type: "short", difficulty: 3, stem: "다른 조건이 같을 때, 어떤 상품의 수요는 늘고 공급은 그대로라면 가격은 일반적으로 어떻게 되는가?", choices: [], answer: "오른다(상승한다)", explanation: "사려는 양이 팔려는 양보다 많아지므로 가격이 올라요.", tags: ["경제", "수요와 공급"], source: S },
  { subject: "사회", grade: "중3", type: "ox", difficulty: 1, stem: "대한민국 헌법은 국가의 주권이 국민에게 있다고 정하고 있다.", choices: [], answer: "O", explanation: "", tags: ["헌법", "정치"], source: S },
  { subject: "사회", grade: "고1", type: "essay", difficulty: 3, stem: "'기회비용'의 뜻을 쓰고, 일상생활에서 찾을 수 있는 예를 하나 들어 설명하시오.", choices: [], answer: "어떤 것을 선택했을 때 포기한 대안 가운데 가장 가치가 큰 것", explanation: "예: 주말에 영화를 보기로 했다면, 그 시간에 할 수 있었던 아르바이트 수입이 기회비용이 될 수 있어요.", tags: ["경제", "선택"], source: S },
  // 23 수학
  { subject: "수학", grade: "고1", type: "multiple", difficulty: 4, stem: "다항식 x³ − 1 을 x − 1 로 나누었을 때의 몫은?", choices: ["x² + 1", "x² − x + 1", "x² + x + 1", "x² − 1", "x² + x"], answer: "3", explanation: "x³ − 1 = (x − 1)(x² + x + 1)", tags: ["다항식", "인수분해"], source: S },
];

/** Sample 문제지, by index into SAMPLE_PROBLEMS. */
export const SAMPLE_WORKSHEETS = [
  { title: "수학 기초 점검", subtitle: "중1~중2 · 15분", picks: [0, 1, 6, 5], withAnswers: true, columns: 2 },
  { title: "영어 기초 쪽지 시험", subtitle: "어휘와 문법 · 10분", picks: [11, 12, 13], withAnswers: true, columns: 1 },
];
