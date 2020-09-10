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
const semver_1 = __importStar(require("semver"));
const core_1 = require("@actions/core");
const cider = __importStar(require("../cider"));
const pubDev = __importStar(require("../pubDev"));
const action_1 = require("../action");
jest.mock("../cider");
jest.mock("../pubDev");
jest.mock("@actions/core");
semver_1.default.gt = jest.fn();
const ciderMock = utils_1.mocked(cider, true);
const pubDevMock = utils_1.mocked(pubDev, true);
const gtMock = utils_1.mocked(semver_1.gt, true);
const setOutputMock = utils_1.mocked(core_1.setOutput, true);
const generateReleaseDataMock = jest.fn();
const getLatestVersionMock = jest.fn();
describe("action.ts", () => {
    beforeEach(() => {
        ciderMock.Cider.init.mockReset();
        pubDevMock.PubDev.mockReset();
        gtMock.mockReset();
        setOutputMock.mockReset();
        generateReleaseDataMock.mockReset();
        getLatestVersionMock.mockReset();
        ciderMock.Cider.init.mockResolvedValue({
            projectName: "name",
            projectVersion: new semver_1.SemVer("1.0.0"),
            generateReleaseData: generateReleaseDataMock,
        });
        pubDevMock.PubDev.mockImplementation(() => ({
            getLatestVersion: getLatestVersionMock,
        }));
        getLatestVersionMock.mockResolvedValue(new semver_1.SemVer("1.1.0"));
    });
    describe("runAction", () => {
        test("compares pub.dev with current version", () => __awaiter(void 0, void 0, void 0, function* () {
            yield action_1.runAction({
                srcDir: "dir",
            });
            expect(ciderMock.Cider.init).toHaveBeenCalledWith("dir");
            expect(pubDevMock.PubDev).toHaveBeenCalled();
            expect(getLatestVersionMock).toHaveBeenCalledWith("name");
            expect(gtMock).toHaveBeenCalledWith(new semver_1.SemVer("1.0.0"), new semver_1.SemVer("1.1.0"));
        }));
        test("sets update to false if pub.dev is newer", () => __awaiter(void 0, void 0, void 0, function* () {
            gtMock.mockReturnValueOnce(false);
            yield action_1.runAction({ srcDir: "" });
            expect(setOutputMock).toHaveBeenCalledWith("update" /* update */, false);
        }));
        test("generates release data and sets update to true if pub.dev is newer", () => __awaiter(void 0, void 0, void 0, function* () {
            gtMock.mockReturnValueOnce(true);
            yield action_1.runAction({ srcDir: "" });
            expect(generateReleaseDataMock).toHaveBeenCalledWith(new semver_1.SemVer("1.1.0"));
            expect(setOutputMock).toHaveBeenCalledWith("update" /* update */, true);
        }));
    });
});
