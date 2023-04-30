import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TranslateConfig } from "@aws-sdk/lib-dynamodb";
import { env } from "~/env.mjs";
const client = new DynamoDBClient({
  region: env.REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.SECRET_KEY,
  },
});

const translateConfig: TranslateConfig = {
  marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true },
};
export const dynamoClient = DynamoDBDocumentClient.from(
  client,
  translateConfig
);
