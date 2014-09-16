var yaml = require('js-yaml')
    , fs = require('fs')
    , marked = require('marked')

var contents = yaml.safeLoad(fs.readFileSync('asdoc.yaml', 'utf8'))
var names = []
var name

for (name in contents) {
    if (name !== 'class') {
        names.push(name) 
    }
}

console.log(names)

names.sort()

console.log(names)

marked.setOptions({
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    santize: true,
    smartLists: true,
    smartypants: false
})

function printContent(name, content) {
    console.log('-------------------------------------')
    console.log(name)
    for (var prop in content) {
        if (prop !== 'description') {
            console.log('@' + prop + ' : ' + content[prop])
        }
    }
    
    if (content['description'] !== undefined) {
        console.log(marked(content['description']))
    }
}

var f = -1
var fmax = names.length
var content

if (contents['class'] !== undefined) {
    printContent('class', contents['class'])
}

while(++f < fmax) {
    name = names[f]
    content = contents[name]
    
    printContent(name, content)
}