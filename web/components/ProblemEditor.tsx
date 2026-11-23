"use client";

import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Button, Callout, Card, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorText } from "@/lib/api";
import { answerText, CIRCLED, emptyProblem, type Problem, type ProblemInput } from "@/lib/types";
import { cleanProblem } from "@/lib/clean";
import { MetaLine } from "./bits";
import { ProblemFields } from "./ProblemFields";

export function ProblemEditor({ id }: { id?: number }) {
  const router = useRouter();
  const [value, setValue] = useState<ProblemInput | null>(id ? null : emptyProblem());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // A fresh form after "저장하고 하나 더" (its own switches start over too).
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!id) return;
    api<Problem>(`/problems/${id}`).then(
      (p) => setValue({ subject: p.subject, grade: p.grade, type: p.type, difficulty: p.difficulty, stem: p.stem, choices: p.choices, answer: p.answer, explanation: p.explanation, tags: p.tags, source: p.source }),
      (e) => setError(errorText(e)),
    );
  }, [id]);

  async function save(again: boolean) {
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      const body = cleanProblem(value);
      if (id) await api(`/problems/${id}`, { method: "PUT", json: body });
      else await api("/problems", { method: "POST", json: body });
      if (again) {
        setValue({ ...emptyProblem(), subject: value.subject, grade: value.grade, source: value.source });
        setRound((r) => r + 1);
      }
      else router.push("/");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const preview = value && cleanProblem(value);
  return (
    <div className="page">
      <Button variant="ghost" color="gray" asChild mb="3">
        <Link href="/">
          <ArrowLeftIcon /> 문제 목록
        </Link>
      </Button>
      <Heading size="7" mb="5">
        {id ? "문제 고치기" : "새 문제"}
      </Heading>
      <div className="editor">
        <Card size="3">
          {value ? <ProblemFields key={round} value={value} onChange={setValue} /> : !error && <Skeleton height="420px" />}
          {error && (
            <Callout.Root color="red" mt="4" role="alert">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
          {value && (
            <Flex gap="3" mt="5" justify="end" wrap="wrap">
              {!id && (
                <Button variant="soft" size="3" onClick={() => save(true)} loading={busy} disabled={!value.stem.trim()}>
                  저장하고 하나 더
                </Button>
              )}
              <Button size="3" onClick={() => save(false)} loading={busy} disabled={!value.stem.trim()}>
                저장
              </Button>
            </Flex>
          )}
        </Card>
        <aside aria-label="미리 보기" style={{ position: "sticky", top: 76 }}>
          <Text size="2" color="gray" weight="medium">
            문제지에서 이렇게 보여요
          </Text>
          {preview && (
            <Card size="2" mt="2">
              <MetaLine p={preview} />
              <p className="stem">{preview.stem || <Text color="gray">문제를 적으면 여기 보여요</Text>}</p>
              {preview.type === "multiple" && (
                <ol className="choices" style={{ gridTemplateColumns: "1fr" }}>
                  {preview.choices.map((c, i) => (
                    <li key={i}>
                      <span aria-hidden="true">{CIRCLED[i]}</span>
                      {c}
                    </li>
                  ))}
                </ol>
              )}
              {preview.answer && <div className="answer-box">정답 {answerText(preview)}</div>}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
