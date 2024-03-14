import { addTask, getTask, numOfTasksInQueue } from "./tasks";
import { runDownloadInstagramTask } from "./instagram_task";
import { runWithRetries, wait } from "./utils";
import { AppOptions, App as SlackApp } from "@slack/bolt";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const QUEUE_MAX_LENGTH = process.env.QUEUE_MAX_LENGTH
  ? Number(process.env.QUEUE_MAX_LENGTH)
  : 3;

const slackAppConfig: AppOptions = {
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
};

const app = new SlackApp(slackAppConfig);

app.command("/veeti", async ({ command, ack, respond, client }) => {
  await ack();

  if (numOfTasksInQueue() >= QUEUE_MAX_LENGTH) {
    void respond({
      text: "Too many tasks in queue, please try again later.",
      response_type: "ephemeral",
    });
    return;
  }

  console.log("Received command: /veeti", command.text);
  const url = command.text.trim();

  if (!url.includes("instagram.com")) {
    void respond({
      text: "Only instagram.com URLs are supported at the moment",
      response_type: "ephemeral",
    });
    return;
  }

  // send a message only visible to the user who sent the command
  void respond({
    text: "Sharing instagram video, this can take a minute...",
    thread_ts: command.ts,
    response_type: "ephemeral",
  });

  const respondWithFile = async (filePath: string) => {
    try {
      console.log("Uploading file", filePath);
      const fileContent = fs.readFileSync(filePath);
      const extension = filePath.split(".").pop();
      const fileName = `veeti.${extension}`;
      console.log("Sending message to channel", command.channel_id);
      await client.filesUploadV2({
        channel_id: command.channel_id,
        initial_comment: `By: @${command.user_name}`,
        file: fileContent,
        filename: fileName,
      });
      console.log("Success");
    } catch (e) {
      console.error("Failed to upload file", e);
      void respond({
        text:
          "Failed to share file, please try again later. Error: " + String(e),
        response_type: "ephemeral",
      });
    }
  };

  const respondTaskFailed = async (err: unknown) => {
    console.error("Task failed", err);
    void respond({
      text:
        "Failed to download video, please try again later. Error: " +
        String(err),
      response_type: "ephemeral",
    });
  };

  addTask({
    type: "download_instagram",
    url,
    respondWithFile,
    respondTaskFailed,
  });
});

const taskLoop = async () => {
  const MAX_RETRIES = 5;
  // Main loop
  while (true) {
    const task = getTask();
    if (task) {
      try {
        await runWithRetries(async () => {
          if (task.type === "download_instagram") {
            await runDownloadInstagramTask(task);
          } else {
            console.log("Unknown task type, skipping", task);
          }
        }, MAX_RETRIES);
      } catch (e) {
        void task.respondTaskFailed(e);
        console.error("Task failed after max retries, skipping task.", task, e);
      }
    } else {
      await wait(1000);
    }
  }
};

// run Puppeteer tasks in background
void taskLoop();

// start listening for Slack events
app.start();
