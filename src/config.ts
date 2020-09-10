import { debug, getInput } from "@actions/core";

export const enum InKeys {
  srcDir = "src_dir",
}

export const enum OutKeys {
  update = "update",
  newVersion = "tag_name",
  title = "release_name",
  bodyPath = "body_path",
}

export type Config = {
  srcDir: string;
};

export const loadConfig = (): Config => {
  const config: Config = {
    srcDir: getInputWithDefault(InKeys.srcDir, process.cwd()),
  };
  debug(`Using config: ${JSON.stringify(config, undefined, 2)}`);
  return config;
};

const getInputWithDefault = (key: InKeys, defaultValue: string) => {
  const value = getInput(key);
  return value ? value : defaultValue;
};
