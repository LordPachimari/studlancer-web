import { IconButton, Input, Text, useToast } from "@chakra-ui/react";
import Link from "next/link";
import { KeyboardEvent, useState } from "react";

export const MessageInput = ({
  onSubmit,
  isSignedIn,
}: {
  onSubmit: (text: string) => Promise<null | undefined>;
  isSignedIn: boolean;
}) => {
  const toast = useToast();
  const [messageText, setMessageText] = useState("");
  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    // Watch for enter key
    if (event.key === "Enter" && isSignedIn) {
      onSubmit(messageText).catch((err) => console.log(err));
      setMessageText("");
    }
    if (event.key === "Enter") {
      if (!isSignedIn) {
        toast({
          title: "Please sign up to send a message",
          description: (
            <Link href="/">
              <Text as="u">Click here to sign up</Text>
            </Link>
          ),
          status: "info",
          isClosable: true,
        });
      }
    }
  };
  return (
    <>
      <Input
        w="100%"
        size="sm"
        bg="gray.200"
        borderRadius="md"
        placeholder="Send a message..."
        type="text"
        onChange={(e) => setMessageText(e.target.value)}
        onKeyDown={submitOnEnter}
        value={messageText}
      />
      <IconButton
        aria-label="send-message"
        bg="none"
        ml="2"
        size="sm"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              d="M3.5 1.3457C3.58425 1.3457 3.66714 1.36699 3.74096 1.4076L22.2034 11.562C22.4454 11.695 22.5337 11.9991 22.4006 12.241C22.3549 12.3241 22.2865 12.3925 22.2034 12.4382L3.74096 22.5925C3.499 22.7256 3.19497 22.6374 3.06189 22.3954C3.02129 22.3216 3 22.2387 3 22.1544V1.8457C3 1.56956 3.22386 1.3457 3.5 1.3457ZM5 4.38261V11.0001H10V13.0001H5V19.6175L18.8499 12.0001L5 4.38261Z"
              fill="var(--blue)"
            ></path>
          </svg>
        }
        disabled={!isSignedIn}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={() => {
          if (isSignedIn) {
            onSubmit(messageText)
              .catch((err) => console.log(err))
              .finally(() => setMessageText(""));
          } else {
            toast({
              title: "Please sign up to send a message",
              description: (
                <Link href="/">
                  <Text as="u">Click here to sign up</Text>
                </Link>
              ),
              status: "info",
              isClosable: true,
            });
          }
        }}
      />
    </>
  );
};
