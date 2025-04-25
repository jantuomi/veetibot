import { asyncExec } from "./utils";
import fs from "fs";
export const checkIfYtdlpIsInstalled = async () => {
  try {
    await asyncExec("yt-dlp --version");
    return true;
  } catch (e) {
    console.error("yt-dlp is not installed or available in PATH", e);
    return false;
  }
};

export const runDownloadUrlTask = async (task: Task) => {
  try {
    const filename = "veeti.mp4";
    // remove the file if it exists
    try {
      fs.rmSync(filename);
    } catch (e: any) {
      if (e.code !== "ENOENT") {
        console.error("Error deleting file", e);
      }
    }

    const { stdout } = await asyncExec(
      `yt-dlp --cookies-from-browser chromium -o "downloads/${filename}" "${task.url}"`,
    );
    console.log(stdout);
    task.respondWithFile(filename);
  } catch (e) {
    console.error("Error downloading URL", e);
    throw e;
  }
};

export type Task = {
  url: string;
  type: "download_url";
  respondWithFile: (file: string) => void;
  respondTaskFailed: (err: unknown) => void;
};

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
