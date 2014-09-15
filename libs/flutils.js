(function() {
  var SourceCollector, fs, pick, yaml,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  pick = require('file-picker').pick;

  yaml = require('js-yaml');

  fs = require('fs');

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
          var component, components, description, file, namespace, namespaces, paths, spec, _i, _j, _len, _len1;
          namespaces = {};
          for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            if (file.name !== 'namespace') {
              continue;
            }
            spec = yaml.safeLoad(fs.readFileSync(file.realpath, 'utf8'));
            namespace = spec.namespace;
            components = spec.components;
            description = spec.description;
            for (_j = 0, _len1 = components.length; _j < _len1; _j++) {
              component = components[_j];
              paths = component.split('.');
              if (namespaces[namespace] === void 0) {
                namespaces[namespace] = [];
              }
              namespaces[namespace].push({
                name: paths[paths.length - 1],
                path: component
              });
            }
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

//# sourceMappingURL=data:application/json;base64,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LElBQUksQ0FBQyxPQUFELENBQUosR0FBYSxLQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBZSxJQUFmLENBQWIsQ0FBQTtBQUVBLFlBQUEsSUFBRyxzQkFBSDtBQUNDLGNBQUEsSUFBRyxjQUFBLENBQWUsSUFBZixDQUFIO0FBQ0MsZ0JBQUEsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsSUFBSSxDQUFDLE9BQUQsQ0FBcEIsQ0FBQSxDQUREO2VBREQ7YUFBQSxNQUFBO0FBSUMsY0FBQSxVQUFVLENBQUMsSUFBWCxDQUFnQixJQUFJLENBQUMsT0FBRCxDQUFwQixDQUFBLENBSkQ7YUFIRDtBQUFBLFdBRkE7aUJBV0EsUUFBQSxDQUFTLFVBQVQsRUFaeUM7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQyxFQUhrQjtJQUFBLENBdEZuQixDQUFBOztBQUFBLDhCQXdHQSxPQUFBLEdBQVMsU0FBQSxHQUFBO2FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLENBQUEsQ0FBYixFQURRO0lBQUEsQ0F4R1QsQ0FBQTs7MkJBQUE7O01BTEQsQ0FBQTs7QUFBQSxFQWdIQSxPQUFPLENBQUMsZUFBUixHQUEwQixlQWhIMUIsQ0FBQTtBQUFBIiwiZmlsZSI6ImZsdXRpbHMuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJwaWNrID0gcmVxdWlyZSgnZmlsZS1waWNrZXInKS5waWNrXG55YW1sID0gcmVxdWlyZSgnanMteWFtbCcpXG5mcyA9IHJlcXVpcmUoJ2ZzJylcblxuY2xhc3MgU291cmNlQ29sbGVjdG9yXG5cdGNvbnN0cnVjdG9yOiAoYnVpbGQpIC0+XG5cdFx0QGJ1aWxkID0gYnVpbGRcblx0XHRAbGlicmFyeURpcmVjdG9yaWVzID0gW11cblx0XHRAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMgPSBbXVxuXHRcdEBzb3VyY2VEaXJlY3RvcmllcyA9IFtdXG5cdFx0QGFyZ3MgPSBbXVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBzZXR0ZXJzXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0YWRkTGlicmFyeURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QGxpYnJhcnlEaXJlY3Rvcmllcy5wdXNoKHBhdGgpXG5cblx0YWRkRXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMucHVzaChwYXRoKVxuXG5cdGFkZFNvdXJjZURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QHNvdXJjZURpcmVjdG9yaWVzLnB1c2gocGF0aClcblxuXHRhZGRBcmc6IChhcmcpID0+XG5cdFx0QGFyZ3MucHVzaChhcmcpXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIGdldHRlcnNcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRnZXRMaWJyYXJpZXM6ID0+XG5cdFx0bGlicmFyeURpcmVjdG9yaWVzID0gQGJ1aWxkLnJlc29sdmVQYXRocyhAbGlicmFyeURpcmVjdG9yaWVzLmNvbmNhdChAYnVpbGQuZ2V0TGlicmFyeURpcmVjdG9yaWVzKCkpKVxuXHRcdGxpYnJhcmllcyA9IFtdXG5cdFx0aWYgbGlicmFyeURpcmVjdG9yaWVzIGFuZCBsaWJyYXJ5RGlyZWN0b3JpZXMubGVuZ3RoID4gMFxuXHRcdFx0Zm9yIGRpcmVjdG9yeSBpbiBsaWJyYXJ5RGlyZWN0b3JpZXNcblx0XHRcdFx0bGlicmFyaWVzID0gbGlicmFyaWVzLmNvbmNhdChAYnVpbGQuZ2V0U3djTGlzdEZyb21EaXJlY3RvcnkoZGlyZWN0b3J5KSlcblx0XHRsaWJyYXJpZXNcblxuXG5cdGdldEV4dGVybmFsTGlicmFyaWVzOiA9PlxuXHRcdGxpYnJhcnlEaXJlY3RvcmllcyA9IEBidWlsZC5yZXNvbHZlUGF0aHMoQGV4dGVybmFsTGlicmFyeURpcmVjdG9yaWVzLmNvbmNhdChAYnVpbGQuZ2V0RXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMoKSkpXG5cdFx0bGlicmFyaWVzID0gW11cblx0XHRpZiBsaWJyYXJ5RGlyZWN0b3JpZXMgYW5kIGxpYnJhcnlEaXJlY3Rvcmllcy5sZW5ndGggPiAwXG5cdFx0XHRmb3IgZGlyZWN0b3J5IGluIGxpYnJhcnlEaXJlY3Rvcmllc1xuXHRcdFx0XHRsaWJyYXJpZXMgPSBsaWJyYXJpZXMuY29uY2F0KEBidWlsZC5nZXRTd2NMaXN0RnJvbURpcmVjdG9yeShkaXJlY3RvcnkpKVxuXHRcdGxpYnJhcmllc1xuXG5cblx0Z2V0U291cmNlRGlyZWN0b3JpZXM6ID0+XG5cdFx0QGJ1aWxkLnJlc29sdmVQYXRocyhAc291cmNlRGlyZWN0b3JpZXMuY29uY2F0KEBidWlsZC5nZXRTb3VyY2VEaXJlY3RvcmllcygpKSlcblxuXG5cdGdldE1hbmlmZXN0OiAoY2FsbGJhY2spID0+XG5cdFx0c291cmNlRGlyZWN0b3JpZXMgPSBAYnVpbGQucmVzb2x2ZVBhdGhzKEBzb3VyY2VEaXJlY3Rvcmllcy5jb25jYXQoQGJ1aWxkLmdldFNvdXJjZURpcmVjdG9yaWVzKCkpKVxuXG5cdFx0cGljayBzb3VyY2VEaXJlY3RvcmllcywgWycueWFtbCddLCAoZmlsZXMpID0+XG5cdFx0XHQjIG5hbWVzcGFjZVsnaHR0cDovL3NzZW4ubmFtZS9ucy9zc2VuJ11bMF0gPVxuXHRcdFx0IyBcdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6J1N0cmlwZSdcblx0XHRcdCMgXHRcdFx0XHRcdFx0XHRcdFx0XHRwYXRoOidzc2VuLmNvbXBvbmVudHMuZmlsbHMuU3RyaXBlJ1xuXHRcdFx0bmFtZXNwYWNlcyA9IHt9XG5cblx0XHRcdGZvciBmaWxlIGluIGZpbGVzXG5cdFx0XHRcdGlmIGZpbGUubmFtZSBpc250ICduYW1lc3BhY2UnXG5cdFx0XHRcdFx0Y29udGludWVcblx0XHRcdFx0XG5cdFx0XHRcdCMgcmVhbHBhdGg6ICcvVXNlcnMvLi4uL25zL25hbWVzcGFjZS55YW1sJ1xuXHRcdFx0XHQjIHBhdGg6ICcvVXNlcnMvLi4uL25zL25hbWVzcGFjZS55YW1sJ1xuXHRcdFx0XHQjIHJlbGF0aXZlX3BhdGg6ICducy9uYW1lc3BhY2UueWFtbCdcblx0XHRcdFx0IyBiYXNlOiAnL1VzcnMvLi4uL25zJ1xuXHRcdFx0XHQjIG5hbWU6ICduYW1lc3BhY2UnXG5cdFx0XHRcdCMgZXh0ZW5zaW9uOiAnLnlhbWwnXG5cdFx0XHRcdCMgYXRpbWVcblx0XHRcdFx0IyBtdGltZVxuXHRcdFx0XHQjIGN0aW1lXG5cdFx0XHRcdFxuXHRcdFx0XHRzcGVjID0geWFtbC5zYWZlTG9hZChmcy5yZWFkRmlsZVN5bmMoZmlsZS5yZWFscGF0aCwgJ3V0ZjgnKSlcblx0XHRcdFx0bmFtZXNwYWNlID0gc3BlYy5uYW1lc3BhY2Vcblx0XHRcdFx0Y29tcG9uZW50cyA9IHNwZWMuY29tcG9uZW50c1xuXHRcdFx0XHRkZXNjcmlwdGlvbiA9IHNwZWMuZGVzY3JpcHRpb25cblx0XHRcdFx0XG5cdFx0XHRcdGZvciBjb21wb25lbnQgaW4gY29tcG9uZW50c1xuXHRcdFx0XHRcdHBhdGhzID0gY29tcG9uZW50LnNwbGl0KCcuJylcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRuYW1lc3BhY2VzW25hbWVzcGFjZV0gPSBbXSBpZiBuYW1lc3BhY2VzW25hbWVzcGFjZV0gaXMgdW5kZWZpbmVkXG5cdFx0XHRcdFx0bmFtZXNwYWNlc1tuYW1lc3BhY2VdLnB1c2hcblx0XHRcdFx0XHRcdFx0XHRuYW1lOiBwYXRoc1twYXRocy5sZW5ndGggLSAxXVxuXHRcdFx0XHRcdFx0XHRcdHBhdGg6IGNvbXBvbmVudFxuXG5cdFx0XHRjYWxsYmFjayhuYW1lc3BhY2VzKVxuXG5cblx0Z2V0SW5jbHVkZUNsYXNzZXM6IChmaWx0ZXJGdW5jdGlvbiwgY2FsbGJhY2spID0+XG5cdFx0c291cmNlRGlyZWN0b3JpZXMgPSBAYnVpbGQucmVzb2x2ZVBhdGhzKEBzb3VyY2VEaXJlY3Rvcmllcy5jb25jYXQoQGJ1aWxkLmdldFNvdXJjZURpcmVjdG9yaWVzKCkpKVxuXG5cdFx0cGljayBzb3VyY2VEaXJlY3RvcmllcywgWycuYXMnLCAnLm14bWwnXSwgKGZpbGVzKSA9PlxuXHRcdFx0Y2xhc3NQYXRocyA9IFtdXG5cblx0XHRcdGZvciBmaWxlIGluIGZpbGVzXG5cdFx0XHRcdGZpbGUuY2xhc3MgPSBAYnVpbGQuY2xhc3NmeShmaWxlKVxuXG5cdFx0XHRcdGlmIGZpbHRlckZ1bmN0aW9uP1xuXHRcdFx0XHRcdGlmIGZpbHRlckZ1bmN0aW9uKGZpbGUpXG5cdFx0XHRcdFx0XHRjbGFzc1BhdGhzLnB1c2goZmlsZS5jbGFzcylcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdGNsYXNzUGF0aHMucHVzaChmaWxlLmNsYXNzKVxuXG5cdFx0XHRjYWxsYmFjayhjbGFzc1BhdGhzKVxuXG5cdFx0XHRcblx0Z2V0QXJnczogPT5cblx0XHRAYXJncy5jb25jYXQoQGJ1aWxkLmdldEFyZ3MoKSlcblxuZXhwb3J0cy5Tb3VyY2VDb2xsZWN0b3IgPSBTb3VyY2VDb2xsZWN0b3IiXX0=