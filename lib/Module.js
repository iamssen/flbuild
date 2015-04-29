///<reference path="./definition/libs.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var $path = require('path');
var Config = require('./Config');
var Module = (function (_super) {
    __extends(Module, _super);
    function Module(config) {
        _super.call(this, config);
    }
    Module.prototype.createBuildCommand = function (appReportPath, mxmlPath, swfPath, complete) {
        var bin = 'mxmlc';
        this.getSDKVersion(function (version) {
            this.createConfig(function (xml) {
                var args = [];
                // mxmlc
                if (Config.isWindow())
                    bin = Config.isVersionHigher(version, '4.6.0') ? 'mxmlc.bat' : 'mxmlc.exe';
                args.push(Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)));
                // mxml
                args.push(Config.wrapPath(this.resolvePath(mxmlPath)));
                // load-config local
                args.push("-load-config+=" + Config.wrapPath(xml));
                // merge args
                this.getArgs().forEach(function (arg) {
                    args.push(this.applyEnv(arg));
                }.bind(this));
                swfPath = Config.wrapPath(this.resolvePath(swfPath));
                // link-report
                args.push("-link-report " + swfPath.replace('.swf', '.xml'));
                // size-report
                args.push("-size-report " + swfPath.replace('.swf', '.size.xml'));
                // swf
                args.push("-output " + swfPath);
                // report
                if (appReportPath) {
                    appReportPath = Config.wrapPath(this.resolvePath(appReportPath));
                    args.push("-load-externs " + appReportPath);
                }
                complete(args.join(' '));
            }.bind(this));
        }.bind(this));
    };
    return Module;
})(Config);
module.exports = Module;
//# sourceMappingURL=Module.js.map