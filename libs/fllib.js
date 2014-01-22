// Generated by CoffeeScript 1.6.3
(function() {
  var Fllib, SourceCollector, pick,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  pick = require('file-picker').pick;

  SourceCollector = require('./flutils').SourceCollector;

  Fllib = (function() {
    function Fllib(build) {
      this.createBuildCommand = __bind(this.createBuildCommand, this);
      this.addArg = __bind(this.addArg, this);
      this.addSourceDirectory = __bind(this.addSourceDirectory, this);
      this.addExternalLibraryDirectory = __bind(this.addExternalLibraryDirectory, this);
      this.addLibraryDirectory = __bind(this.addLibraryDirectory, this);
      this.setFilterFunction = __bind(this.setFilterFunction, this);
      this.collector = new SourceCollector(build);
      this.build = build;
    }

    Fllib.prototype.setFilterFunction = function(func) {
      return this.filterFunction = func;
    };

    Fllib.prototype.addLibraryDirectory = function(path) {
      return this.collector.addLibraryDirectory(path);
    };

    Fllib.prototype.addExternalLibraryDirectory = function(path) {
      return this.collector.addExternalLibraryDirectory(path);
    };

    Fllib.prototype.addSourceDirectory = function(path) {
      return this.collector.addSourceDirectory(path);
    };

    Fllib.prototype.addArg = function(arg) {
      return this.collector.addArg(arg);
    };

    Fllib.prototype.createBuildCommand = function(output, complete) {
      var args, directory, library, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2,
        _this = this;
      args = [];
      args.push(this.build.wrap(this.build.getEnv('FLEX_HOME') + '/bin/compc'));
      _ref = this.collector.getLibraries();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        library = _ref[_i];
        args.push('-library-path ' + this.build.wrap(library));
      }
      _ref1 = this.collector.getExternalLibraries();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        library = _ref1[_j];
        args.push('-external-library-path ' + this.build.wrap(library));
      }
      _ref2 = this.collector.getSourceDirectories();
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        directory = _ref2[_k];
        args.push('-source-path ' + this.build.wrap(directory));
      }
      return this.collector.getIncludeClasses(this.filterFunction, function(classPaths) {
        var arg, _l, _len3, _ref3;
        args.push('-include-classes ' + classPaths.join(' '));
        _ref3 = _this.collector.getArgs();
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          arg = _ref3[_l];
          args.push(_this.build.applyEnv(arg));
        }
        args.push('-output ' + _this.build.wrap(_this.build.resolvePath(output)));
        if (complete != null) {
          return complete(args.join(' '));
        }
      });
    };

    return Fllib;

  })();

  module.exports = Fllib;

}).call(this);

/*
//@ sourceMappingURL=fllib.map
*/
