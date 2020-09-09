"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const core_1 = require("@actions/core");
exports.loadConfig = () => {
    const config = {
        srcDir: core_1.getInput("src-dir", { required: true }),
    };
    core_1.debug(`Using config: ${JSON.stringify(config, undefined, 2)}`);
    return config;
};
