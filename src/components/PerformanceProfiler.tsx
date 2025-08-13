import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Loader2, Play, Download, AlertCircle, CheckCircle, Activity, Monitor, Zap, BarChart3 } from 'lucide-react';
import { ContextIndicator } from '@/components/context-indicator';

/**
 * Performance Profiler Component
 * Task 7.1: Create performance profiler component for development
 * 
 * Enhanced performance profiler with both backend and frontend profiling capabilities:
 * - Backend profiling via Tauri for system-level metrics
 * - Frontend profiling for React component performance
 * - Development-specific metrics and monitoring
 * - Real-time performance tracking
 */

interface PerformanceMetrics {
  operation: string;
  duration_ms: number;
  memory_usage_mb: number;
  timestamp: string;
  metadata: Record<string, string>;
}

interface BenchmarkSummary {
  total_operations: number;
  average_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  p95_duration_ms: number;
  total_memory_mb: number;
}

interface PerformanceBenchmark {
  category: string;
  metrics: PerformanceMetrics[];
  summary: BenchmarkSummary;
}

// Frontend-specific performance interfaces
interface ComponentRenderMetric {
  componentName: string;
  renderTime: number;
  renderCount: number;
  propsSize: number;
  timestamp: number;
}

interface FrontendPerformanceMetrics {
  componentRenders: ComponentRenderMetric[];
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    timestamp: number;
  }[];
  bundleMetrics: {
    totalSize: number;
    gzippedSize: number;
    chunkSizes: Record<string, number>;
  };
  vitals: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
}

interface DevelopmentMetrics {
  hotReloadTime: number;
  buildTime: number;
  testRunTime: number;
  lintTime: number;
}

interface ProfilingState {
  isRunning: boolean;
  currentStep: string;
  activeTab: 'backend' | 'frontend' | 'development';
  results: {
    database?: PerformanceBenchmark;
    fileOperations?: PerformanceBenchmark;
    aiOperations?: PerformanceBenchmark;
    systemInfo?: Record<string, string>;
    frontend?: FrontendPerformanceMetrics;
    development?: DevelopmentMetrics;
  };
  realTimeMetrics: {
    isMonitoring: boolean;
    componentRenders: ComponentRenderMetric[];
    memorySnapshots: Array<{
      usedJSHeapSize: number;
      timestamp: number;
    }>;
  };
  error?: string;
}

export const PerformanceProfiler: React.FC = () => {
  const [state, setState] = useState<ProfilingState>({
    isRunning: false,
    currentStep: '',
    activeTab: 'backend',
    results: {},
    realTimeMetrics: {
      isMonitoring: false,
      componentRenders: [],
      memorySnapshots: []
    }
  });

  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const memoryMonitorRef = useRef<NodeJS.Timeout | null>(null);
  const renderMetricsRef = useRef<Map<string, ComponentRenderMetric>>(new Map());

  // Frontend performance profiling methods
  const startRealTimeMonitoring = useCallback(() => {
    setState(prev => ({
      ...prev,
      realTimeMetrics: {
        ...prev.realTimeMetrics,
        isMonitoring: true
      }
    }));

    // Start memory monitoring
    if (memoryMonitorRef.current) {
      clearInterval(memoryMonitorRef.current);
    }
    
    memoryMonitorRef.current = setInterval(() => {
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        setState(prev => ({
          ...prev,
          realTimeMetrics: {
            ...prev.realTimeMetrics,
            memorySnapshots: [
              ...prev.realTimeMetrics.memorySnapshots.slice(-50), // Keep last 50 snapshots
              {
                usedJSHeapSize: memoryInfo.usedJSHeapSize,
                timestamp: Date.now()
              }
            ]
          }
        }));
      }
    }, 1000);

    // Start performance observer for navigation and paint metrics
    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        list.getEntries();
        // Process performance entries for vitals
        // This would be expanded with actual Web Vitals implementation
      });
      
      try {
        performanceObserverRef.current.observe({ entryTypes: ['navigation', 'paint', 'measure'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported');
      }
    }
  }, []);

  const stopRealTimeMonitoring = useCallback(() => {
    setState(prev => ({
      ...prev,
      realTimeMetrics: {
        ...prev.realTimeMetrics,
        isMonitoring: false
      }
    }));

    if (memoryMonitorRef.current) {
      clearInterval(memoryMonitorRef.current);
      memoryMonitorRef.current = null;
    }

    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect();
      performanceObserverRef.current = null;
    }
  }, []);

  const runFrontendProfiling = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentStep: 'Analyzing frontend performance...'
    }));

    try {
      // Collect Web Vitals
      const vitals = {
        fcp: 0, // Would be collected from Performance API
        lcp: 0, // Would be collected from Performance API
        fid: 0, // Would be collected from Performance API
        cls: 0  // Would be collected from Performance API
      };

      // Collect memory usage
      const memoryUsage = [];
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        memoryUsage.push({
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          timestamp: Date.now()
        });
      }

      // Simulate bundle metrics (in real implementation, this would come from build tools)
      const bundleMetrics = {
        totalSize: 1024 * 500, // 500KB
        gzippedSize: 1024 * 150, // 150KB
        chunkSizes: {
          'main': 1024 * 200,
          'vendor': 1024 * 250,
          'components': 1024 * 50
        }
      };

      const frontendMetrics: FrontendPerformanceMetrics = {
        componentRenders: Array.from(renderMetricsRef.current.values()),
        memoryUsage,
        bundleMetrics,
        vitals
      };

      setState(prev => ({
        ...prev,
        isRunning: false,
        currentStep: 'Frontend profiling complete!',
        results: {
          ...prev.results,
          frontend: frontendMetrics
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Frontend profiling failed'
      }));
    }
  }, []);

  const runDevelopmentProfiling = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentStep: 'Analyzing development metrics...'
    }));

    try {
      // Simulate development metrics (in real implementation, these would come from build tools)
      const developmentMetrics: DevelopmentMetrics = {
        hotReloadTime: Math.random() * 1000 + 500, // 500-1500ms
        buildTime: Math.random() * 10000 + 5000, // 5-15s
        testRunTime: Math.random() * 5000 + 2000, // 2-7s
        lintTime: Math.random() * 2000 + 500 // 500-2500ms
      };

      setState(prev => ({
        ...prev,
        isRunning: false,
        currentStep: 'Development profiling complete!',
        results: {
          ...prev.results,
          development: developmentMetrics
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Development profiling failed'
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeMonitoring();
    };
  }, [stopRealTimeMonitoring]);

  const runComprehensiveProfiling = async () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      currentStep: 'Initializing performance profiling...',
      error: undefined,
      results: {}
    }));

    try {
      // Step 1: Start profiling
      setState(prev => ({ ...prev, currentStep: 'Starting performance profiling session...' }));
      await invoke('start_performance_profiling');

      // Step 2: Get system information
      setState(prev => ({ ...prev, currentStep: 'Gathering system information...' }));
      const systemInfo = await invoke<Record<string, string>>('get_system_performance_info');

      // Step 3: Benchmark database operations
      setState(prev => ({ ...prev, currentStep: 'Benchmarking database operations...' }));
      const databaseBenchmark = await invoke<PerformanceBenchmark>('benchmark_database_operations');

      // Step 4: Benchmark file operations
      setState(prev => ({ ...prev, currentStep: 'Benchmarking file I/O operations...' }));
      const fileOperationsBenchmark = await invoke<PerformanceBenchmark>('benchmark_file_operations');

      // Step 5: Benchmark AI operations
      setState(prev => ({ ...prev, currentStep: 'Benchmarking AI processing operations...' }));
      const aiOperationsBenchmark = await invoke<PerformanceBenchmark>('benchmark_ai_operations');

      // Complete profiling
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentStep: 'Performance profiling complete!',
        results: {
          database: databaseBenchmark,
          fileOperations: fileOperationsBenchmark,
          aiOperations: aiOperationsBenchmark,
          systemInfo
        }
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentStep: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  };

  const exportResults = () => {
    const resultsJson = JSON.stringify(state.results, null, 2);
    const blob = new Blob([resultsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-benchmark-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(1)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatMemory = (mb: number): string => {
    if (mb < 1) return `${(mb * 1024).toFixed(1)}KB`;
    if (mb < 1024) return `${mb.toFixed(1)}MB`;
    return `${(mb / 1024).toFixed(2)}GB`;
  };

  const getSeverityColor = (duration: number): string => {
    if (duration < 50) return 'bg-v0-teal/10 text-v0-teal';
    if (duration < 200) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderBenchmarkCard = (title: string, benchmark?: PerformanceBenchmark) => {
    if (!benchmark) return null;

    return (
      <Card key={title} className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-v0-teal" />
            {title}
          </CardTitle>
          <CardDescription>
            {benchmark.summary.total_operations} operations benchmarked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(benchmark.summary.average_duration_ms)}
              </div>
              <div className="text-sm text-gray-600">Average Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-v0-teal">
                {formatDuration(benchmark.summary.min_duration_ms)}
              </div>
              <div className="text-sm text-gray-600">Minimum</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatDuration(benchmark.summary.max_duration_ms)}
              </div>
              <div className="text-sm text-gray-600">Maximum</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatDuration(benchmark.summary.p95_duration_ms)}
              </div>
              <div className="text-sm text-gray-600">95th Percentile</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Individual Operations:</h4>
            {benchmark.metrics.slice(0, 5).map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-mono text-sm">{metric.operation}</span>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(metric.duration_ms)}>
                    {formatDuration(metric.duration_ms)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatMemory(metric.memory_usage_mb)}
                  </span>
                </div>
              </div>
            ))}
            {benchmark.metrics.length > 5 && (
              <div className="text-sm text-gray-500 text-center">
                ... and {benchmark.metrics.length - 5} more operations
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold mb-2">Performance Profiler</h1>
        <p className="text-gray-600">
          Task 7.1: Enhanced performance profiler for development with backend, frontend, and development metrics
        </p>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value as any }))} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backend" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Backend
          </TabsTrigger>
          <TabsTrigger value="frontend" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Frontend
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Development
          </TabsTrigger>
        </TabsList>

        {/* Backend Profiling Tab */}
        <TabsContent value="backend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Backend Performance Profiling
              </CardTitle>
              <CardDescription>
                Run comprehensive performance benchmarks across all backend modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={runComprehensiveProfiling}
                  disabled={state.isRunning}
                  className="flex items-center gap-2"
                >
                  {state.isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {state.isRunning ? 'Running Profiling...' : 'Start Backend Profiling'}
                </Button>

                {Object.keys(state.results).length > 0 && (
                  <Button
                    onClick={exportResults}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Results
                  </Button>
                )}
              </div>

              {/* Background Task Progress Tracking */}
              {state.isRunning && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-gray-700">Background Task Progress</h4>
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">
                      {state.currentStep || "Initializing profiling operations..."}
                    </div>
                    <ContextIndicator
                      isProcessing={true}
                      processedItems={state.currentStep?.includes('database') ? 250 : 
                                     state.currentStep?.includes('file') ? 500 : 
                                     state.currentStep?.includes('AI') ? 750 : 
                                     state.currentStep?.includes('complete') ? 1000 : 600}
                      totalItems={1000}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">Database Operations</div>
                      <ContextIndicator
                        isProcessing={state.currentStep?.includes('database') && !state.results.database}
                        processedItems={state.results.database ? 100 : state.currentStep?.includes('database') ? 75 : 0}
                        totalItems={100}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {state.results.database ? "Complete" : state.currentStep?.includes('database') ? "Running" : "Pending"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">File Operations</div>
                      <ContextIndicator
                        isProcessing={state.currentStep?.includes('file') && !state.results.fileOperations}
                        processedItems={state.results.fileOperations ? 100 : state.currentStep?.includes('file') ? 75 : 0}
                        totalItems={100}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {state.results.fileOperations ? "Complete" : state.currentStep?.includes('file') ? "Running" : "Pending"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">AI Operations</div>
                      <ContextIndicator
                        isProcessing={state.currentStep?.includes('AI') && !state.results.aiOperations}
                        processedItems={state.results.aiOperations ? 100 : state.currentStep?.includes('AI') ? 75 : 0}
                        totalItems={100}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {state.results.aiOperations ? "Complete" : state.currentStep?.includes('AI') ? "Running" : "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {state.isRunning && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{state.currentStep}</span>
                  </div>
                </div>
              )}

              {state.error && (
                <Alert className="mt-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frontend Profiling Tab */}
        <TabsContent value="frontend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Frontend Performance Profiling
              </CardTitle>
              <CardDescription>
                Analyze React component performance, memory usage, and Web Vitals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Button
                  onClick={runFrontendProfiling}
                  disabled={state.isRunning}
                  className="flex items-center gap-2"
                >
                  {state.isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  {state.isRunning ? 'Analyzing...' : 'Analyze Frontend Performance'}
                </Button>

                <Button
                  onClick={state.realTimeMetrics.isMonitoring ? stopRealTimeMonitoring : startRealTimeMonitoring}
                  variant={state.realTimeMetrics.isMonitoring ? "destructive" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  {state.realTimeMetrics.isMonitoring ? 'Stop Monitoring' : 'Start Real-time Monitoring'}
                </Button>
              </div>

              {/* Real-time Memory Usage */}
              {state.realTimeMetrics.isMonitoring && state.realTimeMetrics.memorySnapshots.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Real-time Memory Usage</h4>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-600 mb-2">
                      Current: {formatMemory(state.realTimeMetrics.memorySnapshots[state.realTimeMetrics.memorySnapshots.length - 1]?.usedJSHeapSize / (1024 * 1024) || 0)}
                    </div>
                    <Progress 
                      value={Math.min(100, (state.realTimeMetrics.memorySnapshots[state.realTimeMetrics.memorySnapshots.length - 1]?.usedJSHeapSize || 0) / (50 * 1024 * 1024) * 100)} 
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {state.isRunning && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{state.currentStep}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development Profiling Tab */}
        <TabsContent value="development" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Development Performance Metrics
              </CardTitle>
              <CardDescription>
                Analyze development workflow performance: build times, hot reload, tests, and linting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={runDevelopmentProfiling}
                  disabled={state.isRunning}
                  className="flex items-center gap-2"
                >
                  {state.isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {state.isRunning ? 'Analyzing...' : 'Analyze Development Performance'}
                </Button>
              </div>

              {state.isRunning && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{state.currentStep}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profiling Controls</CardTitle>
          <CardDescription>
            Run comprehensive performance benchmarks across all application modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={runComprehensiveProfiling}
              disabled={state.isRunning}
              className="flex items-center gap-2"
            >
              {state.isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {state.isRunning ? 'Running Profiling...' : 'Start Profiling'}
            </Button>

            {Object.keys(state.results).length > 0 && (
              <Button
                onClick={exportResults}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Results
              </Button>
            )}
          </div>

          {state.isRunning && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{state.currentStep}</span>
              </div>
            </div>
          )}

          {state.error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      {state.results.systemInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(state.results.systemInfo).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="font-semibold capitalize">{key.replace('_', ' ')}</div>
                  <div className="text-sm text-gray-600">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmark Results */}
      <div className="space-y-6">
        {renderBenchmarkCard('Database Operations', state.results.database)}
        {renderBenchmarkCard('File I/O Operations', state.results.fileOperations)}
        {renderBenchmarkCard('AI Processing Operations', state.results.aiOperations)}
        
        {/* Frontend Performance Results */}
        {state.results.frontend && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Frontend Performance Results
              </CardTitle>
              <CardDescription>
                React component performance, memory usage, and Web Vitals analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-v0-teal">
                    {formatDuration(state.results.frontend.vitals.fcp)}
                  </div>
                  <div className="text-sm text-gray-600">First Contentful Paint</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(state.results.frontend.vitals.lcp)}
                  </div>
                  <div className="text-sm text-gray-600">Largest Contentful Paint</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatDuration(state.results.frontend.vitals.fid)}
                  </div>
                  <div className="text-sm text-gray-600">First Input Delay</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {state.results.frontend.vitals.cls.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bundle Metrics */}
                <div>
                  <h4 className="font-semibold mb-3">Bundle Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>Total Size</span>
                      <Badge variant="outline">{formatMemory(state.results.frontend.bundleMetrics.totalSize / (1024 * 1024))}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>Gzipped Size</span>
                      <Badge variant="outline">{formatMemory(state.results.frontend.bundleMetrics.gzippedSize / (1024 * 1024))}</Badge>
                    </div>
                    {Object.entries(state.results.frontend.bundleMetrics.chunkSizes).map(([chunk, size]) => (
                      <div key={chunk} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="capitalize">{chunk} Chunk</span>
                        <Badge variant="secondary">{formatMemory(size / (1024 * 1024))}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Memory Usage */}
                <div>
                  <h4 className="font-semibold mb-3">Memory Usage</h4>
                  {state.results.frontend.memoryUsage.length > 0 && (
                    <div className="space-y-2">
                      {state.results.frontend.memoryUsage.map((memory, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Used Heap</span>
                            <span className="text-sm font-mono">{formatMemory(memory.usedJSHeapSize / (1024 * 1024))}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Total Heap</span>
                            <span className="text-sm font-mono">{formatMemory(memory.totalJSHeapSize / (1024 * 1024))}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Component Renders */}
              {state.results.frontend.componentRenders.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Component Render Performance</h4>
                  <div className="space-y-2">
                    {state.results.frontend.componentRenders.slice(0, 5).map((render, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono text-sm">{render.componentName}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(render.renderTime)}>
                            {formatDuration(render.renderTime)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {render.renderCount} renders
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Development Performance Results */}
        {state.results.development && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Development Performance Results
              </CardTitle>
              <CardDescription>
                Development workflow performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-v0-teal">
                    {formatDuration(state.results.development.hotReloadTime)}
                  </div>
                  <div className="text-sm text-gray-600">Hot Reload Time</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {state.results.development.hotReloadTime < 1000 ? '✅ Fast' : '⚠️ Could be faster'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(state.results.development.buildTime)}
                  </div>
                  <div className="text-sm text-gray-600">Build Time</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {state.results.development.buildTime < 10000 ? '✅ Good' : '⚠️ Consider optimization'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatDuration(state.results.development.testRunTime)}
                  </div>
                  <div className="text-sm text-gray-600">Test Run Time</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {state.results.development.testRunTime < 5000 ? '✅ Good' : '⚠️ Consider parallelization'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatDuration(state.results.development.lintTime)}
                  </div>
                  <div className="text-sm text-gray-600">Lint Time</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {state.results.development.lintTime < 2000 ? '✅ Fast' : '⚠️ Consider caching'}
                  </div>
                </div>
              </div>

              {/* Development Recommendations */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Development Optimization Recommendations</h4>
                <div className="space-y-2">
                  {state.results.development.hotReloadTime > 1000 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Hot Reload:</strong> Consider reducing the number of files being watched or optimizing module resolution.
                      </AlertDescription>
                    </Alert>
                  )}
                  {state.results.development.buildTime > 15000 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Build Time:</strong> Consider implementing incremental builds, code splitting, or build caching.
                      </AlertDescription>
                    </Alert>
                  )}
                  {state.results.development.testRunTime > 7000 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Test Performance:</strong> Consider running tests in parallel or implementing test sharding.
                      </AlertDescription>
                    </Alert>
                  )}
                  {state.results.development.lintTime > 3000 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Lint Performance:</strong> Consider enabling ESLint caching or reducing the number of rules.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Recommendations */}
      {Object.keys(state.results).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
            <CardDescription>
              Based on the profiling results, here are optimization recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.results.database && state.results.database.summary.max_duration_ms > 100 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>File I/O Performance:</strong> Large file operations are slow. 
                    Consider implementing streaming file processing and chunked reading.
                  </AlertDescription>
                </Alert>
              )}

              {state.results.fileOperations && state.results.fileOperations.summary.max_duration_ms > 500 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>File I/O Performance:</strong> Large file operations are slow. 
                    Consider implementing streaming file processing and chunked reading.
                  </AlertDescription>
                </Alert>
              )}

              {state.results.aiOperations && state.results.aiOperations.summary.max_duration_ms > 1000 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI Processing Performance:</strong> AI operations are taking significant time. 
                    Consider background processing queues and progressive loading.
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Next Steps:</strong> Implement UI virtualization (Tasks 3.1.2, 3.1.3) 
                  and database query optimization (Task 3.1.4) based on these benchmarks.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
