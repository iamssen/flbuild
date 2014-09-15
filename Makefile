test-local:
	gulp parse-coffee
	mocha --require should

travis:

test-c9:
	gulp parse-coffee
	node compile-lib.js