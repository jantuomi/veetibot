import fs from "fs";
import puppeteer, { TimeoutError } from "puppeteer";
import { wait } from "./utils";
import { getBrowser } from "./browser";

export interface InstagramTask {
  type: "download_instagram";
  url: string;
  respondWithFile: (filePath: string) => Promise<void>;
  respondTaskFailed: (err: unknown) => Promise<void>;
}

export const runDownloadInstagramTask = async (task: InstagramTask) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: "./downloads",
  });

  try {
    console.log("Starting task:", task.url);

    const downloadDirFiles = fs.readdirSync("./downloads");
    console.log("Emptying downloads folder");
    downloadDirFiles.forEach((file) => {
      fs.unlinkSync(`./downloads/${file}`);
    });

    await page.goto("https://snapins.ai/");

    try {
      const consent = await page.waitForSelector("button.fc-cta-consent", {
        timeout: 3000,
      });
      if (consent) {
        console.log("Looks like a cookie consent dialog, clicking agree");
        await consent.click();
      }
    } catch (e) {
      if (e instanceof TimeoutError) {
        console.log("No cookie consent dialog found");
      } else {
        throw e;
      }
    }

    console.log("Waiting for a bit");
    await wait(1000);
    console.log("Done waiting");

    // try {
    //   const adModalClose = await page.waitForSelector("#adOverlay button", {
    //     timeout: 3000,
    //   });
    //   console.log("Looks like an ad modal, clicking close");
    //   await adModalClose?.click();
    // } catch (e) {
    //   if (e instanceof TimeoutError) {
    //     console.log("No ad modal");
    //   } else {
    //     throw e;
    //   }
    // }

    try {
      const secondAdModalClose = await page.waitForSelector("#dismiss-button", {
        timeout: 3000,
      });
      console.log("Looks like a second ad modal, clicking close");
      await secondAdModalClose?.click();
    } catch (e) {
      if (e instanceof TimeoutError) {
        console.log("No second ad modal");
      } else {
        throw e;
      }
    }

    await page.type("input#url", task.url);
    await page.click("#btn-submit");

    const downloadButton = await page.waitForSelector(
      ".download-content a[data-event=click_download_btn]",
      { timeout: 10_000 },
    );
    if (!downloadButton) {
      throw new Error("Could not find download button");
    }

    console.log("Found download button, pressing enter");
    await downloadButton?.scrollIntoView();
    await downloadButton?.focus();
    await downloadButton?.press("Enter");

    console.log("Waiting to see if one more ad pops up");
    await wait(1000);

    // Click outside shadow-dommed ad modal to close it and start the download
    console.log(
      "Clicking outside the possible ad modal to close it and start the download",
    );
    await page.mouse.click(10, 10);

    console.log("Waiting for download to start");
    await wait(3000);

    let downloadTimeout = 5 * 60 * 1000; // 5 minutes
    let downloadedFiles = fs.readdirSync("./downloads");
    while (downloadedFiles.some((file) => file.endsWith(".crdownload"))) {
      if (downloadTimeout <= 0) {
        throw new Error("Download timed out");
      }

      console.log("Download still in progress, waiting");
      await wait(1000);
      downloadTimeout -= 1000;
      downloadedFiles = fs.readdirSync("./downloads");
    }

    console.log("Downloaded files", downloadedFiles);
    if (downloadedFiles.length === 0) {
      throw new Error("No files downloaded");
    } else if (downloadedFiles.length > 1) {
      throw new Error("More than one file downloaded, not sure what to do");
    }

    const downloadedFile = downloadedFiles[0];

    await task.respondWithFile(`./downloads/${downloadedFile}`);
  } finally {
    await page.close();
  }
};
