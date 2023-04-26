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
import * as pako from "pako";
import { protectedProcedure, publicProcedure, router } from "../trpc";

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
        const result = await dynamoClient.send(new GetCommand(params));
        if (result.Item) {
          return result.Item as User;
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
        const result = await dynamoClient.send(new GetCommand(params));
        if (result.Item) {
          const userComponent = result.Item as UserComponent;
          return userComponent;
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
        inventory: inventoryData,
      };
      UserDynamoZod.parse(userItem);
      const putParams: PutCommandInput = {
        TableName: process.env.MAIN_TABLE_NAME,
        Item: userItem,
        ConditionExpression:
          "attribute_not_exists(#sk) AND attribute_not_exists(username)",
        ExpressionAttributeNames: { "#sk": "SK" },
      };

      try {
        const result = await dynamoClient.send(new PutCommand(putParams));

        return result;
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
      const {
        about,
        email,
        subtopics,
        topics,
        username,
        profile,
        links,
        activeSlots,
        inventory,
      } = input;
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
          ...(profile && { "#profile": "profile" }),

          ...(links && { "#links": "links" }),

          ...(activeSlots && { "#activeSlots": "activeSlots" }),

          ...(inventory && { "#inventory": "inventory" }),
        },
        ExpressionAttributeValues: {
          ...(about && { ":about": about }),
          ...(email && { ":email": email }),
          ...(subtopics && { ":subtopics": subtopics }),
          ...(topics && { ":topics": topics }),
          ...(username && { ":username": username }),
          ...(profile && { ":profile": profile }),

          ...(links && { ":links": links }),
          ...(activeSlots && { ":activeSlots": activeSlots }),

          ...(inventory && { ":inventory": inventory }),
        },
      };
      try {
        const updateResult = await dynamoClient.send(new UpdateCommand(params));
        if (updateResult) {
          return true;
        }
        return false;
      } catch (error) {
        console.log(error);
        return false;
      }
    }),
});
