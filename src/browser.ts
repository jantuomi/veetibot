import puppeteer, { Browser } from "puppeteer";

let _browser: Browser | undefined = undefined;

export const getBrowser = async () => {
  if (!_browser || !_browser.connected) {
    _browser = await puppeteer.launch({
      headless: false,
      args: ["--shm-size=1gb"],
    });
  }
  return _browser;
};
