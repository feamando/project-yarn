// AI Block Card Component
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// Individual card component for displaying AI Blocks

import React from 'react';
import { AiBlock } from '../../stores/useAiBlocksStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Star, 
  StarOff, 
  Edit, 
  Copy, 
  Trash2, 
  Play, 
  Settings,
  TrendingUp,
  Calendar,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AiBlockCardProps {
  aiBlock: AiBlock;
  onEdit: (aiBlock: AiBlock) => void;
  onUse: (aiBlock: AiBlock) => void;
  onDuplicate: (aiBlock: AiBlock) => void;
  onDelete: (aiBlock: AiBlock) => void;
  onToggleFavorite: (aiBlock: AiBlock) => void;
  onSelect: (aiBlock: AiBlock) => void;
}

export const AiBlockCard: React.FC<AiBlockCardProps> = ({
  aiBlock,
  onEdit,
  onUse,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onSelect,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't select if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect(aiBlock);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      productivity: 'bg-v0-gold/10 text-v0-gold',
      development: 'bg-v0-teal/10 text-v0-teal',
      creativity: 'bg-v0-red/10 text-v0-red',
      education: 'bg-v0-gold/10 text-v0-gold',
      writing: 'bg-v0-teal/10 text-v0-teal',
      general: 'bg-v0-text-muted/10 text-v0-text-muted',
    };
    return colors[category] || colors.general;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-v0-shadow-sm transition-shadow duration-200 group"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate flex items-center">
              {aiBlock.is_system && (
                <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
              )}
              {aiBlock.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {aiBlock.description || 'No description provided'}
            </CardDescription>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(aiBlock);
            }}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {aiBlock.is_favorite ? (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Tags and Category */}
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge className={getCategoryColor(aiBlock.category)}>
            {aiBlock.category}
          </Badge>
          {aiBlock.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {aiBlock.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{aiBlock.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Template Preview */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground line-clamp-3 font-mono bg-v0-border-primary/30 p-2 rounded text-xs">
            {aiBlock.prompt_template}
          </p>
        </div>

        {/* Variables Info */}
        {aiBlock.variables.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Tag className="h-3 w-3 mr-1" />
              Variables ({aiBlock.variables.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {aiBlock.variables.slice(0, 3).map((variable, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {variable.name}
                  {variable.required && <span className="text-v0-red ml-1">*</span>}
                </Badge>
              ))}
              {aiBlock.variables.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{aiBlock.variables.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            Used {aiBlock.usage_count} times
          </div>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(aiBlock.updated_at * 1000), { addSuffix: true })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUse(aiBlock);
            }}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            Use
          </Button>
          
          {!aiBlock.is_system && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(aiBlock);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(aiBlock);
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          {!aiBlock.is_system && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(aiBlock);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
