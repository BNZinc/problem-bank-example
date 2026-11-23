"use client";

import { Cross2Icon, MagnifyingGlassIcon, MixerHorizontalIcon, PlusIcon, UploadIcon } from "@radix-ui/react-icons";
import { AlertDialog, Button, Callout, Flex, Heading, Select, Skeleton, Text, TextField } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, errorText } from "@/lib/api";
import { SUBJECTS, TYPE_LABEL, TYPES, type Facets, type Page, type Problem, type Worksheet } from "@/lib/types";
import { AddToSheet } from "./AddToSheet";
import { Dots } from "./bits";
import { EmptyShelf } from "./EmptyShelf";
import { ProblemCard } from "./ProblemCard";

const SIZE = 20;
const SORTS = { new: "최근 등록순", old: "오래된 순", easy: "쉬운 순", hard: "어려운 순" } as const;

export function ProblemBrowser() {
  const router = useRouter();
  const params = useSearchParams();
  const f = useMemo(
    () => ({
      q: params.get("q") ?? "",
      subject: params.getAll("subject"),
      type: params.getAll("type"),
      difficulty: params.getAll("difficulty"),
      tag: params.get("tag") ?? "",
      sort: (params.get("sort") ?? "new") as keyof typeof SORTS,
      sheet: Number(params.get("sheet")) || null,
    }),
    [params],
  );
  const [query, setQuery] = useState(f.q);
  const [items, setItems] = useState<Problem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const [target, setTarget] = useState<Worksheet | null>(null);
  const [deleting, setDeleting] = useState<Problem | null>(null);
  const [deletingSheets, setDeletingSheets] = useState<{ id: number; title: string }[]>([]);
  useEffect(() => {
    setDeletingSheets([]);
    if (deleting) api<{ id: number; title: string }[]>(`/problems/${deleting.id}/sheets`).then(setDeletingSheets, () => {});
  }, [deleting]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const set = useCallback(
    (change: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      change(next);
      router.replace(`/${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, router],
  );
  const toggle = (key: string, value: string) =>
    set((p) => {
      const now = p.getAll(key);
      p.delete(key);
      for (const v of now.includes(value) ? now.filter((x) => x !== value) : [...now, value]) p.append(key, v);
    });

  const listUrl = useCallback(
    (n: number) => {
      const p = new URLSearchParams();
      if (f.q) p.set("q", f.q);
      for (const k of ["subject", "type", "difficulty"] as const) if (f[k].length) p.set(k, f[k].join(","));
      if (f.tag) p.set("tag", f.tag);
      p.set("sort", f.sort);
      p.set("page", String(n));
      p.set("size", String(SIZE));
      return `/problems?${p}`;
    },
    [f],
  );

  const loadFacets = useCallback(() => api<Facets>("/problems/facets").then(setFacets, (e) => setError(errorText(e))), []);
  useEffect(() => void loadFacets(), [loadFacets]);
  useEffect(() => {
    let live = true;
    setItems(null);
    api<Page<Problem>>(listUrl(1)).then(
      (r) => {
        if (!live) return;
        setItems(r.items);
        setTotal(r.total);
        setPage(1);
        setError(null);
      },
      (e) => live && setError(errorText(e)),
    );
    return () => {
      live = false;
    };
  }, [listUrl]);
  // Came from a worksheet's [문제 더하기]: picked problems go to that one.
  useEffect(() => {
    if (!f.sheet) return setTarget(null);
    api<Worksheet>(`/worksheets/${f.sheet}`).then(setTarget, () => setTarget(null));
  }, [f.sheet]);
  // Typing settles for a moment before it searches.
  useEffect(() => {
    if (query === f.q) return;
    const t = setTimeout(() => set((p) => (query.trim() ? p.set("q", query.trim()) : p.delete("q"))), 300);
    return () => clearTimeout(t);
  }, [query, f.q, set]);

  async function more() {
    setLoadingMore(true);
    try {
      const r = await api<Page<Problem>>(listUrl(page + 1));
      setItems((old) => [...(old ?? []), ...r.items]);
      setPage(page + 1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoadingMore(false);
    }
  }

  async function remove(p: Problem) {
    try {
      await api(`/problems/${p.id}`, { method: "DELETE" });
      setItems((old) => old?.filter((x) => x.id !== p.id) ?? null);
      setTotal((t) => t - 1);
      setPicked((s) => {
        const n = new Set(s);
        n.delete(p.id);
        return n;
      });
      void loadFacets();
    } catch (e) {
      setError(errorText(e));
    }
  }

  const count = (list: Facets["subject"] | undefined, key: string) => list?.find((x) => x.key === key)?.n ?? 0;
  const filtered = Boolean(f.q || f.subject.length || f.type.length || f.difficulty.length || f.tag);

  return (
    <div className="bank">
      <aside className="rail" aria-label="거르기" data-open={showFilters}>
        <Button className="rail-toggle" variant="soft" color="gray" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          <MixerHorizontalIcon /> 거르기{filtered ? " · 켜짐" : ""} {showFilters ? "접기" : "펼치기"}
        </Button>
        <div className="rail-body">
        <div className="rail-group">
          <h2>과목</h2>
          <div className="chips">
            {SUBJECTS.filter((s) => count(facets?.subject, s) || f.subject.includes(s)).map((s) => (
              <button key={s} className="chip" aria-pressed={f.subject.includes(s)} onClick={() => toggle("subject", s)}>
                {s} <span className="n">{count(facets?.subject, s)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rail-group">
          <h2>유형</h2>
          <div className="chips">
            {TYPES.map((t) => (
              <button key={t} className="chip" aria-pressed={f.type.includes(t)} onClick={() => toggle("type", t)}>
                {TYPE_LABEL[t]} <span className="n">{count(facets?.type, t)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rail-group">
          <h2>난이도</h2>
          <div className="chips">
            {[1, 2, 3, 4, 5].filter((d) => count(facets?.difficulty, String(d)) || f.difficulty.includes(String(d))).map((d) => (
              <button key={d} className="chip" aria-pressed={f.difficulty.includes(String(d))} onClick={() => toggle("difficulty", String(d))} aria-label={`난이도 ${d}, ${count(facets?.difficulty, String(d))}문제`}>
                <Dots n={d} /> <span className="n">{count(facets?.difficulty, String(d))}</span>
              </button>
            ))}
          </div>
        </div>
        {facets && facets.tags.length > 0 && (
          <div className="rail-group">
            <h2>태그</h2>
            <div className="chips">
              {facets.tags.slice(0, 16).map((t) => (
                <button key={t.key} className="chip" aria-pressed={f.tag === t.key} onClick={() => set((p) => (f.tag === t.key ? p.delete("tag") : p.set("tag", t.key)))}>
                  #{t.key} <span className="n">{t.n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {filtered && (
          <Button variant="ghost" color="gray" onClick={() => (setQuery(""), set((p) => ["q", "subject", "type", "difficulty", "tag"].forEach((k) => p.delete(k))))} style={{ alignSelf: "flex-start" }}>
            <Cross2Icon /> 거르기 모두 풀기
          </Button>
        )}
        </div>
      </aside>

      <section aria-labelledby="bank-title">
        <Flex justify="between" align="end" gap="3" wrap="wrap" mb="4">
          <div>
            <Heading id="bank-title" size="7" weight="bold">
              문제
            </Heading>
            <Text color="gray" size="2">
              {facets ? `모두 ${facets.total}문제${filtered ? ` · 거른 결과 ${total}문제` : ""}` : " "}
            </Text>
          </div>
          <Flex gap="2">
            <Button variant="soft" asChild>
              <Link href="/import">
                <UploadIcon /> 사진·글에서 가져오기
              </Link>
            </Button>
          </Flex>
        </Flex>
        {target && (
          <Callout.Root color="jade" variant="surface" mb="4" size="1">
            <Callout.Text>
              고른 문제를 「{target.title}」 문제지에 더해요. <Link href={`/worksheets/${target.id}`}>문제지로 돌아가기</Link>
            </Callout.Text>
          </Callout.Root>
        )}
        <Flex gap="3" mb="4" wrap="wrap">
          <TextField.Root size="3" placeholder="문제·보기·해설·태그에서 찾기" maxLength={100} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="문제 찾기" style={{ flex: "1 1 260px" }}>
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
          <Select.Root size="3" value={f.sort} onValueChange={(v) => set((p) => (v === "new" ? p.delete("sort") : p.set("sort", v)))}>
            <Select.Trigger aria-label="정렬" />
            <Select.Content>
              {Object.entries(SORTS).map(([k, v]) => (
                <Select.Item key={k} value={k}>
                  {v}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
        {error && (
          <Callout.Root color="red" mb="4" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
        <Flex direction="column" gap="3">
          {items === null && !error && [0, 1, 2].map((i) => <Skeleton key={i} height="140px" />)}
          {items?.length === 0 &&
            (filtered ? (
              <EmptyShelf title="맞는 문제가 없어요" text="거르기를 줄이거나 다른 말로 찾아보세요." />
            ) : (
              <EmptyShelf title="아직 문제가 없어요" text="직접 적거나, 시험지 사진에서 가져와 보세요.">
                <Flex gap="2" justify="center" mt="3">
                  <Button asChild>
                    <Link href="/problems/new">
                      <PlusIcon /> 새 문제
                    </Link>
                  </Button>
                  <Button asChild variant="soft">
                    <Link href="/import">가져오기</Link>
                  </Button>
                </Flex>
              </EmptyShelf>
            ))}
          {items?.map((p) => (
            <ProblemCard
              key={p.id}
              p={p}
              picked={picked.has(p.id)}
              onPick={(on) =>
                setPicked((s) => {
                  const n = new Set(s);
                  if (on) n.add(p.id);
                  else n.delete(p.id);
                  return n;
                })
              }
              onDelete={() => setDeleting(p)}
            />
          ))}
          {items && items.length < total && (
            <Button variant="soft" color="gray" size="3" onClick={more} loading={loadingMore}>
              더 보기 ({total - items.length}문제 남음)
            </Button>
          )}
        </Flex>
      </section>

      {picked.size > 0 && (
        <div className="tray" role="region" aria-label="고른 문제">
          <Text size="2" weight="medium">
            {picked.size}문제 골랐어요
          </Text>
          <Button variant="ghost" color="gray" highContrast size="2" onClick={() => setPicked(new Set())} style={{ color: "var(--gray-4)" }}>
            고르기 풀기
          </Button>
          <Button size="2" radius="full" onClick={() => setAdding(true)}>
            {target ? `「${target.title}」에 더하기` : "문제지에 담기"}
          </Button>
        </div>
      )}

      <AddToSheet
        open={adding}
        onOpenChange={setAdding}
        ids={[...picked]}
        target={target}
        onDone={(sheet) => {
          setPicked(new Set());
          router.push(`/worksheets/${sheet.id}`);
        }}
      />

      <AlertDialog.Root open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>이 문제를 지울까요?</AlertDialog.Title>
          <AlertDialog.Description size="2">
            지우면 되살릴 수 없어요.
            {deletingSheets.length > 0 && ` 이 문제는 문제지 ${deletingSheets.length}개(${deletingSheets.slice(0, 2).map((s) => `「${s.title}」`).join(", ")}${deletingSheets.length > 2 ? " 등" : ""})에 들어 있어서, 거기서도 빠져요.`}
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                그대로 두기
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={() => deleting && remove(deleting)}>
                지우기
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  );
}
