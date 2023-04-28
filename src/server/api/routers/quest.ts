import {
  AddCommentZod,
  Comment,
  CommentDynamo,
  PublishedQuest,
  PublishedQuestDynamo,
  PublishedQuestsInputZod,
  PublishedQuestZod,
  Quest,
  QuestDynamo,
  TransactionQueue,
  TransactionQueueZod,
  Solver,
  SolverDynamo,
  SolverPartial,
  SolverPartialZod,
  User,
  UserDynamo,
  Content,
} from "../../../types/main";
import * as pako from "pako";

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
  QueryCommand,
  QueryCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

import { KeysAndAttributes, Update } from "@aws-sdk/client-dynamodb";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../trpc";
import { dynamoClient } from "~/constants/dynamoClient";
import { rocksetClient } from "~/constants/rocksetClient";
import { reviver } from "~/utils/mapReplacer";
import { CacheGet, CacheSet } from "@gomomento/sdk";
import { JSONContent } from "@tiptap/core";
import { AppRouter } from "../root";
import { momento } from "~/constants/momentoClient";
export type TQuery = keyof AppRouter["quest"]["publishedQuests"];
export type InferQueryOutput<TRouteKey extends TQuery> = inferProcedureOutput<
  AppRouter["quest"]["publishedQuests"][TRouteKey]
>;
export const questRouter = router({
  publishedQuest: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const { auth } = ctx;

      try {
        const getResponse = await momento.get(
          process.env.MOMENTO_CACHE_NAME || "",
          id
        );
        if (getResponse instanceof CacheGet.Hit) {
          console.log("cache hit!");

          // increasing view count on the quest logic. If user exists and haven't seen the quest by checking whether user has this quest id as a sort key in VIEWS_TABLE.
          const result = JSON.parse(
            getResponse.valueString()
          ) as PublishedQuest;

          return result;
        } else if (getResponse instanceof CacheGet.Miss) {
          const params: GetCommandInput = {
            TableName: process.env.MAIN_TABLE_NAME,
            Key: { PK: `QUEST#${id}`, SK: `QUEST#${id}` },
          };
          const contentParams: GetCommandInput = {
            TableName: process.env.WORKSPACE_TABLE_NAME,

            Key: { PK: `QUEST#${id}`, SK: `CONTENT#${id}` },
          };

          const [questItem, contentItem] = await Promise.all([
            dynamoClient.send(new GetCommand(params)),
            dynamoClient.send(new GetCommand(contentParams)),
          ]);
          if (questItem.Item && contentItem) {
            const content = contentItem.Item as Content;
            const quest = questItem.Item as PublishedQuest;

            if (!quest.published) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "UNAUTHORIZED TO VIEW THE QUEST",
              });
            }
            quest.content = content.content;
            const setResponse = await momento.set(
              process.env.MOMENTO_CACHE_NAME || "",
              id,
              JSON.stringify(quest || ""),
              { ttl: 1800 }
            );
            if (setResponse instanceof CacheSet.Success) {
              console.log("Key stored successfully!");
            } else {
              console.log(`Error setting key: ${setResponse.toString()}`);
            }
            return quest;
          }

          //increasing view count on the quest logic. If user exists and haven't seen the quest by checking whether user has this quest id as a sort key in VIEWS_TABLE.
        } else if (getResponse instanceof CacheGet.Error) {
          console.log(`Error: ${getResponse.message()}`);
        }

        return null;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "FAILED RETRIEVING QUEST, PLEASE TRY AGAIN",
        });
      }
    }),

  publishedQuests: publicProcedure
    .input(PublishedQuestsInputZod)
    .query(async ({ ctx, input }) => {
      const { auth } = ctx;
      const {
        topic,
        subtopic,
        filter = "latest",
        limit = 10,
        cursor = "9223372036854775807",
      } = input;
      if (!topic && !subtopic && filter === "latest") {
        //rockset
        try {
          const getResponse = await momento.get(
            process.env.MOMENTO_CACHE_NAME || "",
            "LATEST_PUBLISHED_QUESTS"
          );
          if (getResponse instanceof CacheGet.Hit) {
            console.log("cache hit!");
            return JSON.parse(getResponse.valueString()) as {
              publishedQuests: PublishedQuest[];
              next_cursor: string;
            };
          } else if (getResponse instanceof CacheGet.Miss) {
            const rocksetResult =
              await rocksetClient.queryLambdas.executeQueryLambda(
                "commons",
                "LatestPublishedQuests",
                "2b6dab1bfbcb158f",
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
                  ],
                }
              );
            let next_cursor: typeof cursor | undefined = undefined;

            const publishedQuests = rocksetResult.results as PublishedQuest[];

            if (publishedQuests && publishedQuests.length > limit) {
              const lastItem = publishedQuests.pop();
              if (lastItem) next_cursor = lastItem._event_time;
            }
            const setResponse = await momento.set(
              process.env.MOMENTO_CACHE_NAME || "",
              "LATEST_PUBLISHED_QUESTS",
              JSON.stringify(
                {
                  publishedQuests,
                  next_cursor,
                } || ""
              ),
              { ttl: 1800 }
            );
            if (setResponse instanceof CacheSet.Success) {
              console.log("Key stored successfully!");
            } else {
              console.log(`Error setting key: ${setResponse.toString()}`);
            }
            return {
              publishedQuests,
              next_cursor,
            };
          } else if (getResponse instanceof CacheGet.Error) {
            console.log(`Error: ${getResponse.message()}`);
          }
          return null;
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "FAILED RETRIEVING QUESTS, PLEASE TRY AGAIN",
          });
        }
      } else if (!topic && filter === "highest reward") {
      } else if (topic && filter === "latest") {
      } else if (topic && filter === "highest reward") {
      }
    }),

  workspaceQuest: protectedProcedure
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
            SK: `QUEST#${id}`,
          },
          {
            PK: `QUEST#${id}`,
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
          let quest: Quest | null = null;
          const QuestsAndContent = result.Responses[tableName] as {
            PK: string;
            SK: string;
          }[];
          for (const item of QuestsAndContent) {
            if (item.SK.startsWith("QUEST#")) {
              quest = item as QuestDynamo;
            } else {
              content = (item as Content & { PK: string; SK: string }).content;
            }
          }
          if (quest) {
            if (quest.creatorId !== auth.userId) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "UNAUTHORIZED TO VIEW THE QUEST",
              });
            }
            if (content) {
              quest.content = content;
            }
            return quest;
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

  //searchWorkspaceQuest
  //searchPublishedQuest
  createQuest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { auth } = ctx;
      const questItem: QuestDynamo = {
        PK: `USER#${auth.userId}`,
        SK: `QUEST#${id}`,
        id,
        creatorId: auth.userId,
        inTrash: false,
        published: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        type: "QUEST",
      };
      const putParams: PutCommandInput = {
        TableName: process.env.WORKSPACE_TABLE_NAME,
        Item: questItem,
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
  updateQuestAttributes: protectedProcedure
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
            SK: `QUEST#${key}`,
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
          message: "UNABLE TO UPDATE THE QUEST",
        });
      }
    }),
  updateQuestContent: protectedProcedure
    .input(
      z.object({
        questId: z.string(),
        content: z.instanceof(Uint8Array),
        textContent: z.instanceof(Uint8Array),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { questId, content, textContent } = input;
      const updateParams: UpdateCommandInput = {
        TableName: process.env.WORKSPACE_TABLE_NAME,
        Key: {
          PK: `QUEST#${questId}`,
          SK: `CONTENT#${questId}`,
        },

        UpdateExpression: "SET content = :content, #text = :text",
        ExpressionAttributeNames: { "#text": "text" },
        ExpressionAttributeValues: {
          ":content": content,
          ":text": textContent,
        },
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
          message: "UNABLE TO UPDATE THE QUEST",
        });
      }
    }),

  publishQuest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { auth } = ctx;

      const tableName = process.env.WORKSPACE_TABLE_NAME || "";
      const RequestItems: Record<
        string,
        Omit<KeysAndAttributes, "Keys"> & {
          Keys: Record<string, any>[] | undefined;
        }
      > = {};
      RequestItems[tableName] = {
        Keys: [
          { PK: `USER#${auth.userId}`, SK: `QUEST#${id}` },
          { PK: `QUEST#${id}`, SK: `CONTENT#${id}` },
        ],
      };
      const batchParams: BatchGetCommandInput = {
        RequestItems,
      };

      const getUserParams: GetCommandInput = {
        Key: { PK: `USER#${auth.userId}`, SK: `USER#${auth.userId}` },
        TableName: process.env.MAIN_TABLE_NAME,
        ProjectionExpression: "profile, username",
      };

      try {
        const [userItem, batchResult] = await Promise.all([
          dynamoClient.send(new GetCommand(getUserParams)),
          dynamoClient.send(new BatchGetCommand(batchParams)),
        ]);

        if (batchResult.Responses && userItem.Item) {
          const questAndContent = batchResult.Responses[tableName] as {
            PK: string;
            SK: string;
          }[];
          let quest: Quest | null = null;
          let content: Content | null = null;

          const creator = userItem.Item as User;

          for (const item of questAndContent) {
            if (item.SK.startsWith("QUEST#")) {
              quest = item as QuestDynamo;
            } else {
              content = item as Content & { PK: string; SK: string };
            }
          }

          if (quest && content) {
            const decompressedText = pako.inflate(content.text, {
              to: "string",
            });
            const publishedQuest: PublishedQuest = {
              id: quest.id,
              title: quest.title!,
              deadline: quest.deadline!,
              topic: quest.topic!,
              subtopic: quest.subtopic!,
              reward: quest.reward!,
              slots: quest.slots!,
              solverCount: 0,
              status: "OPEN",
              published: true,
              creatorId: quest.creatorId,
              ...(creator.profile && {
                creatorProfile: creator.profile,
              }),
              creatorUsername: creator.username,
              publishedAt: new Date().toISOString(),
              type: "QUEST",
              lastUpdated: quest.lastUpdated,
              text: decompressedText,
            };

            PublishedQuestZod.parse(publishedQuest);
            const params: TransactWriteCommandInput = {
              TransactItems: [
                {
                  Update: {
                    Key: { PK: `USER#${auth.userId}`, SK: `QUEST#${id}` },
                    TableName: process.env.WORKSPACE_TABLE_NAME,
                    ConditionExpression:
                      "#published =:published AND #creatorId =:creatorId",

                    UpdateExpression:
                      "SET #published = :value, #lastUpdated = :time, #publishedAt = :publishedAt, #allowUnpublish = :true",

                    ExpressionAttributeNames: {
                      "#published": "published",
                      "#publishedAt": "publishedAt",
                      "#lastUpdated": "lastUpdated",

                      "#creatorId": "creatorId",
                      "#allowUnpublish": "allowUnpublish",
                    },
                    ExpressionAttributeValues: {
                      ":published": false,
                      ":value": true,
                      ":time": new Date().toISOString(),
                      ":publishedAt": publishedQuest.publishedAt,
                      ":creatorId": auth.userId,
                      ":true": true,
                    },
                  },
                },
                {
                  Put: {
                    TableName: process.env.MAIN_TABLE_NAME,
                    Item: {
                      ...publishedQuest,
                      PK: `QUEST#${id}`,
                      SK: `QUEST#${id}`,
                    },
                  },
                },
              ],
            };
            const transactResult = await dynamoClient.send(
              new TransactWriteCommand(params)
            );

            try {
              await Promise.all([
                momento.delete("accounts-cache", "LATEST_PUBLISHED_QUESTS"),
                momento.delete("accounts-cache", id),
              ]);
            } catch (error) {
              console.log("error in cache", error);
            }

            if (transactResult) {
              return true;
            }
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error publishing quest, fill all the attributes",
        });
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error publishing quest, fill all the attributes",
        });
      }
    }),

  unpublishQuest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { auth } = ctx;
      const params: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              Key: { PK: `USER#${auth.userId}`, SK: `QUEST#${id}` },
              TableName: process.env.WORKSPACE_TABLE_NAME,
              ConditionExpression:
                "#creatorId =:creatorId AND #allowUnpublish = :true",

              UpdateExpression: "SET #published = :value, #lastUpdated = :time",

              ExpressionAttributeNames: {
                "#allowUnpublish": "allowUnpublish",
                "#published": "published",
                "#lastUpdated": "lastUpdated",
                "#creatorId": "creatorId",
              },
              ExpressionAttributeValues: {
                ":true": true,
                ":value": false,
                ":time": new Date().toISOString(),
                ":creatorId": auth.userId,
              },
            },
          },
          {
            Delete: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: {
                PK: `QUEST#${id}`,
                SK: `QUEST#${id}`,
              },
            },
          },
        ],
      };

      try {
        const transactResult = await dynamoClient.send(
          new TransactWriteCommand(params)
        );

        try {
          await Promise.all([
            momento.delete("accounts-cache", id),
            momento.delete("accounts-cache", "LATEST_PUBLISHED_QUESTS"),
          ]);
        } catch (error) {
          console.log("error in cache", error);
        }
        if (transactResult) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }),

  deleteQuest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { auth } = ctx;
      const updateParams: UpdateCommandInput = {
        Key: { PK: `USER#${auth.userId}`, SK: `QUEST#${id}` },
        TableName: process.env.WORKSPACE_TABLE_NAME,
        ConditionExpression:
          "#inTrash =:inTrash AND #creatorId =:creatorId AND #published =:false",
        UpdateExpression: "SET #inTrash = :value",
        ExpressionAttributeNames: {
          "#inTrash": "inTrash",
          "#creatorId": "creatorId",
          "#published": "published",
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
  deleteQuestPermanently: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { auth } = ctx;
      const { id } = input;

      const transactParams: TransactWriteCommandInput = {
        TransactItems: [
          {
            Delete: {
              Key: { PK: `USER#${auth.userId}`, SK: `QUEST#${id}` },
              TableName: process.env.WORKSPACE_TABLE_NAME,
              ConditionExpression:
                "#creatorId =:creatorId AND #published =:false",
              ExpressionAttributeNames: {
                "#creatorId": "creatorId",
                "#published": "published",
              },
              ExpressionAttributeValues: {
                ":false": false,
                ":creatorId": auth.userId,
              },
            },
          },
          {
            Delete: {
              Key: { PK: `QUEST#${id}`, SK: `CONTENT#${id}` },
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
  restoreQuest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { id } = input;

      const updateParams: UpdateCommandInput = {
        Key: { PK: `USER#${auth.userId}`, SK: `QUEST#${id}` },
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
        ReturnValues: "ALL_NEW",
      };

      try {
        const result = await dynamoClient.send(new UpdateCommand(updateParams));
        if (result.Attributes) {
          return result.Attributes as Quest;
        }
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not restore the quest",
        });
      }
    }),
  addSolver: protectedProcedure
    .input(z.object({ questId: z.string(), username: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { questId, username } = input;
      const transactParams: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              Key: { PK: `QUEST#${questId}`, SK: `QUEST#${questId}` },

              TableName: process.env.MAIN_TABLE_NAME,
              ConditionExpression: "#slots > :number AND #creatorId <> :id",
              UpdateExpression:
                "SET #slots = #slots - :dec, #solverCount = #solverCount + :inc",
              ExpressionAttributeNames: {
                "#slots": "slots",
                "#solverCount": "solverCount",
                "#creatorId": "creatorId",
              },
              ExpressionAttributeValues: {
                ":number": 0,
                ":dec": 1,
                ":inc": 1,
                ":id": auth.userId,
              },
            },
          },
          {
            Put: {
              TableName: process.env.MAIN_TABLE_NAME,

              ConditionExpression: "attribute_not_exists(#SK)",
              Item: {
                PK: `QUEST#${questId}`,
                SK: `SOLVER#${auth.userId}`,
                id: auth.userId,
                questId,
                username: username,
              },
              ExpressionAttributeNames: { "#SK": "SK" },
            },
          },
        ],
      };
      try {
        const result = await dynamoClient.send(
          new TransactWriteCommand(transactParams)
        );

        try {
          await Promise.all([
            momento.delete("accounts-cache", questId),
            momento.delete("accounts-cache", `SOLVERS#${questId}`),
            momento.delete("accounts-cache", "LATEST_PUBLISHED_QUESTS"),
          ]);
        } catch (error) {
          console.log("error in cache", error);
        }

        if (result) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "NOT ALLOWED TO JOIN",
        });
      }
    }),

  removeSolver: protectedProcedure
    .input(z.object({ questId: z.string(), solverId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { questId, solverId } = input;
      if (auth.userId !== solverId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "NOT ALLOWED TO REMOVE THE SOLVER",
        });
      }
      const transactParams: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              Key: { PK: `QUEST#${questId}`, SK: `QUEST#${questId}` },

              TableName: process.env.MAIN_TABLE_NAME,
              UpdateExpression:
                "SET #slots = #slots + :inc, #solverCount = #solverCount - :dec",
              ExpressionAttributeNames: {
                "#slots": "slots",
                "#solverCount": "solverCount",
              },
              ExpressionAttributeValues: {
                ":dec": 1,
                ":inc": 1,
              },
            },
          },
          {
            Delete: {
              TableName: process.env.MAIN_TABLE_NAME,

              ConditionExpression: "attribute_exists(#SK)",
              Key: {
                PK: `QUEST#${questId}`,
                SK: `SOLVER#${auth.userId}`,
              },

              ExpressionAttributeNames: { "#SK": "SK" },
            },
          },
        ],
      };
      try {
        const result = await dynamoClient.send(
          new TransactWriteCommand(transactParams)
        );

        try {
          await Promise.all([
            momento.delete("accounts-cache", questId),
            momento.delete("accounts-cache", "LATEST_PUBLISHED_QUESTS"),
            momento.delete("accounts-cache", `SOLVERS#${questId}`),
          ]);
        } catch (error) {
          console.log("error in cache", error);
        }

        if (result) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "SOMETHING HAPPENED",
        });
      }
    }),
  solvers: publicProcedure
    .input(z.object({ questId: z.string() }))
    .query(async ({ input }) => {
      const { questId } = input;
      const solvers: Solver[] = [];

      let solversPartial: SolverPartial[] | undefined = undefined;
      try {
        const getResponse = await momento.get(
          process.env.MOMENTO_CACHE_NAME || "",
          `SOLVERS#${questId}`
        );
        if (getResponse instanceof CacheGet.Hit) {
          console.log("cache hit!");

          // increasing view count on the quest logic. If user exists and haven't seen the quest by checking whether user has this quest id as a sort key in VIEWS_TABLE.
          const result = JSON.parse(getResponse.valueString()) as Solver[];

          return result;
        } else if (getResponse instanceof CacheGet.Miss) {
          const queryParams: QueryCommandInput = {
            TableName: process.env.MAIN_TABLE_NAME,
            KeyConditionExpression: "PK = :PK AND begins_with(SK, :SOLVER)",
            ExpressionAttributeValues: {
              ":PK": `QUEST#${questId}`,
              ":SOLVER": "SOLVER#",
            },
          };
          const queryResult = await dynamoClient.send(
            new QueryCommand(queryParams)
          );
          if (queryResult.Items) {
            solversPartial = queryResult.Items as SolverPartial[];
            if (solversPartial.length > 0) {
              const tableName = process.env.MAIN_TABLE_NAME || "";
              const Keys: Record<string, any>[] = [];
              for (const item of solversPartial) {
                Keys.push({ PK: `USER#${item.id}`, SK: `USER#${item.id}` });
              }

              const RequestItems: Record<
                string,
                Omit<KeysAndAttributes, "Keys"> & {
                  Keys: Record<string, any>[] | undefined;
                }
              > = {};
              RequestItems[tableName] = {
                Keys,
                ProjectionExpression:
                  "id, level, experience, profile, username",
              };
              const params: BatchGetCommandInput = {
                RequestItems,
              };
              const { Responses } = await dynamoClient.send(
                new BatchGetCommand(params)
              );

              if (Responses) {
                const users = Responses[tableName] as Solver[];
                if (!users) {
                  return solvers;
                }
                for (let i = 0; i < users.length; i++) {
                  if (users[i]) {
                    solvers.push({
                      id: users[i]!.id,
                      level: users[i]!.level,
                      experience: users[i]!.experience,
                      profile: users[i]!.profile,
                      username: users[i]!.username,
                      solutionId: solversPartial[i]!.solutionId,
                      status: solversPartial[i]!.status,
                    });
                  }
                }
                const setResponse = await momento.set(
                  process.env.MOMENTO_CACHE_NAME || "",
                  `SOLVERS#${questId}`,
                  JSON.stringify(solvers),
                  { ttl: 1800 }
                );
                if (setResponse instanceof CacheSet.Success) {
                  console.log("Key stored successfully!");
                } else {
                  console.log(`Error setting key: ${setResponse.toString()}`);
                }
              }
            }
          }
        } else if (getResponse instanceof CacheGet.Error) {
          console.log(`Error: ${getResponse.message()}`);
        }

        return solvers;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "could not rertrieve solvers",
        });
      }
    }),
  acceptSolution: protectedProcedure
    .input(
      z.object({
        winnerId: z.string(),
        questId: z.string(),
        solutionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { winnerId, questId, solutionId } = input;
      const { auth } = ctx;
      const getParams: GetCommandInput = {
        Key: { PK: `QUEST#${questId}`, SK: `QUEST#${questId}` },
        TableName: process.env.MAIN_TABLE,
        ProjectionExpression: "reward",
      };

      try {
        const quest = await dynamoClient.send(new GetCommand(getParams));
        if (quest.Item) {
          const reward = (quest.Item as PublishedQuest).reward;

          const transactParams: TransactWriteCommandInput = {
            TransactItems: [
              {
                Update: {
                  TableName: process.env.MAIN_TABLE_NAME,
                  Key: { PK: `QUEST#${questId}`, SK: `QUEST#${questId}` },
                  ConditionExpression:
                    "#creatorId = :creatorId AND attribute_not_exists(#winnerId)",
                  UpdateExpression:
                    "SET #winnerId = :winnerId, #status = :status",
                  ExpressionAttributeNames: {
                    "#creatorId": "creatorId",
                    "#winnerId": "winnerId",
                    "#status": "status",
                  },
                  ExpressionAttributeValues: {
                    ":creatorId": auth.userId,
                    ":winnerId": winnerId,
                    ":status": "CLOSED",
                  },
                },
              },
              {
                Update: {
                  TableName: process.env.MAIN_TABLE_NAME,
                  Key: { PK: `QUEST#${questId}`, SK: `SOLVER#${winnerId}` },

                  UpdateExpression: "SET #status = :status",
                  ExpressionAttributeNames: {
                    "#status": "status",
                  },
                  ExpressionAttributeValues: {
                    ":status": "ACCEPTED",
                  },
                },
              },
              {
                Update: {
                  TableName: process.env.MAIN_TABLE_NAME,
                  Key: {
                    PK: `SOLUTION#${solutionId}`,
                    SK: `SOLUTION#${solutionId}`,
                  },

                  UpdateExpression: "SET #status = :status",
                  ExpressionAttributeNames: {
                    "#status": "status",
                  },
                  ExpressionAttributeValues: {
                    ":status": "ACCEPTED",
                  },
                },
              },

              {
                Update: {
                  TableName: process.env.MAIN_TABLE_NAME,
                  Key: {
                    PK: `USER#${winnerId}`,
                    SK: `USER#${winnerId}`,
                  },

                  UpdateExpression:
                    "SET questsSolved = questsSolved + :inc, balance = balance + :reward, rewarded = rewarded + :reward",

                  ExpressionAttributeValues: {
                    ":reward": reward,
                    ":status": "ACCEPTED",
                    ":inc": 1,
                  },
                },
              },
            ],
          };

          const result = await dynamoClient.send(
            new TransactWriteCommand(transactParams)
          );

          try {
            await Promise.all([
              momento.delete("accounts-cache", questId),
              momento.delete("accounts-cache", "LEADER_BY_QUESTS"),
              momento.delete("accounts-cache", "LEADER_BY_REWARD"),
              momento.delete("accounts-cache", "LATEST_PUBLISHED_QUESTS"),
            ]);
          } catch (error) {
            console.log("error in cache", error);
          }

          if (result) {
            return true;
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not accept the solution",
        });
      } catch (error) {
        console.log(error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not accept the solution",
        });
      }
    }),
  rejectSolution: protectedProcedure
    .input(
      z.object({
        winnerId: z.string(),
        questId: z.string(),
        solutionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { winnerId, questId, solutionId } = input;
      const { auth } = ctx;
      const transactParams: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: { PK: `QUEST#${questId}`, SK: `SOLVER#${winnerId}` },

              UpdateExpression: "SET #status = :status",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: {
                ":status": "REJECTED",
              },
            },
          },
          {
            Update: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: { PK: `SOLUTION#${questId}`, SK: `SOLUTION#${solutionId}` },

              UpdateExpression: "SET #status = :status",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: {
                ":status": "REJECTED",
              },
            },
          },
        ],
      };

      try {
        const result = await dynamoClient.send(
          new TransactWriteCommand(transactParams)
        );
        try {
          await Promise.all([momento.delete("accounts-cache", questId)]);
        } catch (error) {
          console.log("error in cache", error);
        }

        if (result) {
          return true;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not reject the solution",
        });
      } catch (error) {
        console.log(error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not reject the solution",
        });
      }
    }),
  acknowledgeSolution: protectedProcedure
    .input(
      z.object({
        winnerId: z.string(),
        questId: z.string(),
        solutionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { winnerId, questId, solutionId } = input;
      const { auth } = ctx;
      const transactParams: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: { PK: `QUEST#${questId}`, SK: `SOLVER#${winnerId}` },

              UpdateExpression: "SET #status = :status",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: {
                ":status": "ACKNOWLEDGED",
              },
            },
          },
          {
            Update: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: {
                PK: `SOLUTION#${solutionId}`,
                SK: `SOLUTION#${solutionId}`,
              },

              UpdateExpression: "SET #status = :status",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: {
                ":status": "ACKNOWLEDGED",
              },
            },
          },
        ],
      };

      try {
        const result = await dynamoClient.send(
          new TransactWriteCommand(transactParams)
        );
        try {
          await Promise.all([momento.delete("accounts-cache", questId)]);
        } catch (error) {
          console.log("error in cache", error);
        }

        if (result) {
          return true;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not acknowledge the solution",
        });
      } catch (error) {
        console.log(error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not acknowledge the solution",
        });
      }
    }),
  addComment: protectedProcedure
    .input(AddCommentZod)
    .mutation(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { questId, text, commentId } = input;
      const commentItem: CommentDynamo = {
        PK: `QUEST#${questId}`,
        SK: `COMMENT#${commentId}`,
        id: commentId,
        createdAt: new Date().toISOString(),
        creatorId: auth.userId,
        questId,
        text,
        upvote: 0,
        type: "COMMENT",
      };
      const putParams: PutCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
        Item: commentItem,
      };
      try {
        const result = await dynamoClient.send(new PutCommand(putParams));
        momento
          .delete("accounts-cache", questId)
          .catch((err) => console.log("cache error", err));
        if (result) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }),
  comments: publicProcedure
    .input(z.object({ commentsId: z.array(z.string()) }))
    .query(async ({ input }) => {
      const { commentsId } = input;
      let comments: Comment[] = [];

      if (commentsId.length > 0) {
        const tableName = process.env.MAIN_TABLE_NAME || "";
        const Keys: Record<string, any>[] = [];
        for (const id of commentsId) {
          Keys.push({ PK: `QUEST#${id}`, SK: `COMMENT#${id}` });
        }
        const RequestItems: Record<
          string,
          Omit<KeysAndAttributes, "Keys"> & {
            Keys: Record<string, any>[] | undefined;
          }
        > = {};

        RequestItems[tableName] = {
          Keys,
        };
        const params: BatchGetCommandInput = {
          RequestItems,
        };
        const { Responses } = await dynamoClient.send(
          new BatchGetCommand(params)
        );

        if (Responses) {
          comments = Responses[tableName] as Comment[];
        }
      }
      return comments;
    }),
});
