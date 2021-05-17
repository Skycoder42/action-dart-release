import { info, setOutput } from "@actions/core";
import { OutKeys, Config } from "./config";
import { PubDev } from "./pubDev";
import { gt, SemVer } from "semver";
import { join } from "path";
import { promises } from "fs";
import { Package } from "./package";

const { writeFile } = promises;

export const runAction = async (config: Config): Promise<void> => {
  const pkg = new Package(config.srcDir);
  const pubDev = new PubDev();

  const pkgInfo = await pkg.loadInfo();
  const pubVersion = await pubDev.getLatestVersion(pkgInfo.name);
  if (!pubVersion || gt(pkgInfo.version, pubVersion)) {
    info("Pub.Dev is outdated - generating new release.");
    const changelog = await pkg.loadChangelog(pkgInfo.version);
    await createRelease(pubVersion, pkgInfo.version, changelog);
  } else {
    info("Pub.Dev is up to date - no new release required.");
    setOutput(OutKeys.update, false);
  }
};

const createRelease = async (
  oldVersion: SemVer | null,
  newVersion: SemVer,
  changelog: string
): Promise<void> => {
  setOutput(OutKeys.newVersion, newVersion.version);

  if (oldVersion && newVersion.major > oldVersion.major) {
    setOutput(OutKeys.title, "A new major release is available!");
  } else if (oldVersion && newVersion.minor > oldVersion.minor) {
    setOutput(OutKeys.title, "A new minor release is available!");
  } else if (oldVersion && newVersion.patch > oldVersion.patch) {
    setOutput(OutKeys.title, "A new patch release is available!");
  } else {
    setOutput(OutKeys.title, "A new release is available!");
  }

  const outPath = join(process.cwd(), "release_body.md");
  await writeFile(outPath, "## Changelog\n" + changelog, "utf-8");
  setOutput(OutKeys.bodyPath, outPath);
  setOutput(OutKeys.update, true);
};
