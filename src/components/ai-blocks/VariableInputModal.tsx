// Variable Input Modal Component
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// Modal dialog for collecting variable values when using AI Blocks

import React, { useState, useEffect } from 'react';
import { useAiBlocksStore, AiBlock, AiBlockVariable } from '../../stores/useAiBlocksStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Play } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface VariableInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiBlock: AiBlock | null;
  onUse: (processedPrompt: string) => void;
}

interface VariableValues {
  [key: string]: string;
}

export const VariableInputModal: React.FC<VariableInputModalProps> = ({
  isOpen,
  onClose,
  aiBlock,
  onUse,
}) => {
  const { processTemplate, isLoading, error } = useAiBlocksStore();
  
  const [variableValues, setVariableValues] = useState<VariableValues>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [processedPrompt, setProcessedPrompt] = useState<string>('');

  // Initialize variable values with defaults
  useEffect(() => {
    if (isOpen && aiBlock) {
      const initialValues: VariableValues = {};
      aiBlock.variables.forEach(variable => {
        initialValues[variable.name] = variable.default_value || '';
      });
      setVariableValues(initialValues);
      setValidationErrors({});
      setProcessedPrompt('');
    }
  }, [isOpen, aiBlock]);

  // Update processed prompt when variable values change
  useEffect(() => {
    if (aiBlock && Object.keys(variableValues).length > 0) {
      updateProcessedPrompt();
    }
  }, [variableValues, aiBlock]);

  const updateProcessedPrompt = async () => {
    if (!aiBlock) return;

    try {
      const result = await processTemplate(aiBlock.id, variableValues);
      setProcessedPrompt(result);
    } catch (error) {
      console.error('Failed to process template:', error);
      setProcessedPrompt(aiBlock.prompt_template);
    }
  };

  const validateForm = (): boolean => {
    if (!aiBlock) return false;

    const errors: Record<string, string> = {};

    aiBlock.variables.forEach(variable => {
      const value = variableValues[variable.name]?.trim() || '';
      if (variable.required && !value) {
        errors[variable.name] = `${variable.name} is required`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!aiBlock || !validateForm()) {
      return;
    }

    try {
      const result = await processTemplate(aiBlock.id, variableValues);
      onUse(result);
      onClose();
    } catch (error) {
      console.error('Failed to process template:', error);
    }
  };

  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value,
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!aiBlock) {
    return null;
  }

  // If no variables, use the block directly
  if (aiBlock.variables.length === 0) {
    useEffect(() => {
      if (isOpen) {
        onUse(aiBlock.prompt_template);
        onClose();
      }
    }, [isOpen]);
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Play className="h-5 w-5 mr-2" />
            Use AI Block: {aiBlock.name}
          </DialogTitle>
          <DialogDescription>
            {aiBlock.description || 'Fill in the variables to use this AI Block.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* AI Block Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">AI Block Details</CardTitle>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {aiBlock.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aiBlock.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {aiBlock.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Used {aiBlock.usage_count} times
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Variable Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Variables ({aiBlock.variables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiBlock.variables.map((variable, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={variable.name} className="flex items-center">
                    {variable.name}
                    {variable.required && <span className="text-red-500 ml-1">*</span>}
                    {variable.description && (
                      <span className="text-sm text-muted-foreground ml-2">
                        - {variable.description}
                      </span>
                    )}
                  </Label>
                  
                  {variable.name.toLowerCase().includes('description') || 
                   variable.name.toLowerCase().includes('content') || 
                   variable.name.toLowerCase().includes('text') ? (
                    <Textarea
                      id={variable.name}
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      placeholder={variable.default_value || `Enter ${variable.name}`}
                      rows={3}
                      className={validationErrors[variable.name] ? 'border-destructive' : ''}
                      onKeyPress={handleKeyPress}
                    />
                  ) : (
                    <Input
                      id={variable.name}
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      placeholder={variable.default_value || `Enter ${variable.name}`}
                      className={validationErrors[variable.name] ? 'border-destructive' : ''}
                      onKeyPress={handleKeyPress}
                    />
                  )}
                  
                  {validationErrors[variable.name] && (
                    <p className="text-sm text-destructive">{validationErrors[variable.name]}</p>
                  )}
                  
                  {variable.default_value && (
                    <p className="text-xs text-muted-foreground">
                      Default: {variable.default_value}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preview */}
          {processedPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-3 rounded text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {processedPrompt}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <p className="text-xs text-muted-foreground self-center">
              Press Ctrl+Enter to use
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Use AI Block'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
