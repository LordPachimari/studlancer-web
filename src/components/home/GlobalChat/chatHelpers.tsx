import { useAuth, useSession } from "@clerk/nextjs";
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { supabaseClient } from "~/constants/supabaseClient";
import { Message, TopicsType } from "~/types/main";

export const useStore = ({ channel }: { channel: TopicsType | "GENERAL" }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  // const [newMessage, setNewMessage] = useState<Message | null>(null);
  // const [deletedMessage, setDeletedMessage] = useState<Message | null>(null);

  const { getToken } = useAuth();
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
              table: "studlancer_global_chat",
            },
            // (payload) => setNewMessage(payload.new as Message)
            (payload) => {
              const newMessage = payload.new as Message;
              setMessages([...messages, newMessage]);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "studlancer_global_chat",
            },
            // (payload) => setDeletedMessage(payload.old as Message)
            (payload) => {
              const deletedMessage = payload.old as Message;
              if (channel === deletedMessage.channel) {
                const newMessages = messages.filter(
                  (message) => message.id !== deletedMessage.id
                );
                setMessages(newMessages);
              }
            }
          )

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
};
