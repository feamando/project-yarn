// Edit AI Block Modal Component
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// Modal dialog for editing existing AI Blocks

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Plus, X, AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface EditAiBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiBlock: AiBlock | null;
}

interface FormData {
  name: string;
  description: string;
  prompt_template: string;
  category: string;
  tags: string[];
  variables: AiBlockVariable[];
}

const DEFAULT_CATEGORIES = [
  'productivity',
  'development',
  'creativity',
  'education',
  'writing',
  'general',
];

export const EditAiBlockModal: React.FC<EditAiBlockModalProps> = ({
  isOpen,
  onClose,
  aiBlock,
}) => {
  const { updateAiBlock, isLoading, error } = useAiBlocksStore();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    prompt_template: '',
    category: 'general',
    tags: [],
    variables: [],
  });
  
  const [tagInput, setTagInput] = useState('');
  const [variableInput, setVariableInput] = useState({
    name: '',
    description: '',
    required: false,
    default_value: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form with AI Block data
  useEffect(() => {
    if (isOpen && aiBlock) {
      setFormData({
        name: aiBlock.name,
        description: aiBlock.description || '',
        prompt_template: aiBlock.prompt_template,
        category: aiBlock.category,
        tags: [...aiBlock.tags],
        variables: [...aiBlock.variables],
      });
      setTagInput('');
      setVariableInput({
        name: '',
        description: '',
        required: false,
        default_value: '',
      });
      setValidationErrors({});
    }
  }, [isOpen, aiBlock]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.prompt_template.trim()) {
      errors.prompt_template = 'Prompt template is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    // Validate variable names are unique
    const variableNames = formData.variables.map(v => v.name);
    const duplicateNames = variableNames.filter((name, index) => variableNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.variables = `Duplicate variable names: ${duplicateNames.join(', ')}`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!aiBlock || !validateForm()) {
      return;
    }

    try {
      await updateAiBlock(aiBlock.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        prompt_template: formData.prompt_template.trim(),
        category: formData.category,
        tags: formData.tags,
        variables: formData.variables,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update AI Block:', error);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleAddVariable = () => {
    const variable = variableInput.name.trim();
    if (variable && !formData.variables.some(v => v.name === variable)) {
      setFormData(prev => ({
        ...prev,
        variables: [
          ...prev.variables,
          {
            name: variable,
            description: variableInput.description.trim(),
            required: variableInput.required,
            default_value: variableInput.default_value.trim() || undefined,
          },
        ],
      }));
      setVariableInput({
        name: '',
        description: '',
        required: false,
        default_value: '',
      });
    }
  };

  const handleRemoveVariable = (variableToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v.name !== variableToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  if (!aiBlock) {
    return null;
  }

  // System AI Blocks cannot be edited
  if (aiBlock.is_system) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              System AI Block
            </DialogTitle>
            <DialogDescription>
              System AI Blocks cannot be edited. You can duplicate this block to create a custom version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit AI Block</DialogTitle>
          <DialogDescription>
            Update your AI prompt template with variables and configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter AI Block name"
                className={validationErrors.name ? 'border-destructive' : ''}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this AI Block does"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className={validationErrors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.category && (
                <p className="text-sm text-destructive mt-1">{validationErrors.category}</p>
              )}
            </div>
          </div>

          {/* Prompt Template */}
          <div>
            <Label htmlFor="prompt_template">Prompt Template *</Label>
            <Textarea
              id="prompt_template"
              value={formData.prompt_template}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt_template: e.target.value }))}
              placeholder="Enter your prompt template. Use {{variable_name}} for variables."
              rows={6}
              className={`font-mono ${validationErrors.prompt_template ? 'border-destructive' : ''}`}
            />
            {validationErrors.prompt_template && (
              <p className="text-sm text-destructive mt-1">{validationErrors.prompt_template}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Use double curly braces for variables: {`{{variable_name}}`}
            </p>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {validationErrors.variables && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationErrors.variables}</AlertDescription>
                </Alert>
              )}

              {/* Add Variable Form */}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={variableInput.name}
                  onChange={(e) => setVariableInput(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Variable name"
                  onKeyPress={(e) => handleKeyPress(e, handleAddVariable)}
                />
                <Input
                  value={variableInput.description}
                  onChange={(e) => setVariableInput(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  onKeyPress={(e) => handleKeyPress(e, handleAddVariable)}
                />
                <Input
                  value={variableInput.default_value}
                  onChange={(e) => setVariableInput(prev => ({ ...prev, default_value: e.target.value }))}
                  placeholder="Default value (optional)"
                  onKeyPress={(e) => handleKeyPress(e, handleAddVariable)}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={variableInput.required}
                    onCheckedChange={(checked) => 
                      setVariableInput(prev => ({ ...prev, required: checked as boolean }))
                    }
                  />
                  <Label htmlFor="required" className="text-sm">Required</Label>
                  <Button type="button" onClick={handleAddVariable} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Variables List */}
              {formData.variables.length > 0 && (
                <div className="space-y-2">
                  {formData.variables.map((variable, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {variable.name}
                            {variable.required && <span className="text-red-500 ml-1">*</span>}
                          </Badge>
                          {variable.description && (
                            <span className="text-sm text-muted-foreground">
                              {variable.description}
                            </span>
                          )}
                          {variable.default_value && (
                            <Badge variant="secondary" className="text-xs">
                              default: {variable.default_value}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariable(variable.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update AI Block'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
