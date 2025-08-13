import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FileText, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  FileEdit,
  GitBranch,
  Target
} from 'lucide-react';
import { ContextIndicator } from '@/components/context-indicator';

// Document state types based on FSM implementation
type DocumentState = 
  | 'draft' 
  | 'memo' 
  | 'prfaq' 
  | 'prd' 
  | 'epic_breakdown' 
  | 'archived';

// Document transformation options
interface TransformationOption {
  id: string;
  label: string;
  description: string;
  targetState: DocumentState;
  icon: React.ReactNode;
  fromStates: DocumentState[];
}

// Document information (matching app store structure)
interface Document {
  id: string;
  name: string;
  path: string;
  state: DocumentState | 'review' | 'published'; // Support both FSM states and existing app store states
  projectId: string;
}



// Available transformation options based on FSM logic
const TRANSFORMATION_OPTIONS: TransformationOption[] = [
  {
    id: 'to-memo',
    label: 'Transform to Memo',
    description: 'Convert document to a structured memo format',
    targetState: 'memo',
    icon: <FileEdit className="h-4 w-4" />,
    fromStates: ['draft']
  },
  {
    id: 'to-prfaq',
    label: 'Transform to PR FAQ',
    description: 'Convert memo to a Press Release FAQ format',
    targetState: 'prfaq',
    icon: <Target className="h-4 w-4" />,
    fromStates: ['memo']
  },
  {
    id: 'to-prd',
    label: 'Transform to PRD',
    description: 'Convert PR FAQ to a Product Requirements Document',
    targetState: 'prd',
    icon: <FileText className="h-4 w-4" />,
    fromStates: ['prfaq']
  },
  {
    id: 'to-epic-breakdown',
    label: 'Transform to Epic Breakdown',
    description: 'Convert PRD to an Epic Breakdown with tasks',
    targetState: 'epic_breakdown',
    icon: <GitBranch className="h-4 w-4" />,
    fromStates: ['prd']
  },
  {
    id: 'back-to-draft',
    label: 'Back to Draft',
    description: 'Return document to draft state for editing',
    targetState: 'draft',
    icon: <FileEdit className="h-4 w-4" />,
    fromStates: ['memo', 'prfaq', 'prd', 'epic_breakdown']
  }
];

interface DocumentTransformationUIProps {
  document?: Document;
  onTransformationComplete?: (document: Document, newState: DocumentState) => void;
  onClose?: () => void;
}

export const DocumentTransformationUI: React.FC<DocumentTransformationUIProps> = ({
  document,
  onTransformationComplete,
  onClose
}) => {
  const [selectedTransformation, setSelectedTransformation] = useState<string>('');
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiAssisted, setAiAssisted] = useState(true);

  // Get available transformations for current document state
  const availableTransformations = TRANSFORMATION_OPTIONS.filter(option => {
    if (!document) return true;
    // Handle both FSM states and app store states
    const docState = document.state;
    // If it's an FSM state, check directly
    if (['draft', 'memo', 'prfaq', 'prd', 'epic_breakdown', 'archived'].includes(docState)) {
      return option.fromStates.includes(docState as DocumentState);
    }
    // For app store states, map to draft for transformation options
    return option.fromStates.includes('draft');
  });

  // Reset state when document changes
  useEffect(() => {
    setSelectedTransformation('');
    setError(null);
    setSuccess(null);
  }, [document]);

  // Get state display info
  const getStateInfo = (state: DocumentState | 'review' | 'published') => {
    const stateConfig = {
      draft: { label: 'Draft', color: 'bg-gray-500', description: 'Initial draft state' },
      memo: { label: 'Memo', color: 'bg-blue-500', description: 'Structured memo format' },
      prfaq: { label: 'PR FAQ', color: 'bg-v0-teal', description: 'Press Release FAQ' },
      prd: { label: 'PRD', color: 'bg-purple-500', description: 'Product Requirements Document' },
      epic_breakdown: { label: 'Epic Breakdown', color: 'bg-orange-500', description: 'Epic with task breakdown' },
      archived: { label: 'Archived', color: 'bg-red-500', description: 'Archived document' }
    };
    return stateConfig[state as DocumentState] || stateConfig.draft;
  };

  // Handle transformation
  const handleTransformation = async () => {
    if (!document || !selectedTransformation) return;

    const transformation = TRANSFORMATION_OPTIONS.find(t => t.id === selectedTransformation);
    if (!transformation) return;

    setIsTransforming(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await invoke('transform_document', {
        document_id: document.id,
        target_state: transformation.targetState,
        ai_assisted: aiAssisted,
        context: aiAssisted ? `Transform document from ${document.state} to ${transformation.targetState}` : undefined
      });

      if ((response as any).success) {
        setSuccess(`Document successfully transformed to ${transformation.label}!`);
        
        // Update document state and notify parent
        const updatedDocument = {
          ...document,
          state: transformation.targetState
        };
        
        onTransformationComplete?.(updatedDocument, transformation.targetState);
        
        // Auto-close after success
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        throw new Error((response as any).message || 'Transformation failed');
      }
    } catch (err) {
      console.error('Transformation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transform document');
    } finally {
      setIsTransforming(false);
    }
  };

  // Handle AI assistance toggle
  const toggleAiAssistance = () => {
    setAiAssisted(!aiAssisted);
  };

  if (!document) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Document Transformation</span>
          </CardTitle>
          <CardDescription>
            Select a document to transform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No document selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStateInfo = getStateInfo(document.state);
  const selectedOption = TRANSFORMATION_OPTIONS.find(t => t.id === selectedTransformation);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Zap className="h-5 w-5 text-primary" />
          <span>Transform Document</span>
        </CardTitle>
        <CardDescription>
          Use AI to transform your document to a different format
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Document Info */}
        <div className="p-3 bg-v0-bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{document.name}</span>
            <Badge className={`text-xs ${currentStateInfo.color} text-white`}>
              {currentStateInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{currentStateInfo.description}</p>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="border-v0-teal/20 bg-v0-teal/10">
            <CheckCircle className="h-4 w-4 text-v0-teal" />
            <AlertDescription className="text-v0-teal">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Document Processing Status */}
        {isTransforming && (
          <div className="py-2">
            <ContextIndicator 
              isProcessing={isTransforming}
              processedItems={75}
              totalItems={100}
              phase="processing"
              ariaLabel="Processing document transformation"
            />
            <div className="text-xs text-gray-500 mt-1 text-center">
              Processing document transformation...
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Transformation Selection */}
        {availableTransformations.length > 0 ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Transformation
              </label>
              <Select 
                value={selectedTransformation} 
                onValueChange={setSelectedTransformation}
                disabled={isTransforming}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose transformation..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTransformations.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center space-x-2">
                        {option.icon}
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transformation Preview */}
            {selectedOption && (
              <div className="p-3 bg-v0-bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-center space-x-3 text-sm">
                  <Badge className={`${currentStateInfo.color} text-white`}>
                    {currentStateInfo.label}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge className={`${getStateInfo(selectedOption.targetState).color} text-white`}>
                    {getStateInfo(selectedOption.targetState).label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {selectedOption.description}
                </p>
              </div>
            )}

            {/* AI Assistance Toggle */}
            <div className="flex items-center justify-between p-3 bg-v0-bg-secondary/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI-Assisted Transformation</span>
              </div>
              <Button
                variant={aiAssisted ? "default" : "outline"}
                size="sm"
                onClick={toggleAiAssistance}
                disabled={isTransforming}
              >
                {aiAssisted ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {aiAssisted && (
              <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                AI will help restructure and enhance your content during transformation
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transformations available</p>
            <p className="text-xs mt-1">
              This document is in {currentStateInfo.label} state
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isTransforming}
          >
            Cancel
          </Button>
          
          {availableTransformations.length > 0 && (
            <Button
              onClick={handleTransformation}
              disabled={!selectedTransformation || isTransforming}
              className="flex items-center space-x-2"
            >
              {isTransforming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Transforming...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Transform</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
