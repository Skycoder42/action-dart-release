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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
const path_1 = require("path");
const semver_1 = require("semver");
const yaml_1 = require("yaml");
const fs_1 = require("fs");
const { readFile } = fs_1.promises;
var ParserState;
(function (ParserState) {
    ParserState[ParserState["Searching"] = 0] = "Searching";
    ParserState[ParserState["CheckingHeader"] = 1] = "CheckingHeader";
    ParserState[ParserState["DrainingHeader"] = 2] = "DrainingHeader";
    ParserState[ParserState["Collecting"] = 3] = "Collecting";
    ParserState[ParserState["Done"] = 4] = "Done";
})(ParserState || (ParserState = {}));
class Package {
    constructor(projectDir) {
        this.projectDir = projectDir;
    }
    loadInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const yamlFile = yield readFile((0, path_1.join)(this.projectDir, "pubspec.yaml"), "utf-8");
            const yamlData = (0, yaml_1.parse)(yamlFile);
            const version = (0, semver_1.clean)(yamlData.version, {
                includePrerelease: false,
                loose: true,
            });
            if (!version) {
                throw Error(`Invalid project version: ${yamlData.version}`);
            }
            return {
                name: yamlData.name,
                version: new semver_1.SemVer(version),
            };
        });
    }
    loadChangelog(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const changelogContent = yield readFile((0, path_1.join)(this.projectDir, "CHANGELOG.md"), "utf-8");
            const versionAst = this.parseChangelog(changelogContent, version);
            const lines = this.findLines(versionAst);
            const versionContent = this.extractLines(changelogContent, ...lines);
            return versionContent;
        });
    }
    parseChangelog(changelogContent, version) {
        const md = new markdown_it_1.default();
        const ast = md.parse(changelogContent, {});
        let parserState = ParserState.Searching;
        let versionTokens = [];
        for (const token of ast) {
            if (parserState == ParserState.Done) {
                break;
            }
            switch (parserState) {
                case ParserState.Searching:
                    if (token.type == "heading_open" && token.tag === "h2") {
                        parserState = ParserState.CheckingHeader;
                    }
                    break;
                case ParserState.CheckingHeader:
                    if (token.type === "inline" &&
                        token.content.trim().startsWith(`[${version.version}]`)) {
                        parserState = ParserState.DrainingHeader;
                    }
                    else if (token.type == "heading_close" && token.tag === "h2") {
                        parserState = ParserState.Searching;
                    }
                    break;
                case ParserState.DrainingHeader:
                    if (token.type == "heading_close" && token.tag === "h2") {
                        parserState = ParserState.Collecting;
                    }
                    break;
                case ParserState.Collecting:
                    if (token.type == "heading_open" && token.tag === "h2") {
                        parserState = ParserState.Done;
                    }
                    else {
                        versionTokens.push(token);
                    }
                    break;
            }
        }
        if (versionTokens.length === 0) {
            throw new Error(`Unabled to find version ${version.version} in changelog.`);
        }
        return versionTokens;
    }
    findLines(tokens) {
        let start = Number.MAX_SAFE_INTEGER;
        let end = -1;
        for (const token of tokens) {
            if (token.map) {
                start = Math.min(start, token.map[0]);
                end = Math.max(end, token.map[1]);
            }
        }
        return [start, end];
    }
    extractLines(content, start, end) {
        return content.split("\n").slice(start, end).join("\n").trim() + "\n";
    }
}
exports.Package = Package;
