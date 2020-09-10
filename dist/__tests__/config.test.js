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
const config_1 = require("../config");
const core_1 = require("@actions/core");
const yaml_1 = require("yaml");
const promises_1 = require("fs/promises");
jest.mock("@actions/core");
const loadConfigMock = utils_1.mocked(core_1.getInput, true);
describe("config.ts", () => {
    beforeEach(() => {
        loadConfigMock.mockReset();
    });
    test("keys match action.yml", () => __awaiter(void 0, void 0, void 0, function* () {
        const yamlData = yaml_1.parse(yield promises_1.readFile("action.yml", "utf-8"));
        const inputs = Object.keys(yamlData.inputs);
        expect(inputs).toHaveLength(1);
        expect(inputs).toContain("src-dir" /* srcDir */);
        const outputs = Object.keys(yamlData.outputs);
        expect(outputs).toHaveLength(4);
        expect(outputs).toContain("update" /* update */);
        expect(outputs).toContain("new-version" /* newVersion */);
        expect(outputs).toContain("title" /* title */);
        expect(outputs).toContain("body-path" /* bodyPath */);
    }));
    test("loadConfig creates correct config", () => {
        loadConfigMock.mockReturnValueOnce("src");
        const config = config_1.loadConfig();
        expect(config.srcDir).toBe("src");
        expect(loadConfigMock).toHaveBeenCalledWith("src-dir", { required: true });
    });
});
