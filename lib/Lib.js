///<reference path="./definition/libs.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var picker = require('file-picker');
var yaml = require('js-yaml');
var xml2js = require('xml2js');
var $path = require('path');
var $fs = require('fs');
var Config = require('./Config');
var Lib = (function (_super) {
    __extends(Lib, _super);
    function Lib(config) {
        _super.call(this, config);
    }
    Lib.prototype.getManifest = function (classPaths, callback) {
        var sourceDirectories = this.getSourcePaths();
        picker.pick(sourceDirectories, ['.yaml'], function (files) {
            var namespaces = {};
            files.forEach(function (file) {
                if (file.name !== 'namespace')
                    return;
                var namespaceYaml = yaml.safeLoad($fs.readFileSync(file.realpath, 'utf8'));
                var base_namespace = file.relative_base.split('/').join('.');
                namespaceYaml.components.forEach(function (component) {
                    var component_path = base_namespace + "." + component;
                    if (classPaths.indexOf(component_path) > -1) {
                        if (component_path.indexOf('.') === 0)
                            component_path = component_path.substring(1);
                        if (!namespaces[namespaceYaml.namespace])
                            namespaces[namespaceYaml.namespace] = [];
                        namespaces[namespaceYaml.namespace].push({
                            name: component,
                            path: component_path
                        });
                    }
                });
            }.bind(this));
            callback(namespaces);
        }.bind(this));
    };
    Lib.prototype.getIncludeClasses = function (callback) {
        var sourceDirectories = this.getSourcePaths();
        picker.pick(sourceDirectories, ['.as', '.mxml'], function (files) {
            var classPaths = [];
            files.forEach(function (file) {
                var asclass = file;
                asclass.classpath = Config.classfy(file);
                if (this.filterFunction === null || this.filterFunction(asclass)) {
                    classPaths.push(asclass.classpath);
                }
            }.bind(this));
            callback(classPaths);
        }.bind(this));
    };
    Lib.prototype.createManifest = function (components) {
        var manifest = { componentPackage: { component: [] } };
        components.forEach(function (component) {
            manifest['componentPackage']['component'].push({
                '$': {
                    'id': component.name,
                    'class': component.path
                }
            });
        });
        var xml = new xml2js.Builder({ attrkey: '$' }).buildObject(manifest);
        var cacheDirectory = $path.resolve('.flbuild-cache');
        if (!$fs.existsSync(cacheDirectory))
            $fs.mkdirSync(cacheDirectory);
        var xmlFile = $path.join(cacheDirectory, "manifest-" + (Math.random() * 1000000) + ".xml");
        console.log('Lib.ts..createManifest()', xml);
        $fs.writeFileSync(xmlFile, xml, { encoding: 'utf8' });
        return xmlFile;
    };
    Lib.prototype.getConfig = function (complete) {
        _super.prototype.getConfig.call(this, function (config) {
            this.getIncludeClasses(function (classPaths) {
                // TODO 여기...
                if (!config['flex-config'])
                    config['flex-config'] = {};
                if (!config['flex-config']['include-classes'])
                    config['flex-config']['include-classes'] = {};
                if (!config['flex-config']['include-classes']['class'])
                    config['flex-config']['include-classes']['class'] = [];
                classPaths.forEach(function (classPath) {
                    config['flex-config']['include-classes']['class'].push(classPath);
                });
                // flex-config.include-classes
                //      class[]
                this.getManifest(classPaths, function (namespaces) {
                    // TODO 여기...
                    if (!config['flex-config'])
                        config['flex-config'] = {};
                    if (!config['flex-config']['compiler'])
                        config['flex-config']['compiler'] = {};
                    for (var namespace in namespaces) {
                        if (namespaces.hasOwnProperty(namespace)) {
                            var components = namespaces[namespace];
                            var manifest = this.createManifest(components);
                            if (!config['flex-config']['compiler']['namespaces'])
                                config['flex-config']['compiler']['namespaces'] = { namespace: [] };
                            config['flex-config']['compiler']['namespaces']['namespace'].push({
                                uri: namespace,
                                manifest: manifest
                            });
                            if (!config['flex-config']['include-namespaces'])
                                config['flex-config']['include-namespaces'] = { uri: [] };
                            config['flex-config']['include-namespaces']['uri'].push(namespace);
                        }
                    }
                    // flex-config.compiler.namespaces
                    //     namespace[]
                    //          uri
                    //          manifest
                    // flex-config.include-namespaces
                    //     uri[]
                    complete(config);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    };
    Lib.prototype.createBuildCommand = function (swcPath, complete) {
        var bin = 'compc';
        this.getSDKVersion(function (version) {
            this.createConfig(function (xml) {
                var args = [];
                // mxmlc
                if (Config.isWindow())
                    bin = Config.isVersionHigher(version, '4.6.0') ? 'compc.bat' : 'compc.exe';
                args.push(Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)));
                // mxml
                //args.push(Config.wrapPath(this.resolvePath(mxmlPath)))
                // load-config local
                args.push("-load-config+=" + Config.wrapPath(xml));
                // merge args
                this.getArgs().forEach(function (arg) {
                    args.push(this.applyEnv(arg));
                }.bind(this));
                swcPath = Config.wrapPath(this.resolvePath(swcPath));
                //// link-report
                //args.push(`-link-report ${swfPath.replace('.swf', '.xml')}`)
                //
                //// size-report
                //args.push(`-size-report ${swfPath.replace('.swf', '.size.xml')}`)
                // swf
                args.push("-output " + swcPath);
                complete(args.join(' '));
            }.bind(this));
        }.bind(this));
    };
    return Lib;
})(Config);
module.exports = Lib;
//# sourceMappingURL=Lib.js.map