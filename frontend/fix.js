const fs = require('fs');
const path = 'e:/Projects/My Product/BUILDING APP/ArchPortfolio_Generator/frontend/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>`;

const brokenIn9c42953 = `<a href="https://www.linkedin.com/company/cosmo-atelier" target="_blank" rel="noopener noreferrer" className="text-stone-light hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>`;

// Actually the broken part in 9c42953 (which I saw earlier in lines 490-520):
const exactBroken = `                <a href="https://www.linkedin.com/company/cosmo-atelier" target="_blank" rel="noopener noreferrer" className="text-stone-light hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>`;

const exactBrokenInFile = `                <a href="https://www.linkedin.com/company/cosmo-atelier" target="_blank" rel="noopener noreferrer" className="text-stone-light hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>`;

// No wait, in 9c42953 line 492 was `                <a href="https://www.linkedin.com/company/cosmo-atelier"...`
// and it didn't have `</a>` after it!
// Let me just search for the exact string and replace it using regex.

let match = content.match(/<a href="https:\/\/www\.linkedin\.com\/company\/cosmo-atelier"[\s\S]*?<svg[\s\S]*?<\/svg>(\r?\n\s*<li><a)/);

if (match) {
    content = content.replace(match[0], match[0].replace(/<\/svg>/, '</svg>\n                </a>\n              </div>\n            </div>'));
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed page.tsx footer via regex");
} else {
    console.log("Could not find regex match");
}
