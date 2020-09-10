import { get } from "https";
import { debug } from "@actions/core";
import { clean, SemVer } from "semver";

export class PubDev {
  async getLatestVersion(packageName: string): Promise<SemVer> {
    return new Promise<SemVer>((res, rej) => {
      debug(`Getting latest verions of ${packageName} on pub.dev...`);
      get(
        `https://pub.dev/api/packages/${packageName}`,
        {
          headers: {
            Accept: "application/vnd.pub.v2+json",
          },
        },
        (response) => {
          if ((response.statusCode ?? 400) >= 300) {
            rej(new Error(response.statusMessage));
            return;
          }

          response.on("error", (e) => rej(e));

          const chunks: any[] = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => {
            try {
              const data = JSON.parse(chunks.join(""));
              const version = clean(data.latest.version, {
                loose: true,
                includePrerelease: false,
              });
              if (!version) {
                throw Error(`Invalid project version: ${data.latest.version}`);
              }
              res(new SemVer(version));
            } catch (e) {
              rej(e);
            }
          });
        }
      );
    });
  }
}
