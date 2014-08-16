(function() {
  var SourceCollector, pick,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  pick = require('file-picker').pick;

  SourceCollector = (function() {
    function SourceCollector(build) {
      this.getArgs = __bind(this.getArgs, this);
      this.getIncludeClasses = __bind(this.getIncludeClasses, this);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZsdXRpbHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxxQkFBQTtJQUFBLGtGQUFBOztBQUFBLEVBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxhQUFSLENBQXNCLENBQUMsSUFBOUIsQ0FBQTs7QUFBQSxFQUVNO0FBQ1EsSUFBQSx5QkFBQyxLQUFELEdBQUE7QUFDWiwrQ0FBQSxDQUFBO0FBQUEsbUVBQUEsQ0FBQTtBQUFBLHlFQUFBLENBQUE7QUFBQSx5RUFBQSxDQUFBO0FBQUEseURBQUEsQ0FBQTtBQUFBLDZDQUFBLENBQUE7QUFBQSxxRUFBQSxDQUFBO0FBQUEsdUZBQUEsQ0FBQTtBQUFBLHVFQUFBLENBQUE7QUFBQSxNQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsS0FBVCxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsRUFEdEIsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLDBCQUFELEdBQThCLEVBRjlCLENBQUE7QUFBQSxNQUdBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixFQUhyQixDQUFBO0FBQUEsTUFJQSxJQUFDLENBQUEsSUFBRCxHQUFRLEVBSlIsQ0FEWTtJQUFBLENBQWI7O0FBQUEsOEJBVUEsbUJBQUEsR0FBcUIsU0FBQyxJQUFELEdBQUE7YUFDcEIsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQXlCLElBQXpCLEVBRG9CO0lBQUEsQ0FWckIsQ0FBQTs7QUFBQSw4QkFhQSwyQkFBQSxHQUE2QixTQUFDLElBQUQsR0FBQTthQUM1QixJQUFDLENBQUEsMEJBQTBCLENBQUMsSUFBNUIsQ0FBaUMsSUFBakMsRUFENEI7SUFBQSxDQWI3QixDQUFBOztBQUFBLDhCQWdCQSxrQkFBQSxHQUFvQixTQUFDLElBQUQsR0FBQTthQUNuQixJQUFDLENBQUEsaUJBQWlCLENBQUMsSUFBbkIsQ0FBd0IsSUFBeEIsRUFEbUI7SUFBQSxDQWhCcEIsQ0FBQTs7QUFBQSw4QkFtQkEsTUFBQSxHQUFRLFNBQUMsR0FBRCxHQUFBO2FBQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsR0FBWCxFQURPO0lBQUEsQ0FuQlIsQ0FBQTs7QUFBQSw4QkF5QkEsWUFBQSxHQUFjLFNBQUEsR0FBQTtBQUNiLFVBQUEsa0RBQUE7QUFBQSxNQUFBLGtCQUFBLEdBQXFCLElBQUMsQ0FBQSxLQUFLLENBQUMsWUFBUCxDQUFvQixJQUFDLENBQUEsa0JBQWtCLENBQUMsTUFBcEIsQ0FBMkIsSUFBQyxDQUFBLEtBQUssQ0FBQyxxQkFBUCxDQUFBLENBQTNCLENBQXBCLENBQXJCLENBQUE7QUFBQSxNQUNBLFNBQUEsR0FBWSxFQURaLENBQUE7QUFFQSxNQUFBLElBQUcsa0JBQUEsSUFBdUIsa0JBQWtCLENBQUMsTUFBbkIsR0FBNEIsQ0FBdEQ7QUFDQyxhQUFBLHlEQUFBOzZDQUFBO0FBQ0MsVUFBQSxTQUFBLEdBQVksU0FBUyxDQUFDLE1BQVYsQ0FBaUIsSUFBQyxDQUFBLEtBQUssQ0FBQyx1QkFBUCxDQUErQixTQUEvQixDQUFqQixDQUFaLENBREQ7QUFBQSxTQUREO09BRkE7YUFLQSxVQU5hO0lBQUEsQ0F6QmQsQ0FBQTs7QUFBQSw4QkFpQ0Esb0JBQUEsR0FBc0IsU0FBQSxHQUFBO0FBQ3JCLFVBQUEsa0RBQUE7QUFBQSxNQUFBLGtCQUFBLEdBQXFCLElBQUMsQ0FBQSxLQUFLLENBQUMsWUFBUCxDQUFvQixJQUFDLENBQUEsMEJBQTBCLENBQUMsTUFBNUIsQ0FBbUMsSUFBQyxDQUFBLEtBQUssQ0FBQyw2QkFBUCxDQUFBLENBQW5DLENBQXBCLENBQXJCLENBQUE7QUFBQSxNQUNBLFNBQUEsR0FBWSxFQURaLENBQUE7QUFFQSxNQUFBLElBQUcsa0JBQUEsSUFBdUIsa0JBQWtCLENBQUMsTUFBbkIsR0FBNEIsQ0FBdEQ7QUFDQyxhQUFBLHlEQUFBOzZDQUFBO0FBQ0MsVUFBQSxTQUFBLEdBQVksU0FBUyxDQUFDLE1BQVYsQ0FBaUIsSUFBQyxDQUFBLEtBQUssQ0FBQyx1QkFBUCxDQUErQixTQUEvQixDQUFqQixDQUFaLENBREQ7QUFBQSxTQUREO09BRkE7YUFLQSxVQU5xQjtJQUFBLENBakN0QixDQUFBOztBQUFBLDhCQXlDQSxvQkFBQSxHQUFzQixTQUFBLEdBQUE7YUFDckIsSUFBQyxDQUFBLEtBQUssQ0FBQyxZQUFQLENBQW9CLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxNQUFuQixDQUEwQixJQUFDLENBQUEsS0FBSyxDQUFDLG9CQUFQLENBQUEsQ0FBMUIsQ0FBcEIsRUFEcUI7SUFBQSxDQXpDdEIsQ0FBQTs7QUFBQSw4QkE0Q0EsaUJBQUEsR0FBbUIsU0FBQyxjQUFELEVBQWlCLFFBQWpCLEdBQUE7QUFDbEIsVUFBQSxpQkFBQTtBQUFBLE1BQUEsaUJBQUEsR0FBb0IsSUFBQyxDQUFBLEtBQUssQ0FBQyxZQUFQLENBQW9CLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxNQUFuQixDQUEwQixJQUFDLENBQUEsS0FBSyxDQUFDLG9CQUFQLENBQUEsQ0FBMUIsQ0FBcEIsQ0FBcEIsQ0FBQTthQUVBLElBQUEsQ0FBSyxpQkFBTCxFQUF3QixDQUFDLEtBQUQsRUFBUSxPQUFSLENBQXhCLEVBQTBDLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLEtBQUQsR0FBQTtBQUN6QyxjQUFBLDBCQUFBO0FBQUEsVUFBQSxVQUFBLEdBQWEsRUFBYixDQUFBO0FBRUEsZUFBQSw0Q0FBQTs2QkFBQTtBQUNDLFlBQUEsSUFBSSxDQUFDLE9BQUQsQ0FBSixHQUFhLEtBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFlLElBQWYsQ0FBYixDQUFBO0FBRUEsWUFBQSxJQUFHLHNCQUFIO0FBQ0MsY0FBQSxJQUFHLGNBQUEsQ0FBZSxJQUFmLENBQUg7QUFDQyxnQkFBQSxVQUFVLENBQUMsSUFBWCxDQUFnQixJQUFJLENBQUMsT0FBRCxDQUFwQixDQUFBLENBREQ7ZUFERDthQUFBLE1BQUE7QUFJQyxjQUFBLFVBQVUsQ0FBQyxJQUFYLENBQWdCLElBQUksQ0FBQyxPQUFELENBQXBCLENBQUEsQ0FKRDthQUhEO0FBQUEsV0FGQTtpQkFXQSxRQUFBLENBQVMsVUFBVCxFQVp5QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTFDLEVBSGtCO0lBQUEsQ0E1Q25CLENBQUE7O0FBQUEsOEJBNkRBLE9BQUEsR0FBUyxTQUFBLEdBQUE7YUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBQSxDQUFiLEVBRFE7SUFBQSxDQTdEVCxDQUFBOzsyQkFBQTs7TUFIRCxDQUFBOztBQUFBLEVBbUVBLE9BQU8sQ0FBQyxlQUFSLEdBQTBCLGVBbkUxQixDQUFBO0FBQUEiLCJmaWxlIjoiZmx1dGlscy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbInBpY2sgPSByZXF1aXJlKCdmaWxlLXBpY2tlcicpLnBpY2tcblxuY2xhc3MgU291cmNlQ29sbGVjdG9yXG5cdGNvbnN0cnVjdG9yOiAoYnVpbGQpIC0+XG5cdFx0QGJ1aWxkID0gYnVpbGRcblx0XHRAbGlicmFyeURpcmVjdG9yaWVzID0gW11cblx0XHRAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMgPSBbXVxuXHRcdEBzb3VyY2VEaXJlY3RvcmllcyA9IFtdXG5cdFx0QGFyZ3MgPSBbXVxuXG5cdCMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBzZXR0ZXJzXG5cdCMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0YWRkTGlicmFyeURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QGxpYnJhcnlEaXJlY3Rvcmllcy5wdXNoKHBhdGgpXG5cblx0YWRkRXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAZXh0ZXJuYWxMaWJyYXJ5RGlyZWN0b3JpZXMucHVzaChwYXRoKVxuXG5cdGFkZFNvdXJjZURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QHNvdXJjZURpcmVjdG9yaWVzLnB1c2gocGF0aClcblxuXHRhZGRBcmc6IChhcmcpID0+XG5cdFx0QGFyZ3MucHVzaChhcmcpXG5cblx0IyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIGdldHRlcnNcblx0IyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRnZXRMaWJyYXJpZXM6ID0+XG5cdFx0bGlicmFyeURpcmVjdG9yaWVzID0gQGJ1aWxkLnJlc29sdmVQYXRocyhAbGlicmFyeURpcmVjdG9yaWVzLmNvbmNhdChAYnVpbGQuZ2V0TGlicmFyeURpcmVjdG9yaWVzKCkpKVxuXHRcdGxpYnJhcmllcyA9IFtdXG5cdFx0aWYgbGlicmFyeURpcmVjdG9yaWVzIGFuZCBsaWJyYXJ5RGlyZWN0b3JpZXMubGVuZ3RoID4gMFxuXHRcdFx0Zm9yIGRpcmVjdG9yeSBpbiBsaWJyYXJ5RGlyZWN0b3JpZXNcblx0XHRcdFx0bGlicmFyaWVzID0gbGlicmFyaWVzLmNvbmNhdChAYnVpbGQuZ2V0U3djTGlzdEZyb21EaXJlY3RvcnkoZGlyZWN0b3J5KSlcblx0XHRsaWJyYXJpZXNcblxuXHRnZXRFeHRlcm5hbExpYnJhcmllczogPT5cblx0XHRsaWJyYXJ5RGlyZWN0b3JpZXMgPSBAYnVpbGQucmVzb2x2ZVBhdGhzKEBleHRlcm5hbExpYnJhcnlEaXJlY3Rvcmllcy5jb25jYXQoQGJ1aWxkLmdldEV4dGVybmFsTGlicmFyeURpcmVjdG9yaWVzKCkpKVxuXHRcdGxpYnJhcmllcyA9IFtdXG5cdFx0aWYgbGlicmFyeURpcmVjdG9yaWVzIGFuZCBsaWJyYXJ5RGlyZWN0b3JpZXMubGVuZ3RoID4gMFxuXHRcdFx0Zm9yIGRpcmVjdG9yeSBpbiBsaWJyYXJ5RGlyZWN0b3JpZXNcblx0XHRcdFx0bGlicmFyaWVzID0gbGlicmFyaWVzLmNvbmNhdChAYnVpbGQuZ2V0U3djTGlzdEZyb21EaXJlY3RvcnkoZGlyZWN0b3J5KSlcblx0XHRsaWJyYXJpZXNcblxuXHRnZXRTb3VyY2VEaXJlY3RvcmllczogPT5cblx0XHRAYnVpbGQucmVzb2x2ZVBhdGhzKEBzb3VyY2VEaXJlY3Rvcmllcy5jb25jYXQoQGJ1aWxkLmdldFNvdXJjZURpcmVjdG9yaWVzKCkpKVxuXG5cdGdldEluY2x1ZGVDbGFzc2VzOiAoZmlsdGVyRnVuY3Rpb24sIGNhbGxiYWNrKSA9PlxuXHRcdHNvdXJjZURpcmVjdG9yaWVzID0gQGJ1aWxkLnJlc29sdmVQYXRocyhAc291cmNlRGlyZWN0b3JpZXMuY29uY2F0KEBidWlsZC5nZXRTb3VyY2VEaXJlY3RvcmllcygpKSlcblxuXHRcdHBpY2sgc291cmNlRGlyZWN0b3JpZXMsIFsnLmFzJywgJy5teG1sJ10sIChmaWxlcykgPT5cblx0XHRcdGNsYXNzUGF0aHMgPSBbXVxuXG5cdFx0XHRmb3IgZmlsZSBpbiBmaWxlc1xuXHRcdFx0XHRmaWxlLmNsYXNzID0gQGJ1aWxkLmNsYXNzZnkoZmlsZSlcblxuXHRcdFx0XHRpZiBmaWx0ZXJGdW5jdGlvbj9cblx0XHRcdFx0XHRpZiBmaWx0ZXJGdW5jdGlvbihmaWxlKVxuXHRcdFx0XHRcdFx0Y2xhc3NQYXRocy5wdXNoKGZpbGUuY2xhc3MpXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRjbGFzc1BhdGhzLnB1c2goZmlsZS5jbGFzcylcblxuXHRcdFx0Y2FsbGJhY2soY2xhc3NQYXRocylcblxuXHRnZXRBcmdzOiA9PlxuXHRcdEBhcmdzLmNvbmNhdChAYnVpbGQuZ2V0QXJncygpKVxuXG5leHBvcnRzLlNvdXJjZUNvbGxlY3RvciA9IFNvdXJjZUNvbGxlY3RvciJdfQ==