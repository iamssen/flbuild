///<reference path="./definition/libs.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var picker = require('file-picker');
var yaml = require('js-yaml');
var xml2js = require('xml2js');
var $path = require('path');
var $fs = require('fs');
var Config_1 = require('./Config');
var Lib = (function (_super) {
    __extends(Lib, _super);
    function Lib(config) {
        _super.call(this, config);
    }
    Lib.prototype.getManifest = function (classPaths, callback) {
        var sourceDirectories = this.getSourcePaths();
        picker.pick(sourceDirectories, ['.yaml'], function (files) {
            var namespaces = {};
            var f = -1;
            var fmax = files.length;
            var s;
            var smax;
            while (++f < fmax) {
                var file = files[f];
                if (file.name !== 'namespace')
                    continue;
                var namespaceYaml = yaml.safeLoad($fs.readFileSync(file.realpath, 'utf8'));
                var base_namespace = file.relative_base.split('/').join('.');
                s = -1;
                smax = namespaceYaml.components.length;
                while (++s < smax) {
                    var component = namespaceYaml.components[s];
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
                }
            }
            callback(namespaces);
        }.bind(this));
    };
    Lib.prototype.getIncludeClasses = function (callback) {
        var sourceDirectories = this.getSourcePaths();
        picker.pick(sourceDirectories, ['.as', '.mxml'], function (files) {
            var classPaths = [];
            var f = -1;
            var fmax = files.length;
            var file;
            while (++f < fmax) {
                file = files[f];
                var asclass = file;
                asclass.classpath = Config_1.Config.classfy(file);
                if (!this.filterFunction || this.filterFunction(asclass)) {
                    classPaths.push(asclass.classpath);
                }
            }
            callback(classPaths);
        }.bind(this));
    };
    Lib.createManifest = function (components, namespace) {
        namespace = namespace.replace(/^[a-zA-Z]+:\/\//g, '');
        namespace = namespace.replace(/\//g, '.');
        var manifest = { componentPackage: { component: [] } };
        var f = -1;
        var fmax = components.length;
        var component;
        while (++f < fmax) {
            component = components[f];
            manifest['componentPackage']['component'].push({
                '$': {
                    'id': component.name,
                    'class': component.path
                }
            });
        }
        var xml = new xml2js.Builder({ attrkey: '$' }).buildObject(manifest);
        var cacheDirectory = $path.resolve('.flbuild-cache');
        if (!$fs.existsSync(cacheDirectory))
            $fs.mkdirSync(cacheDirectory);
        var xmlFile = $path.join(cacheDirectory, "manifest-" + Config_1.Config.getTime() + "-" + namespace + ".xml");
        $fs.writeFileSync(xmlFile, xml, { encoding: 'utf8' });
        return xmlFile;
    };
    Lib.prototype.getConfig = function (complete) {
        var f;
        var fmax;
        _super.prototype.getConfig.call(this, function (config) {
            this.getIncludeClasses(function (classPaths) {
                if (!config['flex-config'])
                    config['flex-config'] = {};
                if (!config['flex-config']['include-classes'])
                    config['flex-config']['include-classes'] = {};
                if (!config['flex-config']['include-classes']['class'])
                    config['flex-config']['include-classes']['class'] = [];
                f = -1;
                fmax = classPaths.length;
                while (++f < fmax) {
                    config['flex-config']['include-classes']['class'].push(classPaths[f]);
                }
                this.getManifest(classPaths, function (namespaces) {
                    if (!config['flex-config'])
                        config['flex-config'] = {};
                    if (!config['flex-config']['compiler'])
                        config['flex-config']['compiler'] = {};
                    for (var namespace in namespaces) {
                        if (namespaces.hasOwnProperty(namespace)) {
                            var components = namespaces[namespace];
                            var manifest = Lib.createManifest(components, namespace);
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
                    var flexConfig = this.getConfigXml();
                    var frameworks = $path.dirname(flexConfig);
                    var xmlstr = $fs.readFileSync(flexConfig, { encoding: 'utf8' });
                    xml2js.parseString(xmlstr, function (err, result) {
                        var compiler = result['flex-config']['compiler'][0];
                        var nss = result['flex-config']['compiler'][0]['namespaces'][0]['namespace'];
                        var ns;
                        f = -1;
                        fmax = nss.length;
                        while (++f < fmax) {
                            ns = nss[f];
                            var uri = ns.uri[0];
                            var manifest = ns.manifest[0];
                            if (!$fs.existsSync(manifest))
                                manifest = $path.join(frameworks, manifest);
                            if (!config['flex-config']['compiler']['namespaces'])
                                config['flex-config']['compiler']['namespaces'] = { namespace: [] };
                            config['flex-config']['compiler']['namespaces']['namespace'].push({
                                uri: uri,
                                manifest: manifest
                            });
                        }
                    });
                    complete(config);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    };
    Lib.prototype.createBuildCommand = function (swcPath, complete) {
        var bin = 'compc';
        this.getSDKVersion(function (version) {
            this.createConfig(function (configXmlPath) {
                console.log('Lib.ts..() case 2');
                swcPath = Config_1.Config.wrapPath(this.resolvePath(swcPath));
                configXmlPath = Config_1.Config.wrapPath(configXmlPath);
                var cmd = [];
                var f;
                var fmax;
                if (Config_1.Config.isWindow())
                    bin = Config_1.Config.isVersionHigher(version, '4.6.0') ? 'compc.bat' : 'compc.exe';
                cmd.push(Config_1.Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)));
                cmd.push("-load-config+=" + configXmlPath);
                var args = this.getArgs();
                f = -1;
                fmax = args.length;
                while (++f < fmax) {
                    cmd.push(this.applyEnv(args[f]));
                }
                cmd.push("-output " + swcPath);
                complete(cmd.join(' '));
            }.bind(this));
        }.bind(this));
    };
    return Lib;
})(Config_1.Config);
exports.Lib = Lib;
//# sourceMappingURL=Lib.js.map