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
const utils_1 = require("ts-jest/utils");
const https_1 = require("https");
const pubDev_1 = require("../pubDev");
const semver_1 = require("semver");
jest.mock("https");
const getMock = utils_1.mocked(https_1.get, true);
describe("pubDev.ts", () => {
    beforeEach(() => {
        getMock.mockReset();
    });
    const pubDev = new pubDev_1.PubDev();
    describe("getLatestVersion", () => {
        test("Sends API request with correct package", () => {
            const pubDev = new pubDev_1.PubDev();
            pubDev.getLatestVersion("test_package");
            expect(https_1.get).toHaveBeenCalledWith("https://pub.dev/api/packages/test_package", {
                headers: {
                    Accept: "application/vnd.pub.v2+json",
                },
            }, expect.any(Function));
        });
        test("Returns valid version for valid request", () => __awaiter(void 0, void 0, void 0, function* () {
            getMock.mockImplementationOnce((_url, _options, callback) => {
                if (callback) {
                    const onMap = {};
                    callback({
                        statusCode: 200,
                        on: (key, cb) => {
                            onMap[key] = cb;
                        },
                    });
                    const jData = JSON.stringify({
                        latest: {
                            version: "1.2.3",
                        },
                    });
                    onMap["data"](jData.slice(0, 10));
                    onMap["data"](jData.slice(10));
                    onMap["end"]();
                }
                return undefined;
            });
            expect(yield pubDev.getLatestVersion("")).toEqual(new semver_1.SemVer("1.2.3"));
        }));
        test("Forwards error for invalid status-code", () => __awaiter(void 0, void 0, void 0, function* () {
            getMock.mockImplementationOnce((_url, _options, callback) => {
                if (callback) {
                    callback({
                        statusCode: 404,
                        statusMessage: "NOT FOUND",
                    });
                }
                return undefined;
            });
            yield expect(pubDev.getLatestVersion("")).rejects.toEqual(Error("NOT FOUND"));
        }));
        test("Forwards errors of on error handler", () => __awaiter(void 0, void 0, void 0, function* () {
            getMock.mockImplementationOnce((_url, _options, callback) => {
                if (callback) {
                    callback({
                        statusCode: 200,
                        on: (key, cb) => {
                            if (key === "error") {
                                cb(new Error("ERROR"));
                            }
                        },
                    });
                }
                return undefined;
            });
            yield expect(pubDev.getLatestVersion("")).rejects.toEqual(Error("ERROR"));
        }));
        test("Forwards JSON parsing errors", () => __awaiter(void 0, void 0, void 0, function* () {
            getMock.mockImplementationOnce((_url, _options, callback) => {
                if (callback) {
                    const onMap = {};
                    callback({
                        statusCode: 200,
                        on: (key, cb) => {
                            onMap[key] = cb;
                        },
                    });
                    onMap["data"]("junk");
                    onMap["end"]();
                }
                return undefined;
            });
            yield expect(pubDev.getLatestVersion("")).rejects.toBeInstanceOf(SyntaxError);
        }));
        test("Throws on invalid version", () => __awaiter(void 0, void 0, void 0, function* () {
            getMock.mockImplementationOnce((_url, _options, callback) => {
                if (callback) {
                    const onMap = {};
                    callback({
                        statusCode: 200,
                        on: (key, cb) => {
                            onMap[key] = cb;
                        },
                    });
                    onMap["data"](JSON.stringify({
                        latest: {
                            version: "invalid",
                        },
                    }));
                    onMap["end"]();
                }
                return undefined;
            });
            yield expect(pubDev.getLatestVersion("")).rejects.toEqual(Error("Invalid project version: invalid"));
        }));
    });
});
