// AI Settings Component for Task 2.4.1
// Implements the Settings page for AWS Bedrock and Google Gemini credentials

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { V0FormField, V0Header } from "@/components/v0-components/composition-patterns";
import { ContextIndicator } from "@/components/context-indicator";
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Cloud,
  Bot
} from "lucide-react";
import { invoke } from '@tauri-apps/api/tauri';

interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'configured' | 'not_configured' | 'validating' | 'error';
}

interface BedrockCredentials {
  access_key_id: string;
  secret_access_key: string;
  region: string;
}

interface GeminiCredentials {
  api_key: string;
}

export function AISettings() {
  // State for credentials
  const [bedrockCredentials, setBedrockCredentials] = useState<BedrockCredentials>({
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1'
  });
  
  const [geminiCredentials, setGeminiCredentials] = useState<GeminiCredentials>({
    api_key: ''
  });

  // State for UI
  const [showBedrockSecret, setShowBedrockSecret] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isValidatingBedrock, setIsValidatingBedrock] = useState(false);
  const [isValidatingGemini, setIsValidatingGemini] = useState(false);
  const [bedrockValidationResult, setBedrockValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [geminiValidationResult, setGeminiValidationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // State for active provider
  const [activeProvider, setActiveProvider] = useState<string>('local');
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([]);

  // Load initial data
  useEffect(() => {
    loadProviders();
    loadActiveProvider();
  }, []);

  const loadProviders = async () => {
    try {
      const providers = await invoke<string[]>('list_ai_providers');
      const providerList: AIProvider[] = [
        {
          id: 'local',
          name: 'Local AI',
          description: 'Local AI model running on your machine',
          icon: <Bot className="h-4 w-4" />,
          status: 'configured'
        },
        {
          id: 'bedrock',
          name: 'AWS Bedrock',
          description: 'Claude 3 models via AWS Bedrock',
          icon: <Cloud className="h-4 w-4" />,
          status: providers.includes('bedrock') ? 'configured' : 'not_configured'
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          description: 'Google Gemini Pro models',
          icon: <Cloud className="h-4 w-4" />,
          status: providers.includes('gemini') ? 'configured' : 'not_configured'
        }
      ];
      setAvailableProviders(providerList);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const loadActiveProvider = async () => {
    try {
      const info = await invoke<{ provider_type: string }>('get_active_provider_info');
      setActiveProvider(info.provider_type);
    } catch (error) {
      console.error('Failed to load active provider:', error);
    }
  };

  // Handle Bedrock credentials
  const handleBedrockCredentialsChange = (field: keyof BedrockCredentials, value: string) => {
    setBedrockCredentials(prev => ({ ...prev, [field]: value }));
    setBedrockValidationResult(null); // Clear previous validation
  };

  const saveBedrock = async () => {
    try {
      await invoke('set_bedrock_credentials', {
        accessKeyId: bedrockCredentials.access_key_id,
        secretAccessKey: bedrockCredentials.secret_access_key,
        region: bedrockCredentials.region
      });
      
      // Update provider status
      setAvailableProviders(prev => 
        prev.map(p => p.id === 'bedrock' ? { ...p, status: 'configured' } : p)
      );
      
      setBedrockValidationResult({
        success: true,
        message: 'AWS Bedrock credentials saved successfully'
      });
    } catch (error) {
      setBedrockValidationResult({
        success: false,
        message: `Failed to save credentials: ${error}`
      });
    }
  };

  const validateBedrock = async () => {
    setIsValidatingBedrock(true);
    setBedrockValidationResult(null);
    
    try {
      const result = await invoke<{ success: boolean; message: string }>('validate_bedrock_credentials');
      setBedrockValidationResult(result);
      
      if (result.success) {
        setAvailableProviders(prev => 
          prev.map(p => p.id === 'bedrock' ? { ...p, status: 'configured' } : p)
        );
      }
    } catch (error) {
      setBedrockValidationResult({
        success: false,
        message: `Validation failed: ${error}`
      });
    } finally {
      setIsValidatingBedrock(false);
    }
  };

  // Handle Gemini credentials
  const handleGeminiCredentialsChange = (value: string) => {
    setGeminiCredentials({ api_key: value });
    setGeminiValidationResult(null); // Clear previous validation
  };

  const saveGemini = async () => {
    try {
      await invoke('set_gemini_credentials', {
        apiKey: geminiCredentials.api_key
      });
      
      // Update provider status
      setAvailableProviders(prev => 
        prev.map(p => p.id === 'gemini' ? { ...p, status: 'configured' } : p)
      );
      
      setGeminiValidationResult({
        success: true,
        message: 'Google Gemini credentials saved successfully'
      });
    } catch (error) {
      setGeminiValidationResult({
        success: false,
        message: `Failed to save credentials: ${error}`
      });
    }
  };

  const validateGemini = async () => {
    setIsValidatingGemini(true);
    setGeminiValidationResult(null);
    
    try {
      const result = await invoke<{ success: boolean; message: string }>('validate_gemini_credentials');
      setGeminiValidationResult(result);
      
      if (result.success) {
        setAvailableProviders(prev => 
          prev.map(p => p.id === 'gemini' ? { ...p, status: 'configured' } : p)
        );
      }
    } catch (error) {
      setGeminiValidationResult({
        success: false,
        message: `Validation failed: ${error}`
      });
    } finally {
      setIsValidatingGemini(false);
    }
  };

  // Handle provider selection
  const selectProvider = async (providerId: string) => {
    try {
      await invoke('select_active_provider', { providerType: providerId });
      setActiveProvider(providerId);
    } catch (error) {
      console.error('Failed to select provider:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-v0-teal" />;
      case 'validating':
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-full overflow-auto p-6 bg-v0-dark-bg">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <V0Header
          title="AI Settings"
          actions={
            <div className="text-sm text-v0-text-muted">
              Configure your AI providers and manage credentials
            </div>
          }
        />

        {/* Active Provider Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Active AI Provider</span>
            </CardTitle>
            <CardDescription>
              Select which AI provider to use for document assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {availableProviders.map((provider) => (
                <div
                  key={provider.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    activeProvider === provider.id
                      ? 'border-primary bg-primary/5'
                      : 'border-v0-border-primary hover:bg-v0-border-primary/50'
                  }`}
                  onClick={() => selectProvider(provider.id)}
                >
                  <div className="flex items-center space-x-3">
                    {provider.icon}
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-muted-foreground">{provider.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(provider.status)}
                    {activeProvider === provider.id && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Credentials Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Provider Credentials</span>
            </CardTitle>
            <CardDescription>
              Configure credentials for cloud AI providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bedrock" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bedrock">AWS Bedrock</TabsTrigger>
                <TabsTrigger value="gemini">Google Gemini</TabsTrigger>
              </TabsList>

              {/* AWS Bedrock Tab */}
              <TabsContent value="bedrock" className="space-y-4">
                <div className="space-y-4">
                  <V0FormField
                    label="Access Key ID"
                    required={true}
                    description="Your AWS access key identifier (starts with AKIA)"
                  >
                    <Input
                      type="text"
                      placeholder="AKIA..."
                      value={bedrockCredentials.access_key_id}
                      onChange={(e) => handleBedrockCredentialsChange('access_key_id', e.target.value)}
                    />
                  </V0FormField>
                  
                  <V0FormField
                    label="Secret Access Key"
                    required={true}
                    description="Your AWS secret access key (keep this secure)"
                  >
                    <div className="relative">
                      <Input
                        type={showBedrockSecret ? "text" : "password"}
                        placeholder="Enter your AWS secret access key"
                        value={bedrockCredentials.secret_access_key}
                        onChange={(e) => handleBedrockCredentialsChange('secret_access_key', e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowBedrockSecret(!showBedrockSecret)}
                      >
                        {showBedrockSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </V0FormField>
                  
                  <V0FormField
                    label="Region"
                    required={true}
                    description="AWS region for Bedrock service (e.g., us-east-1)"
                  >
                    <Input
                      type="text"
                      placeholder="us-east-1"
                      value={bedrockCredentials.region}
                      onChange={(e) => handleBedrockCredentialsChange('region', e.target.value)}
                    />
                  </V0FormField>

                  <div className="flex space-x-2">
                    <Button onClick={saveBedrock} variant="outline">
                      Save Credentials
                    </Button>
                    <Button 
                      onClick={validateBedrock} 
                      disabled={isValidatingBedrock || !bedrockCredentials.access_key_id || !bedrockCredentials.secret_access_key}
                    >
                      {isValidatingBedrock ? 'Validating...' : 'Test Connection'}
                    </Button>
                  </div>

                  {/* Bedrock Validation Progress */}
                  {isValidatingBedrock && (
                    <div className="py-2">
                      <ContextIndicator 
                        isProcessing={isValidatingBedrock}
                        processedItems={50}
                        totalItems={100}
                        phase="processing"
                        ariaLabel="Validating AWS Bedrock credentials"
                      />
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        Testing AWS Bedrock connection...
                      </div>
                    </div>
                  )}

                  {bedrockValidationResult && (
                    <Alert className={bedrockValidationResult.success ? 'border-v0-teal/20 bg-v0-teal/10' : 'border-red-200 bg-red-50'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className={bedrockValidationResult.success ? 'text-v0-teal' : 'text-red-800'}>
                        {bedrockValidationResult.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              {/* Google Gemini Tab */}
              <TabsContent value="gemini" className="space-y-4">
                <div className="space-y-4">
                  <V0FormField
                    label="API Key"
                    required={true}
                    description="Your Google Gemini API key (keep this secure)"
                  >
                    <div className="relative">
                      <Input
                        type={showGeminiKey ? "text" : "password"}
                        placeholder="Enter your Google Gemini API key"
                        value={geminiCredentials.api_key}
                        onChange={(e) => handleGeminiCredentialsChange(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                      >
                        {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </V0FormField>

                  <div className="flex space-x-2">
                    <Button onClick={saveGemini} variant="outline">
                      Save Credentials
                    </Button>
                    <Button 
                      onClick={validateGemini} 
                      disabled={isValidatingGemini || !geminiCredentials.api_key}
                    >
                      {isValidatingGemini ? 'Validating...' : 'Test Connection'}
                    </Button>
                  </div>

                  {/* Gemini Validation Progress */}
                  {isValidatingGemini && (
                    <div className="py-2">
                      <ContextIndicator 
                        isProcessing={isValidatingGemini}
                        processedItems={50}
                        totalItems={100}
                        phase="processing"
                        ariaLabel="Validating Google Gemini credentials"
                      />
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        Testing Google Gemini connection...
                      </div>
                    </div>
                  )}

                  {geminiValidationResult && (
                    <Alert className={geminiValidationResult.success ? 'border-v0-teal/20 bg-v0-teal/10' : 'border-red-200 bg-red-50'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className={geminiValidationResult.success ? 'text-v0-teal' : 'text-red-800'}>
                        {geminiValidationResult.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              How to obtain credentials for each AI provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">AWS Bedrock</h4>
              <p className="text-sm text-muted-foreground mb-2">
                To use AWS Bedrock, you need an AWS account with Bedrock access:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Sign up for an AWS account at aws.amazon.com</li>
                <li>Request access to Claude models in AWS Bedrock console</li>
                <li>Create IAM credentials with Bedrock permissions</li>
                <li>Enter your Access Key ID and Secret Access Key above</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Google Gemini</h4>
              <p className="text-sm text-muted-foreground mb-2">
                To use Google Gemini, you need a Google Cloud account:
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Sign up for Google Cloud at cloud.google.com</li>
                <li>Enable the Gemini API in your project</li>
                <li>Create an API key in the Credentials section</li>
                <li>Enter your API key above</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
