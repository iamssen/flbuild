/// <reference path="../src/definition/libs.d.ts" />
import { Config } from './Config';
export declare class Lib extends Config {
    constructor(config: Config);
    filterFunction: (asclass: ASClass) => boolean;
    private getManifest(classPaths, callback);
    private getIncludeClasses(callback);
    private static createManifest(components, namespace);
    protected getConfig(complete: (config: Object) => void): void;
    createBuildCommand(swcPath: string, complete: (command: string) => void): void;
}
