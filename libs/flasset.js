(function() {
  var $fs, $path, Flasset, SourceCollector, async, exec,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $fs = require('fs-extra');

  $path = require('path');

  async = require('async');

  exec = require('done-exec');

  SourceCollector = require('./flutils').SourceCollector;

  Flasset = (function() {
    function Flasset(build) {
      this.create = __bind(this.create, this);
      this.addAssetDirectory = __bind(this.addAssetDirectory, this);
      this.collector = new SourceCollector(build);
      this.build = build;
      this.assets = [];
    }

    Flasset.prototype.embed = function(extname, file, className) {
      switch (extname.toLowerCase()) {
        case '.jpg':
        case '.jpeg':
        case '.gif':
        case '.png':
        case '.svg':
        case '.mp3':
        case '.swf':
          return "[Embed(source='" + file + "')] public static const " + className + " : Class;";
        default:
          return "[Embed(source='" + file + "', mimeType='application/octet-stream')] public static const " + className + " : Class;";
      }
    };

    Flasset.prototype.addAssetDirectory = function(assetClassPath, directory) {
      return this.assets.push({
        assetClassPath: assetClassPath,
        directory: directory
      });
    };

    Flasset.prototype.create = function(output, complete) {
      var cacheDirectory, classNameReg, embed, task;
      cacheDirectory = $path.normalize('.assets_cache');
      classNameReg = /^[A-Za-z][A-Za-z0-9_]+/;
      embed = this.embed;
      this.collector.addSourceDirectory($path.join(cacheDirectory, 'src'));
      if ($fs.existsSync(cacheDirectory)) {
        $fs.removeSync(cacheDirectory);
      }
      task = function(obj, next) {
        var assetClassPath, className, directory, namespace, paths, sourceDirectory;
        assetClassPath = obj['assetClassPath'];
        directory = obj['directory'];
        paths = assetClassPath.split('.');
        className = paths.pop();
        namespace = paths.join('.');
        paths.unshift(cacheDirectory, 'src');
        sourceDirectory = paths.join('/');
        return $fs.mkdirs(sourceDirectory, function(err) {
          if (err != null) {
            next(err);
            return;
          }
          return $fs.copy(directory, sourceDirectory, function(err) {
            var embeds, extname, file, fileClassName, files, source, stat, _i, _len;
            if (err != null) {
              next(err);
              return;
            }
            files = $fs.readdirSync(sourceDirectory);
            embeds = [];
            for (_i = 0, _len = files.length; _i < _len; _i++) {
              file = files[_i];
              stat = $fs.statSync($path.join(sourceDirectory, file));
              extname = $path.extname(file);
              fileClassName = file.replace(extname, '');
              if (stat.isFile() && classNameReg.test(fileClassName)) {
                embeds.push(embed(extname, file, fileClassName));
              }
            }
            source = "package " + namespace + " {\npublic class " + className + " {\n" + (embeds.join('\n')) + "\n}\n}";
            return $fs.writeFile($path.join(sourceDirectory, "" + className + ".as"), source, {
              encoding: 'utf8'
            }, function(err) {
              if (err != null) {
                next(err);
                return;
              }
              return next();
            });
          });
        });
      };
      return async.eachSeries(this.assets, task, (function(_this) {
        return function(err) {
          var bin;
          if (err != null) {
            complete(err);
            return;
          }
          bin = 'compc';
          return _this.build.getSDKVersion(function(version) {
            var args, directory, library, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
            if (process.platform.indexOf('win') === 0) {
              if (version > '4.6.0') {
                bin = 'compc.bat';
              } else {
                bin = 'compc.exe';
              }
            }
            args = [];
            args.push(_this.build.wrap(_this.build.getEnv('FLEX_HOME') + '/bin/' + bin));
            _ref = _this.collector.getLibraries();
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              library = _ref[_i];
              args.push('-library-path ' + _this.build.wrap(library));
            }
            _ref1 = _this.collector.getExternalLibraries();
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              library = _ref1[_j];
              args.push('-external-library-path ' + _this.build.wrap(library));
            }
            _ref2 = _this.collector.getSourceDirectories();
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              directory = _ref2[_k];
              args.push('-source-path ' + _this.build.wrap(directory));
              args.push('-include-sources ' + _this.build.wrap(directory));
            }
            args.push('-output ' + _this.build.wrap(_this.build.resolvePath(output)));
            return exec(args.join(' ')).run(function() {
              if ($fs.existsSync(cacheDirectory)) {
                $fs.removeSync(cacheDirectory);
              }
              console.log(cacheDirectory);
              return complete();
            });
          });
        };
      })(this));
    };

    return Flasset;

  })();

  module.exports = Flasset;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZsYXNzZXQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpREFBQTtJQUFBLGtGQUFBOztBQUFBLEVBQUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxVQUFSLENBQU4sQ0FBQTs7QUFBQSxFQUNBLEtBQUEsR0FBUSxPQUFBLENBQVEsTUFBUixDQURSLENBQUE7O0FBQUEsRUFFQSxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FGUixDQUFBOztBQUFBLEVBR0EsSUFBQSxHQUFPLE9BQUEsQ0FBUSxXQUFSLENBSFAsQ0FBQTs7QUFBQSxFQUlDLGtCQUFtQixPQUFBLENBQVEsV0FBUixFQUFuQixlQUpELENBQUE7O0FBQUEsRUFPTTtBQUNRLElBQUEsaUJBQUMsS0FBRCxHQUFBO0FBQ1osNkNBQUEsQ0FBQTtBQUFBLG1FQUFBLENBQUE7QUFBQSxNQUFBLElBQUMsQ0FBQSxTQUFELEdBQWlCLElBQUEsZUFBQSxDQUFnQixLQUFoQixDQUFqQixDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTLEtBRFQsQ0FBQTtBQUFBLE1BRUEsSUFBQyxDQUFBLE1BQUQsR0FBVSxFQUZWLENBRFk7SUFBQSxDQUFiOztBQUFBLHNCQUtBLEtBQUEsR0FBTyxTQUFDLE9BQUQsRUFBVSxJQUFWLEVBQWdCLFNBQWhCLEdBQUE7QUFDTixjQUFPLE9BQU8sQ0FBQyxXQUFSLENBQUEsQ0FBUDtBQUFBLGFBQ00sTUFETjtBQUFBLGFBQ2MsT0FEZDtBQUFBLGFBQ3VCLE1BRHZCO0FBQUEsYUFDK0IsTUFEL0I7QUFBQSxhQUN1QyxNQUR2QztBQUFBLGFBQytDLE1BRC9DO0FBQUEsYUFDdUQsTUFEdkQ7aUJBQ29FLGlCQUFBLEdBQWdCLElBQWhCLEdBQXNCLDBCQUF0QixHQUErQyxTQUEvQyxHQUEwRCxZQUQ5SDtBQUFBO2lCQUVPLGlCQUFBLEdBQWdCLElBQWhCLEdBQXNCLCtEQUF0QixHQUFvRixTQUFwRixHQUErRixZQUZ0RztBQUFBLE9BRE07SUFBQSxDQUxQLENBQUE7O0FBQUEsc0JBYUEsaUJBQUEsR0FBbUIsU0FBQyxjQUFELEVBQWlCLFNBQWpCLEdBQUE7YUFDbEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLENBQ0M7QUFBQSxRQUFBLGNBQUEsRUFBZ0IsY0FBaEI7QUFBQSxRQUNBLFNBQUEsRUFBVyxTQURYO09BREQsRUFEa0I7SUFBQSxDQWJuQixDQUFBOztBQUFBLHNCQXVCQSxNQUFBLEdBQVEsU0FBQyxNQUFELEVBQVMsUUFBVCxHQUFBO0FBQ1AsVUFBQSx5Q0FBQTtBQUFBLE1BQUEsY0FBQSxHQUFpQixLQUFLLENBQUMsU0FBTixDQUFnQixlQUFoQixDQUFqQixDQUFBO0FBQUEsTUFDQSxZQUFBLEdBQWUsd0JBRGYsQ0FBQTtBQUFBLE1BRUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxLQUZULENBQUE7QUFBQSxNQUlBLElBQUMsQ0FBQSxTQUFTLENBQUMsa0JBQVgsQ0FBOEIsS0FBSyxDQUFDLElBQU4sQ0FBVyxjQUFYLEVBQTJCLEtBQTNCLENBQTlCLENBSkEsQ0FBQTtBQU9BLE1BQUEsSUFBa0MsR0FBRyxDQUFDLFVBQUosQ0FBZSxjQUFmLENBQWxDO0FBQUEsUUFBQSxHQUFHLENBQUMsVUFBSixDQUFlLGNBQWYsQ0FBQSxDQUFBO09BUEE7QUFBQSxNQVNBLElBQUEsR0FBTyxTQUFDLEdBQUQsRUFBTSxJQUFOLEdBQUE7QUFDTixZQUFBLHVFQUFBO0FBQUEsUUFBQSxjQUFBLEdBQWlCLEdBQUksQ0FBQSxnQkFBQSxDQUFyQixDQUFBO0FBQUEsUUFDQSxTQUFBLEdBQVksR0FBSSxDQUFBLFdBQUEsQ0FEaEIsQ0FBQTtBQUFBLFFBR0EsS0FBQSxHQUFRLGNBQWMsQ0FBQyxLQUFmLENBQXFCLEdBQXJCLENBSFIsQ0FBQTtBQUFBLFFBSUEsU0FBQSxHQUFZLEtBQUssQ0FBQyxHQUFOLENBQUEsQ0FKWixDQUFBO0FBQUEsUUFLQSxTQUFBLEdBQVksS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYLENBTFosQ0FBQTtBQUFBLFFBTUEsS0FBSyxDQUFDLE9BQU4sQ0FBYyxjQUFkLEVBQThCLEtBQTlCLENBTkEsQ0FBQTtBQUFBLFFBUUEsZUFBQSxHQUFrQixLQUFLLENBQUMsSUFBTixDQUFXLEdBQVgsQ0FSbEIsQ0FBQTtlQWFBLEdBQUcsQ0FBQyxNQUFKLENBQVcsZUFBWCxFQUE0QixTQUFDLEdBQUQsR0FBQTtBQUMzQixVQUFBLElBQUcsV0FBSDtBQUNDLFlBQUEsSUFBQSxDQUFLLEdBQUwsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FGRDtXQUFBO2lCQU9BLEdBQUcsQ0FBQyxJQUFKLENBQVMsU0FBVCxFQUFvQixlQUFwQixFQUFxQyxTQUFDLEdBQUQsR0FBQTtBQUNwQyxnQkFBQSxtRUFBQTtBQUFBLFlBQUEsSUFBRyxXQUFIO0FBQ0MsY0FBQSxJQUFBLENBQUssR0FBTCxDQUFBLENBQUE7QUFDQSxvQkFBQSxDQUZEO2FBQUE7QUFBQSxZQU9BLEtBQUEsR0FBUSxHQUFHLENBQUMsV0FBSixDQUFnQixlQUFoQixDQVBSLENBQUE7QUFBQSxZQVFBLE1BQUEsR0FBUyxFQVJULENBQUE7QUFVQSxpQkFBQSw0Q0FBQTsrQkFBQTtBQUNDLGNBQUEsSUFBQSxHQUFPLEdBQUcsQ0FBQyxRQUFKLENBQWEsS0FBSyxDQUFDLElBQU4sQ0FBVyxlQUFYLEVBQTRCLElBQTVCLENBQWIsQ0FBUCxDQUFBO0FBQUEsY0FDQSxPQUFBLEdBQVUsS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBRFYsQ0FBQTtBQUFBLGNBRUEsYUFBQSxHQUFnQixJQUFJLENBQUMsT0FBTCxDQUFhLE9BQWIsRUFBc0IsRUFBdEIsQ0FGaEIsQ0FBQTtBQUlBLGNBQUEsSUFBRyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsSUFBa0IsWUFBWSxDQUFDLElBQWIsQ0FBa0IsYUFBbEIsQ0FBckI7QUFDQyxnQkFBQSxNQUFNLENBQUMsSUFBUCxDQUFZLEtBQUEsQ0FBTSxPQUFOLEVBQWUsSUFBZixFQUFxQixhQUFyQixDQUFaLENBQUEsQ0FERDtlQUxEO0FBQUEsYUFWQTtBQUFBLFlBbUJBLE1BQUEsR0FBWSxVQUFBLEdBQ1QsU0FEUyxHQUNFLG1CQURGLEdBRVgsU0FGVyxHQUVBLE1BRkEsR0FFSSxDQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBWixDQUFBLENBRkosR0FHWixRQXRCQSxDQUFBO21CQThCQSxHQUFHLENBQUMsU0FBSixDQUFjLEtBQUssQ0FBQyxJQUFOLENBQVcsZUFBWCxFQUE0QixFQUFBLEdBQUUsU0FBRixHQUFhLEtBQXpDLENBQWQsRUFBOEQsTUFBOUQsRUFBc0U7QUFBQSxjQUFDLFFBQUEsRUFBUyxNQUFWO2FBQXRFLEVBQXlGLFNBQUMsR0FBRCxHQUFBO0FBQ3hGLGNBQUEsSUFBRyxXQUFIO0FBQ0MsZ0JBQUEsSUFBQSxDQUFLLEdBQUwsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FGRDtlQUFBO3FCQUlBLElBQUEsQ0FBQSxFQUx3RjtZQUFBLENBQXpGLEVBL0JvQztVQUFBLENBQXJDLEVBUjJCO1FBQUEsQ0FBNUIsRUFkTTtNQUFBLENBVFAsQ0FBQTthQXdFQSxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFDLENBQUEsTUFBbEIsRUFBMEIsSUFBMUIsRUFBZ0MsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsR0FBRCxHQUFBO0FBQy9CLGNBQUEsR0FBQTtBQUFBLFVBQUEsSUFBRyxXQUFIO0FBQ0MsWUFBQSxRQUFBLENBQVMsR0FBVCxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUZEO1dBQUE7QUFBQSxVQU9BLEdBQUEsR0FBTSxPQVBOLENBQUE7aUJBU0EsS0FBQyxDQUFBLEtBQUssQ0FBQyxhQUFQLENBQXFCLFNBQUMsT0FBRCxHQUFBO0FBQ3BCLGdCQUFBLDRFQUFBO0FBQUEsWUFBQSxJQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBakIsQ0FBeUIsS0FBekIsQ0FBQSxLQUFtQyxDQUF0QztBQUNDLGNBQUEsSUFBRyxPQUFBLEdBQVUsT0FBYjtBQUNDLGdCQUFBLEdBQUEsR0FBTSxXQUFOLENBREQ7ZUFBQSxNQUFBO0FBR0MsZ0JBQUEsR0FBQSxHQUFNLFdBQU4sQ0FIRDtlQUREO2FBQUE7QUFBQSxZQU1BLElBQUEsR0FBTyxFQU5QLENBQUE7QUFBQSxZQVFBLElBQUksQ0FBQyxJQUFMLENBQVUsS0FBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksS0FBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQWMsV0FBZCxDQUFBLEdBQTZCLE9BQTdCLEdBQXVDLEdBQW5ELENBQVYsQ0FSQSxDQUFBO0FBVUE7QUFBQSxpQkFBQSwyQ0FBQTtpQ0FBQTtBQUNDLGNBQUEsSUFBSSxDQUFDLElBQUwsQ0FBVSxnQkFBQSxHQUFtQixLQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBWSxPQUFaLENBQTdCLENBQUEsQ0FERDtBQUFBLGFBVkE7QUFhQTtBQUFBLGlCQUFBLDhDQUFBO2tDQUFBO0FBQ0MsY0FBQSxJQUFJLENBQUMsSUFBTCxDQUFVLHlCQUFBLEdBQTRCLEtBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLE9BQVosQ0FBdEMsQ0FBQSxDQUREO0FBQUEsYUFiQTtBQWdCQTtBQUFBLGlCQUFBLDhDQUFBO29DQUFBO0FBQ0MsY0FBQSxJQUFJLENBQUMsSUFBTCxDQUFVLGVBQUEsR0FBa0IsS0FBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksU0FBWixDQUE1QixDQUFBLENBQUE7QUFBQSxjQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsbUJBQUEsR0FBc0IsS0FBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksU0FBWixDQUFoQyxDQURBLENBREQ7QUFBQSxhQWhCQTtBQUFBLFlBb0JBLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBQSxHQUFhLEtBQUMsQ0FBQSxLQUFLLENBQUMsSUFBUCxDQUFZLEtBQUMsQ0FBQSxLQUFLLENBQUMsV0FBUCxDQUFtQixNQUFuQixDQUFaLENBQXZCLENBcEJBLENBQUE7bUJBeUJBLElBQUEsQ0FBSyxJQUFJLENBQUMsSUFBTCxDQUFVLEdBQVYsQ0FBTCxDQUFvQixDQUFDLEdBQXJCLENBQXlCLFNBQUEsR0FBQTtBQUN4QixjQUFBLElBQWtDLEdBQUcsQ0FBQyxVQUFKLENBQWUsY0FBZixDQUFsQztBQUFBLGdCQUFBLEdBQUcsQ0FBQyxVQUFKLENBQWUsY0FBZixDQUFBLENBQUE7ZUFBQTtBQUFBLGNBRUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxjQUFaLENBRkEsQ0FBQTtxQkFJQSxRQUFBLENBQUEsRUFMd0I7WUFBQSxDQUF6QixFQTFCb0I7VUFBQSxDQUFyQixFQVYrQjtRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhDLEVBekVPO0lBQUEsQ0F2QlIsQ0FBQTs7bUJBQUE7O01BUkQsQ0FBQTs7QUFBQSxFQW1KQSxNQUFNLENBQUMsT0FBUCxHQUFpQixPQW5KakIsQ0FBQTtBQUFBIiwiZmlsZSI6ImZsYXNzZXQuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIkZnMgPSByZXF1aXJlKCdmcy1leHRyYScpXG4kcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuYXN5bmMgPSByZXF1aXJlKCdhc3luYycpXG5leGVjID0gcmVxdWlyZSgnZG9uZS1leGVjJylcbntTb3VyY2VDb2xsZWN0b3J9ID0gcmVxdWlyZSgnLi9mbHV0aWxzJylcblxuXG5jbGFzcyBGbGFzc2V0XG5cdGNvbnN0cnVjdG9yOiAoYnVpbGQpIC0+XG5cdFx0QGNvbGxlY3RvciA9IG5ldyBTb3VyY2VDb2xsZWN0b3IoYnVpbGQpXG5cdFx0QGJ1aWxkID0gYnVpbGRcblx0XHRAYXNzZXRzID0gW11cblxuXHRlbWJlZDogKGV4dG5hbWUsIGZpbGUsIGNsYXNzTmFtZSkgLT5cblx0XHRzd2l0Y2ggZXh0bmFtZS50b0xvd2VyQ2FzZSgpXG5cdFx0XHR3aGVuICcuanBnJywgJy5qcGVnJywgJy5naWYnLCAnLnBuZycsICcuc3ZnJywgJy5tcDMnLCAnLnN3ZicgdGhlbiBcIltFbWJlZChzb3VyY2U9JyN7ZmlsZX0nKV0gcHVibGljIHN0YXRpYyBjb25zdCAje2NsYXNzTmFtZX0gOiBDbGFzcztcIlxuXHRcdFx0ZWxzZSBcIltFbWJlZChzb3VyY2U9JyN7ZmlsZX0nLCBtaW1lVHlwZT0nYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyldIHB1YmxpYyBzdGF0aWMgY29uc3QgI3tjbGFzc05hbWV9IDogQ2xhc3M7XCJcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgc2V0dGluZ1xuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdGFkZEFzc2V0RGlyZWN0b3J5OiAoYXNzZXRDbGFzc1BhdGgsIGRpcmVjdG9yeSkgPT5cblx0XHRAYXNzZXRzLnB1c2hcblx0XHRcdGFzc2V0Q2xhc3NQYXRoOiBhc3NldENsYXNzUGF0aFxuXHRcdFx0ZGlyZWN0b3J5OiBkaXJlY3RvcnlcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgY3JlYXRlXG5cdCMgLSBzd2MgZmlsZVxuXHQjIC0gYnJvY2h1cmUgZmlsZSB7IGltYWdlIHByZXZpZXcsIHZhcmlhYmxlLCBpbWFnZSBzaXplIH1cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRjcmVhdGU6IChvdXRwdXQsIGNvbXBsZXRlKSA9PlxuXHRcdGNhY2hlRGlyZWN0b3J5ID0gJHBhdGgubm9ybWFsaXplKCcuYXNzZXRzX2NhY2hlJylcblx0XHRjbGFzc05hbWVSZWcgPSAvXltBLVphLXpdW0EtWmEtejAtOV9dKy87XG5cdFx0ZW1iZWQgPSBAZW1iZWRcblxuXHRcdEBjb2xsZWN0b3IuYWRkU291cmNlRGlyZWN0b3J5KCRwYXRoLmpvaW4oY2FjaGVEaXJlY3RvcnksICdzcmMnKSlcblxuXHRcdCMgcmVtb3ZlIGNhY2hlIGRpcmVjdG9yeSBpZiBleGlzdHNcblx0XHQkZnMucmVtb3ZlU3luYyhjYWNoZURpcmVjdG9yeSkgaWYgJGZzLmV4aXN0c1N5bmMoY2FjaGVEaXJlY3RvcnkpXG5cblx0XHR0YXNrID0gKG9iaiwgbmV4dCkgLT5cblx0XHRcdGFzc2V0Q2xhc3NQYXRoID0gb2JqWydhc3NldENsYXNzUGF0aCddXG5cdFx0XHRkaXJlY3RvcnkgPSBvYmpbJ2RpcmVjdG9yeSddXG5cblx0XHRcdHBhdGhzID0gYXNzZXRDbGFzc1BhdGguc3BsaXQoJy4nKVxuXHRcdFx0Y2xhc3NOYW1lID0gcGF0aHMucG9wKClcblx0XHRcdG5hbWVzcGFjZSA9IHBhdGhzLmpvaW4oJy4nKVxuXHRcdFx0cGF0aHMudW5zaGlmdChjYWNoZURpcmVjdG9yeSwgJ3NyYycpXG5cblx0XHRcdHNvdXJjZURpcmVjdG9yeSA9IHBhdGhzLmpvaW4oJy8nKVxuXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0IyAxIG1rZGlyIHNyY1xuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdCRmcy5ta2RpcnMgc291cmNlRGlyZWN0b3J5LCAoZXJyKSAtPlxuXHRcdFx0XHRpZiBlcnI/XG5cdFx0XHRcdFx0bmV4dChlcnIpXG5cdFx0XHRcdFx0cmV0dXJuXG5cblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdFx0IyAyIGNsb25lIGZpbGVzXG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCRmcy5jb3B5IGRpcmVjdG9yeSwgc291cmNlRGlyZWN0b3J5LCAoZXJyKSAtPlxuXHRcdFx0XHRcdGlmIGVycj9cblx0XHRcdFx0XHRcdG5leHQoZXJyKVxuXHRcdFx0XHRcdFx0cmV0dXJuXG5cblx0XHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHRcdCMgMyBjcmVhdGUgc291cmNlIGNvZGVcblx0XHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHRcdGZpbGVzID0gJGZzLnJlYWRkaXJTeW5jKHNvdXJjZURpcmVjdG9yeSlcblx0XHRcdFx0XHRlbWJlZHMgPSBbXVxuXG5cdFx0XHRcdFx0Zm9yIGZpbGUgaW4gZmlsZXNcblx0XHRcdFx0XHRcdHN0YXQgPSAkZnMuc3RhdFN5bmMoJHBhdGguam9pbihzb3VyY2VEaXJlY3RvcnksIGZpbGUpKVxuXHRcdFx0XHRcdFx0ZXh0bmFtZSA9ICRwYXRoLmV4dG5hbWUoZmlsZSlcblx0XHRcdFx0XHRcdGZpbGVDbGFzc05hbWUgPSBmaWxlLnJlcGxhY2UoZXh0bmFtZSwgJycpXG5cblx0XHRcdFx0XHRcdGlmIHN0YXQuaXNGaWxlKCkgYW5kIGNsYXNzTmFtZVJlZy50ZXN0KGZpbGVDbGFzc05hbWUpXG5cdFx0XHRcdFx0XHRcdGVtYmVkcy5wdXNoKGVtYmVkKGV4dG5hbWUsIGZpbGUsIGZpbGVDbGFzc05hbWUpKVxuXG5cblx0XHRcdFx0XHRzb3VyY2UgPSBcIlwiXCJcblx0XHRcdFx0XHRcdFx0cGFja2FnZSAje25hbWVzcGFjZX0ge1xuXHRcdFx0XHRcdFx0XHRwdWJsaWMgY2xhc3MgI3tjbGFzc05hbWV9IHtcblx0XHRcdFx0XHRcdFx0I3tlbWJlZHMuam9pbignXFxuJyl9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcIlwiXCJcblxuXHRcdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdFx0IyA0IGNyZWF0ZSBzb3VyY2UgZmlsZVxuXHRcdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdFx0JGZzLndyaXRlRmlsZSAkcGF0aC5qb2luKHNvdXJjZURpcmVjdG9yeSwgXCIje2NsYXNzTmFtZX0uYXNcIiksIHNvdXJjZSwge2VuY29kaW5nOid1dGY4J30sIChlcnIpIC0+XG5cdFx0XHRcdFx0XHRpZiBlcnI/XG5cdFx0XHRcdFx0XHRcdG5leHQoZXJyKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0XHRcdFx0bmV4dCgpXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgMCBlYWNoIGFzc2V0c1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0YXN5bmMuZWFjaFNlcmllcyBAYXNzZXRzLCB0YXNrLCAoZXJyKSA9PlxuXHRcdFx0aWYgZXJyP1xuXHRcdFx0XHRjb21wbGV0ZShlcnIpXG5cdFx0XHRcdHJldHVyblxuXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0IyA1IGNyZWF0ZSBidWlsZCBjb21tYW5kXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0YmluID0gJ2NvbXBjJ1xuXG5cdFx0XHRAYnVpbGQuZ2V0U0RLVmVyc2lvbiAodmVyc2lvbikgPT5cblx0XHRcdFx0aWYgcHJvY2Vzcy5wbGF0Zm9ybS5pbmRleE9mKCd3aW4nKSBpcyAwXG5cdFx0XHRcdFx0aWYgdmVyc2lvbiA+ICc0LjYuMCdcblx0XHRcdFx0XHRcdGJpbiA9ICdjb21wYy5iYXQnXG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0YmluID0gJ2NvbXBjLmV4ZSdcblxuXHRcdFx0XHRhcmdzID0gW11cblxuXHRcdFx0XHRhcmdzLnB1c2goQGJ1aWxkLndyYXAoQGJ1aWxkLmdldEVudignRkxFWF9IT01FJykgKyAnL2Jpbi8nICsgYmluKSlcblxuXHRcdFx0XHRmb3IgbGlicmFyeSBpbiBAY29sbGVjdG9yLmdldExpYnJhcmllcygpXG5cdFx0XHRcdFx0YXJncy5wdXNoKCctbGlicmFyeS1wYXRoICcgKyBAYnVpbGQud3JhcChsaWJyYXJ5KSlcblxuXHRcdFx0XHRmb3IgbGlicmFyeSBpbiBAY29sbGVjdG9yLmdldEV4dGVybmFsTGlicmFyaWVzKClcblx0XHRcdFx0XHRhcmdzLnB1c2goJy1leHRlcm5hbC1saWJyYXJ5LXBhdGggJyArIEBidWlsZC53cmFwKGxpYnJhcnkpKVxuXG5cdFx0XHRcdGZvciBkaXJlY3RvcnkgaW4gQGNvbGxlY3Rvci5nZXRTb3VyY2VEaXJlY3RvcmllcygpXG5cdFx0XHRcdFx0YXJncy5wdXNoKCctc291cmNlLXBhdGggJyArIEBidWlsZC53cmFwKGRpcmVjdG9yeSkpXG5cdFx0XHRcdFx0YXJncy5wdXNoKCctaW5jbHVkZS1zb3VyY2VzICcgKyBAYnVpbGQud3JhcChkaXJlY3RvcnkpKVxuXG5cdFx0XHRcdGFyZ3MucHVzaCgnLW91dHB1dCAnICsgQGJ1aWxkLndyYXAoQGJ1aWxkLnJlc29sdmVQYXRoKG91dHB1dCkpKVxuXG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCMgNiBleGVjIGNvbXBjXG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdGV4ZWMoYXJncy5qb2luKCcgJykpLnJ1biAoKSAtPlxuXHRcdFx0XHRcdCRmcy5yZW1vdmVTeW5jKGNhY2hlRGlyZWN0b3J5KSBpZiAkZnMuZXhpc3RzU3luYyhjYWNoZURpcmVjdG9yeSlcblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGNhY2hlRGlyZWN0b3J5KVxuXG5cdFx0XHRcdFx0Y29tcGxldGUoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZsYXNzZXQiXX0=