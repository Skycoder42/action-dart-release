import { error, setFailed } from "@actions/core";
import { loadConfig } from "./config";
import { runAction } from "./action";

const run = async (): Promise<void> => {
  try {
    const config = loadConfig();
    await runAction(config);
  } catch (e) {
    error(e);
    setFailed(e);
  }
};

run();
