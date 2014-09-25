(function() {
  var $fs, $path, Fldoc, SourceCollector, async, cheerio, exec, jsdom, marked, pick, request, xml2js, yaml,
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

  jsdom = require('jsdom');

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
      tasks = [this.readAsdocDataXML, this.readNamespaceYaml, this.readClassYaml, this.getExternalAsdoc];
      return async.series(tasks, complete);
    };

    Fldoc.prototype.externalAsdocCacheDirectoryName = '.external_asdoc_cache';

    Fldoc.prototype.convertUrlToCacheName = function(url) {
      return url.replace(/[^a-zA-Z0-9]/g, '_');
    };

    Fldoc.prototype.getExternalAsdoc = function(callback) {
      var a2z, asdoc, asdocs, cacheFile, char, check, reqs, url, _i, _j, _len, _len1;
      this.externalCacheDirectory = $path.normalize(this.externalAsdocCacheDirectoryName);
      if (this.removeExternalAsdocCache && $fs.existsSync(this.externalCacheDirectory)) {
        $fs.removeSync(this.externalCacheDirectory);
      }
      if (!$fs.existsSync(this.externalCacheDirectory)) {
        $fs.mkdirSync(this.externalCacheDirectory);
      }
      asdocs = [this.adobeAsdoc, this.apacheFlexAsdoc];
      if ((this.externalAsdocs != null) && this.externalAsdocs.length > 0) {
        asdocs = asdocs.concat(this.externalAsdocs);
      }
      a2z = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      check = /\/$/;
      if (this.jquery == null) {
        this.jquery = $fs.readFileSync('jquery.js', 'utf8');
      }
      reqs = [];
      for (_i = 0, _len = asdocs.length; _i < _len; _i++) {
        asdoc = asdocs[_i];
        if (!check.test(asdoc)) {
          asdoc = asdoc + '/';
        }
        for (_j = 0, _len1 = a2z.length; _j < _len1; _j++) {
          char = a2z[_j];
          url = "" + asdoc + "all-index-" + char + ".html";
          cacheFile = $path.join(this.externalCacheDirectory, this.convertUrlToCacheName(url) + '.json');
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
      var external, register, store;
      store = this.store;
      external = this.store.external;
      register = function(cache) {
        var fullname, item, url, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = cache.length; _i < _len; _i++) {
          item = cache[_i];
          fullname = item['fullname'];
          url = item['url'];
          _results.push(external[fullname] != null ? external[fullname] : external[fullname] = url);
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
          var $, cache, cheerioOptions, classMembers, classes, classpath, member, members, nodes, url;
          if ((err != null) || res.statusCode !== 200) {
            console.load(err, res.statusCode);
            callback();
            return;
          }
          cheerioOptions = {
            normalizeWhitespace: false,
            xmlMode: false,
            decodeEntities: true
          };
          $ = cheerio.load(body, cheerioOptions);
          classes = {};
          classMembers = {};
          classpath = null;
          console.log('select jquery .idxrow');
          nodes = $('td.idxrow');
          console.log('start jquery each', nodes.length);
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
          console.log('end each');
          cache = [];
          for (classpath in classes) {
            url = classes[classpath];
            cache.push({
              fullname: classpath,
              url: url
            });
          }
          for (classpath in classMembers) {
            members = classMembers[classpath];
            for (member in members) {
              url = members[member];
              cache.push({
                fullname: "" + classpath + "#" + member,
                url: url
              });
            }
          }
          console.log('start write');
          return $fs.writeFile(req.cache, JSON.stringify(cache), {
            encoding: 'utf8'
          }, function(err) {
            console.log('complete save cache', req.cache);
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

//# sourceMappingURL=data:application/json;base64,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QUEsTUFvQkEsS0FBQSxDQUFNLEtBQUssQ0FBQyxPQUFaLENBcEJBLENBQUE7QUFBQSxNQXNCQSxPQUFPLENBQUMsR0FBUixDQUFZLDZCQUFaLENBdEJBLENBQUE7QUFBQSxNQXVCQSxLQUFBLENBQU0sS0FBSyxDQUFDLE9BQVosQ0F2QkEsQ0FBQTtBQUFBLE1BeUJBLE9BQU8sQ0FBQyxHQUFSLENBQVksK0JBQVosQ0F6QkEsQ0FBQTtBQUFBLE1BMEJBLEtBQUEsQ0FBTSxLQUFLLENBQUMsVUFBWixDQTFCQSxDQUFBO0FBQUEsTUE0QkEsT0FBTyxDQUFDLEdBQVIsQ0FBWSwrQkFBWixDQTVCQSxDQUFBO2FBNkJBLEtBQUEsQ0FBTSxLQUFLLENBQUMsU0FBWixFQTlCYTtJQUFBLENBN3lCZCxDQUFBOztpQkFBQTs7TUFkRCxDQUFBOztBQUFBLEVBNjJCQSxNQUFNLENBQUMsT0FBUCxHQUFpQixLQTcyQmpCLENBQUE7QUFBQSIsImZpbGUiOiJmbGRvYy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIiRmcyA9IHJlcXVpcmUoJ2ZzLWV4dHJhJylcbiRwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5hc3luYyA9IHJlcXVpcmUoJ2FzeW5jJylcbnBpY2sgPSByZXF1aXJlKCdmaWxlLXBpY2tlcicpLnBpY2tcbmV4ZWMgPSByZXF1aXJlKCdkb25lLWV4ZWMnKVxue1NvdXJjZUNvbGxlY3Rvcn0gPSByZXF1aXJlKCcuL2ZsdXRpbHMnKVxueG1sMmpzID0gcmVxdWlyZSgneG1sMmpzJylcbnlhbWwgPSByZXF1aXJlKCdqcy15YW1sJylcbm1hcmtlZCA9IHJlcXVpcmUoJ21hcmtlZCcpXG5qc2RvbSA9IHJlcXVpcmUoJ2pzZG9tJylcbmNoZWVyaW8gPSByZXF1aXJlKCdjaGVlcmlvJylcbnJlcXVlc3QgPSByZXF1aXJlKCdyZXF1ZXN0JylcblxuY2xhc3MgRmxkb2Ncblx0Y29uc3RydWN0b3I6IChAYnVpbGQpIC0+XG5cdFx0QGNvbGxlY3RvciA9IG5ldyBTb3VyY2VDb2xsZWN0b3IoQGJ1aWxkKVxuXHRcdEBleHRlcm5hbEFzZG9jcyA9IFtdXG5cdFx0QGV4dGVybmFsRmxkb2NzID0gW11cblx0XHRAYWRvYmVBc2RvYyA9ICdodHRwOi8vaGVscC5hZG9iZS5jb20va29fS1IvRmxhc2hQbGF0Zm9ybS9yZWZlcmVuY2UvYWN0aW9uc2NyaXB0LzMvJ1xuXHRcdEBhcGFjaGVGbGV4QXNkb2MgPSAnaHR0cDovL2ZsZXguYXBhY2hlLm9yZy9hc2RvYy8nXG5cblx0XHQjIHNvdXJjZSA+IGV4dGVybmFsRmxkb2NzID4gZXh0ZXJuYWxBc2RvY3MgPiBhcGFjaGVGbGV4QXNkb2MgPiBhZG9iZUFzZG9jXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIHNldHRpbmdcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIGV4dGVybmFsIGRvY3VtZW50IHNvdXJjZXNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0cmVmcmVzaEV4dGVybmFsQXNkb2NDYWNoZTogKCkgPT5cblx0XHRAcmVtb3ZlRXh0ZXJuYWxBc2RvY0NhY2hlID0gdHJ1ZVxuXHRcblx0c2V0QWRvYmVBc2RvYzogKHVybCkgPT5cblx0XHRAYWRvYmVBc2RvYyA9IHVybFxuXG5cdHNldEFwYWNoZUZsZXhBc2RvYzogKHVybCkgPT5cblx0XHRAYXBhY2hlRmxleEFzZG9jID0gdXJsXG5cblx0c2V0RXh0ZXJuYWxBc2RvYzogKHVybCkgPT5cblx0XHRAZXh0ZXJuYWxBc2RvY3MucHVzaCh1cmwpXG5cblx0c2V0RXh0ZXJuYWxGbGRvYzogKHVybCkgPT5cblx0XHRAZXh0ZXJuYWxGbGRvY3MucHVzaCh1cmwpXG5cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBhc2RvYyBmaWx0ZXIgZnVuY3Rpb25cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyBAcGFyYW0gZnVuYyBgYm9vbGVhbiBmdW5jdGlvbihmaWxlKWBcblx0c2V0RmlsdGVyRnVuY3Rpb246IChmdW5jKSA9PlxuXHRcdEBmaWx0ZXJGdW5jdGlvbiA9IGZ1bmNcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIGFzZG9jIHNvdXJjZXNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0YWRkTGlicmFyeURpcmVjdG9yeTogKHBhdGgpID0+XG5cdFx0QGNvbGxlY3Rvci5hZGRMaWJyYXJ5RGlyZWN0b3J5KHBhdGgpXG5cblx0YWRkU291cmNlRGlyZWN0b3J5OiAocGF0aCkgPT5cblx0XHRAY29sbGVjdG9yLmFkZFNvdXJjZURpcmVjdG9yeShwYXRoKVxuXG5cdGFkZEFyZzogKGFyZykgPT5cblx0XHRAY29sbGVjdG9yLmFkZEFyZyhhcmcpXG5cblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHQjIGNyZWF0ZVxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdGNyZWF0ZTogKEBvdXRwdXREaXJlY3RvcnksIGNvbXBsZXRlKSA9PlxuXHRcdEBzdG9yZSA9XG5cdFx0XHRpbnRlcmZhY2VzOiB7fVxuXHRcdFx0Y2xhc3Nlczoge31cblx0XHRcdG5hbWVzcGFjZXM6IHt9XG5cdFx0XHRtZXRob2RzOiB7fVxuXHRcdFx0cHJvcGVydGllczoge31cblx0XHRcdG1hbmlmZXN0czoge31cblx0XHRcdGV4dGVybmFsOiB7fVxuXG5cdFx0dGFza3MgPSBbXG5cdFx0XHQjQGNyZWF0ZUFzZG9jRGF0YVhNTFxuXHRcdFx0QHJlYWRBc2RvY0RhdGFYTUxcblx0XHRcdEByZWFkTmFtZXNwYWNlWWFtbFxuXHRcdFx0QHJlYWRDbGFzc1lhbWxcblx0XHRcdEBnZXRFeHRlcm5hbEFzZG9jXG5cdFx0XHQjQHByaW50U3RvcmVcblx0XHRcdCNAcHJpbnRGaWVsZHNcblx0XHRdXG5cblx0XHRhc3luYy5zZXJpZXModGFza3MsIGNvbXBsZXRlKVxuXHRcdFxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgQCBnZXQgZXh0ZXJuYWwgYXNkb2MgbGlzdFxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdGV4dGVybmFsQXNkb2NDYWNoZURpcmVjdG9yeU5hbWU6ICcuZXh0ZXJuYWxfYXNkb2NfY2FjaGUnXG5cdFxuXHRjb252ZXJ0VXJsVG9DYWNoZU5hbWU6ICh1cmwpIC0+XG5cdFx0dXJsLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCAnXycpXG5cdFxuXHRnZXRFeHRlcm5hbEFzZG9jOiAoY2FsbGJhY2spID0+XG5cdFx0QGV4dGVybmFsQ2FjaGVEaXJlY3RvcnkgPSAkcGF0aC5ub3JtYWxpemUoQGV4dGVybmFsQXNkb2NDYWNoZURpcmVjdG9yeU5hbWUpXG5cblx0XHQjIHJlbW92ZSBjYWNoZSBkaXJlY3RvcnkgaWYgZXhpc3RzXG5cdFx0aWYgQHJlbW92ZUV4dGVybmFsQXNkb2NDYWNoZSBhbmQgJGZzLmV4aXN0c1N5bmMoQGV4dGVybmFsQ2FjaGVEaXJlY3RvcnkpXG5cdFx0XHQkZnMucmVtb3ZlU3luYyhAZXh0ZXJuYWxDYWNoZURpcmVjdG9yeSlcblx0XHRcblx0XHQkZnMubWtkaXJTeW5jKEBleHRlcm5hbENhY2hlRGlyZWN0b3J5KSBpZiBub3QgJGZzLmV4aXN0c1N5bmMoQGV4dGVybmFsQ2FjaGVEaXJlY3RvcnkpXG5cdFx0XG5cdFx0YXNkb2NzID0gW0BhZG9iZUFzZG9jLCBAYXBhY2hlRmxleEFzZG9jXVxuXHRcdGFzZG9jcyA9IGFzZG9jcy5jb25jYXQoQGV4dGVybmFsQXNkb2NzKSBpZiBAZXh0ZXJuYWxBc2RvY3M/IGFuZCBAZXh0ZXJuYWxBc2RvY3MubGVuZ3RoID4gMFxuXHRcdGEyeiA9IFsnQScsICdCJywgJ0MnLCAnRCcsICdFJywgJ0YnLCAnRycsICdIJywgJ0knLCAnSicsICdLJywgJ0wnLCAnTScsICdOJywgJ08nLCAnUCcsICdRJywgJ1InLCAnUycsICdUJywgJ1UnLCAnVicsICdXJywgJ1gnLCAnWScsICdaJ11cblx0XHRjaGVjayA9IC9cXC8kL1xuXHRcdFxuXHRcdEBqcXVlcnkgPz0gJGZzLnJlYWRGaWxlU3luYygnanF1ZXJ5LmpzJywgJ3V0ZjgnKVxuXHRcdFxuXHRcdHJlcXMgPSBbXVxuXHRcdGZvciBhc2RvYyBpbiBhc2RvY3Ncblx0XHRcdGlmIG5vdCBjaGVjay50ZXN0KGFzZG9jKVxuXHRcdFx0XHRhc2RvYyA9IGFzZG9jICsgJy8nIFxuXHRcdFx0XHRcblx0XHRcdGZvciBjaGFyIGluIGEyelxuXHRcdFx0XHR1cmwgPSBcIiN7YXNkb2N9YWxsLWluZGV4LSN7Y2hhcn0uaHRtbFwiXG5cdFx0XHRcdGNhY2hlRmlsZSA9ICRwYXRoLmpvaW4oQGV4dGVybmFsQ2FjaGVEaXJlY3RvcnksIEBjb252ZXJ0VXJsVG9DYWNoZU5hbWUodXJsKSArICcuanNvbicpXG5cdFx0XHRcdFxuXHRcdFx0XHRyZXFzLnB1c2hcblx0XHRcdFx0XHRjYWNoZTogY2FjaGVGaWxlXG5cdFx0XHRcdFx0YXNkb2M6IGFzZG9jXG5cdFx0XHRcdFx0dXJsOiB1cmxcblx0XHRcblx0XHRhc3luYy5lYWNoU2VyaWVzKHJlcXMsIEBnZXRFeHRlcm5hbEFzZG9jVGFza0Z1bmN0aW9uLCBjYWxsYmFjaylcblx0XHRcblx0Z2V0RXh0ZXJuYWxBc2RvY1Rhc2tGdW5jdGlvbjogKHJlcSwgY2FsbGJhY2spID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRleHRlcm5hbCA9IEBzdG9yZS5leHRlcm5hbFxuXHRcdFxuXHRcdHJlZ2lzdGVyID0gKGNhY2hlKSAtPlxuXHRcdFx0Zm9yIGl0ZW0gaW4gY2FjaGVcblx0XHRcdFx0ZnVsbG5hbWUgPSBpdGVtWydmdWxsbmFtZSddXG5cdFx0XHRcdHVybCA9IGl0ZW1bJ3VybCddXG5cdFx0XHRcdGV4dGVybmFsW2Z1bGxuYW1lXSA/PSB1cmxcblx0XHRcblx0XHRpZiAkZnMuZXhpc3RzU3luYyhyZXEuY2FjaGUpXG5cdFx0XHQkZnMucmVhZEZpbGUgcmVxLmNhY2hlLCB7ZW5jb2Rpbmc6J3V0ZjgnfSwgKGVyciwgZGF0YSkgLT5cblx0XHRcdFx0aWYgbm90IGVycj8gYW5kIGRhdGE/XG5cdFx0XHRcdFx0cmVnaXN0ZXIoSlNPTi5wYXJzZShkYXRhKSlcblx0XHRcdFx0XHRjYWxsYmFjaygpXG5cdFx0ZWxzZSBcblx0XHRcdHJlcXVlc3QgcmVxLnVybCwgKGVyciwgcmVzLCBib2R5KSAtPlxuXHRcdFx0XHRpZiBlcnI/IG9yIHJlcy5zdGF0dXNDb2RlIGlzbnQgMjAwXG5cdFx0XHRcdFx0Y29uc29sZS5sb2FkKGVyciwgcmVzLnN0YXR1c0NvZGUpXG5cdFx0XHRcdFx0Y2FsbGJhY2soKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcblx0XHRcdFx0Y2hlZXJpb09wdGlvbnMgPVxuXHRcdFx0XHRcdG5vcm1hbGl6ZVdoaXRlc3BhY2U6IGZhbHNlXG5cdFx0XHRcdFx0eG1sTW9kZTogZmFsc2Vcblx0XHRcdFx0XHRkZWNvZGVFbnRpdGllczogdHJ1ZVxuXHRcdFx0XHRcblx0XHRcdFx0JCA9IGNoZWVyaW8ubG9hZChib2R5LCBjaGVlcmlvT3B0aW9ucylcblx0XHRcdFx0XHRcblx0XHRcdFx0Y2xhc3NlcyA9IHt9XG5cdFx0XHRcdGNsYXNzTWVtYmVycyA9IHt9XG5cdFx0XHRcdGNsYXNzcGF0aCA9IG51bGxcblxuXHRcdFx0XHRjb25zb2xlLmxvZygnc2VsZWN0IGpxdWVyeSAuaWR4cm93Jylcblx0XHRcdFx0bm9kZXMgPSAkKCd0ZC5pZHhyb3cnKVxuXHRcdFx0XHRcblx0XHRcdFx0Y29uc29sZS5sb2coJ3N0YXJ0IGpxdWVyeSBlYWNoJywgbm9kZXMubGVuZ3RoKVxuXHRcdFx0XHRub2Rlcy5lYWNoIChpbmRleCkgLT5cblx0XHRcdFx0XHRocmVmID0gJChAKS5jaGlsZHJlbignYScpLmZpcnN0KCkuYXR0cignaHJlZicpXG5cdFx0XHRcdFx0YXJyID0gaHJlZi5zcGxpdCgnIycpXG5cdFx0XHRcdFx0aHRtbCA9IG51bGxcblx0XHRcdFx0XHRhbmNob3IgPSBudWxsXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgYXJyLmxlbmd0aCBpcyAyXG5cdFx0XHRcdFx0XHRodG1sID0gYXJyWzBdXG5cdFx0XHRcdFx0XHRhbmNob3IgPSBhcnJbMV1cblx0XHRcdFx0XHRlbHNlIGlmIGFyci5sZW5ndGggaXMgMVxuXHRcdFx0XHRcdFx0aHRtbCA9IGFyclswXVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0Y2xhc3NwYXRoID0gaHRtbC5zdWJzdHJpbmcoMCwgaHRtbC5sZW5ndGggLSA1KS5yZXBsYWNlKC9cXC8vZywgJy4nKS5yZXBsYWNlKC9eXFwuKi9nLCAnJylcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiBhbmNob3I/XG5cdFx0XHRcdFx0XHRjbGFzc01lbWJlcnNbY2xhc3NwYXRoXSA/PSB7fVxuXHRcdFx0XHRcdFx0Y2xhc3NNZW1iZXJzW2NsYXNzcGF0aF1bYW5jaG9yXSA9IHJlcS5hc2RvYyArIGhyZWZcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRjbGFzc2VzW2NsYXNzcGF0aF0gPz0gcmVxLmFzZG9jICsgaHJlZlxuXHRcdFx0XHRcblx0XHRcdFx0Y29uc29sZS5sb2coJ2VuZCBlYWNoJylcblx0XHRcdFx0XG5cdFx0XHRcdGNhY2hlID0gW11cblx0XHRcdFx0XG5cdFx0XHRcdGZvciBjbGFzc3BhdGgsIHVybCBvZiBjbGFzc2VzXG5cdFx0XHRcdFx0Y2FjaGUucHVzaFxuXHRcdFx0XHRcdFx0ZnVsbG5hbWU6IGNsYXNzcGF0aFxuXHRcdFx0XHRcdFx0dXJsOiB1cmxcblx0XHRcdFx0XHRcblx0XHRcdFx0Zm9yIGNsYXNzcGF0aCwgbWVtYmVycyBvZiBjbGFzc01lbWJlcnNcblx0XHRcdFx0XHRmb3IgbWVtYmVyLCB1cmwgb2YgbWVtYmVyc1xuXHRcdFx0XHRcdFx0Y2FjaGUucHVzaFxuXHRcdFx0XHRcdFx0XHRmdWxsbmFtZTogXCIje2NsYXNzcGF0aH0jI3ttZW1iZXJ9XCJcblx0XHRcdFx0XHRcdFx0dXJsOiB1cmxcblx0XHRcdFx0XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdzdGFydCB3cml0ZScpXG5cdFx0XHRcdFxuXHRcdFx0XHQkZnMud3JpdGVGaWxlIHJlcS5jYWNoZSwgSlNPTi5zdHJpbmdpZnkoY2FjaGUpLCB7ZW5jb2Rpbmc6J3V0ZjgnfSwgKGVycikgLT5cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnY29tcGxldGUgc2F2ZSBjYWNoZScsIHJlcS5jYWNoZSlcblx0XHRcdFx0XHRyZWdpc3RlcihjYWNoZSlcblx0XHRcdFx0XHRjYWxsYmFjaygpXG5cdFx0XHRcdFx0XHRcblx0XHRcdFxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIGNyZWF0ZSBhc2RvYyB4bWwgc291cmNlXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0Y2FjaGVEaXJlY3RvcnlOYW1lOiAnLmFzZG9jX2NhY2hlJ1xuXG5cdGNyZWF0ZUFzZG9jQnVpbGRDb21tYW5kOiAob3V0cHV0LCBjb21wbGV0ZSkgPT5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgMCBnZXQgZXhlYyBmaWxlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRiaW4gPSAnYXNkb2MnXG5cblx0XHRAYnVpbGQuZ2V0U0RLVmVyc2lvbiAodmVyc2lvbikgPT5cblx0XHRcdGlmIEBidWlsZC5pc1dpbmRvdygpXG5cdFx0XHRcdGlmIHZlcnNpb24gPiAnNC42LjAnXG5cdFx0XHRcdFx0YmluID0gJ2FzZG9jLmJhdCdcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdGJpbiA9ICdhc2RvYy5leGUnXG5cblx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHQjIDEgY3JlYXRlIHBhdGggYXJnc1xuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdGFyZ3MgPSBbXVxuXG5cdFx0XHRhcmdzLnB1c2goQGJ1aWxkLndyYXAoJHBhdGguam9pbihAYnVpbGQuZ2V0RW52KCdGTEVYX0hPTUUnKSwgJ2JpbicsIGJpbikpKVxuXG5cdFx0XHRmb3IgbGlicmFyeSBpbiBAY29sbGVjdG9yLmdldExpYnJhcmllcygpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLWxpYnJhcnktcGF0aCAnICsgQGJ1aWxkLndyYXAobGlicmFyeSkpXG5cblx0XHRcdGZvciBsaWJyYXJ5IGluIEBjb2xsZWN0b3IuZ2V0RXh0ZXJuYWxMaWJyYXJpZXMoKVxuXHRcdFx0XHRhcmdzLnB1c2goJy1saWJyYXJ5LXBhdGggJyArIEBidWlsZC53cmFwKGxpYnJhcnkpKVxuXG5cdFx0XHRmb3IgZGlyZWN0b3J5IGluIEBjb2xsZWN0b3IuZ2V0U291cmNlRGlyZWN0b3JpZXMoKVxuXHRcdFx0XHRhcmdzLnB1c2goJy1zb3VyY2UtcGF0aCAnICsgQGJ1aWxkLndyYXAoZGlyZWN0b3J5KSlcblxuXHRcdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRcdCMgMiBjcmVhdGUgaW5jbHVkZSBjbGFzc2VzIGFyZ3Ncblx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRAY29sbGVjdG9yLmdldEluY2x1ZGVDbGFzc2VzIEBmaWx0ZXJGdW5jdGlvbiwgKGNsYXNzUGF0aHMpID0+XG5cdFx0XHRcdGFyZ3MucHVzaCgnLWRvYy1jbGFzc2VzICcgKyBjbGFzc1BhdGhzLmpvaW4oJyAnKSlcblxuXHRcdFx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdFx0XHQjIDMgYXJncywgb3V0cHV0XG5cdFx0XHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0XHRcdGZvciBhcmcgaW4gQGNvbGxlY3Rvci5nZXRBcmdzKClcblx0XHRcdFx0XHRhcmdzLnB1c2goQGJ1aWxkLmFwcGx5RW52KGFyZykpXG5cblx0XHRcdFx0YXJncy5wdXNoKCctb3V0cHV0ICcgKyBAYnVpbGQud3JhcChAYnVpbGQucmVzb2x2ZVBhdGgob3V0cHV0KSkpXG5cblx0XHRcdFx0YXJncy5wdXNoKCcta2VlcC14bWw9dHJ1ZScpXG5cdFx0XHRcdGFyZ3MucHVzaCgnLXNraXAteHNsPXRydWUnKVxuXG5cdFx0XHRcdGNvbXBsZXRlKGFyZ3Muam9pbignICcpKSBpZiBjb21wbGV0ZT9cblxuXG5cdGNyZWF0ZUFzZG9jRGF0YVhNTDogKGNhbGxiYWNrKSA9PlxuXHRcdGNhY2hlRGlyZWN0b3J5ID0gJHBhdGgubm9ybWFsaXplKEBjYWNoZURpcmVjdG9yeU5hbWUpXG5cblx0XHQjIHJlbW92ZSBjYWNoZSBkaXJlY3RvcnkgaWYgZXhpc3RzXG5cdFx0aWYgJGZzLmV4aXN0c1N5bmMoY2FjaGVEaXJlY3RvcnkpXG5cdFx0XHQkZnMucmVtb3ZlU3luYyhjYWNoZURpcmVjdG9yeSlcblxuXHRcdEBjcmVhdGVBc2RvY0J1aWxkQ29tbWFuZCBjYWNoZURpcmVjdG9yeSwgKGNvbW1hbmQpIC0+XG5cdFx0XHRleGVjKGNvbW1hbmQpLnJ1bihjYWxsYmFjaylcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgQCByZWFkIGFzZG9jIHNvdXJjZSAodG9wbGV2ZWwueG1sKVxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdHJlYWRBc2RvY0RhdGFYTUw6IChjYWxsYmFjaykgPT5cblx0XHRwYXJzZXIgPSBuZXcgeG1sMmpzLlBhcnNlcigpXG5cdFx0cGFyc2VyLnBhcnNlU3RyaW5nICRmcy5yZWFkRmlsZVN5bmMoJHBhdGguam9pbihAY2FjaGVEaXJlY3RvcnlOYW1lLCAndG9wbGV2ZWwueG1sJykpLCAoZXJyLCBkYXRhKSA9PlxuXHRcdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIGRhdGEuYXNkb2Ncblx0XHRcdFx0Y29uc29sZS5sb2coJ2FzZG9jIHhtbCA6JywgbmFtZSlcblxuXHRcdFx0aW50ZXJmYWNlUmVjID0gZGF0YS5hc2RvYy5pbnRlcmZhY2VSZWNcblx0XHRcdGNsYXNzUmVjID0gZGF0YS5hc2RvYy5jbGFzc1JlY1xuXHRcdFx0bWV0aG9kID0gZGF0YS5hc2RvYy5tZXRob2Rcblx0XHRcdGZpZWxkID0gZGF0YS5hc2RvYy5maWVsZFxuXHRcdFx0cGFja2FnZVJlYyA9IGRhdGEuYXNkb2MucGFja2FnZVJlY1xuXG5cdFx0XHRAcmVhZEFzZG9jSW50ZXJmYWNlUmVjKGludGVyZmFjZVJlYylcblx0XHRcdEByZWFkQXNkb2NDbGFzc1JlYyhjbGFzc1JlYylcblx0XHRcdEByZWFkQXNkb2NNZXRob2QobWV0aG9kKVxuXHRcdFx0QHJlYWRBc2RvY0ZpZWxkKGZpZWxkKVxuXG5cdFx0XHRjYWxsYmFjaygpXG5cblx0cmVhZEFzZG9jQ2xhc3NSZWM6IChsaXN0KSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cblx0XHQjIGF0dHJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIG5hbWU6c3RyaW5nICdFbWFpbFJlbmRlcmVyJyxcblx0XHQjIGZ1bGxuYW1lOnN0cmluZyAnbWFpbGVyLnZpZXdzOkVtYWlsUmVuZGVyZXInLFxuXHRcdCMgc291cmNlZmlsZTpzdHJpbmcgJy9ob21lL3VidW50dS93b3Jrc3BhY2UvZmxidWlsZC90ZXN0L3Byb2plY3Qvc3JjL21haWxlci92aWV3cy9FbWFpbFJlbmRlcmVyLm14bWwnLFxuXHRcdCMgbmFtZXNwYWNlOnN0cmluZyAnbWFpbGVyLnZpZXdzJyxcblx0XHQjIGFjY2VzczpzdHJpbmcgJ3B1YmxpYycsXG5cdFx0IyBiYXNlY2xhc3M6c3RyaW5nICdzcGFyay5jb21wb25lbnRzLnN1cHBvcnRDbGFzc2VzOkl0ZW1SZW5kZXJlcicsXG5cdFx0IyBpbnRlcmZhY2VzOnN0cmluZyAnZG9jU2FtcGxlczpJVGVzdDE7ZG9jU2FtcGxlczpJVGVzdDInLFxuXHRcdCMgaXNGaW5hbDpib29sZWFuICdmYWxzZScsXG5cdFx0IyBpc0R5bmFtaWM6Ym9vbGVhbiAnZmFsc2UnXG5cdFx0IyBlbGVtZW50cyAtLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGRlc2NyaXB0aW9uOmFycmF5PHN0cmluZz5cblx0XHQjIHNlZTphcnJheTxzdHJpbmc+XG5cdFx0IyBpbmNsdWRlRXhhbXBsZTphcnJheTxzdHJpbmc+XG5cdFx0IyB0aHJvd3M6YXJyYXk8c3RyaW5nPlxuXHRcdCMgbWV0YWRhdGE6YXJyYXk8b2JqZWN0PlxuXG5cdFx0Zm9yIHNvdXJjZSBpbiBsaXN0XG5cdFx0XHRhdHRycyA9IHNvdXJjZVsnJCddXG5cdFx0XHRmdWxsbmFtZSA9IGF0dHJzWydmdWxsbmFtZSddXG5cdFx0XHRuYW1lc3BhY2UgPSBhdHRyc1snbmFtZXNwYWNlJ11cblxuXHRcdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHNvdXJjZVxuXHRcdFx0XHRpZiBuYW1lIGlzICckJyB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcdGF0dHJzW25hbWVdID0gQGNsZWFyQmxhbmsodmFsdWUpXG5cblx0XHRcdGF0dHJzWydpbnRlcmZhY2VzJ109QHNlbWljb2xvblN0cmluZ1RvQXJyYXkoYXR0cnNbJ2ludGVyZmFjZXMnXSlcblxuXHRcdFx0aWYgbm90IHN0b3JlLmNsYXNzZXNbZnVsbG5hbWVdP1xuXHRcdFx0XHRzdG9yZS5jbGFzc2VzW2Z1bGxuYW1lXSA9IGF0dHJzXG5cblx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXSA/PSB7fVxuXHRcdFx0c3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdWydjbGFzc2VzJ10gPz0gW11cblx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXVsnY2xhc3NlcyddLnB1c2goZnVsbG5hbWUpXG5cblxuXHRyZWFkQXNkb2NJbnRlcmZhY2VSZWM6IChsaXN0KSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cblx0XHQjIGF0dHJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIG5hbWU6ICdJVGVzdDMnLFxuXHRcdCMgZnVsbG5hbWU6ICdkb2NTYW1wbGVzOklUZXN0MycsXG5cdFx0IyBzb3VyY2VmaWxlOiAnL2hvbWUvdWJ1bnR1L3dvcmtzcGFjZS9mbGJ1aWxkL3Rlc3QvcHJvamVjdC9zcmMvZG9jU2FtcGxlcy9JVGVzdDMuYXMnLFxuXHRcdCMgbmFtZXNwYWNlOiAnZG9jU2FtcGxlcycsXG5cdFx0IyBhY2Nlc3M6ICdwdWJsaWMnLFxuXHRcdCMgYmFzZUNsYXNzZXM6ICdmbGFzaC5ldmVudHM6SUV2ZW50RGlzcGF0Y2hlcjtmbGFzaC5kaXNwbGF5OklHcmFwaGljc0RhdGE7ZG9jU2FtcGxlczpJVGVzdDEnLFxuXHRcdCMgaXNGaW5hbDogJ2ZhbHNlJyxcblx0XHQjIGlzRHluYW1pYzogJ2ZhbHNlJ1xuXHRcdCMgZWxlbWVudHMgLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBkZXNjcmlwdGlvbjphcnJheTxzdHJpbmc+XG5cdFx0IyBzZWU6YXJyYXk8c3RyaW5nPlxuXHRcdCMgaW5jbHVkZUV4YW1wbGU6YXJyYXk8c3RyaW5nPlxuXHRcdCMgdGhyb3dzOmFycmF5PHN0cmluZz5cblx0XHQjIG1ldGFkYXRhOmFycmF5PG9iamVjdD5cblxuXHRcdGZvciBzb3VyY2UgaW4gbGlzdFxuXHRcdFx0YXR0cnMgPSBzb3VyY2VbJyQnXVxuXHRcdFx0ZnVsbG5hbWUgPSBhdHRyc1snZnVsbG5hbWUnXVxuXHRcdFx0bmFtZXNwYWNlID0gYXR0cnNbJ25hbWVzcGFjZSddXG5cblx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBzb3VyY2Vcblx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRhdHRyc1tuYW1lXSA9IEBjbGVhckJsYW5rKHZhbHVlKVxuXG5cdFx0XHRhdHRyc1snYmFzZUNsYXNzZXMnXT1Ac2VtaWNvbG9uU3RyaW5nVG9BcnJheShhdHRyc1snYmFzZUNsYXNzZXMnXSlcblxuXHRcdFx0aWYgbm90IHN0b3JlLmludGVyZmFjZXNbZnVsbG5hbWVdP1xuXHRcdFx0XHRzdG9yZS5pbnRlcmZhY2VzW2Z1bGxuYW1lXSA9IGF0dHJzXG5cblx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXSA/PSB7fVxuXHRcdFx0c3RvcmUubmFtZXNwYWNlc1tuYW1lc3BhY2VdWydpbnRlcmZhY2VzJ10gPz0gW11cblx0XHRcdHN0b3JlLm5hbWVzcGFjZXNbbmFtZXNwYWNlXVsnaW50ZXJmYWNlcyddLnB1c2goZnVsbG5hbWUpXG5cdFx0XHRcdFxuXG5cdHJlYWRBc2RvY01ldGhvZDogKGxpc3QpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRpc0FjY2Vzc29yID0gL1xcLyhnZXR8c2V0KSQvXG5cblx0XHRwcm9wZXJ0aWVzID0ge31cblx0XHRtZXRob2RzID0gW11cblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBjb2xsZWN0IGFjY2Vzc29yIHByb3BlcnRpZXMgYW5kIG1ldGhvZHNcblx0XHQjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgcHJvcGVydGllc1tmdWxsbmFtZV1bJ2dldCd8J3NldCddID0gc291cmNlXG5cdFx0IyBtZXRob2RzW2Z1bGxuYW1lXSA9IHNvdXJjZVxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0Zm9yIHNvdXJjZSBpbiBsaXN0XG5cdFx0XHRpZiBAaXNQcml2YXRlRmllbGQoc291cmNlKSB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGZ1bGxuYW1lID0gYXR0cnNbJ2Z1bGxuYW1lJ11cblxuXHRcdFx0IyBhY2Nlc3NvciBwcm9wZXJ0eVxuXHRcdFx0aWYgaXNBY2Nlc3Nvci50ZXN0KGZ1bGxuYW1lKVxuXHRcdFx0XHRnZXRzZXQgPSBmdWxsbmFtZS5zdWJzdHJpbmcoZnVsbG5hbWUubGVuZ3RoIC0gMylcblx0XHRcdFx0ZnVsbG5hbWUgPSBmdWxsbmFtZS5zdWJzdHJpbmcoMCwgZnVsbG5hbWUubGVuZ3RoIC0gNClcblxuXHRcdFx0XHRwcm9wZXJ0aWVzW2Z1bGxuYW1lXSA/PSB7fVxuXG5cdFx0XHRcdGlmIGdldHNldCBpcyAnZ2V0J1xuXHRcdFx0XHRcdHByb3BlcnRpZXNbZnVsbG5hbWVdWydnZXQnXSA9IHNvdXJjZVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0cHJvcGVydGllc1tmdWxsbmFtZV1bJ3NldCddID0gc291cmNlXG5cdFx0XHRcdCMgbWV0aG9kXG5cdFx0XHRlbHNlXG5cdFx0XHRcdG1ldGhvZHMucHVzaChzb3VyY2UpXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgcHJvY2VzcyBhY2Nlc3NvciBwcm9wZXJ0aWVzXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRmb3IgZnVsbG5hbWUsIGdldHNldCBvZiBwcm9wZXJ0aWVzXG5cdFx0XHRhdHRycyA9IHt9XG5cdFx0XHRnZXQgPSBnZXRzZXRbJ2dldCddXG5cdFx0XHRzZXQgPSBnZXRzZXRbJ3NldCddXG5cblx0XHRcdGFyciA9IGZ1bGxuYW1lLnNwbGl0KCcvJylcblx0XHRcdGNsYXNzRnVsbE5hbWUgPSBhcnJbMF1cblx0XHRcdG5hbWVzcGFjZSA9IGlmIGNsYXNzRnVsbE5hbWUuaW5kZXhPZignOicpID4gLTEgdGhlbiBjbGFzc0Z1bGxOYW1lLnNwbGl0KCc6JywgMSlbMF0gZWxzZSAnJ1xuXHRcdFx0e2FjY2Vzc29yLCBwcm9wZXJ0eU5hbWV9ID0gQHNwbGl0QWNjZXNzb3IoYXJyWzFdKVxuXHRcdFx0ZnVsbG5hbWUgPSBcIiN7Y2xhc3NGdWxsTmFtZX0jI3twcm9wZXJ0eU5hbWV9XCJcblxuXHRcdFx0YXR0cnNbJ2Z1bGxuYW1lJ10gPSBmdWxsbmFtZVxuXHRcdFx0YXR0cnNbJ2FjY2Vzc29yJ10gPSBpZiBhY2Nlc3NvciBpcyBuYW1lc3BhY2UgdGhlbiAnaW50ZXJuYWwnIGVsc2UgYWNjZXNzb3Jcblx0XHRcdGF0dHJzWydwcm9wZXJ0eVR5cGUnXSA9ICdhY2Nlc3Nvcidcblx0XHRcdGF0dHJzWydpc0NvbnN0J10gPSBmYWxzZVxuXG5cdFx0XHRpZiBnZXQ/IGFuZCBzZXQ/XG5cdFx0XHRcdGF0dHJzWydyZWFkd3JpdGUnXSA9ICdyZWFkd3JpdGUnXG5cdFx0XHRlbHNlIGlmIGdldD9cblx0XHRcdFx0YXR0cnNbJ3JlYWR3cml0ZSddID0gJ3JlYWRvbmx5J1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRhdHRyc1sncmVhZHdyaXRlJ10gPSAnd3JpdGVvbmx5J1xuXG5cdFx0XHRpZiBnZXQ/XG5cdFx0XHRcdGF0dHJzWyduYW1lJ10gPSBnZXRbJyQnXVsnbmFtZSddXG5cdFx0XHRcdGF0dHJzWyd0eXBlJ10gPSBnZXRbJyQnXVsncmVzdWx0X3R5cGUnXVxuXHRcdFx0XHRhdHRyc1snaXNTdGF0aWMnXSA9IGdldFsnJCddWydpc1N0YXRpYyddXG5cblx0XHRcdGVsc2UgaWYgc2V0P1xuXHRcdFx0XHRhdHRyc1snbmFtZSddID0gc2V0WyckJ11bJ25hbWUnXVxuXHRcdFx0XHRhdHRyc1sndHlwZSddID0gc2V0WyckJ11bJ3BhcmFtX3R5cGVzJ11cblx0XHRcdFx0YXR0cnNbJ2lzU3RhdGljJ10gPSBzZXRbJyQnXVsnaXNTdGF0aWMnXVxuXG5cdFx0XHRpZiBnZXQ/XG5cdFx0XHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBnZXRcblx0XHRcdFx0XHRpZiBuYW1lIGlzICckJyB0aGVuIGNvbnRpbnVlXG5cdFx0XHRcdFx0YXR0cnNbbmFtZV0gPSBAY2xlYXJCbGFuayh2YWx1ZSlcblxuXHRcdFx0aWYgc2V0P1xuXHRcdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc2V0XG5cdFx0XHRcdFx0aWYgbmFtZSBpcyAnJCcgdGhlbiBjb250aW51ZVxuXHRcdFx0XHRcdGF0dHJzW25hbWVdID0gQGpvaW5Qcm9wZXJ0aWVzKGF0dHJzW25hbWVdLCBAY2xlYXJCbGFuayh2YWx1ZSkpXG5cblx0XHRcdGlmIHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV0/XG5cdFx0XHRcdHN0b3JlLnByb3BlcnRpZXNbZnVsbG5hbWVdID0gYXR0cnNcblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXVsncHJvcGVydGllcyddID89IFtdXG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV1bJ3Byb3BlcnRpZXMnXS5wdXNoKGF0dHJzWyduYW1lJ10pXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgcHJvY2VzcyBtZXRob2RzXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRmb3Igc291cmNlIGluIG1ldGhvZHNcblx0XHRcdGF0dHJzID0gc291cmNlWyckJ11cblx0XHRcdGFyciA9IGF0dHJzWydmdWxsbmFtZSddLnNwbGl0KCcvJylcblx0XHRcdGNsYXNzRnVsbE5hbWUgPSBhcnJbMF1cblx0XHRcdG5hbWVzcGFjZSA9IGlmIGNsYXNzRnVsbE5hbWUuaW5kZXhPZignOicpID4gLTEgdGhlbiBjbGFzc0Z1bGxOYW1lLnNwbGl0KCc6JywgMSlbMF0gZWxzZSAnJ1xuXHRcdFx0e2FjY2Vzc29yLCBwcm9wZXJ0eU5hbWV9ID0gQHNwbGl0QWNjZXNzb3IoYXJyWzFdKVxuXHRcdFx0ZnVsbG5hbWUgPSBcIiN7Y2xhc3NGdWxsTmFtZX0jI3twcm9wZXJ0eU5hbWV9KClcIlxuXHRcdFx0XG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0YXR0cnNbbmFtZV0gPSBAY2xlYXJCbGFuayh2YWx1ZSlcblxuXHRcdFx0YXR0cnNbJ2Z1bGxuYW1lJ10gPSBmdWxsbmFtZVxuXHRcdFx0YXR0cnNbJ2Fzc2Vzc29yJ10gPSBpZiBhY2Nlc3NvciBpcyBuYW1lc3BhY2UgdGhlbiAnaW50ZXJuYWwnIGVsc2UgYWNjZXNzb3Jcblx0XHRcdFxuXHRcdFx0aWYgYXR0cnNbJ3BhcmFtX25hbWVzJ10/XG5cdFx0XHRcdHBhcmFtX25hbWVzID0gYXR0cnNbJ3BhcmFtX25hbWVzJ10uc3BsaXQoJzsnKVxuXHRcdFx0XHRwYXJhbV90eXBlcyA9IGF0dHJzWydwYXJhbV90eXBlcyddLnNwbGl0KCc7Jylcblx0XHRcdFx0cGFyYW1fZGVmYXVsdHMgPSBhdHRyc1sncGFyYW1fZGVmYXVsdHMnXS5zcGxpdCgnOycpXG5cdFx0XHRcdHBhcmFtcyA9IFtdXG5cdFx0XHRcdFxuXHRcdFx0XHRmb3IgaSBpbiBbMC4ucGFyYW1fbmFtZXMubGVuZ3RoIC0gMV1cblx0XHRcdFx0XHRwYXJhbSA9IHt9XG5cdFx0XHRcdFx0cGFyYW1bJ25hbWUnXSA9IHBhcmFtX25hbWVzW2ldXG5cdFx0XHRcdFx0cGFyYW1bJ3R5cGUnXSA9IHBhcmFtX3R5cGVzW2ldXG5cdFx0XHRcdFx0cGFyYW1bJ2RlZmF1bHQnXSA9IHBhcmFtX2RlZmF1bHRzW2ldXG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgYXR0cnNbJ3BhcmFtJ10/IGFuZCBhdHRyc1sncGFyYW0nXVtpXT9cblx0XHRcdFx0XHRcdHBhcmFtWydkZXNjcmlwdGlvbiddID0gYXR0cnNbJ3BhcmFtJ11baV1cblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdHBhcmFtcy5wdXNoKHBhcmFtKVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdGF0dHJzWydwYXJhbXMnXSA9IHBhcmFtc1xuXG5cdFx0XHRpZiBzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdP1xuXHRcdFx0XHRzdG9yZS5tZXRob2RzW2Z1bGxuYW1lXSA9IGF0dHJzXG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV1bJ21ldGhvZHMnXSA/PSBbXVxuXHRcdFx0XHRzdG9yZS5jbGFzc2VzW2NsYXNzRnVsbE5hbWVdWydtZXRob2RzJ10ucHVzaChcIiN7YXR0cnNbJ25hbWUnXX0oKVwiKVxuXG5cblx0cmVhZEFzZG9jRmllbGQ6IChsaXN0KSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cblx0XHQjIGF0dHJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIG5hbWU6ICd0ZXN0UHJvcCcsXG5cdFx0IyBmdWxsbmFtZTogJ2RvY1NhbXBsZXM6VGVzdDEvdGVzdFByb3AnLFxuXHRcdCMgdHlwZTogJ1N0cmluZycsXG5cdFx0IyBpc1N0YXRpYzogJ2ZhbHNlJyxcblx0XHQjIGlzQ29uc3Q6ICdmYWxzZSdcblx0XHQjIGVsZW1lbnRzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGRlc2NyaXB0aW9uOmFycmF5PHN0cmluZz5cblx0XHQjIG1ldGFkYXRhOmFycmF5PG9iamVjdD5cblxuXHRcdGZvciBzb3VyY2UgaW4gbGlzdFxuXHRcdFx0aWYgQGlzUHJpdmF0ZUZpZWxkKHNvdXJjZSkgdGhlbiBjb250aW51ZVxuXG5cdFx0XHRhdHRycyA9IHNvdXJjZVsnJCddXG5cdFx0XHRhcnIgPSBhdHRyc1snZnVsbG5hbWUnXS5zcGxpdCgnLycpXG5cdFx0XHRjbGFzc0Z1bGxOYW1lID0gYXJyWzBdXG5cdFx0XHRuYW1lc3BhY2UgPSBpZiBjbGFzc0Z1bGxOYW1lLmluZGV4T2YoJzonKSA+IC0xIHRoZW4gY2xhc3NGdWxsTmFtZS5zcGxpdCgnOicsIDEpWzBdIGVsc2UgJydcblx0XHRcdHthY2Nlc3NvciwgcHJvcGVydHlOYW1lfSA9IEBzcGxpdEFjY2Vzc29yKGFyclsxXSlcblx0XHRcdGZ1bGxuYW1lID0gXCIje2NsYXNzRnVsbE5hbWV9IyN7cHJvcGVydHlOYW1lfVwiXG5cblx0XHRcdCNjb25zb2xlLmxvZyhhdHRyc1snZnVsbG5hbWUnXSwgbmFtZXNwYWNlKVxuXG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRcdGlmIG5hbWUgaXMgJyQnIHRoZW4gY29udGludWVcblx0XHRcdFx0YXR0cnNbbmFtZV0gPSBAY2xlYXJCbGFuayh2YWx1ZSlcblxuXHRcdFx0YXR0cnNbJ2Z1bGxuYW1lJ10gPSBmdWxsbmFtZVxuXHRcdFx0YXR0cnNbJ2FjY2Vzc29yJ10gPSBpZiBhY2Nlc3NvciBpcyBuYW1lc3BhY2UgdGhlbiAnaW50ZXJuYWwnIGVsc2UgYWNjZXNzb3JcblxuXHRcdFx0aWYgYXR0cnNbJ2lzQ29uc3QnXS50b1N0cmluZygpIGlzICd0cnVlJ1xuXHRcdFx0XHRhdHRyc1sncHJvcGVydHlUeXBlJ10gPSAnY29uc3RhbnQnXG5cdFx0XHRcdGF0dHJzWydyZWFkd3JpdGUnXSA9ICdyZWFkb25seSdcblx0XHRcdGVsc2Vcblx0XHRcdFx0YXR0cnNbJ3Byb3BlcnR5VHlwZSddID0gJ3ZhcmlhYmxlJ1xuXHRcdFx0XHRhdHRyc1sncmVhZHdyaXRlJ10gPSAncmVhZHdyaXRlJ1xuXG5cdFx0XHQjY29uc29sZS5sb2coYXR0cnMpXG5cblx0XHRcdGlmIHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV0/XG5cdFx0XHRcdHN0b3JlLnByb3BlcnRpZXNbZnVsbG5hbWVdID0gYXR0cnNcblx0XHRcdFx0c3RvcmUuY2xhc3Nlc1tjbGFzc0Z1bGxOYW1lXVsncHJvcGVydGllcyddID89IFtdXG5cdFx0XHRcdHN0b3JlLmNsYXNzZXNbY2xhc3NGdWxsTmFtZV1bJ3Byb3BlcnRpZXMnXS5wdXNoKGF0dHJzWyduYW1lJ10pXG5cblxuXHQjIG5zX2ludGVybmFsOipcblx0IyBwcm90ZWN0ZWQ6KlxuXHQjIHByaXZhdGU6KlxuXHQjIG5hbWUuc3BhY2U6KlxuXHQjICpcblx0IyBAcmV0dXJuIHsgYWNjZXNzb3IgOiAncHVibGljJywgcHJvcGVydHlOYW1lIDogJyonIH1cblx0c3BsaXRBY2Nlc3NvcjogKG5hbWUpIC0+XG5cdFx0YWNjZXNzb3JJbmRleCA9IG5hbWUuaW5kZXhPZignOicpXG5cdFx0aWYgYWNjZXNzb3JJbmRleCA+IC0xXG5cdFx0XHRhY2Nlc3NvciA9IG5hbWUuc3Vic3RyaW5nKDAsIGFjY2Vzc29ySW5kZXgpXG5cdFx0XHRwcm9wZXJ0eU5hbWUgPSBuYW1lLnN1YnN0cmluZyhhY2Nlc3NvckluZGV4ICsgMSlcblx0XHRlbHNlXG5cdFx0XHRhY2Nlc3NvciA9ICdwdWJsaWMnXG5cdFx0XHRwcm9wZXJ0eU5hbWUgPSBuYW1lXG5cblx0XHRyZXR1cm4geyBhY2Nlc3NvciA6IGFjY2Vzc29yLCBwcm9wZXJ0eU5hbWUgOiBwcm9wZXJ0eU5hbWUgfVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyBAIHJlYWQgQ2xhc3MueWFtbFxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdHJlYWRDbGFzc1lhbWw6IChjYWxsYmFjaykgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdFxuXHRcdGFyciA9IFtdXG5cdFx0XG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHN0b3JlLmNsYXNzZXNcblx0XHRcdGFyci5wdXNoKHZhbHVlKVxuXHRcdFx0XG5cdFx0Zm9yIG5hbWUsIHZsYXVlIG9mIHN0b3JlLmludGVyZmFjZXNcblx0XHRcdGFyci5wdXNoKHZhbHVlKVxuXHRcdFxuXHRcdGFzeW5jLmVhY2hTZXJpZXMoYXJyLCBAcmVhZENsYXNzWWFtbFRhc2tGdW5jdGlvbiwgY2FsbGJhY2spXG5cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyB0YXNrIGZ1bmN0aW9uXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdHJlYWRDbGFzc1lhbWxUYXNrRnVuY3Rpb246ICh0eXBlSW5mbywgY2FsbGJhY2spID0+XG5cdFx0c291cmNlZmlsZSA9IHR5cGVJbmZvWydzb3VyY2VmaWxlJ11cblx0XHR5YW1sUGF0aCA9IHNvdXJjZWZpbGUucmVwbGFjZSgkcGF0aC5leHRuYW1lKHNvdXJjZWZpbGUpLCAnLnlhbWwnKVxuXHRcdFxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGNhbmNlbCB0YXNrIGlmIG5vdCBleGlzdHMgeWFtbCBmaWxlXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdGlmIG5vdCAkZnMuZXhpc3RzU3luYyh5YW1sUGF0aClcblx0XHRcdGNhbGxiYWNrKClcblx0XHRcdHJldHVyblxuXG5cdFx0c291cmNlID0geWFtbC5zYWZlTG9hZCgkZnMucmVhZEZpbGVTeW5jKHlhbWxQYXRoLCB7ZW5jb2Rpbmc6J3V0ZjgnfSkpXG5cdFx0XG5cdFx0dHlwZUZ1bGxOYW1lID0gdHlwZUluZm9bJ2Z1bGxuYW1lJ11cblx0XHRcblx0XHRtZXRob2ROYW1lUmVnID0gL1thLXpBLVowLTlcXF9dK1xcKFxcKS9cblx0XHRcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2Ygc291cmNlXG5cdFx0XHRpZiBuYW1lIGlzICdjbGFzcycgb3IgbmFtZSBpcyAnaW50ZXJmYWNlJ1xuXHRcdFx0XHRAam9pbkNsYXNzWWFtbENsYXNzSW5mbyh0eXBlSW5mbywgdmFsdWUpXG5cdFx0XHRcdFxuXHRcdFx0ZWxzZSBpZiBtZXRob2ROYW1lUmVnLnRlc3QobmFtZSlcblx0XHRcdFx0bWV0aG9kSW5mbyA9IEBzdG9yZS5tZXRob2RzW1wiI3t0eXBlRnVsbE5hbWV9IyN7bmFtZX1cIl1cblx0XHRcdFx0aWYgbWV0aG9kSW5mbz8gdGhlbiBAam9pbkNsYXNzWWFtbE1ldGhvZEluZm8obWV0aG9kSW5mbywgdmFsdWUpXG5cdFx0XHRcdFxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRwcm9wZXJ0eUluZm8gPSBAc3RvcmUucHJvcGVydGllc1tcIiN7dHlwZUZ1bGxOYW1lfSMje25hbWV9XCJdXG5cdFx0XHRcdGlmIHByb3BlcnR5SW5mbz8gdGhlbiBAam9pbkNsYXNzWWFtbEZpZWxkSW5mbyhwcm9wZXJ0eUluZm8sIHZhbHVlKVxuXHRcdFxuXHRcdGNhbGxiYWNrKClcblx0XHRcblx0XHRcblx0am9pbkNsYXNzWWFtbENsYXNzSW5mbzogKG9yaWdpbiwgc291cmNlKSA9PlxuXHRcdGF2YWxhYmxlUHJvcGVydGllcyA9IFxuXHRcdFx0ZGVzY3JpcHRpb246IHRydWVcblx0XHRcdHNlZTogdHJ1ZVxuXHRcdFx0dGhyb3dzOiB0cnVlXG5cdFx0XHRpbmNsdWRlRXhhbXBsZTogdHJ1ZVxuXHRcdFxuXHRcdEBqb2luSW5mbyhvcmlnaW4sIHNvdXJjZSwgYXZhbGFibGVQcm9wZXJ0aWVzKVxuXHRcdFxuXHRqb2luQ2xhc3NZYW1sRmllbGRJbmZvOiAob3JpZ2luLCBzb3VyY2UpID0+XG5cdFx0YXZhbGFibGVQcm9wZXJ0aWVzID0gXG5cdFx0XHRkZXNjcmlwdGlvbjogdHJ1ZVxuXHRcdFx0c2VlOiB0cnVlXG5cdFx0XHR0aHJvd3M6IHRydWVcblx0XHRcdGluY2x1ZGVFeGFtcGxlOiB0cnVlXG5cdFx0XG5cdFx0QGpvaW5JbmZvKG9yaWdpbiwgc291cmNlLCBhdmFsYWJsZVByb3BlcnRpZXMpXG5cdFx0XG5cdGpvaW5DbGFzc1lhbWxNZXRob2RJbmZvOiAob3JpZ2luLCBzb3VyY2UpID0+XG5cdFx0YXZhbGFibGVQcm9wZXJ0aWVzID0gXG5cdFx0XHRkZXNjcmlwdGlvbjogdHJ1ZVxuXHRcdFx0c2VlOiB0cnVlXG5cdFx0XHR0aHJvd3M6IHRydWVcblx0XHRcdGluY2x1ZGVFeGFtcGxlOiB0cnVlXG5cdFx0XHQncmV0dXJuJzogdHJ1ZVxuXHRcdFxuXHRcdEBqb2luSW5mbyhvcmlnaW4sIHNvdXJjZSwgYXZhbGFibGVQcm9wZXJ0aWVzKVxuXHRcdFxuXHRqb2luSW5mbzogKG9yaWdpbiwgc291cmNlLCBhdmFsYWJsZVByb3BlcnRpZXMpID0+XG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHNvdXJjZVxuXHRcdFx0aWYgYXZhbGFibGVQcm9wZXJ0aWVzW25hbWVdIGlzIHRydWVcblx0XHRcdFx0b3JpZ2luW25hbWVdID0gQGpvaW5Qcm9wZXJ0aWVzKG9yaWdpbltuYW1lXSwgQGNsZWFyQmxhbmsoc291cmNlW25hbWVdKSwgdHJ1ZSlcblx0XHRcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgQCByZWFkIG5hbWVzcGFjZS55YW1sXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0cmVhZE5hbWVzcGFjZVlhbWw6IChjYWxsYmFjaykgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdHNvdXJjZURpcmVjdG9yaWVzID0gQGNvbGxlY3Rvci5nZXRTb3VyY2VEaXJlY3RvcmllcygpXG5cdFx0bmFtZXNwYWNlSW5mb3MgPSBbXVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgbmFtZXNwYWNlSW5mbyA9IHN0b3JlLm5hbWVzcGFjZSAqIHNvdXJjZSBkaXJlY3Rvcmllc1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRmb3IgbmFtZXNwYWNlLCB2YWx1ZXMgb2Ygc3RvcmUubmFtZXNwYWNlc1xuXHRcdFx0bmFtZXNwYWNlUGF0aCA9IG5hbWVzcGFjZS5zcGxpdCgnLicpLmpvaW4oJHBhdGguc2VwKVxuXG5cdFx0XHRmb3Igc291cmNlRGlyZWN0b3J5IGluIHNvdXJjZURpcmVjdG9yaWVzXG5cdFx0XHRcdHlhbWxQYXRoID0gJHBhdGguam9pbihzb3VyY2VEaXJlY3RvcnksIG5hbWVzcGFjZVBhdGgsICduYW1lc3BhY2UueWFtbCcpXG5cblx0XHRcdFx0IyBhZGQgbmFtZXNwYWNlSW5mb3Ncblx0XHRcdFx0bmFtZXNwYWNlSW5mb3MucHVzaFxuXHRcdFx0XHRcdHlhbWxQYXRoOiB5YW1sUGF0aFxuXHRcdFx0XHRcdG5hbWVzcGFjZTogbmFtZXNwYWNlXG5cdFx0XHRcdFx0dmFsdWVzOiB2YWx1ZXNcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIGVhY2ggbmFtZXNwYWNlSW5mb3Ncblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0YXN5bmMuZWFjaFNlcmllcyhuYW1lc3BhY2VJbmZvcywgQHJlYWROYW1lc3BhY2VZYW1sVGFza0Z1bmN0aW9uLCBjYWxsYmFjaylcblxuXHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQjIHRhc2sgZnVuY3Rpb25cblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0cmVhZE5hbWVzcGFjZVlhbWxUYXNrRnVuY3Rpb246IChuYW1lc3BhY2VJbmZvLCBjYWxsYmFjaykgPT5cblx0XHRzdG9yZSA9IEBzdG9yZVxuXHRcdHlhbWxQYXRoID0gbmFtZXNwYWNlSW5mb1sneWFtbFBhdGgnXVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgY2FuY2VsIHRhc2sgaWYgbm90IGV4aXN0cyB5YW1sIGZpbGVcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0aWYgbm90ICRmcy5leGlzdHNTeW5jKHlhbWxQYXRoKVxuXHRcdFx0Y2FsbGJhY2soKVxuXHRcdFx0cmV0dXJuXG5cblxuXHRcdHZhbHVlcyA9IG5hbWVzcGFjZUluZm9bJ3ZhbHVlcyddXG5cdFx0bmFtZXNwYWNlID0gbmFtZXNwYWNlSW5mb1snbmFtZXNwYWNlJ11cblx0XHRzb3VyY2UgPSB5YW1sLnNhZmVMb2FkKCRmcy5yZWFkRmlsZVN5bmMoeWFtbFBhdGgsIHtlbmNvZGluZzondXRmOCd9KSlcblxuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQjIHJlYWQgbWFuaWZlc3Qgc3BlY1xuXHRcdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHRpZiBzb3VyY2VbJ25hbWVzcGFjZSddPyBhbmQgc291cmNlWydjb21wb25lbnRzJ10/IGFuZCBzb3VyY2VbJ2NvbXBvbmVudHMnXS5sZW5ndGggPiAwXG5cdFx0XHQjIGNvbnZlcnQgY2xhc3NuYW1lIHRvIGZ1bGxuYW1lIGlmIGV4aXN0cyBuYW1lc3BhY2Vcblx0XHRcdCMgQ29tcG9uZW50IC0tPiBuYW1lLnNwYWNlOkNvbXBvbmVudFxuXHRcdFx0aWYgbmFtZXNwYWNlIGlzbnQgJydcblx0XHRcdFx0bmV3Q29tcG9uZW50cyA9IFtdXG5cdFx0XHRcdGZvciBjb21wb25lbnQgaW4gc291cmNlWydjb21wb25lbnRzJ11cblx0XHRcdFx0XHRuZXdDb21wb25lbnRzLnB1c2gobmFtZXNwYWNlICsgJzonICsgY29tcG9uZW50KVxuXHRcdFx0XHRzb3VyY2VbJ2NvbXBvbmVudHMnXSA9IG5ld0NvbXBvbmVudHNcblxuXHRcdFx0IyBtYW5pZmVzdE5hbWVzcGFjZSA9ICdodHRwOi8vbnMuY29tL25zJ1xuXHRcdFx0bWFuaWZlc3ROYW1lc3BhY2UgPSBAY2xlYXJCbGFuayhzb3VyY2VbJ25hbWVzcGFjZSddKVxuXG5cdFx0XHQjIGNyZWF0ZSBtYW5pZmVzdCBvYmplY3QgaWYgbm90IGV4aXN0c1xuXHRcdFx0c3RvcmUubWFuaWZlc3RzW21hbmlmZXN0TmFtZXNwYWNlXSA/PSB7fVxuXHRcdFx0bWFuaWZlc3QgPSBzdG9yZS5tYW5pZmVzdHNbbWFuaWZlc3ROYW1lc3BhY2VdXG5cblx0XHRcdCMgc2F2ZSBtYW5pZmVzdCBjb21wb25lbnRzXG5cdFx0XHQjIHNvdHJlLm1hbmlmZXN0c1snaHR0cDovL25zLmNvbS9ucyddWydjb21wb25lbnRzJ10gPSAnbmFtZS5zcGFjZTpDb21wb25lbnQnXG5cdFx0XHRtYW5pZmVzdFsnY29tcG9uZW50cyddID89IFtdXG5cblx0XHRcdGZvciBjb21wb25lbnQgaW4gc291cmNlWydjb21wb25lbnRzJ11cblx0XHRcdFx0bWFuaWZlc3RbJ2NvbXBvbmVudHMnXS5wdXNoKEBjbGVhckJsYW5rKGNvbXBvbmVudCkpXG5cblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0IyBzYXZlIG5hbWVzcGFjZS55YW1sIHZhbHVlcyB0byBuYW1lc3BhY2UgaW5mb1xuXHRcdCMgc3RvcmUubmFtZXNwYWNlc1snbmFtZS5zcGFjZSddW25hbWVdID0gdmFsdWVcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0dmFsdWVzWydkZXNjcmlwdGlvbiddID0gQGpvaW5Qcm9wZXJ0aWVzKHZhbHVlc1snZGVzY3JpcHRpb24nXSwgc291cmNlWydkZXNjcmlwdGlvbiddKVxuXG5cdFx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdCMgZW5kIHRhc2tcblx0XHQjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0Y2FsbGJhY2soKVxuXG5cdCM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0IyB1dGlsc1xuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgdG9wbGV2ZWwueG1sIHV0aWxzXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdGlzUHJpdmF0ZUZpZWxkOiAoc291cmNlKSAtPlxuXHRcdHJldHVybiBzb3VyY2VbJyQnXVsnZnVsbG5hbWUnXS5pbmRleE9mKCcvcHJpdmF0ZTonKSA+IC0xIG9yIHNvdXJjZVsncHJpdmF0ZSddP1xuXG5cdCMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCMgYmFzaWMgdXRpbHNcblx0Iy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0IyByZW1vdmUgYWxsIGZyb250IGFuZCBiYWNrIHNwYWNlIGNoYXJhY3RlciBvZiBzdHJpbmdcblx0Y2xlYXJCbGFuazogKG9iaikgLT5cblx0XHRyZWdleHAgPSAvXlxccyp8XFxzKiQvZ1xuXHRcdFxuXHRcdGlmIHR5cGVvZiBvYmogaXMgJ3N0cmluZydcblx0XHRcdHJldHVybiBvYmoucmVwbGFjZShyZWdleHAsICcnKVxuXHRcdFx0XG5cdFx0ZWxzZSBpZiBvYmogaW5zdGFuY2VvZiBBcnJheSBhbmQgb2JqLmxlbmd0aCA+IDBcblx0XHRcdGZvciBpIGluIFswLi5vYmoubGVuZ3RoLTFdXG5cdFx0XHRcdGlmIHR5cGVvZiBvYmpbaV0gaXMgJ3N0cmluZydcblx0XHRcdFx0XHRvYmpbaV0gPSBvYmpbaV0ucmVwbGFjZShyZWdleHAsICcnKVxuXHRcdFx0XHRcdFxuXHRcdHJldHVybiBvYmpcblxuXHQjIG5hbWUuc3BhY2U6Q2xhc3MxO25hbWUuc3BhY2UuQ2xhc3MyIC0tPiBbbmFtZS5zcGFjZS5DbGFzczEsIG5hbWUuc3BhY2UuQ2xhc3MyXVxuXHRzZW1pY29sb25TdHJpbmdUb0FycmF5OiAoc3RyKSAtPlxuXHRcdGlmIHN0cj8gb3Igc3RyIGlzICcnXG5cdFx0XHRzdHIuc3BsaXQoJzsnKVxuXHRcdGVsc2Vcblx0XHRcdCcnXG5cblx0am9pblByb3BlcnRpZXM6IChwcmltYXJ5LCBzZWNvbmRhcnksIG92ZXJyaWRlVG9TZWNvbmRhcnkgPSBmYWxzZSkgLT5cblx0XHRpZiBwcmltYXJ5PyBhbmQgc2Vjb25kYXJ5PyBhbmQgcHJpbWFyeSBpbnN0YW5jZW9mIEFycmF5XG5cdFx0XHRpZiBzZWNvbmRhcnkgaW5zdGFuY2VvZiBBcnJheVxuXHRcdFx0XHRyZXR1cm4gcHJpbWFyeS5jb25jYXQoc2Vjb25kYXJ5KVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRwcmltYXJ5LnB1c2goc2Vjb25kYXJ5KVxuXHRcdFx0XHRyZXR1cm4gcHJpbWFyeVxuXHRcdGVsc2UgaWYgcHJpbWFyeT8gYW5kIHNlY29uZGFyeT9cblx0XHRcdHJldHVybiBpZiBvdmVycmlkZVRvU2Vjb25kYXJ5IHRoZW4gc2Vjb25kYXJ5IGVsc2UgcHJpbWFyeVxuXHRcdGVsc2UgaWYgbm90IHByaW1hcnk/IGFuZCBzZWNvbmRhcnk/XG5cdFx0XHRyZXR1cm4gc2Vjb25kYXJ5XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIHByaW1hcnlcblxuXHQjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdCMgZGVidWcgOiB0cmFjZSBzdG9yZSBvYmplY3Rcblx0Iz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRwcmludFN0b3JlOiAoKSA9PlxuXHRcdHN0b3JlID0gQHN0b3JlXG5cdFx0XG5cdFx0aW50ZXJmYWNlcyA9IHN0b3JlLmludGVyZmFjZXNcblx0XHRjbGFzc2VzID0gc3RvcmUuY2xhc3Nlc1xuXHRcdG5hbWVzcGFjZXMgPSBzdG9yZS5uYW1lc3BhY2VzXG5cdFx0bWV0aG9kcyA9IHN0b3JlLm1ldGhvZHNcblx0XHRwcm9wZXJ0aWVzID0gc3RvcmUucHJvcGVydGllc1xuXHRcdG1hbmlmZXN0cyA9IHN0b3JlLm1hbmlmZXN0c1xuXHRcblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBuYW1lc3BhY2VzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgbmFtZXNwYWNlc1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogaW50ZXJmYWNlcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIGludGVyZmFjZXNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IGNsYXNzZXMnKVxuXHRcdGZvciBuYW1lLCB2YWx1ZSBvZiBjbGFzc2VzXG5cdFx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tIDonLCBuYW1lKVxuXHRcdFx0Y29uc29sZS5sb2codmFsdWUpXG5cblx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT09PT0gOiBtZXRob2RzJylcblx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgbWV0aG9kc1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXG5cdFx0Y29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09PT09IDogcHJvcGVydGllcycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIHByb3BlcnRpZXNcblx0XHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0gOicsIG5hbWUpXG5cdFx0XHRjb25zb2xlLmxvZyh2YWx1ZSlcblxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IG1hbmlmZXN0cycpXG5cdFx0Zm9yIG5hbWUsIHZhbHVlIG9mIG1hbmlmZXN0c1xuXHRcdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLSA6JywgbmFtZSlcblx0XHRcdGNvbnNvbGUubG9nKHZhbHVlKVxuXHRcdFx0XG5cdFxuXHRcdFxuXHRwcmludEZpZWxkcyA6ICgpID0+XG5cdFx0c3RvcmUgPSBAc3RvcmVcblx0XHRcblx0XHRwcmludCA9IChjb2xsZWN0aW9uKSAtPlxuXHRcdFx0ZmllbGRzID0ge31cblx0XHRcdFxuXHRcdFx0Zm9yIGNvbGxlY3Rpb25OYW1lLCBjb2xsZWN0aW9uVmFsdWUgb2YgY29sbGVjdGlvblxuXHRcdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgY29sbGVjdGlvblZhbHVlXG5cdFx0XHRcdFx0ZmllbGRzW25hbWVdID0gdHlwZW9mIHZhbHVlIGlmIG5vdCBmaWVsZHNbbmFtZV0/XG5cdFx0XHRcdFx0XG5cdFx0XHRmb3IgbmFtZSwgdmFsdWUgb2YgZmllbGRzXG5cdFx0XHRcdGNvbnNvbGUubG9nKG5hbWUsICc6JywgdmFsdWUpXG5cdFx0XHRcdFxuXHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PSA6IGZpZWxkIGluZm9zJylcblx0XHRjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0gOiBuYW1lc3BhY2UgZmllbGRzJylcblx0XHRwcmludChzdG9yZS5uYW1lc3BhY2VzKVxuXHRcdFxuXHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLSA6IGludGVyZmFjZSBmaWVsZHMnKVxuXHRcdHByaW50KHN0b3JlLmludGVyZmFjZXMpXG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tIDogY2xhc3MgZmllbGRzJylcblx0XHRwcmludChzdG9yZS5jbGFzc2VzKVxuXHRcdFxuXHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLSA6IG1ldGhvZCBmaWVsZHMnKVxuXHRcdHByaW50KHN0b3JlLm1ldGhvZHMpXG5cdFx0XG5cdFx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tIDogcHJvcGVydHkgZmllbGRzJylcblx0XHRwcmludChzdG9yZS5wcm9wZXJ0aWVzKVxuXHRcdFxuXHRcdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLSA6IG1hbmlmZXN0IGZpZWxkcycpXG5cdFx0cHJpbnQoc3RvcmUubWFuaWZlc3RzKVxuXG4jIGNvbXBsZXRlID0gYGZ1bmN0aW9uKGVycm9yLCBkaWMpYFxuIyBkaWNbbmFtZS5zcGFjZS5DbGFzc11cdFtwcm9wZXJ0eV1cdFx0PSBodHRwOi8vfi9uYW1lL3NwYWNlL0NsYXNzLmh0bWwjcHJvcGVydHlcbiMgZGljW25hbWUuc3BhY2UuQ2xhc3NdXHRbbWV0aG9kKCldXHRcdD0gaHR0cDovL34vbmFtZS9zcGFjZS9DbGFzcy5odG1sI21ldGhvZCgpXG4jIGRpY1tuYW1lLnNwYWNlXVx0XHRbbWV0aG9kKCldXHRcdD0gaHR0cDovL34vbmFtZS9zcGFjZS8jbWV0aG9kKCkgPz8/XG4jIGRpY1tuYW1lLnNwYWNlLkNsYXNzXVx0W3N0eWxlOm5hbWVdXHQ9IGh0dHA6Ly9+L25hbWUvc3BhY2UvQ2xhc3MuaHRtbCNzdHlsZTpuYW1lXG4jIGdldEFzZG9jSW5kZXg6ICh1cmwsIGNvbXBsZXRlKSAtPlxuIyBodHRwOi8vaGVscC5hZG9iZS5jb20va29fS1IvRmxhc2hQbGF0Zm9ybS9yZWZlcmVuY2UvYWN0aW9uc2NyaXB0LzMvYWxsLWluZGV4LUEuaHRtbFxuIyBodHRwOi8vZmxleC5hcGFjaGUub3JnL2FzZG9jL2FsbC1pbmRleC1CLmh0bWxcblxuXG5cbiMgZ2V0IGFsbC1pbmRleC1BIH4gWlxuIyBwYXJzZSBhbmQgZmluZCBjbGFzcz1cImlkeHJvd1wiXG4jIGRpY1suLl1bLi5dID0gdXJsXG4jIGNvbXBsZXRlKGVycm9yLCBkaWMpXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEZsZG9jIl19