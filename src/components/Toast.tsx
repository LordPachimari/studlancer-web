import { useToast } from "@chakra-ui/react";

export default function Toast({
  title,
  status,
  duration = 5000,
}: {
  title: string;
  status: "info" | "warning" | "success" | "error" | "loading" | undefined;
  duration?: number;
}) {
  const toast = useToast();
  return (
    <>
      {toast({
        title,
        status,
        isClosable: true,
        duration,
      })}
    </>
  );
}
