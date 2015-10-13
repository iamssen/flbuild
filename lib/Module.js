///<reference path="./definition/libs.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var $path = require('path');
var Config_1 = require('./Config');
var Module = (function (_super) {
    __extends(Module, _super);
    function Module(config) {
        _super.call(this, config);
    }
    Module.prototype.createBuildCommand = function (appReportPath, mxmlPath, swfPath, complete) {
        var bin = 'mxmlc';
        this.getSDKVersion(function (version) {
            this.createConfig(function (configXmlPath) {
                mxmlPath = Config_1.Config.wrapPath(this.resolvePath(mxmlPath));
                swfPath = Config_1.Config.wrapPath(this.resolvePath(swfPath));
                configXmlPath = Config_1.Config.wrapPath(configXmlPath);
                var cmd = [];
                var f;
                var fmax;
                if (Config_1.Config.isWindow())
                    bin = Config_1.Config.isVersionHigher(version, '4.6.0') ? 'mxmlc.bat' : 'mxmlc.exe';
                cmd.push(Config_1.Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)));
                cmd.push(mxmlPath);
                cmd.push("-load-config+=" + configXmlPath);
                var args = this.getArgs();
                f = -1;
                fmax = args.length;
                while (++f < fmax) {
                    cmd.push(this.applyEnv(args[f]));
                }
                cmd.push("-link-report " + swfPath.replace('.swf', '.xml'));
                cmd.push("-size-report " + swfPath.replace('.swf', '.size.xml'));
                cmd.push("-output " + swfPath);
                if (appReportPath) {
                    appReportPath = Config_1.Config.wrapPath(this.resolvePath(appReportPath));
                    cmd.push("-load-externs " + appReportPath);
                }
                complete(cmd.join(' '));
            }.bind(this));
        }.bind(this));
    };
    return Module;
})(Config_1.Config);
exports.Module = Module;
//# sourceMappingURL=Module.js.map