import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TranslateConfig } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

const translateConfig: TranslateConfig = {
  marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true },
};
export const dynamoClient = DynamoDBDocumentClient.from(
  client,
  translateConfig
);
