import { mocked } from "ts-jest/utils";
import { get } from "https";
import { PubDev } from "../pubDev";
import { ClientRequest } from "http";
import { SemVer } from "semver";

jest.mock("https");
const getMock = mocked(get, true);

describe("pubDev.ts", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  const pubDev = new PubDev();

  describe("getLatestVersion", () => {
    test("Sends API request with correct package", () => {
      const pubDev = new PubDev();
      pubDev.getLatestVersion("test_package");
      expect(get).toHaveBeenCalledWith(
        "https://pub.dev/api/packages/test_package",
        {
          headers: {
            Accept: "application/vnd.pub.v2+json",
          },
        },
        expect.any(Function)
      );
    });

    test("Returns valid version for valid request", async () => {
      getMock.mockImplementationOnce(
        (_url, _options, callback): ClientRequest => {
          if (callback) {
            const onMap: any = {};

            callback({
              statusCode: 200,
              on: (key: string, cb: Function) => {
                onMap[key] = cb;
              },
            } as any);

            const jData = JSON.stringify({
              latest: {
                version: "1.2.3",
              },
            });
            onMap["data"](jData.slice(0, 10));
            onMap["data"](jData.slice(10));
            onMap["end"]();
          }
          return undefined as any;
        }
      );

      expect(await pubDev.getLatestVersion("")).toEqual(new SemVer("1.2.3"));
    });

    test("Forwards error for invalid status-code", async () => {
      getMock.mockImplementationOnce(
        (_url, _options, callback): ClientRequest => {
          if (callback) {
            callback({
              statusCode: 404,
              statusMessage: "NOT FOUND",
            } as any);
          }
          return undefined as any;
        }
      );

      await expect(pubDev.getLatestVersion("")).rejects.toEqual(
        Error("NOT FOUND")
      );
    });

    test("Forwards errors of on error handler", async () => {
      getMock.mockImplementationOnce(
        (_url, _options, callback): ClientRequest => {
          if (callback) {
            callback({
              statusCode: 200,
              on: (key: string, cb: Function) => {
                if (key === "error") {
                  cb(new Error("ERROR"));
                }
              },
            } as any);
          }
          return undefined as any;
        }
      );

      await expect(pubDev.getLatestVersion("")).rejects.toEqual(Error("ERROR"));
    });

    test("Forwards JSON parsing errors", async () => {
      getMock.mockImplementationOnce(
        (_url, _options, callback): ClientRequest => {
          if (callback) {
            const onMap: any = {};

            callback({
              statusCode: 200,
              on: (key: string, cb: Function) => {
                onMap[key] = cb;
              },
            } as any);

            onMap["data"]("junk");
            onMap["end"]();
          }
          return undefined as any;
        }
      );

      await expect(pubDev.getLatestVersion("")).rejects.toBeInstanceOf(
        SyntaxError
      );
    });

    test("Throws on invalid version", async () => {
      getMock.mockImplementationOnce(
        (_url, _options, callback): ClientRequest => {
          if (callback) {
            const onMap: any = {};

            callback({
              statusCode: 200,
              on: (key: string, cb: Function) => {
                onMap[key] = cb;
              },
            } as any);

            onMap["data"](
              JSON.stringify({
                latest: {
                  version: "invalid",
                },
              })
            );
            onMap["end"]();
          }
          return undefined as any;
        }
      );

      await expect(pubDev.getLatestVersion("")).rejects.toEqual(
        Error("Invalid project version: invalid")
      );
    });
  });
});
