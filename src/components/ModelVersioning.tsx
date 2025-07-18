import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertCircle, Download, RotateCcw, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface ModelUpdate {
  model_id: string;
  current_version: string;
  latest_version: string;
  update_type: 'major' | 'minor' | 'patch' | 'security';
  changelog: string;
  size_bytes: number;
  breaking_changes: boolean;
}

interface ModelVersion {
  model_id: string;
  version: string;
  checksum: string;
  download_url: string;
  size_bytes: number;
  compatibility: string[];
  release_date: string;
  changelog: string;
  deprecated: boolean;
  minimum_ram_gb: number;
  recommended_ram_gb: number;
  variant: string;
}

interface InstalledModel {
  model_id: string;
  version: string;
  installed_at: string;
  last_used: string;
  file_path: string;
  checksum: string;
  size_bytes: number;
}

interface UpdateCheckResult {
  updates: ModelUpdate[];
  last_check: string;
}

export const ModelVersioning: React.FC = () => {
  const [updates, setUpdates] = useState<ModelUpdate[]>([]);
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string>('');
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);

  useEffect(() => {
    checkForUpdates();
    loadInstalledModels();
  }, []);

  const checkForUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      const result: UpdateCheckResult = await invoke('check_model_updates');
      setUpdates(result.updates);
      setLastCheck(result.last_check);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledModels = async () => {
    try {
      const models: InstalledModel[] = await invoke('list_installed_models');
      setInstalledModels(models);
    } catch (err) {
      console.error('Failed to load installed models:', err);
    }
  };

  const updateModel = async (modelId: string, targetVersion?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result: string = await invoke('update_model', {
        request: { model_id: modelId, target_version: targetVersion }
      });
      console.log(result);
      await checkForUpdates();
      await loadInstalledModels();
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const rollbackModel = async (modelId: string, targetVersion?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result: string = await invoke('rollback_model', {
        request: { model_id: modelId, target_version: targetVersion }
      });
      console.log(result);
      await checkForUpdates();
      await loadInstalledModels();
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const getVersionHistory = async (modelId: string) => {
    try {
      const history: ModelVersion[] = await invoke('get_model_version_history', { modelId });
      return history;
    } catch (err) {
      console.error('Failed to get version history:', err);
      return [];
    }
  };

  const toggleAutoUpdates = async () => {
    try {
      const newState = !autoUpdateEnabled;
      await invoke('enable_auto_updates', { enabled: newState });
      setAutoUpdateEnabled(newState);
    } catch (err) {
      setError(err as string);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUpdateTypeBadge = (updateType: string) => {
    const variants = {
      major: 'destructive',
      minor: 'default',
      patch: 'secondary',
      security: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[updateType as keyof typeof variants] || 'default'}>
        {updateType.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Model Versioning</h2>
          <p className="text-muted-foreground">
            Manage AI model versions, updates, and rollbacks
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={checkForUpdates}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Check Updates
          </Button>
          <Button
            variant={autoUpdateEnabled ? "default" : "outline"}
            onClick={toggleAutoUpdates}
          >
            Auto Updates {autoUpdateEnabled ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {lastCheck && (
        <div className="text-sm text-muted-foreground">
          Last checked: {formatDate(lastCheck)}
        </div>
      )}

      <Tabs defaultValue="updates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="updates">
            Available Updates
            {updates.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {updates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="installed">Installed Models</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="updates" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Checking for updates...</p>
            </div>
          ) : updates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">All models are up to date</h3>
                  <p className="text-muted-foreground">
                    No updates available for your installed models
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <Card key={update.model_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{update.model_id}</span>
                          {getUpdateTypeBadge(update.update_type)}
                        </CardTitle>
                        <CardDescription>
                          {update.current_version} → {update.latest_version}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(update.size_bytes)}
                        </div>
                        {update.breaking_changes && (
                          <Badge variant="destructive" className="mt-1">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Breaking Changes
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Changelog</h4>
                        <p className="text-sm text-muted-foreground">
                          {update.changelog}
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => updateModel(update.model_id)}
                          disabled={loading}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Update Model
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          {installedModels.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No models installed</h3>
                  <p className="text-muted-foreground">
                    Install models to see them here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {installedModels.map((model) => (
                <Card key={model.model_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{model.model_id}</CardTitle>
                        <CardDescription>
                          Version {model.version} • {formatFileSize(model.size_bytes)}
                        </CardDescription>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Installed: {formatDate(model.installed_at)}</div>
                        <div>Last used: {formatDate(model.last_used)}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => rollbackModel(model.model_id)}
                        disabled={loading}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Rollback
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Show version history modal
                          getVersionHistory(model.model_id);
                        }}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>
                View version history for installed models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Select a model from the "Installed Models" tab to view its version history
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModelVersioning;
