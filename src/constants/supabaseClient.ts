import { createClient } from "@supabase/supabase-js";
import { env } from "~/env.mjs";

export const supabaseClient = ({
  supabaseAccessToken,
}: {
  supabaseAccessToken: string | null;
}) => {
  if (supabaseAccessToken) {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_KEY,
      {
        global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } },
        realtime: {
          params: {
            eventsPerSecond: 1,
          },
        },
      }
    );

    // set Supabase JWT on the client object,
    // so it is sent up with all Supabase requests
    return supabase;
  }
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      realtime: {
        params: {
          eventsPerSecond: 0.5,
        },
      },
    }
  );
  return supabase;
};
