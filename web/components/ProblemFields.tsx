"use client";

import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";
import { Badge, Box, Button, Checkbox, Flex, IconButton, Radio, SegmentedControl, Select, Switch, Text, TextArea, TextField } from "@radix-ui/themes";
import { useId, useState } from "react";
import { CIRCLED, DIFF_LABEL, SUBJECTS, TYPE_LABEL, TYPES, type ProblemInput, type ProblemType, type Subject } from "@/lib/types";

type Props = { value: ProblemInput; onChange: (v: ProblemInput) => void; compact?: boolean };

/** Every field of a problem. Used by the editor and by each draft on the 가져오기 screen. */
export function ProblemFields({ value: v, onChange, compact }: Props) {
  const id = useId();
  const set = (patch: Partial<ProblemInput>) => onChange({ ...v, ...patch });
  const answers = new Set(v.answer.split(",").map((x) => x.trim()).filter(Boolean));
  // 정답은 하나가 기본이에요. "모두 고르시오"처럼 여럿이면 스위치를 켜고, 번호는 "2,4"처럼 둬요.
  const [multi, setMulti] = useState(answers.size > 1);
  const toggleAnswer = (n: number, on: boolean) => {
    const next = new Set(multi ? answers : []);
    if (on) next.add(String(n));
    else next.delete(String(n));
    set({ answer: [...next].map(Number).sort((a, b) => a - b).join(",") });
  };
  const setMultiAnswers = (on: boolean) => {
    setMulti(on);
    // Back to one answer: the first one stays.
    if (!on && answers.size > 1) set({ answer: String(Math.min(...[...answers].map(Number))) });
  };
  const setType = (type: ProblemType) => {
    if (type === v.type) return;
    const choices = type === "multiple" ? (v.choices.length >= 2 ? v.choices : ["", "", "", "", ""]) : [];
    const answer = type === "multiple" || type === "ox" ? "" : v.type === "multiple" || v.type === "ox" ? "" : v.answer;
    onChange({ ...v, type, choices, answer });
  };
  return (
    <Flex direction="column" gap="4">
      <Flex gap="3" wrap="wrap">
        <Box style={{ flex: "1 1 140px" }}>
          <label className="field-label" htmlFor={`${id}-subject`}>
            과목
          </label>
          <Select.Root value={v.subject} onValueChange={(s) => set({ subject: s as Subject })}>
            <Select.Trigger id={`${id}-subject`} style={{ width: "100%" }} />
            <Select.Content>
              {SUBJECTS.map((s) => (
                <Select.Item key={s} value={s}>
                  {s}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>
        <Box style={{ flex: "1 1 120px" }}>
          <label className="field-label" htmlFor={`${id}-grade`}>
            학년
          </label>
          <TextField.Root id={`${id}-grade`} value={v.grade} placeholder="예: 중2" onChange={(e) => set({ grade: e.target.value })} maxLength={20} />
        </Box>
        <Box style={{ flex: "2 1 260px" }}>
          <span className="field-label">유형</span>
          <SegmentedControl.Root value={v.type} onValueChange={(t) => setType(t as ProblemType)} style={{ width: "100%" }} aria-label="유형">
            {TYPES.map((t) => (
              <SegmentedControl.Item key={t} value={t}>
                {TYPE_LABEL[t]}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>
        </Box>
      </Flex>

      <Box>
        <label className="field-label" htmlFor={`${id}-stem`}>
          문제
        </label>
        <TextArea id={`${id}-stem`} maxLength={5000} value={v.stem} onChange={(e) => set({ stem: e.target.value })} rows={compact ? 3 : 5} placeholder="문제 내용. 지문이나 조건도 함께 적어요. 수식은 x², √2, π처럼 적으면 돼요." resize="vertical" />
      </Box>

      {v.type === "multiple" && (
        <Box>
          <Flex justify="between" align="center" mb="1">
            <span className="field-label" style={{ marginBottom: 0 }}>
              보기 · 정답에 표시
            </span>
            <Text as="label" size="1" color="gray" style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <Switch size="1" checked={multi} onCheckedChange={setMultiAnswers} /> 정답이 여러 개예요
            </Text>
          </Flex>
          <Flex direction="column" gap="2">
            {v.choices.map((c, i) => (
              <div className="choice-row" key={i}>
                <Text size="3" color="gray" aria-hidden="true">
                  {CIRCLED[i]}
                </Text>
                <TextField.Root
                  maxLength={500}
                  value={c}
                  onChange={(e) => set({ choices: v.choices.map((x, j) => (j === i ? e.target.value : x)) })}
                  aria-label={`보기 ${i + 1}`}
                  placeholder={`보기 ${i + 1}`}
                />
                <Flex gap="2" align="center">
                  <Text as="label" size="2" style={{ display: "inline-flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                    {multi ? (
                      <Checkbox checked={answers.has(String(i + 1))} onCheckedChange={(on) => toggleAnswer(i + 1, on === true)} aria-label={`보기 ${i + 1} 정답`} />
                    ) : (
                      <Radio name={`${id}-ans`} value={String(i + 1)} checked={answers.has(String(i + 1))} onValueChange={() => toggleAnswer(i + 1, true)} aria-label={`보기 ${i + 1}을 정답으로`} />
                    )}
                    정답
                  </Text>
                  <IconButton
                    variant="ghost"
                    color="gray"
                    size="1"
                    aria-label={`보기 ${i + 1} 지우기`}
                    disabled={v.choices.length <= 2}
                    onClick={() => {
                      // The answers after the removed choice move up one number; that one goes.
                      const answer = [...answers]
                        .map(Number)
                        .filter((a) => a !== i + 1)
                        .map((a) => (a > i + 1 ? a - 1 : a))
                        .sort((a, b) => a - b)
                        .join(",");
                      set({ choices: v.choices.filter((_, j) => j !== i), answer });
                    }}
                  >
                    <Cross2Icon />
                  </IconButton>
                </Flex>
              </div>
            ))}
            {v.choices.length < 6 && (
              <Button variant="ghost" size="1" onClick={() => set({ choices: [...v.choices, ""] })} style={{ alignSelf: "flex-start" }}>
                <PlusIcon /> 보기 더하기
              </Button>
            )}
          </Flex>
        </Box>
      )}
      {v.type === "ox" && (
        <Box>
          <span className="field-label">정답</span>
          <SegmentedControl.Root value={v.answer || "none"} onValueChange={(a) => set({ answer: a === "none" ? "" : a })} aria-label="O/X 정답">
            <SegmentedControl.Item value="O">O 맞음</SegmentedControl.Item>
            <SegmentedControl.Item value="X">X 틀림</SegmentedControl.Item>
            <SegmentedControl.Item value="none">아직 모름</SegmentedControl.Item>
          </SegmentedControl.Root>
        </Box>
      )}
      {(v.type === "short" || v.type === "essay") && (
        <Box>
          <label className="field-label" htmlFor={`${id}-answer`}>
            {v.type === "essay" ? "모범 답안" : "정답"}
          </label>
          <TextArea id={`${id}-answer`} maxLength={2000} value={v.answer} onChange={(e) => set({ answer: e.target.value })} rows={v.type === "essay" ? 3 : 1} resize="vertical" />
        </Box>
      )}

      <Box>
        <label className="field-label" htmlFor={`${id}-exp`}>
          해설 <Text color="gray">(선택)</Text>
        </label>
        <TextArea id={`${id}-exp`} maxLength={5000} value={v.explanation} onChange={(e) => set({ explanation: e.target.value })} rows={compact ? 2 : 3} resize="vertical" />
      </Box>

      <Flex gap="4" wrap="wrap" align="end">
        <Box style={{ flex: "1 1 220px" }}>
          <span className="field-label">
            난이도 · <Text color="gray">{DIFF_LABEL[v.difficulty]}</Text>
          </span>
          <SegmentedControl.Root value={String(v.difficulty)} onValueChange={(d) => set({ difficulty: Number(d) })} aria-label="난이도">
            {[1, 2, 3, 4, 5].map((d) => (
              <SegmentedControl.Item key={d} value={String(d)}>
                {d}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>
        </Box>
        <TagInput tags={v.tags} onChange={(tags) => set({ tags })} />
      </Flex>
      {!compact && (
        <Box>
          <label className="field-label" htmlFor={`${id}-src`}>
            출처 <Text color="gray">(선택 · 예: 3단원 학습지, 직접 만듦)</Text>
          </label>
          <TextField.Root id={`${id}-src`} value={v.source} onChange={(e) => set({ source: e.target.value })} maxLength={100} />
        </Box>
      )}
    </Flex>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [text, setText] = useState("");
  const id = useId();
  const add = () => {
    const more = text
      .split(/[,#]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (more.length) onChange([...new Set([...tags, ...more])].slice(0, 10));
    setText("");
  };
  return (
    <Box style={{ flex: "2 1 260px" }}>
      <label className="field-label" htmlFor={id}>
        태그 <Text color="gray">(Enter나 쉼표로 더하기)</Text>
      </label>
      <Flex gap="1" wrap="wrap" mb={tags.length ? "2" : "0"}>
        {tags.map((t) => (
          <Badge key={t} variant="soft" color="gray" size="2">
            #{t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`${t} 태그 빼기`} style={{ all: "unset", cursor: "pointer", display: "inline-flex" }}>
              <Cross2Icon width={12} height={12} />
            </button>
          </Badge>
        ))}
      </Flex>
      <TextField.Root
        id={id}
        value={text}
        placeholder="단원·개념 (예: 이차방정식)"
        maxLength={20}
        onChange={(e) => {
          // A comma ends a tag right away.
          if (e.target.value.includes(",")) {
            const parts = e.target.value.split(",");
            const done = parts.slice(0, -1).map((t) => t.trim()).filter(Boolean);
            if (done.length) onChange([...new Set([...tags, ...done])].slice(0, 10));
            setText(parts.at(-1) ?? "");
          } else setText(e.target.value);
        }}
        onKeyDown={(e) => {
          // keyCode 229: Safari (the app's preview) ends a Korean syllable with this Enter.
          if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </Box>
  );
}
