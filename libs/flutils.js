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
          var base_namespace, component, component_path, components, description, file, namespace, namespaces, spec, _i, _j, _len, _len1;
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
            base_namespace = file.relative_base.split('/').join('.');
            for (_j = 0, _len1 = components.length; _j < _len1; _j++) {
              component = components[_j];
              component_path = base_namespace + '.' + component;
              if (component_path.indexOf('.') === 0) {
                component_path = component_path.substring(1);
              }
              if (namespaces[namespace] === void 0) {
                namespaces[namespace] = [];
              }
              namespaces[namespace].push({
                name: component,
                path: component_path
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

//# sourceMappingURL=data:application/json;base64,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cEIsQ0FBcEIsQ0FBQTthQUVBLElBQUEsQ0FBSyxpQkFBTCxFQUF3QixDQUFDLEtBQUQsRUFBUSxPQUFSLENBQXhCLEVBQTBDLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsR0FBQTtBQUN6QyxjQUFBLDBCQUFBO0FBQUEsVUFBQSxVQUFBLEdBQWEsRUFBYixDQUFBO0FBRUEsZUFBQSw0Q0FBQTs2QkFBQTtBQUNDLFlBQUEsSUFBSSxDQUFDLE9BQUQsQ0FBSixHQUFhLEtBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLElBQWYsQ0FBYixDQUFBO0FBRUEsWUFBQSxJQUFHLHNCQUFIO0FBQ0MsY0FBQSxJQUFHLGNBQUEsQ0FBZSxJQUFmLENBQUg7QUFDQyxnQkFBQSxVQUFVLENBQUMsSUFBWCxDQUFnQixJQUFJLENBQUMsT0FBRCxDQUFwQixDQUFBLENBREQ7ZUFERDthQUFBLE1BQUE7QUFJQyxjQUFBLFVBQVUsQ0FBQyxJQUFYLENBQWdCLElBQUksQ0FBQyxPQUFELENBQXBCLENBQUEsQ0FKRDthQUhEO0FBQUEsV0FGQTtpQkFXQSxRQUFBLENBQVMsVUFBVCxFQVp5QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTFDLEVBSGtCO0lBQUEsQ0F6Rm5CLENBQUE7O0FBQUEsOEJBMkdBLE9BQUEsR0FBUyxTQUFBLEdBQUE7YUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBQSxDQUFiLEVBRFE7SUFBQSxDQTNHVCxDQUFBOzsyQkFBQTs7TUFMRCxDQUFBOztBQUFBLEVBbUhBLE9BQU8sQ0FBQyxlQUFSLEdBQTBCLGVBbkgxQixDQUFBO0FBQUEiLCJmaWxlIjoiZmx1dGlscy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbInBpY2sgPSByZXF1aXJlKCdmaWxlLXBpY2tlcicpLnBpY2tcbnlhbWwgPSByZXF1aXJlKCdqcy15YW1sJylcbmZzID0gcmVxdWlyZSgnZnMnKVxuXG5jbGFzcyBTb3VyY2VDb2xsZWN0b3Jcblx0Y29uc3RydWN0b3I6IChidWlsZCkgLT5cblx0XHRAYnVpbGQgPSBidWlsZFxuXHRcdEBsaWJyYXJ5RGlyZWN0b3JpZXMgPSBbXVxuXHRcdEBleHRlcm5hbExpYnJhcnlEaXJlY3RvcmllcyA9IFtdXG5cdFx0QHNvdXJjZURpcmVjdG9yaWVzID0gW11cblx0XHRAYXJncyA9IFtdXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIHNldHRlcnNcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRhZGRMaWJyYXJ5RGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAbGlicmFyeURpcmVjdG9yaWVzLnB1c2gocGF0aClcblxuXHRhZGRFeHRlcm5hbExpYnJhcnlEaXJlY3Rvcnk6IChwYXRoKSA9PlxuXHRcdEBleHRlcm5hbExpYnJhcnlEaXJlY3Rvcmllcy5wdXNoKHBhdGgpXG5cblx0YWRkU291cmNlRGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAc291cmNlRGlyZWN0b3JpZXMucHVzaChwYXRoKVxuXG5cdGFkZEFyZzogKGFyZykgPT5cblx0XHRAYXJncy5wdXNoKGFyZylcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgZ2V0dGVyc1xuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdGdldExpYnJhcmllczogPT5cblx0XHRsaWJyYXJ5RGlyZWN0b3JpZXMgPSBAYnVpbGQucmVzb2x2ZVBhdGhzKEBsaWJyYXJ5RGlyZWN0b3JpZXMuY29uY2F0KEBidWlsZC5nZXRMaWJyYXJ5RGlyZWN0b3JpZXMoKSkpXG5cdFx0bGlicmFyaWVzID0gW11cblx0XHRpZiBsaWJyYXJ5RGlyZWN0b3JpZXMgYW5kIGxpYnJhcnlEaXJlY3Rvcmllcy5sZW5ndGggPiAwXG5cdFx0XHRmb3IgZGlyZWN0b3J5IGluIGxpYnJhcnlEaXJlY3Rvcmllc1xuXHRcdFx0XHRsaWJyYXJpZXMgPSBsaWJyYXJpZXMuY29uY2F0KEBidWlsZC5nZXRTd2NMaXN0RnJvbURpcmVjdG9yeShkaXJlY3RvcnkpKVxuXHRcdGxpYnJhcmllc1xuXG5cblx0Z2V0RXh0ZXJuYWxMaWJyYXJpZXM6ID0+XG5cdFx0bGlicmFyeURpcmVjdG9yaWVzID0gQGJ1aWxkLnJlc29sdmVQYXRocyhAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMuY29uY2F0KEBidWlsZC5nZXRFeHRlcm5hbExpYnJhcnlEaXJlY3RvcmllcygpKSlcblx0XHRsaWJyYXJpZXMgPSBbXVxuXHRcdGlmIGxpYnJhcnlEaXJlY3RvcmllcyBhbmQgbGlicmFyeURpcmVjdG9yaWVzLmxlbmd0aCA+IDBcblx0XHRcdGZvciBkaXJlY3RvcnkgaW4gbGlicmFyeURpcmVjdG9yaWVzXG5cdFx0XHRcdGxpYnJhcmllcyA9IGxpYnJhcmllcy5jb25jYXQoQGJ1aWxkLmdldFN3Y0xpc3RGcm9tRGlyZWN0b3J5KGRpcmVjdG9yeSkpXG5cdFx0bGlicmFyaWVzXG5cblxuXHRnZXRTb3VyY2VEaXJlY3RvcmllczogPT5cblx0XHRAYnVpbGQucmVzb2x2ZVBhdGhzKEBzb3VyY2VEaXJlY3Rvcmllcy5jb25jYXQoQGJ1aWxkLmdldFNvdXJjZURpcmVjdG9yaWVzKCkpKVxuXG5cblx0Z2V0TWFuaWZlc3Q6IChjYWxsYmFjaykgPT5cblx0XHRzb3VyY2VEaXJlY3RvcmllcyA9IEBidWlsZC5yZXNvbHZlUGF0aHMoQHNvdXJjZURpcmVjdG9yaWVzLmNvbmNhdChAYnVpbGQuZ2V0U291cmNlRGlyZWN0b3JpZXMoKSkpXG5cblx0XHRwaWNrIHNvdXJjZURpcmVjdG9yaWVzLCBbJy55YW1sJ10sIChmaWxlcykgPT5cblx0XHRcdCMgbmFtZXNwYWNlWydodHRwOi8vc3Nlbi5uYW1lL25zL3NzZW4nXVswXSA9XG5cdFx0XHQjIFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZTonU3RyaXBlJ1xuXHRcdFx0IyBcdFx0XHRcdFx0XHRcdFx0XHRcdHBhdGg6J3NzZW4uY29tcG9uZW50cy5maWxscy5TdHJpcGUnXG5cdFx0XHRuYW1lc3BhY2VzID0ge31cblxuXHRcdFx0Zm9yIGZpbGUgaW4gZmlsZXNcblx0XHRcdFx0aWYgZmlsZS5uYW1lIGlzbnQgJ25hbWVzcGFjZSdcblx0XHRcdFx0XHRjb250aW51ZVxuXHRcdFx0XHRcblx0XHRcdFx0IyByZWFscGF0aDogJy9Vc2Vycy8uLi4vbnMvbmFtZXNwYWNlLnlhbWwnXG5cdFx0XHRcdCMgcGF0aDogJy9Vc2Vycy8uLi4vbnMvbmFtZXNwYWNlLnlhbWwnXG5cdFx0XHRcdCMgcmVsYXRpdmVfcGF0aDogJ25zL25hbWVzcGFjZS55YW1sJ1xuXHRcdFx0XHQjIGJhc2U6ICcvVXNycy8uLi4vbnMnXG5cdFx0XHRcdCMgcmVsYXRpdmVfYmFzZTogJ25zJ1xuXHRcdFx0XHQjIG5hbWU6ICduYW1lc3BhY2UnXG5cdFx0XHRcdCMgZXh0ZW5zaW9uOiAnLnlhbWwnXG5cdFx0XHRcdCMgYXRpbWVcblx0XHRcdFx0IyBtdGltZVxuXHRcdFx0XHQjIGN0aW1lXG5cdFx0XHRcdFxuXHRcdFx0XHRzcGVjID0geWFtbC5zYWZlTG9hZChmcy5yZWFkRmlsZVN5bmMoZmlsZS5yZWFscGF0aCwgJ3V0ZjgnKSlcblx0XHRcdFx0bmFtZXNwYWNlID0gc3BlYy5uYW1lc3BhY2Vcblx0XHRcdFx0Y29tcG9uZW50cyA9IHNwZWMuY29tcG9uZW50c1xuXHRcdFx0XHRkZXNjcmlwdGlvbiA9IHNwZWMuZGVzY3JpcHRpb25cblx0XHRcdFx0YmFzZV9uYW1lc3BhY2UgPSBmaWxlLnJlbGF0aXZlX2Jhc2Uuc3BsaXQoJy8nKS5qb2luKCcuJylcblx0XHRcdFx0XG5cdFx0XHRcdGZvciBjb21wb25lbnQgaW4gY29tcG9uZW50c1xuXHRcdFx0XHRcdGNvbXBvbmVudF9wYXRoID0gYmFzZV9uYW1lc3BhY2UgKyAnLicgKyBjb21wb25lbnRcblx0XHRcdFx0XHRjb21wb25lbnRfcGF0aCA9IGNvbXBvbmVudF9wYXRoLnN1YnN0cmluZygxKSBpZiBjb21wb25lbnRfcGF0aC5pbmRleE9mKCcuJykgaXMgMFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdG5hbWVzcGFjZXNbbmFtZXNwYWNlXSA9IFtdIGlmIG5hbWVzcGFjZXNbbmFtZXNwYWNlXSBpcyB1bmRlZmluZWRcblx0XHRcdFx0XHRuYW1lc3BhY2VzW25hbWVzcGFjZV0ucHVzaFxuXHRcdFx0XHRcdFx0XHRcdG5hbWU6IGNvbXBvbmVudFxuXHRcdFx0XHRcdFx0XHRcdHBhdGg6IGNvbXBvbmVudF9wYXRoXG5cblx0XHRcdGNhbGxiYWNrKG5hbWVzcGFjZXMpXG5cblxuXHRnZXRJbmNsdWRlQ2xhc3NlczogKGZpbHRlckZ1bmN0aW9uLCBjYWxsYmFjaykgPT5cblx0XHRzb3VyY2VEaXJlY3RvcmllcyA9IEBidWlsZC5yZXNvbHZlUGF0aHMoQHNvdXJjZURpcmVjdG9yaWVzLmNvbmNhdChAYnVpbGQuZ2V0U291cmNlRGlyZWN0b3JpZXMoKSkpXG5cblx0XHRwaWNrIHNvdXJjZURpcmVjdG9yaWVzLCBbJy5hcycsICcubXhtbCddLCAoZmlsZXMpID0+XG5cdFx0XHRjbGFzc1BhdGhzID0gW11cblxuXHRcdFx0Zm9yIGZpbGUgaW4gZmlsZXNcblx0XHRcdFx0ZmlsZS5jbGFzcyA9IEBidWlsZC5jbGFzc2Z5KGZpbGUpXG5cblx0XHRcdFx0aWYgZmlsdGVyRnVuY3Rpb24/XG5cdFx0XHRcdFx0aWYgZmlsdGVyRnVuY3Rpb24oZmlsZSlcblx0XHRcdFx0XHRcdGNsYXNzUGF0aHMucHVzaChmaWxlLmNsYXNzKVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0Y2xhc3NQYXRocy5wdXNoKGZpbGUuY2xhc3MpXG5cblx0XHRcdGNhbGxiYWNrKGNsYXNzUGF0aHMpXG5cblx0XHRcdFxuXHRnZXRBcmdzOiA9PlxuXHRcdEBhcmdzLmNvbmNhdChAYnVpbGQuZ2V0QXJncygpKVxuXG5leHBvcnRzLlNvdXJjZUNvbGxlY3RvciA9IFNvdXJjZUNvbGxlY3RvciJdfQ==