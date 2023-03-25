import { Card, CardBody, CardFooter, Flex, Text } from "@chakra-ui/react";

export default function AboutUser() {
  return (
    <Card w={{ base: "100%" }} height={{ base: "xs" }} borderRadius="2xl">
      <CardBody>
        <Flex h={16}></Flex>
        <Text fontSize={{ base: "xl" }} fontWeight="bold">
          Pachimari
        </Text>
        <Text fontSize={{ base: "xl" }}>About</Text>
      </CardBody>
      <CardFooter>Links</CardFooter>
    </Card>
  );
}
