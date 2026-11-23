"use client";

import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, Cross2Icon, FileTextIcon, PlusIcon } from "@radix-ui/react-icons";
import { AlertDialog, Box, Button, Callout, Card, Flex, Heading, IconButton, SegmentedControl, Skeleton, Switch, Text, TextField } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorText } from "@/lib/api";
import type { Problem, WorksheetFull } from "@/lib/types";
import { MetaLine } from "./bits";
import { EmptyShelf } from "./EmptyShelf";

type Form = { title: string; subtitle: string; withAnswers: boolean; columns: 1 | 2; problems: Problem[] };

export function WorksheetEditor({ id }: { id: number }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"saved" | "saving" | "dirty" | "untitled">("saved");
  const first = useRef(true);
  // The change not sent yet. Sent after a short pause, and at once before leaving this screen.
  const pending = useRef<string | null>(null);
  const inflight = useRef<Promise<void> | null>(null);

  const flush = useCallback(async (): Promise<void> => {
    // A save already on its way: wait for it, then send what changed since.
    if (inflight.current) await inflight.current;
    const body = pending.current;
    if (!body) return;
    pending.current = null;
    const run = send(body);
    inflight.current = run;
    await run.finally(() => {
      if (inflight.current === run) inflight.current = null;
    });
  }, [id]);

  const send = async (body: string) => {
    setState("saving");
    try {
      // keepalive: still sent when the page is being left.
      await api(`/worksheets/${id}`, { method: "PUT", body, headers: { "content-type": "application/json" }, keepalive: true });
      setState((s) => (s === "saving" && !pending.current ? "saved" : s));
      setError(null);
    } catch (e) {
      pending.current ??= body;
      setError(errorText(e));
      setState("dirty");
    }
  };

  // Leaving (another screen, closing the window): what is left goes now.
  useEffect(() => {
    const leave = () => void flush();
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      void flush();
    };
  }, [flush]);

  /** Goes to `href` once the last change is saved (the print page reads the saved order). */
  const go = (href: string) => async (e: React.MouseEvent) => {
    e.preventDefault();
    await flush();
    if (!pending.current) router.push(href);
  };

  useEffect(() => {
    api<WorksheetFull>(`/worksheets/${id}`).then(
      (w) => setForm({ title: w.title, subtitle: w.subtitle, withAnswers: w.withAnswers, columns: w.columns, problems: w.problems }),
      (e) => setError(errorText(e)),
    );
  }, [id]);

  // Saves by itself a moment after each change.
  useEffect(() => {
    if (!form) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (!form.title.trim()) {
      pending.current = null;
      setState("untitled");
      return;
    }
    pending.current = JSON.stringify({ title: form.title, subtitle: form.subtitle, withAnswers: form.withAnswers, columns: form.columns, problemIds: form.problems.map((p) => p.id) });
    setState("dirty");
    const t = setTimeout(() => void flush(), 500);
    return () => clearTimeout(t);
  }, [form, flush]);

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const move = (i: number, d: -1 | 1) => {
    if (!form) return;
    const list = [...form.problems];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    set({ problems: list });
  };

  async function remove() {
    try {
      await api(`/worksheets/${id}`, { method: "DELETE" });
      router.push("/worksheets");
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <div className="page">
      <Button variant="ghost" color="gray" asChild mb="3">
        <Link href="/worksheets" onClick={go("/worksheets")}>
          <ArrowLeftIcon /> 문제지 목록
        </Link>
      </Button>
      {error && (
        <Callout.Root color="red" mb="4" role="alert">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      {!form && !error && <Skeleton height="320px" />}
      {form && (
        <div className="editor">
          <div>
            <Flex justify="between" align="center" mb="3" gap="3" wrap="wrap">
              <Heading size="5">문제 {form.problems.length}개</Heading>
              <Button variant="soft" asChild>
                <Link href={`/?sheet=${id}`} onClick={go(`/?sheet=${id}`)}>
                  <PlusIcon /> 문제 더하기
                </Link>
              </Button>
            </Flex>
            <Card size="2">
              {form.problems.length === 0 ? (
                <EmptyShelf title="빈 문제지예요" text="[문제 더하기]로 문제 목록에서 골라 넣어요." />
              ) : (
                <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {form.problems.map((p, i) => (
                    <li key={p.id} className="order-row">
                      <Text weight="bold" size="4" color="jade">
                        {i + 1}
                      </Text>
                      <div style={{ minWidth: 0 }}>
                        <MetaLine p={p} />
                        <Text as="p" size="2" mt="1" style={{ whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {p.stem}
                        </Text>
                      </div>
                      <Flex gap="1">
                        <IconButton variant="ghost" color="gray" size="1" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${i + 1}번을 위로`}>
                          <ArrowUpIcon />
                        </IconButton>
                        <IconButton variant="ghost" color="gray" size="1" disabled={i === form.problems.length - 1} onClick={() => move(i, 1)} aria-label={`${i + 1}번을 아래로`}>
                          <ArrowDownIcon />
                        </IconButton>
                        <IconButton variant="ghost" color="gray" size="1" onClick={() => set({ problems: form.problems.filter((x) => x.id !== p.id) })} aria-label={`${i + 1}번 빼기`}>
                          <Cross2Icon />
                        </IconButton>
                      </Flex>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
          <aside style={{ position: "sticky", top: 76 }}>
            <Card size="3">
              <Flex direction="column" gap="4">
                <Box>
                  <label className="field-label" htmlFor="ws-title">
                    제목
                  </label>
                  <TextField.Root id="ws-title" size="3" value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={80} />
                  {!form.title.trim() && (
                    <Text size="1" color="red">
                      제목을 적어야 저장돼요
                    </Text>
                  )}
                </Box>
                <Box>
                  <label className="field-label" htmlFor="ws-sub">
                    부제 <Text color="gray">(반·날짜·시간 등)</Text>
                  </label>
                  <TextField.Root id="ws-sub" value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} maxLength={120} />
                </Box>
                <Flex justify="between" align="center">
                  <Text size="2" weight="medium">
                    단
                  </Text>
                  <SegmentedControl.Root value={String(form.columns)} onValueChange={(v) => set({ columns: v === "1" ? 1 : 2 })} aria-label="단 수">
                    <SegmentedControl.Item value="1">1단</SegmentedControl.Item>
                    <SegmentedControl.Item value="2">2단</SegmentedControl.Item>
                  </SegmentedControl.Root>
                </Flex>
                <Text as="label" size="2" weight="medium" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  끝에 정답·해설 붙이기
                  <Switch checked={form.withAnswers} onCheckedChange={(v) => set({ withAnswers: v })} />
                </Text>
                {form.problems.length ? (
                  <Button size="3" asChild>
                    <Link href={`/worksheets/${id}/print`} onClick={go(`/worksheets/${id}/print`)}>
                      <FileTextIcon /> 인쇄 · PDF로 저장
                    </Link>
                  </Button>
                ) : (
                  <Button size="3" disabled>
                    <FileTextIcon /> 문제를 넣으면 인쇄할 수 있어요
                  </Button>
                )}
                <Flex justify="between" align="center">
                  <Text size="1" color="gray" role="status">
                    {state === "saved" ? "저장됨" : state === "saving" ? "저장하는 중…" : state === "untitled" ? "제목이 없어 저장하지 않았어요" : "곧 저장해요"}
                  </Text>
                  <AlertDialog.Root>
                    <AlertDialog.Trigger>
                      <Button variant="ghost" color="red" size="1">
                        문제지 지우기
                      </Button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Content maxWidth="400px">
                      <AlertDialog.Title>이 문제지를 지울까요?</AlertDialog.Title>
                      <AlertDialog.Description size="2">문제지만 지워지고, 안에 담긴 문제는 문제은행에 그대로 남아요.</AlertDialog.Description>
                      <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                          <Button variant="soft" color="gray">
                            그대로 두기
                          </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action>
                          <Button color="red" onClick={remove}>
                            지우기
                          </Button>
                        </AlertDialog.Action>
                      </Flex>
                    </AlertDialog.Content>
                  </AlertDialog.Root>
                </Flex>
              </Flex>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
