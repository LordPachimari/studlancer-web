import {
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  CreateUserZod,
  Inventory,
  InventorySlot,
  UpdateUserAttributes,
  UpdateUserAttributesZod,
  User,
  UserComponent,
  UserDynamo,
  UserDynamoZod,
} from "../../../types/main";

import { dynamoClient } from "../../../constants/dynamoClient";
import Giorno from "../../../assets/Giorno2.png";
import Jotaro from "../../../assets/jotaro.png";
import * as pako from "pako";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { momento } from "~/constants/momentoClient";
import { CacheGet, CacheSet } from "@gomomento/sdk";
import { ulid } from "ulid";

export const userRouter = router({
  userById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const params: GetCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,

        Key: { PK: `USER#${id}`, SK: `USER#${id}` },
      };

      try {
        const getResponse = await momento.get(
          process.env.MOMENTO_CACHE_NAME || "",
          id
        );
        if (getResponse instanceof CacheGet.Hit) {
          console.log("cache hit!");

          // increasing view count on the quest logic. If user exists and haven't seen the quest by checking whether user has this quest id as a sort key in VIEWS_TABLE.
          const result = JSON.parse(getResponse.valueString()) as User;

          return result;
        } else if (getResponse instanceof CacheGet.Miss) {
          const result = await dynamoClient.send(new GetCommand(params));
          if (result.Item) {
            const setResponse = await momento.set(
              process.env.MOMENTO_CACHE_NAME || "",
              id,
              JSON.stringify(result.Item || ""),
              { ttl: 1800 }
            );
            if (setResponse instanceof CacheSet.Success) {
              console.log("Key stored successfully!");
            } else {
              console.log(`Error setting key: ${setResponse.toString()}`);
            }
            return result.Item as User;
          }
        } else if (getResponse instanceof CacheGet.Error) {
          console.log(`Error: ${getResponse.message()}`);
        }
        return null;
      } catch (error) {
        console.log(error);
        return null;
      }
    }),
  userComponent: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      const params: GetCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,

        Key: { PK: `USER#${id}`, SK: `USER#${id}` },
        ProjectionExpression: "#id, #username, #level, #profile, #verified",
        ExpressionAttributeNames: {
          "#id": "id",
          "#username": "username",
          "#level": "level",
          "#profile": "profile",
          "#verified": "verified",
        },
      };
      try {
        const getResponse = await momento.get(
          process.env.MOMENTO_CACHE_NAME || "",

          `USER_COMPONENT#${id}`
        );
        if (getResponse instanceof CacheGet.Hit) {
          console.log("cache hit!");

          // increasing view count on the quest logic. If user exists and haven't seen the quest by checking whether user has this quest id as a sort key in VIEWS_TABLE.
          const result = JSON.parse(getResponse.valueString()) as UserComponent;

          return result;
        } else if (getResponse instanceof CacheGet.Miss) {
          const result = await dynamoClient.send(new GetCommand(params));
          if (result.Item) {
            const userComponent = result.Item as UserComponent;
            const setResponse = await momento.set(
              process.env.MOMENTO_CACHE_NAME || "",
              `USER_COMPONENT#${id}`,
              JSON.stringify(userComponent || ""),
              { ttl: 1800 }
            );
            if (setResponse instanceof CacheSet.Success) {
              console.log("Key stored successfully!");
            } else {
              console.log(`Error setting key: ${setResponse.toString()}`);
            }
            return userComponent;
          }
        } else if (getResponse instanceof CacheGet.Error) {
          console.log(`Error: ${getResponse.message()}`);
        }
        return null;
      } catch (error) {
        console.log(error);
        return null;
      }
    }),
  createUser: protectedProcedure
    .input(CreateUserZod)
    .mutation(async ({ input, ctx }) => {
      const { username } = input;
      const { auth } = ctx;
      const inventory: InventorySlot[] = [
        { index: 0, item: Giorno, type: "skin" },
      ];
      const inventoryString = JSON.stringify(inventory);
      const inventoryData = pako.deflate(inventoryString);
      const inventoryItem: Inventory & { PK: string; SK: string } = {
        PK: `USER#${auth.userId}`,
        SK: `INVENTORY#${auth.userId}`,

        inventory: inventoryData,
        lastUpdated: new Date().toISOString(),
      };

      const userItem: UserDynamo = {
        PK: `USER#${auth.userId}`,
        SK: `USER#${auth.userId}`,
        id: auth.userId,
        balance: 0,
        createdAt: new Date().toISOString(),
        experience: 0,
        role: "USER",
        level: 0,
        email: auth.user!.emailAddresses[0]!.emailAddress,
        username: username,
        verified: false,
        type: "USER",
      };
      UserDynamoZod.parse(userItem);

      const inventoryPutParams: PutCommandInput = {
        TableName: process.env.WORKSPACE_TABLE_NAME,
        Item: inventoryItem,
      };
      const putParams: PutCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
        Item: userItem,
        ConditionExpression:
          "attribute_not_exists(#sk) AND attribute_not_exists(username)",
        ExpressionAttributeNames: { "#sk": "SK" },
      };

      try {
        await Promise.all([
          dynamoClient.send(new PutCommand(putParams)),
          dynamoClient.send(new PutCommand(inventoryPutParams)),
        ]);

        return true;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          message: "User already exist",
          code: "BAD_REQUEST",
        });
      }
    }),
  updateUserAttributes: protectedProcedure
    .input(UpdateUserAttributesZod)
    .mutation(async ({ input, ctx }) => {
      const { about, email, subtopics, topics, username, links } = input;
      const { auth } = ctx;

      const updateAttributes: string[] = [];
      for (const property in input) {
        if (input[property as keyof UpdateUserAttributes]) {
          updateAttributes.push(`#${property}=:${property}`);
        }
      }
      const UpdateExpression = `SET ${updateAttributes.join(", ")}`;

      const params: UpdateCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
        Key: { PK: `USER#${auth.userId}`, SK: `USER#${auth.userId}` },
        UpdateExpression: UpdateExpression,
        ExpressionAttributeNames: {
          ...(about && { "#about": "about" }),
          ...(email && { "#email": "email" }),
          ...(subtopics && { "#subtopics": "subtopics" }),
          ...(topics && { "#topics": "topics" }),
          ...(username && { "#username": "username" }),

          ...(links && { "#links": "links" }),
        },
        ExpressionAttributeValues: {
          ...(about && { ":about": about }),
          ...(email && { ":email": email }),
          ...(subtopics && { ":subtopics": subtopics }),
          ...(topics && { ":topics": topics }),
          ...(username && { ":username": username }),

          ...(links && { ":links": links }),
        },
      };
      try {
        const updateResult = await dynamoClient.send(new UpdateCommand(params));
        if (updateResult) {
          await momento.delete("accounts-cache", auth.userId);
          return true;
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "could not update the user",
        });
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "could not update the user",
        });
      }
    }),

  getInventory: protectedProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;

    const getParams: GetCommandInput = {
      TableName: process.env.WORKSPACE_TABLE_NAME,
      Key: { PK: `USER#${auth.userId}`, SK: `INVENTORY#${auth.userId}` },
    };

    try {
      const result = await dynamoClient.send(new GetCommand(getParams));
      if (result.Item) {
        return result.Item as Inventory;
      }
      throw new TRPCError({
        message: "failed to get inventory",
        code: "BAD_REQUEST",
      });
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        message: "failed to get inventory",
        code: "BAD_REQUEST",
      });
    }
  }),
  updateInventory: protectedProcedure
    .input(
      z.object({
        inventory: z.instanceof(Uint8Array),
        activeSlots: z.instanceof(Uint8Array),
        profile: z.string(),
        lastUpdated: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { auth } = ctx;
      const { inventory, activeSlots, profile, lastUpdated } = input;
      const inventoryParams: UpdateCommandInput = {
        TableName: process.env.WORKSPACE_TABLE_NAME,
        Key: { PK: `USER#${auth.userId}`, SK: `INVENTORY#${auth.userId}` },
        ExpressionAttributeNames: {
          ...(inventory && { "#inventory": "inventory" }),

          ...(activeSlots && { "#activeSlots": "activeSlots" }),
          "#lastUpdated": "lastUpdated",
        },
        ExpressionAttributeValues: {
          ...(inventory && { ":inventory": inventory }),
          ...(activeSlots && { ":activeSlots": activeSlots }),
          ":lastUpdated": lastUpdated,
        },
      };
      const userParams: UpdateCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
        Key: { PK: `USER#${auth.userId}`, SK: `USER#${auth.userId}` },
        UpdateExpression: "SET profile = :profile",
        ExpressionAttributeValues: { ":profile": profile },
      };
      try {
        const updateResult = await Promise.all([
          dynamoClient.send(new UpdateCommand(inventoryParams)),
          dynamoClient.send(new UpdateCommand(userParams)),
        ]);
        if (updateResult) {
          await momento.delete("accounts-cache", auth.userId);
          return true;
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "could not update the inventory",
        });
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "could not update the inventory",
        });
      }
    }),

  addNewInventoryItem: protectedProcedure.mutation(async ({ ctx }) => {
    const { auth } = ctx;
    const inventory: InventorySlot[] = [
      { index: 0, item: Jotaro, type: "skin" },
    ];
    const inventoryString = JSON.stringify(inventory);
    const inventoryData = pako.deflate(inventoryString);
    const inventoryId = ulid();
    const inventoryItem: Inventory & { PK: string; SK: string } = {
      PK: `SHOP`,
      SK: `ITEM#${inventoryId}`,
      inventory: inventoryData,
      lastUpdated: new Date().toISOString(),
    };
    const putParams: PutCommandInput = {
      TableName: process.env.WORKSPACE_TABLE_NAME,
      Item: inventoryItem,
    };

    try {
      const result = await dynamoClient.send(new PutCommand(putParams));

      return result;
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        message: "failed to add item",
        code: "BAD_REQUEST",
      });
    }
  }),
});
