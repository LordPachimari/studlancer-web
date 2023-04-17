import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import {
  Quest,
  QuestDynamo,
  Solution,
  SolutionDynamo,
  UserDynamo,
} from "../../../types/main";

import { dynamoClient } from "../../../constants/dynamoClient";
import { protectedProcedure, router } from "../trpc";

export const workspaceRouter = router({
  workspaceList: protectedProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;
    const queryParams: QueryCommandInput = {
      TableName: process.env.MAIN_TABLE_NAME,

      KeyConditionExpression: "#PK = :PK",
      ExpressionAttributeNames: { "#PK": "PK" },
      ExpressionAttributeValues: { ":PK": `USER#${auth.userId}` },
    };
    const quests: Quest[] = [];
    const solutions: Quest[] = [];
    //

    try {
      const result = await dynamoClient.send(new QueryCommand(queryParams));
      if (result.Items) {
        const items = result.Items as (
          | UserDynamo
          | QuestDynamo
          | SolutionDynamo
        )[];
        for (const item of items) {
          if (item.SK.startsWith("QUEST")) {
            quests.push(item as Quest);
          } else if (item.SK.startsWith("SOLUTION")) {
            solutions.push(item as Solution);
          }
        }
      }
      return { quests, solutions };
    } catch (error) {
      console.log(error);
      return { quests: [], solutions: [] };
    }
  }),
});
