"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PubDev = void 0;
const https_1 = require("https");
const core_1 = require("@actions/core");
const semver_1 = require("semver");
class PubDev {
    getLatestVersion(packageName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                (0, core_1.debug)(`Getting latest verions of ${packageName} on pub.dev...`);
                (0, https_1.get)(`https://pub.dev/api/packages/${packageName}`, {
                    headers: {
                        Accept: "application/vnd.pub.v2+json",
                        "Accept-Encoding": "identity",
                    },
                }, (response) => {
                    var _a;
                    if (response.statusCode === 404) {
                        (0, core_1.info)("Package has not been published yet - creating initial release");
                        resolve(null);
                    }
                    if (((_a = response.statusCode) !== null && _a !== void 0 ? _a : 400) >= 300) {
                        reject(new Error(response.statusMessage));
                        return;
                    }
                    response.on("error", (e) => reject(e));
                    const chunks = [];
                    response.on("data", (chunk) => chunks.push(chunk));
                    response.on("end", () => {
                        try {
                            const data = JSON.parse(chunks.join(""));
                            const version = (0, semver_1.clean)(data.latest.version, {
                                loose: true,
                                includePrerelease: false,
                            });
                            if (!version) {
                                throw Error(`Invalid project version: ${data.latest.version}`);
                            }
                            (0, core_1.debug)(`Found package version as ${version}`);
                            resolve(new semver_1.SemVer(version));
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                });
            });
        });
    }
}
exports.PubDev = PubDev;
