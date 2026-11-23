"use client";

import { CheckCircledIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";
import type { AiStatus } from "@/lib/types";

/** Whether AI 문제 인식 is on; without a key, where to put one (the rest works without it). */
export function AiNotice({ status }: { status: AiStatus | null }) {
  if (!status) return null;
  return (
    <Callout.Root color={status.enabled ? "jade" : "amber"} variant="surface" size="1">
      <Callout.Icon>{status.enabled ? <CheckCircledIcon /> : <InfoCircledIcon />}</Callout.Icon>
      <Callout.Text>{status.enabled ? `AI 켜짐 · ${status.provider} (${status.model})` : status.message}</Callout.Text>
    </Callout.Root>
  );
}
