(function() {
  var $fs, $path, Fldoc, SourceCollector, async, exec, marked, pick, xml2js, yaml,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $fs = require('fs-extra');

  $path = require('path');

  async = require('async');

  pick = require('file-picker').pick;

  exec = require('done-exec');

  SourceCollector = require('./flutils').SourceCollector;

  xml2js = require('xml2js');

  yaml = require('js-yaml');

  marked = require('marked');

  Fldoc = (function() {
    function Fldoc(build) {
      this.build = build;
      this.printStore = __bind(this.printStore, this);
      this.clear_see = __bind(this.clear_see, this);
      this.read_field_from_toplevel_xml = __bind(this.read_field_from_toplevel_xml, this);
      this.read_method_from_toplevel_xml = __bind(this.read_method_from_toplevel_xml, this);
      this.read_interfaceRec_from_toplevel_xml = __bind(this.read_interfaceRec_from_toplevel_xml, this);
      this.read_classRec_from_toplevel_xml = __bind(this.read_classRec_from_toplevel_xml, this);
      this.read_namespacePath = __bind(this.read_namespacePath, this);
      this.readNamespaceYaml = __bind(this.readNamespaceYaml, this);
      this.read_classPath = __bind(this.read_classPath, this);
      this.readClassYaml = __bind(this.readClassYaml, this);
      this.readASDocDataXML = __bind(this.readASDocDataXML, this);
      this.createASDocDataXML = __bind(this.createASDocDataXML, this);
      this.create = __bind(this.create, this);
      this.createBuildCommand = __bind(this.createBuildCommand, this);
      this.addArg = __bind(this.addArg, this);
      this.addSourceDirectory = __bind(this.addSourceDirectory, this);
      this.addLibraryDirectory = __bind(this.addLibraryDirectory, this);
      this.setExternalFldoc = __bind(this.setExternalFldoc, this);
      this.setExternalAsdoc = __bind(this.setExternalAsdoc, this);
      this.setApacheFlexAsdoc = __bind(this.setApacheFlexAsdoc, this);
      this.setAdobeAsdoc = __bind(this.setAdobeAsdoc, this);
      this.setFilterFunction = __bind(this.setFilterFunction, this);
      this.collector = new SourceCollector(this.build);
    }

    Fldoc.externalAsdocs = [];

    Fldoc.externalFldocs = [];

    Fldoc.adobeAsdoc = 'http://help.adobe.com/ko_KR/FlashPlatform/reference/actionscript/3/';

    Fldoc.apacheFlexAsdoc = 'http://flex.apache.org/asdoc/';

    Fldoc.prototype.setFilterFunction = function(func) {
      return this.filterFunction = func;
    };

    Fldoc.prototype.setAdobeAsdoc = function(url) {
      return this.adobeAsdoc = url;
    };

    Fldoc.prototype.setApacheFlexAsdoc = function(url) {
      return this.apacheFlexAsdoc = url;
    };

    Fldoc.prototype.setExternalAsdoc = function(url) {
      return this.externalAsdocs.push(url);
    };

    Fldoc.prototype.setExternalFldoc = function(url) {
      return this.externalFldocs.push(url);
    };

    Fldoc.prototype.addLibraryDirectory = function(path) {
      return this.collector.addLibraryDirectory(path);
    };

    Fldoc.prototype.addSourceDirectory = function(path) {
      return this.collector.addSourceDirectory(path);
    };

    Fldoc.prototype.addArg = function(arg) {
      return this.collector.addArg(arg);
    };

    Fldoc.prototype.createBuildCommand = function(output, complete) {
      var bin;
      bin = 'asdoc';
      return this.build.getSDKVersion((function(_this) {
        return function(version) {
          var args, directory, library, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
          if (_this.build.isWindow()) {
            if (version > '4.6.0') {
              bin = 'asdoc.bat';
            } else {
              bin = 'asdoc.exe';
            }
          }
          args = [];
          args.push(_this.build.wrap($path.join(_this.build.getEnv('FLEX_HOME'), 'bin', bin)));
          _ref = _this.collector.getLibraries();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            library = _ref[_i];
            args.push('-library-path ' + _this.build.wrap(library));
          }
          _ref1 = _this.collector.getExternalLibraries();
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            library = _ref1[_j];
            args.push('-library-path ' + _this.build.wrap(library));
          }
          _ref2 = _this.collector.getSourceDirectories();
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            directory = _ref2[_k];
            args.push('-source-path ' + _this.build.wrap(directory));
          }
          return _this.collector.getIncludeClasses(_this.filterFunction, function(classPaths) {
            var arg, _l, _len3, _ref3;
            args.push('-doc-classes ' + classPaths.join(' '));
            _ref3 = _this.collector.getArgs();
            for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
              arg = _ref3[_l];
              args.push(_this.build.applyEnv(arg));
            }
            args.push('-output ' + _this.build.wrap(_this.build.resolvePath(output)));
            args.push('-keep-xml=true');
            args.push('-skip-xsl=true');
            if (complete != null) {
              return complete(args.join(' '));
            }
          });
        };
      })(this));
    };

    Fldoc.prototype.cacheDirectoryName = '.asdoc_cache';

    Fldoc.prototype.create = function(outputDirectory, complete) {
      var tasks;
      this.outputDirectory = outputDirectory;
      this.store = {
        interfaces: {},
        classes: {},
        namespaces: {},
        methods: {},
        properties: {},
        manifests: {}
      };
      tasks = [this.createASDocDataXML, this.readASDocDataXML, this.readNamespaceYaml, this.readClassYaml];
      return async.series(tasks, complete);
    };

    Fldoc.prototype.createASDocDataXML = function(callback) {
      var cacheDirectory;
      cacheDirectory = $path.normalize(this.cacheDirectoryName);
      if ($fs.existsSync(cacheDirectory)) {
        $fs.removeSync(cacheDirectory);
      }
      return this.createBuildCommand(cacheDirectory, function(command) {
        return exec(command).run(function(err) {
          return callback();
        });
      });
    };

    Fldoc.prototype.readASDocDataXML = function(callback) {
      var parser;
      parser = new xml2js.Parser();
      return parser.parseString($fs.readFileSync($path.join(this.cacheDirectoryName, 'toplevel.xml')), (function(_this) {
        return function(err, data) {
          var classRec, field, interfaceRec, method, name, packageRec, value, _ref;
          _ref = data.asdoc;
          for (name in _ref) {
            value = _ref[name];
            console.log('asdoc xml :', name);
          }
          interfaceRec = data.asdoc.interfaceRec;
          classRec = data.asdoc.classRec;
          method = data.asdoc.method;
          field = data.asdoc.field;
          packageRec = data.asdoc.packageRec;
          _this.read_interfaceRec_from_toplevel_xml(interfaceRec);
          _this.read_classRec_from_toplevel_xml(classRec);
          _this.read_method_from_toplevel_xml(method);
          _this.read_field_from_toplevel_xml(field);
          return callback();
        };
      })(this));
    };

    Fldoc.prototype.readClassYaml = function(callback) {
      var classInfos, store;
      store = this.store;
      classInfos = [];
      return async.eachSeries(store.classes, this.read_classPath, callback);
    };

    Fldoc.prototype.read_classPath = function(classInfo, callback) {
      var sourcefile, yamlPath;
      sourcefile = values['sourcefile'];
      yamlPath = sourcefile.replace($path.extname(sourcefile), '.yaml');
      if (!$fs.existsSync(yamlPath)) {
        callback();
      }
    };

    Fldoc.prototype.readNamespaceYaml = function(callback) {
      var namespace, namespaceInfos, namespacePath, sourceDirectories, sourceDirectory, store, values, yamlPath, _i, _len, _ref;
      store = this.store;
      sourceDirectories = this.collector.getSourceDirectories();
      namespaceInfos = [];
      _ref = store.namespaces;
      for (namespace in _ref) {
        values = _ref[namespace];
        namespacePath = namespace.split('.').join($path.sep);
        for (_i = 0, _len = sourceDirectories.length; _i < _len; _i++) {
          sourceDirectory = sourceDirectories[_i];
          yamlPath = $path.join(sourceDirectory, namespacePath, 'namespace.yaml');
          namespaceInfos.push({
            yamlPath: yamlPath,
            namespace: namespace,
            values: values
          });
        }
      }
      return async.eachSeries(namespaceInfos, this.read_namespacePath, callback);
    };

    Fldoc.prototype.read_namespacePath = function(namespaceInfo, callback) {
      var component, manifest, manifest_ns, name, namespace, newComponents, source, store, value, values, yamlPath, _base, _i, _j, _len, _len1, _ref, _ref1;
      store = this.store;
      yamlPath = namespaceInfo['yamlPath'];
      if (!$fs.existsSync(yamlPath)) {
        callback();
        return;
      }
      values = namespaceInfo['values'];
      namespace = namespaceInfo['namespace'];
      source = yaml.safeLoad($fs.readFileSync(yamlPath, {
        encoding: 'utf8'
      }));
      if ((source['namespace'] != null) && (source['components'] != null) && source['components'].length > 0) {
        if (namespace !== '') {
          newComponents = [];
          _ref = source['components'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            component = _ref[_i];
            newComponents.push(namespace + ':' + component);
          }
          source['components'] = newComponents;
        }
        manifest_ns = source['namespace'];
        if ((_base = store.manifests)[manifest_ns] == null) {
          _base[manifest_ns] = {};
        }
        manifest = store.manifests[manifest_ns];
        if (manifest['components'] == null) {
          manifest['components'] = [];
        }
        _ref1 = source['components'];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          component = _ref1[_j];
          manifest['components'].push(component);
        }
      }
      for (name in source) {
        value = source[name];
        values[name] = value;
      }
      return callback();
    };

    Fldoc.prototype.read_classRec_from_toplevel_xml = function(list) {
      var attrs, fullname, name, namespace, source, store, value, _i, _len, _results;
      store = this.store;
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        source = list[_i];
        attrs = source['$'];
        fullname = attrs['fullname'];
        namespace = attrs['namespace'];
        for (name in source) {
          value = source[name];
          if (name === '$') {
            continue;
          }
          attrs[name] = value;
        }
        attrs['interfaces'] = this.parse_interfaceString(attrs['interfaces']);
        if (attrs['see'] != null) {
          attrs['see'] = this.clear_see(attrs['see']);
        }
        if (store.classes[fullname] == null) {
          store.classes[fullname] = attrs;
        }
        if (store.namespaces[namespace] == null) {
          _results.push(store.namespaces[namespace] = {});
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Fldoc.prototype.read_interfaceRec_from_toplevel_xml = function(list) {
      var attrs, fullname, name, namespace, source, store, value, _i, _len, _results;
      store = this.store;
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        source = list[_i];
        attrs = source['$'];
        fullname = attrs['fullname'];
        namespace = attrs['namespace'];
        for (name in source) {
          value = source[name];
          if (name === '$') {
            continue;
          }
          attrs[name] = value;
        }
        attrs['baseClasses'] = this.parse_interfaceString(attrs['baseClasses']);
        if (attrs['see'] != null) {
          attrs['see'] = this.clear_see(attrs['see']);
        }
        if (store.interfaces[fullname] == null) {
          store.interfaces[fullname] = attrs;
        }
        if (store.namespaces[namespace] == null) {
          _results.push(store.namespaces[namespace] = {});
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Fldoc.prototype.read_method_from_toplevel_xml = function(list) {
      return console.log('read_method_from_toplevel_xml');
    };

    Fldoc.prototype.read_field_from_toplevel_xml = function(list) {
      var attr, source, store, _i, _len, _results;
      store = this.store;
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        source = list[_i];
        if (this.is_private_field(source)) {
          continue;
        }
        console.log(source);
        _results.push(attr = source['$']);
      }
      return _results;
    };

    Fldoc.prototype.is_private_field = function(source) {
      return source['$']['fullname'].indexOf('/private:') > -1 || (source['private'] != null);
    };

    Fldoc.prototype.clear_see = function(list) {
      var cleared, see, _i, _len;
      if ((list == null) || list.length === 0) {
        return [];
      }
      cleared = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        see = list[_i];
        see = this.clear_blank(see);
        cleared.push(see);
      }
      return cleared;
    };

    Fldoc.prototype.clear_blank = function(str) {
      return str.replace(/^\s*|\s*$/g, '');
    };

    Fldoc.prototype.parse_interfaceString = function(str) {
      if ((str != null) || str === '') {
        return str.split(';');
      } else {
        return '';
      }
    };

    Fldoc.prototype.printStore = function() {
      var classes, interfaces, manifests, methods, name, namespaces, properties, store, value, _results;
      store = this.store;
      interfaces = store.interfaces;
      classes = store.classes;
      namespaces = store.namespaces;
      methods = store.methods;
      properties = store.properties;
      manifests = store.manifests;
      console.log('==================== : namespaces');
      for (name in namespaces) {
        value = namespaces[name];
        console.log('------------ :', name);
        console.log(value);
      }
      console.log('==================== : interfaces');
      for (name in interfaces) {
        value = interfaces[name];
        console.log('------------ :', name);
        console.log(value);
      }
      console.log('==================== : classes');
      for (name in classes) {
        value = classes[name];
        console.log('------------ :', name);
        console.log(value);
      }
      console.log('==================== : methods');
      for (name in methods) {
        value = methods[name];
        console.log('------------ :', name);
        console.log(value);
      }
      console.log('==================== : properties');
      for (name in properties) {
        value = properties[name];
        console.log('------------ :', name);
        console.log(value);
      }
      console.log('==================== : manifests');
      _results = [];
      for (name in manifests) {
        value = manifests[name];
        console.log('------------ :', name);
        _results.push(console.log(value));
      }
      return _results;
    };

    Fldoc.prototype.getAsdocIndex = function(url, complete) {};

    return Fldoc;

  })();

  module.exports = Fldoc;

}).call(this);

//# sourceMappingURL=data:application/json;base64,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QUFBQSxRQUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksS0FBWixDQURBLENBREQ7QUFBQSxPQTdCQTtBQUFBLE1BaUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksa0NBQVosQ0FqQ0EsQ0FBQTtBQWtDQTtXQUFBLGlCQUFBO2dDQUFBO0FBQ0MsUUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLGdCQUFaLEVBQThCLElBQTlCLENBQUEsQ0FBQTtBQUFBLHNCQUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksS0FBWixFQURBLENBREQ7QUFBQTtzQkFuQ1c7SUFBQSxDQTFWWixDQUFBOztBQUFBLG9CQXVZQSxhQUFBLEdBQWUsU0FBQyxHQUFELEVBQU0sUUFBTixHQUFBLENBdllmLENBQUE7O2lCQUFBOztNQVhELENBQUE7O0FBQUEsRUErWkEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsS0EvWmpCLENBQUE7QUFBQSIsImZpbGUiOiJmbGRvYy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIiRmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJylcbiRwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5hc3luYyA9IHJlcXVpcmUoJ2FzeW5jJylcbnBpY2sgPSByZXF1aXJlKCdmaWxlLXBpY2tlcicpLnBpY2tcbmV4ZWMgPSByZXF1aXJlKCdkb25lLWV4ZWMnKVxue1NvdXJjZUNvbGxlY3Rvcn0gPSByZXF1aXJlKCcuL2ZsdXRpbHMnKVxueG1sMmpzID0gcmVxdWlyZSgneG1sMmpzJylcbnlhbWwgPSByZXF1aXJlKCdqcy15YW1sJylcbm1hcmtlZCA9IHJlcXVpcmUoJ21hcmtlZCcpXG5cbmNsYXNzIEZsZG9jXG5cdGNvbnN0cnVjdG9yOiAoQGJ1aWxkKSAtPlxuXHQgICAgQGNvbGxlY3RvciA9IG5ldyBTb3VyY2VDb2xsZWN0b3IoQGJ1aWxkKVxuXHRcdEBleHRlcm5hbEFzZG9jcyA9IFtdXG5cdFx0QGV4dGVybmFsRmxkb2NzID0gW11cblx0XHRAYWRvYmVBc2RvYyA9ICdodHRwOi8vaGVscC5hZG9iZS5jb20va29fS1IvRmxhc2hQbGF0Zm9ybS9yZWZlcmVuY2UvYWN0aW9uc2NyaXB0LzMvJ1xuXHRcdEBhcGFjaGVGbGV4QXNkb2MgPSAnaHR0cDovL2ZsZXguYXBhY2hlLm9yZy9hc2RvYy8nXG5cdFx0XG5cdFx0IyBzb3VyY2UgPiBleHRlcm5hbEZsZG9jcyA+IGV4dGVybmFsQXNkb2NzID4gYXBhY2hlRmxleEFzZG9jID4gYWRvYmVBc2RvY1xuXHRcdFxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgc2V0dGluZ1xuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgQHBhcmFtIGZ1bmMgYGJvb2xlYW4gZnVuY3Rpb24oZmlsZSlgXG5cdHNldEZpbHRlckZ1bmN0aW9uOiAoZnVuYykgPT5cblx0XHRAZmlsdGVyRnVuY3Rpb24gPSBmdW5jXG5cdFxuXHQjIGV4dGVybmFsIGRvY3VtZW50IHNldHRpbmdcdFxuXHRzZXRBZG9iZUFzZG9jOiAodXJsKSA9PlxuXHRcdEBhZG9iZUFzZG9jID0gdXJsXG5cdFx0XG5cdHNldEFwYWNoZUZsZXhBc2RvYzogKHVybCkgPT5cblx0XHRAYXBhY2hlRmxleEFzZG9jID0gdXJsXG5cdFx0XG5cdHNldEV4dGVybmFsQXNkb2M6ICh1cmwpID0+XG5cdFx0QGV4dGVybmFsQXNkb2NzLnB1c2godXJsKVxuXHRcblx0c2V0RXh0ZXJuYWxGbGRvYzogKHVybCkgPT5cblx0XHRAZXh0ZXJuYWxGbGRvY3MucHVzaCh1cmwpXG5cdFxuXHQjIGxpYnJhcnkgc2V0dGluZyAgICBcblx0YWRkTGlicmFyeURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QGNvbGxlY3Rvci5hZGRMaWJyYXJ5RGlyZWN0b3J5KHBhdGgpXG5cblx0YWRkU291cmNlRGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAY29sbGVjdG9yLmFkZFNvdXJjZURpcmVjdG9yeShwYXRoKVxuXG5cdGFkZEFyZzogKGFyZykgPT5cblx0XHRAY29sbGVjdG9yLmFkZEFyZyhhcmcpXG4gICAgICAgIFxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgcHJvY2Vzc1xuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdGNyZWF0ZUJ1aWxkQ29tbWFuZDogKG91dHB1dCwgY29tcGxldGUpID0+XG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIDAgZ2V0IGV4ZWMgZmlsZVxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0YmluID0gJ2FzZG9jJ1xuXG5cdFx0QGJ1aWxkLmdldFNES1ZlcnNpb24gKHZlcnNpb24pID0+XG5cdFx0XHRpZiBAYnVpbGQuaXNXaW5kb3coKVxuXHRcdFx0XHRpZiB2ZXJzaW9uID4gJzQuNi4wJ1xuXHRcdFx0XHRcdGJpbiA9ICdhc2RvYy5iYXQnXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRiaW4gPSAnYXNkb2MuZXhlJ1xuXHRcdFx0XHRcdFxuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdCMgMSBjcmVhdGUgcGF0aCBhcmdzXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0YXJncyA9IFtdXG5cblx0XHRcdGFyZ3MucHVzaChAYnVpbGQud3JhcCgkcGF0aC5qb2luKEBidWlsZC5nZXRFbnYoJ0ZMRVhfSE9NRScpLCAnYmluJywgYmluKSkpXG5cblx0XHRcdGZvciBsaWJyYXJ5IGluIEBjb2xsZWN0b3IuZ2V0TGlicmFyaWVzKClcblx0XHRcdFx0YXJncy5wdXNoKCctbGlicmFyeS1wYXRoICcgKyBAYnVpbGQud3JhcChsaWJyYXJ5KSlcblxuXHRcdFx0Zm9yIGxpYnJhcnkgaW4gQGNvbGxlY3Rvci5nZXRFeHRlcm5hbExpYnJhcmllcygpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLWxpYnJhcnktcGF0aCAnICsgQGJ1aWxkLndyYXAobGlicmFyeSkpXG5cblx0XHRcdGZvciBkaXJlY3RvcnkgaW4gQGNvbGxlY3Rvci5nZXRTb3VyY2VEaXJlY3RvcmllcygpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLXNvdXJjZS1wYXRoICcgKyBAYnVpbGQud3JhcChkaXJlY3RvcnkpKVxuXHRcdFx0XHRcblx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHQjIDIgY3JlYXRlIGluY2x1ZGUgY2xhc3NlcyBhcmdzXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0QGNvbGxlY3Rvci5nZXRJbmNsdWRlQ2xhc3NlcyBAZmlsdGVyRnVuY3Rpb24sIChjbGFzc1BhdGhzKSA9PlxuXHRcdFx0XHRhcmdzLnB1c2goJy1kb2MtY2xhc3NlcyAnICsgY2xhc3NQYXRocy5qb2luKCcgJykpXG5cblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdFx0IyAzIGFyZ3MsIG91dHB1dFxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHRmb3IgYXJnIGluIEBjb2xsZWN0b3IuZ2V0QXJncygpXG5cdFx0XHRcdFx0YXJncy5wdXNoKEBidWlsZC5hcHBseUVudihhcmcpKVxuXG5cdFx0XHRcdGFyZ3MucHVzaCgnLW91dHB1dCAnICsgQGJ1aWxkLndyYXAoQGJ1aWxkLnJlc29sdmVQYXRoKG91dHB1dCkpKVxuXHRcdFx0XHRcblx0XHRcdFx0YXJncy5wdXNoKCcta2VlcC14bWw9dHJ1ZScpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLXNraXAteHNsPXRydWUnKVxuXG5cdFx0XHRcdGNvbXBsZXRlKGFyZ3Muam9pbignICcpKSBpZiBjb21wbGV0ZT9cblx0XG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBjcmVhdGVcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRjYWNoZURpcmVjdG9yeU5hbWU6ICcuYXNkb2NfY2FjaGUnXG5cdFxuXHRjcmVhdGU6IChAb3V0cHV0RGlyZWN0b3J5LCBjb21wbGV0ZSkgPT5cblx0XHRAc3RvcmUgPSBcblx0XHRcdGludGVyZmFjZXM6IHt9XG5cdFx0XHRjbGFzc2VzOiB7fVxuXHRcdFx0bmFtZXNwYWNlczoge31cblx0XHRcdG1ldGhvZHM6IHt9XG5cdFx0XHRwcm9wZXJ0aWVzOiB7fVxuXHRcdFx0bWFuaWZlc3RzOiB7fVxuXHRcdFxuXHRcdHRhc2tzID0gW1xuXHRcdFx0QGNyZWF0ZUFTRG9jRGF0YVhNTFxuXHRcdFx0QHJlYWRBU0RvY0RhdGFYTUxcblx0XHRcdEByZWFkTmFtZXNwYWNlWWFtbFxuXHRcdFx0QHJlYWRDbGFzc1lhbWxcblx0XHRcdCNAcHJpbnRTdG9yZVxuXHRcdF1cblx0XHRcblx0XHRhc3luYy5zZXJpZXModGFza3MsIGNvbXBsZXRlKVxuXHRcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIGV4ZWN1dGUgYXNkb2Ncblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRjcmVhdGVBU0RvY0RhdGFYTUw6IChjYWxsYmFjaykgPT5cblx0XHRjYWNoZURpcmVjdG9yeSA9ICRwYXRoLm5vcm1hbGl6ZShAY2FjaGVEaXJlY3RvcnlOYW1lKVxuXHRcblx0XHQjIHJlbW92ZSBjYWNoZSBkaXJlY3RvcnkgaWYgZXhpc3RzXG5cdFx0aWYgJGZzLmV4aXN0c1N5bmMoY2FjaGVEaXJlY3RvcnkpXG5cdFx0XHQkZnMucmVtb3ZlU3luYyhjYWNoZURpcmVjdG9yeSkgXG5cdFx0XG5cdFx0QGNyZWF0ZUJ1aWxkQ29tbWFuZCBjYWNoZURpcmVjdG9yeSwgKGNvbW1hbmQpIC0+XG5cdFx0XHRleGVjKGNvbW1hbmQpLnJ1biAoZXJyKSAtPiBcblx0XHRcdFx0Y2FsbGJhY2soKVxuXHRcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIHJlYWQgc291cmNlIGRhdGFzXG5cdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBhc2RvYyB0b3BsZXZlbC54bWxcblx0IyBuYW1lc3BhY2UueWFtbFxuXHQjIENsYXNzLnlhbWxcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIDEgOiByZWFkIGFuZCBzdG9yZSBhc2RvYyB0b3BsZXZlbC54bWxcblx0cmVhZEFTRG9jRGF0YVhNTDogKGNhbGxiYWNrKSA9PlxuXHRcdHBhcnNlciA9IG5ldyB4bWwyanMuUGFyc2VyKClcblx0XHRwYXJzZXIucGFyc2VTdHJpbmcgJGZzLnJlYWRGaWxlU3luYygkcGF0aC5qb2luKEBjYWNoZURpcmVjdG9yeU5hbWUsICd0b3BsZXZlbC54bWwnKSksIChlcnIsIGRhdGEpID0+XG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgZGF0YS5hc2RvY1xuXHRcdFx0XHRjb25zb2xlLmxvZygnYXNkb2MgeG1sIDonLCBuYW1lKVxuXHRcdFx0XHRcblx0XHRcdGludGVyZmFjZVJlYyA9IGRhdGEuYXNkb2MuaW50ZXJmYWNlUmVjXG5cdFx0XHRjbGFzc1JlYyA9IGRhdGEuYXNkb2MuY2xhc3NSZWNcblx0XHRcdG1ldGhvZCA9IGRhdGEuYXNkb2MubWV0aG9kXG5cdFx0XHRmaWVsZCA9IGRhdGEuYXNkb2MuZmllbGRcblx0XHRcdHBhY2thZ2VSZWMgPSBkYXRhLmFzZG9jLnBhY2thZ2VSZWNcblx0XHRcdFxuXHRcdFx0QHJlYWRfaW50ZXJmYWNlUmVjX2Zyb21fdG9wbGV2ZWxfeG1sKGludGVyZmFjZVJlYylcblx0XHRcdEByZWFkX2NsYXNzUmVjX2Zyb21fdG9wbGV2ZWxfeG1sKGNsYXNzUmVjKVxuXHRcdFx0QHJlYWRfbWV0aG9kX2Zyb21fdG9wbGV2ZWxfeG1sKG1ldGhvZClcblx0XHRcdEByZWFkX2ZpZWxkX2Zyb21fdG9wbGV2ZWxfeG1sKGZpZWxkKVxuXHRcdFx0XG5cdFx0XHRjYWxsYmFjaygpXG5cdFx0XHRcblx0IyAzIDogcmVhZCBhbmQgc3RvcmUgQ2xhc3MueWFtbFxuXHRyZWFkQ2xhc3NZYW1sOiAoY2FsbGJhY2spID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRjbGFzc0luZm9zID0gW11cblx0XHRcblx0XHRhc3luYy5lYWNoU2VyaWVzKHN0b3JlLmNsYXNzZXMsIEByZWFkX2NsYXNzUGF0aCwgY2FsbGJhY2spXG5cdFx0XG5cdHJlYWRfY2xhc3NQYXRoOiAoY2xhc3NJbmZvLCBjYWxsYmFjaykgPT5cblx0XHRzb3VyY2VmaWxlID0gdmFsdWVzWydzb3VyY2VmaWxlJ11cblx0XHR5YW1sUGF0aCA9IHNvdXJjZWZpbGUucmVwbGFjZSgkcGF0aC5leHRuYW1lKHNvdXJjZWZpbGUpLCAnLnlhbWwnKVxuXHRcdFxuXHRcdGlmIG5vdCAkZnMuZXhpc3RzU3luYyh5YW1sUGF0aClcblx0XHRcdGNhbGxiYWNrKClcblx0XHRcdHJldHVyblxuXHRcdFx0XG5cdFx0I3NvdXJjZSA9IHlhbWwuc2FmZUxvYWQoJGZzLnJlYWRGaWxlU3luYyh5YW1sUGF0aCwge2VuY29kaW5nOid1dGY4J30pKVxuXHRcdCNcblx0XHQjZm9yIHByb3AsIHZhbHVlIG9mIHNvdXJjZVxuXHRcdFx0I2lmIHByb3AgaXMgJ2NsYXNzJyB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0XG5cblx0IyAyIDogcmVhZCBhbmQgc3RvcmUgbmFtZXNwYWNlLnlhbWxcdFx0XHRcblx0cmVhZE5hbWVzcGFjZVlhbWw6IChjYWxsYmFjaykgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdHNvdXJjZURpcmVjdG9yaWVzID0gQGNvbGxlY3Rvci5nZXRTb3VyY2VEaXJlY3RvcmllcygpXG5cdFx0bmFtZXNwYWNlSW5mb3MgPSBbXVxuXHRcdFxuXHRcdGZvciBuYW1lc3BhY2UsIHZhbHVlcyBvZiBzdG9yZS5uYW1lc3BhY2VzXG5cdFx0XHRuYW1lc3BhY2VQYXRoID0gbmFtZXNwYWNlLnNwbGl0KCcuJykuam9pbigkcGF0aC5zZXApXG5cdFx0XHRmb3Igc291cmNlRGlyZWN0b3J5IGluIHNvdXJjZURpcmVjdG9yaWVzXG5cdFx0XHRcdHlhbWxQYXRoID0gJHBhdGguam9pbihzb3VyY2VEaXJlY3RvcnksIG5hbWVzcGFjZVBhdGgsICduYW1lc3BhY2UueWFtbCcpXG5cdFx0XHRcdG5hbWVzcGFjZUluZm9zLnB1c2hcblx0XHRcdFx0XHR5YW1sUGF0aDogeWFtbFBhdGhcblx0XHRcdFx0XHRuYW1lc3BhY2U6IG5hbWVzcGFjZVxuXHRcdFx0XHRcdHZhbHVlczogdmFsdWVzXG5cdFx0XHRcdFx0XG5cdFx0YXN5bmMuZWFjaFNlcmllcyhuYW1lc3BhY2VJbmZvcywgQHJlYWRfbmFtZXNwYWNlUGF0aCwgY2FsbGJhY2spXG5cdFxuXHQjIDItMSA6IGVhY2ggdGFzayBmdW5jdGlvblx0XHRcdFx0XG5cdHJlYWRfbmFtZXNwYWNlUGF0aDogKG5hbWVzcGFjZUluZm8sIGNhbGxiYWNrKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0eWFtbFBhdGggPSBuYW1lc3BhY2VJbmZvWyd5YW1sUGF0aCddXG5cdFx0XG5cdFx0aWYgbm90ICRmcy5leGlzdHNTeW5jKHlhbWxQYXRoKVxuXHRcdFx0Y2FsbGJhY2soKVxuXHRcdFx0cmV0dXJuXG5cdFx0XG5cdFx0dmFsdWVzID0gbmFtZXNwYWNlSW5mb1sndmFsdWVzJ11cdFxuXHRcdG5hbWVzcGFjZSA9IG5hbWVzcGFjZUluZm9bJ25hbWVzcGFjZSddXG5cdFx0c291cmNlID0geWFtbC5zYWZlTG9hZCgkZnMucmVhZEZpbGVTeW5jKHlhbWxQYXRoLCB7ZW5jb2Rpbmc6J3V0ZjgnfSkpXG5cdFx0XG5cdFx0aWYgc291cmNlWyduYW1lc3BhY2UnXT8gYW5kIHNvdXJjZVsnY29tcG9uZW50cyddPyBhbmQgc291cmNlWydjb21wb25lbnRzJ10ubGVuZ3RoID4gMFxuXHRcdFx0aWYgbmFtZXNwYWNlIGlzbnQgJydcblx0XHRcdFx0bmV3Q29tcG9uZW50cyA9IFtdXG5cdFx0XHRcdGZvciBjb21wb25lbnQgaW4gc291cmNlWydjb21wb25lbnRzJ11cblx0XHRcdFx0XHRuZXdDb21wb25lbnRzLnB1c2gobmFtZXNwYWNlICsgJzonICsgY29tcG9uZW50KVxuXHRcdFx0XHRzb3VyY2VbJ2NvbXBvbmVudHMnXSA9IG5ld0NvbXBvbmVudHNcblx0XHRcdFxuXHRcdFx0bWFuaWZlc3RfbnMgPSBzb3VyY2VbJ25hbWVzcGFjZSddXG5cdFx0XHRcdFxuXHRcdFx0c3RvcmUubWFuaWZlc3RzW21hbmlmZXN0X25zXSA/PSB7fVxuXHRcdFx0XG5cdFx0XHRtYW5pZmVzdCA9IHN0b3JlLm1hbmlmZXN0c1ttYW5pZmVzdF9uc11cblx0XHRcdG1hbmlmZXN0Wydjb21wb25lbnRzJ10gPz0gW11cblx0XHRcdFxuXHRcdFx0Zm9yIGNvbXBvbmVudCBpbiBzb3VyY2VbJ2NvbXBvbmVudHMnXVxuXHRcdFx0XHRtYW5pZmVzdFsnY29tcG9uZW50cyddLnB1c2goY29tcG9uZW50KVxuXHRcdFx0XHRcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHR2YWx1ZXNbbmFtZV0gPSB2YWx1ZVxuXHRcdFxuXHRcdGNhbGxiYWNrKClcdFxuXHRcblx0XG5cdFxuXHQjIDEtMSA6IHJlYWQgY2xhc3NSZWNcblx0cmVhZF9jbGFzc1JlY19mcm9tX3RvcGxldmVsX3htbDogKGxpc3QpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRcblx0XHQjIGF0dHJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIG5hbWU6c3RyaW5nICdFbWFpbFJlbmRlcmVyJyxcblx0XHQjIGZ1bGxuYW1lOnN0cmluZyAnbWFpbGVyLnZpZXdzOkVtYWlsUmVuZGVyZXInLFxuXHRcdCMgc291cmNlZmlsZTpzdHJpbmcgJy9ob21lL3VidW50dS93b3Jrc3BhY2UvZmxidWlsZC90ZXN0L3Byb2plY3Qvc3JjL21haWxlci92aWV3cy9FbWFpbFJlbmRlcmVyLm14bWwnLFxuXHRcdCMgbmFtZXNwYWNlOnN0cmluZyAnbWFpbGVyLnZpZXdzJyxcblx0XHQjIGFjY2VzczpzdHJpbmcgJ3B1YmxpYycsXG5cdFx0IyBiYXNlY2xhc3M6c3RyaW5nICdzcGFyay5jb21wb25lbnRzLnN1cHBvcnRDbGFzc2VzOkl0ZW1SZW5kZXJlcicsXG5cdFx0IyBpbnRlcmZhY2VzOnN0cmluZyAnZG9jU2FtcGxlczpJVGVzdDE7ZG9jU2FtcGxlczpJVGVzdDInLFxuXHRcdCMgaXNGaW5hbDpib29sZWFuICdmYWxzZScsXG5cdFx0IyBpc0R5bmFtaWM6Ym9vbGVhbiAnZmFsc2UnXG5cdFx0IyBlbGVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGRlc2NyaXB0aW9uOmFycmF5PHN0cmluZz5cblx0XHQjIHNlZTphcnJheTxzdHJpbmc+XG5cdFx0IyBpbmNsdWRlRXhhbXBsZTphcnJheTxzdHJpbmc+XG5cdFx0IyB0aHJvd3M6YXJyYXk8c3RyaW5nPlxuXHRcdCMgbWV0YWRhdGE6YXJyYXk8b2JqZWN0PlxuXHRcdFxuXHRcdGZvciBzb3VyY2UgaW4gbGlzdFxuXHRcdFx0YXR0cnMgPSBzb3VyY2VbJyQnXVxuXHRcdFx0ZnVsbG5hbWUgPSBhdHRyc1snZnVsbG5hbWUnXVxuXHRcdFx0bmFtZXNwYWNlID0gYXR0cnNbJ25hbWVzcGFjZSddXG5cdFx0XHRcblx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRhdHRyc1tuYW1lXSA9IHZhbHVlXG5cdFx0XHRcblx0XHRcdGF0dHJzWydpbnRlcmZhY2VzJ109QHBhcnNlX2ludGVyZmFjZVN0cmluZyhhdHRyc1snaW50ZXJmYWNlcyddKVxuXHRcdFx0YXR0cnNbJ3NlZSddPUBjbGVhcl9zZWUoYXR0cnNbJ3NlZSddKSBpZiBhdHRyc1snc2VlJ10/XG5cdFx0XHRcblx0XHRcdGlmIG5vdCBzdG9yZS5jbGFzc2VzW2Z1bGxuYW1lXT9cblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tmdWxsbmFtZV0gPSBhdHRyc1xuXHRcdFx0XHRcblx0XHRcdGlmIG5vdCBzdG9yZS5uYW1lc3BhY2VzW25hbWVzcGFjZV0/XG5cdFx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXSA9IHt9XG5cdFxuXHQjIDEtMiA6IHJlYWQgaW50ZXJmYWNlUmVjXG5cdHJlYWRfaW50ZXJmYWNlUmVjX2Zyb21fdG9wbGV2ZWxfeG1sOiAobGlzdCkgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdFxuXHRcdCMgYXR0cnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgbmFtZTogJ0lUZXN0MycsXG5cdFx0IyBmdWxsbmFtZTogJ2RvY1NhbXBsZXM6SVRlc3QzJyxcblx0XHQjIHNvdXJjZWZpbGU6ICcvaG9tZS91YnVudHUvd29ya3NwYWNlL2ZsYnVpbGQvdGVzdC9wcm9qZWN0L3NyYy9kb2NTYW1wbGVzL0lUZXN0My5hcycsXG5cdFx0IyBuYW1lc3BhY2U6ICdkb2NTYW1wbGVzJyxcblx0XHQjIGFjY2VzczogJ3B1YmxpYycsXG5cdFx0IyBiYXNlQ2xhc3NlczogJ2ZsYXNoLmV2ZW50czpJRXZlbnREaXNwYXRjaGVyO2ZsYXNoLmRpc3BsYXk6SUdyYXBoaWNzRGF0YTtkb2NTYW1wbGVzOklUZXN0MScsXG5cdFx0IyBpc0ZpbmFsOiAnZmFsc2UnLFxuXHRcdCMgaXNEeW5hbWljOiAnZmFsc2UnXG5cdFx0IyBlbGVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGRlc2NyaXB0aW9uOmFycmF5PHN0cmluZz5cblx0XHQjIHNlZTphcnJheTxzdHJpbmc+XG5cdFx0IyBpbmNsdWRlRXhhbXBsZTphcnJheTxzdHJpbmc+XG5cdFx0IyB0aHJvd3M6YXJyYXk8c3RyaW5nPlxuXHRcdCMgbWV0YWRhdGE6YXJyYXk8b2JqZWN0PlxuXHRcdFxuXHRcdGZvciBzb3VyY2UgaW4gbGlzdFxuXHRcdFx0YXR0cnMgPSBzb3VyY2VbJyQnXVxuXHRcdFx0ZnVsbG5hbWUgPSBhdHRyc1snZnVsbG5hbWUnXVxuXHRcdFx0bmFtZXNwYWNlID0gYXR0cnNbJ25hbWVzcGFjZSddXG5cdFx0XHRcblx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRhdHRyc1tuYW1lXSA9IHZhbHVlXG5cdFx0XHRcdFxuXHRcdFx0YXR0cnNbJ2Jhc2VDbGFzc2VzJ109QHBhcnNlX2ludGVyZmFjZVN0cmluZyhhdHRyc1snYmFzZUNsYXNzZXMnXSlcblx0XHRcdGF0dHJzWydzZWUnXT1AY2xlYXJfc2VlKGF0dHJzWydzZWUnXSkgaWYgYXR0cnNbJ3NlZSddP1xuXHRcdFx0XG5cdFx0XHRpZiBub3Qgc3RvcmUuaW50ZXJmYWNlc1tmdWxsbmFtZV0/XG5cdFx0XHRcdHN0b3JlLmludGVyZmFjZXNbZnVsbG5hbWVdID0gYXR0cnNcblx0XHRcdFx0XG5cdFx0XHRpZiBub3Qgc3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdP1xuXHRcdFx0XHRzdG9yZS5uYW1lc3BhY2VzW25hbWVzcGFjZV0gPSB7fVxuXHRcblx0cmVhZF9tZXRob2RfZnJvbV90b3BsZXZlbF94bWw6IChsaXN0KSA9PlxuXHRcdGNvbnNvbGUubG9nKCdyZWFkX21ldGhvZF9mcm9tX3RvcGxldmVsX3htbCcpXG5cdFxuXHRyZWFkX2ZpZWxkX2Zyb21fdG9wbGV2ZWxfeG1sOiAobGlzdCkgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdFxuXHRcdGZvciBzb3VyY2UgaW4gbGlzdFxuXHRcdFx0aWYgQGlzX3ByaXZhdGVfZmllbGQoc291cmNlKSB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcblx0XHRcdGNvbnNvbGUubG9nKHNvdXJjZSlcblx0XHRcdGF0dHIgPSBzb3VyY2VbJyQnXVxuXHRcdFx0XG5cdGlzX3ByaXZhdGVfZmllbGQ6IChzb3VyY2UpIC0+XG5cdFx0cmV0dXJuIHNvdXJjZVsnJCddWydmdWxsbmFtZSddLmluZGV4T2YoJy9wcml2YXRlOicpID4gLTEgb3Igc291cmNlWydwcml2YXRlJ10/XG5cdFxuXHQjIGRldiB1dGlsc1x0XHRcblx0Y2xlYXJfc2VlOiAobGlzdCkgPT5cblx0XHRpZiBub3QgbGlzdD8gb3IgbGlzdC5sZW5ndGggaXMgMFxuXHRcdFx0cmV0dXJuIFtdXG5cdFx0XG5cdFx0Y2xlYXJlZCA9IFtdXG5cdFx0XG5cdFx0Zm9yIHNlZSBpbiBsaXN0XG5cdFx0XHRzZWUgPSBAY2xlYXJfYmxhbmsoc2VlKVxuXHRcdFx0Y2xlYXJlZC5wdXNoKHNlZSlcblx0XG5cdFx0cmV0dXJuIGNsZWFyZWRcblx0XHRcblx0Y2xlYXJfYmxhbms6IChzdHIpIC0+XG5cdFx0cmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzKnxcXHMqJC9nLCAnJylcblx0XHRcblx0XG5cdHBhcnNlX2ludGVyZmFjZVN0cmluZzogKHN0cikgLT5cblx0XHRpZiBzdHI/IG9yIHN0ciBpcyAnJyBcblx0XHRcdHN0ci5zcGxpdCgnOycpIFxuXHRcdGVsc2UgXG5cdFx0XHQnJ1xuXHRwcmludFN0b3JlOiAoKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0aW50ZXJmYWNlcyA9IHN0b3JlLmludGVyZmFjZXNcblx0XHRjbGFzc2VzID0gc3RvcmUuY2xhc3Nlc1xuXHRcdG5hbWVzcGFjZXMgPSBzdG9yZS5uYW1lc3BhY2VzXG5cdFx0bWV0aG9kcyA9IHN0b3JlLm1ldGhvZHNcblx0XHRwcm9wZXJ0aWVzID0gc3RvcmUucHJvcGVydGllc1xuXHRcdG1hbmlmZXN0cyA9IHN0b3JlLm1hbmlmZXN0c1xuXHRcdFxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IG5hbWVzcGFjZXMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBuYW1lc3BhY2VzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogaW50ZXJmYWNlcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIGludGVyZmFjZXNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblx0XHRcblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBjbGFzc2VzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgY2xhc3Nlc1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXHRcdFx0XG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogbWV0aG9kcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIG1ldGhvZHNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblx0XHRcdFxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IHByb3BlcnRpZXMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBwcm9wZXJ0aWVzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cdFx0XHRcblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBtYW5pZmVzdHMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBtYW5pZmVzdHNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblx0XHRcdFxuICAgIFxuICAgICMgY29tcGxldGUgPSBgZnVuY3Rpb24oZXJyb3IsIGRpYylgXG4gICAgIyBkaWNbbmFtZS5zcGFjZS5DbGFzc11cdFtwcm9wZXJ0eV1cdFx0PSBodHRwOi8vfi9uYW1lL3NwYWNlL0NsYXNzLmh0bWwjcHJvcGVydHlcbiAgICAjIGRpY1tuYW1lLnNwYWNlLkNsYXNzXVx0W21ldGhvZCgpXVx0XHQ9IGh0dHA6Ly9+L25hbWUvc3BhY2UvQ2xhc3MuaHRtbCNtZXRob2QoKVxuICAgICMgZGljW25hbWUuc3BhY2VdXHRcdFttZXRob2QoKV1cdFx0PSBodHRwOi8vfi9uYW1lL3NwYWNlLyNtZXRob2QoKSA/Pz9cbiAgICAjIGRpY1tuYW1lLnNwYWNlLkNsYXNzXVx0W3N0eWxlOm5hbWVdXHQ9IGh0dHA6Ly9+L25hbWUvc3BhY2UvQ2xhc3MuaHRtbCNzdHlsZTpuYW1lXG5cdGdldEFzZG9jSW5kZXg6ICh1cmwsIGNvbXBsZXRlKSAtPlxuXHRcdCMgaHR0cDovL2hlbHAuYWRvYmUuY29tL2tvX0tSL0ZsYXNoUGxhdGZvcm0vcmVmZXJlbmNlL2FjdGlvbnNjcmlwdC8zL2FsbC1pbmRleC1BLmh0bWxcblx0XHQjIGh0dHA6Ly9mbGV4LmFwYWNoZS5vcmcvYXNkb2MvYWxsLWluZGV4LUIuaHRtbFxuXHRcdFxuXHRcdFxuXHRcdFxuXHRcdCMgZ2V0IGFsbC1pbmRleC1BIH4gWlxuXHRcdFx0IyBwYXJzZSBhbmQgZmluZCBjbGFzcz1cImlkeHJvd1wiXG5cdFx0XHRcdCMgZGljWy4uXVsuLl0gPSB1cmxcblx0XHRcdFx0XHQjIGNvbXBsZXRlKGVycm9yLCBkaWMpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0XG5tb2R1bGUuZXhwb3J0cyA9IEZsZG9jIl19