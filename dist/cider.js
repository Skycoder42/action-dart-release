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
exports.Cider = void 0;
const exec_1 = require("@actions/exec");
const io_1 = require("@actions/io");
const core_1 = require("@actions/core");
const yaml_1 = require("yaml");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const semver_1 = require("semver");
const child_process_1 = require("child_process");
const util_1 = require("util");
const runCommand = util_1.promisify(child_process_1.exec);
class Cider {
    constructor(ciderPath, projectDir, projectName, projectVersion, projectVersionRaw) {
        this._ciderPath = ciderPath;
        this._projectDir = projectDir;
        this._projectName = projectName;
        this._projectVersion = projectVersion;
        this._projectVersionRaw = projectVersionRaw;
    }
    get projectName() {
        return this._projectName;
    }
    get projectVersion() {
        return this._projectVersion;
    }
    static init(projectDir) {
        return __awaiter(this, void 0, void 0, function* () {
            core_1.debug("Installing cider...");
            const pubPath = yield io_1.which("pub", true);
            yield exec_1.exec(pubPath, ["global", "activate", "cider"]);
            const ciderPath = yield io_1.which("cider", true);
            core_1.debug("Loading project info...");
            const yamlFile = yield promises_1.readFile(path_1.join(projectDir, "pubspec.yaml"), "utf-8");
            const yamlData = yaml_1.parse(yamlFile);
            const version = semver_1.clean(yamlData.version, {
                includePrerelease: false,
                loose: true,
            });
            if (!version) {
                throw Error(`Invalid project version: ${yamlData.version}`);
            }
            return new Cider(ciderPath, projectDir, yamlData.name, new semver_1.SemVer(version), yamlData.version);
        });
    }
    generateReleaseData(oldVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            core_1.setOutput("newVersion" /* newVersion */, this._projectVersion.raw);
            if (this._projectVersion.major > oldVersion.major) {
                core_1.setOutput("title" /* title */, "A new major release is available!");
            }
            else if (this._projectVersion.minor > oldVersion.minor) {
                core_1.setOutput("title" /* title */, "A new minor release is available!");
            }
            else if (this._projectVersion.patch > oldVersion.patch) {
                core_1.setOutput("title" /* title */, "A new patch release is available!");
            }
            else {
                core_1.setOutput("title" /* title */, "A new release is available!");
            }
            const outPath = path_1.join(process.cwd(), "release_body.md");
            const { stdout, } = yield runCommand(`${this._ciderPath} describe [${this._projectVersionRaw}]`, { cwd: this._projectDir });
            yield promises_1.writeFile(outPath, "## Changelog\n" + stdout.split("\n").slice(1).join("\n"));
            core_1.setOutput("bodyPath" /* bodyPath */, outPath);
        });
    }
}
exports.Cider = Cider;
