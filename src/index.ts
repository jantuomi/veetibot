import { addTask, getTask } from "./tasks";
import { runDownloadInstagramTask } from "./instagram_task";
import { runWithRetries, wait } from "./utils";

// TESTING DATA
addTask({
  type: "download_instagram",
  url: "https://www.instagram.com/reel/C33u39RBF5p/?igsh=MXZuZ2drN2wya2JmZg==",
  replyId: "123",
});

(async () => {
  const MAX_RETRIES = 5;
  // Main loop
  while (true) {
    const task = getTask();
    if (task) {
      try {
        await runWithRetries(async () => {
          if (task.type === "download_instagram") {
            await runDownloadInstagramTask(task);
          } else if (task.type === "slack_reply") {
            console.log("TODO slack reply task");
          } else {
            console.log("Unknown task type, skipping", task);
          }
        }, MAX_RETRIES);
      } catch (e) {
        console.error("Task failed after max retries, skipping task.", task, e);
      }
    } else {
      await wait(1000);
    }
  }
})();
