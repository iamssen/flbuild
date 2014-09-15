(function() {
  var $fs, $path, Flapp, Flasset, Flbuild, Fllib, Flmodule, parseXml,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $path = require('path');

  $fs = require('fs');

  parseXml = require('xml2js').parseString;

  Fllib = require('./fllib');

  Flapp = require('./flapp');

  Flmodule = require('./flmodule');

  Flasset = require('./flasset');

  Flbuild = (function() {
    function Flbuild() {
      this.getAssetCreator = __bind(this.getAssetCreator, this);
      this.getModuleCreator = __bind(this.getModuleCreator, this);
      this.getApplicationCreator = __bind(this.getApplicationCreator, this);
      this.getLibraryCreator = __bind(this.getLibraryCreator, this);
      this.resolvePaths = __bind(this.resolvePaths, this);
      this.resolvePath = __bind(this.resolvePath, this);
      this.getSDKVersion = __bind(this.getSDKVersion, this);
      this.getEnv = __bind(this.getEnv, this);
      this.applyEnv = __bind(this.applyEnv, this);
      this.setEnv = __bind(this.setEnv, this);
      this.getArgs = __bind(this.getArgs, this);
      this.getSourceDirectories = __bind(this.getSourceDirectories, this);
      this.getExternalLibraryDirectories = __bind(this.getExternalLibraryDirectories, this);
      this.getLibraryDirectories = __bind(this.getLibraryDirectories, this);
      this.addArg = __bind(this.addArg, this);
      this.addSourceDirectory = __bind(this.addSourceDirectory, this);
      this.addExternalLibraryDirectory = __bind(this.addExternalLibraryDirectory, this);
      this.addLibraryDirectory = __bind(this.addLibraryDirectory, this);
      this.envs = {};
      this.libraryDirectories = [];
      this.externalLibraryDirectories = [];
      this.sourceDirectories = [];
      this.args = ['-locale en_US'];
    }

    Flbuild.prototype.addLibraryDirectory = function(path) {
      return this.libraryDirectories.push(path);
    };

    Flbuild.prototype.addExternalLibraryDirectory = function(path) {
      return this.externalLibraryDirectories.push(path);
    };

    Flbuild.prototype.addSourceDirectory = function(path) {
      return this.sourceDirectories.push(path);
    };

    Flbuild.prototype.addArg = function(arg) {
      return this.args.push(arg);
    };

    Flbuild.prototype.getLibraryDirectories = function() {
      return this.libraryDirectories;
    };

    Flbuild.prototype.getExternalLibraryDirectories = function() {
      return this.externalLibraryDirectories;
    };

    Flbuild.prototype.getSourceDirectories = function() {
      return this.sourceDirectories;
    };

    Flbuild.prototype.getArgs = function() {
      return this.args;
    };

    Flbuild.prototype.setEnv = function(name, value) {
      if (value == null) {
        value = process.env[name];
      }
      return this.envs[name] = value;
    };

    Flbuild.prototype.applyEnv = function(str) {
      var name, reg, value, _ref;
      _ref = this.envs;
      for (name in _ref) {
        value = _ref[name];
        reg = new RegExp('\\$' + name, 'g');
        str = str.replace(reg, value);
      }
      return str;
    };

    Flbuild.prototype.getEnv = function(name) {
      return this.envs[name];
    };

    Flbuild.prototype.getSDKVersion = function(done) {
      var xmlstr;
      if (!this.sdkDescription) {
        xmlstr = $fs.readFileSync(this.getEnv('FLEX_HOME') + '/flex-sdk-description.xml', {
          encoding: 'utf8'
        });
        return parseXml(xmlstr, function(err, result) {
          this.sdkDescription = result;
          return done(this.sdkDescription.version);
        });
      } else {
        return done(this.sdkDescription.version);
      }
    };

    Flbuild.prototype.resolvePath = function(path) {
      path = this.applyEnv(path);
      return $path.resolve(path);
    };

    Flbuild.prototype.resolvePaths = function(paths) {
      var newPaths, path, _i, _len;
      newPaths = [];
      for (_i = 0, _len = paths.length; _i < _len; _i++) {
        path = paths[_i];
        newPaths.push(this.resolvePath(path));
      }
      return newPaths;
    };

    Flbuild.prototype.getLibraryCreator = function() {
      return new Fllib(this);
    };

    Flbuild.prototype.getApplicationCreator = function() {
      return new Flapp(this);
    };

    Flbuild.prototype.getModuleCreator = function() {
      return new Flmodule(this);
    };

    Flbuild.prototype.getAssetCreator = function() {
      return new Flasset(this);
    };

    Flbuild.prototype.isWindow = function() {
      return process.platform.indexOf('win') === 0;
    };

    Flbuild.prototype.wrap = function(path) {
      path = "\"" + path + "\"";
      if (this.isWindow()) {
        path.replace(/\//g, "\\");
      }
      return path;
    };

    Flbuild.prototype.getSwcListFromDirectory = function(path) {
      var file, files, swcs, _i, _len;
      swcs = [];
      if ($fs.existsSync(path)) {
        files = $fs.readdirSync(path);
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          file = files[_i];
          if (file.lastIndexOf('.swc') > -1) {
            swcs.push($path.join(path, file));
          }
        }
      }
      return swcs;
    };

    Flbuild.prototype.classfy = function(file) {
      var classPath;
      classPath = file.relative_base.split('/').join('.') + '.' + file.name;
      if (classPath.charAt(0) === '.') {
        classPath = classPath.substr(1);
      }
      return classPath;
    };

    return Flbuild;

  })();

  module.exports = Flbuild;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZsYnVpbGQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw4REFBQTtJQUFBLGtGQUFBOztBQUFBLEVBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxNQUFSLENBQVIsQ0FBQTs7QUFBQSxFQUNBLEdBQUEsR0FBTSxPQUFBLENBQVEsSUFBUixDQUROLENBQUE7O0FBQUEsRUFFQSxRQUFBLEdBQVcsT0FBQSxDQUFRLFFBQVIsQ0FBaUIsQ0FBQyxXQUY3QixDQUFBOztBQUFBLEVBSUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBSlIsQ0FBQTs7QUFBQSxFQUtBLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUixDQUxSLENBQUE7O0FBQUEsRUFNQSxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVIsQ0FOWCxDQUFBOztBQUFBLEVBT0EsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSLENBUFYsQ0FBQTs7QUFBQSxFQVNNO0FBQ1EsSUFBQSxpQkFBQSxHQUFBO0FBQ1osK0RBQUEsQ0FBQTtBQUFBLGlFQUFBLENBQUE7QUFBQSwyRUFBQSxDQUFBO0FBQUEsbUVBQUEsQ0FBQTtBQUFBLHlEQUFBLENBQUE7QUFBQSx1REFBQSxDQUFBO0FBQUEsMkRBQUEsQ0FBQTtBQUFBLDZDQUFBLENBQUE7QUFBQSxpREFBQSxDQUFBO0FBQUEsNkNBQUEsQ0FBQTtBQUFBLCtDQUFBLENBQUE7QUFBQSx5RUFBQSxDQUFBO0FBQUEsMkZBQUEsQ0FBQTtBQUFBLDJFQUFBLENBQUE7QUFBQSw2Q0FBQSxDQUFBO0FBQUEscUVBQUEsQ0FBQTtBQUFBLHVGQUFBLENBQUE7QUFBQSx1RUFBQSxDQUFBO0FBQUEsTUFBQSxJQUFDLENBQUEsSUFBRCxHQUFRLEVBQVIsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLGtCQUFELEdBQXNCLEVBRnRCLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSwwQkFBRCxHQUE4QixFQUg5QixDQUFBO0FBQUEsTUFJQSxJQUFDLENBQUEsaUJBQUQsR0FBcUIsRUFKckIsQ0FBQTtBQUFBLE1BS0EsSUFBQyxDQUFBLElBQUQsR0FBUSxDQUFDLGVBQUQsQ0FMUixDQURZO0lBQUEsQ0FBYjs7QUFBQSxzQkFjQSxtQkFBQSxHQUFxQixTQUFDLElBQUQsR0FBQTthQUNwQixJQUFDLENBQUEsa0JBQWtCLENBQUMsSUFBcEIsQ0FBeUIsSUFBekIsRUFEb0I7SUFBQSxDQWRyQixDQUFBOztBQUFBLHNCQWlCQSwyQkFBQSxHQUE2QixTQUFDLElBQUQsR0FBQTthQUM1QixJQUFDLENBQUEsMEJBQTBCLENBQUMsSUFBNUIsQ0FBaUMsSUFBakMsRUFENEI7SUFBQSxDQWpCN0IsQ0FBQTs7QUFBQSxzQkFvQkEsa0JBQUEsR0FBb0IsU0FBQyxJQUFELEdBQUE7YUFDbkIsSUFBQyxDQUFBLGlCQUFpQixDQUFDLElBQW5CLENBQXdCLElBQXhCLEVBRG1CO0lBQUEsQ0FwQnBCLENBQUE7O0FBQUEsc0JBdUJBLE1BQUEsR0FBUSxTQUFDLEdBQUQsR0FBQTthQUNQLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLEdBQVgsRUFETztJQUFBLENBdkJSLENBQUE7O0FBQUEsc0JBNkJBLHFCQUFBLEdBQXVCLFNBQUEsR0FBQTthQUFHLElBQUMsQ0FBQSxtQkFBSjtJQUFBLENBN0J2QixDQUFBOztBQUFBLHNCQStCQSw2QkFBQSxHQUErQixTQUFBLEdBQUE7YUFBRyxJQUFDLENBQUEsMkJBQUo7SUFBQSxDQS9CL0IsQ0FBQTs7QUFBQSxzQkFpQ0Esb0JBQUEsR0FBc0IsU0FBQSxHQUFBO2FBQUcsSUFBQyxDQUFBLGtCQUFKO0lBQUEsQ0FqQ3RCLENBQUE7O0FBQUEsc0JBbUNBLE9BQUEsR0FBUyxTQUFBLEdBQUE7YUFBRyxJQUFDLENBQUEsS0FBSjtJQUFBLENBbkNULENBQUE7O0FBQUEsc0JBd0NBLE1BQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxLQUFQLEdBQUE7QUFDUCxNQUFBLElBQWlDLGFBQWpDO0FBQUEsUUFBQSxLQUFBLEdBQVEsT0FBTyxDQUFDLEdBQUksQ0FBQSxJQUFBLENBQXBCLENBQUE7T0FBQTthQUNBLElBQUMsQ0FBQSxJQUFLLENBQUEsSUFBQSxDQUFOLEdBQWMsTUFGUDtJQUFBLENBeENSLENBQUE7O0FBQUEsc0JBNENBLFFBQUEsR0FBVSxTQUFDLEdBQUQsR0FBQTtBQUNULFVBQUEsc0JBQUE7QUFBQTtBQUFBLFdBQUEsWUFBQTsyQkFBQTtBQUNDLFFBQUEsR0FBQSxHQUFVLElBQUEsTUFBQSxDQUFPLEtBQUEsR0FBUSxJQUFmLEVBQXFCLEdBQXJCLENBQVYsQ0FBQTtBQUFBLFFBQ0EsR0FBQSxHQUFNLEdBQUcsQ0FBQyxPQUFKLENBQVksR0FBWixFQUFpQixLQUFqQixDQUROLENBREQ7QUFBQSxPQUFBO2FBR0EsSUFKUztJQUFBLENBNUNWLENBQUE7O0FBQUEsc0JBa0RBLE1BQUEsR0FBUSxTQUFDLElBQUQsR0FBQTthQUNQLElBQUMsQ0FBQSxJQUFLLENBQUEsSUFBQSxFQURDO0lBQUEsQ0FsRFIsQ0FBQTs7QUFBQSxzQkFxREEsYUFBQSxHQUFlLFNBQUMsSUFBRCxHQUFBO0FBQ2QsVUFBQSxNQUFBO0FBQUEsTUFBQSxJQUFHLENBQUEsSUFBSyxDQUFBLGNBQVI7QUFDQyxRQUFBLE1BQUEsR0FBUyxHQUFHLENBQUMsWUFBSixDQUFpQixJQUFDLENBQUEsTUFBRCxDQUFRLFdBQVIsQ0FBQSxHQUF1QiwyQkFBeEMsRUFBcUU7QUFBQSxVQUFDLFFBQUEsRUFBUyxNQUFWO1NBQXJFLENBQVQsQ0FBQTtlQUNBLFFBQUEsQ0FBUyxNQUFULEVBQWlCLFNBQUMsR0FBRCxFQUFNLE1BQU4sR0FBQTtBQUNoQixVQUFBLElBQUMsQ0FBQSxjQUFELEdBQWtCLE1BQWxCLENBQUE7aUJBQ0EsSUFBQSxDQUFLLElBQUMsQ0FBQSxjQUFjLENBQUMsT0FBckIsRUFGZ0I7UUFBQSxDQUFqQixFQUZEO09BQUEsTUFBQTtlQU1DLElBQUEsQ0FBSyxJQUFDLENBQUEsY0FBYyxDQUFDLE9BQXJCLEVBTkQ7T0FEYztJQUFBLENBckRmLENBQUE7O0FBQUEsc0JBa0VBLFdBQUEsR0FBYSxTQUFDLElBQUQsR0FBQTtBQUNaLE1BQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUFQLENBQUE7YUFDQSxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsRUFGWTtJQUFBLENBbEViLENBQUE7O0FBQUEsc0JBc0VBLFlBQUEsR0FBYyxTQUFDLEtBQUQsR0FBQTtBQUNiLFVBQUEsd0JBQUE7QUFBQSxNQUFBLFFBQUEsR0FBVyxFQUFYLENBQUE7QUFDQSxXQUFBLDRDQUFBO3lCQUFBO0FBQ0MsUUFBQSxRQUFRLENBQUMsSUFBVCxDQUFjLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBYixDQUFkLENBQUEsQ0FERDtBQUFBLE9BREE7YUFHQSxTQUphO0lBQUEsQ0F0RWQsQ0FBQTs7QUFBQSxzQkErRUEsaUJBQUEsR0FBbUIsU0FBQSxHQUFBO2FBQVUsSUFBQSxLQUFBLENBQU0sSUFBTixFQUFWO0lBQUEsQ0EvRW5CLENBQUE7O0FBQUEsc0JBaUZBLHFCQUFBLEdBQXVCLFNBQUEsR0FBQTthQUFVLElBQUEsS0FBQSxDQUFNLElBQU4sRUFBVjtJQUFBLENBakZ2QixDQUFBOztBQUFBLHNCQW1GQSxnQkFBQSxHQUFrQixTQUFBLEdBQUE7YUFBVSxJQUFBLFFBQUEsQ0FBUyxJQUFULEVBQVY7SUFBQSxDQW5GbEIsQ0FBQTs7QUFBQSxzQkFxRkEsZUFBQSxHQUFpQixTQUFBLEdBQUE7YUFBVSxJQUFBLE9BQUEsQ0FBUSxJQUFSLEVBQVY7SUFBQSxDQXJGakIsQ0FBQTs7QUFBQSxzQkEwRkEsUUFBQSxHQUFVLFNBQUEsR0FBQTthQUFNLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBakIsQ0FBeUIsS0FBekIsQ0FBQSxLQUFtQyxFQUF6QztJQUFBLENBMUZWLENBQUE7O0FBQUEsc0JBNEZBLElBQUEsR0FBTSxTQUFDLElBQUQsR0FBQTtBQUNMLE1BQUEsSUFBQSxHQUFRLElBQUEsR0FBRyxJQUFILEdBQVMsSUFBakIsQ0FBQTtBQUNBLE1BQUEsSUFBNkIsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUE3QjtBQUFBLFFBQUEsSUFBSSxDQUFDLE9BQUwsQ0FBYSxLQUFiLEVBQW9CLElBQXBCLENBQUEsQ0FBQTtPQURBO0FBRUEsYUFBTyxJQUFQLENBSEs7SUFBQSxDQTVGTixDQUFBOztBQUFBLHNCQWlHQSx1QkFBQSxHQUF5QixTQUFDLElBQUQsR0FBQTtBQUN4QixVQUFBLDJCQUFBO0FBQUEsTUFBQSxJQUFBLEdBQU8sRUFBUCxDQUFBO0FBQ0EsTUFBQSxJQUFHLEdBQUcsQ0FBQyxVQUFKLENBQWUsSUFBZixDQUFIO0FBQ0MsUUFBQSxLQUFBLEdBQVEsR0FBRyxDQUFDLFdBQUosQ0FBZ0IsSUFBaEIsQ0FBUixDQUFBO0FBRUEsYUFBQSw0Q0FBQTsyQkFBQTtBQUNDLFVBQUEsSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixNQUFqQixDQUFBLEdBQTJCLENBQUEsQ0FBOUI7QUFDQyxZQUFBLElBQUksQ0FBQyxJQUFMLENBQVUsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBQWlCLElBQWpCLENBQVYsQ0FBQSxDQUREO1dBREQ7QUFBQSxTQUhEO09BREE7YUFPQSxLQVJ3QjtJQUFBLENBakd6QixDQUFBOztBQUFBLHNCQTRHQSxPQUFBLEdBQVMsU0FBQyxJQUFELEdBQUE7QUFDUixVQUFBLFNBQUE7QUFBQSxNQUFBLFNBQUEsR0FBWSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQW5CLENBQXlCLEdBQXpCLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsR0FBbkMsQ0FBQSxHQUEwQyxHQUExQyxHQUFnRCxJQUFJLENBQUMsSUFBakUsQ0FBQTtBQUNBLE1BQUEsSUFBbUMsU0FBUyxDQUFDLE1BQVYsQ0FBaUIsQ0FBakIsQ0FBQSxLQUF1QixHQUExRDtBQUFBLFFBQUEsU0FBQSxHQUFZLFNBQVMsQ0FBQyxNQUFWLENBQWlCLENBQWpCLENBQVosQ0FBQTtPQURBO2FBRUEsVUFIUTtJQUFBLENBNUdULENBQUE7O21CQUFBOztNQVZELENBQUE7O0FBQUEsRUEySEEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsT0EzSGpCLENBQUE7QUFBQSIsImZpbGUiOiJmbGJ1aWxkLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiJHBhdGggPSByZXF1aXJlKCdwYXRoJylcbiRmcyA9IHJlcXVpcmUoJ2ZzJylcbnBhcnNlWG1sID0gcmVxdWlyZSgneG1sMmpzJykucGFyc2VTdHJpbmdcblxuRmxsaWIgPSByZXF1aXJlKCcuL2ZsbGliJylcbkZsYXBwID0gcmVxdWlyZSgnLi9mbGFwcCcpXG5GbG1vZHVsZSA9IHJlcXVpcmUoJy4vZmxtb2R1bGUnKVxuRmxhc3NldCA9IHJlcXVpcmUoJy4vZmxhc3NldCcpXG5cbmNsYXNzIEZsYnVpbGRcblx0Y29uc3RydWN0b3I6ICgpIC0+XG5cdFx0QGVudnMgPSB7fVxuXG5cdFx0QGxpYnJhcnlEaXJlY3RvcmllcyA9IFtdXG5cdFx0QGV4dGVybmFsTGlicmFyeURpcmVjdG9yaWVzID0gW11cblx0XHRAc291cmNlRGlyZWN0b3JpZXMgPSBbXVxuXHRcdEBhcmdzID0gWyctbG9jYWxlIGVuX1VTJ11cblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgc291cmNlIGNvbGxlY3Rcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIHNldHRlcnNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0YWRkTGlicmFyeURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QGxpYnJhcnlEaXJlY3Rvcmllcy5wdXNoKHBhdGgpXG5cblx0YWRkRXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMucHVzaChwYXRoKVxuXG5cdGFkZFNvdXJjZURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QHNvdXJjZURpcmVjdG9yaWVzLnB1c2gocGF0aClcblxuXHRhZGRBcmc6IChhcmcpID0+XG5cdFx0QGFyZ3MucHVzaChhcmcpXG5cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBnZXR0ZXJzXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdGdldExpYnJhcnlEaXJlY3RvcmllczogPT4gQGxpYnJhcnlEaXJlY3Rvcmllc1xuXG5cdGdldEV4dGVybmFsTGlicmFyeURpcmVjdG9yaWVzOiA9PiBAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXNcblxuXHRnZXRTb3VyY2VEaXJlY3RvcmllczogPT4gQHNvdXJjZURpcmVjdG9yaWVzXG5cblx0Z2V0QXJnczogPT4gQGFyZ3NcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgZW52aXJvbm1lbnQgdmFyaWFibGVzIGNvbnRyb2xcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRzZXRFbnY6IChuYW1lLCB2YWx1ZSkgPT5cblx0XHR2YWx1ZSA9IHByb2Nlc3MuZW52W25hbWVdIGlmIG5vdCB2YWx1ZT9cblx0XHRAZW52c1tuYW1lXSA9IHZhbHVlXG5cblx0YXBwbHlFbnY6IChzdHIpID0+XG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIEBlbnZzXG5cdFx0XHRyZWcgPSBuZXcgUmVnRXhwKCdcXFxcJCcgKyBuYW1lLCAnZycpXG5cdFx0XHRzdHIgPSBzdHIucmVwbGFjZShyZWcsIHZhbHVlKVxuXHRcdHN0clxuXG5cdGdldEVudjogKG5hbWUpID0+XG5cdFx0QGVudnNbbmFtZV1cblxuXHRnZXRTREtWZXJzaW9uOiAoZG9uZSkgPT5cblx0XHRpZiBub3QgQHNka0Rlc2NyaXB0aW9uXG5cdFx0XHR4bWxzdHIgPSAkZnMucmVhZEZpbGVTeW5jKEBnZXRFbnYoJ0ZMRVhfSE9NRScpICsgJy9mbGV4LXNkay1kZXNjcmlwdGlvbi54bWwnLCB7ZW5jb2Rpbmc6J3V0ZjgnfSlcblx0XHRcdHBhcnNlWG1sIHhtbHN0ciwgKGVyciwgcmVzdWx0KS0+XG5cdFx0XHRcdEBzZGtEZXNjcmlwdGlvbiA9IHJlc3VsdFxuXHRcdFx0XHRkb25lKEBzZGtEZXNjcmlwdGlvbi52ZXJzaW9uKVxuXHRcdGVsc2Vcblx0XHRcdGRvbmUoQHNka0Rlc2NyaXB0aW9uLnZlcnNpb24pXG5cblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgcmVzb2x2ZSBwYXRoIGNvbnRyb2wgOiBkZXBlbmRlbnQgZW52aXJvbm1lbnQgdmFyaWFibGVzIGNvbnRyb2xcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRyZXNvbHZlUGF0aDogKHBhdGgpID0+XG5cdFx0cGF0aCA9IEBhcHBseUVudihwYXRoKVxuXHRcdCRwYXRoLnJlc29sdmUocGF0aClcblxuXHRyZXNvbHZlUGF0aHM6IChwYXRocykgPT5cblx0XHRuZXdQYXRocyA9IFtdXG5cdFx0Zm9yIHBhdGggaW4gcGF0aHNcblx0XHRcdG5ld1BhdGhzLnB1c2goQHJlc29sdmVQYXRoKHBhdGgpKVxuXHRcdG5ld1BhdGhzXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIGNyZWF0ZSBpbnN0YW5jZVxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdGdldExpYnJhcnlDcmVhdG9yOiAoKSA9PiBuZXcgRmxsaWIoQClcblxuXHRnZXRBcHBsaWNhdGlvbkNyZWF0b3I6ICgpID0+IG5ldyBGbGFwcChAKVxuXG5cdGdldE1vZHVsZUNyZWF0b3I6ICgpID0+IG5ldyBGbG1vZHVsZShAKVxuXG5cdGdldEFzc2V0Q3JlYXRvcjogKCkgPT4gbmV3IEZsYXNzZXQoQClcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgdXRpbHNcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRpc1dpbmRvdzogKCkgLT4gcHJvY2Vzcy5wbGF0Zm9ybS5pbmRleE9mKCd3aW4nKSBpcyAwXG5cdFxuXHR3cmFwOiAocGF0aCkgLT5cblx0XHRwYXRoID0gXCJcXFwiI3twYXRofVxcXCJcIlxuXHRcdHBhdGgucmVwbGFjZSgvXFwvL2csIFwiXFxcXFwiKSBpZiBAaXNXaW5kb3coKVxuXHRcdHJldHVybiBwYXRoXG5cblx0Z2V0U3djTGlzdEZyb21EaXJlY3Rvcnk6IChwYXRoKSAtPlxuXHRcdHN3Y3MgPSBbXVxuXHRcdGlmICRmcy5leGlzdHNTeW5jKHBhdGgpXG5cdFx0XHRmaWxlcyA9ICRmcy5yZWFkZGlyU3luYyhwYXRoKVxuXG5cdFx0XHRmb3IgZmlsZSBpbiBmaWxlc1xuXHRcdFx0XHRpZiBmaWxlLmxhc3RJbmRleE9mKCcuc3djJykgPiAtMVxuXHRcdFx0XHRcdHN3Y3MucHVzaCgkcGF0aC5qb2luKHBhdGgsIGZpbGUpKVxuXHRcdHN3Y3NcblxuXHQjIGZpbGUgZnJvbSByZXF1aXJlKCdmaWxlLXBpY2tlcicpXG5cdGNsYXNzZnk6IChmaWxlKSAtPlxuXHRcdGNsYXNzUGF0aCA9IGZpbGUucmVsYXRpdmVfYmFzZS5zcGxpdCgnLycpLmpvaW4oJy4nKSArICcuJyArIGZpbGUubmFtZVxuXHRcdGNsYXNzUGF0aCA9IGNsYXNzUGF0aC5zdWJzdHIoMSkgaWYgY2xhc3NQYXRoLmNoYXJBdCgwKSBpcyAnLidcblx0XHRjbGFzc1BhdGhcblxubW9kdWxlLmV4cG9ydHMgPSBGbGJ1aWxkIl19