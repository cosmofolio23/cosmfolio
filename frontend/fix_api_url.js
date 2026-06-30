const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
            let content = fs.readFileSync(p, 'utf8');
            if (content.includes("|| 'http://localhost:8000'")) {
                content = content.replace(/\|\| 'http:\/\/localhost:8000'/g, "|| 'https://cosmfolio-production.up.railway.app'");
                fs.writeFileSync(p, content);
                console.log('Updated ' + p);
            }
        }
    });
}

walk('e:/Projects/My Product/BUILDING APP/ArchPortfolio_Generator/frontend/src');
