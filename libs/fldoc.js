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

    Fldoc.prototype.create = function(outputDirectory, complete) {
      var tasks;
      this.outputDirectory = outputDirectory;
      this.store = {
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
      var json;
      json = JSON.stringify(this.store, null, '\t');
      return $fs.writeFile('store.json', json, {
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

//# sourceMappingURL=data:application/json;base64,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QSxPQUFPLENBQUMsR0FBUixDQUFZLCtCQUFaLENBNUJBLENBQUE7YUE2QkEsS0FBQSxDQUFNLEtBQUssQ0FBQyxTQUFaLEVBOUJhO0lBQUEsQ0FqMEJkLENBQUE7O2lCQUFBOztNQWJELENBQUE7O0FBQUEsRUFnNEJBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLEtBaDRCakIsQ0FBQTtBQUFBIiwiZmlsZSI6ImZsZG9jLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiJGZzID0gcmVxdWlyZSgnZnMtZXh0cmEnKVxuJHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKVxucGljayA9IHJlcXVpcmUoJ2ZpbGUtcGlja2VyJykucGlja1xuZXhlYyA9IHJlcXVpcmUoJ2RvbmUtZXhlYycpXG57U291cmNlQ29sbGVjdG9yfSA9IHJlcXVpcmUoJy4vZmx1dGlscycpXG54bWwyanMgPSByZXF1aXJlKCd4bWwyanMnKVxueWFtbCA9IHJlcXVpcmUoJ2pzLXlhbWwnKVxubWFya2VkID0gcmVxdWlyZSgnbWFya2VkJylcbmNoZWVyaW8gPSByZXF1aXJlKCdjaGVlcmlvJylcbnJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0JylcblxuY2xhc3MgRmxkb2Ncblx0Y29uc3RydWN0b3I6IChAYnVpbGQpIC0+XG5cdFx0QGNvbGxlY3RvciA9IG5ldyBTb3VyY2VDb2xsZWN0b3IoQGJ1aWxkKVxuXHRcdEBleHRlcm5hbEFzZG9jcyA9IFtdXG5cdFx0QGV4dGVybmFsRmxkb2NzID0gW11cblx0XHRAYWRvYmVBc2RvYyA9ICdodHRwOi8vaGVscC5hZG9iZS5jb20va29fS1IvRmxhc2hQbGF0Zm9ybS9yZWZlcmVuY2UvYWN0aW9uc2NyaXB0LzMvJ1xuXHRcdEBhcGFjaGVGbGV4QXNkb2MgPSAnaHR0cDovL2ZsZXguYXBhY2hlLm9yZy9hc2RvYy8nXG5cblx0XHQjIHNvdXJjZSA+IGV4dGVybmFsRmxkb2NzID4gZXh0ZXJuYWxBc2RvY3MgPiBhcGFjaGVGbGV4QXNkb2MgPiBhZG9iZUFzZG9jXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIHNldHRpbmdcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIGV4dGVybmFsIGRvY3VtZW50IHNvdXJjZXNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0cmVmcmVzaEV4dGVybmFsQXNkb2NDYWNoZTogKCkgPT5cblx0XHRAcmVtb3ZlRXh0ZXJuYWxBc2RvY0NhY2hlID0gdHJ1ZVxuXHRcblx0c2V0QWRvYmVBc2RvYzogKHVybCkgPT5cblx0XHRAYWRvYmVBc2RvYyA9IHVybFxuXG5cdHNldEFwYWNoZUZsZXhBc2RvYzogKHVybCkgPT5cblx0XHRAYXBhY2hlRmxleEFzZG9jID0gdXJsXG5cblx0c2V0RXh0ZXJuYWxBc2RvYzogKHVybCkgPT5cblx0XHRAZXh0ZXJuYWxBc2RvY3MucHVzaCh1cmwpXG5cblx0c2V0RXh0ZXJuYWxGbGRvYzogKHVybCkgPT5cblx0XHRAZXh0ZXJuYWxGbGRvY3MucHVzaCh1cmwpXG5cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBhc2RvYyBmaWx0ZXIgZnVuY3Rpb25cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBAcGFyYW0gZnVuYyBgYm9vbGVhbiBmdW5jdGlvbihmaWxlKWBcblx0c2V0RmlsdGVyRnVuY3Rpb246IChmdW5jKSA9PlxuXHRcdEBmaWx0ZXJGdW5jdGlvbiA9IGZ1bmNcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIGFzZG9jIHNvdXJjZXNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0YWRkTGlicmFyeURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QGNvbGxlY3Rvci5hZGRMaWJyYXJ5RGlyZWN0b3J5KHBhdGgpXG5cblx0YWRkU291cmNlRGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAY29sbGVjdG9yLmFkZFNvdXJjZURpcmVjdG9yeShwYXRoKVxuXG5cdGFkZEFyZzogKGFyZykgPT5cblx0XHRAY29sbGVjdG9yLmFkZEFyZyhhcmcpXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIGNyZWF0ZVxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdGNyZWF0ZTogKEBvdXRwdXREaXJlY3RvcnksIGNvbXBsZXRlKSA9PlxuXHRcdEBzdG9yZSA9XG5cdFx0XHRpbnRlcmZhY2VzOiB7fVxuXHRcdFx0Y2xhc3Nlczoge31cblx0XHRcdG5hbWVzcGFjZXM6IHt9XG5cdFx0XHRtZXRob2RzOiB7fVxuXHRcdFx0cHJvcGVydGllczoge31cblx0XHRcdG1hbmlmZXN0czoge31cblx0XHRcdGV4dGVybmFsOiB7fVxuXG5cdFx0dGFza3MgPSBbXG5cdFx0XHQjQGNyZWF0ZUFzZG9jRGF0YVhNTFxuXHRcdFx0QHJlYWRBc2RvY0RhdGFYTUxcblx0XHRcdEByZWFkTmFtZXNwYWNlWWFtbFxuXHRcdFx0QHJlYWRDbGFzc1lhbWxcblx0XHRcdEBnZXRFeHRlcm5hbEFzZG9jXG5cdFx0XHRAc2F2ZVN0b3JlVG9GaWxlXG5cdFx0XHQjQHByaW50U3RvcmVcblx0XHRcdCNAcHJpbnRGaWVsZHNcblx0XHRdXG5cblx0XHRhc3luYy5zZXJpZXModGFza3MsIGNvbXBsZXRlKVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIHNhdmVcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRzYXZlU3RvcmVUb0ZpbGU6IChjYWxsYmFjaykgPT5cblx0XHRqc29uID0gSlNPTi5zdHJpbmdpZnkoQHN0b3JlLCBudWxsLCAnXFx0Jylcblx0XHQkZnMud3JpdGVGaWxlICdzdG9yZS5qc29uJywganNvbiwge2VuY29kaW5nOid1dGY4J30sIGNhbGxiYWNrXG5cdFx0XG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIGdldCBleHRlcm5hbCBhc2RvYyBsaXN0XG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0ZXh0ZXJuYWxBc2RvY0NhY2hlRGlyZWN0b3J5TmFtZTogJy5leHRlcm5hbF9hc2RvY19jYWNoZSdcblx0XG5cdGNvbnZlcnRVcmxUb0NhY2hlTmFtZTogKHVybCkgLT5cblx0XHR1cmwucmVwbGFjZSgvW15hLXpBLVowLTldL2csICdfJylcblx0XG5cdGdldEV4dGVybmFsQXNkb2M6IChjYWxsYmFjaykgPT5cblx0XHRleHRlcm5hbENhY2hlRGlyZWN0b3J5ID0gJHBhdGgubm9ybWFsaXplKEBleHRlcm5hbEFzZG9jQ2FjaGVEaXJlY3RvcnlOYW1lKVxuXG5cdFx0IyByZW1vdmUgY2FjaGUgZGlyZWN0b3J5IGlmIGV4aXN0c1xuXHRcdGlmIEByZW1vdmVFeHRlcm5hbEFzZG9jQ2FjaGUgYW5kICRmcy5leGlzdHNTeW5jKGV4dGVybmFsQ2FjaGVEaXJlY3RvcnkpXG5cdFx0XHQkZnMucmVtb3ZlU3luYyhleHRlcm5hbENhY2hlRGlyZWN0b3J5KVxuXG5cdFx0IyBjcmVhdGUgY2FjaGUgZGlyZWN0b3J5XG5cdFx0aWYgbm90ICRmcy5leGlzdHNTeW5jKGV4dGVybmFsQ2FjaGVEaXJlY3RvcnkpXG5cdFx0XHQkZnMubWtkaXJTeW5jKGV4dGVybmFsQ2FjaGVEaXJlY3RvcnkpXG5cblx0XHRhc2RvY3MgPSBbQGFkb2JlQXNkb2MsIEBhcGFjaGVGbGV4QXNkb2NdXG5cdFx0YXNkb2NzID0gYXNkb2NzLmNvbmNhdChAZXh0ZXJuYWxBc2RvY3MpIGlmIEBleHRlcm5hbEFzZG9jcz8gYW5kIEBleHRlcm5hbEFzZG9jcy5sZW5ndGggPiAwXG5cdFx0YTJ6ID0gWydBJywgJ0InLCAnQycsICdEJywgJ0UnLCAnRicsICdHJywgJ0gnLCAnSScsICdKJywgJ0snLCAnTCcsICdNJywgJ04nLCAnTycsICdQJywgJ1EnLCAnUicsICdTJywgJ1QnLCAnVScsICdWJywgJ1cnLCAnWCcsICdZJywgJ1onXVxuXHRcdGNoZWNrID0gL1xcLyQvXG5cblx0XHRyZXFzID0gW11cblx0XHRmb3IgYXNkb2MgaW4gYXNkb2NzXG5cdFx0XHRpZiBub3QgY2hlY2sudGVzdChhc2RvYylcblx0XHRcdFx0YXNkb2MgPSBhc2RvYyArICcvJyBcblx0XHRcdFx0XG5cdFx0XHRmb3IgY2hhciBpbiBhMnpcblx0XHRcdFx0dXJsID0gXCIje2FzZG9jfWFsbC1pbmRleC0je2NoYXJ9Lmh0bWxcIlxuXHRcdFx0XHRjYWNoZUZpbGUgPSAkcGF0aC5qb2luKGV4dGVybmFsQ2FjaGVEaXJlY3RvcnksIEBjb252ZXJ0VXJsVG9DYWNoZU5hbWUodXJsKSArICcuanNvbicpXG5cdFx0XHRcdFxuXHRcdFx0XHRyZXFzLnB1c2hcblx0XHRcdFx0XHRjYWNoZTogY2FjaGVGaWxlXG5cdFx0XHRcdFx0YXNkb2M6IGFzZG9jXG5cdFx0XHRcdFx0dXJsOiB1cmxcblx0XHRcblx0XHRhc3luYy5lYWNoU2VyaWVzKHJlcXMsIEBnZXRFeHRlcm5hbEFzZG9jVGFza0Z1bmN0aW9uLCBjYWxsYmFjaylcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIHRhc2sgZnVuY3Rpb25cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0Z2V0RXh0ZXJuYWxBc2RvY1Rhc2tGdW5jdGlvbjogKHJlcSwgY2FsbGJhY2spID0+XG5cdFx0ZXh0ZXJuYWwgPSBAc3RvcmUuZXh0ZXJuYWxcblxuXHRcdCMgcmVnaXN0ZXIgY2FjaGUgb2JqZWN0IChhIGpzb24gY2FjaGUgZmlsZSBjb250ZW50cylcblx0XHRyZWdpc3RlciA9IChjYWNoZSkgLT5cblx0XHRcdGZvciBpdGVtIGluIGNhY2hlXG5cdFx0XHRcdGZ1bGxuYW1lID0gaXRlbVsnZnVsbG5hbWUnXVxuXHRcdFx0XHR1cmwgPSBpdGVtWyd1cmwnXVxuXHRcdFx0XHRleHRlcm5hbFtmdWxsbmFtZV0gPSB1cmxcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBpZiBoYXMgY2FjaGUgZmlsZVxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0aWYgJGZzLmV4aXN0c1N5bmMocmVxLmNhY2hlKVxuXHRcdFx0JGZzLnJlYWRGaWxlIHJlcS5jYWNoZSwge2VuY29kaW5nOid1dGY4J30sIChlcnIsIGRhdGEpIC0+XG5cdFx0XHRcdGlmIG5vdCBlcnI/IGFuZCBkYXRhP1xuXHRcdFx0XHRcdHJlZ2lzdGVyKEpTT04ucGFyc2UoZGF0YSkpXG5cdFx0XHRcdFx0Y2FsbGJhY2soKVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGlmIG5vdCBoYXMgY2FjaGUgZmlsZVxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0ZWxzZVxuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0IyAwIGdldCBhc2RvYyB3ZWIgcGFnZVxuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0cmVxdWVzdCByZXEudXJsLCAoZXJyLCByZXMsIGJvZHkpIC0+XG5cdFx0XHRcdGlmIGVycj8gb3IgcmVzLnN0YXR1c0NvZGUgaXNudCAyMDBcblx0XHRcdFx0XHRjb25zb2xlLmxvYWQoZXJyLCByZXMuc3RhdHVzQ29kZSlcblx0XHRcdFx0XHRjYWxsYmFjaygpXG5cdFx0XHRcdFx0cmV0dXJuXG5cblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHQjIDEgY3JlYXRlIGpxdWVyeSBvYmplY3Rcblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHQkID0gY2hlZXJpby5sb2FkKGJvZHkpXG5cdFx0XHRcdFx0XG5cdFx0XHRcdGNsYXNzZXMgPSB7fVxuXHRcdFx0XHRjbGFzc01lbWJlcnMgPSB7fVxuXHRcdFx0XHRjbGFzc3BhdGggPSBudWxsXG5cblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHQjIDIgc2VsZWN0IGFsbCA8dGQgY2xhc3M9XCJpZHhyb3dcIi8+IG9iamVjdFxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdG5vZGVzID0gJCgndGQuaWR4cm93Jylcblx0XHRcdFx0bm9kZXMuZWFjaCAoaW5kZXgpIC0+XG5cdFx0XHRcdFx0aHJlZiA9ICQoQCkuY2hpbGRyZW4oJ2EnKS5maXJzdCgpLmF0dHIoJ2hyZWYnKVxuXHRcdFx0XHRcdGFyciA9IGhyZWYuc3BsaXQoJyMnKVxuXHRcdFx0XHRcdGh0bWwgPSBudWxsXG5cdFx0XHRcdFx0YW5jaG9yID0gbnVsbFxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIGFyci5sZW5ndGggaXMgMlxuXHRcdFx0XHRcdFx0aHRtbCA9IGFyclswXVxuXHRcdFx0XHRcdFx0YW5jaG9yID0gYXJyWzFdXG5cdFx0XHRcdFx0ZWxzZSBpZiBhcnIubGVuZ3RoIGlzIDFcblx0XHRcdFx0XHRcdGh0bWwgPSBhcnJbMF1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdGNsYXNzcGF0aCA9IGh0bWwuc3Vic3RyaW5nKDAsIGh0bWwubGVuZ3RoIC0gNSkucmVwbGFjZSgvXFwvL2csICcuJykucmVwbGFjZSgvXlxcLiovZywgJycpXG5cblx0XHRcdFx0XHRpZiBhbmNob3I/XG5cdFx0XHRcdFx0XHRjbGFzc01lbWJlcnNbY2xhc3NwYXRoXSA/PSB7fVxuXHRcdFx0XHRcdFx0Y2xhc3NNZW1iZXJzW2NsYXNzcGF0aF1bYW5jaG9yXSA9IHJlcS5hc2RvYyArIGhyZWZcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRjbGFzc2VzW2NsYXNzcGF0aF0gPz0gcmVxLmFzZG9jICsgaHJlZlxuXG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdFx0IyAzIGNyZWF0ZSBhIGNhY2hlIG9iamVjdFxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdGNhY2hlID0gW11cblx0XHRcdFx0XG5cdFx0XHRcdGZvciBjbGFzc3BhdGgsIHVybCBvZiBjbGFzc2VzXG5cdFx0XHRcdFx0Y2FjaGUucHVzaFxuXHRcdFx0XHRcdFx0ZnVsbG5hbWU6IGNsYXNzcGF0aC5yZXBsYWNlKC8oW2EtekEtWjAtOVxcX1xcLl0rKVxcLihbYS16QS1aMC05XFxfXSspKCR8XFwjKS8sICckMTokMiQzJylcblx0XHRcdFx0XHRcdHVybDogdXJsXG5cdFx0XHRcdFx0XG5cdFx0XHRcdGZvciBjbGFzc3BhdGgsIG1lbWJlcnMgb2YgY2xhc3NNZW1iZXJzXG5cdFx0XHRcdFx0Zm9yIG1lbWJlciwgdXJsIG9mIG1lbWJlcnNcblx0XHRcdFx0XHRcdGNhY2hlLnB1c2hcblx0XHRcdFx0XHRcdFx0ZnVsbG5hbWU6IFwiI3tjbGFzc3BhdGh9IyN7bWVtYmVyfVwiLnJlcGxhY2UoLyhbYS16QS1aMC05XFxfXFwuXSspXFwuKFthLXpBLVowLTlcXF9dKykoJHxcXCMpLywgJyQxOiQyJDMnKVxuXHRcdFx0XHRcdFx0XHR1cmw6IHVybFxuXHRcdFx0XHRcblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHQjIDQgd3JpdGUgdG8gY2FjaGUuanNvbiBmaWxlIGFuZCByZWdpc3RlciB0byBAc3RvcmUuZXh0ZXJuYWxbMF09Y2FjaGVcblx0XHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHQkZnMud3JpdGVGaWxlIHJlcS5jYWNoZSwgSlNPTi5zdHJpbmdpZnkoY2FjaGUpLCB7ZW5jb2Rpbmc6J3V0ZjgnfSwgKGVycikgLT5cblx0XHRcdFx0XHRyZWdpc3RlcihjYWNoZSlcblx0XHRcdFx0XHRjYWxsYmFjaygpXG5cdFx0XHRcdFx0XHRcblx0XHRcdFxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIGNyZWF0ZSBhc2RvYyB4bWwgc291cmNlXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Y2FjaGVEaXJlY3RvcnlOYW1lOiAnLmFzZG9jX2NhY2hlJ1xuXG5cdGNyZWF0ZUFzZG9jQnVpbGRDb21tYW5kOiAob3V0cHV0LCBjb21wbGV0ZSkgPT5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgMCBnZXQgZXhlYyBmaWxlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRiaW4gPSAnYXNkb2MnXG5cblx0XHRAYnVpbGQuZ2V0U0RLVmVyc2lvbiAodmVyc2lvbikgPT5cblx0XHRcdGlmIEBidWlsZC5pc1dpbmRvdygpXG5cdFx0XHRcdGlmIHZlcnNpb24gPiAnNC42LjAnXG5cdFx0XHRcdFx0YmluID0gJ2FzZG9jLmJhdCdcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdGJpbiA9ICdhc2RvYy5leGUnXG5cblx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHQjIDEgY3JlYXRlIHBhdGggYXJnc1xuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdGFyZ3MgPSBbXVxuXG5cdFx0XHRhcmdzLnB1c2goQGJ1aWxkLndyYXAoJHBhdGguam9pbihAYnVpbGQuZ2V0RW52KCdGTEVYX0hPTUUnKSwgJ2JpbicsIGJpbikpKVxuXG5cdFx0XHRmb3IgbGlicmFyeSBpbiBAY29sbGVjdG9yLmdldExpYnJhcmllcygpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLWxpYnJhcnktcGF0aCAnICsgQGJ1aWxkLndyYXAobGlicmFyeSkpXG5cblx0XHRcdGZvciBsaWJyYXJ5IGluIEBjb2xsZWN0b3IuZ2V0RXh0ZXJuYWxMaWJyYXJpZXMoKVxuXHRcdFx0XHRhcmdzLnB1c2goJy1saWJyYXJ5LXBhdGggJyArIEBidWlsZC53cmFwKGxpYnJhcnkpKVxuXG5cdFx0XHRmb3IgZGlyZWN0b3J5IGluIEBjb2xsZWN0b3IuZ2V0U291cmNlRGlyZWN0b3JpZXMoKVxuXHRcdFx0XHRhcmdzLnB1c2goJy1zb3VyY2UtcGF0aCAnICsgQGJ1aWxkLndyYXAoZGlyZWN0b3J5KSlcblxuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdCMgMiBjcmVhdGUgaW5jbHVkZSBjbGFzc2VzIGFyZ3Ncblx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRAY29sbGVjdG9yLmdldEluY2x1ZGVDbGFzc2VzIEBmaWx0ZXJGdW5jdGlvbiwgKGNsYXNzUGF0aHMpID0+XG5cdFx0XHRcdGFyZ3MucHVzaCgnLWRvYy1jbGFzc2VzICcgKyBjbGFzc1BhdGhzLmpvaW4oJyAnKSlcblxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHQjIDMgYXJncywgb3V0cHV0XG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdGZvciBhcmcgaW4gQGNvbGxlY3Rvci5nZXRBcmdzKClcblx0XHRcdFx0XHRhcmdzLnB1c2goQGJ1aWxkLmFwcGx5RW52KGFyZykpXG5cblx0XHRcdFx0YXJncy5wdXNoKCctb3V0cHV0ICcgKyBAYnVpbGQud3JhcChAYnVpbGQucmVzb2x2ZVBhdGgob3V0cHV0KSkpXG5cblx0XHRcdFx0YXJncy5wdXNoKCcta2VlcC14bWw9dHJ1ZScpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLXNraXAteHNsPXRydWUnKVxuXG5cdFx0XHRcdGNvbXBsZXRlKGFyZ3Muam9pbignICcpKSBpZiBjb21wbGV0ZT9cblxuXG5cdGNyZWF0ZUFzZG9jRGF0YVhNTDogKGNhbGxiYWNrKSA9PlxuXHRcdGNhY2hlRGlyZWN0b3J5ID0gJHBhdGgubm9ybWFsaXplKEBjYWNoZURpcmVjdG9yeU5hbWUpXG5cblx0XHQjIHJlbW92ZSBjYWNoZSBkaXJlY3RvcnkgaWYgZXhpc3RzXG5cdFx0aWYgJGZzLmV4aXN0c1N5bmMoY2FjaGVEaXJlY3RvcnkpXG5cdFx0XHQkZnMucmVtb3ZlU3luYyhjYWNoZURpcmVjdG9yeSlcblxuXHRcdEBjcmVhdGVBc2RvY0J1aWxkQ29tbWFuZCBjYWNoZURpcmVjdG9yeSwgKGNvbW1hbmQpIC0+XG5cdFx0XHRleGVjKGNvbW1hbmQpLnJ1bihjYWxsYmFjaylcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgQCByZWFkIGFzZG9jIHNvdXJjZSAodG9wbGV2ZWwueG1sKVxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdHJlYWRBc2RvY0RhdGFYTUw6IChjYWxsYmFjaykgPT5cblx0XHRwYXJzZXIgPSBuZXcgeG1sMmpzLlBhcnNlcigpXG5cdFx0cGFyc2VyLnBhcnNlU3RyaW5nICRmcy5yZWFkRmlsZVN5bmMoJHBhdGguam9pbihAY2FjaGVEaXJlY3RvcnlOYW1lLCAndG9wbGV2ZWwueG1sJykpLCAoZXJyLCBkYXRhKSA9PlxuXHRcdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIGRhdGEuYXNkb2Ncblx0XHRcdFx0Y29uc29sZS5sb2coJ2FzZG9jIHhtbCA6JywgbmFtZSlcblxuXHRcdFx0aW50ZXJmYWNlUmVjID0gZGF0YS5hc2RvYy5pbnRlcmZhY2VSZWNcblx0XHRcdGNsYXNzUmVjID0gZGF0YS5hc2RvYy5jbGFzc1JlY1xuXHRcdFx0bWV0aG9kID0gZGF0YS5hc2RvYy5tZXRob2Rcblx0XHRcdGZpZWxkID0gZGF0YS5hc2RvYy5maWVsZFxuXHRcdFx0cGFja2FnZVJlYyA9IGRhdGEuYXNkb2MucGFja2FnZVJlY1xuXG5cdFx0XHRAcmVhZEFzZG9jSW50ZXJmYWNlUmVjKGludGVyZmFjZVJlYylcblx0XHRcdEByZWFkQXNkb2NDbGFzc1JlYyhjbGFzc1JlYylcblx0XHRcdEByZWFkQXNkb2NNZXRob2QobWV0aG9kKVxuXHRcdFx0QHJlYWRBc2RvY0ZpZWxkKGZpZWxkKVxuXG5cdFx0XHRjYWxsYmFjaygpXG5cblx0cmVhZEFzZG9jQ2xhc3NSZWM6IChsaXN0KSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cblx0XHQjIGF0dHJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIG5hbWU6c3RyaW5nICdFbWFpbFJlbmRlcmVyJyxcblx0XHQjIGZ1bGxuYW1lOnN0cmluZyAnbWFpbGVyLnZpZXdzOkVtYWlsUmVuZGVyZXInLFxuXHRcdCMgc291cmNlZmlsZTpzdHJpbmcgJy9ob21lL3VidW50dS93b3Jrc3BhY2UvZmxidWlsZC90ZXN0L3Byb2plY3Qvc3JjL21haWxlci92aWV3cy9FbWFpbFJlbmRlcmVyLm14bWwnLFxuXHRcdCMgbmFtZXNwYWNlOnN0cmluZyAnbWFpbGVyLnZpZXdzJyxcblx0XHQjIGFjY2VzczpzdHJpbmcgJ3B1YmxpYycsXG5cdFx0IyBiYXNlY2xhc3M6c3RyaW5nICdzcGFyay5jb21wb25lbnRzLnN1cHBvcnRDbGFzc2VzOkl0ZW1SZW5kZXJlcicsXG5cdFx0IyBpbnRlcmZhY2VzOnN0cmluZyAnZG9jU2FtcGxlczpJVGVzdDE7ZG9jU2FtcGxlczpJVGVzdDInLFxuXHRcdCMgaXNGaW5hbDpib29sZWFuICdmYWxzZScsXG5cdFx0IyBpc0R5bmFtaWM6Ym9vbGVhbiAnZmFsc2UnXG5cdFx0IyBlbGVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGRlc2NyaXB0aW9uOmFycmF5PHN0cmluZz5cblx0XHQjIHNlZTphcnJheTxzdHJpbmc+XG5cdFx0IyBpbmNsdWRlRXhhbXBsZTphcnJheTxzdHJpbmc+XG5cdFx0IyB0aHJvd3M6YXJyYXk8c3RyaW5nPlxuXHRcdCMgbWV0YWRhdGE6YXJyYXk8b2JqZWN0PlxuXG5cdFx0Zm9yIHNvdXJjZSBpbiBsaXN0XG5cdFx0XHRhdHRycyA9IHNvdXJjZVsnJCddXG5cdFx0XHRmdWxsbmFtZSA9IGF0dHJzWydmdWxsbmFtZSddXG5cdFx0XHRuYW1lc3BhY2UgPSBhdHRyc1snbmFtZXNwYWNlJ11cblxuXHRcdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHNvdXJjZVxuXHRcdFx0XHRpZiBuYW1lIGlzICckJyB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcdGF0dHJzW25hbWVdID0gQGNsZWFyQmxhbmsodmFsdWUpXG5cblx0XHRcdGF0dHJzWydpbnRlcmZhY2VzJ109QHNlbWljb2xvblN0cmluZ1RvQXJyYXkoYXR0cnNbJ2ludGVyZmFjZXMnXSlcblxuXHRcdFx0aWYgbm90IHN0b3JlLmNsYXNzZXNbZnVsbG5hbWVdP1xuXHRcdFx0XHRzdG9yZS5jbGFzc2VzW2Z1bGxuYW1lXSA9IGF0dHJzXG5cblx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXSA/PSB7fVxuXHRcdFx0c3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdWydjbGFzc2VzJ10gPz0gW11cblx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXVsnY2xhc3NlcyddLnB1c2goZnVsbG5hbWUpXG5cblxuXHRyZWFkQXNkb2NJbnRlcmZhY2VSZWM6IChsaXN0KSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cblx0XHQjIGF0dHJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIG5hbWU6ICdJVGVzdDMnLFxuXHRcdCMgZnVsbG5hbWU6ICdkb2NTYW1wbGVzOklUZXN0MycsXG5cdFx0IyBzb3VyY2VmaWxlOiAnL2hvbWUvdWJ1bnR1L3dvcmtzcGFjZS9mbGJ1aWxkL3Rlc3QvcHJvamVjdC9zcmMvZG9jU2FtcGxlcy9JVGVzdDMuYXMnLFxuXHRcdCMgbmFtZXNwYWNlOiAnZG9jU2FtcGxlcycsXG5cdFx0IyBhY2Nlc3M6ICdwdWJsaWMnLFxuXHRcdCMgYmFzZUNsYXNzZXM6ICdmbGFzaC5ldmVudHM6SUV2ZW50RGlzcGF0Y2hlcjtmbGFzaC5kaXNwbGF5OklHcmFwaGljc0RhdGE7ZG9jU2FtcGxlczpJVGVzdDEnLFxuXHRcdCMgaXNGaW5hbDogJ2ZhbHNlJyxcblx0XHQjIGlzRHluYW1pYzogJ2ZhbHNlJ1xuXHRcdCMgZWxlbWVudHMgLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBkZXNjcmlwdGlvbjphcnJheTxzdHJpbmc+XG5cdFx0IyBzZWU6YXJyYXk8c3RyaW5nPlxuXHRcdCMgaW5jbHVkZUV4YW1wbGU6YXJyYXk8c3RyaW5nPlxuXHRcdCMgdGhyb3dzOmFycmF5PHN0cmluZz5cblx0XHQjIG1ldGFkYXRhOmFycmF5PG9iamVjdD5cblxuXHRcdGZvciBzb3VyY2UgaW4gbGlzdFxuXHRcdFx0YXR0cnMgPSBzb3VyY2VbJyQnXVxuXHRcdFx0ZnVsbG5hbWUgPSBhdHRyc1snZnVsbG5hbWUnXVxuXHRcdFx0bmFtZXNwYWNlID0gYXR0cnNbJ25hbWVzcGFjZSddXG5cblx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRhdHRyc1tuYW1lXSA9IEBjbGVhckJsYW5rKHZhbHVlKVxuXG5cdFx0XHRhdHRyc1snYmFzZUNsYXNzZXMnXT1Ac2VtaWNvbG9uU3RyaW5nVG9BcnJheShhdHRyc1snYmFzZUNsYXNzZXMnXSlcblxuXHRcdFx0aWYgbm90IHN0b3JlLmludGVyZmFjZXNbZnVsbG5hbWVdP1xuXHRcdFx0XHRzdG9yZS5pbnRlcmZhY2VzW2Z1bGxuYW1lXSA9IGF0dHJzXG5cblx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXSA/PSB7fVxuXHRcdFx0c3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdWydpbnRlcmZhY2VzJ10gPz0gW11cblx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXVsnaW50ZXJmYWNlcyddLnB1c2goZnVsbG5hbWUpXG5cdFx0XHRcdFxuXG5cdHJlYWRBc2RvY01ldGhvZDogKGxpc3QpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRpc0FjY2Vzc29yID0gL1xcLyhnZXR8c2V0KSQvXG5cblx0XHRwcm9wZXJ0aWVzID0ge31cblx0XHRtZXRob2RzID0gW11cblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBjb2xsZWN0IGFjY2Vzc29yIHByb3BlcnRpZXMgYW5kIG1ldGhvZHNcblx0XHQjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgcHJvcGVydGllc1tmdWxsbmFtZV1bJ2dldCd8J3NldCddID0gc291cmNlXG5cdFx0IyBtZXRob2RzW2Z1bGxuYW1lXSA9IHNvdXJjZVxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0Zm9yIHNvdXJjZSBpbiBsaXN0XG5cdFx0XHRpZiBAaXNQcml2YXRlRmllbGQoc291cmNlKSB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGZ1bGxuYW1lID0gYXR0cnNbJ2Z1bGxuYW1lJ11cblxuXHRcdFx0IyBhY2Nlc3NvciBwcm9wZXJ0eVxuXHRcdFx0aWYgaXNBY2Nlc3Nvci50ZXN0KGZ1bGxuYW1lKVxuXHRcdFx0XHRnZXRzZXQgPSBmdWxsbmFtZS5zdWJzdHJpbmcoZnVsbG5hbWUubGVuZ3RoIC0gMylcblx0XHRcdFx0ZnVsbG5hbWUgPSBmdWxsbmFtZS5zdWJzdHJpbmcoMCwgZnVsbG5hbWUubGVuZ3RoIC0gNClcblxuXHRcdFx0XHRwcm9wZXJ0aWVzW2Z1bGxuYW1lXSA/PSB7fVxuXG5cdFx0XHRcdGlmIGdldHNldCBpcyAnZ2V0J1xuXHRcdFx0XHRcdHByb3BlcnRpZXNbZnVsbG5hbWVdWydnZXQnXSA9IHNvdXJjZVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0cHJvcGVydGllc1tmdWxsbmFtZV1bJ3NldCddID0gc291cmNlXG5cdFx0XHRcdCMgbWV0aG9kXG5cdFx0XHRlbHNlXG5cdFx0XHRcdG1ldGhvZHMucHVzaChzb3VyY2UpXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgcHJvY2VzcyBhY2Nlc3NvciBwcm9wZXJ0aWVzXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRmb3IgZnVsbG5hbWUsIGdldHNldCBvZiBwcm9wZXJ0aWVzXG5cdFx0XHRhdHRycyA9IHt9XG5cdFx0XHRnZXQgPSBnZXRzZXRbJ2dldCddXG5cdFx0XHRzZXQgPSBnZXRzZXRbJ3NldCddXG5cblx0XHRcdGFyciA9IGZ1bGxuYW1lLnNwbGl0KCcvJylcblx0XHRcdGNsYXNzRnVsbE5hbWUgPSBhcnJbMF1cblx0XHRcdG5hbWVzcGFjZSA9IGlmIGNsYXNzRnVsbE5hbWUuaW5kZXhPZignOicpID4gLTEgdGhlbiBjbGFzc0Z1bGxOYW1lLnNwbGl0KCc6JywgMSlbMF0gZWxzZSAnJ1xuXHRcdFx0e2FjY2Vzc29yLCBwcm9wZXJ0eU5hbWV9ID0gQHNwbGl0QWNjZXNzb3IoYXJyWzFdKVxuXHRcdFx0ZnVsbG5hbWUgPSBcIiN7Y2xhc3NGdWxsTmFtZX0jI3twcm9wZXJ0eU5hbWV9XCJcblxuXHRcdFx0YXR0cnNbJ2Z1bGxuYW1lJ10gPSBmdWxsbmFtZVxuXHRcdFx0YXR0cnNbJ2FjY2Vzc29yJ10gPSBpZiBhY2Nlc3NvciBpcyBuYW1lc3BhY2UgdGhlbiAnaW50ZXJuYWwnIGVsc2UgYWNjZXNzb3Jcblx0XHRcdGF0dHJzWydwcm9wZXJ0eVR5cGUnXSA9ICdhY2Nlc3Nvcidcblx0XHRcdGF0dHJzWydpc0NvbnN0J10gPSBmYWxzZVxuXG5cdFx0XHRpZiBnZXQ/IGFuZCBzZXQ/XG5cdFx0XHRcdGF0dHJzWydyZWFkd3JpdGUnXSA9ICdyZWFkd3JpdGUnXG5cdFx0XHRlbHNlIGlmIGdldD9cblx0XHRcdFx0YXR0cnNbJ3JlYWR3cml0ZSddID0gJ3JlYWRvbmx5J1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRhdHRyc1sncmVhZHdyaXRlJ10gPSAnd3JpdGVvbmx5J1xuXG5cdFx0XHRpZiBnZXQ/XG5cdFx0XHRcdGF0dHJzWyduYW1lJ10gPSBnZXRbJyQnXVsnbmFtZSddXG5cdFx0XHRcdGF0dHJzWyd0eXBlJ10gPSBnZXRbJyQnXVsncmVzdWx0X3R5cGUnXVxuXHRcdFx0XHRhdHRyc1snaXNTdGF0aWMnXSA9IGdldFsnJCddWydpc1N0YXRpYyddXG5cblx0XHRcdGVsc2UgaWYgc2V0P1xuXHRcdFx0XHRhdHRyc1snbmFtZSddID0gc2V0WyckJ11bJ25hbWUnXVxuXHRcdFx0XHRhdHRyc1sndHlwZSddID0gc2V0WyckJ11bJ3BhcmFtX3R5cGVzJ11cblx0XHRcdFx0YXR0cnNbJ2lzU3RhdGljJ10gPSBzZXRbJyQnXVsnaXNTdGF0aWMnXVxuXG5cdFx0XHRpZiBnZXQ/XG5cdFx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBnZXRcblx0XHRcdFx0XHRpZiBuYW1lIGlzICckJyB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcdFx0YXR0cnNbbmFtZV0gPSBAY2xlYXJCbGFuayh2YWx1ZSlcblxuXHRcdFx0aWYgc2V0P1xuXHRcdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc2V0XG5cdFx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRcdGF0dHJzW25hbWVdID0gQGpvaW5Qcm9wZXJ0aWVzKGF0dHJzW25hbWVdLCBAY2xlYXJCbGFuayh2YWx1ZSkpXG5cblx0XHRcdGlmIHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV0/XG5cdFx0XHRcdHN0b3JlLnByb3BlcnRpZXNbZnVsbG5hbWVdID0gYXR0cnNcblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXVsncHJvcGVydGllcyddID89IFtdXG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV1bJ3Byb3BlcnRpZXMnXS5wdXNoKGF0dHJzWyduYW1lJ10pXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgcHJvY2VzcyBtZXRob2RzXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRmb3Igc291cmNlIGluIG1ldGhvZHNcblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGFyciA9IGF0dHJzWydmdWxsbmFtZSddLnNwbGl0KCcvJylcblx0XHRcdGNsYXNzRnVsbE5hbWUgPSBhcnJbMF1cblx0XHRcdG5hbWVzcGFjZSA9IGlmIGNsYXNzRnVsbE5hbWUuaW5kZXhPZignOicpID4gLTEgdGhlbiBjbGFzc0Z1bGxOYW1lLnNwbGl0KCc6JywgMSlbMF0gZWxzZSAnJ1xuXHRcdFx0e2FjY2Vzc29yLCBwcm9wZXJ0eU5hbWV9ID0gQHNwbGl0QWNjZXNzb3IoYXJyWzFdKVxuXHRcdFx0ZnVsbG5hbWUgPSBcIiN7Y2xhc3NGdWxsTmFtZX0jI3twcm9wZXJ0eU5hbWV9KClcIlxuXHRcdFx0XG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0YXR0cnNbbmFtZV0gPSBAY2xlYXJCbGFuayh2YWx1ZSlcblxuXHRcdFx0YXR0cnNbJ2Z1bGxuYW1lJ10gPSBmdWxsbmFtZVxuXHRcdFx0YXR0cnNbJ2Fzc2Vzc29yJ10gPSBpZiBhY2Nlc3NvciBpcyBuYW1lc3BhY2UgdGhlbiAnaW50ZXJuYWwnIGVsc2UgYWNjZXNzb3Jcblx0XHRcdFxuXHRcdFx0aWYgYXR0cnNbJ3BhcmFtX25hbWVzJ10/XG5cdFx0XHRcdHBhcmFtX25hbWVzID0gYXR0cnNbJ3BhcmFtX25hbWVzJ10uc3BsaXQoJzsnKVxuXHRcdFx0XHRwYXJhbV90eXBlcyA9IGF0dHJzWydwYXJhbV90eXBlcyddLnNwbGl0KCc7Jylcblx0XHRcdFx0cGFyYW1fZGVmYXVsdHMgPSBhdHRyc1sncGFyYW1fZGVmYXVsdHMnXS5zcGxpdCgnOycpXG5cdFx0XHRcdHBhcmFtcyA9IFtdXG5cdFx0XHRcdFxuXHRcdFx0XHRmb3IgaSBpbiBbMC4ucGFyYW1fbmFtZXMubGVuZ3RoIC0gMV1cblx0XHRcdFx0XHRwYXJhbSA9IHt9XG5cdFx0XHRcdFx0cGFyYW1bJ25hbWUnXSA9IHBhcmFtX25hbWVzW2ldXG5cdFx0XHRcdFx0cGFyYW1bJ3R5cGUnXSA9IHBhcmFtX3R5cGVzW2ldXG5cdFx0XHRcdFx0cGFyYW1bJ2RlZmF1bHQnXSA9IHBhcmFtX2RlZmF1bHRzW2ldXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgYXR0cnNbJ3BhcmFtJ10/IGFuZCBhdHRyc1sncGFyYW0nXVtpXT9cblx0XHRcdFx0XHRcdHBhcmFtWydkZXNjcmlwdGlvbiddID0gYXR0cnNbJ3BhcmFtJ11baV1cblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdHBhcmFtcy5wdXNoKHBhcmFtKVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdGF0dHJzWydwYXJhbXMnXSA9IHBhcmFtc1xuXG5cdFx0XHRpZiBzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdP1xuXHRcdFx0XHRzdG9yZS5tZXRob2RzW2Z1bGxuYW1lXSA9IGF0dHJzXG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV1bJ21ldGhvZHMnXSA/PSBbXVxuXHRcdFx0XHRzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdWydtZXRob2RzJ10ucHVzaChcIiN7YXR0cnNbJ25hbWUnXX0oKVwiKVxuXG5cblx0cmVhZEFzZG9jRmllbGQ6IChsaXN0KSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cblx0XHQjIGF0dHJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIG5hbWU6ICd0ZXN0UHJvcCcsXG5cdFx0IyBmdWxsbmFtZTogJ2RvY1NhbXBsZXM6VGVzdDEvdGVzdFByb3AnLFxuXHRcdCMgdHlwZTogJ1N0cmluZycsXG5cdFx0IyBpc1N0YXRpYzogJ2ZhbHNlJyxcblx0XHQjIGlzQ29uc3Q6ICdmYWxzZSdcblx0XHQjIGVsZW1lbnRzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGRlc2NyaXB0aW9uOmFycmF5PHN0cmluZz5cblx0XHQjIG1ldGFkYXRhOmFycmF5PG9iamVjdD5cblxuXHRcdGZvciBzb3VyY2UgaW4gbGlzdFxuXHRcdFx0aWYgQGlzUHJpdmF0ZUZpZWxkKHNvdXJjZSkgdGhlbiBjb250aW51ZVxuXG5cdFx0XHRhdHRycyA9IHNvdXJjZVsnJCddXG5cdFx0XHRhcnIgPSBhdHRyc1snZnVsbG5hbWUnXS5zcGxpdCgnLycpXG5cdFx0XHRjbGFzc0Z1bGxOYW1lID0gYXJyWzBdXG5cdFx0XHRuYW1lc3BhY2UgPSBpZiBjbGFzc0Z1bGxOYW1lLmluZGV4T2YoJzonKSA+IC0xIHRoZW4gY2xhc3NGdWxsTmFtZS5zcGxpdCgnOicsIDEpWzBdIGVsc2UgJydcblx0XHRcdHthY2Nlc3NvciwgcHJvcGVydHlOYW1lfSA9IEBzcGxpdEFjY2Vzc29yKGFyclsxXSlcblx0XHRcdGZ1bGxuYW1lID0gXCIje2NsYXNzRnVsbE5hbWV9IyN7cHJvcGVydHlOYW1lfVwiXG5cblx0XHRcdCNjb25zb2xlLmxvZyhhdHRyc1snZnVsbG5hbWUnXSwgbmFtZXNwYWNlKVxuXG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0YXR0cnNbbmFtZV0gPSBAY2xlYXJCbGFuayh2YWx1ZSlcblxuXHRcdFx0YXR0cnNbJ2Z1bGxuYW1lJ10gPSBmdWxsbmFtZVxuXHRcdFx0YXR0cnNbJ2FjY2Vzc29yJ10gPSBpZiBhY2Nlc3NvciBpcyBuYW1lc3BhY2UgdGhlbiAnaW50ZXJuYWwnIGVsc2UgYWNjZXNzb3JcblxuXHRcdFx0aWYgYXR0cnNbJ2lzQ29uc3QnXS50b1N0cmluZygpIGlzICd0cnVlJ1xuXHRcdFx0XHRhdHRyc1sncHJvcGVydHlUeXBlJ10gPSAnY29uc3RhbnQnXG5cdFx0XHRcdGF0dHJzWydyZWFkd3JpdGUnXSA9ICdyZWFkb25seSdcblx0XHRcdGVsc2Vcblx0XHRcdFx0YXR0cnNbJ3Byb3BlcnR5VHlwZSddID0gJ3ZhcmlhYmxlJ1xuXHRcdFx0XHRhdHRyc1sncmVhZHdyaXRlJ10gPSAncmVhZHdyaXRlJ1xuXG5cdFx0XHQjY29uc29sZS5sb2coYXR0cnMpXG5cblx0XHRcdGlmIHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV0/XG5cdFx0XHRcdHN0b3JlLnByb3BlcnRpZXNbZnVsbG5hbWVdID0gYXR0cnNcblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXVsncHJvcGVydGllcyddID89IFtdXG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV1bJ3Byb3BlcnRpZXMnXS5wdXNoKGF0dHJzWyduYW1lJ10pXG5cblxuXHQjIG5zX2ludGVybmFsOipcblx0IyBwcm90ZWN0ZWQ6KlxuXHQjIHByaXZhdGU6KlxuXHQjIG5hbWUuc3BhY2U6KlxuXHQjICpcblx0IyBAcmV0dXJuIHsgYWNjZXNzb3IgOiAncHVibGljJywgcHJvcGVydHlOYW1lIDogJyonIH1cblx0c3BsaXRBY2Nlc3NvcjogKG5hbWUpIC0+XG5cdFx0YWNjZXNzb3JJbmRleCA9IG5hbWUuaW5kZXhPZignOicpXG5cdFx0aWYgYWNjZXNzb3JJbmRleCA+IC0xXG5cdFx0XHRhY2Nlc3NvciA9IG5hbWUuc3Vic3RyaW5nKDAsIGFjY2Vzc29ySW5kZXgpXG5cdFx0XHRwcm9wZXJ0eU5hbWUgPSBuYW1lLnN1YnN0cmluZyhhY2Nlc3NvckluZGV4ICsgMSlcblx0XHRlbHNlXG5cdFx0XHRhY2Nlc3NvciA9ICdwdWJsaWMnXG5cdFx0XHRwcm9wZXJ0eU5hbWUgPSBuYW1lXG5cblx0XHRyZXR1cm4geyBhY2Nlc3NvciA6IGFjY2Vzc29yLCBwcm9wZXJ0eU5hbWUgOiBwcm9wZXJ0eU5hbWUgfVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIHJlYWQgQ2xhc3MueWFtbFxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdHJlYWRDbGFzc1lhbWw6IChjYWxsYmFjaykgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdFxuXHRcdGFyciA9IFtdXG5cdFx0XG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHN0b3JlLmNsYXNzZXNcblx0XHRcdGFyci5wdXNoKHZhbHVlKVxuXHRcdFx0XG5cdFx0Zm9yIG5hbWUsIHZsYXVlIG9mIHN0b3JlLmludGVyZmFjZXNcblx0XHRcdGFyci5wdXNoKHZhbHVlKVxuXHRcdFxuXHRcdGFzeW5jLmVhY2hTZXJpZXMoYXJyLCBAcmVhZENsYXNzWWFtbFRhc2tGdW5jdGlvbiwgY2FsbGJhY2spXG5cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyB0YXNrIGZ1bmN0aW9uXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdHJlYWRDbGFzc1lhbWxUYXNrRnVuY3Rpb246ICh0eXBlSW5mbywgY2FsbGJhY2spID0+XG5cdFx0c291cmNlZmlsZSA9IHR5cGVJbmZvWydzb3VyY2VmaWxlJ11cblx0XHR5YW1sUGF0aCA9IHNvdXJjZWZpbGUucmVwbGFjZSgkcGF0aC5leHRuYW1lKHNvdXJjZWZpbGUpLCAnLnlhbWwnKVxuXHRcdFxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGNhbmNlbCB0YXNrIGlmIG5vdCBleGlzdHMgeWFtbCBmaWxlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGlmIG5vdCAkZnMuZXhpc3RzU3luYyh5YW1sUGF0aClcblx0XHRcdGNhbGxiYWNrKClcblx0XHRcdHJldHVyblxuXG5cdFx0c291cmNlID0geWFtbC5zYWZlTG9hZCgkZnMucmVhZEZpbGVTeW5jKHlhbWxQYXRoLCB7ZW5jb2Rpbmc6J3V0ZjgnfSkpXG5cdFx0XG5cdFx0dHlwZUZ1bGxOYW1lID0gdHlwZUluZm9bJ2Z1bGxuYW1lJ11cblx0XHRcblx0XHRtZXRob2ROYW1lUmVnID0gL1thLXpBLVowLTlcXF9dK1xcKFxcKS9cblx0XHRcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRpZiBuYW1lIGlzICdjbGFzcycgb3IgbmFtZSBpcyAnaW50ZXJmYWNlJ1xuXHRcdFx0XHRAam9pbkNsYXNzWWFtbENsYXNzSW5mbyh0eXBlSW5mbywgdmFsdWUpXG5cdFx0XHRcdFxuXHRcdFx0ZWxzZSBpZiBtZXRob2ROYW1lUmVnLnRlc3QobmFtZSlcblx0XHRcdFx0bWV0aG9kSW5mbyA9IEBzdG9yZS5tZXRob2RzW1wiI3t0eXBlRnVsbE5hbWV9IyN7bmFtZX1cIl1cblx0XHRcdFx0aWYgbWV0aG9kSW5mbz8gdGhlbiBAam9pbkNsYXNzWWFtbE1ldGhvZEluZm8obWV0aG9kSW5mbywgdmFsdWUpXG5cdFx0XHRcdFxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRwcm9wZXJ0eUluZm8gPSBAc3RvcmUucHJvcGVydGllc1tcIiN7dHlwZUZ1bGxOYW1lfSMje25hbWV9XCJdXG5cdFx0XHRcdGlmIHByb3BlcnR5SW5mbz8gdGhlbiBAam9pbkNsYXNzWWFtbEZpZWxkSW5mbyhwcm9wZXJ0eUluZm8sIHZhbHVlKVxuXHRcdFxuXHRcdGNhbGxiYWNrKClcblx0XHRcblx0XHRcblx0am9pbkNsYXNzWWFtbENsYXNzSW5mbzogKG9yaWdpbiwgc291cmNlKSA9PlxuXHRcdGF2YWxhYmxlUHJvcGVydGllcyA9IFxuXHRcdFx0ZGVzY3JpcHRpb246IHRydWVcblx0XHRcdHNlZTogdHJ1ZVxuXHRcdFx0dGhyb3dzOiB0cnVlXG5cdFx0XHRpbmNsdWRlRXhhbXBsZTogdHJ1ZVxuXHRcdFxuXHRcdEBqb2luSW5mbyhvcmlnaW4sIHNvdXJjZSwgYXZhbGFibGVQcm9wZXJ0aWVzKVxuXHRcdFxuXHRqb2luQ2xhc3NZYW1sRmllbGRJbmZvOiAob3JpZ2luLCBzb3VyY2UpID0+XG5cdFx0YXZhbGFibGVQcm9wZXJ0aWVzID0gXG5cdFx0XHRkZXNjcmlwdGlvbjogdHJ1ZVxuXHRcdFx0c2VlOiB0cnVlXG5cdFx0XHR0aHJvd3M6IHRydWVcblx0XHRcdGluY2x1ZGVFeGFtcGxlOiB0cnVlXG5cdFx0XG5cdFx0QGpvaW5JbmZvKG9yaWdpbiwgc291cmNlLCBhdmFsYWJsZVByb3BlcnRpZXMpXG5cdFx0XG5cdGpvaW5DbGFzc1lhbWxNZXRob2RJbmZvOiAob3JpZ2luLCBzb3VyY2UpID0+XG5cdFx0YXZhbGFibGVQcm9wZXJ0aWVzID0gXG5cdFx0XHRkZXNjcmlwdGlvbjogdHJ1ZVxuXHRcdFx0c2VlOiB0cnVlXG5cdFx0XHR0aHJvd3M6IHRydWVcblx0XHRcdGluY2x1ZGVFeGFtcGxlOiB0cnVlXG5cdFx0XHQncmV0dXJuJzogdHJ1ZVxuXHRcdFxuXHRcdEBqb2luSW5mbyhvcmlnaW4sIHNvdXJjZSwgYXZhbGFibGVQcm9wZXJ0aWVzKVxuXHRcdFxuXHRqb2luSW5mbzogKG9yaWdpbiwgc291cmNlLCBhdmFsYWJsZVByb3BlcnRpZXMpID0+XG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHNvdXJjZVxuXHRcdFx0aWYgYXZhbGFibGVQcm9wZXJ0aWVzW25hbWVdIGlzIHRydWVcblx0XHRcdFx0b3JpZ2luW25hbWVdID0gQGpvaW5Qcm9wZXJ0aWVzKG9yaWdpbltuYW1lXSwgQGNsZWFyQmxhbmsoc291cmNlW25hbWVdKSwgdHJ1ZSlcblx0XHRcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgQCByZWFkIG5hbWVzcGFjZS55YW1sXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0cmVhZE5hbWVzcGFjZVlhbWw6IChjYWxsYmFjaykgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdHNvdXJjZURpcmVjdG9yaWVzID0gQGNvbGxlY3Rvci5nZXRTb3VyY2VEaXJlY3RvcmllcygpXG5cdFx0bmFtZXNwYWNlSW5mb3MgPSBbXVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgbmFtZXNwYWNlSW5mbyA9IHN0b3JlLm5hbWVzcGFjZSAqIHNvdXJjZSBkaXJlY3Rvcmllc1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRmb3IgbmFtZXNwYWNlLCB2YWx1ZXMgb2Ygc3RvcmUubmFtZXNwYWNlc1xuXHRcdFx0bmFtZXNwYWNlUGF0aCA9IG5hbWVzcGFjZS5zcGxpdCgnLicpLmpvaW4oJHBhdGguc2VwKVxuXG5cdFx0XHRmb3Igc291cmNlRGlyZWN0b3J5IGluIHNvdXJjZURpcmVjdG9yaWVzXG5cdFx0XHRcdHlhbWxQYXRoID0gJHBhdGguam9pbihzb3VyY2VEaXJlY3RvcnksIG5hbWVzcGFjZVBhdGgsICduYW1lc3BhY2UueWFtbCcpXG5cblx0XHRcdFx0IyBhZGQgbmFtZXNwYWNlSW5mb3Ncblx0XHRcdFx0bmFtZXNwYWNlSW5mb3MucHVzaFxuXHRcdFx0XHRcdHlhbWxQYXRoOiB5YW1sUGF0aFxuXHRcdFx0XHRcdG5hbWVzcGFjZTogbmFtZXNwYWNlXG5cdFx0XHRcdFx0dmFsdWVzOiB2YWx1ZXNcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGVhY2ggbmFtZXNwYWNlSW5mb3Ncblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0YXN5bmMuZWFjaFNlcmllcyhuYW1lc3BhY2VJbmZvcywgQHJlYWROYW1lc3BhY2VZYW1sVGFza0Z1bmN0aW9uLCBjYWxsYmFjaylcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIHRhc2sgZnVuY3Rpb25cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0cmVhZE5hbWVzcGFjZVlhbWxUYXNrRnVuY3Rpb246IChuYW1lc3BhY2VJbmZvLCBjYWxsYmFjaykgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdHlhbWxQYXRoID0gbmFtZXNwYWNlSW5mb1sneWFtbFBhdGgnXVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgY2FuY2VsIHRhc2sgaWYgbm90IGV4aXN0cyB5YW1sIGZpbGVcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0aWYgbm90ICRmcy5leGlzdHNTeW5jKHlhbWxQYXRoKVxuXHRcdFx0Y2FsbGJhY2soKVxuXHRcdFx0cmV0dXJuXG5cblxuXHRcdHZhbHVlcyA9IG5hbWVzcGFjZUluZm9bJ3ZhbHVlcyddXG5cdFx0bmFtZXNwYWNlID0gbmFtZXNwYWNlSW5mb1snbmFtZXNwYWNlJ11cblx0XHRzb3VyY2UgPSB5YW1sLnNhZmVMb2FkKCRmcy5yZWFkRmlsZVN5bmMoeWFtbFBhdGgsIHtlbmNvZGluZzondXRmOCd9KSlcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIHJlYWQgbWFuaWZlc3Qgc3BlY1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRpZiBzb3VyY2VbJ25hbWVzcGFjZSddPyBhbmQgc291cmNlWydjb21wb25lbnRzJ10/IGFuZCBzb3VyY2VbJ2NvbXBvbmVudHMnXS5sZW5ndGggPiAwXG5cdFx0XHQjIGNvbnZlcnQgY2xhc3NuYW1lIHRvIGZ1bGxuYW1lIGlmIGV4aXN0cyBuYW1lc3BhY2Vcblx0XHRcdCMgQ29tcG9uZW50IC0tPiBuYW1lLnNwYWNlOkNvbXBvbmVudFxuXHRcdFx0aWYgbmFtZXNwYWNlIGlzbnQgJydcblx0XHRcdFx0bmV3Q29tcG9uZW50cyA9IFtdXG5cdFx0XHRcdGZvciBjb21wb25lbnQgaW4gc291cmNlWydjb21wb25lbnRzJ11cblx0XHRcdFx0XHRuZXdDb21wb25lbnRzLnB1c2gobmFtZXNwYWNlICsgJzonICsgY29tcG9uZW50KVxuXHRcdFx0XHRzb3VyY2VbJ2NvbXBvbmVudHMnXSA9IG5ld0NvbXBvbmVudHNcblxuXHRcdFx0IyBtYW5pZmVzdE5hbWVzcGFjZSA9ICdodHRwOi8vbnMuY29tL25zJ1xuXHRcdFx0bWFuaWZlc3ROYW1lc3BhY2UgPSBAY2xlYXJCbGFuayhzb3VyY2VbJ25hbWVzcGFjZSddKVxuXG5cdFx0XHQjIGNyZWF0ZSBtYW5pZmVzdCBvYmplY3QgaWYgbm90IGV4aXN0c1xuXHRcdFx0c3RvcmUubWFuaWZlc3RzW21hbmlmZXN0TmFtZXNwYWNlXSA/PSB7fVxuXHRcdFx0bWFuaWZlc3QgPSBzdG9yZS5tYW5pZmVzdHNbbWFuaWZlc3ROYW1lc3BhY2VdXG5cblx0XHRcdCMgc2F2ZSBtYW5pZmVzdCBjb21wb25lbnRzXG5cdFx0XHQjIHNvdHJlLm1hbmlmZXN0c1snaHR0cDovL25zLmNvbS9ucyddWydjb21wb25lbnRzJ10gPSAnbmFtZS5zcGFjZTpDb21wb25lbnQnXG5cdFx0XHRtYW5pZmVzdFsnY29tcG9uZW50cyddID89IFtdXG5cblx0XHRcdGZvciBjb21wb25lbnQgaW4gc291cmNlWydjb21wb25lbnRzJ11cblx0XHRcdFx0bWFuaWZlc3RbJ2NvbXBvbmVudHMnXS5wdXNoKEBjbGVhckJsYW5rKGNvbXBvbmVudCkpXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBzYXZlIG5hbWVzcGFjZS55YW1sIHZhbHVlcyB0byBuYW1lc3BhY2UgaW5mb1xuXHRcdCMgc3RvcmUubmFtZXNwYWNlc1snbmFtZS5zcGFjZSddW25hbWVdID0gdmFsdWVcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0dmFsdWVzWydkZXNjcmlwdGlvbiddID0gQGpvaW5Qcm9wZXJ0aWVzKHZhbHVlc1snZGVzY3JpcHRpb24nXSwgc291cmNlWydkZXNjcmlwdGlvbiddKVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZW5kIHRhc2tcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0Y2FsbGJhY2soKVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyB1dGlsc1xuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgdG9wbGV2ZWwueG1sIHV0aWxzXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdGlzUHJpdmF0ZUZpZWxkOiAoc291cmNlKSAtPlxuXHRcdHJldHVybiBzb3VyY2VbJyQnXVsnZnVsbG5hbWUnXS5pbmRleE9mKCcvcHJpdmF0ZTonKSA+IC0xIG9yIHNvdXJjZVsncHJpdmF0ZSddP1xuXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgYmFzaWMgdXRpbHNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyByZW1vdmUgYWxsIGZyb250IGFuZCBiYWNrIHNwYWNlIGNoYXJhY3RlciBvZiBzdHJpbmdcblx0Y2xlYXJCbGFuazogKG9iaikgLT5cblx0XHRyZWdleHAgPSAvXlxccyp8XFxzKiQvZ1xuXHRcdFxuXHRcdGlmIHR5cGVvZiBvYmogaXMgJ3N0cmluZydcblx0XHRcdHJldHVybiBvYmoucmVwbGFjZShyZWdleHAsICcnKVxuXHRcdFx0XG5cdFx0ZWxzZSBpZiBvYmogaW5zdGFuY2VvZiBBcnJheSBhbmQgb2JqLmxlbmd0aCA+IDBcblx0XHRcdGZvciBpIGluIFswLi5vYmoubGVuZ3RoLTFdXG5cdFx0XHRcdGlmIHR5cGVvZiBvYmpbaV0gaXMgJ3N0cmluZydcblx0XHRcdFx0XHRvYmpbaV0gPSBvYmpbaV0ucmVwbGFjZShyZWdleHAsICcnKVxuXHRcdFx0XHRcdFxuXHRcdHJldHVybiBvYmpcblxuXHQjIG5hbWUuc3BhY2U6Q2xhc3MxO25hbWUuc3BhY2UuQ2xhc3MyIC0tPiBbbmFtZS5zcGFjZS5DbGFzczEsIG5hbWUuc3BhY2UuQ2xhc3MyXVxuXHRzZW1pY29sb25TdHJpbmdUb0FycmF5OiAoc3RyKSAtPlxuXHRcdGlmIHN0cj8gb3Igc3RyIGlzICcnXG5cdFx0XHRzdHIuc3BsaXQoJzsnKVxuXHRcdGVsc2Vcblx0XHRcdCcnXG5cblx0am9pblByb3BlcnRpZXM6IChwcmltYXJ5LCBzZWNvbmRhcnksIG92ZXJyaWRlVG9TZWNvbmRhcnkgPSBmYWxzZSkgLT5cblx0XHRpZiBwcmltYXJ5PyBhbmQgc2Vjb25kYXJ5PyBhbmQgcHJpbWFyeSBpbnN0YW5jZW9mIEFycmF5XG5cdFx0XHRpZiBzZWNvbmRhcnkgaW5zdGFuY2VvZiBBcnJheVxuXHRcdFx0XHRyZXR1cm4gcHJpbWFyeS5jb25jYXQoc2Vjb25kYXJ5KVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRwcmltYXJ5LnB1c2goc2Vjb25kYXJ5KVxuXHRcdFx0XHRyZXR1cm4gcHJpbWFyeVxuXHRcdGVsc2UgaWYgcHJpbWFyeT8gYW5kIHNlY29uZGFyeT9cblx0XHRcdHJldHVybiBpZiBvdmVycmlkZVRvU2Vjb25kYXJ5IHRoZW4gc2Vjb25kYXJ5IGVsc2UgcHJpbWFyeVxuXHRcdGVsc2UgaWYgbm90IHByaW1hcnk/IGFuZCBzZWNvbmRhcnk/XG5cdFx0XHRyZXR1cm4gc2Vjb25kYXJ5XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHByaW1hcnlcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgZGVidWcgOiB0cmFjZSBzdG9yZSBvYmplY3Rcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRwcmludFN0b3JlOiAoKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0XG5cdFx0aW50ZXJmYWNlcyA9IHN0b3JlLmludGVyZmFjZXNcblx0XHRjbGFzc2VzID0gc3RvcmUuY2xhc3Nlc1xuXHRcdG5hbWVzcGFjZXMgPSBzdG9yZS5uYW1lc3BhY2VzXG5cdFx0bWV0aG9kcyA9IHN0b3JlLm1ldGhvZHNcblx0XHRwcm9wZXJ0aWVzID0gc3RvcmUucHJvcGVydGllc1xuXHRcdG1hbmlmZXN0cyA9IHN0b3JlLm1hbmlmZXN0c1xuXHRcblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBuYW1lc3BhY2VzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgbmFtZXNwYWNlc1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogaW50ZXJmYWNlcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIGludGVyZmFjZXNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IGNsYXNzZXMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBjbGFzc2VzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBtZXRob2RzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgbWV0aG9kc1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogcHJvcGVydGllcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHByb3BlcnRpZXNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IG1hbmlmZXN0cycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIG1hbmlmZXN0c1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXHRcdFx0XG5cdFxuXHRcdFxuXHRwcmludEZpZWxkcyA6ICgpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRcblx0XHRwcmludCA9IChjb2xsZWN0aW9uKSAtPlxuXHRcdFx0ZmllbGRzID0ge31cblx0XHRcdFxuXHRcdFx0Zm9yIGNvbGxlY3Rpb25OYW1lLCBjb2xsZWN0aW9uVmFsdWUgb2YgY29sbGVjdGlvblxuXHRcdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgY29sbGVjdGlvblZhbHVlXG5cdFx0XHRcdFx0ZmllbGRzW25hbWVdID0gdHlwZW9mIHZhbHVlIGlmIG5vdCBmaWVsZHNbbmFtZV0/XG5cdFx0XHRcdFx0XG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgZmllbGRzXG5cdFx0XHRcdGNvbnNvbGUubG9nKG5hbWUsICc6JywgdmFsdWUpXG5cdFx0XHRcdFxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IGZpZWxkIGluZm9zJylcblx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0gOiBuYW1lc3BhY2UgZmllbGRzJylcblx0XHRwcmludChzdG9yZS5uYW1lc3BhY2VzKVxuXHRcdFxuXHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLSA6IGludGVyZmFjZSBmaWVsZHMnKVxuXHRcdHByaW50KHN0b3JlLmludGVyZmFjZXMpXG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tIDogY2xhc3MgZmllbGRzJylcblx0XHRwcmludChzdG9yZS5jbGFzc2VzKVxuXHRcdFxuXHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLSA6IG1ldGhvZCBmaWVsZHMnKVxuXHRcdHByaW50KHN0b3JlLm1ldGhvZHMpXG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tIDogcHJvcGVydHkgZmllbGRzJylcblx0XHRwcmludChzdG9yZS5wcm9wZXJ0aWVzKVxuXHRcdFxuXHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLSA6IG1hbmlmZXN0IGZpZWxkcycpXG5cdFx0cHJpbnQoc3RvcmUubWFuaWZlc3RzKVxuXG4jIGNvbXBsZXRlID0gYGZ1bmN0aW9uKGVycm9yLCBkaWMpYFxuIyBkaWNbbmFtZS5zcGFjZS5DbGFzc11cdFtwcm9wZXJ0eV1cdFx0PSBodHRwOi8vfi9uYW1lL3NwYWNlL0NsYXNzLmh0bWwjcHJvcGVydHlcbiMgZGljW25hbWUuc3BhY2UuQ2xhc3NdXHRbbWV0aG9kKCldXHRcdD0gaHR0cDovL34vbmFtZS9zcGFjZS9DbGFzcy5odG1sI21ldGhvZCgpXG4jIGRpY1tuYW1lLnNwYWNlXVx0XHRbbWV0aG9kKCldXHRcdD0gaHR0cDovL34vbmFtZS9zcGFjZS8jbWV0aG9kKCkgPz8/XG4jIGRpY1tuYW1lLnNwYWNlLkNsYXNzXVx0W3N0eWxlOm5hbWVdXHQ9IGh0dHA6Ly9+L25hbWUvc3BhY2UvQ2xhc3MuaHRtbCNzdHlsZTpuYW1lXG4jIGdldEFzZG9jSW5kZXg6ICh1cmwsIGNvbXBsZXRlKSAtPlxuIyBodHRwOi8vaGVscC5hZG9iZS5jb20va29fS1IvRmxhc2hQbGF0Zm9ybS9yZWZlcmVuY2UvYWN0aW9uc2NyaXB0LzMvYWxsLWluZGV4LUEuaHRtbFxuIyBodHRwOi8vZmxleC5hcGFjaGUub3JnL2FzZG9jL2FsbC1pbmRleC1CLmh0bWxcblxuXG5cbiMgZ2V0IGFsbC1pbmRleC1BIH4gWlxuIyBwYXJzZSBhbmQgZmluZCBjbGFzcz1cImlkeHJvd1wiXG4jIGRpY1suLl1bLi5dID0gdXJsXG4jIGNvbXBsZXRlKGVycm9yLCBkaWMpXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEZsZG9jIl19