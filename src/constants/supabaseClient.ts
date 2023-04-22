import { createClient } from "@supabase/supabase-js";

export const supabaseClient = ({
  supabaseAccessToken,
}: {
  supabaseAccessToken: string | null;
}) => {
  if (supabaseAccessToken) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_KEY || "",
      {
        global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } },
        realtime: {
          params: {
            eventsPerSecond: 5,
          },
        },
      }
    );

    // set Supabase JWT on the client object,
    // so it is sent up with all Supabase requests
    return supabase;
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_KEY || "",
    {
      realtime: {
        params: {
          eventsPerSecond: 1,
        },
      },
    }
  );
  return supabase;
};
