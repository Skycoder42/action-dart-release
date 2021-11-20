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
const core_1 = require("@actions/core");
const config_1 = require("./config");
const action_1 = require("./action");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = (0, config_1.loadConfig)();
        yield (0, action_1.runAction)(config);
    }
    catch (e) {
        (0, core_1.error)(e);
        (0, core_1.setFailed)(e);
    }
});
run();
