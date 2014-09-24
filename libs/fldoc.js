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
      this.convertSee = __bind(this.convertSee, this);
      this.readNamespaceYamlTaskFunction = __bind(this.readNamespaceYamlTaskFunction, this);
      this.readNamespaceYaml = __bind(this.readNamespaceYaml, this);
      this.readClassYamlTaskFunction = __bind(this.readClassYamlTaskFunction, this);
      this.readClassYaml = __bind(this.readClassYaml, this);
      this.readAsdocField = __bind(this.readAsdocField, this);
      this.readAsdocMethod = __bind(this.readAsdocMethod, this);
      this.readAsdocInterfaceRec = __bind(this.readAsdocInterfaceRec, this);
      this.readAsdocClassRec = __bind(this.readAsdocClassRec, this);
      this.readAsdocDataXML = __bind(this.readAsdocDataXML, this);
      this.createAsdocDataXML = __bind(this.createAsdocDataXML, this);
      this.createAsdocBuildCommand = __bind(this.createAsdocBuildCommand, this);
      this.create = __bind(this.create, this);
      this.addArg = __bind(this.addArg, this);
      this.addSourceDirectory = __bind(this.addSourceDirectory, this);
      this.addLibraryDirectory = __bind(this.addLibraryDirectory, this);
      this.setFilterFunction = __bind(this.setFilterFunction, this);
      this.setExternalFldoc = __bind(this.setExternalFldoc, this);
      this.setExternalAsdoc = __bind(this.setExternalAsdoc, this);
      this.setApacheFlexAsdoc = __bind(this.setApacheFlexAsdoc, this);
      this.setAdobeAsdoc = __bind(this.setAdobeAsdoc, this);
      this.collector = new SourceCollector(this.build);
    }

    Fldoc.externalAsdocs = [];

    Fldoc.externalFldocs = [];

    Fldoc.adobeAsdoc = 'http://help.adobe.com/ko_KR/FlashPlatform/reference/actionscript/3/';

    Fldoc.apacheFlexAsdoc = 'http://flex.apache.org/asdoc/';

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

    Fldoc.prototype.setFilterFunction = function(func) {
      return this.filterFunction = func;
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
      tasks = [this.readAsdocDataXML, this.readNamespaceYaml, this.readClassYaml, this.printStore];
      return async.series(tasks, complete);
    };

    Fldoc.prototype.cacheDirectoryName = '.asdoc_cache';

    Fldoc.prototype.createAsdocBuildCommand = function(output, complete) {
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

    Fldoc.prototype.createAsdocDataXML = function(callback) {
      var cacheDirectory;
      cacheDirectory = $path.normalize(this.cacheDirectoryName);
      if ($fs.existsSync(cacheDirectory)) {
        $fs.removeSync(cacheDirectory);
      }
      return this.createAsdocBuildCommand(cacheDirectory, function(command) {
        return exec(command).run(callback);
      });
    };

    Fldoc.prototype.readAsdocDataXML = function(callback) {
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
          _this.readAsdocInterfaceRec(interfaceRec);
          _this.readAsdocClassRec(classRec);
          _this.readAsdocMethod(method);
          _this.readAsdocField(field);
          return callback();
        };
      })(this));
    };

    Fldoc.prototype.readAsdocClassRec = function(list) {
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
        attrs['interfaces'] = this.semicolonStringToArray(attrs['interfaces']);
        if (attrs['see'] != null) {
          attrs['see'] = this.convertSee(attrs['see']);
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

    Fldoc.prototype.readAsdocInterfaceRec = function(list) {
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
        attrs['baseClasses'] = this.semicolonStringToArray(attrs['baseClasses']);
        if (attrs['see'] != null) {
          attrs['see'] = this.convertSee(attrs['see']);
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

    Fldoc.prototype.readAsdocMethod = function(list) {
      var accessor, arr, attrs, classFullName, fullname, get, getset, isAccessor, methods, name, namespace, properties, propertyName, set, source, store, value, _base, _i, _len, _ref, _results;
      store = this.store;
      isAccessor = /\/(get|set)$/;
      properties = {};
      methods = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        source = list[_i];
        attrs = source['$'];
        fullname = attrs['fullname'];
        if (isAccessor.test(fullname)) {
          getset = fullname.substring(fullname.length - 3);
          fullname = fullname.substring(0, fullname.length - 4);
          if (properties[fullname] == null) {
            properties[fullname] = {};
          }
          if (getset === 'get') {
            properties[fullname]['get'] = source;
          } else {
            properties[fullname]['set'] = source;
          }
        } else {
          methods.push(source);
        }
      }
      _results = [];
      for (fullname in properties) {
        getset = properties[fullname];
        attrs = {};
        get = getset['get'];
        set = getset['set'];
        arr = fullname.split('/');
        classFullName = arr[0];
        namespace = classFullName.indexOf(':') > -1 ? classFullName.split(':', 1)[0] : '';
        _ref = this.splitAccessor(arr[1]), accessor = _ref.accessor, propertyName = _ref.propertyName;
        fullname = "" + classFullName + "#" + propertyName;
        attrs['fullname'] = fullname;
        attrs['accessor'] = accessor === namespace ? 'internal' : accessor;
        attrs['propertyType'] = 'accessor';
        attrs['isConst'] = false;
        if ((get != null) && (set != null)) {
          attrs['readwrite'] = 'readwrite';
        } else if (get != null) {
          attrs['readwrite'] = 'readonly';
        } else {
          attrs['readwrite'] = 'writeonly';
        }
        if (get != null) {
          attrs['name'] = get['$']['name'];
          attrs['type'] = get['$']['result_type'];
          attrs['isStatic'] = get['$']['isStatic'];
        } else if (set != null) {
          attrs['name'] = set['$']['name'];
          attrs['type'] = set['$']['param_types'];
          attrs['isStatic'] = set['$']['isStatic'];
        }
        if (get != null) {
          for (name in get) {
            value = get[name];
            if (name === '$') {
              continue;
            }
            attrs[name] = value;
          }
        }
        if (set != null) {
          for (name in set) {
            value = set[name];
            if (name === '$') {
              continue;
            }
            if ((attrs[name] != null) && attrs[name] instanceof Array && value instanceof Array) {
              attrs[name] = attrs[name].concat(value);
            }
          }
        }
        if (store.classes[classFullName] != null) {
          store.properties[fullname] = attrs;
          if ((_base = store.classes[classFullName])['properties'] == null) {
            _base['properties'] = [];
          }
          _results.push(store.classes[classFullName]['properties'].push(attrs['name']));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Fldoc.prototype.readAsdocField = function(list) {
      var accessor, arr, attrs, classFullName, fullname, name, namespace, propertyName, source, store, value, _base, _i, _len, _ref, _results;
      store = this.store;
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        source = list[_i];
        if (this.isPrivateField(source)) {
          continue;
        }
        attrs = source['$'];
        arr = attrs['fullname'].split('/');
        classFullName = arr[0];
        namespace = classFullName.indexOf(':') > -1 ? classFullName.split(':', 1)[0] : '';
        _ref = this.splitAccessor(arr[1]), accessor = _ref.accessor, propertyName = _ref.propertyName;
        fullname = "" + classFullName + "#" + propertyName;
        for (name in source) {
          value = source[name];
          if (name === '$') {
            continue;
          }
          attrs[name] = value;
        }
        attrs['fullname'] = fullname;
        attrs['accessor'] = accessor === namespace ? 'internal' : accessor;
        if (attrs['isConst'].toString() === 'true') {
          attrs['propertyType'] = 'constant';
          attrs['readwrite'] = 'readonly';
        } else {
          attrs['propertyType'] = 'variable';
          attrs['readwrite'] = 'readwrite';
        }
        if (store.classes[classFullName] != null) {
          store.properties[fullname] = attrs;
          if ((_base = store.classes[classFullName])['properties'] == null) {
            _base['properties'] = [];
          }
          _results.push(store.classes[classFullName]['properties'].push(attrs['name']));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Fldoc.prototype.splitAccessor = function(name) {
      var accessor, accessorIndex, propertyName;
      accessorIndex = name.indexOf(':');
      if (accessorIndex > -1) {
        accessor = name.substring(0, accessorIndex);
        propertyName = name.substring(accessorIndex);
      } else {
        accessor = 'public';
        propertyName = name;
      }
      return {
        accessor: accessor,
        propertyName: propertyName
      };
    };

    Fldoc.prototype.readClassYaml = function(callback) {
      var store;
      store = this.store;
      return async.eachSeries(store.classes, this.readClassYamlTaskFunction, callback);
    };

    Fldoc.prototype.readClassYamlTaskFunction = function(classInfo, callback) {
      var source, sourcefile, yamlPath;
      sourcefile = classInfo['sourcefile'];
      yamlPath = sourcefile.replace($path.extname(sourcefile), '.yaml');
      if (!$fs.existsSync(yamlPath)) {
        callback();
        return;
      }
      return source = yaml.safeLoad($fs.readFileSync(yamlPath, {
        encoding: 'utf8'
      }));
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
      return async.eachSeries(namespaceInfos, this.readNamespaceYamlTaskFunction, callback);
    };

    Fldoc.prototype.readNamespaceYamlTaskFunction = function(namespaceInfo, callback) {
      var component, manifest, manifestNamespace, name, namespace, newComponents, source, store, value, values, yamlPath, _base, _i, _j, _len, _len1, _ref, _ref1;
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
        manifestNamespace = this.clearBlank(source['namespace']);
        if ((_base = store.manifests)[manifestNamespace] == null) {
          _base[manifestNamespace] = {};
        }
        manifest = store.manifests[manifestNamespace];
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

    Fldoc.prototype.isPrivateField = function(source) {
      return source['$']['fullname'].indexOf('/private:') > -1 || (source['private'] != null);
    };

    Fldoc.prototype.convertSee = function(list) {
      var cleared, see, _i, _len;
      if ((list == null) || list.length === 0) {
        return [];
      }
      cleared = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        see = list[_i];
        see = this.clearBlank(see);
        cleared.push(see);
      }
      return cleared;
    };

    Fldoc.prototype.clearBlank = function(str) {
      return str.replace(/^\s*|\s*$/g, '');
    };

    Fldoc.prototype.semicolonStringToArray = function(str) {
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

    return Fldoc;

  })();

  module.exports = Fldoc;

}).call(this);

//# sourceMappingURL=data:application/json;base64,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O2lDQUFBO0FBQ0MsUUFBQSxPQUFPLENBQUMsR0FBUixDQUFZLGdCQUFaLEVBQThCLElBQTlCLENBQUEsQ0FBQTtBQUFBLFFBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxLQUFaLENBREEsQ0FERDtBQUFBLE9BN0JBO0FBQUEsTUFpQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxrQ0FBWixDQWpDQSxDQUFBO0FBa0NBO1dBQUEsaUJBQUE7Z0NBQUE7QUFDQyxRQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksZ0JBQVosRUFBOEIsSUFBOUIsQ0FBQSxDQUFBO0FBQUEsc0JBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxLQUFaLEVBREEsQ0FERDtBQUFBO3NCQW5DVztJQUFBLENBcGdCWixDQUFBOztpQkFBQTs7TUFYRCxDQUFBOztBQUFBLEVBeWtCQSxNQUFNLENBQUMsT0FBUCxHQUFpQixLQXprQmpCLENBQUE7QUFBQSIsImZpbGUiOiJmbGRvYy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIiRmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJylcbiRwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5hc3luYyA9IHJlcXVpcmUoJ2FzeW5jJylcbnBpY2sgPSByZXF1aXJlKCdmaWxlLXBpY2tlcicpLnBpY2tcbmV4ZWMgPSByZXF1aXJlKCdkb25lLWV4ZWMnKVxue1NvdXJjZUNvbGxlY3Rvcn0gPSByZXF1aXJlKCcuL2ZsdXRpbHMnKVxueG1sMmpzID0gcmVxdWlyZSgneG1sMmpzJylcbnlhbWwgPSByZXF1aXJlKCdqcy15YW1sJylcbm1hcmtlZCA9IHJlcXVpcmUoJ21hcmtlZCcpXG5cbmNsYXNzIEZsZG9jXG5cdGNvbnN0cnVjdG9yOiAoQGJ1aWxkKSAtPlxuXHRcdEBjb2xsZWN0b3IgPSBuZXcgU291cmNlQ29sbGVjdG9yKEBidWlsZClcblx0QGV4dGVybmFsQXNkb2NzID0gW11cblx0QGV4dGVybmFsRmxkb2NzID0gW11cblx0QGFkb2JlQXNkb2MgPSAnaHR0cDovL2hlbHAuYWRvYmUuY29tL2tvX0tSL0ZsYXNoUGxhdGZvcm0vcmVmZXJlbmNlL2FjdGlvbnNjcmlwdC8zLydcblx0QGFwYWNoZUZsZXhBc2RvYyA9ICdodHRwOi8vZmxleC5hcGFjaGUub3JnL2FzZG9jLydcblxuXHQjIHNvdXJjZSA+IGV4dGVybmFsRmxkb2NzID4gZXh0ZXJuYWxBc2RvY3MgPiBhcGFjaGVGbGV4QXNkb2MgPiBhZG9iZUFzZG9jXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIHNldHRpbmdcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIGV4dGVybmFsIGRvY3VtZW50IHNvdXJjZXNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0c2V0QWRvYmVBc2RvYzogKHVybCkgPT5cblx0XHRAYWRvYmVBc2RvYyA9IHVybFxuXG5cdHNldEFwYWNoZUZsZXhBc2RvYzogKHVybCkgPT5cblx0XHRAYXBhY2hlRmxleEFzZG9jID0gdXJsXG5cblx0c2V0RXh0ZXJuYWxBc2RvYzogKHVybCkgPT5cblx0XHRAZXh0ZXJuYWxBc2RvY3MucHVzaCh1cmwpXG5cblx0c2V0RXh0ZXJuYWxGbGRvYzogKHVybCkgPT5cblx0XHRAZXh0ZXJuYWxGbGRvY3MucHVzaCh1cmwpXG5cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBhc2RvYyBmaWx0ZXIgZnVuY3Rpb25cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBAcGFyYW0gZnVuYyBgYm9vbGVhbiBmdW5jdGlvbihmaWxlKWBcblx0c2V0RmlsdGVyRnVuY3Rpb246IChmdW5jKSA9PlxuXHRcdEBmaWx0ZXJGdW5jdGlvbiA9IGZ1bmNcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIGFzZG9jIHNvdXJjZXNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0YWRkTGlicmFyeURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QGNvbGxlY3Rvci5hZGRMaWJyYXJ5RGlyZWN0b3J5KHBhdGgpXG5cblx0YWRkU291cmNlRGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAY29sbGVjdG9yLmFkZFNvdXJjZURpcmVjdG9yeShwYXRoKVxuXG5cdGFkZEFyZzogKGFyZykgPT5cblx0XHRAY29sbGVjdG9yLmFkZEFyZyhhcmcpXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIGNyZWF0ZVxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdGNyZWF0ZTogKEBvdXRwdXREaXJlY3RvcnksIGNvbXBsZXRlKSA9PlxuXHRcdEBzdG9yZSA9XG5cdFx0XHRpbnRlcmZhY2VzOiB7fVxuXHRcdFx0Y2xhc3Nlczoge31cblx0XHRcdG5hbWVzcGFjZXM6IHt9XG5cdFx0XHRtZXRob2RzOiB7fVxuXHRcdFx0cHJvcGVydGllczoge31cblx0XHRcdG1hbmlmZXN0czoge31cblxuXHRcdHRhc2tzID0gW1xuXHRcdFx0I0BjcmVhdGVBc2RvY0RhdGFYTUxcblx0XHRcdEByZWFkQXNkb2NEYXRhWE1MXG5cdFx0XHRAcmVhZE5hbWVzcGFjZVlhbWxcblx0XHRcdEByZWFkQ2xhc3NZYW1sXG5cdFx0XHRAcHJpbnRTdG9yZVxuXHRcdF1cblxuXHRcdGFzeW5jLnNlcmllcyh0YXNrcywgY29tcGxldGUpXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIEAgY3JlYXRlIGFzZG9jIHhtbCBzb3VyY2Vcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRjYWNoZURpcmVjdG9yeU5hbWU6ICcuYXNkb2NfY2FjaGUnXG5cblx0Y3JlYXRlQXNkb2NCdWlsZENvbW1hbmQ6IChvdXRwdXQsIGNvbXBsZXRlKSA9PlxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyAwIGdldCBleGVjIGZpbGVcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGJpbiA9ICdhc2RvYydcblxuXHRcdEBidWlsZC5nZXRTREtWZXJzaW9uICh2ZXJzaW9uKSA9PlxuXHRcdFx0aWYgQGJ1aWxkLmlzV2luZG93KClcblx0XHRcdFx0aWYgdmVyc2lvbiA+ICc0LjYuMCdcblx0XHRcdFx0XHRiaW4gPSAnYXNkb2MuYmF0J1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0YmluID0gJ2FzZG9jLmV4ZSdcblxuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdCMgMSBjcmVhdGUgcGF0aCBhcmdzXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0YXJncyA9IFtdXG5cblx0XHRcdGFyZ3MucHVzaChAYnVpbGQud3JhcCgkcGF0aC5qb2luKEBidWlsZC5nZXRFbnYoJ0ZMRVhfSE9NRScpLCAnYmluJywgYmluKSkpXG5cblx0XHRcdGZvciBsaWJyYXJ5IGluIEBjb2xsZWN0b3IuZ2V0TGlicmFyaWVzKClcblx0XHRcdFx0YXJncy5wdXNoKCctbGlicmFyeS1wYXRoICcgKyBAYnVpbGQud3JhcChsaWJyYXJ5KSlcblxuXHRcdFx0Zm9yIGxpYnJhcnkgaW4gQGNvbGxlY3Rvci5nZXRFeHRlcm5hbExpYnJhcmllcygpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLWxpYnJhcnktcGF0aCAnICsgQGJ1aWxkLndyYXAobGlicmFyeSkpXG5cblx0XHRcdGZvciBkaXJlY3RvcnkgaW4gQGNvbGxlY3Rvci5nZXRTb3VyY2VEaXJlY3RvcmllcygpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLXNvdXJjZS1wYXRoICcgKyBAYnVpbGQud3JhcChkaXJlY3RvcnkpKVxuXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0IyAyIGNyZWF0ZSBpbmNsdWRlIGNsYXNzZXMgYXJnc1xuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdEBjb2xsZWN0b3IuZ2V0SW5jbHVkZUNsYXNzZXMgQGZpbHRlckZ1bmN0aW9uLCAoY2xhc3NQYXRocykgPT5cblx0XHRcdFx0YXJncy5wdXNoKCctZG9jLWNsYXNzZXMgJyArIGNsYXNzUGF0aHMuam9pbignICcpKVxuXG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCMgMyBhcmdzLCBvdXRwdXRcblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdFx0Zm9yIGFyZyBpbiBAY29sbGVjdG9yLmdldEFyZ3MoKVxuXHRcdFx0XHRcdGFyZ3MucHVzaChAYnVpbGQuYXBwbHlFbnYoYXJnKSlcblxuXHRcdFx0XHRhcmdzLnB1c2goJy1vdXRwdXQgJyArIEBidWlsZC53cmFwKEBidWlsZC5yZXNvbHZlUGF0aChvdXRwdXQpKSlcblxuXHRcdFx0XHRhcmdzLnB1c2goJy1rZWVwLXhtbD10cnVlJylcblx0XHRcdFx0YXJncy5wdXNoKCctc2tpcC14c2w9dHJ1ZScpXG5cblx0XHRcdFx0Y29tcGxldGUoYXJncy5qb2luKCcgJykpIGlmIGNvbXBsZXRlP1xuXG5cblx0Y3JlYXRlQXNkb2NEYXRhWE1MOiAoY2FsbGJhY2spID0+XG5cdFx0Y2FjaGVEaXJlY3RvcnkgPSAkcGF0aC5ub3JtYWxpemUoQGNhY2hlRGlyZWN0b3J5TmFtZSlcblxuXHRcdCMgcmVtb3ZlIGNhY2hlIGRpcmVjdG9yeSBpZiBleGlzdHNcblx0XHRpZiAkZnMuZXhpc3RzU3luYyhjYWNoZURpcmVjdG9yeSlcblx0XHRcdCRmcy5yZW1vdmVTeW5jKGNhY2hlRGlyZWN0b3J5KVxuXG5cdFx0QGNyZWF0ZUFzZG9jQnVpbGRDb21tYW5kIGNhY2hlRGlyZWN0b3J5LCAoY29tbWFuZCkgLT5cblx0XHRcdGV4ZWMoY29tbWFuZCkucnVuKGNhbGxiYWNrKVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIHJlYWQgYXNkb2Mgc291cmNlICh0b3BsZXZlbC54bWwpXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0cmVhZEFzZG9jRGF0YVhNTDogKGNhbGxiYWNrKSA9PlxuXHRcdHBhcnNlciA9IG5ldyB4bWwyanMuUGFyc2VyKClcblx0XHRwYXJzZXIucGFyc2VTdHJpbmcgJGZzLnJlYWRGaWxlU3luYygkcGF0aC5qb2luKEBjYWNoZURpcmVjdG9yeU5hbWUsICd0b3BsZXZlbC54bWwnKSksIChlcnIsIGRhdGEpID0+XG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgZGF0YS5hc2RvY1xuXHRcdFx0XHRjb25zb2xlLmxvZygnYXNkb2MgeG1sIDonLCBuYW1lKVxuXG5cdFx0XHRpbnRlcmZhY2VSZWMgPSBkYXRhLmFzZG9jLmludGVyZmFjZVJlY1xuXHRcdFx0Y2xhc3NSZWMgPSBkYXRhLmFzZG9jLmNsYXNzUmVjXG5cdFx0XHRtZXRob2QgPSBkYXRhLmFzZG9jLm1ldGhvZFxuXHRcdFx0ZmllbGQgPSBkYXRhLmFzZG9jLmZpZWxkXG5cdFx0XHRwYWNrYWdlUmVjID0gZGF0YS5hc2RvYy5wYWNrYWdlUmVjXG5cblx0XHRcdEByZWFkQXNkb2NJbnRlcmZhY2VSZWMoaW50ZXJmYWNlUmVjKVxuXHRcdFx0QHJlYWRBc2RvY0NsYXNzUmVjKGNsYXNzUmVjKVxuXHRcdFx0QHJlYWRBc2RvY01ldGhvZChtZXRob2QpXG5cdFx0XHRAcmVhZEFzZG9jRmllbGQoZmllbGQpXG5cblx0XHRcdGNhbGxiYWNrKClcblxuXHRyZWFkQXNkb2NDbGFzc1JlYzogKGxpc3QpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblxuXHRcdCMgYXR0cnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgbmFtZTpzdHJpbmcgJ0VtYWlsUmVuZGVyZXInLFxuXHRcdCMgZnVsbG5hbWU6c3RyaW5nICdtYWlsZXIudmlld3M6RW1haWxSZW5kZXJlcicsXG5cdFx0IyBzb3VyY2VmaWxlOnN0cmluZyAnL2hvbWUvdWJ1bnR1L3dvcmtzcGFjZS9mbGJ1aWxkL3Rlc3QvcHJvamVjdC9zcmMvbWFpbGVyL3ZpZXdzL0VtYWlsUmVuZGVyZXIubXhtbCcsXG5cdFx0IyBuYW1lc3BhY2U6c3RyaW5nICdtYWlsZXIudmlld3MnLFxuXHRcdCMgYWNjZXNzOnN0cmluZyAncHVibGljJyxcblx0XHQjIGJhc2VjbGFzczpzdHJpbmcgJ3NwYXJrLmNvbXBvbmVudHMuc3VwcG9ydENsYXNzZXM6SXRlbVJlbmRlcmVyJyxcblx0XHQjIGludGVyZmFjZXM6c3RyaW5nICdkb2NTYW1wbGVzOklUZXN0MTtkb2NTYW1wbGVzOklUZXN0MicsXG5cdFx0IyBpc0ZpbmFsOmJvb2xlYW4gJ2ZhbHNlJyxcblx0XHQjIGlzRHluYW1pYzpib29sZWFuICdmYWxzZSdcblx0XHQjIGVsZW1lbnRzIC0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZGVzY3JpcHRpb246YXJyYXk8c3RyaW5nPlxuXHRcdCMgc2VlOmFycmF5PHN0cmluZz5cblx0XHQjIGluY2x1ZGVFeGFtcGxlOmFycmF5PHN0cmluZz5cblx0XHQjIHRocm93czphcnJheTxzdHJpbmc+XG5cdFx0IyBtZXRhZGF0YTphcnJheTxvYmplY3Q+XG5cblx0XHRmb3Igc291cmNlIGluIGxpc3Rcblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGZ1bGxuYW1lID0gYXR0cnNbJ2Z1bGxuYW1lJ11cblx0XHRcdG5hbWVzcGFjZSA9IGF0dHJzWyduYW1lc3BhY2UnXVxuXG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0YXR0cnNbbmFtZV0gPSB2YWx1ZVxuXG5cdFx0XHRhdHRyc1snaW50ZXJmYWNlcyddPUBzZW1pY29sb25TdHJpbmdUb0FycmF5KGF0dHJzWydpbnRlcmZhY2VzJ10pXG5cdFx0XHRhdHRyc1snc2VlJ109QGNvbnZlcnRTZWUoYXR0cnNbJ3NlZSddKSBpZiBhdHRyc1snc2VlJ10/XG5cblx0XHRcdGlmIG5vdCBzdG9yZS5jbGFzc2VzW2Z1bGxuYW1lXT9cblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tmdWxsbmFtZV0gPSBhdHRyc1xuXG5cdFx0XHRpZiBub3Qgc3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdP1xuXHRcdFx0XHRzdG9yZS5uYW1lc3BhY2VzW25hbWVzcGFjZV0gPSB7fVxuXG5cblx0cmVhZEFzZG9jSW50ZXJmYWNlUmVjOiAobGlzdCkgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXG5cdFx0IyBhdHRycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBuYW1lOiAnSVRlc3QzJyxcblx0XHQjIGZ1bGxuYW1lOiAnZG9jU2FtcGxlczpJVGVzdDMnLFxuXHRcdCMgc291cmNlZmlsZTogJy9ob21lL3VidW50dS93b3Jrc3BhY2UvZmxidWlsZC90ZXN0L3Byb2plY3Qvc3JjL2RvY1NhbXBsZXMvSVRlc3QzLmFzJyxcblx0XHQjIG5hbWVzcGFjZTogJ2RvY1NhbXBsZXMnLFxuXHRcdCMgYWNjZXNzOiAncHVibGljJyxcblx0XHQjIGJhc2VDbGFzc2VzOiAnZmxhc2guZXZlbnRzOklFdmVudERpc3BhdGNoZXI7Zmxhc2guZGlzcGxheTpJR3JhcGhpY3NEYXRhO2RvY1NhbXBsZXM6SVRlc3QxJyxcblx0XHQjIGlzRmluYWw6ICdmYWxzZScsXG5cdFx0IyBpc0R5bmFtaWM6ICdmYWxzZSdcblx0XHQjIGVsZW1lbnRzIC0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZGVzY3JpcHRpb246YXJyYXk8c3RyaW5nPlxuXHRcdCMgc2VlOmFycmF5PHN0cmluZz5cblx0XHQjIGluY2x1ZGVFeGFtcGxlOmFycmF5PHN0cmluZz5cblx0XHQjIHRocm93czphcnJheTxzdHJpbmc+XG5cdFx0IyBtZXRhZGF0YTphcnJheTxvYmplY3Q+XG5cblx0XHRmb3Igc291cmNlIGluIGxpc3Rcblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGZ1bGxuYW1lID0gYXR0cnNbJ2Z1bGxuYW1lJ11cblx0XHRcdG5hbWVzcGFjZSA9IGF0dHJzWyduYW1lc3BhY2UnXVxuXG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0YXR0cnNbbmFtZV0gPSB2YWx1ZVxuXG5cdFx0XHRhdHRyc1snYmFzZUNsYXNzZXMnXT1Ac2VtaWNvbG9uU3RyaW5nVG9BcnJheShhdHRyc1snYmFzZUNsYXNzZXMnXSlcblx0XHRcdGF0dHJzWydzZWUnXT1AY29udmVydFNlZShhdHRyc1snc2VlJ10pIGlmIGF0dHJzWydzZWUnXT9cblxuXHRcdFx0aWYgbm90IHN0b3JlLmludGVyZmFjZXNbZnVsbG5hbWVdP1xuXHRcdFx0XHRzdG9yZS5pbnRlcmZhY2VzW2Z1bGxuYW1lXSA9IGF0dHJzXG5cblx0XHRcdGlmIG5vdCBzdG9yZS5uYW1lc3BhY2VzW25hbWVzcGFjZV0/XG5cdFx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXSA9IHt9XG5cblx0cmVhZEFzZG9jTWV0aG9kOiAobGlzdCkgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdGlzQWNjZXNzb3IgPSAvXFwvKGdldHxzZXQpJC9cblx0XHRcblx0XHRwcm9wZXJ0aWVzID0ge31cblx0XHRtZXRob2RzID0gW11cblx0XHRcblx0XHRmb3Igc291cmNlIGluIGxpc3Rcblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGZ1bGxuYW1lID0gYXR0cnNbJ2Z1bGxuYW1lJ11cblx0XHRcdFxuXHRcdFx0aWYgaXNBY2Nlc3Nvci50ZXN0KGZ1bGxuYW1lKVxuXHRcdFx0XHRnZXRzZXQgPSBmdWxsbmFtZS5zdWJzdHJpbmcoZnVsbG5hbWUubGVuZ3RoIC0gMylcblx0XHRcdFx0ZnVsbG5hbWUgPSBmdWxsbmFtZS5zdWJzdHJpbmcoMCwgZnVsbG5hbWUubGVuZ3RoIC0gNClcblx0XHRcdFx0XG5cdFx0XHRcdHByb3BlcnRpZXNbZnVsbG5hbWVdID89IHt9XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiBnZXRzZXQgaXMgJ2dldCdcblx0XHRcdFx0XHRwcm9wZXJ0aWVzW2Z1bGxuYW1lXVsnZ2V0J10gPSBzb3VyY2Vcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHByb3BlcnRpZXNbZnVsbG5hbWVdWydzZXQnXSA9IHNvdXJjZVxuXHRcdFx0XHRcdFxuXHRcdFx0ZWxzZSBcblx0XHRcdFx0bWV0aG9kcy5wdXNoKHNvdXJjZSlcblxuXHRcdGZvciBmdWxsbmFtZSwgZ2V0c2V0IG9mIHByb3BlcnRpZXNcblx0XHRcdGF0dHJzID0ge31cblx0XHRcdGdldCA9IGdldHNldFsnZ2V0J11cblx0XHRcdHNldCA9IGdldHNldFsnc2V0J11cblx0XHRcdFxuXHRcdFx0YXJyID0gZnVsbG5hbWUuc3BsaXQoJy8nKVxuXHRcdFx0Y2xhc3NGdWxsTmFtZSA9IGFyclswXVxuXHRcdFx0bmFtZXNwYWNlID0gaWYgY2xhc3NGdWxsTmFtZS5pbmRleE9mKCc6JykgPiAtMSB0aGVuIGNsYXNzRnVsbE5hbWUuc3BsaXQoJzonLCAxKVswXSBlbHNlICcnXG5cdFx0XHR7YWNjZXNzb3IsIHByb3BlcnR5TmFtZX0gPSBAc3BsaXRBY2Nlc3NvcihhcnJbMV0pXG5cdFx0XHRmdWxsbmFtZSA9IFwiI3tjbGFzc0Z1bGxOYW1lfSMje3Byb3BlcnR5TmFtZX1cIlxuXHRcdFx0XHRcblx0XHRcdGF0dHJzWydmdWxsbmFtZSddID0gZnVsbG5hbWVcblx0XHRcdGF0dHJzWydhY2Nlc3NvciddID0gaWYgYWNjZXNzb3IgaXMgbmFtZXNwYWNlIHRoZW4gJ2ludGVybmFsJyBlbHNlIGFjY2Vzc29yXG5cdFx0XHRhdHRyc1sncHJvcGVydHlUeXBlJ10gPSAnYWNjZXNzb3InXG5cdFx0XHRhdHRyc1snaXNDb25zdCddID0gZmFsc2Vcblx0XHRcdFxuXHRcdFx0aWYgZ2V0PyBhbmQgc2V0P1xuXHRcdFx0XHRhdHRyc1sncmVhZHdyaXRlJ10gPSAncmVhZHdyaXRlJ1xuXHRcdFx0ZWxzZSBpZiBnZXQ/XG5cdFx0XHRcdGF0dHJzWydyZWFkd3JpdGUnXSA9ICdyZWFkb25seSdcblx0XHRcdGVsc2UgXG5cdFx0XHRcdGF0dHJzWydyZWFkd3JpdGUnXSA9ICd3cml0ZW9ubHknXG5cdFx0XHRcblx0XHRcdGlmIGdldD9cblx0XHRcdFx0YXR0cnNbJ25hbWUnXSA9IGdldFsnJCddWyduYW1lJ11cblx0XHRcdFx0YXR0cnNbJ3R5cGUnXSA9IGdldFsnJCddWydyZXN1bHRfdHlwZSddXG5cdFx0XHRcdGF0dHJzWydpc1N0YXRpYyddID0gZ2V0WyckJ11bJ2lzU3RhdGljJ11cblx0XHRcdFx0XHRcblx0XHRcdGVsc2UgaWYgc2V0P1xuXHRcdFx0XHRhdHRyc1snbmFtZSddID0gc2V0WyckJ11bJ25hbWUnXVxuXHRcdFx0XHRhdHRyc1sndHlwZSddID0gc2V0WyckJ11bJ3BhcmFtX3R5cGVzJ11cblx0XHRcdFx0YXR0cnNbJ2lzU3RhdGljJ10gPSBzZXRbJyQnXVsnaXNTdGF0aWMnXVxuXHRcdFx0XHRcblx0XHRcdGlmIGdldD9cblx0XHRcdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIGdldFxuXHRcdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0XHRhdHRyc1tuYW1lXSA9IHZhbHVlXG5cdFx0XHRcdFx0XG5cdFx0XHRpZiBzZXQ/XG5cdFx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzZXRcblx0XHRcdFx0XHRpZiBuYW1lIGlzICckJyB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcdFx0aWYgYXR0cnNbbmFtZV0/IGFuZCBhdHRyc1tuYW1lXSBpbnN0YW5jZW9mIEFycmF5IGFuZCB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5XG5cdFx0XHRcdFx0XHRhdHRyc1tuYW1lXSA9IGF0dHJzW25hbWVdLmNvbmNhdCh2YWx1ZSlcblx0XHRcdFxuXHRcdFx0aWYgc3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXT9cblx0XHRcdFx0c3RvcmUucHJvcGVydGllc1tmdWxsbmFtZV0gPSBhdHRyc1xuXHRcdFx0XHRzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdWydwcm9wZXJ0aWVzJ10gPz0gW11cblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXVsncHJvcGVydGllcyddLnB1c2goYXR0cnNbJ25hbWUnXSlcblxuXHRyZWFkQXNkb2NGaWVsZDogKGxpc3QpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblxuXHRcdCMgYXR0cnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgbmFtZTogJ3Rlc3RQcm9wJyxcblx0XHQjIGZ1bGxuYW1lOiAnZG9jU2FtcGxlczpUZXN0MS90ZXN0UHJvcCcsXG5cdFx0IyB0eXBlOiAnU3RyaW5nJyxcblx0XHQjIGlzU3RhdGljOiAnZmFsc2UnLFxuXHRcdCMgaXNDb25zdDogJ2ZhbHNlJ1xuXHRcdCMgZWxlbWVudHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZGVzY3JpcHRpb246YXJyYXk8c3RyaW5nPlxuXHRcdCMgbWV0YWRhdGE6YXJyYXk8b2JqZWN0PlxuXG5cdFx0Zm9yIHNvdXJjZSBpbiBsaXN0XG5cdFx0XHRpZiBAaXNQcml2YXRlRmllbGQoc291cmNlKSB0aGVuIGNvbnRpbnVlXG5cblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGFyciA9IGF0dHJzWydmdWxsbmFtZSddLnNwbGl0KCcvJylcblx0XHRcdGNsYXNzRnVsbE5hbWUgPSBhcnJbMF1cblx0XHRcdG5hbWVzcGFjZSA9IGlmIGNsYXNzRnVsbE5hbWUuaW5kZXhPZignOicpID4gLTEgdGhlbiBjbGFzc0Z1bGxOYW1lLnNwbGl0KCc6JywgMSlbMF0gZWxzZSAnJ1xuXHRcdFx0e2FjY2Vzc29yLCBwcm9wZXJ0eU5hbWV9ID0gQHNwbGl0QWNjZXNzb3IoYXJyWzFdKVxuXHRcdFx0ZnVsbG5hbWUgPSBcIiN7Y2xhc3NGdWxsTmFtZX0jI3twcm9wZXJ0eU5hbWV9XCJcblx0XHRcdFxuXHRcdFx0I2NvbnNvbGUubG9nKGF0dHJzWydmdWxsbmFtZSddLCBuYW1lc3BhY2UpXG5cblx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRhdHRyc1tuYW1lXSA9IHZhbHVlXG5cblx0XHRcdGF0dHJzWydmdWxsbmFtZSddID0gZnVsbG5hbWVcblx0XHRcdGF0dHJzWydhY2Nlc3NvciddID0gaWYgYWNjZXNzb3IgaXMgbmFtZXNwYWNlIHRoZW4gJ2ludGVybmFsJyBlbHNlIGFjY2Vzc29yXG5cdFx0XHRcblx0XHRcdGlmIGF0dHJzWydpc0NvbnN0J10udG9TdHJpbmcoKSBpcyAndHJ1ZSdcblx0XHRcdFx0YXR0cnNbJ3Byb3BlcnR5VHlwZSddID0gJ2NvbnN0YW50J1xuXHRcdFx0XHRhdHRyc1sncmVhZHdyaXRlJ10gPSAncmVhZG9ubHknXG5cdFx0XHRlbHNlXG5cdFx0XHRcdGF0dHJzWydwcm9wZXJ0eVR5cGUnXSA9ICd2YXJpYWJsZSdcblx0XHRcdFx0YXR0cnNbJ3JlYWR3cml0ZSddID0gJ3JlYWR3cml0ZSdcblx0XHRcdFxuXHRcdFx0I2NvbnNvbGUubG9nKGF0dHJzKVxuXG5cdFx0XHRpZiBzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdP1xuXHRcdFx0XHRzdG9yZS5wcm9wZXJ0aWVzW2Z1bGxuYW1lXSA9IGF0dHJzXG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV1bJ3Byb3BlcnRpZXMnXSA/PSBbXVxuXHRcdFx0XHRzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdWydwcm9wZXJ0aWVzJ10ucHVzaChhdHRyc1snbmFtZSddKVxuXHRcdFx0XHRcblx0XG5cdCMgbnNfaW50ZXJuYWw6KlxuXHQjIHByb3RlY3RlZDoqXG5cdCMgcHJpdmF0ZToqXG5cdCMgbmFtZS5zcGFjZToqXG5cdCMgKlxuXHQjIEByZXR1cm4geyBhY2Nlc3NvciA6ICdwdWJsaWMnLCBwcm9wZXJ0eU5hbWUgOiAnKicgfVxuXHRzcGxpdEFjY2Vzc29yOiAobmFtZSkgLT5cblx0XHRhY2Nlc3NvckluZGV4ID0gbmFtZS5pbmRleE9mKCc6Jylcblx0XHRpZiBhY2Nlc3NvckluZGV4ID4gLTFcblx0XHRcdGFjY2Vzc29yID0gbmFtZS5zdWJzdHJpbmcoMCwgYWNjZXNzb3JJbmRleClcblx0XHRcdHByb3BlcnR5TmFtZSA9IG5hbWUuc3Vic3RyaW5nKGFjY2Vzc29ySW5kZXgpXG5cdFx0ZWxzZVxuXHRcdFx0YWNjZXNzb3IgPSAncHVibGljJ1xuXHRcdFx0cHJvcGVydHlOYW1lID0gbmFtZVxuXHRcdFx0XG5cdFx0cmV0dXJuIHsgYWNjZXNzb3IgOiBhY2Nlc3NvciwgcHJvcGVydHlOYW1lIDogcHJvcGVydHlOYW1lIH1cblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgQCByZWFkIENsYXNzLnlhbWxcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRyZWFkQ2xhc3NZYW1sOiAoY2FsbGJhY2spID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRhc3luYy5lYWNoU2VyaWVzKHN0b3JlLmNsYXNzZXMsIEByZWFkQ2xhc3NZYW1sVGFza0Z1bmN0aW9uLCBjYWxsYmFjaylcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIHRhc2sgZnVuY3Rpb25cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0cmVhZENsYXNzWWFtbFRhc2tGdW5jdGlvbjogKGNsYXNzSW5mbywgY2FsbGJhY2spID0+XG5cdFx0c291cmNlZmlsZSA9IGNsYXNzSW5mb1snc291cmNlZmlsZSddXG5cdFx0eWFtbFBhdGggPSBzb3VyY2VmaWxlLnJlcGxhY2UoJHBhdGguZXh0bmFtZShzb3VyY2VmaWxlKSwgJy55YW1sJylcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGNhbmNlbCB0YXNrIGlmIG5vdCBleGlzdHMgeWFtbCBmaWxlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGlmIG5vdCAkZnMuZXhpc3RzU3luYyh5YW1sUGF0aClcblx0XHRcdGNhbGxiYWNrKClcblx0XHRcdHJldHVyblxuXG5cdFx0c291cmNlID0geWFtbC5zYWZlTG9hZCgkZnMucmVhZEZpbGVTeW5jKHlhbWxQYXRoLCB7ZW5jb2Rpbmc6J3V0ZjgnfSkpXG5cblxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIHJlYWQgbmFtZXNwYWNlLnlhbWxcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRyZWFkTmFtZXNwYWNlWWFtbDogKGNhbGxiYWNrKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0c291cmNlRGlyZWN0b3JpZXMgPSBAY29sbGVjdG9yLmdldFNvdXJjZURpcmVjdG9yaWVzKClcblx0XHRuYW1lc3BhY2VJbmZvcyA9IFtdXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBuYW1lc3BhY2VJbmZvID0gc3RvcmUubmFtZXNwYWNlICogc291cmNlIGRpcmVjdG9yaWVzXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGZvciBuYW1lc3BhY2UsIHZhbHVlcyBvZiBzdG9yZS5uYW1lc3BhY2VzXG5cdFx0XHRuYW1lc3BhY2VQYXRoID0gbmFtZXNwYWNlLnNwbGl0KCcuJykuam9pbigkcGF0aC5zZXApXG5cblx0XHRcdGZvciBzb3VyY2VEaXJlY3RvcnkgaW4gc291cmNlRGlyZWN0b3JpZXNcblx0XHRcdFx0eWFtbFBhdGggPSAkcGF0aC5qb2luKHNvdXJjZURpcmVjdG9yeSwgbmFtZXNwYWNlUGF0aCwgJ25hbWVzcGFjZS55YW1sJylcblxuXHRcdFx0XHQjIGFkZCBuYW1lc3BhY2VJbmZvc1xuXHRcdFx0XHRuYW1lc3BhY2VJbmZvcy5wdXNoXG5cdFx0XHRcdFx0eWFtbFBhdGg6IHlhbWxQYXRoXG5cdFx0XHRcdFx0bmFtZXNwYWNlOiBuYW1lc3BhY2Vcblx0XHRcdFx0XHR2YWx1ZXM6IHZhbHVlc1xuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZWFjaCBuYW1lc3BhY2VJbmZvc1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRhc3luYy5lYWNoU2VyaWVzKG5hbWVzcGFjZUluZm9zLCBAcmVhZE5hbWVzcGFjZVlhbWxUYXNrRnVuY3Rpb24sIGNhbGxiYWNrKVxuXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgdGFzayBmdW5jdGlvblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRyZWFkTmFtZXNwYWNlWWFtbFRhc2tGdW5jdGlvbjogKG5hbWVzcGFjZUluZm8sIGNhbGxiYWNrKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0eWFtbFBhdGggPSBuYW1lc3BhY2VJbmZvWyd5YW1sUGF0aCddXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBjYW5jZWwgdGFzayBpZiBub3QgZXhpc3RzIHlhbWwgZmlsZVxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRpZiBub3QgJGZzLmV4aXN0c1N5bmMoeWFtbFBhdGgpXG5cdFx0XHRjYWxsYmFjaygpXG5cdFx0XHRyZXR1cm5cblxuXG5cdFx0dmFsdWVzID0gbmFtZXNwYWNlSW5mb1sndmFsdWVzJ11cblx0XHRuYW1lc3BhY2UgPSBuYW1lc3BhY2VJbmZvWyduYW1lc3BhY2UnXVxuXHRcdHNvdXJjZSA9IHlhbWwuc2FmZUxvYWQoJGZzLnJlYWRGaWxlU3luYyh5YW1sUGF0aCwge2VuY29kaW5nOid1dGY4J30pKVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgcmVhZCBtYW5pZmVzdCBzcGVjXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGlmIHNvdXJjZVsnbmFtZXNwYWNlJ10/IGFuZCBzb3VyY2VbJ2NvbXBvbmVudHMnXT8gYW5kIHNvdXJjZVsnY29tcG9uZW50cyddLmxlbmd0aCA+IDBcblx0XHRcdCMgY29udmVydCBjbGFzc25hbWUgdG8gZnVsbG5hbWUgaWYgZXhpc3RzIG5hbWVzcGFjZVxuXHRcdFx0IyBDb21wb25lbnQgLS0+IG5hbWUuc3BhY2U6Q29tcG9uZW50XG5cdFx0XHRpZiBuYW1lc3BhY2UgaXNudCAnJ1xuXHRcdFx0XHRuZXdDb21wb25lbnRzID0gW11cblx0XHRcdFx0Zm9yIGNvbXBvbmVudCBpbiBzb3VyY2VbJ2NvbXBvbmVudHMnXVxuXHRcdFx0XHRcdG5ld0NvbXBvbmVudHMucHVzaChuYW1lc3BhY2UgKyAnOicgKyBjb21wb25lbnQpXG5cdFx0XHRcdHNvdXJjZVsnY29tcG9uZW50cyddID0gbmV3Q29tcG9uZW50c1xuXG5cdFx0XHQjIG1hbmlmZXN0TmFtZXNwYWNlID0gJ2h0dHA6Ly9ucy5jb20vbnMnXG5cdFx0XHRtYW5pZmVzdE5hbWVzcGFjZSA9IEBjbGVhckJsYW5rKHNvdXJjZVsnbmFtZXNwYWNlJ10pXG5cblx0XHRcdCMgY3JlYXRlIG1hbmlmZXN0IG9iamVjdCBpZiBub3QgZXhpc3RzXG5cdFx0XHRzdG9yZS5tYW5pZmVzdHNbbWFuaWZlc3ROYW1lc3BhY2VdID89IHt9XG5cdFx0XHRtYW5pZmVzdCA9IHN0b3JlLm1hbmlmZXN0c1ttYW5pZmVzdE5hbWVzcGFjZV1cblxuXHRcdFx0IyBzYXZlIG1hbmlmZXN0IGNvbXBvbmVudHNcblx0XHRcdCMgc290cmUubWFuaWZlc3RzWydodHRwOi8vbnMuY29tL25zJ11bJ2NvbXBvbmVudHMnXSA9ICduYW1lLnNwYWNlOkNvbXBvbmVudCdcblx0XHRcdG1hbmlmZXN0Wydjb21wb25lbnRzJ10gPz0gW11cblxuXHRcdFx0Zm9yIGNvbXBvbmVudCBpbiBzb3VyY2VbJ2NvbXBvbmVudHMnXVxuXHRcdFx0XHRtYW5pZmVzdFsnY29tcG9uZW50cyddLnB1c2goY29tcG9uZW50KVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgc2F2ZSBuYW1lc3BhY2UueWFtbCB2YWx1ZXMgdG8gbmFtZXNwYWNlIGluZm9cblx0XHQjIHN0b3JlLm5hbWVzcGFjZXNbJ25hbWUuc3BhY2UnXVtuYW1lXSA9IHZhbHVlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdHZhbHVlc1tuYW1lXSA9IHZhbHVlXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBlbmQgdGFza1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRjYWxsYmFjaygpXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIHV0aWxzXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyB0b3BsZXZlbC54bWwgdXRpbHNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0aXNQcml2YXRlRmllbGQ6IChzb3VyY2UpIC0+XG5cdFx0cmV0dXJuIHNvdXJjZVsnJCddWydmdWxsbmFtZSddLmluZGV4T2YoJy9wcml2YXRlOicpID4gLTEgb3Igc291cmNlWydwcml2YXRlJ10/XG5cblx0Y29udmVydFNlZTogKGxpc3QpID0+XG5cdFx0aWYgbm90IGxpc3Q/IG9yIGxpc3QubGVuZ3RoIGlzIDBcblx0XHRcdHJldHVybiBbXVxuXG5cdFx0Y2xlYXJlZCA9IFtdXG5cblx0XHRmb3Igc2VlIGluIGxpc3Rcblx0XHRcdHNlZSA9IEBjbGVhckJsYW5rKHNlZSlcblx0XHRcdGNsZWFyZWQucHVzaChzZWUpXG5cblx0XHRyZXR1cm4gY2xlYXJlZFxuXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgYmFzaWMgdXRpbHNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyByZW1vdmUgYWxsIGZyb250IGFuZCBiYWNrIHNwYWNlIGNoYXJhY3RlciBvZiBzdHJpbmdcblx0Y2xlYXJCbGFuazogKHN0cikgLT5cblx0XHRyZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKVxuXG5cdCMgbmFtZS5zcGFjZTpDbGFzczE7bmFtZS5zcGFjZS5DbGFzczIgLS0+IFtuYW1lLnNwYWNlLkNsYXNzMSwgbmFtZS5zcGFjZS5DbGFzczJdXG5cdHNlbWljb2xvblN0cmluZ1RvQXJyYXk6IChzdHIpIC0+XG5cdFx0aWYgc3RyPyBvciBzdHIgaXMgJydcblx0XHRcdHN0ci5zcGxpdCgnOycpXG5cdFx0ZWxzZVxuXHRcdFx0JydcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgZGVidWcgOiB0cmFjZSBzdG9yZSBvYmplY3Rcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRwcmludFN0b3JlOiAoKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0aW50ZXJmYWNlcyA9IHN0b3JlLmludGVyZmFjZXNcblx0XHRjbGFzc2VzID0gc3RvcmUuY2xhc3Nlc1xuXHRcdG5hbWVzcGFjZXMgPSBzdG9yZS5uYW1lc3BhY2VzXG5cdFx0bWV0aG9kcyA9IHN0b3JlLm1ldGhvZHNcblx0XHRwcm9wZXJ0aWVzID0gc3RvcmUucHJvcGVydGllc1xuXHRcdG1hbmlmZXN0cyA9IHN0b3JlLm1hbmlmZXN0c1xuXG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogbmFtZXNwYWNlcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIG5hbWVzcGFjZXNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IGludGVyZmFjZXMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBpbnRlcmZhY2VzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBjbGFzc2VzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgY2xhc3Nlc1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogbWV0aG9kcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIG1ldGhvZHNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IHByb3BlcnRpZXMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBwcm9wZXJ0aWVzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBtYW5pZmVzdHMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBtYW5pZmVzdHNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblxuXG4jIGNvbXBsZXRlID0gYGZ1bmN0aW9uKGVycm9yLCBkaWMpYFxuIyBkaWNbbmFtZS5zcGFjZS5DbGFzc11cdFtwcm9wZXJ0eV1cdFx0PSBodHRwOi8vfi9uYW1lL3NwYWNlL0NsYXNzLmh0bWwjcHJvcGVydHlcbiMgZGljW25hbWUuc3BhY2UuQ2xhc3NdXHRbbWV0aG9kKCldXHRcdD0gaHR0cDovL34vbmFtZS9zcGFjZS9DbGFzcy5odG1sI21ldGhvZCgpXG4jIGRpY1tuYW1lLnNwYWNlXVx0XHRbbWV0aG9kKCldXHRcdD0gaHR0cDovL34vbmFtZS9zcGFjZS8jbWV0aG9kKCkgPz8/XG4jIGRpY1tuYW1lLnNwYWNlLkNsYXNzXVx0W3N0eWxlOm5hbWVdXHQ9IGh0dHA6Ly9+L25hbWUvc3BhY2UvQ2xhc3MuaHRtbCNzdHlsZTpuYW1lXG4jIGdldEFzZG9jSW5kZXg6ICh1cmwsIGNvbXBsZXRlKSAtPlxuIyBodHRwOi8vaGVscC5hZG9iZS5jb20va29fS1IvRmxhc2hQbGF0Zm9ybS9yZWZlcmVuY2UvYWN0aW9uc2NyaXB0LzMvYWxsLWluZGV4LUEuaHRtbFxuIyBodHRwOi8vZmxleC5hcGFjaGUub3JnL2FzZG9jL2FsbC1pbmRleC1CLmh0bWxcblxuXG5cbiMgZ2V0IGFsbC1pbmRleC1BIH4gWlxuIyBwYXJzZSBhbmQgZmluZCBjbGFzcz1cImlkeHJvd1wiXG4jIGRpY1suLl1bLi5dID0gdXJsXG4jIGNvbXBsZXRlKGVycm9yLCBkaWMpXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEZsZG9jIl19