import { InstagramTask } from "./instagram_task";
import { TikTokTask } from "./tiktok_task";

// union of possible task types
export type Task = InstagramTask | TikTokTask;

const taskQueue: Task[] = [];

export const addTask = (task: Task) => {
  taskQueue.push(task);
};

export const getTask = (): Task | undefined => {
  return taskQueue.shift();
};

export const numOfTasksInQueue = () => {
  return taskQueue.length;
};
