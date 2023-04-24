import { z } from "zod";

import { rocksetClient } from "~/constants/rocksetClient";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Post, PublishedQuest, User } from "~/types/main";
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
          const rocksetResult =
            await rocksetClient.queryLambdas.executeQueryLambda(
              "commons",
              "LeaderByQuests",
              "700bdc74e55cfca4",
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
        } else {
          const rocksetResult =
            await rocksetClient.queryLambdas.executeQueryLambda(
              "commons",
              "LeaderByReward",
              "ca81647ad919acdd",
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
