var xml2js = require('xml2js')
	, fs = require('fs')
	, marked = require('marked')
	, async = require('async')

var parser = new xml2js.Parser()
var $namespaces = {}

// [name.space:Class] = 
//		-- from classRec toplevel.xml
// 		name: 'EmailRenderer',
// 		fullname: 'mailer.views:EmailRenderer',
// 		sourcefile: '/home/ubuntu/workspace/flbuild/test/project/src/mailer/views/EmailRenderer.mxml',
// 		namespace: 'mailer.views',
// 		access: 'public',
// 		baseclass: 'spark.components.supportClasses:ItemRenderer',
// 		interfaces: 'mx.binding:IBindingClient',
// 		isFinal: 'false',
// 		isDynamic: 'false'
// metadatas
// see
// description
// methods
// properties
// constants
var $classes = {}

// 1 register classRec info from toplevel.xml
// description 등의 정보가 없다
function read_classRec_from_toplevel_xml(list) {
	var f = -1, fmax = list.length
		
	while(++f < fmax) {
		// name: 'EmailRenderer',
		// fullname: 'mailer.views:EmailRenderer',
		// sourcefile: '/home/ubuntu/workspace/flbuild/test/project/src/mailer/views/EmailRenderer.mxml',
		// namespace: 'mailer.views',
		// access: 'public',
		// baseclass: 'spark.components.supportClasses:ItemRenderer',
		// interfaces: 'mx.binding:IBindingClient',
		// isFinal: 'false',
		// isDynamic: 'false'
		
		var source = list[f]
		var attrs = source['$']
		var description = source['description']
		// undefined or [ 'mailer.views.EmailRenderer\n', 'flash.display.Sprite\n' ]
		var see = source['see'] 
		var metadata = source['metadata'] // undefined
		
		console.log(list[f])
		
		// register classes
		$classes[attrs.fullname] = attrs
		
		// register namespace
		if ($namespaces[attrs.namespace] === undefined) {
			$namespaces[attrs.namespace] = {}
		}
		
		var ns = $namespaces[attrs.namespace]
		
		if (!ns.classes) {
			ns.classes = []
		}
		
		ns.classes.push(attrs.fullname)
	}
}

// toplevel.xml 에는 description 등의 정보가 없다?
function read_method_from_toplevel_xml(list) {
	var f = -1, fmax = list.length
	
	while(++f < fmax) {
		// ----------
		// name: 'email',
		// fullname: 'mailer.models:Email/email/set',
		// isStatic: 'false',
		// isFinal: 'false',
		// isOverride: 'false',
		// param_names: 'value',
		// param_types: 'String',
		// param_defaults: 'undefined',
		// result_type: 'void'
		// ----------
		// name: 'addEventListener',
		// fullname: 'mailer.models:Email/addEventListener',
		// isStatic: 'false',
		// isFinal: 'false',
		// isOverride: 'false',
		// param_names: 'type;listener;useCapture;priority;weakRef',
		// param_types: 'String;Function;Boolean;int;Boolean',
		// param_defaults: 'undefined;undefined;false;0;false',
		// result_type: 'void'
		var source = list[f]['$']
		
		console.log(source)
	}
}

// tasks
function read_toplevel_xml(callback) {
	parser.parseString(fs.readFileSync('.asdoc_cache/toplevel.xml'), function(err, data) {
		var classRec = data.asdoc.classRec
			, method = data.asdoc.method
			, field = data.asdoc.field
			, packageRec = data.asdoc.packageRec
		
		console.log('-----------------------------------')	
		read_classRec_from_toplevel_xml(classRec)
		console.log('-----------------------------------')	
		//console.log(method)
		// read_method_from_toplevel_xml(method)
		console.log('-----------------------------------')	
		//console.log(field)
		console.log('-----------------------------------')	
		//// console.log(packageRec)
		
		process.exit(0)
	})
}

async.waterfall([read_toplevel_xml], function(err, result) {
	console.log(err, result)
})