import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Cloud, 
  Cpu, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Globe
} from 'lucide-react';
import { ContextIndicator } from '@/components/v0-components/context-indicator';

// Types for AI provider and model information
interface AIProvider {
  name: string;
  type: string;
  available: boolean;
  capabilities: {
    streaming: boolean;
    system_messages: boolean;
    image_support: boolean;
    max_context_length: number;
  };
  models?: string[];
  current_model?: string;
}

interface ModelOption {
  value: string;
  label: string;
  provider: string;
  description: string;
  contextLength: number;
  capabilities: string[];
}

// Model configurations for different providers
const MODEL_CONFIGS: Record<string, ModelOption[]> = {
  local: [
    {
      value: 'local-default',
      label: 'Local AI Model',
      provider: 'Local',
      description: 'Local AI model running on your machine',
      contextLength: 4096,
      capabilities: ['Streaming', 'System Messages']
    }
  ],
  bedrock: [
    {
      value: 'anthropic.claude-3-sonnet-20240229-v1:0',
      label: 'Claude 3 Sonnet',
      provider: 'AWS Bedrock',
      description: 'Balanced performance and speed',
      contextLength: 200000,
      capabilities: ['Streaming', 'System Messages', 'Image Support']
    },
    {
      value: 'anthropic.claude-3-haiku-20240307-v1:0',
      label: 'Claude 3 Haiku',
      provider: 'AWS Bedrock',
      description: 'Fast and efficient',
      contextLength: 200000,
      capabilities: ['Streaming', 'System Messages', 'Image Support']
    },
    {
      value: 'anthropic.claude-3-opus-20240229-v1:0',
      label: 'Claude 3 Opus',
      provider: 'AWS Bedrock',
      description: 'Most capable model',
      contextLength: 200000,
      capabilities: ['Streaming', 'System Messages', 'Image Support']
    }
  ],
  gemini: [
    {
      value: 'gemini-pro',
      label: 'Gemini Pro',
      provider: 'Google Gemini',
      description: 'Google\'s most capable model',
      contextLength: 2097152,
      capabilities: ['Streaming', 'System Messages']
    },
    {
      value: 'gemini-1.5-pro',
      label: 'Gemini 1.5 Pro',
      provider: 'Google Gemini',
      description: 'Latest Gemini model with enhanced capabilities',
      contextLength: 2097152,
      capabilities: ['Streaming', 'System Messages', 'Image Support']
    },
    {
      value: 'gemini-1.5-flash',
      label: 'Gemini 1.5 Flash',
      provider: 'Google Gemini',
      description: 'Fast and efficient Gemini model',
      contextLength: 1048576,
      capabilities: ['Streaming', 'System Messages', 'Image Support']
    }
  ]
};

export const AIModelSelector: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<AIProvider | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  // Load providers and active provider info
  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get list of available providers
      const providersResponse = await invoke<{
        success: boolean;
        providers: AIProvider[];
        message?: string;
      }>('list_ai_providers');

      if (!providersResponse.success) {
        throw new Error(providersResponse.message || 'Failed to load providers');
      }

      setProviders(providersResponse.providers);

      // Get active provider info
      const activeResponse = await invoke<{
        success: boolean;
        provider?: AIProvider;
        message?: string;
      }>('get_active_provider_info');

      if (activeResponse.success && activeResponse.provider) {
        setActiveProvider(activeResponse.provider);
        updateAvailableModels(activeResponse.provider);
        
        // Set selected model to current model or first available
        const currentModel = activeResponse.provider.current_model;
        if (currentModel) {
          setSelectedModel(currentModel);
        } else {
          const models = MODEL_CONFIGS[activeResponse.provider.type.toLowerCase()] || [];
          if (models.length > 0) {
            setSelectedModel(models[0].value);
          }
        }
      }
    } catch (err) {
      console.error('Error loading providers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load AI providers');
    } finally {
      setLoading(false);
    }
  };

  // Update available models based on active provider
  const updateAvailableModels = (provider: AIProvider) => {
    const models = MODEL_CONFIGS[provider.type.toLowerCase()] || [];
    setAvailableModels(models);
  };

  // Switch to a different provider
  const switchProvider = async (providerName: string) => {
    try {
      setSwitching(true);
      setError(null);

      const response = await invoke<{
        success: boolean;
        message?: string;
      }>('select_active_provider', {
        providerName,
        config: {} // Use default config
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to switch provider');
      }

      // Reload provider info after switching
      await loadProviders();
    } catch (err) {
      console.error('Error switching provider:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch provider');
    } finally {
      setSwitching(false);
    }
  };

  // Handle model selection change
  const handleModelChange = async (modelValue: string) => {
    setSelectedModel(modelValue);
    
    // TODO: Implement model switching within provider
    // This would require extending the backend to support model selection
    // For now, we just update the UI state
    console.log('Selected model:', modelValue);
  };

  // Get provider icon
  const getProviderIcon = (providerType: string) => {
    switch (providerType.toLowerCase()) {
      case 'local':
        return <Cpu className="h-4 w-4" />;
      case 'bedrock':
        return <Cloud className="h-4 w-4" />;
      case 'gemini':
        return <Globe className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  // Format context length for display
  const formatContextLength = (length: number): string => {
    if (length >= 1000000) {
      return `${(length / 1000000).toFixed(1)}M tokens`;
    } else if (length >= 1000) {
      return `${(length / 1000).toFixed(0)}K tokens`;
    }
    return `${length} tokens`;
  };

  // Load data on component mount
  useEffect(() => {
    loadProviders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">AI Model</span>
        </div>
        <ContextIndicator 
          isProcessing={true} 
          processedItems={providers.length} 
          totalItems={3}
          phase="initializing"
          ariaLabel="Loading AI providers"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">AI Model</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadProviders}
          disabled={loading || switching}
          className="h-6 w-6 p-0"
          aria-label={loading ? "Refreshing AI providers..." : "Refresh AI providers"}
          title={loading ? "Refreshing AI providers..." : "Refresh AI providers"}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Provider Switching Status */}
      {switching && (
        <div className="py-2">
          <ContextIndicator 
            isProcessing={switching}
            processedItems={60}
            totalItems={100}
            phase="processing"
            ariaLabel="Switching AI provider"
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Active Provider Info */}
      {activeProvider && (
        <div className="flex items-center justify-between p-2 bg-v0-border-primary/50 rounded-v0-radius-lg">
          <div className="flex items-center space-x-2">
            {getProviderIcon(activeProvider.type)}
            <span className="text-xs font-medium">{activeProvider.name}</span>
            {activeProvider.available ? (
              <Badge variant="secondary" className="h-4 text-xs px-1">
                <CheckCircle className="h-2 w-2 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="destructive" className="h-4 text-xs px-1">
                <AlertCircle className="h-2 w-2 mr-1" />
                Unavailable
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Model Selector */}
      {availableModels.length > 0 && (
        <div className="space-y-2">
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select model..." />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">{model.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selected Model Info */}
          {selectedModel && (
            <div className="p-2 bg-v0-border-primary/30 rounded text-xs space-y-1">
              {(() => {
                const model = availableModels.find(m => m.value === selectedModel);
                if (!model) return null;
                
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Context:</span>
                      <span>{formatContextLength(model.contextLength)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="h-4 text-xs px-1">
                          {cap === 'Streaming' && <Zap className="h-2 w-2 mr-1" />}
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Provider Switcher */}
      {providers.length > 1 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Switch Provider:</span>
          <div className="grid grid-cols-1 gap-1">
            {providers.map((provider) => (
              <Button
                key={provider.name}
                variant={activeProvider?.name === provider.name ? "default" : "outline"}
                size="sm"
                onClick={() => switchProvider(provider.name)}
                disabled={switching || !provider.available}
                className="h-7 justify-start text-xs"
              >
                {getProviderIcon(provider.type)}
                <span className="ml-2">{provider.name}</span>
                {!provider.available && (
                  <AlertCircle className="h-3 w-3 ml-auto text-muted-foreground" />
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
