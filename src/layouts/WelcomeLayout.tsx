import { Box, Center } from "@chakra-ui/react";
import React from "react";

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Center>
      <Box
        w="100%"
        display={{ base: "none", lg: "block" }}
        minHeight="100vh"
      ></Box>
      <Center w="100%" h="100vh" pr="1.5">
        {children}
      </Center>
    </Center>
  );
}
