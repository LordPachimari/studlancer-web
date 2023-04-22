import { z } from "zod";

import { rocksetClient } from "~/constants/rocksetClient";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Post, PublishedQuest, User } from "~/types/main";

export const searchRouter = router({
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
