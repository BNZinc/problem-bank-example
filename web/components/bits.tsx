import { Badge, Flex, Text } from "@radix-ui/themes";
import { DIFF_LABEL, TYPE_LABEL, type ProblemInput } from "@/lib/types";

export function Dots({ n }: { n: number }) {
  return (
    <span className="dots" role="img" aria-label={`난이도 ${n} · ${DIFF_LABEL[n] ?? ""}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= n ? "on" : ""} />
      ))}
    </span>
  );
}

/** Subject · grade · type · difficulty · tags, in one line. */
export function MetaLine({ p }: { p: Pick<ProblemInput, "subject" | "grade" | "type" | "difficulty" | "tags"> }) {
  return (
    <Flex gap="2" align="center" wrap="wrap">
      <Badge color="jade" variant="soft" radius="full">
        {p.subject}
      </Badge>
      {p.grade && (
        <Text size="1" color="gray">
          {p.grade}
        </Text>
      )}
      <Text size="1" color="gray">
        {TYPE_LABEL[p.type]}
      </Text>
      <Dots n={p.difficulty} />
      {p.tags.slice(0, 4).map((t) => (
        <Text key={t} size="1" color="gray">
          #{t}
        </Text>
      ))}
    </Flex>
  );
}
