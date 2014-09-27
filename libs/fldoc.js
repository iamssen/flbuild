(function() {
  var $fs, $path, Fldoc, SourceCollector, async, cheerio, exec, marked, pick, request, xml2js, yaml,
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

  cheerio = require('cheerio');

  request = require('request');

  Fldoc = (function() {
    function Fldoc(build) {
      this.build = build;
      this.printFields = __bind(this.printFields, this);
      this.printStore = __bind(this.printStore, this);
      this.readNamespaceYamlTaskFunction = __bind(this.readNamespaceYamlTaskFunction, this);
      this.readNamespaceYaml = __bind(this.readNamespaceYaml, this);
      this.joinInfo = __bind(this.joinInfo, this);
      this.joinClassYamlMethodInfo = __bind(this.joinClassYamlMethodInfo, this);
      this.joinClassYamlFieldInfo = __bind(this.joinClassYamlFieldInfo, this);
      this.joinClassYamlClassInfo = __bind(this.joinClassYamlClassInfo, this);
      this.readClassYamlTaskFunction = __bind(this.readClassYamlTaskFunction, this);
      this.readClassYaml = __bind(this.readClassYaml, this);
      this.readAsdocField = __bind(this.readAsdocField, this);
      this.readAsdocMethod = __bind(this.readAsdocMethod, this);
      this.readAsdocInterfaceRec = __bind(this.readAsdocInterfaceRec, this);
      this.readAsdocClassRec = __bind(this.readAsdocClassRec, this);
      this.readAsdocDataXML = __bind(this.readAsdocDataXML, this);
      this.createAsdocDataXML = __bind(this.createAsdocDataXML, this);
      this.createAsdocBuildCommand = __bind(this.createAsdocBuildCommand, this);
      this.getExternalAsdocTaskFunction = __bind(this.getExternalAsdocTaskFunction, this);
      this.getExternalAsdoc = __bind(this.getExternalAsdoc, this);
      this.saveStoreToFile = __bind(this.saveStoreToFile, this);
      this.create = __bind(this.create, this);
      this.addArg = __bind(this.addArg, this);
      this.addSourceDirectory = __bind(this.addSourceDirectory, this);
      this.addLibraryDirectory = __bind(this.addLibraryDirectory, this);
      this.setFilterFunction = __bind(this.setFilterFunction, this);
      this.setExternalFldoc = __bind(this.setExternalFldoc, this);
      this.setExternalAsdoc = __bind(this.setExternalAsdoc, this);
      this.setApacheFlexAsdoc = __bind(this.setApacheFlexAsdoc, this);
      this.setAdobeAsdoc = __bind(this.setAdobeAsdoc, this);
      this.refreshExternalAsdocCache = __bind(this.refreshExternalAsdocCache, this);
      this.collector = new SourceCollector(this.build);
      this.externalAsdocs = [];
      this.externalFldocs = [];
      this.adobeAsdoc = 'http://help.adobe.com/ko_KR/FlashPlatform/reference/actionscript/3/';
      this.apacheFlexAsdoc = 'http://flex.apache.org/asdoc/';
    }

    Fldoc.prototype.refreshExternalAsdocCache = function() {
      return this.removeExternalAsdocCache = true;
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

    Fldoc.prototype.create = function(output, complete) {
      var tasks;
      this.output = output;
      this.store = {
        sourceDirectories: [],
        interfaces: {},
        classes: {},
        namespaces: {},
        methods: {},
        properties: {},
        manifests: {},
        external: {}
      };
      tasks = [this.readAsdocDataXML, this.readNamespaceYaml, this.readClassYaml, this.getExternalAsdoc, this.saveStoreToFile];
      return async.series(tasks, complete);
    };

    Fldoc.prototype.saveStoreToFile = function(callback) {
      var directory, json, _i, _len, _ref;
      _ref = this.collector.getSourceDirectories();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        directory = _ref[_i];
        if (this.build.isWindow()) {
          directory = directory.replace(/\//g, "\\");
        }
        this.store.sourceDirectories.push(directory);
      }
      json = JSON.stringify(this.store, null, '\t');
      return $fs.writeFile(this.output, json, {
        encoding: 'utf8'
      }, callback);
    };

    Fldoc.prototype.externalAsdocCacheDirectoryName = '.external_asdoc_cache';

    Fldoc.prototype.convertUrlToCacheName = function(url) {
      return url.replace(/[^a-zA-Z0-9]/g, '_');
    };

    Fldoc.prototype.getExternalAsdoc = function(callback) {
      var a2z, asdoc, asdocs, cacheFile, char, check, externalCacheDirectory, reqs, url, _i, _j, _len, _len1;
      externalCacheDirectory = $path.normalize(this.externalAsdocCacheDirectoryName);
      if (this.removeExternalAsdocCache && $fs.existsSync(externalCacheDirectory)) {
        $fs.removeSync(externalCacheDirectory);
      }
      if (!$fs.existsSync(externalCacheDirectory)) {
        $fs.mkdirSync(externalCacheDirectory);
      }
      asdocs = [this.adobeAsdoc, this.apacheFlexAsdoc];
      if ((this.externalAsdocs != null) && this.externalAsdocs.length > 0) {
        asdocs = asdocs.concat(this.externalAsdocs);
      }
      a2z = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      check = /\/$/;
      reqs = [];
      for (_i = 0, _len = asdocs.length; _i < _len; _i++) {
        asdoc = asdocs[_i];
        if (!check.test(asdoc)) {
          asdoc = asdoc + '/';
        }
        for (_j = 0, _len1 = a2z.length; _j < _len1; _j++) {
          char = a2z[_j];
          url = "" + asdoc + "all-index-" + char + ".html";
          cacheFile = $path.join(externalCacheDirectory, this.convertUrlToCacheName(url) + '.json');
          reqs.push({
            cache: cacheFile,
            asdoc: asdoc,
            url: url
          });
        }
      }
      return async.eachSeries(reqs, this.getExternalAsdocTaskFunction, callback);
    };

    Fldoc.prototype.getExternalAsdocTaskFunction = function(req, callback) {
      var external, register;
      external = this.store.external;
      register = function(cache) {
        var fullname, item, url, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = cache.length; _i < _len; _i++) {
          item = cache[_i];
          fullname = item['fullname'];
          url = item['url'];
          _results.push(external[fullname] = url);
        }
        return _results;
      };
      if ($fs.existsSync(req.cache)) {
        return $fs.readFile(req.cache, {
          encoding: 'utf8'
        }, function(err, data) {
          if ((err == null) && (data != null)) {
            register(JSON.parse(data));
            return callback();
          }
        });
      } else {
        return request(req.url, function(err, res, body) {
          var $, cache, classMembers, classes, classpath, member, members, nodes, url;
          if ((err != null) || res.statusCode !== 200) {
            console.load(err, res.statusCode);
            callback();
            return;
          }
          $ = cheerio.load(body);
          classes = {};
          classMembers = {};
          classpath = null;
          nodes = $('td.idxrow');
          nodes.each(function(index) {
            var anchor, arr, href, html;
            href = $(this).children('a').first().attr('href');
            arr = href.split('#');
            html = null;
            anchor = null;
            if (arr.length === 2) {
              html = arr[0];
              anchor = arr[1];
            } else if (arr.length === 1) {
              html = arr[0];
            } else {
              return;
            }
            classpath = html.substring(0, html.length - 5).replace(/\//g, '.').replace(/^\.*/g, '');
            if (anchor != null) {
              if (classMembers[classpath] == null) {
                classMembers[classpath] = {};
              }
              return classMembers[classpath][anchor] = req.asdoc + href;
            } else {
              return classes[classpath] != null ? classes[classpath] : classes[classpath] = req.asdoc + href;
            }
          });
          cache = [];
          for (classpath in classes) {
            url = classes[classpath];
            cache.push({
              fullname: classpath.replace(/([a-zA-Z0-9\_\.]+)\.([a-zA-Z0-9\_]+)($|\#)/, '$1:$2$3'),
              url: url
            });
          }
          for (classpath in classMembers) {
            members = classMembers[classpath];
            for (member in members) {
              url = members[member];
              cache.push({
                fullname: ("" + classpath + "#" + member).replace(/([a-zA-Z0-9\_\.]+)\.([a-zA-Z0-9\_]+)($|\#)/, '$1:$2$3'),
                url: url
              });
            }
          }
          return $fs.writeFile(req.cache, JSON.stringify(cache), {
            encoding: 'utf8'
          }, function(err) {
            register(cache);
            return callback();
          });
        });
      }
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
      var attrs, fullname, name, namespace, source, store, value, _base, _base1, _i, _len, _results;
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
          attrs[name] = this.clearBlank(value);
        }
        attrs['interfaces'] = this.semicolonStringToArray(attrs['interfaces']);
        if (store.classes[fullname] == null) {
          store.classes[fullname] = attrs;
        }
        if ((_base = store.namespaces)[namespace] == null) {
          _base[namespace] = {};
        }
        if ((_base1 = store.namespaces[namespace])['classes'] == null) {
          _base1['classes'] = [];
        }
        _results.push(store.namespaces[namespace]['classes'].push(fullname));
      }
      return _results;
    };

    Fldoc.prototype.readAsdocInterfaceRec = function(list) {
      var attrs, fullname, name, namespace, source, store, value, _base, _base1, _i, _len, _results;
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
          attrs[name] = this.clearBlank(value);
        }
        attrs['baseClasses'] = this.semicolonStringToArray(attrs['baseClasses']);
        if (store.interfaces[fullname] == null) {
          store.interfaces[fullname] = attrs;
        }
        if ((_base = store.namespaces)[namespace] == null) {
          _base[namespace] = {};
        }
        if ((_base1 = store.namespaces[namespace])['interfaces'] == null) {
          _base1['interfaces'] = [];
        }
        _results.push(store.namespaces[namespace]['interfaces'].push(fullname));
      }
      return _results;
    };

    Fldoc.prototype.readAsdocMethod = function(list) {
      var accessor, arr, attrs, classFullName, fullname, get, getset, i, isAccessor, methods, name, namespace, param, param_defaults, param_names, param_types, params, properties, propertyName, set, source, store, value, _base, _base1, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2, _results;
      store = this.store;
      isAccessor = /\/(get|set)$/;
      properties = {};
      methods = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        source = list[_i];
        if (this.isPrivateField(source)) {
          continue;
        }
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
            attrs[name] = this.clearBlank(value);
          }
        }
        if (set != null) {
          for (name in set) {
            value = set[name];
            if (name === '$') {
              continue;
            }
            attrs[name] = this.joinProperties(attrs[name], this.clearBlank(value));
          }
        }
        if (store.classes[classFullName] != null) {
          store.properties[fullname] = attrs;
          if ((_base = store.classes[classFullName])['properties'] == null) {
            _base['properties'] = [];
          }
          store.classes[classFullName]['properties'].push(attrs['name']);
        }
      }
      _results = [];
      for (_j = 0, _len1 = methods.length; _j < _len1; _j++) {
        source = methods[_j];
        attrs = source['$'];
        arr = attrs['fullname'].split('/');
        classFullName = arr[0];
        namespace = classFullName.indexOf(':') > -1 ? classFullName.split(':', 1)[0] : '';
        _ref1 = this.splitAccessor(arr[1]), accessor = _ref1.accessor, propertyName = _ref1.propertyName;
        fullname = "" + classFullName + "#" + propertyName + "()";
        for (name in source) {
          value = source[name];
          if (name === '$') {
            continue;
          }
          attrs[name] = this.clearBlank(value);
        }
        attrs['fullname'] = fullname;
        attrs['assessor'] = accessor === namespace ? 'internal' : accessor;
        if (attrs['param_names'] != null) {
          param_names = attrs['param_names'].split(';');
          param_types = attrs['param_types'].split(';');
          param_defaults = attrs['param_defaults'].split(';');
          params = [];
          for (i = _k = 0, _ref2 = param_names.length - 1; 0 <= _ref2 ? _k <= _ref2 : _k >= _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
            param = {};
            param['name'] = param_names[i];
            param['type'] = param_types[i];
            param['default'] = param_defaults[i];
            if ((attrs['param'] != null) && (attrs['param'][i] != null)) {
              param['description'] = attrs['param'][i];
            }
            params.push(param);
          }
          attrs['params'] = params;
        }
        if (store.classes[classFullName] != null) {
          store.methods[fullname] = attrs;
          if ((_base1 = store.classes[classFullName])['methods'] == null) {
            _base1['methods'] = [];
          }
          _results.push(store.classes[classFullName]['methods'].push("" + attrs['name'] + "()"));
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
          attrs[name] = this.clearBlank(value);
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
        propertyName = name.substring(accessorIndex + 1);
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
      var arr, name, store, value, vlaue, _ref, _ref1;
      store = this.store;
      arr = [];
      _ref = store.classes;
      for (name in _ref) {
        value = _ref[name];
        arr.push(value);
      }
      _ref1 = store.interfaces;
      for (name in _ref1) {
        vlaue = _ref1[name];
        arr.push(value);
      }
      return async.eachSeries(arr, this.readClassYamlTaskFunction, callback);
    };

    Fldoc.prototype.readClassYamlTaskFunction = function(typeInfo, callback) {
      var methodInfo, methodNameReg, name, propertyInfo, source, sourcefile, typeFullName, value, yamlPath;
      sourcefile = typeInfo['sourcefile'];
      yamlPath = sourcefile.replace($path.extname(sourcefile), '.yaml');
      if (!$fs.existsSync(yamlPath)) {
        callback();
        return;
      }
      source = yaml.safeLoad($fs.readFileSync(yamlPath, {
        encoding: 'utf8'
      }));
      typeFullName = typeInfo['fullname'];
      methodNameReg = /[a-zA-Z0-9\_]+\(\)/;
      for (name in source) {
        value = source[name];
        if (name === 'class' || name === 'interface') {
          this.joinClassYamlClassInfo(typeInfo, value);
        } else if (methodNameReg.test(name)) {
          methodInfo = this.store.methods["" + typeFullName + "#" + name];
          if (methodInfo != null) {
            this.joinClassYamlMethodInfo(methodInfo, value);
          }
        } else {
          propertyInfo = this.store.properties["" + typeFullName + "#" + name];
          if (propertyInfo != null) {
            this.joinClassYamlFieldInfo(propertyInfo, value);
          }
        }
      }
      return callback();
    };

    Fldoc.prototype.joinClassYamlClassInfo = function(origin, source) {
      var avalableProperties;
      avalableProperties = {
        description: true,
        see: true,
        throws: true,
        includeExample: true
      };
      return this.joinInfo(origin, source, avalableProperties);
    };

    Fldoc.prototype.joinClassYamlFieldInfo = function(origin, source) {
      var avalableProperties;
      avalableProperties = {
        description: true,
        see: true,
        throws: true,
        includeExample: true
      };
      return this.joinInfo(origin, source, avalableProperties);
    };

    Fldoc.prototype.joinClassYamlMethodInfo = function(origin, source) {
      var avalableProperties;
      avalableProperties = {
        description: true,
        see: true,
        throws: true,
        includeExample: true,
        'return': true
      };
      return this.joinInfo(origin, source, avalableProperties);
    };

    Fldoc.prototype.joinInfo = function(origin, source, avalableProperties) {
      var name, value, _results;
      _results = [];
      for (name in source) {
        value = source[name];
        if (avalableProperties[name] === true) {
          _results.push(origin[name] = this.joinProperties(origin[name], this.clearBlank(source[name]), true));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
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
      var component, manifest, manifestNamespace, namespace, newComponents, source, store, values, yamlPath, _base, _i, _j, _len, _len1, _ref, _ref1;
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
          manifest['components'].push(this.clearBlank(component));
        }
      }
      values['description'] = this.joinProperties(values['description'], source['description']);
      return callback();
    };

    Fldoc.prototype.isPrivateField = function(source) {
      return source['$']['fullname'].indexOf('/private:') > -1 || (source['private'] != null);
    };

    Fldoc.prototype.clearBlank = function(obj) {
      var i, regexp, _i, _ref;
      regexp = /^\s*|\s*$/g;
      if (typeof obj === 'string') {
        return obj.replace(regexp, '');
      } else if (obj instanceof Array && obj.length > 0) {
        for (i = _i = 0, _ref = obj.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (typeof obj[i] === 'string') {
            obj[i] = obj[i].replace(regexp, '');
          }
        }
      }
      return obj;
    };

    Fldoc.prototype.semicolonStringToArray = function(str) {
      if ((str != null) || str === '') {
        return str.split(';');
      } else {
        return '';
      }
    };

    Fldoc.prototype.joinProperties = function(primary, secondary, overrideToSecondary) {
      if (overrideToSecondary == null) {
        overrideToSecondary = false;
      }
      if ((primary != null) && (secondary != null) && primary instanceof Array) {
        if (secondary instanceof Array) {
          return primary.concat(secondary);
        } else {
          primary.push(secondary);
          return primary;
        }
      } else if ((primary != null) && (secondary != null)) {
        if (overrideToSecondary) {
          return secondary;
        } else {
          return primary;
        }
      } else if ((primary == null) && (secondary != null)) {
        return secondary;
      } else {
        return primary;
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

    Fldoc.prototype.printFields = function() {
      var print, store;
      store = this.store;
      print = function(collection) {
        var collectionName, collectionValue, fields, name, value, _results;
        fields = {};
        for (collectionName in collection) {
          collectionValue = collection[collectionName];
          for (name in collectionValue) {
            value = collectionValue[name];
            if (fields[name] == null) {
              fields[name] = typeof value;
            }
          }
        }
        _results = [];
        for (name in fields) {
          value = fields[name];
          _results.push(console.log(name, ':', value));
        }
        return _results;
      };
      console.log('==================== : field infos');
      console.log('----------- : namespace fields');
      print(store.namespaces);
      console.log('----------- : interface fields');
      print(store.interfaces);
      console.log('----------- : class fields');
      print(store.classes);
      console.log('----------- : method fields');
      print(store.methods);
      console.log('----------- : property fields');
      print(store.properties);
      console.log('----------- : manifest fields');
      return print(store.manifests);
    };

    return Fldoc;

  })();

  module.exports = Fldoc;

}).call(this);

//# sourceMappingURL=data:application/json;base64,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LENBQVksNEJBQVosQ0FuQkEsQ0FBQTtBQUFBLE1Bb0JBLEtBQUEsQ0FBTSxLQUFLLENBQUMsT0FBWixDQXBCQSxDQUFBO0FBQUEsTUFzQkEsT0FBTyxDQUFDLEdBQVIsQ0FBWSw2QkFBWixDQXRCQSxDQUFBO0FBQUEsTUF1QkEsS0FBQSxDQUFNLEtBQUssQ0FBQyxPQUFaLENBdkJBLENBQUE7QUFBQSxNQXlCQSxPQUFPLENBQUMsR0FBUixDQUFZLCtCQUFaLENBekJBLENBQUE7QUFBQSxNQTBCQSxLQUFBLENBQU0sS0FBSyxDQUFDLFVBQVosQ0ExQkEsQ0FBQTtBQUFBLE1BNEJBLE9BQU8sQ0FBQyxHQUFSLENBQVksK0JBQVosQ0E1QkEsQ0FBQTthQTZCQSxLQUFBLENBQU0sS0FBSyxDQUFDLFNBQVosRUE5QmE7SUFBQSxDQXQwQmQsQ0FBQTs7aUJBQUE7O01BYkQsQ0FBQTs7QUFBQSxFQXE0QkEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsS0FyNEJqQixDQUFBO0FBQUEiLCJmaWxlIjoiZmxkb2MuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIkZnMgPSByZXF1aXJlKCdmcy1leHRyYScpXG4kcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuYXN5bmMgPSByZXF1aXJlKCdhc3luYycpXG5waWNrID0gcmVxdWlyZSgnZmlsZS1waWNrZXInKS5waWNrXG5leGVjID0gcmVxdWlyZSgnZG9uZS1leGVjJylcbntTb3VyY2VDb2xsZWN0b3J9ID0gcmVxdWlyZSgnLi9mbHV0aWxzJylcbnhtbDJqcyA9IHJlcXVpcmUoJ3htbDJqcycpXG55YW1sID0gcmVxdWlyZSgnanMteWFtbCcpXG5tYXJrZWQgPSByZXF1aXJlKCdtYXJrZWQnKVxuY2hlZXJpbyA9IHJlcXVpcmUoJ2NoZWVyaW8nKVxucmVxdWVzdCA9IHJlcXVpcmUoJ3JlcXVlc3QnKVxuXG5jbGFzcyBGbGRvY1xuXHRjb25zdHJ1Y3RvcjogKEBidWlsZCkgLT5cblx0XHRAY29sbGVjdG9yID0gbmV3IFNvdXJjZUNvbGxlY3RvcihAYnVpbGQpXG5cdFx0QGV4dGVybmFsQXNkb2NzID0gW11cblx0XHRAZXh0ZXJuYWxGbGRvY3MgPSBbXVxuXHRcdEBhZG9iZUFzZG9jID0gJ2h0dHA6Ly9oZWxwLmFkb2JlLmNvbS9rb19LUi9GbGFzaFBsYXRmb3JtL3JlZmVyZW5jZS9hY3Rpb25zY3JpcHQvMy8nXG5cdFx0QGFwYWNoZUZsZXhBc2RvYyA9ICdodHRwOi8vZmxleC5hcGFjaGUub3JnL2FzZG9jLydcblxuXHRcdCMgc291cmNlID4gZXh0ZXJuYWxGbGRvY3MgPiBleHRlcm5hbEFzZG9jcyA+IGFwYWNoZUZsZXhBc2RvYyA+IGFkb2JlQXNkb2NcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgc2V0dGluZ1xuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgZXh0ZXJuYWwgZG9jdW1lbnQgc291cmNlc1xuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRyZWZyZXNoRXh0ZXJuYWxBc2RvY0NhY2hlOiAoKSA9PlxuXHRcdEByZW1vdmVFeHRlcm5hbEFzZG9jQ2FjaGUgPSB0cnVlXG5cdFxuXHRzZXRBZG9iZUFzZG9jOiAodXJsKSA9PlxuXHRcdEBhZG9iZUFzZG9jID0gdXJsXG5cblx0c2V0QXBhY2hlRmxleEFzZG9jOiAodXJsKSA9PlxuXHRcdEBhcGFjaGVGbGV4QXNkb2MgPSB1cmxcblxuXHRzZXRFeHRlcm5hbEFzZG9jOiAodXJsKSA9PlxuXHRcdEBleHRlcm5hbEFzZG9jcy5wdXNoKHVybClcblxuXHRzZXRFeHRlcm5hbEZsZG9jOiAodXJsKSA9PlxuXHRcdEBleHRlcm5hbEZsZG9jcy5wdXNoKHVybClcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIGFzZG9jIGZpbHRlciBmdW5jdGlvblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIEBwYXJhbSBmdW5jIGBib29sZWFuIGZ1bmN0aW9uKGZpbGUpYFxuXHRzZXRGaWx0ZXJGdW5jdGlvbjogKGZ1bmMpID0+XG5cdFx0QGZpbHRlckZ1bmN0aW9uID0gZnVuY1xuXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgYXNkb2Mgc291cmNlc1xuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRhZGRMaWJyYXJ5RGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAY29sbGVjdG9yLmFkZExpYnJhcnlEaXJlY3RvcnkocGF0aClcblxuXHRhZGRTb3VyY2VEaXJlY3Rvcnk6IChwYXRoKSA9PlxuXHRcdEBjb2xsZWN0b3IuYWRkU291cmNlRGlyZWN0b3J5KHBhdGgpXG5cblx0YWRkQXJnOiAoYXJnKSA9PlxuXHRcdEBjb2xsZWN0b3IuYWRkQXJnKGFyZylcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgY3JlYXRlXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Y3JlYXRlOiAoQG91dHB1dCwgY29tcGxldGUpID0+XG5cdFx0QHN0b3JlID1cblx0XHRcdHNvdXJjZURpcmVjdG9yaWVzOiBbXVxuXHRcdFx0aW50ZXJmYWNlczoge31cblx0XHRcdGNsYXNzZXM6IHt9XG5cdFx0XHRuYW1lc3BhY2VzOiB7fVxuXHRcdFx0bWV0aG9kczoge31cblx0XHRcdHByb3BlcnRpZXM6IHt9XG5cdFx0XHRtYW5pZmVzdHM6IHt9XG5cdFx0XHRleHRlcm5hbDoge31cblxuXHRcdHRhc2tzID0gW1xuXHRcdFx0I0BjcmVhdGVBc2RvY0RhdGFYTUxcblx0XHRcdEByZWFkQXNkb2NEYXRhWE1MXG5cdFx0XHRAcmVhZE5hbWVzcGFjZVlhbWxcblx0XHRcdEByZWFkQ2xhc3NZYW1sXG5cdFx0XHRAZ2V0RXh0ZXJuYWxBc2RvY1xuXHRcdFx0QHNhdmVTdG9yZVRvRmlsZVxuXHRcdFx0I0BwcmludFN0b3JlXG5cdFx0XHQjQHByaW50RmllbGRzXG5cdFx0XVxuXG5cdFx0YXN5bmMuc2VyaWVzKHRhc2tzLCBjb21wbGV0ZSlcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgQCBzYXZlXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0c2F2ZVN0b3JlVG9GaWxlOiAoY2FsbGJhY2spID0+XG5cdFx0Zm9yIGRpcmVjdG9yeSBpbiBAY29sbGVjdG9yLmdldFNvdXJjZURpcmVjdG9yaWVzKClcblx0XHRcdGRpcmVjdG9yeSA9IGRpcmVjdG9yeS5yZXBsYWNlKC9cXC8vZywgXCJcXFxcXCIpIGlmIEBidWlsZC5pc1dpbmRvdygpXG5cdFx0XHRAc3RvcmUuc291cmNlRGlyZWN0b3JpZXMucHVzaChkaXJlY3RvcnkpXG5cdFx0XG5cdFx0anNvbiA9IEpTT04uc3RyaW5naWZ5KEBzdG9yZSwgbnVsbCwgJ1xcdCcpXG5cdFx0JGZzLndyaXRlRmlsZSBAb3V0cHV0LCBqc29uLCB7ZW5jb2Rpbmc6J3V0ZjgnfSwgY2FsbGJhY2tcblx0XHRcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIEAgZ2V0IGV4dGVybmFsIGFzZG9jIGxpc3Rcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRleHRlcm5hbEFzZG9jQ2FjaGVEaXJlY3RvcnlOYW1lOiAnLmV4dGVybmFsX2FzZG9jX2NhY2hlJ1xuXHRcblx0Y29udmVydFVybFRvQ2FjaGVOYW1lOiAodXJsKSAtPlxuXHRcdHVybC5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJ18nKVxuXHRcblx0Z2V0RXh0ZXJuYWxBc2RvYzogKGNhbGxiYWNrKSA9PlxuXHRcdGV4dGVybmFsQ2FjaGVEaXJlY3RvcnkgPSAkcGF0aC5ub3JtYWxpemUoQGV4dGVybmFsQXNkb2NDYWNoZURpcmVjdG9yeU5hbWUpXG5cblx0XHQjIHJlbW92ZSBjYWNoZSBkaXJlY3RvcnkgaWYgZXhpc3RzXG5cdFx0aWYgQHJlbW92ZUV4dGVybmFsQXNkb2NDYWNoZSBhbmQgJGZzLmV4aXN0c1N5bmMoZXh0ZXJuYWxDYWNoZURpcmVjdG9yeSlcblx0XHRcdCRmcy5yZW1vdmVTeW5jKGV4dGVybmFsQ2FjaGVEaXJlY3RvcnkpXG5cblx0XHQjIGNyZWF0ZSBjYWNoZSBkaXJlY3Rvcnlcblx0XHRpZiBub3QgJGZzLmV4aXN0c1N5bmMoZXh0ZXJuYWxDYWNoZURpcmVjdG9yeSlcblx0XHRcdCRmcy5ta2RpclN5bmMoZXh0ZXJuYWxDYWNoZURpcmVjdG9yeSlcblxuXHRcdGFzZG9jcyA9IFtAYWRvYmVBc2RvYywgQGFwYWNoZUZsZXhBc2RvY11cblx0XHRhc2RvY3MgPSBhc2RvY3MuY29uY2F0KEBleHRlcm5hbEFzZG9jcykgaWYgQGV4dGVybmFsQXNkb2NzPyBhbmQgQGV4dGVybmFsQXNkb2NzLmxlbmd0aCA+IDBcblx0XHRhMnogPSBbJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCcsICdJJywgJ0onLCAnSycsICdMJywgJ00nLCAnTicsICdPJywgJ1AnLCAnUScsICdSJywgJ1MnLCAnVCcsICdVJywgJ1YnLCAnVycsICdYJywgJ1knLCAnWiddXG5cdFx0Y2hlY2sgPSAvXFwvJC9cblxuXHRcdHJlcXMgPSBbXVxuXHRcdGZvciBhc2RvYyBpbiBhc2RvY3Ncblx0XHRcdGlmIG5vdCBjaGVjay50ZXN0KGFzZG9jKVxuXHRcdFx0XHRhc2RvYyA9IGFzZG9jICsgJy8nIFxuXHRcdFx0XHRcblx0XHRcdGZvciBjaGFyIGluIGEyelxuXHRcdFx0XHR1cmwgPSBcIiN7YXNkb2N9YWxsLWluZGV4LSN7Y2hhcn0uaHRtbFwiXG5cdFx0XHRcdGNhY2hlRmlsZSA9ICRwYXRoLmpvaW4oZXh0ZXJuYWxDYWNoZURpcmVjdG9yeSwgQGNvbnZlcnRVcmxUb0NhY2hlTmFtZSh1cmwpICsgJy5qc29uJylcblx0XHRcdFx0XG5cdFx0XHRcdHJlcXMucHVzaFxuXHRcdFx0XHRcdGNhY2hlOiBjYWNoZUZpbGVcblx0XHRcdFx0XHRhc2RvYzogYXNkb2Ncblx0XHRcdFx0XHR1cmw6IHVybFxuXHRcdFxuXHRcdGFzeW5jLmVhY2hTZXJpZXMocmVxcywgQGdldEV4dGVybmFsQXNkb2NUYXNrRnVuY3Rpb24sIGNhbGxiYWNrKVxuXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgdGFzayBmdW5jdGlvblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRnZXRFeHRlcm5hbEFzZG9jVGFza0Z1bmN0aW9uOiAocmVxLCBjYWxsYmFjaykgPT5cblx0XHRleHRlcm5hbCA9IEBzdG9yZS5leHRlcm5hbFxuXG5cdFx0IyByZWdpc3RlciBjYWNoZSBvYmplY3QgKGEganNvbiBjYWNoZSBmaWxlIGNvbnRlbnRzKVxuXHRcdHJlZ2lzdGVyID0gKGNhY2hlKSAtPlxuXHRcdFx0Zm9yIGl0ZW0gaW4gY2FjaGVcblx0XHRcdFx0ZnVsbG5hbWUgPSBpdGVtWydmdWxsbmFtZSddXG5cdFx0XHRcdHVybCA9IGl0ZW1bJ3VybCddXG5cdFx0XHRcdGV4dGVybmFsW2Z1bGxuYW1lXSA9IHVybFxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGlmIGhhcyBjYWNoZSBmaWxlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRpZiAkZnMuZXhpc3RzU3luYyhyZXEuY2FjaGUpXG5cdFx0XHQkZnMucmVhZEZpbGUgcmVxLmNhY2hlLCB7ZW5jb2Rpbmc6J3V0ZjgnfSwgKGVyciwgZGF0YSkgLT5cblx0XHRcdFx0aWYgbm90IGVycj8gYW5kIGRhdGE/XG5cdFx0XHRcdFx0cmVnaXN0ZXIoSlNPTi5wYXJzZShkYXRhKSlcblx0XHRcdFx0XHRjYWxsYmFjaygpXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgaWYgbm90IGhhcyBjYWNoZSBmaWxlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRlbHNlXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHQjIDAgZ2V0IGFzZG9jIHdlYiBwYWdlXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRyZXF1ZXN0IHJlcS51cmwsIChlcnIsIHJlcywgYm9keSkgLT5cblx0XHRcdFx0aWYgZXJyPyBvciByZXMuc3RhdHVzQ29kZSBpc250IDIwMFxuXHRcdFx0XHRcdGNvbnNvbGUubG9hZChlcnIsIHJlcy5zdGF0dXNDb2RlKVxuXHRcdFx0XHRcdGNhbGxiYWNrKClcblx0XHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCMgMSBjcmVhdGUganF1ZXJ5IG9iamVjdFxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCQgPSBjaGVlcmlvLmxvYWQoYm9keSlcblx0XHRcdFx0XHRcblx0XHRcdFx0Y2xhc3NlcyA9IHt9XG5cdFx0XHRcdGNsYXNzTWVtYmVycyA9IHt9XG5cdFx0XHRcdGNsYXNzcGF0aCA9IG51bGxcblxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCMgMiBzZWxlY3QgYWxsIDx0ZCBjbGFzcz1cImlkeHJvd1wiLz4gb2JqZWN0XG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdFx0bm9kZXMgPSAkKCd0ZC5pZHhyb3cnKVxuXHRcdFx0XHRub2Rlcy5lYWNoIChpbmRleCkgLT5cblx0XHRcdFx0XHRocmVmID0gJChAKS5jaGlsZHJlbignYScpLmZpcnN0KCkuYXR0cignaHJlZicpXG5cdFx0XHRcdFx0YXJyID0gaHJlZi5zcGxpdCgnIycpXG5cdFx0XHRcdFx0aHRtbCA9IG51bGxcblx0XHRcdFx0XHRhbmNob3IgPSBudWxsXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgYXJyLmxlbmd0aCBpcyAyXG5cdFx0XHRcdFx0XHRodG1sID0gYXJyWzBdXG5cdFx0XHRcdFx0XHRhbmNob3IgPSBhcnJbMV1cblx0XHRcdFx0XHRlbHNlIGlmIGFyci5sZW5ndGggaXMgMVxuXHRcdFx0XHRcdFx0aHRtbCA9IGFyclswXVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0Y2xhc3NwYXRoID0gaHRtbC5zdWJzdHJpbmcoMCwgaHRtbC5sZW5ndGggLSA1KS5yZXBsYWNlKC9cXC8vZywgJy4nKS5yZXBsYWNlKC9eXFwuKi9nLCAnJylcblxuXHRcdFx0XHRcdGlmIGFuY2hvcj9cblx0XHRcdFx0XHRcdGNsYXNzTWVtYmVyc1tjbGFzc3BhdGhdID89IHt9XG5cdFx0XHRcdFx0XHRjbGFzc01lbWJlcnNbY2xhc3NwYXRoXVthbmNob3JdID0gcmVxLmFzZG9jICsgaHJlZlxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGNsYXNzZXNbY2xhc3NwYXRoXSA/PSByZXEuYXNkb2MgKyBocmVmXG5cblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHQjIDMgY3JlYXRlIGEgY2FjaGUgb2JqZWN0XG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdFx0Y2FjaGUgPSBbXVxuXHRcdFx0XHRcblx0XHRcdFx0Zm9yIGNsYXNzcGF0aCwgdXJsIG9mIGNsYXNzZXNcblx0XHRcdFx0XHRjYWNoZS5wdXNoXG5cdFx0XHRcdFx0XHRmdWxsbmFtZTogY2xhc3NwYXRoLnJlcGxhY2UoLyhbYS16QS1aMC05XFxfXFwuXSspXFwuKFthLXpBLVowLTlcXF9dKykoJHxcXCMpLywgJyQxOiQyJDMnKVxuXHRcdFx0XHRcdFx0dXJsOiB1cmxcblx0XHRcdFx0XHRcblx0XHRcdFx0Zm9yIGNsYXNzcGF0aCwgbWVtYmVycyBvZiBjbGFzc01lbWJlcnNcblx0XHRcdFx0XHRmb3IgbWVtYmVyLCB1cmwgb2YgbWVtYmVyc1xuXHRcdFx0XHRcdFx0Y2FjaGUucHVzaFxuXHRcdFx0XHRcdFx0XHRmdWxsbmFtZTogXCIje2NsYXNzcGF0aH0jI3ttZW1iZXJ9XCIucmVwbGFjZSgvKFthLXpBLVowLTlcXF9cXC5dKylcXC4oW2EtekEtWjAtOVxcX10rKSgkfFxcIykvLCAnJDE6JDIkMycpXG5cdFx0XHRcdFx0XHRcdHVybDogdXJsXG5cdFx0XHRcdFxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCMgNCB3cml0ZSB0byBjYWNoZS5qc29uIGZpbGUgYW5kIHJlZ2lzdGVyIHRvIEBzdG9yZS5leHRlcm5hbFswXT1jYWNoZVxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCRmcy53cml0ZUZpbGUgcmVxLmNhY2hlLCBKU09OLnN0cmluZ2lmeShjYWNoZSksIHtlbmNvZGluZzondXRmOCd9LCAoZXJyKSAtPlxuXHRcdFx0XHRcdHJlZ2lzdGVyKGNhY2hlKVxuXHRcdFx0XHRcdGNhbGxiYWNrKClcblx0XHRcdFx0XHRcdFxuXHRcdFx0XG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIEAgY3JlYXRlIGFzZG9jIHhtbCBzb3VyY2Vcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRjYWNoZURpcmVjdG9yeU5hbWU6ICcuYXNkb2NfY2FjaGUnXG5cblx0Y3JlYXRlQXNkb2NCdWlsZENvbW1hbmQ6IChvdXRwdXQsIGNvbXBsZXRlKSA9PlxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyAwIGdldCBleGVjIGZpbGVcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGJpbiA9ICdhc2RvYydcblxuXHRcdEBidWlsZC5nZXRTREtWZXJzaW9uICh2ZXJzaW9uKSA9PlxuXHRcdFx0aWYgQGJ1aWxkLmlzV2luZG93KClcblx0XHRcdFx0aWYgdmVyc2lvbiA+ICc0LjYuMCdcblx0XHRcdFx0XHRiaW4gPSAnYXNkb2MuYmF0J1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0YmluID0gJ2FzZG9jLmV4ZSdcblxuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdCMgMSBjcmVhdGUgcGF0aCBhcmdzXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0YXJncyA9IFtdXG5cblx0XHRcdGFyZ3MucHVzaChAYnVpbGQud3JhcCgkcGF0aC5qb2luKEBidWlsZC5nZXRFbnYoJ0ZMRVhfSE9NRScpLCAnYmluJywgYmluKSkpXG5cblx0XHRcdGZvciBsaWJyYXJ5IGluIEBjb2xsZWN0b3IuZ2V0TGlicmFyaWVzKClcblx0XHRcdFx0YXJncy5wdXNoKCctbGlicmFyeS1wYXRoICcgKyBAYnVpbGQud3JhcChsaWJyYXJ5KSlcblxuXHRcdFx0Zm9yIGxpYnJhcnkgaW4gQGNvbGxlY3Rvci5nZXRFeHRlcm5hbExpYnJhcmllcygpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLWxpYnJhcnktcGF0aCAnICsgQGJ1aWxkLndyYXAobGlicmFyeSkpXG5cblx0XHRcdGZvciBkaXJlY3RvcnkgaW4gQGNvbGxlY3Rvci5nZXRTb3VyY2VEaXJlY3RvcmllcygpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLXNvdXJjZS1wYXRoICcgKyBAYnVpbGQud3JhcChkaXJlY3RvcnkpKVxuXG5cdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0IyAyIGNyZWF0ZSBpbmNsdWRlIGNsYXNzZXMgYXJnc1xuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdEBjb2xsZWN0b3IuZ2V0SW5jbHVkZUNsYXNzZXMgQGZpbHRlckZ1bmN0aW9uLCAoY2xhc3NQYXRocykgPT5cblx0XHRcdFx0YXJncy5wdXNoKCctZG9jLWNsYXNzZXMgJyArIGNsYXNzUGF0aHMuam9pbignICcpKVxuXG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdCMgMyBhcmdzLCBvdXRwdXRcblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdFx0Zm9yIGFyZyBpbiBAY29sbGVjdG9yLmdldEFyZ3MoKVxuXHRcdFx0XHRcdGFyZ3MucHVzaChAYnVpbGQuYXBwbHlFbnYoYXJnKSlcblxuXHRcdFx0XHRhcmdzLnB1c2goJy1vdXRwdXQgJyArIEBidWlsZC53cmFwKEBidWlsZC5yZXNvbHZlUGF0aChvdXRwdXQpKSlcblxuXHRcdFx0XHRhcmdzLnB1c2goJy1rZWVwLXhtbD10cnVlJylcblx0XHRcdFx0YXJncy5wdXNoKCctc2tpcC14c2w9dHJ1ZScpXG5cblx0XHRcdFx0Y29tcGxldGUoYXJncy5qb2luKCcgJykpIGlmIGNvbXBsZXRlP1xuXG5cblx0Y3JlYXRlQXNkb2NEYXRhWE1MOiAoY2FsbGJhY2spID0+XG5cdFx0Y2FjaGVEaXJlY3RvcnkgPSAkcGF0aC5ub3JtYWxpemUoQGNhY2hlRGlyZWN0b3J5TmFtZSlcblxuXHRcdCMgcmVtb3ZlIGNhY2hlIGRpcmVjdG9yeSBpZiBleGlzdHNcblx0XHRpZiAkZnMuZXhpc3RzU3luYyhjYWNoZURpcmVjdG9yeSlcblx0XHRcdCRmcy5yZW1vdmVTeW5jKGNhY2hlRGlyZWN0b3J5KVxuXG5cdFx0QGNyZWF0ZUFzZG9jQnVpbGRDb21tYW5kIGNhY2hlRGlyZWN0b3J5LCAoY29tbWFuZCkgLT5cblx0XHRcdGV4ZWMoY29tbWFuZCkucnVuKGNhbGxiYWNrKVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIHJlYWQgYXNkb2Mgc291cmNlICh0b3BsZXZlbC54bWwpXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0cmVhZEFzZG9jRGF0YVhNTDogKGNhbGxiYWNrKSA9PlxuXHRcdHBhcnNlciA9IG5ldyB4bWwyanMuUGFyc2VyKClcblx0XHRwYXJzZXIucGFyc2VTdHJpbmcgJGZzLnJlYWRGaWxlU3luYygkcGF0aC5qb2luKEBjYWNoZURpcmVjdG9yeU5hbWUsICd0b3BsZXZlbC54bWwnKSksIChlcnIsIGRhdGEpID0+XG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgZGF0YS5hc2RvY1xuXHRcdFx0XHRjb25zb2xlLmxvZygnYXNkb2MgeG1sIDonLCBuYW1lKVxuXG5cdFx0XHRpbnRlcmZhY2VSZWMgPSBkYXRhLmFzZG9jLmludGVyZmFjZVJlY1xuXHRcdFx0Y2xhc3NSZWMgPSBkYXRhLmFzZG9jLmNsYXNzUmVjXG5cdFx0XHRtZXRob2QgPSBkYXRhLmFzZG9jLm1ldGhvZFxuXHRcdFx0ZmllbGQgPSBkYXRhLmFzZG9jLmZpZWxkXG5cdFx0XHRwYWNrYWdlUmVjID0gZGF0YS5hc2RvYy5wYWNrYWdlUmVjXG5cblx0XHRcdEByZWFkQXNkb2NJbnRlcmZhY2VSZWMoaW50ZXJmYWNlUmVjKVxuXHRcdFx0QHJlYWRBc2RvY0NsYXNzUmVjKGNsYXNzUmVjKVxuXHRcdFx0QHJlYWRBc2RvY01ldGhvZChtZXRob2QpXG5cdFx0XHRAcmVhZEFzZG9jRmllbGQoZmllbGQpXG5cblx0XHRcdGNhbGxiYWNrKClcblxuXHRyZWFkQXNkb2NDbGFzc1JlYzogKGxpc3QpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblxuXHRcdCMgYXR0cnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgbmFtZTpzdHJpbmcgJ0VtYWlsUmVuZGVyZXInLFxuXHRcdCMgZnVsbG5hbWU6c3RyaW5nICdtYWlsZXIudmlld3M6RW1haWxSZW5kZXJlcicsXG5cdFx0IyBzb3VyY2VmaWxlOnN0cmluZyAnL2hvbWUvdWJ1bnR1L3dvcmtzcGFjZS9mbGJ1aWxkL3Rlc3QvcHJvamVjdC9zcmMvbWFpbGVyL3ZpZXdzL0VtYWlsUmVuZGVyZXIubXhtbCcsXG5cdFx0IyBuYW1lc3BhY2U6c3RyaW5nICdtYWlsZXIudmlld3MnLFxuXHRcdCMgYWNjZXNzOnN0cmluZyAncHVibGljJyxcblx0XHQjIGJhc2VjbGFzczpzdHJpbmcgJ3NwYXJrLmNvbXBvbmVudHMuc3VwcG9ydENsYXNzZXM6SXRlbVJlbmRlcmVyJyxcblx0XHQjIGludGVyZmFjZXM6c3RyaW5nICdkb2NTYW1wbGVzOklUZXN0MTtkb2NTYW1wbGVzOklUZXN0MicsXG5cdFx0IyBpc0ZpbmFsOmJvb2xlYW4gJ2ZhbHNlJyxcblx0XHQjIGlzRHluYW1pYzpib29sZWFuICdmYWxzZSdcblx0XHQjIGVsZW1lbnRzIC0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZGVzY3JpcHRpb246YXJyYXk8c3RyaW5nPlxuXHRcdCMgc2VlOmFycmF5PHN0cmluZz5cblx0XHQjIGluY2x1ZGVFeGFtcGxlOmFycmF5PHN0cmluZz5cblx0XHQjIHRocm93czphcnJheTxzdHJpbmc+XG5cdFx0IyBtZXRhZGF0YTphcnJheTxvYmplY3Q+XG5cblx0XHRmb3Igc291cmNlIGluIGxpc3Rcblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGZ1bGxuYW1lID0gYXR0cnNbJ2Z1bGxuYW1lJ11cblx0XHRcdG5hbWVzcGFjZSA9IGF0dHJzWyduYW1lc3BhY2UnXVxuXG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0YXR0cnNbbmFtZV0gPSBAY2xlYXJCbGFuayh2YWx1ZSlcblxuXHRcdFx0YXR0cnNbJ2ludGVyZmFjZXMnXT1Ac2VtaWNvbG9uU3RyaW5nVG9BcnJheShhdHRyc1snaW50ZXJmYWNlcyddKVxuXG5cdFx0XHRpZiBub3Qgc3RvcmUuY2xhc3Nlc1tmdWxsbmFtZV0/XG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbZnVsbG5hbWVdID0gYXR0cnNcblxuXHRcdFx0c3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdID89IHt9XG5cdFx0XHRzdG9yZS5uYW1lc3BhY2VzW25hbWVzcGFjZV1bJ2NsYXNzZXMnXSA/PSBbXVxuXHRcdFx0c3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdWydjbGFzc2VzJ10ucHVzaChmdWxsbmFtZSlcblxuXG5cdHJlYWRBc2RvY0ludGVyZmFjZVJlYzogKGxpc3QpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblxuXHRcdCMgYXR0cnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgbmFtZTogJ0lUZXN0MycsXG5cdFx0IyBmdWxsbmFtZTogJ2RvY1NhbXBsZXM6SVRlc3QzJyxcblx0XHQjIHNvdXJjZWZpbGU6ICcvaG9tZS91YnVudHUvd29ya3NwYWNlL2ZsYnVpbGQvdGVzdC9wcm9qZWN0L3NyYy9kb2NTYW1wbGVzL0lUZXN0My5hcycsXG5cdFx0IyBuYW1lc3BhY2U6ICdkb2NTYW1wbGVzJyxcblx0XHQjIGFjY2VzczogJ3B1YmxpYycsXG5cdFx0IyBiYXNlQ2xhc3NlczogJ2ZsYXNoLmV2ZW50czpJRXZlbnREaXNwYXRjaGVyO2ZsYXNoLmRpc3BsYXk6SUdyYXBoaWNzRGF0YTtkb2NTYW1wbGVzOklUZXN0MScsXG5cdFx0IyBpc0ZpbmFsOiAnZmFsc2UnLFxuXHRcdCMgaXNEeW5hbWljOiAnZmFsc2UnXG5cdFx0IyBlbGVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGRlc2NyaXB0aW9uOmFycmF5PHN0cmluZz5cblx0XHQjIHNlZTphcnJheTxzdHJpbmc+XG5cdFx0IyBpbmNsdWRlRXhhbXBsZTphcnJheTxzdHJpbmc+XG5cdFx0IyB0aHJvd3M6YXJyYXk8c3RyaW5nPlxuXHRcdCMgbWV0YWRhdGE6YXJyYXk8b2JqZWN0PlxuXG5cdFx0Zm9yIHNvdXJjZSBpbiBsaXN0XG5cdFx0XHRhdHRycyA9IHNvdXJjZVsnJCddXG5cdFx0XHRmdWxsbmFtZSA9IGF0dHJzWydmdWxsbmFtZSddXG5cdFx0XHRuYW1lc3BhY2UgPSBhdHRyc1snbmFtZXNwYWNlJ11cblxuXHRcdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHNvdXJjZVxuXHRcdFx0XHRpZiBuYW1lIGlzICckJyB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcdGF0dHJzW25hbWVdID0gQGNsZWFyQmxhbmsodmFsdWUpXG5cblx0XHRcdGF0dHJzWydiYXNlQ2xhc3NlcyddPUBzZW1pY29sb25TdHJpbmdUb0FycmF5KGF0dHJzWydiYXNlQ2xhc3NlcyddKVxuXG5cdFx0XHRpZiBub3Qgc3RvcmUuaW50ZXJmYWNlc1tmdWxsbmFtZV0/XG5cdFx0XHRcdHN0b3JlLmludGVyZmFjZXNbZnVsbG5hbWVdID0gYXR0cnNcblxuXHRcdFx0c3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdID89IHt9XG5cdFx0XHRzdG9yZS5uYW1lc3BhY2VzW25hbWVzcGFjZV1bJ2ludGVyZmFjZXMnXSA/PSBbXVxuXHRcdFx0c3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdWydpbnRlcmZhY2VzJ10ucHVzaChmdWxsbmFtZSlcblx0XHRcdFx0XG5cblx0cmVhZEFzZG9jTWV0aG9kOiAobGlzdCkgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdGlzQWNjZXNzb3IgPSAvXFwvKGdldHxzZXQpJC9cblxuXHRcdHByb3BlcnRpZXMgPSB7fVxuXHRcdG1ldGhvZHMgPSBbXVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGNvbGxlY3QgYWNjZXNzb3IgcHJvcGVydGllcyBhbmQgbWV0aG9kc1xuXHRcdCMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBwcm9wZXJ0aWVzW2Z1bGxuYW1lXVsnZ2V0J3wnc2V0J10gPSBzb3VyY2Vcblx0XHQjIG1ldGhvZHNbZnVsbG5hbWVdID0gc291cmNlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRmb3Igc291cmNlIGluIGxpc3Rcblx0XHRcdGlmIEBpc1ByaXZhdGVGaWVsZChzb3VyY2UpIHRoZW4gY29udGludWVcblx0XHRcdFxuXHRcdFx0YXR0cnMgPSBzb3VyY2VbJyQnXVxuXHRcdFx0ZnVsbG5hbWUgPSBhdHRyc1snZnVsbG5hbWUnXVxuXG5cdFx0XHQjIGFjY2Vzc29yIHByb3BlcnR5XG5cdFx0XHRpZiBpc0FjY2Vzc29yLnRlc3QoZnVsbG5hbWUpXG5cdFx0XHRcdGdldHNldCA9IGZ1bGxuYW1lLnN1YnN0cmluZyhmdWxsbmFtZS5sZW5ndGggLSAzKVxuXHRcdFx0XHRmdWxsbmFtZSA9IGZ1bGxuYW1lLnN1YnN0cmluZygwLCBmdWxsbmFtZS5sZW5ndGggLSA0KVxuXG5cdFx0XHRcdHByb3BlcnRpZXNbZnVsbG5hbWVdID89IHt9XG5cblx0XHRcdFx0aWYgZ2V0c2V0IGlzICdnZXQnXG5cdFx0XHRcdFx0cHJvcGVydGllc1tmdWxsbmFtZV1bJ2dldCddID0gc291cmNlXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRwcm9wZXJ0aWVzW2Z1bGxuYW1lXVsnc2V0J10gPSBzb3VyY2Vcblx0XHRcdFx0IyBtZXRob2Rcblx0XHRcdGVsc2Vcblx0XHRcdFx0bWV0aG9kcy5wdXNoKHNvdXJjZSlcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBwcm9jZXNzIGFjY2Vzc29yIHByb3BlcnRpZXNcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGZvciBmdWxsbmFtZSwgZ2V0c2V0IG9mIHByb3BlcnRpZXNcblx0XHRcdGF0dHJzID0ge31cblx0XHRcdGdldCA9IGdldHNldFsnZ2V0J11cblx0XHRcdHNldCA9IGdldHNldFsnc2V0J11cblxuXHRcdFx0YXJyID0gZnVsbG5hbWUuc3BsaXQoJy8nKVxuXHRcdFx0Y2xhc3NGdWxsTmFtZSA9IGFyclswXVxuXHRcdFx0bmFtZXNwYWNlID0gaWYgY2xhc3NGdWxsTmFtZS5pbmRleE9mKCc6JykgPiAtMSB0aGVuIGNsYXNzRnVsbE5hbWUuc3BsaXQoJzonLCAxKVswXSBlbHNlICcnXG5cdFx0XHR7YWNjZXNzb3IsIHByb3BlcnR5TmFtZX0gPSBAc3BsaXRBY2Nlc3NvcihhcnJbMV0pXG5cdFx0XHRmdWxsbmFtZSA9IFwiI3tjbGFzc0Z1bGxOYW1lfSMje3Byb3BlcnR5TmFtZX1cIlxuXG5cdFx0XHRhdHRyc1snZnVsbG5hbWUnXSA9IGZ1bGxuYW1lXG5cdFx0XHRhdHRyc1snYWNjZXNzb3InXSA9IGlmIGFjY2Vzc29yIGlzIG5hbWVzcGFjZSB0aGVuICdpbnRlcm5hbCcgZWxzZSBhY2Nlc3NvclxuXHRcdFx0YXR0cnNbJ3Byb3BlcnR5VHlwZSddID0gJ2FjY2Vzc29yJ1xuXHRcdFx0YXR0cnNbJ2lzQ29uc3QnXSA9IGZhbHNlXG5cblx0XHRcdGlmIGdldD8gYW5kIHNldD9cblx0XHRcdFx0YXR0cnNbJ3JlYWR3cml0ZSddID0gJ3JlYWR3cml0ZSdcblx0XHRcdGVsc2UgaWYgZ2V0P1xuXHRcdFx0XHRhdHRyc1sncmVhZHdyaXRlJ10gPSAncmVhZG9ubHknXG5cdFx0XHRlbHNlXG5cdFx0XHRcdGF0dHJzWydyZWFkd3JpdGUnXSA9ICd3cml0ZW9ubHknXG5cblx0XHRcdGlmIGdldD9cblx0XHRcdFx0YXR0cnNbJ25hbWUnXSA9IGdldFsnJCddWyduYW1lJ11cblx0XHRcdFx0YXR0cnNbJ3R5cGUnXSA9IGdldFsnJCddWydyZXN1bHRfdHlwZSddXG5cdFx0XHRcdGF0dHJzWydpc1N0YXRpYyddID0gZ2V0WyckJ11bJ2lzU3RhdGljJ11cblxuXHRcdFx0ZWxzZSBpZiBzZXQ/XG5cdFx0XHRcdGF0dHJzWyduYW1lJ10gPSBzZXRbJyQnXVsnbmFtZSddXG5cdFx0XHRcdGF0dHJzWyd0eXBlJ10gPSBzZXRbJyQnXVsncGFyYW1fdHlwZXMnXVxuXHRcdFx0XHRhdHRyc1snaXNTdGF0aWMnXSA9IHNldFsnJCddWydpc1N0YXRpYyddXG5cblx0XHRcdGlmIGdldD9cblx0XHRcdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIGdldFxuXHRcdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0XHRhdHRyc1tuYW1lXSA9IEBjbGVhckJsYW5rKHZhbHVlKVxuXG5cdFx0XHRpZiBzZXQ/XG5cdFx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzZXRcblx0XHRcdFx0XHRpZiBuYW1lIGlzICckJyB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcdFx0YXR0cnNbbmFtZV0gPSBAam9pblByb3BlcnRpZXMoYXR0cnNbbmFtZV0sIEBjbGVhckJsYW5rKHZhbHVlKSlcblxuXHRcdFx0aWYgc3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXT9cblx0XHRcdFx0c3RvcmUucHJvcGVydGllc1tmdWxsbmFtZV0gPSBhdHRyc1xuXHRcdFx0XHRzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdWydwcm9wZXJ0aWVzJ10gPz0gW11cblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXVsncHJvcGVydGllcyddLnB1c2goYXR0cnNbJ25hbWUnXSlcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBwcm9jZXNzIG1ldGhvZHNcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGZvciBzb3VyY2UgaW4gbWV0aG9kc1xuXHRcdFx0YXR0cnMgPSBzb3VyY2VbJyQnXVxuXHRcdFx0YXJyID0gYXR0cnNbJ2Z1bGxuYW1lJ10uc3BsaXQoJy8nKVxuXHRcdFx0Y2xhc3NGdWxsTmFtZSA9IGFyclswXVxuXHRcdFx0bmFtZXNwYWNlID0gaWYgY2xhc3NGdWxsTmFtZS5pbmRleE9mKCc6JykgPiAtMSB0aGVuIGNsYXNzRnVsbE5hbWUuc3BsaXQoJzonLCAxKVswXSBlbHNlICcnXG5cdFx0XHR7YWNjZXNzb3IsIHByb3BlcnR5TmFtZX0gPSBAc3BsaXRBY2Nlc3NvcihhcnJbMV0pXG5cdFx0XHRmdWxsbmFtZSA9IFwiI3tjbGFzc0Z1bGxOYW1lfSMje3Byb3BlcnR5TmFtZX0oKVwiXG5cdFx0XHRcblx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRhdHRyc1tuYW1lXSA9IEBjbGVhckJsYW5rKHZhbHVlKVxuXG5cdFx0XHRhdHRyc1snZnVsbG5hbWUnXSA9IGZ1bGxuYW1lXG5cdFx0XHRhdHRyc1snYXNzZXNzb3InXSA9IGlmIGFjY2Vzc29yIGlzIG5hbWVzcGFjZSB0aGVuICdpbnRlcm5hbCcgZWxzZSBhY2Nlc3NvclxuXHRcdFx0XG5cdFx0XHRpZiBhdHRyc1sncGFyYW1fbmFtZXMnXT9cblx0XHRcdFx0cGFyYW1fbmFtZXMgPSBhdHRyc1sncGFyYW1fbmFtZXMnXS5zcGxpdCgnOycpXG5cdFx0XHRcdHBhcmFtX3R5cGVzID0gYXR0cnNbJ3BhcmFtX3R5cGVzJ10uc3BsaXQoJzsnKVxuXHRcdFx0XHRwYXJhbV9kZWZhdWx0cyA9IGF0dHJzWydwYXJhbV9kZWZhdWx0cyddLnNwbGl0KCc7Jylcblx0XHRcdFx0cGFyYW1zID0gW11cblx0XHRcdFx0XG5cdFx0XHRcdGZvciBpIGluIFswLi5wYXJhbV9uYW1lcy5sZW5ndGggLSAxXVxuXHRcdFx0XHRcdHBhcmFtID0ge31cblx0XHRcdFx0XHRwYXJhbVsnbmFtZSddID0gcGFyYW1fbmFtZXNbaV1cblx0XHRcdFx0XHRwYXJhbVsndHlwZSddID0gcGFyYW1fdHlwZXNbaV1cblx0XHRcdFx0XHRwYXJhbVsnZGVmYXVsdCddID0gcGFyYW1fZGVmYXVsdHNbaV1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiBhdHRyc1sncGFyYW0nXT8gYW5kIGF0dHJzWydwYXJhbSddW2ldP1xuXHRcdFx0XHRcdFx0cGFyYW1bJ2Rlc2NyaXB0aW9uJ10gPSBhdHRyc1sncGFyYW0nXVtpXVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0cGFyYW1zLnB1c2gocGFyYW0pXG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0YXR0cnNbJ3BhcmFtcyddID0gcGFyYW1zXG5cblx0XHRcdGlmIHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV0/XG5cdFx0XHRcdHN0b3JlLm1ldGhvZHNbZnVsbG5hbWVdID0gYXR0cnNcblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXVsnbWV0aG9kcyddID89IFtdXG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV1bJ21ldGhvZHMnXS5wdXNoKFwiI3thdHRyc1snbmFtZSddfSgpXCIpXG5cblxuXHRyZWFkQXNkb2NGaWVsZDogKGxpc3QpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblxuXHRcdCMgYXR0cnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgbmFtZTogJ3Rlc3RQcm9wJyxcblx0XHQjIGZ1bGxuYW1lOiAnZG9jU2FtcGxlczpUZXN0MS90ZXN0UHJvcCcsXG5cdFx0IyB0eXBlOiAnU3RyaW5nJyxcblx0XHQjIGlzU3RhdGljOiAnZmFsc2UnLFxuXHRcdCMgaXNDb25zdDogJ2ZhbHNlJ1xuXHRcdCMgZWxlbWVudHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZGVzY3JpcHRpb246YXJyYXk8c3RyaW5nPlxuXHRcdCMgbWV0YWRhdGE6YXJyYXk8b2JqZWN0PlxuXG5cdFx0Zm9yIHNvdXJjZSBpbiBsaXN0XG5cdFx0XHRpZiBAaXNQcml2YXRlRmllbGQoc291cmNlKSB0aGVuIGNvbnRpbnVlXG5cblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGFyciA9IGF0dHJzWydmdWxsbmFtZSddLnNwbGl0KCcvJylcblx0XHRcdGNsYXNzRnVsbE5hbWUgPSBhcnJbMF1cblx0XHRcdG5hbWVzcGFjZSA9IGlmIGNsYXNzRnVsbE5hbWUuaW5kZXhPZignOicpID4gLTEgdGhlbiBjbGFzc0Z1bGxOYW1lLnNwbGl0KCc6JywgMSlbMF0gZWxzZSAnJ1xuXHRcdFx0e2FjY2Vzc29yLCBwcm9wZXJ0eU5hbWV9ID0gQHNwbGl0QWNjZXNzb3IoYXJyWzFdKVxuXHRcdFx0ZnVsbG5hbWUgPSBcIiN7Y2xhc3NGdWxsTmFtZX0jI3twcm9wZXJ0eU5hbWV9XCJcblxuXHRcdFx0I2NvbnNvbGUubG9nKGF0dHJzWydmdWxsbmFtZSddLCBuYW1lc3BhY2UpXG5cblx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRhdHRyc1tuYW1lXSA9IEBjbGVhckJsYW5rKHZhbHVlKVxuXG5cdFx0XHRhdHRyc1snZnVsbG5hbWUnXSA9IGZ1bGxuYW1lXG5cdFx0XHRhdHRyc1snYWNjZXNzb3InXSA9IGlmIGFjY2Vzc29yIGlzIG5hbWVzcGFjZSB0aGVuICdpbnRlcm5hbCcgZWxzZSBhY2Nlc3NvclxuXG5cdFx0XHRpZiBhdHRyc1snaXNDb25zdCddLnRvU3RyaW5nKCkgaXMgJ3RydWUnXG5cdFx0XHRcdGF0dHJzWydwcm9wZXJ0eVR5cGUnXSA9ICdjb25zdGFudCdcblx0XHRcdFx0YXR0cnNbJ3JlYWR3cml0ZSddID0gJ3JlYWRvbmx5J1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRhdHRyc1sncHJvcGVydHlUeXBlJ10gPSAndmFyaWFibGUnXG5cdFx0XHRcdGF0dHJzWydyZWFkd3JpdGUnXSA9ICdyZWFkd3JpdGUnXG5cblx0XHRcdCNjb25zb2xlLmxvZyhhdHRycylcblxuXHRcdFx0aWYgc3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXT9cblx0XHRcdFx0c3RvcmUucHJvcGVydGllc1tmdWxsbmFtZV0gPSBhdHRyc1xuXHRcdFx0XHRzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdWydwcm9wZXJ0aWVzJ10gPz0gW11cblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXVsncHJvcGVydGllcyddLnB1c2goYXR0cnNbJ25hbWUnXSlcblxuXG5cdCMgbnNfaW50ZXJuYWw6KlxuXHQjIHByb3RlY3RlZDoqXG5cdCMgcHJpdmF0ZToqXG5cdCMgbmFtZS5zcGFjZToqXG5cdCMgKlxuXHQjIEByZXR1cm4geyBhY2Nlc3NvciA6ICdwdWJsaWMnLCBwcm9wZXJ0eU5hbWUgOiAnKicgfVxuXHRzcGxpdEFjY2Vzc29yOiAobmFtZSkgLT5cblx0XHRhY2Nlc3NvckluZGV4ID0gbmFtZS5pbmRleE9mKCc6Jylcblx0XHRpZiBhY2Nlc3NvckluZGV4ID4gLTFcblx0XHRcdGFjY2Vzc29yID0gbmFtZS5zdWJzdHJpbmcoMCwgYWNjZXNzb3JJbmRleClcblx0XHRcdHByb3BlcnR5TmFtZSA9IG5hbWUuc3Vic3RyaW5nKGFjY2Vzc29ySW5kZXggKyAxKVxuXHRcdGVsc2Vcblx0XHRcdGFjY2Vzc29yID0gJ3B1YmxpYydcblx0XHRcdHByb3BlcnR5TmFtZSA9IG5hbWVcblxuXHRcdHJldHVybiB7IGFjY2Vzc29yIDogYWNjZXNzb3IsIHByb3BlcnR5TmFtZSA6IHByb3BlcnR5TmFtZSB9XG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIEAgcmVhZCBDbGFzcy55YW1sXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0cmVhZENsYXNzWWFtbDogKGNhbGxiYWNrKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0XG5cdFx0YXJyID0gW11cblx0XHRcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc3RvcmUuY2xhc3Nlc1xuXHRcdFx0YXJyLnB1c2godmFsdWUpXG5cdFx0XHRcblx0XHRmb3IgbmFtZSwgdmxhdWUgb2Ygc3RvcmUuaW50ZXJmYWNlc1xuXHRcdFx0YXJyLnB1c2godmFsdWUpXG5cdFx0XG5cdFx0YXN5bmMuZWFjaFNlcmllcyhhcnIsIEByZWFkQ2xhc3NZYW1sVGFza0Z1bmN0aW9uLCBjYWxsYmFjaylcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIHRhc2sgZnVuY3Rpb25cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0cmVhZENsYXNzWWFtbFRhc2tGdW5jdGlvbjogKHR5cGVJbmZvLCBjYWxsYmFjaykgPT5cblx0XHRzb3VyY2VmaWxlID0gdHlwZUluZm9bJ3NvdXJjZWZpbGUnXVxuXHRcdHlhbWxQYXRoID0gc291cmNlZmlsZS5yZXBsYWNlKCRwYXRoLmV4dG5hbWUoc291cmNlZmlsZSksICcueWFtbCcpXG5cdFx0XG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgY2FuY2VsIHRhc2sgaWYgbm90IGV4aXN0cyB5YW1sIGZpbGVcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0aWYgbm90ICRmcy5leGlzdHNTeW5jKHlhbWxQYXRoKVxuXHRcdFx0Y2FsbGJhY2soKVxuXHRcdFx0cmV0dXJuXG5cblx0XHRzb3VyY2UgPSB5YW1sLnNhZmVMb2FkKCRmcy5yZWFkRmlsZVN5bmMoeWFtbFBhdGgsIHtlbmNvZGluZzondXRmOCd9KSlcblx0XHRcblx0XHR0eXBlRnVsbE5hbWUgPSB0eXBlSW5mb1snZnVsbG5hbWUnXVxuXHRcdFxuXHRcdG1ldGhvZE5hbWVSZWcgPSAvW2EtekEtWjAtOVxcX10rXFwoXFwpL1xuXHRcdFxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdGlmIG5hbWUgaXMgJ2NsYXNzJyBvciBuYW1lIGlzICdpbnRlcmZhY2UnXG5cdFx0XHRcdEBqb2luQ2xhc3NZYW1sQ2xhc3NJbmZvKHR5cGVJbmZvLCB2YWx1ZSlcblx0XHRcdFx0XG5cdFx0XHRlbHNlIGlmIG1ldGhvZE5hbWVSZWcudGVzdChuYW1lKVxuXHRcdFx0XHRtZXRob2RJbmZvID0gQHN0b3JlLm1ldGhvZHNbXCIje3R5cGVGdWxsTmFtZX0jI3tuYW1lfVwiXVxuXHRcdFx0XHRpZiBtZXRob2RJbmZvPyB0aGVuIEBqb2luQ2xhc3NZYW1sTWV0aG9kSW5mbyhtZXRob2RJbmZvLCB2YWx1ZSlcblx0XHRcdFx0XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHByb3BlcnR5SW5mbyA9IEBzdG9yZS5wcm9wZXJ0aWVzW1wiI3t0eXBlRnVsbE5hbWV9IyN7bmFtZX1cIl1cblx0XHRcdFx0aWYgcHJvcGVydHlJbmZvPyB0aGVuIEBqb2luQ2xhc3NZYW1sRmllbGRJbmZvKHByb3BlcnR5SW5mbywgdmFsdWUpXG5cdFx0XG5cdFx0Y2FsbGJhY2soKVxuXHRcdFxuXHRcdFxuXHRqb2luQ2xhc3NZYW1sQ2xhc3NJbmZvOiAob3JpZ2luLCBzb3VyY2UpID0+XG5cdFx0YXZhbGFibGVQcm9wZXJ0aWVzID0gXG5cdFx0XHRkZXNjcmlwdGlvbjogdHJ1ZVxuXHRcdFx0c2VlOiB0cnVlXG5cdFx0XHR0aHJvd3M6IHRydWVcblx0XHRcdGluY2x1ZGVFeGFtcGxlOiB0cnVlXG5cdFx0XG5cdFx0QGpvaW5JbmZvKG9yaWdpbiwgc291cmNlLCBhdmFsYWJsZVByb3BlcnRpZXMpXG5cdFx0XG5cdGpvaW5DbGFzc1lhbWxGaWVsZEluZm86IChvcmlnaW4sIHNvdXJjZSkgPT5cblx0XHRhdmFsYWJsZVByb3BlcnRpZXMgPSBcblx0XHRcdGRlc2NyaXB0aW9uOiB0cnVlXG5cdFx0XHRzZWU6IHRydWVcblx0XHRcdHRocm93czogdHJ1ZVxuXHRcdFx0aW5jbHVkZUV4YW1wbGU6IHRydWVcblx0XHRcblx0XHRAam9pbkluZm8ob3JpZ2luLCBzb3VyY2UsIGF2YWxhYmxlUHJvcGVydGllcylcblx0XHRcblx0am9pbkNsYXNzWWFtbE1ldGhvZEluZm86IChvcmlnaW4sIHNvdXJjZSkgPT5cblx0XHRhdmFsYWJsZVByb3BlcnRpZXMgPSBcblx0XHRcdGRlc2NyaXB0aW9uOiB0cnVlXG5cdFx0XHRzZWU6IHRydWVcblx0XHRcdHRocm93czogdHJ1ZVxuXHRcdFx0aW5jbHVkZUV4YW1wbGU6IHRydWVcblx0XHRcdCdyZXR1cm4nOiB0cnVlXG5cdFx0XG5cdFx0QGpvaW5JbmZvKG9yaWdpbiwgc291cmNlLCBhdmFsYWJsZVByb3BlcnRpZXMpXG5cdFx0XG5cdGpvaW5JbmZvOiAob3JpZ2luLCBzb3VyY2UsIGF2YWxhYmxlUHJvcGVydGllcykgPT5cblx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRpZiBhdmFsYWJsZVByb3BlcnRpZXNbbmFtZV0gaXMgdHJ1ZVxuXHRcdFx0XHRvcmlnaW5bbmFtZV0gPSBAam9pblByb3BlcnRpZXMob3JpZ2luW25hbWVdLCBAY2xlYXJCbGFuayhzb3VyY2VbbmFtZV0pLCB0cnVlKVxuXHRcdFxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIHJlYWQgbmFtZXNwYWNlLnlhbWxcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRyZWFkTmFtZXNwYWNlWWFtbDogKGNhbGxiYWNrKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0c291cmNlRGlyZWN0b3JpZXMgPSBAY29sbGVjdG9yLmdldFNvdXJjZURpcmVjdG9yaWVzKClcblx0XHRuYW1lc3BhY2VJbmZvcyA9IFtdXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBuYW1lc3BhY2VJbmZvID0gc3RvcmUubmFtZXNwYWNlICogc291cmNlIGRpcmVjdG9yaWVzXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGZvciBuYW1lc3BhY2UsIHZhbHVlcyBvZiBzdG9yZS5uYW1lc3BhY2VzXG5cdFx0XHRuYW1lc3BhY2VQYXRoID0gbmFtZXNwYWNlLnNwbGl0KCcuJykuam9pbigkcGF0aC5zZXApXG5cblx0XHRcdGZvciBzb3VyY2VEaXJlY3RvcnkgaW4gc291cmNlRGlyZWN0b3JpZXNcblx0XHRcdFx0eWFtbFBhdGggPSAkcGF0aC5qb2luKHNvdXJjZURpcmVjdG9yeSwgbmFtZXNwYWNlUGF0aCwgJ25hbWVzcGFjZS55YW1sJylcblxuXHRcdFx0XHQjIGFkZCBuYW1lc3BhY2VJbmZvc1xuXHRcdFx0XHRuYW1lc3BhY2VJbmZvcy5wdXNoXG5cdFx0XHRcdFx0eWFtbFBhdGg6IHlhbWxQYXRoXG5cdFx0XHRcdFx0bmFtZXNwYWNlOiBuYW1lc3BhY2Vcblx0XHRcdFx0XHR2YWx1ZXM6IHZhbHVlc1xuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZWFjaCBuYW1lc3BhY2VJbmZvc1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRhc3luYy5lYWNoU2VyaWVzKG5hbWVzcGFjZUluZm9zLCBAcmVhZE5hbWVzcGFjZVlhbWxUYXNrRnVuY3Rpb24sIGNhbGxiYWNrKVxuXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgdGFzayBmdW5jdGlvblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRyZWFkTmFtZXNwYWNlWWFtbFRhc2tGdW5jdGlvbjogKG5hbWVzcGFjZUluZm8sIGNhbGxiYWNrKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0eWFtbFBhdGggPSBuYW1lc3BhY2VJbmZvWyd5YW1sUGF0aCddXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBjYW5jZWwgdGFzayBpZiBub3QgZXhpc3RzIHlhbWwgZmlsZVxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRpZiBub3QgJGZzLmV4aXN0c1N5bmMoeWFtbFBhdGgpXG5cdFx0XHRjYWxsYmFjaygpXG5cdFx0XHRyZXR1cm5cblxuXG5cdFx0dmFsdWVzID0gbmFtZXNwYWNlSW5mb1sndmFsdWVzJ11cblx0XHRuYW1lc3BhY2UgPSBuYW1lc3BhY2VJbmZvWyduYW1lc3BhY2UnXVxuXHRcdHNvdXJjZSA9IHlhbWwuc2FmZUxvYWQoJGZzLnJlYWRGaWxlU3luYyh5YW1sUGF0aCwge2VuY29kaW5nOid1dGY4J30pKVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgcmVhZCBtYW5pZmVzdCBzcGVjXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGlmIHNvdXJjZVsnbmFtZXNwYWNlJ10/IGFuZCBzb3VyY2VbJ2NvbXBvbmVudHMnXT8gYW5kIHNvdXJjZVsnY29tcG9uZW50cyddLmxlbmd0aCA+IDBcblx0XHRcdCMgY29udmVydCBjbGFzc25hbWUgdG8gZnVsbG5hbWUgaWYgZXhpc3RzIG5hbWVzcGFjZVxuXHRcdFx0IyBDb21wb25lbnQgLS0+IG5hbWUuc3BhY2U6Q29tcG9uZW50XG5cdFx0XHRpZiBuYW1lc3BhY2UgaXNudCAnJ1xuXHRcdFx0XHRuZXdDb21wb25lbnRzID0gW11cblx0XHRcdFx0Zm9yIGNvbXBvbmVudCBpbiBzb3VyY2VbJ2NvbXBvbmVudHMnXVxuXHRcdFx0XHRcdG5ld0NvbXBvbmVudHMucHVzaChuYW1lc3BhY2UgKyAnOicgKyBjb21wb25lbnQpXG5cdFx0XHRcdHNvdXJjZVsnY29tcG9uZW50cyddID0gbmV3Q29tcG9uZW50c1xuXG5cdFx0XHQjIG1hbmlmZXN0TmFtZXNwYWNlID0gJ2h0dHA6Ly9ucy5jb20vbnMnXG5cdFx0XHRtYW5pZmVzdE5hbWVzcGFjZSA9IEBjbGVhckJsYW5rKHNvdXJjZVsnbmFtZXNwYWNlJ10pXG5cblx0XHRcdCMgY3JlYXRlIG1hbmlmZXN0IG9iamVjdCBpZiBub3QgZXhpc3RzXG5cdFx0XHRzdG9yZS5tYW5pZmVzdHNbbWFuaWZlc3ROYW1lc3BhY2VdID89IHt9XG5cdFx0XHRtYW5pZmVzdCA9IHN0b3JlLm1hbmlmZXN0c1ttYW5pZmVzdE5hbWVzcGFjZV1cblxuXHRcdFx0IyBzYXZlIG1hbmlmZXN0IGNvbXBvbmVudHNcblx0XHRcdCMgc290cmUubWFuaWZlc3RzWydodHRwOi8vbnMuY29tL25zJ11bJ2NvbXBvbmVudHMnXSA9ICduYW1lLnNwYWNlOkNvbXBvbmVudCdcblx0XHRcdG1hbmlmZXN0Wydjb21wb25lbnRzJ10gPz0gW11cblxuXHRcdFx0Zm9yIGNvbXBvbmVudCBpbiBzb3VyY2VbJ2NvbXBvbmVudHMnXVxuXHRcdFx0XHRtYW5pZmVzdFsnY29tcG9uZW50cyddLnB1c2goQGNsZWFyQmxhbmsoY29tcG9uZW50KSlcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIHNhdmUgbmFtZXNwYWNlLnlhbWwgdmFsdWVzIHRvIG5hbWVzcGFjZSBpbmZvXG5cdFx0IyBzdG9yZS5uYW1lc3BhY2VzWyduYW1lLnNwYWNlJ11bbmFtZV0gPSB2YWx1ZVxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHR2YWx1ZXNbJ2Rlc2NyaXB0aW9uJ10gPSBAam9pblByb3BlcnRpZXModmFsdWVzWydkZXNjcmlwdGlvbiddLCBzb3VyY2VbJ2Rlc2NyaXB0aW9uJ10pXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBlbmQgdGFza1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRjYWxsYmFjaygpXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIHV0aWxzXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyB0b3BsZXZlbC54bWwgdXRpbHNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0aXNQcml2YXRlRmllbGQ6IChzb3VyY2UpIC0+XG5cdFx0cmV0dXJuIHNvdXJjZVsnJCddWydmdWxsbmFtZSddLmluZGV4T2YoJy9wcml2YXRlOicpID4gLTEgb3Igc291cmNlWydwcml2YXRlJ10/XG5cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBiYXNpYyB1dGlsc1xuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIHJlbW92ZSBhbGwgZnJvbnQgYW5kIGJhY2sgc3BhY2UgY2hhcmFjdGVyIG9mIHN0cmluZ1xuXHRjbGVhckJsYW5rOiAob2JqKSAtPlxuXHRcdHJlZ2V4cCA9IC9eXFxzKnxcXHMqJC9nXG5cdFx0XG5cdFx0aWYgdHlwZW9mIG9iaiBpcyAnc3RyaW5nJ1xuXHRcdFx0cmV0dXJuIG9iai5yZXBsYWNlKHJlZ2V4cCwgJycpXG5cdFx0XHRcblx0XHRlbHNlIGlmIG9iaiBpbnN0YW5jZW9mIEFycmF5IGFuZCBvYmoubGVuZ3RoID4gMFxuXHRcdFx0Zm9yIGkgaW4gWzAuLm9iai5sZW5ndGgtMV1cblx0XHRcdFx0aWYgdHlwZW9mIG9ialtpXSBpcyAnc3RyaW5nJ1xuXHRcdFx0XHRcdG9ialtpXSA9IG9ialtpXS5yZXBsYWNlKHJlZ2V4cCwgJycpXG5cdFx0XHRcdFx0XG5cdFx0cmV0dXJuIG9ialxuXG5cdCMgbmFtZS5zcGFjZTpDbGFzczE7bmFtZS5zcGFjZS5DbGFzczIgLS0+IFtuYW1lLnNwYWNlLkNsYXNzMSwgbmFtZS5zcGFjZS5DbGFzczJdXG5cdHNlbWljb2xvblN0cmluZ1RvQXJyYXk6IChzdHIpIC0+XG5cdFx0aWYgc3RyPyBvciBzdHIgaXMgJydcblx0XHRcdHN0ci5zcGxpdCgnOycpXG5cdFx0ZWxzZVxuXHRcdFx0JydcblxuXHRqb2luUHJvcGVydGllczogKHByaW1hcnksIHNlY29uZGFyeSwgb3ZlcnJpZGVUb1NlY29uZGFyeSA9IGZhbHNlKSAtPlxuXHRcdGlmIHByaW1hcnk/IGFuZCBzZWNvbmRhcnk/IGFuZCBwcmltYXJ5IGluc3RhbmNlb2YgQXJyYXlcblx0XHRcdGlmIHNlY29uZGFyeSBpbnN0YW5jZW9mIEFycmF5XG5cdFx0XHRcdHJldHVybiBwcmltYXJ5LmNvbmNhdChzZWNvbmRhcnkpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHByaW1hcnkucHVzaChzZWNvbmRhcnkpXG5cdFx0XHRcdHJldHVybiBwcmltYXJ5XG5cdFx0ZWxzZSBpZiBwcmltYXJ5PyBhbmQgc2Vjb25kYXJ5P1xuXHRcdFx0cmV0dXJuIGlmIG92ZXJyaWRlVG9TZWNvbmRhcnkgdGhlbiBzZWNvbmRhcnkgZWxzZSBwcmltYXJ5XG5cdFx0ZWxzZSBpZiBub3QgcHJpbWFyeT8gYW5kIHNlY29uZGFyeT9cblx0XHRcdHJldHVybiBzZWNvbmRhcnlcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gcHJpbWFyeVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBkZWJ1ZyA6IHRyYWNlIHN0b3JlIG9iamVjdFxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdHByaW50U3RvcmU6ICgpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRcblx0XHRpbnRlcmZhY2VzID0gc3RvcmUuaW50ZXJmYWNlc1xuXHRcdGNsYXNzZXMgPSBzdG9yZS5jbGFzc2VzXG5cdFx0bmFtZXNwYWNlcyA9IHN0b3JlLm5hbWVzcGFjZXNcblx0XHRtZXRob2RzID0gc3RvcmUubWV0aG9kc1xuXHRcdHByb3BlcnRpZXMgPSBzdG9yZS5wcm9wZXJ0aWVzXG5cdFx0bWFuaWZlc3RzID0gc3RvcmUubWFuaWZlc3RzXG5cdFxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IG5hbWVzcGFjZXMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBuYW1lc3BhY2VzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBpbnRlcmZhY2VzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgaW50ZXJmYWNlc1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogY2xhc3NlcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIGNsYXNzZXNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IG1ldGhvZHMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBtZXRob2RzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBwcm9wZXJ0aWVzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgcHJvcGVydGllc1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogbWFuaWZlc3RzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgbWFuaWZlc3RzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cdFx0XHRcblx0XG5cdFx0XG5cdHByaW50RmllbGRzIDogKCkgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdFxuXHRcdHByaW50ID0gKGNvbGxlY3Rpb24pIC0+XG5cdFx0XHRmaWVsZHMgPSB7fVxuXHRcdFx0XG5cdFx0XHRmb3IgY29sbGVjdGlvbk5hbWUsIGNvbGxlY3Rpb25WYWx1ZSBvZiBjb2xsZWN0aW9uXG5cdFx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBjb2xsZWN0aW9uVmFsdWVcblx0XHRcdFx0XHRmaWVsZHNbbmFtZV0gPSB0eXBlb2YgdmFsdWUgaWYgbm90IGZpZWxkc1tuYW1lXT9cblx0XHRcdFx0XHRcblx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBmaWVsZHNcblx0XHRcdFx0Y29uc29sZS5sb2cobmFtZSwgJzonLCB2YWx1ZSlcblx0XHRcdFx0XG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogZmllbGQgaW5mb3MnKVxuXHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLSA6IG5hbWVzcGFjZSBmaWVsZHMnKVxuXHRcdHByaW50KHN0b3JlLm5hbWVzcGFjZXMpXG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tIDogaW50ZXJmYWNlIGZpZWxkcycpXG5cdFx0cHJpbnQoc3RvcmUuaW50ZXJmYWNlcylcblx0XHRcblx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0gOiBjbGFzcyBmaWVsZHMnKVxuXHRcdHByaW50KHN0b3JlLmNsYXNzZXMpXG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tIDogbWV0aG9kIGZpZWxkcycpXG5cdFx0cHJpbnQoc3RvcmUubWV0aG9kcylcblx0XHRcblx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0gOiBwcm9wZXJ0eSBmaWVsZHMnKVxuXHRcdHByaW50KHN0b3JlLnByb3BlcnRpZXMpXG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tIDogbWFuaWZlc3QgZmllbGRzJylcblx0XHRwcmludChzdG9yZS5tYW5pZmVzdHMpXG5cbiMgY29tcGxldGUgPSBgZnVuY3Rpb24oZXJyb3IsIGRpYylgXG4jIGRpY1tuYW1lLnNwYWNlLkNsYXNzXVx0W3Byb3BlcnR5XVx0XHQ9IGh0dHA6Ly9+L25hbWUvc3BhY2UvQ2xhc3MuaHRtbCNwcm9wZXJ0eVxuIyBkaWNbbmFtZS5zcGFjZS5DbGFzc11cdFttZXRob2QoKV1cdFx0PSBodHRwOi8vfi9uYW1lL3NwYWNlL0NsYXNzLmh0bWwjbWV0aG9kKClcbiMgZGljW25hbWUuc3BhY2VdXHRcdFttZXRob2QoKV1cdFx0PSBodHRwOi8vfi9uYW1lL3NwYWNlLyNtZXRob2QoKSA/Pz9cbiMgZGljW25hbWUuc3BhY2UuQ2xhc3NdXHRbc3R5bGU6bmFtZV1cdD0gaHR0cDovL34vbmFtZS9zcGFjZS9DbGFzcy5odG1sI3N0eWxlOm5hbWVcbiMgZ2V0QXNkb2NJbmRleDogKHVybCwgY29tcGxldGUpIC0+XG4jIGh0dHA6Ly9oZWxwLmFkb2JlLmNvbS9rb19LUi9GbGFzaFBsYXRmb3JtL3JlZmVyZW5jZS9hY3Rpb25zY3JpcHQvMy9hbGwtaW5kZXgtQS5odG1sXG4jIGh0dHA6Ly9mbGV4LmFwYWNoZS5vcmcvYXNkb2MvYWxsLWluZGV4LUIuaHRtbFxuXG5cblxuIyBnZXQgYWxsLWluZGV4LUEgfiBaXG4jIHBhcnNlIGFuZCBmaW5kIGNsYXNzPVwiaWR4cm93XCJcbiMgZGljWy4uXVsuLl0gPSB1cmxcbiMgY29tcGxldGUoZXJyb3IsIGRpYylcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gRmxkb2MiXX0=