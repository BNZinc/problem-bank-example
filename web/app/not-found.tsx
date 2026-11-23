import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";

export default function NotFound() {
  return (
    <Flex direction="column" align="center" gap="3" py="9" px="4" style={{ textAlign: "center" }}>
      <Heading size="6">찾는 화면이 없어요</Heading>
      <Text color="gray">지워졌거나 주소가 바뀌었을 수 있어요.</Text>
      <Button asChild mt="2">
        <Link href="/">문제 목록으로</Link>
      </Button>
    </Flex>
  );
}
