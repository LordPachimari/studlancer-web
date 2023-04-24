import { z } from "zod";

import { rocksetClient } from "~/constants/rocksetClient";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Post, PublishedQuest, User } from "~/types/main";
const limit = 10;
export const searchRouter = router({
  searchPublishedQuest: publicProcedure
    .input(z.object({ text: z.string(), cursor: z.optional(z.string()) }))
    .query(async ({ ctx, input }) => {
      const { text, cursor = "9223372036854775807" } = input;

      try {
        const rocksetResult =
          await rocksetClient.queryLambdas.executeQueryLambda(
            "commons",
            "PublishedQuestSearch",
            "44308512395e93cd",
            {
              parameters: [
                {
                  name: "limit",
                  type: "int",
                  value: (limit + 1).toString(),
                },
                {
                  name: "next_cursor",
                  type: "timestamp",
                  value: cursor,
                },
                {
                  name: "text",
                  type: "string",
                  value: text,
                },
              ],
            }
          );
        let next_cursor: typeof cursor | undefined = undefined;

        const publishedQuests = rocksetResult.results as PublishedQuest[];
        if (publishedQuests && publishedQuests.length > limit) {
          const lastItem = publishedQuests.pop();
          if (lastItem) next_cursor = lastItem._event_time;
        }
        return {
          publishedQuests,
          next_cursor,
        };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "FAILED RETRIEVING QUEST, PLEASE TRY AGAIN",
        });
      }
    }),
  globalSearch: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ ctx, input }) => {
      const { text } = input;
      try {
        const result = await rocksetClient.queryLambdas.executeQueryLambda(
          "commons",
          "GlobalSearch",
          "81c1ca72f516aa1c",
          {
            parameters: [
              {
                name: "text",
                type: "string",
                value: text,
              },
            ],
          }
        );
        if (result.results) {
          return result.results as (User | PublishedQuest | Post)[];
        }
        return null;
      } catch (error) {
        throw new TRPCError({
          message: "Error retrieving data",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
});
