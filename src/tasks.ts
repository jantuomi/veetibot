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
    const filepath = `downloads/${filename}`;
    // remove the file if it exists
    try {
      fs.rmSync(filepath);
    } catch (e: any) {
      if (e.code !== "ENOENT") {
        console.error("Error deleting file", e);
      }
    }

    const { stdout } = await asyncExec(
      `yt-dlp -f "bestvideo[ext=mp4][vcodec!*=vp9]+bestaudio/best[ext=mp4][vcodec!*=vp9]" \
        --merge-output-format mp4 \
        --restrict-filenames -o "${filename}" -P downloads --cookies-from-browser chromium "${task.url}"`,
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
