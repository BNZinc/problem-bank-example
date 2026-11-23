import { Flex, Heading, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

/** An empty state with a small drawing (made here as SVG): an open storehouse with empty shelves. */
export function EmptyShelf({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <Flex direction="column" align="center" py="8" px="4" style={{ textAlign: "center" }}>
      <svg width="132" height="96" viewBox="0 0 132 96" aria-hidden="true">
        <path d="M14 38 66 8l52 30" fill="none" stroke="var(--gray-8)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="26" y="34" width="80" height="56" rx="6" fill="var(--gray-2)" stroke="var(--gray-7)" strokeWidth="2" />
        <path d="M34 54h64M34 72h64" stroke="var(--gray-6)" strokeWidth="2" strokeLinecap="round" />
        <rect x="40" y="42" width="14" height="10" rx="2" fill="var(--accent-4)" />
        <rect x="76" y="60" width="18" height="10" rx="2" fill="var(--accent-5)" />
      </svg>
      <Heading size="4" mt="3">
        {title}
      </Heading>
      <Text color="gray" size="2" mt="1">
        {text}
      </Text>
      {children}
    </Flex>
  );
}
