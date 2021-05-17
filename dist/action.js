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
exports.runAction = void 0;
const core_1 = require("@actions/core");
const pubDev_1 = require("./pubDev");
const semver_1 = require("semver");
const path_1 = require("path");
const fs_1 = require("fs");
const package_1 = require("./package");
const { writeFile } = fs_1.promises;
const runAction = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const pkg = new package_1.Package(config.srcDir);
    const pubDev = new pubDev_1.PubDev();
    const pkgInfo = yield pkg.loadInfo();
    const pubVersion = yield pubDev.getLatestVersion(pkgInfo.name);
    if (!pubVersion || semver_1.gt(pkgInfo.version, pubVersion)) {
        core_1.info("Pub.Dev is outdated - generating new release.");
        const changelog = yield pkg.loadChangelog(pkgInfo.version);
        yield createRelease(pubVersion, pkgInfo.version, changelog);
    }
    else {
        core_1.info("Pub.Dev is up to date - no new release required.");
        core_1.setOutput("update" /* update */, false);
    }
});
exports.runAction = runAction;
const createRelease = (oldVersion, newVersion, changelog) => __awaiter(void 0, void 0, void 0, function* () {
    core_1.setOutput("tag_name" /* newVersion */, newVersion.version);
    if (oldVersion && newVersion.major > oldVersion.major) {
        core_1.setOutput("release_name" /* title */, "A new major release is available!");
    }
    else if (oldVersion && newVersion.minor > oldVersion.minor) {
        core_1.setOutput("release_name" /* title */, "A new minor release is available!");
    }
    else if (oldVersion && newVersion.patch > oldVersion.patch) {
        core_1.setOutput("release_name" /* title */, "A new patch release is available!");
    }
    else {
        core_1.setOutput("release_name" /* title */, "A new release is available!");
    }
    const outPath = path_1.join(process.cwd(), "release_body.md");
    yield writeFile(outPath, "## Changelog\n" + changelog, "utf-8");
    core_1.setOutput("body_path" /* bodyPath */, outPath);
    core_1.setOutput("update" /* update */, true);
});
