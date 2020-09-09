import { info, setOutput } from "@actions/core";
import { OutKeys, Config } from "./config";
import { Cider } from "./cider";
import { PubDev } from "./pubDev";
import { gt } from "semver";

export const runAction = async (config: Config): Promise<void> => {
  const cider = await Cider.init(config.srcDir);
  const pubDev = new PubDev();

  const pubVersion = await pubDev.getLatestVersion(cider.projectName);
  if (gt(cider.projectVersion, pubVersion)) {
    info("Pub.Dev is outdated - generating new release.");
    await cider.generateReleaseData(pubVersion);
    setOutput(OutKeys.update, true);
  } else {
    info("Pub.Dev is up to date - no new release required.");
    setOutput(OutKeys.update, false);
  }
};
