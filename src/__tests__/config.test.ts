import { mocked } from "ts-jest/utils";
import { loadConfig, InKeys, OutKeys } from "../config";
import { getInput } from "@actions/core";
import { parse } from "yaml";
import { promises } from "fs";

const { readFile } = promises;

jest.mock("@actions/core");
const loadConfigMock = mocked(getInput, true);

describe("config.ts", () => {
  beforeEach(() => {
    loadConfigMock.mockReset();
  });

  test("keys match action.yml", async () => {
    console.warn(process.env);
    console.warn(process.cwd());
    const yamlData = parse(await readFile("action.yml", "utf-8"));

    const inputs = Object.keys(yamlData.inputs);
    expect(inputs).toHaveLength(1);
    expect(inputs).toContain(InKeys.srcDir);

    const outputs = Object.keys(yamlData.outputs);
    expect(outputs).toHaveLength(4);
    expect(outputs).toContain(OutKeys.update);
    expect(outputs).toContain(OutKeys.newVersion);
    expect(outputs).toContain(OutKeys.title);
    expect(outputs).toContain(OutKeys.bodyPath);
  });

  test("loadConfig creates correct config", () => {
    loadConfigMock.mockReturnValueOnce("src");

    const config = loadConfig();
    expect(config.srcDir).toBe("src");
    expect(loadConfigMock).toHaveBeenCalledWith(InKeys.srcDir);
  });

  test("loadConfig uses correct defaults", () => {
    const config = loadConfig();
    expect(config.srcDir).toBe(process.cwd());
    expect(loadConfigMock).toHaveBeenCalledWith(InKeys.srcDir);
  });
});
