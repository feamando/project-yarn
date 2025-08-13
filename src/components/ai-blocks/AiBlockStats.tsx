// AI Block Stats Component
// Task 3.3.1: Implement Reusable Prompts (AI Blocks)
// 
// Statistics sidebar component for AI Blocks usage analytics

import React from 'react';
import { useAiBlocksStore } from '../../stores/useAiBlocksStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  Star, 
  Users, 
  Settings,
  BarChart3,
  Calendar,
  Tag,
  Zap
} from 'lucide-react';

export const AiBlockStats: React.FC = () => {
  const { aiBlocks, categories } = useAiBlocksStore();

  // Calculate statistics
  const totalBlocks = aiBlocks.length;
  const systemBlocks = aiBlocks.filter(block => block.is_system).length;
  const userBlocks = aiBlocks.filter(block => !block.is_system).length;
  const favoriteBlocks = aiBlocks.filter(block => block.is_favorite).length;
  const totalUsage = aiBlocks.reduce((sum, block) => sum + block.usage_count, 0);

  // Most used blocks
  const mostUsedBlocks = [...aiBlocks]
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 5);

  // Category statistics
  const categoryStats = categories.map(category => {
    const categoryBlocks = aiBlocks.filter(block => block.category === category);
    const categoryUsage = categoryBlocks.reduce((sum, block) => sum + block.usage_count, 0);
    return {
      name: category,
      count: categoryBlocks.length,
      usage: categoryUsage,
      percentage: totalBlocks > 0 ? (categoryBlocks.length / totalBlocks) * 100 : 0,
    };
  }).sort((a, b) => b.count - a.count);

  // Recent activity (blocks updated in last 7 days)
  const oneWeekAgo = Date.now() / 1000 - (7 * 24 * 60 * 60);
  const recentlyUpdated = aiBlocks.filter(block => block.updated_at > oneWeekAgo).length;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      productivity: 'bg-blue-500',
      development: 'bg-v0-teal',
      creativity: 'bg-purple-500',
      education: 'bg-yellow-500',
      writing: 'bg-pink-500',
      general: 'bg-gray-500',
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-v0-border-primary/30 rounded">
              <div className="text-2xl font-bold text-primary">{totalBlocks}</div>
              <div className="text-xs text-muted-foreground">Total Blocks</div>
            </div>
            <div className="text-center p-2 bg-v0-border-primary/30 rounded">
              <div className="text-2xl font-bold text-orange-600">{totalUsage}</div>
              <div className="text-xs text-muted-foreground">Total Uses</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Settings className="h-3 w-3 mr-1 text-muted-foreground" />
                System
              </div>
              <Badge variant="secondary">{systemBlocks}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                User
              </div>
              <Badge variant="secondary">{userBlocks}</Badge>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Star className="h-3 w-3 mr-1 text-yellow-500" />
              Favorites
            </div>
            <Badge variant="secondary">{favoriteBlocks}</Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
              Recent Updates
            </div>
            <Badge variant="secondary">{recentlyUpdated}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryStats.slice(0, 6).map((category, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className={`w-2 h-2 rounded-full mr-2 ${getCategoryColor(category.name)}`}
                  />
                  <span className="capitalize">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {category.count}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {category.usage} uses
                  </span>
                </div>
              </div>
              <Progress 
                value={category.percentage} 
                className="h-1"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Most Used Blocks */}
      {mostUsedBlocks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Most Used
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mostUsedBlocks.map((block, index) => (
              <div key={block.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium mr-2">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{block.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {block.category}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {block.is_favorite && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {block.usage_count}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg. uses per block:</span>
            <span className="font-medium">
              {totalBlocks > 0 ? Math.round(totalUsage / totalBlocks) : 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Most popular category:</span>
            <span className="font-medium capitalize">
              {categoryStats[0]?.name || 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Blocks with variables:</span>
            <span className="font-medium">
              {aiBlocks.filter(block => block.variables.length > 0).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Favorite rate:</span>
            <span className="font-medium">
              {totalBlocks > 0 ? Math.round((favoriteBlocks / totalBlocks) * 100) : 0}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
