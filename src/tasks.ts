export interface InstagramTask {
  type: "download_instagram";
  url: string;
  replyId: string;
}

export interface SlackReplyTask {
  type: "slack_reply";
  replyId: string;
  message: string;
  filePath: string;
}

export type Task = InstagramTask | SlackReplyTask;

const taskQueue: Task[] = [];

export const addTask = (task: Task) => {
  taskQueue.push(task);
};

export const getTask = (): Task | undefined => {
  return taskQueue.shift();
};
