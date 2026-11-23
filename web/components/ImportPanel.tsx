"use client";

import { ExclamationTriangleIcon, FileTextIcon, MagicWandIcon, ReaderIcon, UploadIcon } from "@radix-ui/react-icons";
import { Badge, Box, Button, Callout, Card, Checkbox, Flex, Heading, Select, Spinner, Text, TextArea } from "@radix-ui/themes";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, errorText } from "@/lib/api";
import { SUBJECTS, type AiStatus, type Draft, type ProblemInput, type Subject } from "@/lib/types";
import { AiNotice } from "./AiNotice";
import { cleanProblem } from "@/lib/clean";
import { ProblemFields } from "./ProblemFields";

const TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX = 10 * 1024 * 1024;

const SAMPLE = `1. 다음 중 3의 배수가 아닌 것은? ① 12 ② 21 ③ 25 ④ 36 ⑤ 45
정답: ③
해설: 25는 3으로 나누어떨어지지 않아요.

2. 직사각형의 가로가 6 cm, 세로가 4 cm일 때 넓이를 구하시오.
답: 24 cm²

3. 모든 정사각형은 직사각형이다. (O/X)
정답: O`;

type Row = { draft: Draft; value: ProblemInput; keep: boolean };

export function ImportPanel() {
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [subject, setSubject] = useState<Subject>("기타");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<"ai" | "plain" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [by, setBy] = useState("");
  const [more, setMore] = useState(0);
  const [saved, setSaved] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    api<AiStatus>("/ai/status").then(setAi, () => setAi(null));
  }, []);
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!TYPES.includes(f.type)) return setError("사진(PNG·JPG·WebP)이나 PDF만 올릴 수 있어요. 아이폰 사진(HEIC)은 JPG로 바꿔 올려 주세요.");
    if (f.size > MAX) return setError("파일이 10MB보다 커요. 사진을 줄이거나 쪽을 나눠 올려 주세요.");
    setFile(f);
  }

  function show(drafts: Draft[], who: string, left = 0) {
    setMore(left);
    setRows(drafts.map((d) => ({ draft: d, value: d, keep: Boolean(d.stem) })));
    setBy(who);
    setSaved(null);
    requestAnimationFrame(() => results.current?.focus());
  }

  async function runAi() {
    setBusy("ai");
    setError(null);
    try {
      const form = new FormData();
      if (file) form.set("file", file);
      form.set("text", text);
      form.set("subject", subject);
      const r = await api<{ drafts: Draft[]; by: string; more?: number }>("/detect", { method: "POST", body: form });
      if (!r.drafts.length) setError("문제를 찾지 못했어요. 더 밝고 반듯한 사진으로 다시 해 보세요.");
      show(r.drafts, r.by, r.more ?? 0);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  }

  async function runPlain() {
    setBusy("plain");
    setError(null);
    try {
      const r = await api<{ drafts: Draft[]; more?: number }>("/detect/plain", { method: "POST", json: { text, subject } });
      if (!r.drafts.length) setError("나눌 문제를 찾지 못했어요. '1.' '2.'처럼 번호가 붙어 있어야 해요.");
      show(r.drafts, "", r.more ?? 0);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!rows) return;
    const keep = rows.filter((r) => r.keep);
    setBusy("save");
    setError(null);
    try {
      const made = await api<unknown[]>("/problems/bulk", { method: "POST", json: { problems: keep.map((r) => cleanProblem(r.value)) } });
      setSaved(made.length);
      setRows(null);
      setFile(null);
      setText("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  }

  const kept = rows?.filter((r) => r.keep).length ?? 0;
  const aiOff = ai ? !ai.enabled : false;
  return (
    <div className="page">
      <Heading size="7">가져오기</Heading>
      <Text as="p" color="gray" mt="1" mb="5">
        시험지·학습지 사진이나 PDF, 붙여 넣은 글에서 문제를 뽑아요. 저장하기 전에 하나씩 확인하고 고칠 수 있어요.
      </Text>
      <div className="two">
        <Flex direction="column" gap="4">
          <AiNotice status={ai} />
          <label
            className="drop"
            data-over={over}
            onDragOver={(e) => (e.preventDefault(), setOver(true))}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              pick(e.dataTransfer.files[0]);
            }}
          >
            <input ref={input} type="file" accept={TYPES.join(",")} className="sr-only" style={{ position: "absolute", opacity: 0, width: 1, height: 1 }} onChange={(e) => pick(e.target.files?.[0])} />
            {file ? (
              <Flex direction="column" align="center" gap="2">
                {preview ? <img src={preview} alt="올린 사진 미리 보기" className="thumb" /> : <FileTextIcon width={32} height={32} />}
                <Text size="2" weight="medium">
                  {file.name}
                </Text>
                <Button
                  variant="ghost"
                  size="1"
                  color="gray"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    if (input.current) input.current.value = "";
                  }}
                >
                  다른 파일로
                </Button>
              </Flex>
            ) : (
              <Flex direction="column" align="center" gap="2">
                <UploadIcon width={26} height={26} color="var(--accent-9)" />
                <Text weight="medium">사진이나 PDF를 끌어다 놓거나 눌러서 고르기</Text>
                <Text size="1" color="gray">
                  PNG · JPG · WebP · PDF, 10MB까지 · AI로 읽어요 (아이폰 HEIC는 JPG로 바꿔서)
                </Text>
              </Flex>
            )}
          </label>
          <Box>
            <Flex justify="between" align="end" mb="1">
              <label className="field-label" htmlFor="paste">
                또는 문제 글 붙여 넣기
              </label>
              <Button variant="ghost" size="1" onClick={() => (setText(SAMPLE), setSubject("수학"))}>
                예시 글 넣어 보기
              </Button>
            </Flex>
            <TextArea id="paste" rows={9} maxLength={20000} value={text} onChange={(e) => setText(e.target.value)} placeholder={"1. 문제 … ① 보기 ② 보기\n정답: ②\n해설: …"} resize="vertical" />
          </Box>
          <Flex gap="3" align="center" wrap="wrap">
            <Text size="2" color="gray" as="label" htmlFor="subject">
              과목
            </Text>
            <Select.Root value={subject} onValueChange={(s) => setSubject(s as Subject)}>
              <Select.Trigger id="subject" />
              <Select.Content>
                {SUBJECTS.map((s) => (
                  <Select.Item key={s} value={s}>
                    {s === "기타" ? "모름 · 기타" : s}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex gap="3" wrap="wrap">
            <Button size="3" onClick={runAi} disabled={aiOff || Boolean(busy) || (!file && !text.trim())} loading={busy === "ai"}>
              <MagicWandIcon /> AI로 문제 뽑기
            </Button>
            <Button size="3" variant="soft" onClick={runPlain} disabled={Boolean(busy) || !text.trim()} loading={busy === "plain"}>
              <ReaderIcon /> AI 없이 나누기
            </Button>
          </Flex>
          <Text size="1" color="gray">
            AI 없이 나누기는 붙여 넣은 글을 번호(1. 2. …)와 ①②, &quot;정답:&quot;·&quot;해설:&quot;으로 나눠요. 사진·PDF는 AI가 있어야 읽을 수 있어요.
          </Text>
        </Flex>

        <section aria-labelledby="drafts-title">
          {busy === "ai" && (
            <Card size="3">
              <Flex gap="3" align="center">
                <Spinner />
                <Text>{file ? "자료를 읽는 중이에요. 보통 10~40초 걸려요." : "글에서 문제를 찾는 중이에요."}</Text>
              </Flex>
            </Card>
          )}
          {error && (
            <Callout.Root color="red" mb="4" role="alert">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
          {saved !== null && (
            <Callout.Root color="jade" mb="4" role="status">
              <Callout.Text>
                {saved}문제를 문제은행에 넣었어요. <Link href="/">문제 목록에서 보기</Link>
              </Callout.Text>
            </Callout.Root>
          )}
          {rows && rows.length > 0 && busy !== "ai" && (
            <>
              <Flex justify="between" align="center" mb="3" gap="3" wrap="wrap">
                <Heading size="4" id="drafts-title" tabIndex={-1} ref={results}>
                  찾은 문제 {rows.length}개
                  {by && (
                    <Text size="1" color="gray" weight="regular">
                      {" "}
                      · {by}
                    </Text>
                  )}
                </Heading>
                <Button variant="ghost" size="1" onClick={() => setRows(rows.map((r) => ({ ...r, keep: kept < rows.length })))}>
                  {kept < rows.length ? "모두 고르기" : "모두 빼기"}
                </Button>
              </Flex>
              {more > 0 && (
                <Callout.Root color="amber" size="1" mb="3">
                  <Callout.Text>한 번에 {rows.length}문제까지 가져와요. 남은 {more}문제는 저장한 뒤 나머지 부분만 다시 넣어 주세요.</Callout.Text>
                </Callout.Root>
              )}
              <Flex direction="column" gap="3" pb="9">
                {rows.map((r, i) => (
                  <Card key={i} size="2" style={{ opacity: r.keep ? 1 : 0.6 }}>
                    <Flex justify="between" align="center" mb="3" gap="2" wrap="wrap">
                      <Text as="label" size="2" weight="bold" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <Checkbox checked={r.keep} onCheckedChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, keep: v === true } : x)))} />
                        {i + 1}번 저장
                      </Text>
                      <Flex gap="1" wrap="wrap">
                        {r.draft.answerFrom === "ai" && (
                          <Badge color="amber" variant="soft">
                            AI가 푼 답 · 확인
                          </Badge>
                        )}
                        {r.draft.check
                          .filter((c) => !c.startsWith("AI가 푼"))
                          .map((c) => (
                            <Badge key={c} color="orange" variant="soft">
                              {c}
                            </Badge>
                          ))}
                      </Flex>
                    </Flex>
                    {r.keep && <ProblemFields compact value={r.value} onChange={(value) => setRows(rows.map((x, j) => (j === i ? { ...x, value } : x)))} />}
                  </Card>
                ))}
              </Flex>
              <Flex justify="end" mt="4" pb="2" style={{ position: "sticky", bottom: 16 }}>
                <Button size="3" onClick={save} loading={busy === "save"} disabled={!kept || rows.some((r) => r.keep && !r.value.stem.trim())}>
                  고른 {kept}문제 저장
                </Button>
              </Flex>
            </>
          )}
          {!rows && busy !== "ai" && saved === null && (
            <Card size="3" variant="surface">
              <Heading size="3" mb="2">
                이렇게 돼요
              </Heading>
              <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, color: "var(--gray-11)", fontSize: 14 }}>
                <li>사진·PDF를 올리거나 글을 붙여 넣어요.</li>
                <li>AI가 문항·보기·정답·유형·난이도·태그를 뽑아요. 정답이 없으면 직접 풀고 “AI가 푼 답”이라고 표시해요.</li>
                <li>여기서 하나씩 고치고, 넣을 것만 골라 저장해요.</li>
              </ol>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
