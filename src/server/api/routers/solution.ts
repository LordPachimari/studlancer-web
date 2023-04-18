import {
  Content,
  PublishedSolution,
  PublishedSolutionZod,
  Solution,
  SolutionDynamo,
  TransactionQueue,
  TransactionQueueZod,
} from "../../../types/main";

import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";
import {
  BatchGetCommand,
  BatchGetCommandInput,
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

import {
  BatchGetItemCommand,
  KeysAndAttributes,
  Update,
} from "@aws-sdk/client-dynamodb";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { dynamoClient } from "../../../constants/dynamoClient";
import { protectedProcedure, router } from "../trpc";
import { reviver } from "~/utils/mapReplacer";
import { momento } from "~/constants/momentoClient";

export const solutionRouter = router({
  publishedSolution: protectedProcedure
    .input(z.object({ id: z.string(), questId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { id, questId } = input;
      const { auth } = ctx;

      const params: GetCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,

        Key: { PK: `QUEST#${questId}`, SK: `SOLUTION#${id}` },
      };

      try {
        const result = await dynamoClient.send(new GetCommand(params));
        if (result.Item) {
          const solution = result.Item as PublishedSolution;
          if (
            solution.creatorId === auth.userId ||
            solution.questCreatorId === auth.userId ||
            (solution.contributors && solution.contributors.has(auth.userId)) ||
            //allow winner solutions to be publicly viewed
            solution.status === "ACCEPTED"
          ) {
            if (auth.userId === solution.creatorId) {
              //send notification to the solver that his solution has been viewed by the quest creator
              const transactParams: TransactWriteCommandInput = {
                TransactItems: [
                  {
                    Put: {
                      TableName: process.env.VIEWCOUNT_TABLE_NAME,
                      ConditionExpression: "attribute_not_exists(#SK)",
                      Item: { PK: `USER#${auth.userId}`, SK: `SOLUTION#${id}` },
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
      const { auth } = ctx;
      const { id } = input;
      const tableName = process.env.WORKSPACE_TABLE_NAME || "";
      const RequestItems: Record<
        string,
        Omit<KeysAndAttributes, "Keys"> & {
          Keys: Record<string, any>[] | undefined;
        }
      > = {};
      RequestItems[tableName] = {
        Keys: [
          {
            PK: `USER#${auth.userId}`,
            SK: `SOLUTION#${id}`,
          },
          {
            PK: `USER#${auth.userId}`,
            SK: `CONTENT#${id}`,
          },
        ],
      };
      const getBatchParams: BatchGetCommandInput = {
        RequestItems,
      };

      try {
        const result = await dynamoClient.send(
          new BatchGetCommand(getBatchParams)
        );
        if (result.Responses) {
          let content: Uint8Array | null = null;
          let solution: Solution | null = null;
          const SolutionAndContent = result.Responses[tableName] as {
            PK: string;
            SK: string;
          }[];
          for (const item of SolutionAndContent) {
            if (item.SK.startsWith("SOLUTION#")) {
              solution = item as SolutionDynamo;
            } else {
              content = (item as Content & { PK: string; SK: string }).content;
            }
          }
          if (solution) {
            if (solution.creatorId !== auth.userId) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "UNAUTHORIZED TO VIEW THE QUEST",
              });
            }
            if (content) {
              solution.content = content;
            }
            return solution;
          }
          return null;
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
      const { auth } = ctx;
      const solutionItem: SolutionDynamo = {
        PK: `USER#${auth.userId}`,
        SK: `SOLUTION#${id}`,
        id,
        creatorId: auth.userId,
        inTrash: false,
        published: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        type: "SOLUTION",

        ...(questId && { questId }),
        ...(questCreatorId && { questCreatorId }),
      };
      const putParams: PutCommandInput = {
        TableName: process.env.WORKSPACE_TABLE_NAME,
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
      const { auth } = ctx;
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
      let updateParams: UpdateCommandInput | null = null;
      for (const [key, value] of transactionMap.entries()) {
        const attributes = value.transactions.map((t) => {
          return `${t.attribute} = :${t.attribute}`;
        });
        const UpdateExpression = `set ${attributes.join(", ")}`;
        const ExpressionAttributeValues: Record<
          string,
          string | number | string[] | Uint8Array
        > = {};
        value.transactions.forEach((t) => {
          ExpressionAttributeValues[`:${t.attribute}`] = t.value;
        });
        updateParams = {
          TableName: process.env.WORKSPACE_TABLE_NAME,
          Key: {
            PK: `USER#${auth.userId}`,
            SK: `SOLUTION#${key}`,
          },

          ConditionExpression: "#published = :published",

          ExpressionAttributeNames: { "#published": "published" },
          UpdateExpression,
          ExpressionAttributeValues: {
            ":published": false,
            ...ExpressionAttributeValues,
          },
        };
      }

      try {
        if (updateParams) {
          const result = await dynamoClient.send(
            new UpdateCommand(updateParams)
          );
          if (result) {
            return true;
          }
          return false;
        }
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "UNABLE TO UPDATE THE SOLUTION",
        });
      }
    }),
  updateSolutionContent: protectedProcedure
    .input(
      z.object({ solutionId: z.string(), content: z.instanceof(Uint8Array) })
    )
    .mutation(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { solutionId, content } = input;
      const updateParams: UpdateCommandInput = {
        TableName: process.env.WORKSPACE_TABLE_NAME,
        Key: {
          PK: `USER#${auth.userId}`,
          SK: `CONTENT#${solutionId}`,
        },

        UpdateExpression: "SET content = :content",

        ExpressionAttributeValues: { ":content": content },
      };

      try {
        if (updateParams) {
          const result = await dynamoClient.send(
            new UpdateCommand(updateParams)
          );
          if (result) {
            return true;
          }
          return false;
        }
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "UNABLE TO UPDATE THE SOLUTION",
        });
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
      const { auth } = ctx;

      const getParams: GetCommandInput = {
        TableName: process.env.WORKSPACE_TABLE_NAME,
        Key: { PK: `USER#${auth.userId}`, SK: `SOLUTION#${id}` },
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
                  Key: { PK: `USER#${auth.userId}`, SK: `SOLUTION#${id}` },
                  TableName: process.env.WORKSPACE_TABLE_NAME,
                  ConditionExpression:
                    "#published =:published AND #creatorId =:creatorId",

                  UpdateExpression:
                    "SET #published = :value, #lastUpdated = :lastUpdated, #publishedAt = :publishedAt",

                  ExpressionAttributeNames: {
                    "#published": "published",
                    "#publishedAt": "publishedAt",
                    "#creatorId": "creatorId",
                    "#lastUpdated": "lastUpdated",
                  },
                  ExpressionAttributeValues: {
                    ":published": false,
                    ":value": true,
                    ":lastUpdated": new Date().toISOString(),
                    ":publishedAt": publishedSolution.publishedAt,
                    ":creatorId": auth.userId,
                  },
                },
              },
              {
                Update: {
                  TableName: process.env.MAIN_TABLE_NAME,
                  Key: { PK: `QUEST#${questId}`, SK: `SOLVER#${auth.userId}` },
                  ConditionExpression: "attribute_exists(SK)",
                  UpdateExpression:
                    "SET #solutionId = :solutionId, #status =:posted",
                  ExpressionAttributeNames: {
                    "#solutionId": "solutionId",
                    "#status": "status",
                  },
                  ExpressionAttributeValues: {
                    ":solutionId": id,
                    ":posted": "POSTED",
                  },
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
                  ExpressionAttributeNames: { "#PK": "PK" },
                },
              },
            ],
          };
          const transactResult = await dynamoClient.send(
            new TransactWriteCommand(params)
          );
          momento
            .delete("accounts-cache", questId)
            .catch((err) => console.log(err));

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
          message:
            "Could not publish the solution, check whether the quest exist",
        });
      }
    }),

  unpublishSolution: protectedProcedure
    .input(z.object({ id: z.string(), questId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, questId } = input;
      const { auth } = ctx;

      const params: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              Key: { PK: `USER#${auth.userId}`, SK: `SOLUTION#${id}` },
              TableName: process.env.WORKSPACE_TABLE_NAME,
              ConditionExpression: "#creatorId =:creatorId",

              UpdateExpression:
                "SET #published = :value, #lastUpdated =  :lastUpdated",

              ExpressionAttributeNames: {
                "#published": "published",
                "#lastUpdated": "lastUpdated",
                "#creatorId": "creatorId",
              },
              ExpressionAttributeValues: {
                ":value": false,
                ":creatorId": auth.userId,

                ":lastUpdated": new Date().toISOString(),
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
                SK: `SOLVER#${auth.userId}`,
              },
              UpdateExpression: "REMOVE #solutionId, #status ",
              ExpressionAttributeNames: {
                "#solutionId": "solutionId",
                "#status": "status",
              },
            },
          },
        ],
      };

      try {
        const transactResult = await dynamoClient.send(
          new TransactWriteCommand(params)
        );
        momento
          .delete("accounts-cache", questId)
          .catch((err) => console.log(err));
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
      const { auth } = ctx;
      const updateParams: UpdateCommandInput = {
        Key: { PK: `USER#${auth.userId}`, SK: `SOLUTION#${id}` },
        TableName: process.env.WORKSPACE_TABLE_NAME,
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
          ":creatorId": auth.userId,
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
      const { auth } = ctx;
      const { id } = input;
      const deleteParams: DeleteCommandInput = {
        Key: { PK: `USER#${auth.userId}`, SK: `SOLUTION#${id}` },
        TableName: process.env.WORKSPACE_TABLE_NAME,
        ConditionExpression: "#creatorId =:creatorId AND #published =:false",
        ExpressionAttributeNames: {
          "#creatorId": "creatorId",
          "#published": "published",
        },
        ExpressionAttributeValues: {
          ":creatorId": auth.userId,
          ":false": false,
        },
      };
      const transactParams: TransactWriteCommandInput = {
        TransactItems: [
          {
            Delete: {
              Key: { PK: `USER#${auth.userId}`, SK: `SOLUTION#${id}` },
              TableName: process.env.WORKSPACE_TABLE_NAME,
              ConditionExpression:
                "#creatorId =:creatorId AND #published =:false",
              ExpressionAttributeNames: {
                "#creatorId": "creatorId",
                "#published": "published",
              },
              ExpressionAttributeValues: {
                ":creatorId": auth.userId,
                ":false": false,
              },
            },
          },
          {
            Delete: {
              Key: { PK: `USER#${auth.userId}`, SK: `CONTENT#${id}` },
              TableName: process.env.WORKSPACE_TABLE_NAME,
            },
          },
        ],
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
      }
    }),
  restoreSolution: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { id } = input;
      const updateParams: UpdateCommandInput = {
        Key: { PK: `USER#${auth.userId}`, SK: `SOLUTION#${id}` },
        TableName: process.env.WORKSPACE_TABLE_NAME,
        ConditionExpression: "#inTrash =:inTrash AND #creatorId =:creatorId",
        UpdateExpression: "SET #inTrash = :value",
        ExpressionAttributeNames: {
          "#inTrash": "inTrash",
          "#creatorId": "creatorId",
        },
        ExpressionAttributeValues: {
          ":value": false,
          ":inTrash": true,
          ":creatorId": auth.userId,
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
