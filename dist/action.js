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
const cider_1 = require("./cider");
const pubDev_1 = require("./pubDev");
const semver_1 = require("semver");
const runAction = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const cider = yield cider_1.Cider.init(config.srcDir);
    const pubDev = new pubDev_1.PubDev();
    const pubVersion = yield pubDev.getLatestVersion(cider.projectName);
    if (!pubVersion || semver_1.gt(cider.projectVersion, pubVersion)) {
        core_1.info("Pub.Dev is outdated - generating new release.");
        yield cider.generateReleaseData(pubVersion);
        core_1.setOutput("update" /* update */, true);
    }
    else {
        core_1.info("Pub.Dev is up to date - no new release required.");
        core_1.setOutput("update" /* update */, false);
    }
});
exports.runAction = runAction;
