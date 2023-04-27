import { z } from "zod";

import { rocksetClient } from "~/constants/rocksetClient";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Post, PublishedQuest, User } from "~/types/main";
import { momento } from "~/constants/momentoClient";
import { CacheGet, CacheSet } from "@gomomento/sdk";
const limit = 10;
export const generalRouter = router({
  leaderboard: publicProcedure
    .input(
      z.object({
        // cursor: z.number(),
        limit: z.number(),
        filter: z.enum(["reward", "quests"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        // cursor,
        limit,
        filter,
      } = input;
      try {
        const getResponse = await momento.get(
          process.env.MOMENTO_CACHE_NAME || "",
          "LEADERBOARD"
        );

        if (getResponse instanceof CacheGet.Hit) {
          console.log("cache hit!");
          return JSON.parse(getResponse.valueString()) as PublishedQuest[];
        } else if (getResponse instanceof CacheGet.Miss) {
          if (filter === "quests") {
            const rocksetResult =
              await rocksetClient.queryLambdas.executeQueryLambda(
                "commons",
                "LeaderByQuests",
                "6372e3ee42ca5ede",
                {
                  parameters: [
                    {
                      name: "limit",
                      type: "int",
                      value: limit.toString(),
                    },
                  ],
                }
              );
            const setResponse = await momento.set(
              process.env.MOMENTO_CACHE_NAME || "",
              "LEADERBOARD",
              JSON.stringify(rocksetResult.results || ""),
              { ttl: 1800 }
            );
            if (setResponse instanceof CacheSet.Success) {
              console.log("Key stored successfully!");
            } else {
              console.log(`Error setting key: ${setResponse.toString()}`);
            }
            return rocksetResult.results as User[];
          }
        } else {
          const rocksetResult =
            await rocksetClient.queryLambdas.executeQueryLambda(
              "commons",
              "LeaderByReward",
              "750c9d87b55109b6",
              {
                parameters: [
                  {
                    name: "limit",
                    type: "int",
                    value: limit.toString(),
                  },
                ],
              }
            );
          return rocksetResult.results as User[];
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not retrieve leaderboard",
        });
      }
    }),
});
