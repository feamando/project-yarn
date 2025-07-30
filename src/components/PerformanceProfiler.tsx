import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Loader2, Play, Download, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Performance Profiler Component
 * Task 3.1.1: Conduct performance profiling on large documents and projects
 * 
 * This component provides a UI for running comprehensive performance profiling
 * across all application modules and generating benchmark reports.
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

interface ProfilingState {
  isRunning: boolean;
  currentStep: string;
  results: {
    database?: PerformanceBenchmark;
    fileOperations?: PerformanceBenchmark;
    aiOperations?: PerformanceBenchmark;
    systemInfo?: Record<string, string>;
  };
  error?: string;
}

export const PerformanceProfiler: React.FC = () => {
  const [state, setState] = useState<ProfilingState>({
    isRunning: false,
    currentStep: '',
    results: {}
  });

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
    if (duration < 50) return 'bg-green-100 text-green-800';
    if (duration < 200) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderBenchmarkCard = (title: string, benchmark?: PerformanceBenchmark) => {
    if (!benchmark) return null;

    return (
      <Card key={title} className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {title}
          </CardTitle>
          <CardDescription>
            {benchmark.summary.total_operations} operations benchmarked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(benchmark.summary.average_duration_ms)}
              </div>
              <div className="text-sm text-gray-600">Average Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
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
        <h1 className="text-3xl font-bold mb-2">Performance Profiler</h1>
        <p className="text-gray-600">
          Task 3.1.1: Conduct performance profiling on large documents and projects
        </p>
      </div>

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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                    <strong>Database Performance:</strong> Some database operations are taking longer than 100ms. 
                    Consider adding indexes and optimizing query patterns (Task 3.1.4).
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
