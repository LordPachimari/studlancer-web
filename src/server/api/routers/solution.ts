import {
  PublishedSolution,
  PublishedSolutionZod,
  Solution,
  SolutionDynamo,
  TransactionQueue,
  TransactionQueueZod,
} from "../../../types/main";

import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";
import {
  DeleteCommand,
  DeleteCommandInput,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { Update } from "@aws-sdk/client-dynamodb";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { dynamoClient } from "../../../constants/dynamoClient";
import { protectedProcedure, router } from "../trpc";
import { reviver } from "~/utils/mapReplacer";

export const solutionRouter = router({
  publishedSolution: protectedProcedure
    .input(z.object({ id: z.string(), questId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { id, questId } = input;
      const { user } = ctx;

      const params: GetCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,

        Key: { PK: `QUEST#${questId}`, SK: `SOLUTION#${id}` },
      };

      try {
        const result = await dynamoClient.send(new GetCommand(params));
        if (result.Item) {
          const solution = result.Item as PublishedSolution;
          if (
            solution.creatorId === user.id ||
            solution.questCreatorId === user.id ||
            (solution.contributors && solution.contributors.has(user.id)) ||
            //allow winner solutions to be publicly viewed
            solution.status === "SOLVED"
          ) {
            if (user.id === solution.creatorId) {
              //send notification to the solver that his solution has been viewed by the quest creator
              const transactParams: TransactWriteCommandInput = {
                TransactItems: [
                  {
                    Put: {
                      TableName: process.env.VIEWCOUNT_TABLE_NAME,
                      ConditionExpression: "attribute_not_exists(#SK)",
                      Item: { PK: `USER#${user.id}`, SK: `SOLUTION#${id}` },
                      ExpressionAttributeNames: { "#SK": "SK" },
                    },
                  },
                  //not allow unpublish the quest after the quest creator has viewed the solution
                  {
                    Update: {
                      TableName: process.env.MAIN_TABLE_NAME,
                      Key: { PK: `QUEST#${questId}`, SK: `QUEST#${questId}` },
                      UpdateExpression: "SET #allowUnpublish =:false",
                      ExpressionAttributeNames: {
                        "#allowUnpublish": "allowUnpublish",
                      },
                      ExpressionAttributeValues: { ":false": false },
                    },
                  },
                ],
              };
              await dynamoClient.send(new TransactWriteCommand(transactParams));
            }
            return solution;
          } else {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "UNAUTHORIZED TO VIEW THE SOLUTION",
            });
          }
        }

        return null;
      } catch (error) {
        console.log(error);
        return null;
      }
    }),
  // publishedSolutions: protectedProcedure
  //   .input(z.object({ questId: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     const { user } = ctx;
  //     const { questId } = input;
  //   }),

  workspaceSolution: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { id } = input;
      const params: GetCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,

        Key: { PK: `USER#${user.id}`, SK: `SOLUTION#${id}` },
      };

      try {
        const result = await dynamoClient.send(new GetCommand(params));
        if (result.Item) {
          const solution = result.Item as Solution;
          if (solution.creatorId !== user.id) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "UNAUTHORIZED TO VIEW THE SOLUTION",
            });
          }
          return result.Item as Solution;
        } else {
          return null;
        }
      } catch (error) {
        console.log(error);
        return null;
      }
    }),

  //searchWorkspaceSolution
  //searchPublishedSolution
  createSolution: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        questId: z.optional(z.string()),
        questCreatorId: z.optional(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, questId, questCreatorId } = input;
      const { user } = ctx;
      const solutionItem: SolutionDynamo = {
        PK: `USER#${user.id}`,
        SK: `SOLUTION#${id}`,
        id,
        creatorId: user.id,
        inTrash: false,
        published: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        type: "SOLUTION",

        ...(questId && { questId }),
        ...(questCreatorId && { questCreatorId }),
      };
      const putParams: PutCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
        Item: solutionItem,
      };
      try {
        const result = await dynamoClient.send(new PutCommand(putParams));
        if (result) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }),

  updateSolutionAttributes: protectedProcedure
    .input(z.object({ transactionsString: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { transactionsString } = input;

      const transactionMap = JSON.parse(
        transactionsString,
        reviver
      ) as TransactionQueue;
      // const QuestTransactionStore = new Map(
      //   transactionMap,
      // ) as QuestTransactionStore;
      // QuestTransactionStoreZod.parse(QuestTransactionStore);
      TransactionQueueZod.parse(transactionMap);
      const updateParamsArray: {
        Update?: Omit<Update, "Key" | "ExpressionAttributeValues"> & {
          Key: Record<string, NativeAttributeValue> | undefined;
          ExpressionAttributeValues?: Record<string, NativeAttributeValue>;
        };
      }[] = [];
      for (const [key, value] of transactionMap.entries()) {
        const attributes = value.transactions.map((t) => {
          return `${t.attribute} = :${t.attribute}`;
        });
        const UpdateExpression = `set ${attributes.join(", ")}`;
        const ExpressionAttributeValues: Record<
          string,
          string | number | string[]
        > = {};
        value.transactions.forEach((t) => {
          ExpressionAttributeValues[`:${t.attribute}`] = t.value;
        });
        updateParamsArray.push({
          Update: {
            TableName: process.env.MAIN_TABLE_NAME,
            Key: {
              PK: `USER#${user.id}`,
              SK: `SOLUTION#${key}`,
            },

            ConditionExpression: "#published = :published",

            ExpressionAttributeNames: { "#published": "published" },
            UpdateExpression,
            ExpressionAttributeValues: {
              ":published": false,
              ...ExpressionAttributeValues,
            },
          },
        });
      }
      const transactParams: TransactWriteCommandInput = {
        TransactItems: updateParamsArray,

        ClientRequestToken: user.id,
      };

      try {
        const result = await dynamoClient.send(
          new TransactWriteCommand(transactParams)
        );
        if (result) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        return false;
        // throw new TRPCError({
        //   code: "BAD_REQUEST",
        //   message: "UNABLE TO UPDATE THE QUEST",
        // });
      }
    }),
  publishSolution: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        questId: z.string(),
        questCreatorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, questId, questCreatorId } = input;
      const { user } = ctx;

      const getParams: GetCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
        Key: { PK: `USER#${user.id}`, SK: `SOLUTION#${id}` },
      };

      try {
        const result = await dynamoClient.send(new GetCommand(getParams));

        if (result.Item) {
          const currentSolution = result.Item as Solution;

          const publishedSolution: PublishedSolution = {
            id: currentSolution.id,
            title: currentSolution.title!,
            content: currentSolution.content!,
            published: true,
            creatorId: currentSolution.creatorId,
            publishedAt: new Date().toISOString(),
            contributors: currentSolution.contributors,
            questCreatorId,
            questId,
            views: 0,
            type: "SOLUTION",
            lastUpdated: currentSolution.lastUpdated,
          };
          PublishedSolutionZod.parse(publishedSolution);
          const params: TransactWriteCommandInput = {
            TransactItems: [
              {
                Update: {
                  Key: { PK: `USER#${user.id}`, SK: `SOLUTION#${id}` },
                  TableName: process.env.MAIN_TABLE_NAME,
                  ConditionExpression:
                    "#published =:published AND #creatorId =:creatorId",

                  UpdateExpression:
                    "SET #published = :value, #lastUpdated = :time, #publishedAt = :publishedAt",

                  ExpressionAttributeNames: {
                    "#published": "published",
                    "#publishedAt": "publishedAt",
                    "#creatorId": "creatorId",
                  },
                  ExpressionAttributeValues: {
                    ":published": false,
                    ":value": true,
                    ":lastUpdated": new Date().toISOString(),
                    ":publishedAt": publishedSolution.publishedAt,
                    ":creatorId": user.id,
                  },
                },
              },
              {
                Update: {
                  TableName: process.env.MAIN_TABLE_NAME,
                  Key: { PK: `QUEST#${questId}`, SK: `SOLVER#${user.id}` },
                  UpdateExpression: "SET #solutionId = :solutionId",
                  ExpressionAttributeNames: { "#solutionId": "solutionId" },
                  ExpressionAttributeValues: { ":solutionId": id },
                },
              },

              {
                Put: {
                  TableName: process.env.MAIN_TABLE_NAME,
                  Item: {
                    ...publishedSolution,
                    PK: `QUEST#${questId}`,
                    SK: `SOLUTION#${id}`,
                  },
                  ConditionExpression: "attribute_exists(PK)",
                },
              },
            ],
          };
          const transactResult = await dynamoClient.send(
            new TransactWriteCommand(params)
          );
          if (transactResult) {
            return true;
          }
          return false;
        } else {
          return false;
        }
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not publish the solution",
        });
      }
    }),

  unpublishSolution: protectedProcedure
    .input(z.object({ id: z.string(), questId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, questId } = input;
      const { user } = ctx;

      const params: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              Key: { PK: `USER#${user.id}`, SK: `SOLUTION#${id}` },
              TableName: process.env.MAIN_TABLE_NAME,
              ConditionExpression: "#creatorId =:creatorId",

              UpdateExpression:
                "SET #published = :value, #lastUpdated =  :time",

              ExpressionAttributeNames: {
                "#published": "published",
                "#lastUpdated": new Date().toISOString(),
                "#creatorId": "creatorId",
              },
              ExpressionAttributeValues: {
                ":value": false,
                ":inc": 0.01,
                ":creatorId": user.id,
              },
            },
          },
          {
            Delete: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: {
                PK: `QUEST#${questId}`,
                SK: `SOLUTION#${id}`,
              },
            },
          },
          {
            Update: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: {
                PK: `QUEST#${questId}`,
                SK: `SOLVER#${user.id}`,
              },
              UpdateExpression: "REMOVE #solutionId ",
              ExpressionAttributeNames: { "#solutionId": "solutionId" },
            },
          },
        ],
      };

      try {
        const transactResult = await dynamoClient.send(
          new TransactWriteCommand(params)
        );
        if (transactResult) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }),

  deleteSolution: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { user } = ctx;
      const updateParams: UpdateCommandInput = {
        Key: { PK: `USER#${user.id}`, SK: `SOLUTION#${id}` },
        TableName: process.env.MAIN_TABLE_NAME,
        ConditionExpression:
          "#inTrash =:inTrash AND #creatorId =:creatorId AND #published = :false",
        UpdateExpression: "SET #inTrash = :value",
        ExpressionAttributeNames: {
          "#published": "published",
          "#inTrash": "inTrash",
          "#creatorId": "creatorId",
        },
        ExpressionAttributeValues: {
          ":false": false,
          ":value": true,
          ":inTrash": false,
          ":creatorId": user.id,
        },
      };

      try {
        const result = await dynamoClient.send(new UpdateCommand(updateParams));
        if (result) {
          return true;
        }

        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }),
  deleteSolutionPermanently: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { id } = input;
      const deleteParams: DeleteCommandInput = {
        Key: { PK: `USER#${user.id}`, SK: `SOLUTION#${id}` },
        TableName: process.env.MAIN_TABLE_NAME,
        ConditionExpression: "#creatorId =:creatorId AND #published =:false",
        ExpressionAttributeNames: {
          "#creatorId": "creatorId",
          "#published": "published",
        },
        ExpressionAttributeValues: {
          ":creatorId": user.id,
          ":false": false,
        },
      };
      try {
        const result = await dynamoClient.send(new DeleteCommand(deleteParams));
        if (result) {
          return true;
        }

        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }),
  restoreSolution: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { id } = input;
      const updateParams: UpdateCommandInput = {
        Key: { PK: `USER#${user.id}`, SK: `SOLUTION#${id}` },
        TableName: process.env.MAIN_TABLE_NAME,
        ConditionExpression: "#inTrash =:inTrash AND #creatorId =:creatorId",
        UpdateExpression: "SET #inTrash = :value",
        ExpressionAttributeNames: {
          "#inTrash": "inTrash",
          "#creatorId": "creatorId",
        },
        ExpressionAttributeValues: {
          ":value": false,
          ":inTrash": true,
          ":creatorId": user.id,
        },
      };

      try {
        const result = await dynamoClient.send(new UpdateCommand(updateParams));
        if (result) {
          return true;
        }

        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }),
});
