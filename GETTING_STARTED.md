# CosmoFolio - Getting Started Guide

**Welcome to CosmoFolio!** 🏛️✨

This guide helps you quickly understand and work with the CosmoFolio codebase.

---

## 🎯 WHAT IS COSMOFOLIO?

CosmoFolio is a **world-class, premium AI Architecture Portfolio Generator**. It helps architects create beautiful, professional portfolios with:

- ✨ Stunning portfolio templates
- 🤖 AI-powered writing assistance
- 📐 Professional sheet composition tools
- 🎨 Beautiful website generation
- 📱 Responsive design (mobile to desktop)
- 🌙 Dark mode support
- ♿ WCAG AA accessibility

**Design Philosophy**: Elegant minimalism, Swiss grid-based design, typography-first beauty, professional presentation.

---

## 🚀 QUICK START

### 1. Clone & Install

```bash
git clone <repo-url>
cd ArchPortfolio_Generator
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Explore the Pages

- **Home**: `http://localhost:3000/` → Landing page
- **Sign In**: `http://localhost:3000/signin` → Authentication
- **Dashboard**: `http://localhost:3000/dashboard` → Main hub
- **AI Studio**: `http://localhost:3000/dashboard/ai-studio` → Writing assistant
- **Templates**: `http://localhost:3000/dashboard/templates` → Template gallery

---

## 📁 PROJECT STRUCTURE

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Landing page
│   │   ├── signin/page.tsx           # Sign-in
│   │   ├── signup/page.tsx           # Sign-up
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── dashboard/
│   │       ├── page.tsx              # Dashboard home
│   │       ├── ai-studio/page.tsx    # AI writing assistant
│   │       ├── templates/page.tsx    # Template gallery
│   │       └── project/[id]/         # Project pages
│   │           ├── portfolio/page.tsx
│   │           ├── sheet/page.tsx
│   │           └── website/page.tsx
│   │
│   ├── components/                   # React components
│   │   ├── Logo.tsx                  # Custom logo
│   │   ├── CommandPalette.tsx        # Cmd+K interface
│   │   ├── Toast.tsx                 # Notifications
│   │   ├── Modal.tsx                 # Dialogs
│   │   └── [others]/                 # Feature components
│   │
│   └── lib/
│       └── useTheme.ts               # Dark mode hook
│
├── tailwind.config.ts                # Design system tokens
└── package.json
```

---

## 🎨 DESIGN SYSTEM

### Color Palette

**Light Mode**:
- Background: `#FAFAF8` (cream)
- Surface: `#FFFFFF` (white)
- Text: `#111111` (dark), `#6B7280` (gray)
- Accent: `#0F172A` (midnight blue)
- Gold: `#D4AF37` (premium accent)

**Dark Mode**:
- Background: `#0B0B0B` (deep black)
- Surface: `#1A1A1A` (charcoal)
- Text: `#FFFFFF` (white), `#A1A1AA` (light gray)
- Accent: `#F5F5F0` (cream)

### Using Colors in Code

```tsx
// Use Tailwind classes with design tokens
<div className="bg-surface-base text-text-primary dark:bg-dark-surface-base dark:text-dark-text-primary">
  Content
</div>
```

### Typography

```tsx
<h1 className="text-display">Display (72px)</h1>
<h2 className="text-h1">H1 (56px)</h2>
<h3 className="text-h2">H2 (40px)</h3>
<p className="text-body">Body (16px)</p>
<span className="text-caption">Caption (13px)</span>
```

### Spacing (8px Grid)

```tsx
// Use Tailwind spacing
<div className="p-2">p-2 = 8px</div>
<div className="p-4">p-4 = 16px</div>
<div className="p-6">p-6 = 24px</div>
<div className="p-8">p-8 = 32px</div>
```

---

## 🧩 KEY COMPONENTS

### Logo Component

Custom VR glasses + cosmic nodes design in gold.

```tsx
import { Logo } from '@/components/Logo'

<Logo size="md" color="gold" />
```

### Command Palette (Cmd+K)

Press **Cmd+K** (or **Ctrl+K** on Windows) to open the command palette. Search for:
- New Portfolio
- New Sheet
- AI Studio
- Template Gallery
- Dashboard
- Settings

### Toast Notifications

```tsx
const { toasts, addToast, removeToast } = useToast()

addToast('Saved!', 'success') // Auto-dismisses in 3s
addToast('Error!', 'error')
addToast('Warning!', 'warning')
addToast('Info!', 'info')
```

### Dark Mode

The theme automatically detects system preference. Users can toggle with the theme switcher.

```tsx
import { useTheme } from '@/lib/useTheme'

const { isDark, setTheme } = useTheme()
```

---

## 📱 RESPONSIVE DESIGN

Breakpoints:
- **Mobile**: 0-640px
- **Tablet**: 641-1024px
- **Desktop**: 1025px+

Example:
```tsx
<div className="
  text-body          // Mobile
  sm:text-h4         // Tablet
  lg:text-h2         // Desktop
">
  Responsive text
</div>
```

---

## 🌙 DARK MODE

The app automatically supports dark mode. All components use Tailwind's `dark:` prefix:

```tsx
<div className="bg-white dark:bg-slate-900">
  Automatically switches in dark mode
</div>
```

**Test Dark Mode**:
1. Open DevTools (F12)
2. Press Cmd+Shift+P (Ctrl+Shift+P on Windows)
3. Type "rendering"
4. Toggle "Emulate CSS media feature prefers-color-scheme"

---

## ⌨️ KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open Command Palette |
| `Escape` | Close Command Palette or Modal |
| `Tab` | Focus next element |
| `Shift+Tab` | Focus previous element |
| `Enter` | Activate button/submit form |
| `↑` / `↓` | Navigate in Command Palette |

---

## 🧪 TESTING YOUR CHANGES

### Visual Testing

```bash
# Start dev server
npm run dev

# Test at different screen sizes
# Desktop: http://localhost:3000
# Mobile: DevTools device toggle (F12)
```

### Dark Mode Testing

Open DevTools → Rendering → Toggle "prefers-color-scheme"

### Accessibility Testing

```bash
# Install axe DevTools extension
# Open DevTools
# Click "axe DevTools" tab
# Run scan for issues
```

### Performance Testing

```bash
# Build and analyze
npm run build

# Run Lighthouse audit
# DevTools → Lighthouse tab
# Target: Score > 90
```

---

## 🔧 COMMON TASKS

### Adding a New Page

```bash
# Create page in src/app
# Example: src/app/about/page.tsx

export default function About() {
  return (
    <main className="min-h-screen bg-surface-base dark:bg-dark-surface-base">
      <h1 className="text-h1">About</h1>
      {/* Content */}
    </main>
  )
}
```

### Creating a New Component

```tsx
// src/components/MyComponent.tsx
'use client'

interface MyComponentProps {
  title: string
  children: React.ReactNode
}

export default function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="p-6 bg-surface-base dark:bg-dark-surface-base rounded-lg">
      <h2 className="text-h3">{title}</h2>
      {children}
    </div>
  )
}
```

### Using Dark Mode in a Component

```tsx
import { useTheme } from '@/lib/useTheme'

export default function ThemeToggle() {
  const { isDark, setTheme } = useTheme()

  return (
    <button 
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-surface-elevated dark:bg-dark-surface-elevated"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
```

### Using Toast Notifications

```tsx
'use client'

import { useToast, Toast } from '@/components/Toast'

export default function MyComponent() {
  const { toasts, addToast, removeToast } = useToast()

  const handleSave = () => {
    try {
      // Save logic
      addToast('Saved successfully!', 'success')
    } catch (error) {
      addToast('Failed to save', 'error')
    }
  }

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}
```

---

## 📖 FILE NAMING CONVENTIONS

- **Components**: PascalCase (e.g., `MyComponent.tsx`)
- **Pages**: lowercase/kebab-case inside route folders
- **Utilities**: camelCase (e.g., `useTheme.ts`, `formatDate.ts`)
- **Types**: PascalCase in separate `types.ts` files
- **Constants**: UPPER_CASE (e.g., `API_BASE_URL`)

---

## 🎯 BEST PRACTICES

### 1. Use Semantic HTML

```tsx
// Good ✅
<button>Click me</button>
<nav>Navigation</nav>
<main>Content</main>

// Avoid ❌
<div onClick={...}>Click me</div>
<div>Navigation</div>
```

### 2. Add Accessibility Attributes

```tsx
// Good ✅
<button aria-label="Close dialog" onClick={onClose}>×</button>
<label htmlFor="name">Name:</label>
<input id="name" />

// Avoid ❌
<div onClick={...}>×</div>
<label>Name: <input /></label>
```

### 3. Use GPU-Friendly Animations

```tsx
// Good ✅ (GPU accelerated)
<div className="transform scale-105 transition-transform duration-300">

// Avoid ❌ (CPU intensive)
<div className="w-96 transition-all duration-300">
```

### 4. Keep Components Small

```tsx
// Good ✅ - Single responsibility
export function Button({ children, onClick }) { ... }

// Avoid ❌ - Too much logic
export function PageWithEverything() { 500 lines ... }
```

### 5. Use TypeScript

```tsx
// Good ✅
interface CardProps {
  title: string
  description?: string
  onClick: () => void
}

export function Card({ title, description, onClick }: CardProps) { ... }

// Avoid ❌
export function Card(props) { ... }
```

---

## 🐛 DEBUGGING TIPS

### Enable Debug Logging

```tsx
// In browser console
localStorage.setItem('debug', '*')

// To disable
localStorage.removeItem('debug')
```

### Check Component Props

```tsx
// Add console.log in component
export function MyComponent(props) {
  console.log('MyComponent props:', props)
  return ...
}
```

### Monitor Theme Changes

```tsx
// In browser console
const theme = localStorage.getItem('theme')
console.log('Current theme:', theme)

// Watch for changes
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') console.log('Theme changed:', e.newValue)
})
```

### Inspect Styles

```bash
# In DevTools
# Right-click element → Inspect
# Check computed styles
# Check applied Tailwind classes
```

---

## 📚 USEFUL COMMANDS

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## 🚨 COMMON ERRORS & FIXES

### Error: "Cannot find module"

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Dark Mode Not Working

```tsx
// Check that component uses 'dark:' prefix
// ✅ Correct
<div className="bg-white dark:bg-slate-900">

// ❌ Wrong
<div className="dark bg-slate-900">
```

### Tailwind Styles Not Applying

```bash
# Rebuild Tailwind
npm run dev

# Or restart server if running
# Ctrl+C and npm run dev
```

### Command Palette Not Opening

```bash
# Check browser console for errors
# Ensure CommandPalette is in root layout
# Try using Ctrl+K instead of Cmd+K
```

---

## 🤝 CONTRIBUTING WORKFLOW

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** following best practices

3. **Test your changes**
   ```bash
   npm run dev
   # Test in browser, mobile, dark mode
   ```

4. **Commit with descriptive message**
   ```bash
   git commit -m "feat: Add cool new feature"
   ```

5. **Push and create pull request**
   ```bash
   git push origin feature/my-feature
   ```

---

## 📚 DOCUMENTATION

- **IMPLEMENTATION_COMPLETE.md** - Full phase-by-phase summary
- **VERIFICATION_CHECKLIST.md** - Feature and file verification
- **DEVELOPER_GUIDE.md** - Detailed developer reference
- **GETTING_STARTED.md** - This file!

---

## 🎓 LEARNING RESOURCES

### Framework Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Web Standards
- [MDN Web Docs](https://developer.mozilla.org/)
- [WCAG Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
- [Can I Use?](https://caniuse.com)

---

## 💡 TIPS FOR SUCCESS

1. **Start small** - Make one change at a time
2. **Test early** - Check responsive design and dark mode
3. **Follow patterns** - Use existing components as templates
4. **Ask questions** - Check DEVELOPER_GUIDE.md first
5. **Commit often** - Small, focused commits are easier to review
6. **Document** - Add comments for complex logic
7. **Test accessibility** - Every component should be keyboard navigable

---

## 🎉 YOU'RE READY!

You now have everything you need to work with CosmoFolio. Start by:

1. ✅ Running `npm run dev`
2. ✅ Exploring the pages (landing, dashboard, AI studio)
3. ✅ Testing dark mode and responsiveness
4. ✅ Reading DEVELOPER_GUIDE.md for deep dives
5. ✅ Making your first contribution! 🚀

---

## ❓ STUCK?

1. Check **DEVELOPER_GUIDE.md** for detailed reference
2. Search code for similar patterns
3. Check browser console for errors
4. Try restarting the dev server
5. Clear `.next` folder and rebuild

---

**Happy coding!** 🏛️✨

Remember: Every pixel matters. Every animation intentional. Every interaction purposeful.

Build with pride! 💪

---

**Last Updated**: May 31, 2026  
**Version**: 1.0 (Production)
