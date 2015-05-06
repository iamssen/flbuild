///<reference path="./definition/libs.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var $path = require('path');
var Config = require('./Config');
var App = (function (_super) {
    __extends(App, _super);
    function App(config) {
        _super.call(this, config);
    }
    App.prototype.createBuildCommand = function (mxmlPath, swfPath, complete) {
        var bin = 'mxmlc';
        this.getSDKVersion(function (version) {
            this.createConfig(function (configXmlPath) {
                mxmlPath = Config.wrapPath(this.resolvePath(mxmlPath));
                swfPath = Config.wrapPath(this.resolvePath(swfPath));
                configXmlPath = Config.wrapPath(configXmlPath);
                var cmd = [];
                var f;
                var fmax;
                // mxmlc
                if (Config.isWindow())
                    bin = Config.isVersionHigher(version, '4.6.0') ? 'mxmlc.bat' : 'mxmlc.exe';
                cmd.push(Config.wrapPath($path.join(this.getEnv('FLEX_HOME'), 'bin', bin)));
                // mxml
                cmd.push(mxmlPath);
                // load-config local
                cmd.push("-load-config+=" + configXmlPath);
                // include args
                var args = this.getArgs();
                f = -1;
                fmax = args.length;
                while (++f < fmax) {
                    cmd.push(this.applyEnv(args[f]));
                }
                // link-report
                cmd.push("-link-report " + swfPath.replace('.swf', '.xml'));
                // size-report
                cmd.push("-size-report " + swfPath.replace('.swf', '.size.xml'));
                // swf
                cmd.push("-output " + swfPath);
                complete(cmd.join(' '));
            }.bind(this));
        }.bind(this));
    };
    return App;
})(Config);
module.exports = App;
//# sourceMappingURL=App.js.map