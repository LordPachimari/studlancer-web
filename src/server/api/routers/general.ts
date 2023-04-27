import { z } from "zod";

import { rocksetClient } from "~/constants/rocksetClient";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Post, PublishedQuest, User, UserComponent } from "~/types/main";
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
        if (filter === "quests") {
          const getResponse = await momento.get(
            process.env.MOMENTO_CACHE_NAME || "",
            "LEADER_BY_QUESTS"
          );

          if (getResponse instanceof CacheGet.Hit) {
            console.log("cache hit!");
            return JSON.parse(getResponse.valueString()) as User[];
          } else if (getResponse instanceof CacheGet.Miss) {
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
              "LEADER_BY_QUESTS",
              JSON.stringify(rocksetResult.results || ""),
              { ttl: 1800 }
            );
            if (setResponse instanceof CacheSet.Success) {
              console.log("Key stored successfully!");
            } else {
              console.log(`Error setting key: ${setResponse.toString()}`);
            }
            return rocksetResult.results as (UserComponent & {
              rewarded: number;
              questsSolved: number;
            })[];
          } else if (getResponse instanceof CacheGet.Error) {
            console.log(`Error: ${getResponse.message()}`);
          }
          return null;
        } else {
          const getResponse = await momento.get(
            process.env.MOMENTO_CACHE_NAME || "",
            "LEADER_BY_REWARD"
          );

          if (getResponse instanceof CacheGet.Hit) {
            console.log("cache hit!");
            return JSON.parse(getResponse.valueString()) as User[];
          } else if (getResponse instanceof CacheGet.Miss) {
            const rocksetResult =
              await rocksetClient.queryLambdas.executeQueryLambda(
                "commons",
                "LeaderByReward",
                "7c3bb521e27d7f5f",
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
              "LEADER_BY_REWARD",
              JSON.stringify(rocksetResult.results || ""),
              { ttl: 1800 }
            );
            if (setResponse instanceof CacheSet.Success) {
              console.log("Key stored successfully!");
            } else {
              console.log(`Error setting key: ${setResponse.toString()}`);
            }
            return rocksetResult.results as (UserComponent & {
              rewarded: number;
              questsSolved: number;
            })[];
          } else if (getResponse instanceof CacheGet.Error) {
            console.log(`Error: ${getResponse.message()}`);
          }
        }
        return null;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not retrieve leaderboard",
        });
      }
    }),
});
