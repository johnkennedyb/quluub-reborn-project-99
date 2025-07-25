// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize performance monitoring
  init() {
    this.setupNavigationObserver();
    this.setupResourceObserver();
    this.setupLCPObserver();
    this.setupFIDObserver();
    this.setupCLSObserver();
  }

  // Monitor navigation timing
  private setupNavigationObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.navigationStart);
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.navigationStart);
            this.recordMetric('first_paint', navEntry.responseStart - navEntry.navigationStart);
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  // Monitor resource loading
  private setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.name.includes('/api/')) {
              this.recordMetric('api_response_time', resourceEntry.responseEnd - resourceEntry.requestStart);
            }
            if (resourceEntry.name.includes('.jpg') || resourceEntry.name.includes('.png') || resourceEntry.name.includes('.webp')) {
              this.recordMetric('image_load_time', resourceEntry.responseEnd - resourceEntry.requestStart);
            }
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  // Monitor Largest Contentful Paint (LCP)
  private setupLCPObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largest_contentful_paint', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    }
  }

  // Monitor First Input Delay (FID)
  private setupFIDObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('first_input_delay', entry.processingStart - entry.startTime);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    }
  }

  // Monitor Cumulative Layout Shift (CLS)
  private setupCLSObserver() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordMetric('cumulative_layout_shift', clsValue);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    }
  }

  // Record custom metrics
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements to prevent memory leaks
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  // Get metric statistics
  getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  // Get all metrics summary
  getAllMetrics() {
    const summary: Record<string, any> = {};
    for (const [name] of this.metrics) {
      summary[name] = this.getMetricStats(name);
    }
    return summary;
  }

  // Track component render time
  trackComponentRender(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    this.recordMetric(`component_render_${componentName}`, endTime - startTime);
  }

  // Track API call performance
  async trackAPICall<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const endTime = performance.now();
      this.recordMetric(`api_call_${apiName}`, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(`api_call_${apiName}_error`, endTime - startTime);
      throw error;
    }
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Utility functions for performance optimization
export const performanceUtils = {
  // Debounce function for expensive operations
  debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    }) as T;
  },

  // Throttle function for frequent events
  throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let lastCall = 0;
    return ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(null, args);
      }
    }) as T;
  },

  // Measure and log component performance
  measureComponent: (name: string) => {
    return function <T extends React.ComponentType<any>>(Component: T): T {
      const WrappedComponent = (props: any) => {
        const monitor = PerformanceMonitor.getInstance();
        const startTime = performance.now();
        
        React.useEffect(() => {
          const endTime = performance.now();
          monitor.recordMetric(`component_mount_${name}`, endTime - startTime);
        }, []);

        return React.createElement(Component, props);
      };
      
      WrappedComponent.displayName = `Measured(${Component.displayName || Component.name})`;
      return WrappedComponent as T;
    };
  },

  // Preload critical resources
  preloadResource: (url: string, type: 'script' | 'style' | 'image' | 'fetch') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    if (type === 'fetch') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  },

  // Prefetch resources for next navigation
  prefetchResource: (url: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  },

  // Check if device has slow connection
  isSlowConnection: (): boolean => {
    const connection = (navigator as any).connection;
    if (!connection) return false;
    
    return (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      (connection.effectiveType === '3g' && connection.downlink < 1.5)
    );
  },

  // Get device memory info
  getDeviceMemory: (): number => {
    return (navigator as any).deviceMemory || 4; // Default to 4GB if not available
  },

  // Check if device is low-end
  isLowEndDevice: (): boolean => {
    const memory = performanceUtils.getDeviceMemory();
    const cores = navigator.hardwareConcurrency || 4;
    return memory <= 2 || cores <= 2;
  }
};

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  const monitor = PerformanceMonitor.getInstance();
  monitor.init();
  
  // Log performance summary every 5 minutes in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      console.log('Performance Summary:', monitor.getAllMetrics());
    }, 5 * 60 * 1000);
  }
  
  return monitor;
};
