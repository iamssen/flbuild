///<reference path="./definition/libs.d.ts"/>
var $path = require('path');
var $fs = require('fs');
var xml2js = require('xml2js');
var moment = require('moment');
var Config = (function () {
    function Config(parent) {
        this.parent = parent;
        this.systemEnvironments = {};
        this.libraryDirectories = [];
        this.externalLibraryDirectories = [];
        this.sourceDirectories = [];
        this.args = [];
    }
    Config.prototype.setConfigXml = function (path) {
        this.configXml = path;
    };
    Config.prototype.getConfigXml = function () {
        if (this.configXml) {
            return this.resolvePath(this.configXml);
        }
        else if (this.parent) {
            return this.parent.getConfigXml();
        }
        else {
            return $path.join(this.getEnv('FLEX_HOME'), 'frameworks', 'flex-config.xml');
        }
    };
    Config.prototype.addLibraryDirectory = function (path) {
        this.libraryDirectories.push(path);
    };
    Config.prototype.addExternalLibraryDirectory = function (path) {
        this.externalLibraryDirectories.push(path);
    };
    Config.prototype.addSourceDirectory = function (path) {
        this.sourceDirectories.push(path);
    };
    Config.prototype.addArg = function (arg) {
        this.args.push(arg);
    };
    Config.prototype.getLibraryDirectories = function () {
        var directories = this.libraryDirectories.slice(0);
        if (this.parent)
            directories = directories.concat(this.parent.getLibraryDirectories());
        return directories;
    };
    Config.prototype.getExternalLibraryDirectories = function () {
        var directories = this.externalLibraryDirectories.slice(0);
        if (this.parent)
            directories = directories.concat(this.parent.getExternalLibraryDirectories());
        return directories;
    };
    Config.prototype.getSourceDirectories = function () {
        var directories = this.sourceDirectories.slice(0);
        if (this.parent)
            directories = directories.concat(this.parent.getSourceDirectories());
        return directories;
    };
    Config.prototype.getArgs = function () {
        var args = this.args.slice(0);
        if (this.parent)
            args = args.concat(this.parent.getArgs());
        return args;
    };
    Config.prototype.getLibraries = function () {
        var directories = this.resolvePaths(this.getLibraryDirectories());
        var libraries = [];
        if (directories && directories.length > 0) {
            var f = -1;
            var fmax = directories.length;
            while (++f < fmax) {
                libraries = libraries.concat(Config.getSwcListFromDirectory(directories[f]));
            }
        }
        return libraries;
    };
    Config.prototype.getExternalLibraries = function () {
        var directories = this.resolvePaths(this.getExternalLibraryDirectories());
        var libraries = [];
        if (directories && directories.length > 0) {
            var f = -1;
            var fmax = directories.length;
            while (++f < fmax) {
                libraries = libraries.concat(Config.getSwcListFromDirectory(directories[f]));
            }
        }
        return libraries;
    };
    Config.prototype.getSourcePaths = function () {
        return this.resolvePaths(this.getSourceDirectories());
    };
    Config.prototype.getEnv = function (name) {
        if (this.systemEnvironments[name] !== undefined) {
            return this.systemEnvironments[name];
        }
        else if (this.parent) {
            return this.parent.getEnv(name);
        }
        return undefined;
    };
    Config.prototype.setEnv = function (name, value) {
        if (!value)
            value = process.env[name];
        this.systemEnvironments[name] = value;
    };
    Config.prototype.applyEnv = function (str) {
        for (var name in this.systemEnvironments) {
            if (this.systemEnvironments.hasOwnProperty(name)) {
                var value = this.systemEnvironments[name];
                var reg = new RegExp('\\$' + name, 'g');
                str = str.replace(reg, value);
            }
        }
        if (this.parent)
            str = this.parent.applyEnv(str);
        return str;
    };
    Config.prototype.getSDKVersion = function (done) {
        if (!this.sdkDescription) {
            var sdkDescription = $path.join(this.getEnv('FLEX_HOME'), 'flex-sdk-description.xml');
            var xmlstr = $fs.readFileSync(sdkDescription, { encoding: 'utf8' });
            xml2js.parseString(xmlstr, function (err, result) {
                this.sdkDescription = result['flex-sdk-description'];
                done(this.sdkDescription['version'][0]);
            }.bind(this));
        }
        else {
            done(this.sdkDescription['version'][0]);
        }
    };
    Config.isVersionHigher = function (version1, version2) {
        var v1 = version1.split('.');
        var v2 = version2.split('.');
        return Number(v1[0]) > Number(v2[0]) || Number(v1[1]) > Number(v2[1]) || Number(v1[2]) > Number(v1[2]);
    };
    Config.prototype.resolvePath = function (path) {
        path = this.applyEnv(path);
        return $path.resolve(path);
    };
    Config.prototype.resolvePaths = function (paths) {
        var newPaths = [];
        var f = -1;
        var fmax = paths.length;
        while (++f < fmax) {
            newPaths.push(this.resolvePath(paths[f]));
        }
        return newPaths;
    };
    Config.isWindow = function () {
        return process.platform.indexOf('win') === 0;
    };
    Config.wrapPath = function (path) {
        path = Config.fixPath(path);
        path = "\"" + path + "\"";
        return path;
    };
    Config.fixPath = function (path) {
        return Config.isWindow() ? path.replace(/\//g, "\\") : path;
    };
    Config.getSwcListFromDirectory = function (path) {
        var swcs = [];
        if ($fs.existsSync(path)) {
            var files = $fs.readdirSync(path);
            var file;
            var f = -1;
            var fmax = files.length;
            while (++f < fmax) {
                file = files[f];
                if (file.lastIndexOf('.swc') > -1) {
                    swcs.push($path.join(path, file));
                }
            }
        }
        return swcs;
    };
    Config.getTime = function () {
        return moment().format('YYYY.MM.DD.HH.mm.ss');
    };
    Config.classfy = function (file) {
        var classpath = file.relative_base.split('/').join('.') + '.' + file.name;
        if (classpath.charAt(0) === '.')
            classpath = classpath.substr(1);
        return classpath;
    };
    Config.addPaths = function (compiler, category, paths) {
        if (paths.length > 0) {
            if (!compiler[category])
                compiler[category] = {};
            if (!compiler[category]['path-element'])
                compiler[category]['path-element'] = [];
            var f = -1;
            var fmax = paths.length;
            while (++f < fmax) {
                compiler[category]['path-element'].push(Config.fixPath(paths[f]));
            }
        }
    };
    Config.prototype.getConfig = function (complete) {
        var config = {};
        if (!config['flex-config'])
            config['flex-config'] = {};
        if (!config['flex-config']['compiler'])
            config['flex-config']['compiler'] = {};
        Config.addPaths(config['flex-config']['compiler'], 'library-path', this.getLibraries());
        Config.addPaths(config['flex-config']['compiler'], 'external-library-path', this.getExternalLibraries());
        Config.addPaths(config['flex-config']['compiler'], 'source-path', this.getSourcePaths());
        complete(config);
    };
    Config.prototype.createConfig = function (complete) {
        this.getConfig(function (config) {
            var xml = new xml2js.Builder().buildObject(config);
            var cacheDirectory = $path.resolve('.flbuild-cache');
            if (!$fs.existsSync(cacheDirectory))
                $fs.mkdirSync(cacheDirectory);
            var xmlFile = $path.join(cacheDirectory, "config-" + Config.getTime() + ".xml");
            $fs.writeFileSync(xmlFile, xml, { encoding: 'utf8' });
            complete(xmlFile);
        }.bind(this));
    };
    return Config;
})();
exports.Config = Config;
//# sourceMappingURL=Config.js.map