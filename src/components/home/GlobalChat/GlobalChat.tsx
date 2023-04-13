import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { supabaseClient } from "~/constants/supabaseClient";
import { TopicsType, Topics, Message } from "~/types/main";
import {
  Avatar,
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  Flex,
  FormControl,
  Heading,
  IconButton,
  Input,
  Select,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import Link from "next/link";
import { SupabaseClient } from "@supabase/supabase-js";
import { TABLE_GLOBAL_CHAT } from "~/constants/constants";
import { FromNow } from "~/utils/dayjs";
import { MessageInput } from "./MessageInput";
import { trpc } from "~/utils/api";
import produce from "immer";

export default function GlobalChat() {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);

  const [newMessage, setNewMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [channel, setChannel] = useState<TopicsType | "GENERAL">("GENERAL");
  const { getToken, isSignedIn, userId, isLoaded } = useAuth();
  const user = trpc.user.userById.useQuery(
    { id: userId || "" },
    { enabled: !!userId && isSignedIn && isLoaded, staleTime: 10 * 60 * 1000 }
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessage = async ({
    message,
    channel,
    username,
    profile_url,
    user_id,
  }: {
    message: string;
    channel: string;
    username: string;
    profile_url: string;
    user_id?: string;
  }) => {
    try {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      if (supabaseAccessToken) {
        const supabase = supabaseClient({ supabaseAccessToken });
        const { data } = await supabase
          .from(TABLE_GLOBAL_CHAT)
          .insert([{ message, channel, user_id, username, profile_url }]);
        // .select();
        return data;
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  const deleteMessage = async ({ messageId }: { messageId: string }) => {
    try {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      if (supabaseAccessToken) {
        const supabase = supabaseClient({ supabaseAccessToken });
        const { data } = await supabase
          .from(TABLE_GLOBAL_CHAT)
          .delete()
          .match({ id: messageId });
        return data;
      }
    } catch (error) {
      console.log("error", error);
    }
  };
  console.log("channel", channel);

  console.log("messages", messages);

  useEffect(() => {
    async function DoTheThing() {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      if (supabaseAccessToken) {
        const supabase = supabaseClient({ supabaseAccessToken });
        const supabaseChannel = supabase
          .channel("public:messages")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: TABLE_GLOBAL_CHAT,
            },
            // (payload) => setNewMessage(payload.new as Message)
            (payload) => {
              const newMessage = payload.new as Message;
              console.log("new message coming!", messages);
              // setMessages();
              setNewMessage(newMessage);
            }
          )
          // .on(
          //   "postgres_changes",
          //   {
          //     event: "DELETE",
          //     schema: "public",
          //     table: TABLE_GLOBAL_CHAT,
          //   },
          //   // (payload) => setDeletedMessage(payload.old as Message)
          //   (payload) => {
          //     const deletedMessage = payload.old as Message;
          //     if (channel === deletedMessage.channel) {
          //       const newMessages = messages.filter(
          //         (message) => message.id !== deletedMessage.id
          //       );
          //       setMessages(newMessages);
          //     }
          //   }
          // )

          .subscribe();
        return () => {
          supabase
            .removeChannel(supabaseChannel)
            .catch((err) => console.log(err));
        };
      }
    }
    DoTheThing().catch((err) => console.log("error realtime"));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const fetchMessages = async () => {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      if (supabaseAccessToken) {
        const supabase = supabaseClient({ supabaseAccessToken });

        try {
          setIsLoading(true);

          const { data } = await supabase
            .from(TABLE_GLOBAL_CHAT)
            .select(`*`)
            .eq("channel", channel)
            .order("created_at", { ascending: true });
          console.log("fetching messages from supabase...", data);

          if (data) {
            setMessages(data as Message[]);

            return data;
          }
        } catch (error) {
          console.log("error", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchMessages().catch((err) => console.log(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);
  // // New message received from Postgres
  useEffect(() => {
    if (newMessage && newMessage.channel === channel) {
      setMessages([...messages, newMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  // // New message received from Postgres
  // useEffect(() => {
  //   if (newMessage && newMessage.channel === channel) {
  //     setMessages([...messages, newMessage]);
  //   }
  // }, [channel, newMessage, messages]);
  // // Deleted message received from postgres
  // useEffect(() => {
  //   if (deletedMessage)
  //     setMessages(
  //       messages.filter((message) => message.id !== deletedMessage.id)
  //     );
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [deletedMessage]);

  useEffect(() => {
    if (messagesEndRef && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <Card
      w="90%"
      bg="none"
      borderWidth="3px"
      borderColor="gray.300"
      boxShadow="none"
      borderRadius="2xl"
    >
      <CardHeader display="flex" bg="white" h="12" pt="3" borderTopRadius="xl">
        <Heading as="h3" fontSize="lg">
          CHAT
        </Heading>
        <Select
          ml={5}
          size="sm"
          value={channel}
          onChange={(e) => setChannel(e.target.value as TopicsType | "GENERAL")}
        >
          <option value="general">GENERAL</option>
          {Topics.map((t) => (
            <option key={t} value="marketing">
              {t}
            </option>
          ))}
        </Select>
      </CardHeader>
      <CardBody
        py="0"
        pb={2}
        h="sm"
        minH="sm"
        maxH="sm"
        overflowY="auto"
        css={{
          // Add css to style the scrollbar
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "gray.400",
            borderRadius: "20px",
          },
        }}
      >
        {isLoading ? (
          <Center w="100%" h="100%">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
          </Center>
        ) : (
          <Flex flexDir="column" w="100%">
            {messages.map((m) => (
              <Card
                mt="2"
                w="100%"
                h="14"
                key={m.id}
                display="flex"
                flexDir="row"
                alignItems="center"
                p="1"
              >
                <Avatar size="sm" name={m.username} />
                <Flex flexDir="column" pl={2}>
                  <Text fontSize="sm" fontWeight="bold">
                    {m.username}
                  </Text>
                  <Text fontSize="sm">{m.message}</Text>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}

        <Box h={0} ref={messagesEndRef}></Box>
      </CardBody>
      <CardFooter
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="white"
        h="12"
        borderRadius="xl"
        p="4"
      >
        <MessageInput
          isSignedIn={!!isSignedIn}
          onSubmit={async (text: string) =>
            addMessage({
              channel,
              message: text,
              profile_url: "default_profile",
              username: user.data ? user.data.username : "unknown",
              ...(userId && { user_id: userId }),
            })
          }
        />
      </CardFooter>
    </Card>
  );
}
