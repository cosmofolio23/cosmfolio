const fs = require('fs');
const path = 'e:/Projects/My Product/BUILDING APP/ArchPortfolio_Generator/frontend/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `            <div className="flex items-center gap-3">
              <Link href="/signin" className="btn-secondary btn-small">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary btn-small hidden sm:inline-flex">
                Sign Up
              </Link>
            </div>
        </div>
      </nav>`;

const replacement = `            <div className="flex items-center gap-3">
              <Link href="/signin" className="btn-secondary btn-small">
                Sign In
              </Link>
              <Link href="/signup" className="btn-primary btn-small hidden sm:inline-flex">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed page.tsx nav closing tag");
} else {
    console.log("Could not find target content in nav");
}
