import { mocked } from "ts-jest/utils";

import semver, { gt, SemVer } from "semver";
import { setOutput } from "@actions/core";

import * as pubDev from "../pubDev";
import * as pkg from "../package";
import { runAction } from "../action";
import { OutKeys } from "../config";
import { join } from "path";
import { readFileSync } from "fs";

jest.mock("../pubDev");
jest.mock("../package");
jest.mock("@actions/core");
semver.gt = jest.fn();
const pubDevMock = mocked(pubDev, true);
const pkgMock = mocked(pkg, true);
const gtMock = mocked(gt, true);
const setOutputMock = mocked(setOutput, true);

const getLatestVersionMock = jest.fn();
const loadInfoMock = jest.fn();
const loadChangelogMock = jest.fn();

describe("action.ts", () => {
  beforeEach(() => {
    pubDevMock.PubDev.mockReset();
    pkgMock.Package.mockReset();
    gtMock.mockReset();
    setOutputMock.mockReset();
    getLatestVersionMock.mockReset();
    loadInfoMock.mockReset();
    loadChangelogMock.mockReset();

    pubDevMock.PubDev.mockImplementation(
      () =>
        ({
          getLatestVersion: getLatestVersionMock,
        } as any)
    );

    pkgMock.Package.mockImplementation(
      () =>
        ({
          loadInfo: loadInfoMock,
          loadChangelog: loadChangelogMock,
        } as any)
    );

    getLatestVersionMock.mockResolvedValue(new SemVer("1.1.0"));
    loadInfoMock.mockResolvedValue({
      name: "name",
      version: new SemVer("1.0.0"),
    });
    loadChangelogMock.mockResolvedValue("change log");
  });

  describe("runAction", () => {
    test("compares pub.dev with current version", async () => {
      await runAction({
        srcDir: "dir",
      });

      expect(pubDevMock.PubDev).toHaveBeenCalled();
      expect(getLatestVersionMock).toHaveBeenCalledWith("name");
      expect(gtMock).toHaveBeenCalledWith(
        new SemVer("1.0.0"),
        new SemVer("1.1.0")
      );
    });

    test("sets update to false if pub.dev is newer", async () => {
      gtMock.mockReturnValueOnce(false);

      await runAction({ srcDir: "" });

      expect(setOutputMock).toHaveBeenCalledWith(OutKeys.update, false);
    });

    test.each([
      ["2.0.0", "A new major release is available!"],
      ["1.2.0", "A new minor release is available!"],
      ["1.0.2", "A new patch release is available!"],
      ["1.0.0", "A new release is available!"],
    ])(
      "generates release data and sets update to true if pub.dev is newer (%s)",
      async (version, title) => {
        gtMock.mockReturnValueOnce(true);
        loadInfoMock.mockResolvedValueOnce({
          name: "name",
          version: new SemVer(version),
        });
        loadChangelogMock.mockResolvedValue(`change log ${version}`);

        await runAction({ srcDir: "" });

        expect(setOutputMock).toHaveBeenCalledWith(OutKeys.newVersion, version);
        expect(setOutputMock).toHaveBeenCalledWith(OutKeys.title, title);
        expect(setOutputMock).toHaveBeenCalledWith(
          OutKeys.bodyPath,
          join(process.cwd(), "release_body.md")
        );
        expect(setOutputMock).toHaveBeenCalledWith(OutKeys.update, true);

        const bodyContent = readFileSync("release_body.md", "utf-8");
        expect(bodyContent).toBe(`## Changelog\nchange log ${version}`);
      }
    );
  });
});
