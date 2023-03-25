import { Box } from "@chakra-ui/react";
import React from "react";

export default function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box bg="gray.50" minWidth="2xs">
      <main className="page">{children}</main>
    </Box>
  );
}
