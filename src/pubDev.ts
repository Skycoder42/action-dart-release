import { get } from "https";
import { debug, info } from "@actions/core";
import { clean, SemVer } from "semver";

export class PubDev {
  async getLatestVersion(packageName: string): Promise<SemVer | null> {
    return new Promise<SemVer | null>((resolve, reject) => {
      debug(`Getting latest verions of ${packageName} on pub.dev...`);
      get(
        `https://pub.dev/api/packages/${packageName}`,
        {
          headers: {
            Accept: "application/vnd.pub.v2+json",
          },
        },
        (response) => {
          if (response.statusCode === 404) {
            info(
              "Package has not been published yet - creating initial release"
            );
            resolve(null);
          }
          if ((response.statusCode ?? 400) >= 300) {
            reject(new Error(response.statusMessage));
            return;
          }

          response.on("error", (e) => reject(e));

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
              debug(`Found package version as ${version}`);
              resolve(new SemVer(version));
            } catch (e) {
              reject(e);
            }
          });
        }
      );
    });
  }
}
