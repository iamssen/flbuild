/// <reference path="../src/definition/libs.d.ts" />
import { Config } from './Config';
export declare class App extends Config {
    constructor(config: Config);
    createBuildCommand(mxmlPath: string, swfPath: string, complete: (command: string) => void): void;
}
