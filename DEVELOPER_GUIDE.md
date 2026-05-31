# CosmoFolio - Developer Guide

**Last Updated**: May 31, 2026  
**Status**: Production Ready

---

## 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: React with TypeScript
- **State**: Client-side hooks (React Context, localStorage)
- **Authentication**: Firebase OAuth
- **Hosting**: Vercel (recommended)

### Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── signin/page.tsx             # Sign-in page
│   │   ├── signup/page.tsx             # Sign-up page
│   │   ├── globals.css                 # Global styles
│   │   ├── layout.tsx                  # Root layout
│   │   └── dashboard/
│   │       ├── page.tsx                # Main dashboard
│   │       ├── ai-studio/page.tsx      # AI writing assistant
│   │       ├── templates/page.tsx      # Template gallery
│   │       └── project/[id]/
│   │           ├── page.tsx            # Project detail
│   │           ├── portfolio/page.tsx  # Portfolio builder
│   │           ├── sheet/page.tsx      # Sheet composer
│   │           └── website/page.tsx    # Website generator
│   ├── components/
│   │   ├── Logo.tsx                    # Custom logo
│   │   ├── CommandPalette.tsx          # Cmd+K interface
│   │   ├── Toast.tsx                   # Notifications
│   │   ├── Modal.tsx                   # Dialog component
│   │   ├── AssetManager/               # Asset management
│   │   ├── SheetEditor/                # Sheet composition
│   │   ├── PortfolioPreview/           # Portfolio preview
│   │   ├── ThemeManager/               # Dark mode controls
│   │   └── ShareModal/                 # Social export
│   └── lib/
│       └── useTheme.ts                 # Dark mode hook
├── tailwind.config.ts                  # Design tokens
└── package.json
```

---

## 🎨 DESIGN SYSTEM

### Using Colors

**In Tailwind Classes**:
```tsx
// Light mode (default)
<div className="bg-surface-base text-text-primary border-border-subtle">

// Dark mode (automatically handled)
// The same classes work in dark mode via Tailwind's dark variant
<div className="dark:bg-dark-surface-base dark:text-dark-text-primary">
```

**Tailwind Config Reference** (`tailwind.config.ts`):
```typescript
colors: {
  'surface-base': '#FFFFFF',
  'surface-elevated': '#F3F3F0',
  'text-primary': '#111111',
  'text-secondary': '#6B7280',
  'accent-primary': '#0F172A',
  'accent-gold': '#D4AF37',
  'border-subtle': '#E5E5E5',
  // ... dark mode variants
  'dark-surface-base': '#1A1A1A',
  'dark-text-primary': '#FFFFFF',
  // ... etc
}
```

### Using Typography

**Classes Available**:
```tsx
// Display (72px, weight 700)
<h1 className="text-display">Large heading</h1>

// Headings
<h2 className="text-h1">H1 Heading</h2>
<h3 className="text-h2">H2 Heading</h3>
<h4 className="text-h3">H3 Heading</h4>

// Body text
<p className="text-body">Regular body text</p>
<p className="text-body-sm">Smaller body text</p>

// Captions
<span className="text-caption">Caption text</span>
```

### Using Shadows

**Available Elevation Levels**:
```tsx
<div className="shadow-elevation-1">Subtle shadow</div>
<div className="shadow-elevation-2">Light shadow</div>
<div className="shadow-elevation-3">Medium shadow</div>
<div className="shadow-elevation-4">Strong shadow</div>
<div className="shadow-elevation-5">Premium shadow</div>
```

### Using Animations

**Available Animations** (defined in `tailwind.config.ts`):
```tsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-up">Slides up</div>
<div className="animate-scale-grow">Grows in scale</div>
<div className="animate-shimmer">Shimmers (loading)</div>
<div className="animate-pulse">Pulses gently</div>
```

---

## 🧩 COMPONENT USAGE

### Logo Component

```tsx
import { Logo } from '@/components/Logo'

// Default (medium size, dark color)
<Logo />

// Custom size and color
<Logo size="lg" color="gold" animated={true} />

// Props
interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'light' | 'dark' | 'gold'
  animated?: boolean
}
```

### Command Palette

```tsx
import CommandPalette from '@/components/CommandPalette'

// Add to layout (usually in root layout)
export default function RootLayout() {
  return (
    <>
      <CommandPalette />
      {/* Rest of layout */}
    </>
  )
}

// Triggered with Cmd+K (or Ctrl+K on Windows/Linux)
// Users can search commands like "New Portfolio", "AI Studio", etc.
```

### Toast Notifications

```tsx
import { useToast, Toast } from '@/components/Toast'

export default function MyComponent() {
  const { toasts, addToast, removeToast } = useToast()

  const handleSuccess = () => {
    addToast('Portfolio saved!', 'success', 3000) // Auto-dismiss in 3s
  }

  const handleError = () => {
    addToast('Something went wrong', 'error')
  }

  return (
    <>
      <button onClick={handleSuccess}>Save</button>
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
}

// Toast types: 'success' | 'error' | 'warning' | 'info'
```

### Modal Dialog

```tsx
import Modal from '@/components/Modal'
import { useState } from 'react'

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Dialog</button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        description="Are you sure?"
        size="md"
        actions={[
          {
            label: 'Cancel',
            onClick: () => setIsOpen(false),
            variant: 'secondary'
          },
          {
            label: 'Delete',
            onClick: () => {
              // Handle delete
              setIsOpen(false)
            },
            variant: 'danger'
          }
        ]}>
        <p>This action cannot be undone.</p>
      </Modal>
    </>
  )
}

// Props
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  actions?: Action[]
  size?: 'sm' | 'md' | 'lg'
}
```

### Theme Hook (Dark Mode)

```tsx
'use client'

import { useTheme } from '@/lib/useTheme'

export default function ThemeSwitcher() {
  const { theme, setTheme, isDark } = useTheme()

  return (
    <div>
      <button onClick={() => setTheme(isDark ? 'light' : 'dark')}>
        {isDark ? '☀️' : '🌙'}
      </button>

      {/* Returns */}
      {/* theme: 'light' | 'dark' | 'system' */}
      {/* isDark: boolean (current effective theme) */}
      {/* mounted: boolean (hydration safety) */}
    </div>
  )
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints

```tsx
// Mobile-first approach
<div className="
  text-body         // Base size
  sm:text-h4        // At 640px+
  md:text-h3        // At 1024px+
  lg:text-h2        // At 1280px+
">
  Responsive text
</div>

// Grid layouts
<div className="
  grid grid-cols-1   // 1 column on mobile
  sm:grid-cols-2     // 2 columns at 640px+
  lg:grid-cols-3     // 3 columns at 1024px+
">
  {/* Cards */}
</div>
```

### Common Responsive Patterns

**Sidebar Navigation** (hidden on mobile):
```tsx
<aside className="hidden md:block w-64 bg-surface-base">
  {/* Sidebar content */}
</aside>

// Mobile hamburger menu
<button className="md:hidden">☰</button>
```

**Full-width on Mobile**:
```tsx
<div className="px-4 sm:px-6 md:px-8">
  {/* Padding scales with screen size */}
</div>
```

**Typography Scaling**:
```tsx
<h1 className="text-4xl sm:text-5xl md:text-6xl">Heading</h1>
```

---

## 🌙 DARK MODE IMPLEMENTATION

### How Dark Mode Works

1. **useTheme Hook** reads localStorage and system preferences
2. **Applies 'dark' class** to `<html>` and `<body>`
3. **Tailwind detects** dark class and applies dark: variants
4. **CSS color variables** update automatically

### Adding Dark Mode Support to Components

**Automatic** (most components inherit):
```tsx
<div className="bg-surface-base text-text-primary">
  Works in both light and dark mode
</div>
```

**Explicit Dark Mode Colors** (when needed):
```tsx
<div className="
  bg-white dark:bg-slate-900
  text-gray-900 dark:text-white
">
  Explicitly set both modes
</div>
```

### Testing Dark Mode

```tsx
// Use the theme hook
const { isDark, setTheme } = useTheme()

// Toggle dark mode
<button onClick={() => setTheme(isDark ? 'light' : 'dark')}>
  Toggle
</button>
```

---

## ⌨️ KEYBOARD NAVIGATION

### Expected Keyboard Behaviors

| Key | Behavior |
|-----|----------|
| `Cmd+K` / `Ctrl+K` | Open Command Palette |
| `↑` / `↓` | Navigate in Command Palette |
| `Enter` | Execute selected command |
| `Escape` | Close Command Palette / Modal |
| `Tab` | Focus navigation |
| `Shift+Tab` | Reverse focus navigation |

### Implementing Keyboard Support

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      // Handle Cmd+K
    }
    if (e.key === 'Escape') {
      // Handle Escape
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

## ♿ ACCESSIBILITY GUIDELINES

### Focus Management

```tsx
// Add focus ring to interactive elements
<button className="focus:ring-2 focus:ring-accent-primary focus:outline-none">
  Click me
</button>

// Focus visible (keyboard only)
<button className="focus-visible:ring-2">
  Better UX
</button>
```

### Form Labels

```tsx
// Always associate labels
<label htmlFor="name">Name:</label>
<input id="name" type="text" />

// Not this
<label>Name: <input type="text" /></label>
```

### Semantic HTML

```tsx
// Good - semantic
<button>Click me</button>
<nav>Navigation</nav>
<main>Content</main>
<article>Post</article>
<header>Site header</header>
<footer>Site footer</footer>

// Avoid
<div onClick={...}>Click me</div> // Use <button>
```

### Color Contrast

Ensure text has sufficient contrast:
- **WCAG AA**: 4.5:1 ratio for normal text
- **WCAG AAA**: 7:1 ratio for enhanced

All colors in CosmoFolio meet WCAG AA standards.

### Screen Reader Support

```tsx
// Add aria-labels for icons
<button aria-label="Close dialog" onClick={onClose}>×</button>

// Describe complex interactions
<div role="region" aria-label="Portfolio preview"></div>

// Use semantic HTML (better than ARIA)
<button>Save</button> // Better than <div role="button">
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### Image Optimization

```tsx
import Image from 'next/image'

<Image
  src="/portfolio.jpg"
  alt="Portfolio preview"
  width={1200}
  height={800}
  priority // For above-the-fold images
/>
```

### CSS Optimization

- Tailwind purges unused styles in production
- All animations use GPU acceleration (transform, opacity)
- Shadows use `box-shadow` (GPU-friendly)

### Bundle Size

```bash
# Check bundle size
npm run build

# Look for opportunities to reduce JavaScript
# - Remove unused dependencies
# - Lazy load heavy components
```

### Animations

Use hardware-accelerated properties:
```tsx
// Good (GPU-accelerated)
<div className="transform scale-105 transition-transform">
  Scales with GPU
</div>

// Avoid (CPU-intensive)
<div className="w-96 transition-all">
  Changes width = CPU
</div>
```

---

## 🧪 TESTING CHECKLIST

### Before Deploying

- [ ] Visual regression testing (all breakpoints)
- [ ] Mobile testing (375px, 768px, 1024px, 1440px)
- [ ] Dark mode testing (light and dark)
- [ ] Keyboard navigation testing (Tab, Cmd+K, Escape)
- [ ] Accessibility audit (WCAG AA)
- [ ] Lighthouse score > 90
- [ ] Performance profiling
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Console check (no errors/warnings)

### Testing Dark Mode

```bash
# Chrome DevTools
# 1. Open DevTools (F12)
# 2. Cmd+Shift+P (or Ctrl+Shift+P)
# 3. Type "Show rendering"
# 4. Toggle "Emulate CSS media feature prefers-color-scheme"
```

### Testing Responsiveness

```bash
# Chrome DevTools
# 1. Press F12
# 2. Click device toggle (top-left)
# 3. Test on:
#    - iPhone 12 (390x844)
#    - iPad (768x1024)
#    - Desktop (1440x900)
```

---

## 🐛 TROUBLESHOOTING

### Dark Mode Not Working

```tsx
// Ensure you're using Tailwind dark classes
<div className="bg-white dark:bg-slate-900">
  // Use 'dark:' prefix

// Not this
<div className="dark bg-slate-900">
  // Wrong

// Check that useTheme is being called in layout
import { useTheme } from '@/lib/useTheme'
```

### Command Palette Not Opening

```tsx
// Ensure CommandPalette is in root layout
// Check console for errors
// Verify Cmd+K is not overridden by other shortcuts
// Test with Ctrl+K on Windows/Linux
```

### Animations Stuttering

```tsx
// Check DevTools Performance tab
// Look for long JS tasks or forced reflows
// Use transform and opacity (GPU-accelerated)
// Avoid width/height animations
```

### Mobile Styling Issues

```tsx
// Check viewport meta tag in layout.tsx
<meta name="viewport" content="width=device-width, initial-scale=1" />

// Use mobile-first Tailwind
<div className="sm:px-6 md:px-8"> // Base is mobile (px-4)
```

---

## 📚 USEFUL RESOURCES

### Tailwind CSS
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Dark Mode Guide](https://tailwindcss.com/docs/dark-mode)
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)

### Next.js
- [Next.js Docs](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)
- [Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)

### React
- [React Docs](https://react.dev)
- [Hooks](https://react.dev/reference/react/hooks)
- [TypeScript](https://www.typescriptlang.org/docs/)

### Accessibility
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## 🤝 CONTRIBUTING

### Code Style

- Use TypeScript for all components
- Use functional components (no class components)
- Use hooks for state management
- Follow the existing naming conventions
- Keep components small and focused

### Naming Conventions

```tsx
// Components (PascalCase)
export default function MyComponent() {}

// Files (PascalCase)
MyComponent.tsx

// Utilities (camelCase)
export const useMyHook = () => {}

// Constants (UPPER_CASE)
const ANIMATION_DURATION = 300
```

### Git Commit Messages

```
feat: Add dark mode toggle
fix: Correct modal animation timing
docs: Update README
refactor: Simplify color palette
chore: Update dependencies
```

---

## 📞 SUPPORT

For questions or issues:

1. Check the troubleshooting section above
2. Review the component documentation
3. Check the Tailwind/Next.js docs
4. Examine existing similar components
5. Run `npm run dev` to test locally

---

## 🏁 FINAL NOTES

**CosmoFolio** is built to be:
- ✅ Maintainable (clear structure, documented)
- ✅ Scalable (component-based architecture)
- ✅ Extensible (easy to add new components)
- ✅ Performant (optimized rendering, animations)
- ✅ Accessible (WCAG AA compliant)

Happy building! 🏛️✨

---

**Last Updated**: May 31, 2026  
**Version**: 1.0 (Production)
