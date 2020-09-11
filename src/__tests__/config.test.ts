import { mocked } from "ts-jest/utils";
import { loadConfig, InKeys, OutKeys } from "../config";
import { getInput } from "@actions/core";
import { parse } from "yaml";
import { promises, existsSync } from "fs";
import { join } from "path";

const { readFile } = promises;

jest.mock("@actions/core");
const loadConfigMock = mocked(getInput, true);

describe("config.ts", () => {
  beforeEach(() => {
    loadConfigMock.mockReset();
  });

  test("keys match action.yml", async () => {
    const actionPath = join(process.cwd(), "action.yml");
    console.debug(actionPath);
    console.debug(existsSync(actionPath));
    const actionData = await readFile(actionPath, "utf-8");
    console.debug(actionData);
    const yamlData = parse(actionData);

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
