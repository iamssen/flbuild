/// <reference path="definition/libs.d.ts" />
import Config = require('./Config');
declare class Lib extends Config {
    constructor(config: Config);
    filterFunction: (asclass: ASClass) => boolean;
    private getManifest(classPaths, callback);
    private getIncludeClasses(callback);
    private createManifest(components);
    protected getConfig(complete: (config: Object) => void): void;
    createBuildCommand(swcPath: string, complete: (command: string) => void): void;
}
export = Lib;
