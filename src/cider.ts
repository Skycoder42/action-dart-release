import { exec } from "@actions/exec";
import { which } from "@actions/io";
import { debug, setOutput } from "@actions/core";
import { parse } from "yaml";
import { promises } from "fs";
import { join } from "path";
import { clean, SemVer } from "semver";
import { OutKeys } from "./config";
import { exec as execCB } from "child_process";

type PubspecYaml = {
  name: string;
  version: string;
};

const { readFile, writeFile } = promises;

export class Cider {
  private _ciderPath: string;
  private _projectDir: string;
  private _projectName: string;
  private _projectVersion: SemVer;
  private _projectVersionRaw: string;

  private constructor(
    ciderPath: string,
    projectDir: string,
    projectName: string,
    projectVersion: SemVer,
    projectVersionRaw: string
  ) {
    this._ciderPath = ciderPath;
    this._projectDir = projectDir;
    this._projectName = projectName;
    this._projectVersion = projectVersion;
    this._projectVersionRaw = projectVersionRaw;
  }

  public get projectName(): string {
    return this._projectName;
  }
  public get projectVersion(): SemVer {
    return this._projectVersion;
  }

  static async init(projectDir: string): Promise<Cider> {
    debug("Installing cider...");
    const pubPath = await which("pub", true);
    await exec(pubPath, ["global", "activate", "cider"]);
    const ciderPath = await which("cider", true);

    debug("Loading project info...");
    const yamlFile = await readFile(join(projectDir, "pubspec.yaml"), "utf-8");
    const yamlData = parse(yamlFile) as PubspecYaml;
    const version = clean(yamlData.version, {
      includePrerelease: false,
      loose: true,
    });
    if (!version) {
      throw Error(`Invalid project version: ${yamlData.version}`);
    }

    return new Cider(
      ciderPath,
      projectDir,
      yamlData.name,
      new SemVer(version),
      yamlData.version
    );
  }

  async generateReleaseData(oldVersion: SemVer): Promise<void> {
    setOutput(OutKeys.newVersion, this._projectVersion.raw);

    if (this._projectVersion.major > oldVersion.major) {
      setOutput(OutKeys.title, "A new major release is available!");
    } else if (this._projectVersion.minor > oldVersion.minor) {
      setOutput(OutKeys.title, "A new minor release is available!");
    } else if (this._projectVersion.patch > oldVersion.patch) {
      setOutput(OutKeys.title, "A new patch release is available!");
    } else {
      setOutput(OutKeys.title, "A new release is available!");
    }

    const outPath = join(process.cwd(), "release_body.md");
    const stdout = await this.runCommand(
      `${this._ciderPath} describe [${this._projectVersionRaw}]`
    );
    await writeFile(
      outPath,
      "## Changelog\n" + stdout.split("\n").slice(1).join("\n")
    );
    setOutput(OutKeys.bodyPath, outPath);
  }

  private runCommand(command: string): Promise<string> {
    return new Promise<string>((res, rej) => {
      execCB(command, { cwd: this._projectDir }, (e, stdout) => {
        if (e) {
          rej(e);
        } else {
          res(stdout);
        }
      });
    });
  }
}
