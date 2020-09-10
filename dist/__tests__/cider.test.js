"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const utils_1 = require("ts-jest/utils");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const child_process_1 = require("child_process");
const core_1 = require("@actions/core");
const io_1 = require("@actions/io");
const exec_1 = require("@actions/exec");
const yaml_1 = require("yaml");
const semver_1 = __importStar(require("semver"));
const cider_1 = require("../cider");
jest.mock("@actions/core");
jest.mock("@actions/io");
jest.mock("@actions/exec");
jest.mock("fs/promises");
jest.mock("child_process");
jest.mock("yaml");
semver_1.default.clean = jest.fn();
const whichMock = utils_1.mocked(io_1.which, true);
const execMock = utils_1.mocked(exec_1.exec, true);
const readFileMock = utils_1.mocked(promises_1.readFile, true);
const writeFileMock = utils_1.mocked(promises_1.writeFile, true);
const parseMock = utils_1.mocked(yaml_1.parse, true);
const cleanMock = utils_1.mocked(semver_1.clean, true);
const setOutputMock = utils_1.mocked(core_1.setOutput, true);
const execCBMock = utils_1.mocked(child_process_1.exec, true);
describe("cider.ts", () => {
    beforeEach(() => {
        whichMock.mockReset();
        execMock.mockReset();
        readFileMock.mockReset();
        writeFileMock.mockReset();
        parseMock.mockReset();
        cleanMock.mockReset();
        setOutputMock.mockReset();
        execCBMock.mockReset();
        readFileMock.mockResolvedValue("");
        parseMock.mockReturnValue({
            version: "1.0.0",
        });
        cleanMock.mockReturnValue("1.0.0");
        execCBMock.mockImplementation((_command, _options, callback) => {
            if (callback) {
                callback(null, "", "");
            }
        });
    });
    describe("init", () => {
        test("installs cider", () => __awaiter(void 0, void 0, void 0, function* () {
            whichMock.mockResolvedValueOnce("pub.run");
            yield cider_1.Cider.init("");
            expect(whichMock).toHaveBeenCalledWith("pub", true);
            expect(execMock).toHaveBeenCalledWith("pub.run", [
                "global",
                "activate",
                "cider",
            ]);
            expect(whichMock).toHaveBeenCalledWith("cider", true);
        }));
        test("reads project info from yaml", () => __awaiter(void 0, void 0, void 0, function* () {
            readFileMock.mockResolvedValueOnce("path.yml");
            parseMock.mockReturnValueOnce({
                name: "project",
                version: "1.2.3",
            });
            cleanMock.mockReturnValueOnce("1.2.3");
            yield cider_1.Cider.init("dir");
            expect(readFileMock).toHaveBeenCalledWith(path_1.join("dir", "pubspec.yaml"), "utf-8");
            expect(parseMock).toHaveBeenCalledWith("path.yml");
            expect(cleanMock).toHaveBeenCalledWith("1.2.3", {
                includePrerelease: false,
                loose: true,
            });
        }));
        test("Throws error for invalid project version", () => __awaiter(void 0, void 0, void 0, function* () {
            parseMock.mockReturnValueOnce({
                version: "invalid",
            });
            cleanMock.mockReturnValueOnce(null);
            yield expect(cider_1.Cider.init("dir")).rejects.toEqual(new Error("Invalid project version: invalid"));
        }));
        test("Returns initialized cider instance", () => __awaiter(void 0, void 0, void 0, function* () {
            parseMock.mockReturnValueOnce({
                name: "NAME",
            });
            cleanMock.mockReturnValueOnce("1.1.1");
            const cider = yield cider_1.Cider.init("");
            expect(cider.projectName).toBe("NAME");
            expect(cider.projectVersion).toEqual(new semver_1.SemVer("1.1.1"));
        }));
    });
    describe("generateReleaseData", () => {
        const testData = [
            ["2.0.0", "A new major release is available!"],
            ["1.2.0", "A new minor release is available!"],
            ["1.0.2", "A new patch release is available!"],
            ["1.0.0", "A new release is available!"],
        ];
        for (const [version, title] of testData) {
            test(`sets version and title output [${version}]`, () => __awaiter(void 0, void 0, void 0, function* () {
                parseMock.mockReturnValueOnce({
                    version: version,
                });
                cleanMock.mockReturnValueOnce(version);
                const cider = yield cider_1.Cider.init("");
                yield cider.generateReleaseData(new semver_1.SemVer("1.0.0"));
                expect(setOutputMock).toHaveBeenCalledWith("tag_name" /* newVersion */, version);
                expect(setOutputMock).toHaveBeenCalledWith("release_name" /* title */, title);
            }));
        }
        test("write release body", () => __awaiter(void 0, void 0, void 0, function* () {
            whichMock.mockResolvedValue("cider.run");
            parseMock.mockReturnValueOnce({
                version: "2.0.0",
            });
            execCBMock.mockImplementationOnce((_command, _options, callback) => {
                if (callback) {
                    callback(null, "line1\nline2\nline3\n", "");
                }
            });
            const cider = yield cider_1.Cider.init("dir");
            yield cider.generateReleaseData(new semver_1.SemVer("1.0.0"));
            expect(execCBMock).toHaveBeenCalledWith("cider.run describe [2.0.0]", { cwd: "dir" }, expect.any(Function));
            expect(writeFileMock).toHaveBeenCalledWith(path_1.join(process.cwd(), "release_body.md"), "## Changelog\nline2\nline3\n");
            expect(setOutputMock).toHaveBeenCalledWith("body_path" /* bodyPath */, path_1.join(process.cwd(), "release_body.md"));
        }));
    });
});
