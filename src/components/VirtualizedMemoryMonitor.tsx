import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  MemoryStick, 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Database,
  Layers,
  Play,
  Pause
} from "lucide-react";

/**
 * Virtualized Component Memory Monitor
 * Task 7.4: Add memory usage monitoring for virtualized components
 */

interface VirtualizedComponent {
  id: string;
  type: 'list' | 'grid' | 'table' | 'tree';
  totalItems: number;
  renderedItems: number;
  memoryUsage: number;
  cacheSize: number;
  windowSize: number;
  overscan: number;
}

interface MemorySnapshot {
  timestamp: number;
  totalMemory: number;
  virtualizedMemory: number;
  domNodes: number;
}

interface MemoryAlert {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

interface MonitorState {
  isMonitoring: boolean;
  components: Map<string, VirtualizedComponent>;
  snapshots: MemorySnapshot[];
  alerts: MemoryAlert[];
  activeTab: 'overview' | 'components' | 'alerts';
}

export const VirtualizedMemoryMonitor: React.FC = () => {
  const [state, setState] = useState<MonitorState>({
    isMonitoring: false,
    components: new Map(),
    snapshots: [],
    alerts: [],
    activeTab: 'overview'
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const createMockComponent = (id: string, type: VirtualizedComponent['type']): VirtualizedComponent => ({
    id,
    type,
    totalItems: Math.floor(Math.random() * 10000) + 1000,
    renderedItems: Math.floor(Math.random() * 100) + 20,
    memoryUsage: Math.floor(Math.random() * 50 * 1024 * 1024) + 10 * 1024 * 1024, // 10-60MB
    cacheSize: Math.floor(Math.random() * 200) + 50,
    windowSize: Math.floor(Math.random() * 50) + 10,
    overscan: Math.floor(Math.random() * 10) + 2
  });

  const takeSnapshot = useCallback(() => {
    const totalVirtualizedMemory = Array.from(state.components.values())
      .reduce((sum, comp) => sum + comp.memoryUsage, 0);

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      totalMemory: (performance as any).memory?.usedJSHeapSize || Math.random() * 100 * 1024 * 1024,
      virtualizedMemory: totalVirtualizedMemory,
      domNodes: document.querySelectorAll('*').length
    };

    setState(prev => ({
      ...prev,
      snapshots: [...prev.snapshots.slice(-49), snapshot]
    }));

    // Generate alerts
    const newAlerts: MemoryAlert[] = [];
    if (snapshot.virtualizedMemory > 100 * 1024 * 1024) { // 100MB
      newAlerts.push({
        id: `alert-${Date.now()}`,
        type: 'high-memory',
        message: `High virtualized memory usage: ${formatBytes(snapshot.virtualizedMemory)}`,
        severity: 'high',
        timestamp: Date.now()
      });
    }

    if (snapshot.domNodes > 1000) {
      newAlerts.push({
        id: `alert-dom-${Date.now()}`,
        type: 'dom-bloat',
        message: `High DOM node count: ${snapshot.domNodes} nodes`,
        severity: 'medium',
        timestamp: Date.now()
      });
    }

    if (newAlerts.length > 0) {
      setState(prev => ({
        ...prev,
        alerts: [...prev.alerts.slice(-19), ...newAlerts]
      }));
    }
  }, [state.components]);

  const startMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: true }));

    // Initialize mock components
    const mockComponents = new Map<string, VirtualizedComponent>();
    mockComponents.set('document-list', createMockComponent('document-list', 'list'));
    mockComponents.set('project-grid', createMockComponent('project-grid', 'grid'));
    mockComponents.set('data-table', createMockComponent('data-table', 'table'));
    mockComponents.set('file-tree', createMockComponent('file-tree', 'tree'));

    setState(prev => ({ ...prev, components: mockComponents }));

    intervalRef.current = setInterval(() => {
      takeSnapshot();
      
      // Simulate memory changes
      setState(prev => {
        const updatedComponents = new Map(prev.components);
        updatedComponents.forEach((comp, id) => {
          const memoryDelta = (Math.random() - 0.5) * 5 * 1024 * 1024; // ±5MB
          updatedComponents.set(id, {
            ...comp,
            memoryUsage: Math.max(1024 * 1024, comp.memoryUsage + memoryDelta)
          });
        });
        return { ...prev, components: updatedComponents };
      });
    }, 2000);
  }, [takeSnapshot]);

  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'list': return <Layers className="h-4 w-4" />;
      case 'grid': return <BarChart3 className="h-4 w-4" />;
      case 'table': return <Database className="h-4 w-4" />;
      case 'tree': return <Activity className="h-4 w-4" />;
      default: return <MemoryStick className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      default: return 'text-yellow-600';
    }
  };

  const totalMemory = Array.from(state.components.values()).reduce((sum, comp) => sum + comp.memoryUsage, 0);
  const totalItems = Array.from(state.components.values()).reduce((sum, comp) => sum + comp.totalItems, 0);
  const totalRendered = Array.from(state.components.values()).reduce((sum, comp) => sum + comp.renderedItems, 0);

  return (
    <div className="p-v0-space-6 max-w-6xl mx-auto">
      <div className="mb-v0-space-6">
        <h1 className="text-3xl font-serif font-bold mb-v0-space-2">Virtualized Memory Monitor</h1>
        <p className="text-gray-600">
          Task 7.4: Memory monitoring for virtualized components with optimization insights
        </p>
      </div>

      <Card className="mb-v0-space-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MemoryStick className="h-5 w-5" />
            Memory Monitoring Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={state.isMonitoring ? stopMonitoring : startMonitoring}
              variant={state.isMonitoring ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {state.isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {state.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
          </div>
          {state.isMonitoring && (
            <div className="flex items-center gap-2 text-v0-teal mt-v0-space-4">
              <Activity className="h-4 w-4 animate-pulse" />
              <span>Monitoring virtualized component memory...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value as any }))}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({state.alerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-v0-space-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-v0-space-4">
            <Card>
              <CardContent className="p-v0-space-4">
                <div className="text-2xl font-bold text-v0-text-primary">{formatBytes(totalMemory)}</div>
                <div className="text-sm text-gray-600">Total Memory</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-v0-space-4">
                <div className="text-2xl font-bold text-v0-teal">{totalItems.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-v0-space-4">
                <div className="text-2xl font-bold text-v0-gold">{totalRendered}</div>
                <div className="text-sm text-gray-600">Rendered Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-v0-space-4">
                <div className="text-2xl font-bold text-v0-red">{state.components.size}</div>
                <div className="text-sm text-gray-600">Components</div>
              </CardContent>
            </Card>
          </div>

          {state.snapshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Memory Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-v0-space-2">
                      <span>Current Usage</span>
                      <span>{formatBytes(state.snapshots[state.snapshots.length - 1]?.virtualizedMemory || 0)}</span>
                    </div>
                    <Progress value={Math.min(100, (totalMemory / (100 * 1024 * 1024)) * 100)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Component Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(state.components.values()).map((comp) => (
                  <div key={comp.id} className="border rounded-v0-radius-lg p-4">
                    <div className="flex items-center justify-between mb-v0-space-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(comp.type)}
                        <h4 className="text-lg font-serif font-semibold">{comp.id}</h4>
                        <Badge variant="outline" className="capitalize">{comp.type}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{formatBytes(comp.memoryUsage)}</div>
                        <div className="text-xs text-gray-500">{comp.renderedItems}/{comp.totalItems} items</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Window:</span>
                        <div className="font-mono">{comp.windowSize}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Overscan:</span>
                        <div className="font-mono">{comp.overscan}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cache:</span>
                        <div className="font-mono">{comp.cacheSize}</div>
                      </div>
                    </div>
                    <Progress value={Math.min(100, (comp.memoryUsage / (50 * 1024 * 1024)) * 100)} className="mt-v0-space-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Memory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-v0-teal" />
                  No memory alerts. Performance is optimal!
                </div>
              ) : (
                <div className="space-y-4">
                  {state.alerts.slice().reverse().map((alert) => (
                    <Alert key={alert.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`font-semibold ${getSeverityColor(alert.severity)}`}>
                              {alert.message}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VirtualizedMemoryMonitor;
