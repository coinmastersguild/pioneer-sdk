"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("@internal/config");
var path_1 = require("path");
var package_json_1 = require("./package.json");
var external = Object.keys(package_json_1.peerDependencies);
var viteConfig = (0, config_1.default)(package_json_1.name, {
    build: {
        lib: {
            entry: (0, path_1.resolve)(__dirname, 'src/index.ts'),
        },
        rollupOptions: {
            external: external,
        },
    },
});
exports.default = viteConfig;
