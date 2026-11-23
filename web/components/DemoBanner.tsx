"use client";

import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Text } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Space = { demo: false } | { demo: true; readonly: boolean; idleDays: number; message?: string };

/** On the public demo: what happens to what you make here (or why saving is off right now). */
export function DemoBanner() {
  const path = usePathname() ?? "/";
  const [space, setSpace] = useState<Space | null>(null);
  useEffect(() => {
    api<Space>("/space").then(setSpace, () => setSpace(null));
  }, []);
  if (!space?.demo || /^\/worksheets\/\d+\/print/.test(path)) return null;
  return (
    <div className="demo-banner" role="note" data-readonly={space.readonly}>
      <InfoCircledIcon aria-hidden="true" />
      <Text size="2">{space.readonly ? space.message : `체험판이에요. 여기서 만든 문제와 문제지는 이 브라우저에만 저장되고, ${space.idleDays}일 동안 쓰지 않으면 지워져요.`}</Text>
    </div>
  );
}
