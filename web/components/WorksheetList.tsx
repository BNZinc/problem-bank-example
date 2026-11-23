"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Callout, Card, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorText } from "@/lib/api";
import type { Worksheet } from "@/lib/types";
import { EmptyShelf } from "./EmptyShelf";

export function WorksheetList() {
  const router = useRouter();
  const [sheets, setSheets] = useState<Worksheet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Worksheet[]>("/worksheets").then(setSheets, (e) => setError(errorText(e)));
  }, []);
  async function create() {
    setBusy(true);
    try {
      const w = await api<Worksheet>("/worksheets", { method: "POST", json: { title: "새 문제지" } });
      router.push(`/worksheets/${w.id}`);
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <Flex justify="between" align="end" mb="5" gap="3" wrap="wrap">
        <div>
          <Heading size="7">문제지</Heading>
          <Text color="gray" size="2">
            고른 문제를 순서대로 엮어 인쇄하거나 PDF로 저장해요.
          </Text>
        </div>
        <Button onClick={create} loading={busy}>
          <PlusIcon /> 새 문제지
        </Button>
      </Flex>
      {error && (
        <Callout.Root color="red" mb="4" role="alert">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      {sheets === null && !error && <Skeleton height="160px" />}
      {sheets?.length === 0 && <EmptyShelf title="아직 문제지가 없어요" text="문제 목록에서 문제를 골라 [문제지에 담기]를 눌러 보세요." />}
      <div className="sheet-list">
        {sheets?.map((s) => (
          <Card key={s.id} size="2" asChild>
            <Link href={`/worksheets/${s.id}`} style={{ textDecoration: "none" }}>
              <div className="paper-thumb" aria-hidden="true" />
              <Text as="div" weight="bold" size="3">
                {s.title}
              </Text>
              <Text as="div" size="2" color="gray" mt="1">
                {s.problemIds.length}문제 · {s.columns}단{s.withAnswers ? " · 정답지" : ""}
                {s.subtitle ? ` · ${s.subtitle}` : ""}
              </Text>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
