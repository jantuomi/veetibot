import { exec } from "child_process";

export const asyncExec = (command: string) => {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const runWithRetries = async <T>(
  fn: () => Promise<T>,
  retries: number,
  backoff: number = 2000,
): Promise<T> => {
  let attempts = 0;
  while (true) {
    await wait(attempts * backoff);
    try {
      return await fn();
    } catch (e) {
      if (attempts >= retries) {
        throw e;
      }

      console.error("Error:", e);
      attempts++;
    }
  }
};
