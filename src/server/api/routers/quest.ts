import {
  AddCommentZod,
  Comment,
  CommentDynamo,
  DeclareWinnerZod,
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
  QueryCommand,
  QueryCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
// Import with es6

// Import with require syntax
// const rockset = require("@rockset/client").default;

import { KeysAndAttributes, Update } from "@aws-sdk/client-dynamodb";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../trpc";
import { dynamoClient } from "~/constants/dynamoClient";
import { rocksetClient } from "~/constants/rocksetClient";
import { reviver } from "~/utils/mapReplacer";
import { momento } from "~/constants/momentoClient";
import { CacheGet, CacheSet } from "@gomomento/sdk";

export const questRouter = router({
  publishedQuest: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const { user } = ctx;

      const params: QueryCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
        KeyConditionExpression: "#PK = :value",
        ExpressionAttributeNames: { "#PK": "PK" },
        ExpressionAttributeValues: { ":value": `QUEST#${id}` },
      };

      let quest: PublishedQuest | null = null;

      const solvers: SolverPartial[] = [];
      const commentsId: string[] = [];

      try {
        const result = await dynamoClient.send(new QueryCommand(params));
        if (result.Items) {
          const questOrSolver = result.Items as (
            | PublishedQuestDynamo
            | SolverDynamo
          )[];

          for (const item of questOrSolver) {
            if (item.SK.startsWith("QUEST#")) {
              quest = item as PublishedQuest;
            } else if (item.SK.startsWith("SOLVER")) {
              const solver = item as Solver;
              solvers.push({
                id: solver.id,
                solutionId: solver.solutionId,
                status: solver.status,
              });
            } else if (item.SK.startsWith("COMMENT")) {
              commentsId.push(item.id);
            }
          }
          if (!quest) {
            return { quest: null, solvers: [], commentsId: [] };
          }
          if (!quest.published) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "UNAUTHORIZED TO VIEW THE QUEST",
            });
          }
        }
        //increasing view count on the quest logic. If user exists and haven't seen the quest by checking whether user has this quest id as a sort key in VIEWS_TABLE.

        if (user && quest) {
          const transactParams: TransactWriteCommandInput = {
            TransactItems: [
              {
                Put: {
                  TableName: process.env.VIEWCOUNT_TABLE_NAME,
                  Item: { PK: `USER#${user.id}`, SK: `QUEST#${quest.id}` },
                  ConditionExpression: "attribute_not_exists(#SK)",
                  ExpressionAttributeNames: { "#SK": "SK" },
                },
              },
              {
                Update: {
                  TableName: process.env.MAIN_TABLE_NAME,
                  Key: { PK: `QUEST#${quest.id}`, SK: `QUEST#${quest.id}` },
                  UpdateExpression: "SET #views = #views + :inc ",
                  ExpressionAttributeNames: { "#views": "views" },
                  ExpressionAttributeValues: { ":inc": 1 },
                },
              },
            ],
          };

          try {
            await dynamoClient.send(new TransactWriteCommand(transactParams));
          } catch (error) {
            console.log("already viewed");
          }
        }

        return { quest, solvers, commentsId };
      } catch (error) {
        console.log(error);
        return { quest: null, solvers: [], commentsId: [] };
      }
    }),

  publishedQuests: publicProcedure
    .input(PublishedQuestsInputZod)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { topic, subtopic, filter = "latest" } = input;
      if (!topic && !subtopic && filter === "latest") {
        //rockset
        try {
          const getResponse = await momento.get(
            process.env.MOMENTO_CACHE_NAME!,
            "LATEST_PUBLISHED_QUESTS"
          );
          if (getResponse instanceof CacheGet.Hit) {
            return JSON.parse(getResponse.valueString()) as PublishedQuest[];
          } else if (getResponse instanceof CacheGet.Miss) {
            const publishedQuests =
              await rocksetClient.queryLambdas.executeQueryLambda(
                "commons",
                "LatestPublishedQuests",
                "c62045e5c2280525",
                undefined
              );

            const setResponse = await momento.set(
              process.env.MOMENTO_CACHE_NAME!,
              "LATEST_PUBLISHED_QUESTS",
              JSON.stringify(publishedQuests.results || "")
            );
            if (setResponse instanceof CacheSet.Success) {
              console.log("Key stored successfully!");
            } else {
              console.log(`Error setting key: ${setResponse.toString()}`);
            }
            return publishedQuests.results as PublishedQuest[];
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
      } else if (!topic && !subtopic && filter === "higher reward") {
      } else if (!topic && !subtopic && filter === "more views") {
      } else if ((topic || subtopic) && filter === "latest") {
      } else if ((topic || subtopic) && filter === "higher reward") {
      } else if ((topic || subtopic) && filter === "more views") {
      }
    }),

  workspaceQuest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { id } = input;
      const params: GetCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,

        Key: { PK: `USER#${user.id}`, SK: `QUEST#${id}` },
      };

      try {
        const result = await dynamoClient.send(new GetCommand(params));
        if (result.Item) {
          const quest = result.Item as Quest;
          if (quest.creatorId !== user.id) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "UNAUTHORIZED TO VIEW THE QUEST",
            });
          }
          return result.Item as Quest;
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
      const { user } = ctx;
      const questItem: QuestDynamo = {
        PK: `USER#${user.id}`,
        SK: `QUEST#${id}`,
        id,
        creatorId: user.id,
        inTrash: false,
        published: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        type: "QUEST",
      };
      const putParams: PutCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
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
              SK: `QUEST#${key}`,
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
        // ClientRequestToken: user.id,
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

  publishQuest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { user } = ctx;

      const tableName = process.env.MAIN_TABLE_NAME!;
      const RequestItems: Record<
        string,
        Omit<KeysAndAttributes, "Keys"> & {
          Keys: Record<string, any>[] | undefined;
        }
      > = {};
      RequestItems[tableName] = {
        Keys: [
          { PK: `USER#${user.id}`, SK: `USER#${user.id}` },
          { PK: `USER#${user.id}`, SK: `QUEST#${id}` },
        ],
      };
      const params: BatchGetCommandInput = {
        RequestItems,
      };
      type BatchGetType = Record<string, (QuestDynamo | UserDynamo)[]>;

      try {
        const { Responses } = await dynamoClient.send(
          new BatchGetCommand(params)
        );

        if (Responses) {
          const questAndUser = Responses as BatchGetType;
          let creator: User | null = null;
          let currentQuest: Quest | null = null;
          for (const item of questAndUser[tableName]!) {
            if (item.SK.startsWith("QUEST")) {
              currentQuest = item as Quest;
            } else {
              creator = item as User;
            }
          }
          if (!currentQuest || !creator) {
            console.log("user or quest not found");
            return false;
          }
          //HEHE, ! GO BRRRR
          const publishedQuest: PublishedQuest = {
            id: currentQuest.id,
            title: currentQuest.title!,
            content: currentQuest.content!,
            deadline: currentQuest.deadline!,
            topic: currentQuest.topic!,
            subtopic: currentQuest.subtopic!,
            reward: currentQuest.reward!,
            slots: currentQuest.slots!,
            solverCount: 0,
            status: "OPEN",
            published: true,
            creatorId: currentQuest.creatorId,
            creatorProfile: creator.profile,
            creatorUsername: creator.username,
            publishedAt: new Date().toISOString(),
            type: "QUEST",
            lastUpdated: currentQuest.lastUpdated,

            allowUnpublish: true,
            views: 0,
          };
          //KINDA MESSI ISNAT? HAHA? IS IT TYPE SAFE? JUST LET THE ZOD DO ITS THING (VALIDATION)
          PublishedQuestZod.parse(publishedQuest);
          const params: TransactWriteCommandInput = {
            TransactItems: [
              {
                Update: {
                  Key: { PK: `USER#${user.id}`, SK: `QUEST#${id}` },
                  TableName: process.env.MAIN_TABLE_NAME,
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
                    ":creatorId": user.id,
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
          if (transactResult) {
            return true;
          }
          return false;
        }
        return false;
      } catch (error) {
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
      const { user } = ctx;
      const params: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              Key: { PK: `USER#${user.id}`, SK: `QUEST#${id}` },
              TableName: process.env.MAIN_TABLE_NAME,
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
                ":creatorId": user.id,
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
      const { user } = ctx;
      const updateParams: UpdateCommandInput = {
        Key: { PK: `USER#${user.id}`, SK: `QUEST#${id}` },
        TableName: process.env.MAIN_TABLE_NAME,
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
  deleteQuestPermanently: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { user } = ctx;
      const { id } = input;
      const deleteParams: DeleteCommandInput = {
        Key: { PK: `USER#${user.id}`, SK: `QUEST#${id}` },
        TableName: process.env.MAIN_TABLE_NAME,
        ConditionExpression: "#creatorId =:creatorId AND #published =:false",
        ExpressionAttributeNames: {
          "#creatorId": "creatorId",
          "#published": "published",
        },
        ExpressionAttributeValues: {
          ":false": false,
          ":creatorId": user.id,
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
  restoreQuest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { id } = input;

      const updateParams: UpdateCommandInput = {
        Key: { PK: `USER#${user.id}`, SK: `QUEST#${id}` },
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
  addSolver: protectedProcedure
    .input(z.object({ questId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { questId } = input;
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
                ":id": user.id,
              },
            },
          },
          {
            Put: {
              TableName: process.env.MAIN_TABLE_NAME,

              ConditionExpression: "attribute_not_exists(#SK)",
              Item: {
                PK: `QUEST#${questId}`,
                SK: `SOLVER#${user.id}`,
                id: user.id,
                questId,
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
  solvers: publicProcedure
    .input(z.object({ solversPartial: z.array(SolverPartialZod) }))
    .query(async ({ input }) => {
      const solversPartial = input.solversPartial;
      const solvers: Solver[] = [];

      if (solversPartial.length > 0) {
        const tableName = process.env.MAIN_TABLE_NAME!;
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
            return null;
          }
          for (let i = 0; i < users.length; i++) {
            if (users[i]) {
              solvers.push({
                id: users[i]!.id,
                level: users[i]!.level,
                experience: users[i]!.experience,
                profile: users[i]!.profile,
                username: users[i]!.username,
                solutionId: solversPartial[i]?.solutionId,
                status: solversPartial[i]?.status,
              });
            }
          }
        }
      }
      return solvers;
    }),
  declareWinner: protectedProcedure
    .input(DeclareWinnerZod)
    .mutation(async ({ input, ctx }) => {
      const { winnerId, questId, solutionId } = input;
      const { user } = ctx;
      const transactParams: TransactWriteCommandInput = {
        TransactItems: [
          {
            Update: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: { PK: `QUEST#${questId}`, SK: `QUEST#${questId}` },
              ConditionExpression:
                "#creatorId = :creatorId AND attribute_not_exists(#winnerId)",
              UpdateExpression: "SET #winnerId = :winnerId",
              ExpressionAttributeNames: {
                "#creatorId": "creatorId",
                "#winnerId": "winnerId",
              },
              ExpressionAttributeValues: {
                ":creatorId": user.id,
                ":winnerId": winnerId,
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
                ":status": "SOLVED",
              },
            },
          },
          {
            Update: {
              TableName: process.env.MAIN_TABLE_NAME,
              Key: { PK: `QUEST#${questId}`, SK: `SOLUTION#${solutionId}` },

              UpdateExpression: "SET #status = :status",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: {
                ":status": "SOLVED",
              },
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
  addComment: protectedProcedure
    .input(AddCommentZod)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { questId, text, commentId } = input;
      const commentItem: CommentDynamo = {
        PK: `QUEST#${questId}`,
        SK: `COMMENT#${commentId}`,
        id: commentId,
        createdAt: new Date().toISOString(),
        creatorId: user.id,
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
        const tableName = process.env.MAIN_TABLE_NAME!;
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
