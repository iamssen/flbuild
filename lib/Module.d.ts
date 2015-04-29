/// <reference path="definition/libs.d.ts" />
import Config = require('./Config');
declare class Module extends Config {
    constructor(config: Config);
    createBuildCommand(appReportPath: string, mxmlPath: string, swfPath: string, complete: (command: string) => void): void;
}
export = Module;
