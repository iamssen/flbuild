/// <reference path="../src/definition/libs.d.ts" />
import { Config } from './Config';
export declare class Module extends Config {
    constructor(config: Config);
    createBuildCommand(appReportPath: string, mxmlPath: string, swfPath: string, complete: (command: string) => void): void;
}
