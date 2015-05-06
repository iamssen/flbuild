/// <reference path="definition/libs.d.ts" />
import picker = require('file-picker');
declare class Config {
    private parent;
    private systemEnvironments;
    private libraryDirectories;
    private externalLibraryDirectories;
    private sourceDirectories;
    private args;
    private sdkDescription;
    private configXml;
    constructor(parent?: Config);
    setConfigXml(path: string): void;
    getConfigXml(): string;
    addLibraryDirectory(path: string): void;
    addExternalLibraryDirectory(path: string): void;
    addSourceDirectory(path: string): void;
    addArg(arg: string): void;
    getLibraryDirectories(): string[];
    getExternalLibraryDirectories(): string[];
    getSourceDirectories(): string[];
    getArgs(): string[];
    private getLibraries();
    private getExternalLibraries();
    protected getSourcePaths(): string[];
    getEnv(name: string): string;
    setEnv(name: string, value?: string): void;
    protected applyEnv(str: string): string;
    protected getSDKVersion(done: (string) => void): void;
    static isVersionHigher(version1: string, version2: string): boolean;
    /**
     * Convert env strings and relative file path to absolute file path
     * @param path File path
     * @returns {string} Converted file path
     */
    protected resolvePath(path: string): string;
    /** resolvePath() */
    protected resolvePaths(paths: string[]): string[];
    static isWindow(): boolean;
    /** Convert `path` to `"path"` for execute safty in command line */
    static wrapPath(path: string): string;
    /** Convert directory string `/` to `\\` if os is windows */
    static fixPath(path: string): string;
    static getSwcListFromDirectory(path: string): string[];
    static getTime(): string;
    /** Create class path `name.space.Class` from `name/space/Class.as` */
    static classfy(file: picker.File): string;
    private static addPaths(compiler, category, paths);
    protected getConfig(complete: (config: Object) => void): void;
    createConfig(complete: (xmlFile: string) => void): void;
}
export = Config;
