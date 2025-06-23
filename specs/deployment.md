# Deployment Specification

## Overview

This specification covers the build process, hosting options, deployment strategy, and production considerations for the mobile Yahtzee game.

## Build Process

### Production Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Mobile Yahtzee',
        short_name: 'Yahtzee',
        description: 'Mobile-first Yahtzee game for pass-and-play',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          game: ['./src/utils/scoring', './src/utils/gameLogic']
        }
      }
    }
  }
});
```

### Build Scripts

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:analyze": "npm run build && npx vite-bundle-analyzer",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

## Hosting Options

### Option 1: Netlify (Recommended)

**Advantages:**
- Automatic deployments from Git
- Edge functions for enhanced performance
- Built-in form handling and analytics
- Generous free tier

**Configuration:**
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Option 2: Vercel

**Advantages:**
- Excellent performance with edge network
- Seamless GitHub integration
- Serverless functions support

**Configuration:**
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Option 3: GitHub Pages

**Advantages:**
- Free hosting for open source projects
- Simple setup with GitHub Actions
- Good for static sites

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build
    
    - uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## Progressive Web App (PWA) Features

### Service Worker Strategy

```typescript
// public/sw.js
const CACHE_NAME = 'yahtzee-v1.0.0';
const urlsToCache = [
  '/',
  '/assets/index.js',
  '/assets/index.css',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
```

### Web App Manifest

```json
// public/manifest.json
{
  "name": "Mobile Yahtzee Game",
  "short_name": "Yahtzee",
  "description": "A mobile-first Yahtzee game for pass-and-play multiplayer fun",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4CAF50",
  "orientation": "portrait",
  "categories": ["games", "entertainment"],
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512.png", 
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Check for unused dependencies
npx depcheck

# Audit for vulnerabilities
npm audit
```

### Optimization Techniques

1. **Code Splitting**: Separate vendor and app bundles
2. **Tree Shaking**: Remove unused code
3. **Asset Optimization**: Compress images and icons
4. **Lazy Loading**: Load components on demand
5. **Caching**: Aggressive caching for static assets

### Performance Monitoring

```typescript
// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = {
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime
    };
    
    // Send to analytics (if implemented)
    console.log('Performance metrics:', perfData);
  });
}
```

## Security Considerations

### Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self';
">
```

### HTTPS Enforcement

```javascript
// Redirect HTTP to HTTPS in production
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

## Environment Configuration

### Environment Variables

```bash
# .env.production
VITE_APP_TITLE="Mobile Yahtzee"
VITE_APP_VERSION="1.0.0"
VITE_ENABLE_ANALYTICS=true
```

### Build Environment Setup

```typescript
// src/config.ts
export const config = {
  app: {
    title: import.meta.env.VITE_APP_TITLE || 'Yahtzee',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  },
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  }
};
```

## Monitoring and Analytics

### Error Tracking

```typescript
// Error boundary with reporting
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Sentry, LogRocket, or similar service
      this.reportError(error, errorInfo);
    }
  }
  
  reportError(error: Error, errorInfo: React.ErrorInfo) {
    // Implementation depends on chosen service
  }
}
```

### Basic Analytics

```typescript
// Simple analytics tracking
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    if (config.features.analytics && 'gtag' in window) {
      (window as any).gtag('event', event, properties);
    }
  }
};

// Usage examples
analytics.track('game_started', { players: 2 });
analytics.track('dice_rolled', { round: 5 });
analytics.track('game_completed', { final_score: 247 });
```

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Cross-browser testing completed
- [ ] Mobile device testing done
- [ ] Security scan passed

### Deployment Process

1. **Create Release Branch**
   ```bash
   git checkout -b release/v1.0.0
   git push origin release/v1.0.0
   ```

2. **Update Version**
   ```bash
   npm version patch  # or minor/major
   ```

3. **Build and Test**
   ```bash
   npm run build
   npm run test
   npm run test:e2e
   ```

4. **Deploy to Staging**
   ```bash
   # Deploy to staging environment first
   npm run deploy:staging
   ```

5. **Production Deployment**
   ```bash
   # After staging verification
   npm run deploy:production
   ```

### Post-Deployment

- [ ] Verify live site functionality
- [ ] Check performance metrics
- [ ] Monitor error rates
- [ ] Validate PWA installation
- [ ] Test on multiple devices
- [ ] Update documentation

## Rollback Strategy

### Quick Rollback

```bash
# Rollback to previous version on Netlify
netlify sites:list
netlify api listSiteDeploys --site-id=SITE_ID
netlify api restoreSiteDeploy --site-id=SITE_ID --deploy-id=DEPLOY_ID
```

### Git-based Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard PREVIOUS_COMMIT_HASH
git push --force origin main
```

## Production Configuration

### Optimized Build Settings

```typescript
// Production-specific optimizations
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  }
});
```

### Asset Optimization

```bash
# Optimize images
npx imagemin src/assets/*.png --out-dir=public/optimized

# Generate multiple icon sizes
npx pwa-asset-generator icon.svg public --favicon --manifest=public/manifest.json
```

This deployment specification ensures reliable, performant, and secure hosting of the mobile Yahtzee game with proper PWA features and monitoring capabilities. 