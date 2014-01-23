// Generated by CoffeeScript 1.6.3
(function() {
  var Flapp, SourceCollector, pick,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  pick = require('file-picker').pick;

  SourceCollector = require('./flutils').SourceCollector;

  Flapp = (function() {
    function Flapp(build) {
      this.createBuildCommand = __bind(this.createBuildCommand, this);
      this.addArg = __bind(this.addArg, this);
      this.addSourceDirectory = __bind(this.addSourceDirectory, this);
      this.addExternalLibraryDirectory = __bind(this.addExternalLibraryDirectory, this);
      this.addLibraryDirectory = __bind(this.addLibraryDirectory, this);
      this.collector = new SourceCollector(build);
      this.build = build;
    }

    Flapp.prototype.addLibraryDirectory = function(path) {
      return this.collector.addLibraryDirectory(path);
    };

    Flapp.prototype.addExternalLibraryDirectory = function(path) {
      return this.collector.addExternalLibraryDirectory(path);
    };

    Flapp.prototype.addSourceDirectory = function(path) {
      return this.collector.addSourceDirectory(path);
    };

    Flapp.prototype.addArg = function(arg) {
      return this.collector.addArg(arg);
    };

    Flapp.prototype.createBuildCommand = function(source, output, complete) {
      var arg, args, directory, library, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
      args = [];
      args.push(this.build.wrap(this.build.getEnv('FLEX_HOME') + '/bin/mxmlc'));
      args.push(this.build.wrap(this.build.resolvePath(source)));
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
      _ref3 = this.collector.getArgs();
      for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
        arg = _ref3[_l];
        args.push(this.build.applyEnv(arg));
      }
      output = this.build.wrap(this.build.resolvePath(output));
      args.push('-link-report ' + output.replace('.swf', '.xml'));
      args.push('-output ' + output);
      if (complete != null) {
        return complete(args.join(' '));
      }
    };

    return Flapp;

  })();

  module.exports = Flapp;

}).call(this);

/*
//@ sourceMappingURL=flapp.map
*/
