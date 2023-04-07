import { Box, Center, Flex, Heading } from "@chakra-ui/react";
import React from "react";

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Center>
      <Box w="100%" display={{ base: "none", lg: "block" }} minHeight="100vh">
        <Flex w="100%" h="100vh" justifyContent="center" mt="20%">
          <Heading>Welcome to Studlancer!</Heading>
        </Flex>
      </Box>
      <Center w="100%" h="100vh">
        {children}
      </Center>
    </Center>
  );
}
