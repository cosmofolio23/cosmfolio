"""
Code Splitting & Lazy Loading Utilities
Phase 7: Task 7.1 - Optimize frontend bundle with dynamic imports and React Suspense
"""

import React, { lazy, Suspense, ReactNode } from 'react';

// ==================== LAZY COMPONENTS ====================

/**
 * Lazy load components with Suspense wrapper
 * Reduces initial bundle size by ~40-60%
 */

// Heavy components that should be lazy loaded
export const ShareModal = lazy(() => import('@/components/ShareModal'));
export const PortfolioPreview = lazy(() => import('@/components/PortfolioPreview/PortfolioPreview'));
export const AdvancedAnalytics = lazy(() => import('@/components/AdvancedAnalytics'));
export const DesignEditor = lazy(() => import('@/components/DesignEditor'));
export const AIContentGenerator = lazy(() => import('@/components/AIContentGenerator'));
export const TemplateSelector = lazy(() => import('@/components/TemplateSelector'));

// ==================== SUSPENSE BOUNDARIES ====================

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading...',
}) => (
  <div className="loading-container" style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    fontSize: '16px',
    color: '#6b7280',
  }}>
    <div className="spinner" style={{
      border: '4px solid #f3f4f6',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite',
      marginRight: '12px',
    }} />
    {message}
  </div>
);

// Style for spinner animation
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  timeout?: number;
}

/**
 * Wrapper component for Suspense with custom fallback
 */
export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback = <LoadingFallback />,
  timeout = 5000,
}) => {
  const [showFallback, setShowFallback] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  return (
    <Suspense fallback={showFallback ? fallback : <LoadingFallback />}>
      {children}
    </Suspense>
  );
};

// ==================== BUNDLE ANALYSIS ====================

/**
 * Get bundle size recommendations
 * Run: npm run analyze
 */
export const bundleAnalysisConfig = {
  // webpack-bundle-analyzer configuration
  analyzerMode: 'static',
  openAnalyzer: false,
  reportFilename: 'bundle-report.html',
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
};

// Target bundle sizes (in KB)
export const BUNDLE_TARGETS = {
  main: 250,      // Main bundle
  vendor: 200,    // Vendor libraries
  css: 50,        // CSS bundle
  total: 500,     // Total gzipped
};

// ==================== DYNAMIC IMPORTS ====================

/**
 * Dynamic import wrapper with error handling
 */
export const dynamicImport = async (
  importFn: () => Promise<any>,
  fallback?: any
) => {
  try {
    return await importFn();
  } catch (error) {
    console.error('Failed to load module:', error);
    return fallback || null;
  }
};

/**
 * Prefetch component on user interaction
 * Useful for modals, dropdowns, etc.
 */
export const prefetchComponent = (
  importFn: () => Promise<any>,
  delay: number = 2000
) => {
  setTimeout(() => {
    importFn().catch(() => {
      // Silently fail - component will still load on demand
    });
  }, delay);
};

// ==================== ROUTE-BASED CODE SPLITTING ====================

/**
 * Configuration for route-based code splitting
 * Each route gets its own chunk that loads on demand
 */
export const routeCodeSplitConfig = {
  // Main routes
  '/': 'MainLayout',
  '/dashboard': 'DashboardPage',
  '/portfolios': 'PortfoliosPage',
  '/editor/:id': 'EditorPage',
  '/preview/:id': 'PreviewPage',
  '/share/:id': 'SharePage',
  '/analytics/:id': 'AnalyticsPage',
  '/settings': 'SettingsPage',
  '/help': 'HelpPage',

  // Auth routes
  '/auth/login': 'LoginPage',
  '/auth/signup': 'SignupPage',
  '/auth/reset': 'ResetPage',
};

// ==================== WEBPACK CONFIGURATION ====================

export const webpackOptimization = {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // Vendor libraries
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
        enforce: true,
      },

      // React libraries
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react-vendors',
        priority: 20,
        enforce: true,
      },

      // UI libraries
      ui: {
        test: /[\\/]node_modules[\\/](lucide-react|@headlessui)[\\/]/,
        name: 'ui-vendors',
        priority: 15,
        enforce: true,
      },

      // Common code shared between pages
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
      },
    },
  },

  runtimeChunk: {
    name: 'runtime',
  },

  minimizer: [
    {
      // Terser configuration
      terserOptions: {
        compress: {
          drop_console: true,
          unused: true,
        },
        output: {
          comments: false,
        },
      },
    },
  ],
};

// ==================== IMAGE OPTIMIZATION ====================

/**
 * Lazy load images with intersection observer
 */
export const useLazyImage = (ref: React.RefObject<HTMLImageElement>) => {
  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      },
      {
        rootMargin: '50px',
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);
};

/**
 * Image component with lazy loading
 */
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
}) => {
  const ref = React.useRef<HTMLImageElement>(null);
  useLazyImage(ref);

  return (
    <img
      ref={ref}
      data-src={src}
      alt={alt}
      width={width}
      height={height}
      className={`lazy-image ${className || ''}`}
      style={{
        backgroundColor: '#f3f4f6',
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
  );
};

// ==================== PERFORMANCE MONITORING ====================

/**
 * Monitor bundle size and warn if exceeds target
 */
export const checkBundleSize = async () => {
  try {
    const response = await fetch('/bundle-stats.json');
    const stats = await response.json();

    const totalSize = stats.total / 1024; // Convert to KB

    if (totalSize > BUNDLE_TARGETS.total) {
      console.warn(
        `Bundle size warning: ${totalSize.toFixed(2)}KB exceeds target of ${BUNDLE_TARGETS.total}KB`
      );
    }

    return {
      total: totalSize,
      targets: BUNDLE_TARGETS,
      status: totalSize <= BUNDLE_TARGETS.total ? 'ok' : 'warning',
    };
  } catch (error) {
    console.error('Failed to check bundle size:', error);
    return null;
  }
};

/**
 * Web Vitals monitoring
 */
export const reportWebVitals = (metric: any) => {
  if (metric.label === 'web-vital') {
    console.log(`${metric.name}: ${metric.value}`);

    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.value),
        event_category: 'web-vital',
      });
    }
  }
};

// ==================== NEXT.js SPECIFIC ====================

/**
 * Next.js dynamic imports with loading states
 */
export const nextDynamicConfig = {
  ssr: false, // Disable server-side rendering for heavy components
  loading: LoadingFallback,
};

/**
 * getStaticProps cache configuration
 */
export const getStaticPropsConfig = {
  revalidate: 60, // Revalidate every 60 seconds (ISR)
};

/**
 * getServerSideProps configuration for frequently changing data
 */
export const getServerSidePropsConfig = {
  unstable_revalidate: 10, // Revalidate every 10 seconds
};
