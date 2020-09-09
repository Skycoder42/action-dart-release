import { debug, getInput } from "@actions/core";

export const enum OutKeys {
  update = "update",
  newVersion = "newVersion",
  title = "title",
  bodyPath = "bodyPath",
}

export type Config = {
  srcDir: string;
};

export const loadConfig = (): Config => {
  const config: Config = {
    srcDir: getInput("src-dir", { required: true }),
  };
  debug(`Using config: ${JSON.stringify(config, undefined, 2)}`);
  return config;
};
