import { mocked } from "ts-jest/utils";
import { promises } from "fs";
import { join } from "path";
import { exec as execCB } from "child_process";

import { setOutput, addPath } from "@actions/core";
import { which } from "@actions/io";
import { exec } from "@actions/exec";
import { parse } from "yaml";
import semver, { clean, SemVer } from "semver";

promises.readFile = jest.fn();
promises.writeFile = jest.fn();
semver.clean = jest.fn();

jest.mock("@actions/core");
jest.mock("@actions/io");
jest.mock("@actions/exec");
jest.mock("child_process");
jest.mock("yaml");

const { readFile, writeFile } = promises;

import { OutKeys } from "../config";
import { Cider } from "../cider";

const whichMock = mocked(which, true);
const execMock = mocked(exec, true);
const readFileMock = mocked(readFile, true);
const writeFileMock = mocked(writeFile, true);
const parseMock = mocked(parse, true);
const cleanMock = mocked(clean, true);
const addPathMock = mocked(addPath, true);
const setOutputMock = mocked(setOutput, true);
const execCBMock = mocked(execCB, true);

describe("cider.ts", () => {
  beforeEach(() => {
    whichMock.mockReset();
    execMock.mockReset();
    readFileMock.mockReset();
    writeFileMock.mockReset();
    parseMock.mockReset();
    cleanMock.mockReset();
    setOutputMock.mockReset();
    execCBMock.mockReset();

    readFileMock.mockResolvedValue("");
    parseMock.mockReturnValue({
      version: "1.0.0",
    });
    cleanMock.mockReturnValue("1.0.0");
    execCBMock.mockImplementation((_command, _options, callback): any => {
      if (callback) {
        callback(null, "", "");
      }
    });
  });

  describe("init", () => {
    test("installs cider", async () => {
      whichMock.mockResolvedValueOnce("pub.run");
      process.env.HOME = "HOME";

      await Cider.init("");

      expect(whichMock).toHaveBeenCalledWith("pub", true);
      expect(execMock).toHaveBeenCalledWith("pub.run", [
        "global",
        "activate",
        "cider",
      ]);
      expect(addPathMock).toHaveBeenCalledWith(
        join("HOME", ".pub-cache", "bin")
      );
      expect(whichMock).toHaveBeenCalledWith("cider", true);
    });

    test("reads project info from yaml", async () => {
      readFileMock.mockResolvedValueOnce("path.yml");
      parseMock.mockReturnValueOnce({
        name: "project",
        version: "1.2.3",
      });
      cleanMock.mockReturnValueOnce("1.2.3");

      await Cider.init("dir");

      expect(readFileMock).toHaveBeenCalledWith(
        join("dir", "pubspec.yaml"),
        "utf-8"
      );
      expect(parseMock).toHaveBeenCalledWith("path.yml");
      expect(cleanMock).toHaveBeenCalledWith("1.2.3", {
        includePrerelease: false,
        loose: true,
      });
    });

    test("Throws error for invalid project version", async () => {
      parseMock.mockReturnValueOnce({
        version: "invalid",
      });
      cleanMock.mockReturnValueOnce(null);

      await expect(Cider.init("dir")).rejects.toEqual(
        new Error("Invalid project version: invalid")
      );
    });

    test("Returns initialized cider instance", async () => {
      parseMock.mockReturnValueOnce({
        name: "NAME",
      });
      cleanMock.mockReturnValueOnce("1.1.1");

      const cider = await Cider.init("");
      expect(cider.projectName).toBe("NAME");
      expect(cider.projectVersion).toEqual(new SemVer("1.1.1"));
    });
  });

  describe("generateReleaseData", () => {
    const testData = [
      ["2.0.0", "A new major release is available!"],
      ["1.2.0", "A new minor release is available!"],
      ["1.0.2", "A new patch release is available!"],
      ["1.0.0", "A new release is available!"],
    ];
    for (const [version, title] of testData) {
      test(`sets version and title output [${version}]`, async () => {
        parseMock.mockReturnValueOnce({
          version: version,
        });
        cleanMock.mockReturnValueOnce(version);

        const cider = await Cider.init("");
        await cider.generateReleaseData(new SemVer("1.0.0"));

        expect(setOutputMock).toHaveBeenCalledWith(OutKeys.newVersion, version);
        expect(setOutputMock).toHaveBeenCalledWith(OutKeys.title, title);
      });
    }

    test("write release body", async () => {
      whichMock.mockResolvedValue("cider.run");
      parseMock.mockReturnValueOnce({
        version: "2.0.0",
      });
      execCBMock.mockImplementationOnce((_command, _options, callback): any => {
        if (callback) {
          callback(null, "line1\nline2\nline3\n", "");
        }
      });

      const cider = await Cider.init("dir");
      await cider.generateReleaseData(new SemVer("1.0.0"));

      expect(execCBMock).toHaveBeenCalledWith(
        "cider.run describe [2.0.0]",
        { cwd: "dir" },
        expect.any(Function)
      );
      expect(writeFileMock).toHaveBeenCalledWith(
        join(process.cwd(), "release_body.md"),
        "## Changelog\nline2\nline3\n"
      );
      expect(setOutputMock).toHaveBeenCalledWith(
        OutKeys.bodyPath,
        join(process.cwd(), "release_body.md")
      );
    });
  });
});
