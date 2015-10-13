///<reference path="../../typings/tsd.d.ts"/>

//==========================================================================================
// node_modules
//==========================================================================================
declare module 'file-picker' {
	export interface File {
		realpath:string;
		path:string;
		relative_path:string;
		base:string;
		relative_base:string;
		name:string;
		extension:string;
		atime:number;
		mtime:number;
		ctime:number;
	}

	export function pick(directory:string|string[], pickTypes:string[], callback:(files:File[], lastModifiedTime?:number) => void)
}

//declare module 'xml2js' {
//	export function parseString(xmlString:string, callback:(error:Error, result:any) => void);
//
//	export class Builder {
//		constructor(opts?:Object);
//
//		buildObject(obj:Object):string;
//	}
//}
//
//declare module 'js-yaml' {
//	export function safeLoad(yamlString:string):any;
//}

//==========================================================================================
// models
//==========================================================================================
interface ASClass {
	realpath:string;
	path:string;
	relative_path:string;
	base:string;
	relative_base:string;
	name:string;
	extension:string;
	atime:number;
	mtime:number;
	ctime:number;
	classpath:string;
}

interface Namespace {
	uri:string
	manifest:string
}

interface NamespaceYaml {
	namespace:string
	components:string[]
	description: string
}

interface Component {
	name:string
	path:string
}
