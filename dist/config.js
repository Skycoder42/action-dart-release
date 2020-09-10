"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const core_1 = require("@actions/core");
exports.loadConfig = () => {
    const config = {
        srcDir: getInputWithDefault("src_dir" /* srcDir */, process.cwd()),
    };
    core_1.debug(`Using config: ${JSON.stringify(config, undefined, 2)}`);
    return config;
};
const getInputWithDefault = (key, defaultValue) => {
    const value = core_1.getInput(key);
    return value ? value : defaultValue;
};
