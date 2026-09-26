const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.jsx')) results.push(file);
    });
    return results;
}

const files = walk('C:\\wamp64\\www\\CarRepairSystem\\CarRepairShop\\src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    content = content.replace(/\banimate-fade-in\b/g, '');
    content = content.replace(/\banimate-pulse\b/g, '');
    content = content.replace(/\banimate-spin\b/g, '');
    
    // clean up duplicate spaces
    content = content.replace(/className="([^"]*)"/g, (match, p1) => {
        return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
});
