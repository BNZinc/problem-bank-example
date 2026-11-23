"use client";

import { Button, Callout, Dialog, Flex, RadioGroup, Text, TextField } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { api, errorText } from "@/lib/api";
import type { Worksheet } from "@/lib/types";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; ids: number[]; target: Worksheet | null; onDone: (w: Worksheet) => void };

/** Puts picked problems on a new worksheet or at the end of an existing one. */
export function AddToSheet({ open, onOpenChange, ids, target, onDone }: Props) {
  const [sheets, setSheets] = useState<Worksheet[]>([]);
  const [choice, setChoice] = useState("new");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setChoice(target ? String(target.id) : "new");
    setTitle(`문제지 ${new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}`);
    api<Worksheet[]>("/worksheets").then(setSheets, () => setSheets([]));
  }, [open, target]);

  async function save() {
    setBusy(true);
    try {
      let sheet: Worksheet;
      if (choice === "new") sheet = await api<Worksheet>("/worksheets", { method: "POST", json: { title, problemIds: ids } });
      else {
        const w = sheets.find((s) => String(s.id) === choice) ?? target!;
        sheet = await api<Worksheet>(`/worksheets/${w.id}`, { method: "PUT", json: { title: w.title, subtitle: w.subtitle, withAnswers: w.withAnswers, columns: w.columns, problemIds: [...w.problemIds, ...ids] } });
      }
      onOpenChange(false);
      onDone(sheet);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="440px">
        <Dialog.Title>문제지에 담기</Dialog.Title>
        <Dialog.Description size="2" color="gray">
          고른 {ids.length}문제를 어디에 넣을까요? 이미 들어 있는 문제는 한 번만 들어가요.
        </Dialog.Description>
        <RadioGroup.Root value={choice} onValueChange={setChoice} mt="4">
          <RadioGroup.Item value="new">새 문제지</RadioGroup.Item>
          {choice === "new" && <TextField.Root value={title} onChange={(e) => setTitle(e.target.value)} aria-label="새 문제지 제목" ml="5" mb="2" />}
          {sheets.map((s) => (
            <RadioGroup.Item key={s.id} value={String(s.id)}>
              {s.title}{" "}
              <Text color="gray" size="1">
                · {s.problemIds.length}문제
              </Text>
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
        {error && (
          <Callout.Root color="red" mt="3" size="1" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}
        <Flex gap="3" mt="5" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              닫기
            </Button>
          </Dialog.Close>
          <Button onClick={save} loading={busy} disabled={choice === "new" && !title.trim()}>
            담기
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
