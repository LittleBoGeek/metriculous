import { WebClient } from "@slack/web-api";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const token = process.env.SLACK_TOKEN;
const channelId = process.env.CHANNEL_ID;

const web = new WebClient(token);

export async function postToSlack(message) {
  try {
    await web.chat.postMessage({
      text: message,
      channel: channelId,
    });
  } catch (error) {
    console.error("❗️Error posting message to Slack", error);
  }
}

export async function uploadFileToSlack() {
  const fileName = `Metrics(${new Date().toLocaleDateString()}.csv`;

  try {
    await web.files.upload({
      channels: channelId,
      initial_comment: `Metrics for ${new Date().toLocaleDateString()} :smile:`,
      file: fs.createReadStream(fileName),
    });
  } catch (error) {
    console.error(`❗️Error uploading ${fileName} to Slack`, error);
  }
}
