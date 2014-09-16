var jsdom = require('jsdom')

var asdoc = 'http://flex.apache.org/asdoc/'

jsdom.env(
    asdoc + 'all-index-A.html',
    ['http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js'],
    function(errors, window) {
        console.log(errors)
        
        var classes = {}
        var classMembers = {}
        var classpath
        
        var $ = window.$
        var nodes = $('.idxrow')
        console.log(nodes.length)
        nodes.each(function(index) {
            var url = $(this).children('a:first').attr('href')
            var arr = url.split('#')
            var html, anchor
            
            if (arr.length === 2) {
                html = arr[0]
                anchor = arr[1]
            } else if (arr.length === 1) {
                html = arr[0]
            } else {
                return
            }
            
            classpath = html.substring(0, html.length - 5).replace(/\//g, '.')
            
            if (anchor) {
                if (classMembers[classpath] === undefined) {
                    classMembers[classpath] = {}
                }
                
                classMembers[classpath][anchor] = asdoc + url
            } else {
                if (classes[classpath] === undefined) {
                    classes[classpath] = asdoc + url
                }
            }
            
            // console.log(index, classpath, anchor)
        })
        
        for (clsspath in classes) {
            console.log(classpath, classes[classpath])
        }
        
        for (classpath in classMembers) {
            var members = classMembers[classpath]
            
            for (var member in members) {
                console.log(classpath, member, members[member])
            }
        }
    }
)