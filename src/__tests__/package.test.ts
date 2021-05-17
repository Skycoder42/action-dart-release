import { mocked } from "ts-jest/utils";
import { promises } from "fs";
import { readFile } from "fs/promises";
import semver, { clean, SemVer } from "semver";
import { parse } from "yaml";
import { Package } from "../package";
import { join } from "path";

promises.readFile = jest.fn();
semver.clean = jest.fn();

jest.mock("yaml");

const readFileMock = mocked(readFile, true);
const parseMock = mocked(parse, true);
const cleanMock = mocked(clean, true);

describe("package.ts", () => {
  const testDir = "test/dir";

  let sut: Package;

  beforeEach(() => {
    readFileMock.mockReset();
    parseMock.mockReset();
    cleanMock.mockReset();

    sut = new Package(testDir);
  });

  describe("loadInfo", () => {
    test("reads project info from yaml", async () => {
      readFileMock.mockResolvedValueOnce("yaml-content");
      parseMock.mockReturnValueOnce({
        name: "project",
        version: "1.2.3",
      });
      cleanMock.mockReturnValueOnce("1.2.3");

      const pkgInfo = await sut.loadInfo();

      expect(pkgInfo.name).toBe("project");
      expect(pkgInfo.version.version).toBe("1.2.3");

      expect(readFileMock).toHaveBeenCalledWith(
        join("test/dir", "pubspec.yaml"),
        "utf-8"
      );
      expect(parseMock).toHaveBeenCalledWith("yaml-content");
      expect(cleanMock).toHaveBeenCalledWith("1.2.3", {
        includePrerelease: false,
        loose: true,
      });
    });

    test("Throws error for invalid project version", async () => {
      readFileMock.mockResolvedValue("");
      parseMock.mockReturnValueOnce({
        version: "invalid",
      });
      cleanMock.mockReturnValueOnce(null);

      await expect(sut.loadInfo()).rejects.toEqual(
        new Error("Invalid project version: invalid")
      );
    });
  });

  describe("loadChangelog", () => {
    const testVersion = new SemVer("1.2.3");
    const changelogRaw = `
# Changelog
This is the changelog

## [2.0.0] - 2021-11-11
### Some
Stuff
#### Etc.
## More

## [1.2.3] - 2021-05-05
### Fixed
- everything
- anything
- nothing

## [1.0.0] - 2020-10-10
Tbd
`;

    beforeEach(() => {
      readFileMock.mockResolvedValue(changelogRaw);
    });

    test("loads changelog from correct file", async () => {
      await sut.loadChangelog(testVersion);

      expect(readFileMock).toHaveBeenCalledWith(
        join(testDir, "CHANGELOG.md"),
        "utf-8"
      );
    });

    test("extracts correct part of changelog", async () => {
      const result = await sut.loadChangelog(testVersion);

      expect(result).toBe(`### Fixed
- everything
- anything
- nothing
`);
    });
  });
});
