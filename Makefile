test-local:
	gulp parse-coffee
	mocha --require should

travis:

test-c9:
	gulp parse-coffee
	node asdoc-compile.js
	node asdoc-parsexml.js