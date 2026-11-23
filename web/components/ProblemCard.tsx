"use client";

import { DotsHorizontalIcon, EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { Button, Checkbox, DropdownMenu, Flex, IconButton, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useState } from "react";
import { answerText, CIRCLED, type Problem } from "@/lib/types";
import { MetaLine } from "./bits";

type Props = { p: Problem; picked: boolean; onPick: (on: boolean) => void; onDelete: () => void };

export function ProblemCard({ p, picked, onPick, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const answers = new Set(p.type === "multiple" ? p.answer.split(",") : []);
  return (
    <article className="problem" data-picked={picked} aria-labelledby={`p-${p.id}`}>
      <Checkbox size="2" checked={picked} onCheckedChange={(v) => onPick(v === true)} aria-labelledby={`pick-${p.id} p-${p.id}`} style={{ marginTop: 3 }} />
      <span id={`pick-${p.id}`} hidden>
        문제지에 담기:
      </span>
      <div style={{ minWidth: 0 }}>
        <Flex justify="between" gap="2" align="start">
          <MetaLine p={p} />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton variant="ghost" color="gray" size="1" aria-label="더 보기">
                <DotsHorizontalIcon />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item asChild>
                <Link href={`/problems/${p.id}`}>고치기</Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item color="red" onSelect={onDelete}>
                지우기
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
        <p className="stem" id={`p-${p.id}`}>
          {p.stem}
        </p>
        {p.type === "multiple" && (
          <ol className="choices">
            {p.choices.map((c, i) => (
              <li key={i} data-answer={open && answers.has(String(i + 1))}>
                <span aria-hidden="true">{CIRCLED[i]}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        )}
        <Flex mt="3" gap="3" align="center" wrap="wrap">
          {(p.answer || p.explanation) && (
            <Button variant="ghost" size="1" color="gray" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? <EyeClosedIcon /> : <EyeOpenIcon />} {open ? "정답 가리기" : "정답 보기"}
            </Button>
          )}
          {p.source && (
            <Text size="1" color="gray">
              {p.source}
            </Text>
          )}
        </Flex>
        {open && (
          <div className="answer-box">
            {p.answer ? <strong>정답 {answerText(p)}</strong> : <Text color="gray">정답 없음</Text>}
            {p.explanation && `\n${p.explanation}`}
          </div>
        )}
      </div>
    </article>
  );
}
