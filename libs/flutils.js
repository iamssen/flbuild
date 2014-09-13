(function() {
  var SourceCollector, pick,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  pick = require('file-picker').pick;

  SourceCollector = (function() {
    function SourceCollector(build) {
      this.getArgs = __bind(this.getArgs, this);
      this.getIncludeClasses = __bind(this.getIncludeClasses, this);
      this.getManifest = __bind(this.getManifest, this);
      this.getSourceDirectories = __bind(this.getSourceDirectories, this);
      this.getExternalLibraries = __bind(this.getExternalLibraries, this);
      this.getLibraries = __bind(this.getLibraries, this);
      this.addArg = __bind(this.addArg, this);
      this.addSourceDirectory = __bind(this.addSourceDirectory, this);
      this.addExternalLibraryDirectory = __bind(this.addExternalLibraryDirectory, this);
      this.addLibraryDirectory = __bind(this.addLibraryDirectory, this);
      this.build = build;
      this.libraryDirectories = [];
      this.externalLibraryDirectories = [];
      this.sourceDirectories = [];
      this.args = [];
    }

    SourceCollector.prototype.addLibraryDirectory = function(path) {
      return this.libraryDirectories.push(path);
    };

    SourceCollector.prototype.addExternalLibraryDirectory = function(path) {
      return this.externalLibraryDirectories.push(path);
    };

    SourceCollector.prototype.addSourceDirectory = function(path) {
      return this.sourceDirectories.push(path);
    };

    SourceCollector.prototype.addArg = function(arg) {
      return this.args.push(arg);
    };

    SourceCollector.prototype.getLibraries = function() {
      var directory, libraries, libraryDirectories, _i, _len;
      libraryDirectories = this.build.resolvePaths(this.libraryDirectories.concat(this.build.getLibraryDirectories()));
      libraries = [];
      if (libraryDirectories && libraryDirectories.length > 0) {
        for (_i = 0, _len = libraryDirectories.length; _i < _len; _i++) {
          directory = libraryDirectories[_i];
          libraries = libraries.concat(this.build.getSwcListFromDirectory(directory));
        }
      }
      return libraries;
    };

    SourceCollector.prototype.getExternalLibraries = function() {
      var directory, libraries, libraryDirectories, _i, _len;
      libraryDirectories = this.build.resolvePaths(this.externalLibraryDirectories.concat(this.build.getExternalLibraryDirectories()));
      libraries = [];
      if (libraryDirectories && libraryDirectories.length > 0) {
        for (_i = 0, _len = libraryDirectories.length; _i < _len; _i++) {
          directory = libraryDirectories[_i];
          libraries = libraries.concat(this.build.getSwcListFromDirectory(directory));
        }
      }
      return libraries;
    };

    SourceCollector.prototype.getSourceDirectories = function() {
      return this.build.resolvePaths(this.sourceDirectories.concat(this.build.getSourceDirectories()));
    };

    SourceCollector.prototype.getManifest = function(callback) {
      var sourceDirectories;
      sourceDirectories = this.build.resolvePaths(this.sourceDirectories.concat(this.build.getSourceDirectories()));
      return pick(sourceDirectories, ['.yaml'], (function(_this) {
        return function(files) {
          var file, namespaces, _i, _len;
          namespaces = {};
          for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            console.log(file);
          }
          return callback(namespaces);
        };
      })(this));
    };

    SourceCollector.prototype.getIncludeClasses = function(filterFunction, callback) {
      var sourceDirectories;
      sourceDirectories = this.build.resolvePaths(this.sourceDirectories.concat(this.build.getSourceDirectories()));
      return pick(sourceDirectories, ['.as', '.mxml'], (function(_this) {
        return function(files) {
          var classPaths, file, _i, _len;
          classPaths = [];
          for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            file["class"] = _this.build.classfy(file);
            if (filterFunction != null) {
              if (filterFunction(file)) {
                classPaths.push(file["class"]);
              }
            } else {
              classPaths.push(file["class"]);
            }
          }
          return callback(classPaths);
        };
      })(this));
    };

    SourceCollector.prototype.getArgs = function() {
      return this.args.concat(this.build.getArgs());
    };

    return SourceCollector;

  })();

  exports.SourceCollector = SourceCollector;

}).call(this);

//# sourceMappingURL=data:application/json;base64,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QUEsS0FBSyxDQUFDLG9CQUFQLENBQUEsQ0FBMUIsQ0FBcEIsQ0FBcEIsQ0FBQTthQUVBLElBQUEsQ0FBSyxpQkFBTCxFQUF3QixDQUFDLEtBQUQsRUFBUSxPQUFSLENBQXhCLEVBQTBDLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsR0FBQTtBQUN6QyxjQUFBLDBCQUFBO0FBQUEsVUFBQSxVQUFBLEdBQWEsRUFBYixDQUFBO0FBRUEsZUFBQSw0Q0FBQTs2QkFBQTtBQUNDLFlBQUEsSUFBSSxDQUFDLE9BQUQsQ0FBSixHQUFhLEtBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLElBQWYsQ0FBYixDQUFBO0FBRUEsWUFBQSxJQUFHLHNCQUFIO0FBQ0MsY0FBQSxJQUFHLGNBQUEsQ0FBZSxJQUFmLENBQUg7QUFDQyxnQkFBQSxVQUFVLENBQUMsSUFBWCxDQUFnQixJQUFJLENBQUMsT0FBRCxDQUFwQixDQUFBLENBREQ7ZUFERDthQUFBLE1BQUE7QUFJQyxjQUFBLFVBQVUsQ0FBQyxJQUFYLENBQWdCLElBQUksQ0FBQyxPQUFELENBQXBCLENBQUEsQ0FKRDthQUhEO0FBQUEsV0FGQTtpQkFXQSxRQUFBLENBQVMsVUFBVCxFQVp5QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTFDLEVBSGtCO0lBQUEsQ0E1RG5CLENBQUE7O0FBQUEsOEJBOEVBLE9BQUEsR0FBUyxTQUFBLEdBQUE7YUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBQSxDQUFiLEVBRFE7SUFBQSxDQTlFVCxDQUFBOzsyQkFBQTs7TUFIRCxDQUFBOztBQUFBLEVBb0ZBLE9BQU8sQ0FBQyxlQUFSLEdBQTBCLGVBcEYxQixDQUFBO0FBQUEiLCJmaWxlIjoiZmx1dGlscy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbInBpY2sgPSByZXF1aXJlKCdmaWxlLXBpY2tlcicpLnBpY2tcblxuY2xhc3MgU291cmNlQ29sbGVjdG9yXG5cdGNvbnN0cnVjdG9yOiAoYnVpbGQpIC0+XG5cdFx0QGJ1aWxkID0gYnVpbGRcblx0XHRAbGlicmFyeURpcmVjdG9yaWVzID0gW11cblx0XHRAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMgPSBbXVxuXHRcdEBzb3VyY2VEaXJlY3RvcmllcyA9IFtdXG5cdFx0QGFyZ3MgPSBbXVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBzZXR0ZXJzXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0YWRkTGlicmFyeURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QGxpYnJhcnlEaXJlY3Rvcmllcy5wdXNoKHBhdGgpXG5cblx0YWRkRXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMucHVzaChwYXRoKVxuXG5cdGFkZFNvdXJjZURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QHNvdXJjZURpcmVjdG9yaWVzLnB1c2gocGF0aClcblxuXHRhZGRBcmc6IChhcmcpID0+XG5cdFx0QGFyZ3MucHVzaChhcmcpXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIGdldHRlcnNcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRnZXRMaWJyYXJpZXM6ID0+XG5cdFx0bGlicmFyeURpcmVjdG9yaWVzID0gQGJ1aWxkLnJlc29sdmVQYXRocyhAbGlicmFyeURpcmVjdG9yaWVzLmNvbmNhdChAYnVpbGQuZ2V0TGlicmFyeURpcmVjdG9yaWVzKCkpKVxuXHRcdGxpYnJhcmllcyA9IFtdXG5cdFx0aWYgbGlicmFyeURpcmVjdG9yaWVzIGFuZCBsaWJyYXJ5RGlyZWN0b3JpZXMubGVuZ3RoID4gMFxuXHRcdFx0Zm9yIGRpcmVjdG9yeSBpbiBsaWJyYXJ5RGlyZWN0b3JpZXNcblx0XHRcdFx0bGlicmFyaWVzID0gbGlicmFyaWVzLmNvbmNhdChAYnVpbGQuZ2V0U3djTGlzdEZyb21EaXJlY3RvcnkoZGlyZWN0b3J5KSlcblx0XHRsaWJyYXJpZXNcblxuXG5cdGdldEV4dGVybmFsTGlicmFyaWVzOiA9PlxuXHRcdGxpYnJhcnlEaXJlY3RvcmllcyA9IEBidWlsZC5yZXNvbHZlUGF0aHMoQGV4dGVybmFsTGlicmFyeURpcmVjdG9yaWVzLmNvbmNhdChAYnVpbGQuZ2V0RXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMoKSkpXG5cdFx0bGlicmFyaWVzID0gW11cblx0XHRpZiBsaWJyYXJ5RGlyZWN0b3JpZXMgYW5kIGxpYnJhcnlEaXJlY3Rvcmllcy5sZW5ndGggPiAwXG5cdFx0XHRmb3IgZGlyZWN0b3J5IGluIGxpYnJhcnlEaXJlY3Rvcmllc1xuXHRcdFx0XHRsaWJyYXJpZXMgPSBsaWJyYXJpZXMuY29uY2F0KEBidWlsZC5nZXRTd2NMaXN0RnJvbURpcmVjdG9yeShkaXJlY3RvcnkpKVxuXHRcdGxpYnJhcmllc1xuXG5cblx0Z2V0U291cmNlRGlyZWN0b3JpZXM6ID0+XG5cdFx0QGJ1aWxkLnJlc29sdmVQYXRocyhAc291cmNlRGlyZWN0b3JpZXMuY29uY2F0KEBidWlsZC5nZXRTb3VyY2VEaXJlY3RvcmllcygpKSlcblxuXG5cdGdldE1hbmlmZXN0OiAoY2FsbGJhY2spID0+XG5cdFx0c291cmNlRGlyZWN0b3JpZXMgPSBAYnVpbGQucmVzb2x2ZVBhdGhzKEBzb3VyY2VEaXJlY3Rvcmllcy5jb25jYXQoQGJ1aWxkLmdldFNvdXJjZURpcmVjdG9yaWVzKCkpKVxuXG5cdFx0cGljayBzb3VyY2VEaXJlY3RvcmllcywgWycueWFtbCddLCAoZmlsZXMpID0+XG5cdFx0XHQjIG5hbWVzcGFjZVsnaHR0cDovL3NzZW4ubmFtZS9ucy9zc2VuJ11bMF0gPSAnc3Nlbi5jb21wb25lbnRzLmZpbGxzLlN0cmlwZSdcblx0XHRcdG5hbWVzcGFjZXMgPSB7fVxuXG5cdFx0XHRmb3IgZmlsZSBpbiBmaWxlc1xuXHRcdFx0XHRjb25zb2xlLmxvZyhmaWxlKVxuXG5cdFx0XHRjYWxsYmFjayhuYW1lc3BhY2VzKVxuXG5cblx0Z2V0SW5jbHVkZUNsYXNzZXM6IChmaWx0ZXJGdW5jdGlvbiwgY2FsbGJhY2spID0+XG5cdFx0c291cmNlRGlyZWN0b3JpZXMgPSBAYnVpbGQucmVzb2x2ZVBhdGhzKEBzb3VyY2VEaXJlY3Rvcmllcy5jb25jYXQoQGJ1aWxkLmdldFNvdXJjZURpcmVjdG9yaWVzKCkpKVxuXG5cdFx0cGljayBzb3VyY2VEaXJlY3RvcmllcywgWycuYXMnLCAnLm14bWwnXSwgKGZpbGVzKSA9PlxuXHRcdFx0Y2xhc3NQYXRocyA9IFtdXG5cblx0XHRcdGZvciBmaWxlIGluIGZpbGVzXG5cdFx0XHRcdGZpbGUuY2xhc3MgPSBAYnVpbGQuY2xhc3NmeShmaWxlKVxuXG5cdFx0XHRcdGlmIGZpbHRlckZ1bmN0aW9uP1xuXHRcdFx0XHRcdGlmIGZpbHRlckZ1bmN0aW9uKGZpbGUpXG5cdFx0XHRcdFx0XHRjbGFzc1BhdGhzLnB1c2goZmlsZS5jbGFzcylcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdGNsYXNzUGF0aHMucHVzaChmaWxlLmNsYXNzKVxuXG5cdFx0XHRjYWxsYmFjayhjbGFzc1BhdGhzKVxuXG5cblx0Z2V0QXJnczogPT5cblx0XHRAYXJncy5jb25jYXQoQGJ1aWxkLmdldEFyZ3MoKSlcblxuZXhwb3J0cy5Tb3VyY2VDb2xsZWN0b3IgPSBTb3VyY2VDb2xsZWN0b3IiXX0=