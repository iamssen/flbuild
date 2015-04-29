/// <reference path="definition/libs.d.ts" />
import Config = require('./Config');
declare class App extends Config {
    constructor(config: Config);
    createBuildCommand(mxmlPath: string, swfPath: string, complete: (command: string) => void): void;
}
export = App;
