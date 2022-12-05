import * as AWS from "aws-sdk";
import { AchievementData } from "../models/adminData";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { keyMap, Keys, tableMap } from "../models/tableDecorator";
import { PlayerData } from "../models/playerData";

const db = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async ({
  body,
  httpMethod,
  queryStringParameters,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log(`method = ${httpMethod}`);

  try {
    switch (httpMethod) {
      case "POST": {
        const achievement = JSON.parse(body!) as AchievementData;
        await post(achievement);
        return {
          statusCode: 201,
          body: "success!",
        };
      }
      case "GET": {
        const playerData = await get(queryStringParameters!["playerId"]!);
        return {
          statusCode: 200,
          body: JSON.stringify(playerData),
        };
      }
      default:
        return {
          statusCode: 501,
          body: "not implemented",
        };
    }
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: JSON.stringify({ message: error }) };
  }
};

async function post({
  achievementId,
  requiredProgress,
  requiredAmount,
}: AchievementData) {
  const achievementDataParams: DocumentClient.PutItemInput = {
    TableName: tableMap.get(AchievementData)!,
    Item: {
      [keyMap.get(AchievementData)!.get(Keys.PK)!]: achievementId,
      requiredProgress,
      requiredAmount,
    },
  };
  await db.put(achievementDataParams).promise();
}

async function get(playerId: string) {
  const playerDataParams: DocumentClient.QueryInput = {
    TableName: tableMap.get(PlayerData)!,
    KeyConditionExpression: "#playerId = :playerId",
    ExpressionAttributeNames: {
      "#playerId": keyMap.get(PlayerData)!.get(Keys.PK)!,
    },
    ExpressionAttributeValues: {
      ":playerId": playerId,
    },
  };
  const { Items } = await db.query(playerDataParams).promise();
  return Items as PlayerData[];
}
