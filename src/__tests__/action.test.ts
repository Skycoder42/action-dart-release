import { mocked } from "ts-jest/utils";

import semver, { gt, SemVer } from "semver";
import { setOutput } from "@actions/core";

import * as cider from "../cider";
import * as pubDev from "../pubDev";
import { runAction } from "../action";
import { OutKeys } from "../config";

jest.mock("../cider");
jest.mock("../pubDev");
jest.mock("@actions/core");
semver.gt = jest.fn();
const ciderMock = mocked(cider, true);
const pubDevMock = mocked(pubDev, true);
const gtMock = mocked(gt, true);
const setOutputMock = mocked(setOutput, true);

const generateReleaseDataMock = jest.fn();
const getLatestVersionMock = jest.fn();

describe("action.ts", () => {
  beforeEach(() => {
    ciderMock.Cider.init.mockReset();
    pubDevMock.PubDev.mockReset();
    gtMock.mockReset();
    setOutputMock.mockReset();
    generateReleaseDataMock.mockReset();
    getLatestVersionMock.mockReset();

    ciderMock.Cider.init.mockResolvedValue({
      projectName: "name",
      projectVersion: new SemVer("1.0.0"),
      generateReleaseData: generateReleaseDataMock,
    } as any);

    pubDevMock.PubDev.mockImplementation(
      () =>
        ({
          getLatestVersion: getLatestVersionMock,
        } as any)
    );

    getLatestVersionMock.mockResolvedValue(new SemVer("1.1.0"));
  });

  describe("runAction", () => {
    test("compares pub.dev with current version", async () => {
      await runAction({
        srcDir: "dir",
      });

      expect(ciderMock.Cider.init).toHaveBeenCalledWith("dir");
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

    test("generates release data and sets update to true if pub.dev is newer", async () => {
      gtMock.mockReturnValueOnce(true);

      await runAction({ srcDir: "" });

      expect(generateReleaseDataMock).toHaveBeenCalledWith(new SemVer("1.1.0"));
      expect(setOutputMock).toHaveBeenCalledWith(OutKeys.update, true);
    });
  });
});
