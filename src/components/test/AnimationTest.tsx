import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonList,
  Interactive,
  FadeTransition,
  SlideTransition,
  LoadingSpinner,
  PulseIndicator,
} from '@/components/ui/Animation';

/**
 * AnimationTest Component
 * 
 * Test component to verify Task 5.2 animation system implementation:
 * - Task 5.2.3: Loading states with skeleton animations
 * - Task 5.2.4: Hover and focus animations for interactive elements
 * - Task 5.2.5: Page transition animations
 */
export const AnimationTest: React.FC = () => {
  const [showContent, setShowContent] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'up' | 'down'>('left');

  return (
    <div className="p-v0-6 space-y-v0-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Animation System Test - Task 5.2</CardTitle>
        </CardHeader>
        <CardContent className="space-y-v0-8">
          
          {/* Task 5.2.3: Loading States with Skeleton Animations */}
          <section>
            <h3 className="text-lg font-semibold mb-v0-4 text-v0-text-primary">
              Task 5.2.3: Skeleton Loading Animations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-v0-6">
              
              {/* Basic Skeletons */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Basic Skeletons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-v0-3">
                  <Skeleton variant="text" width="3/4" />
                  <Skeleton variant="text" width="1/2" size="sm" />
                  <Skeleton variant="button" className="h-10 w-24" />
                  <Skeleton variant="avatar" className="h-12 w-12" />
                </CardContent>
              </Card>

              {/* Skeleton Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Skeleton Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkeletonText lines={4} />
                </CardContent>
              </Card>

              {/* Skeleton Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Skeleton Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkeletonCard />
                </CardContent>
              </Card>

              {/* Skeleton List */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Skeleton List</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkeletonList items={3} />
                </CardContent>
              </Card>

              {/* Loading Spinners */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Loading Spinners</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center space-x-v0-4">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Task 5.2.4: Interactive Element Animations */}
          <section>
            <h3 className="text-lg font-semibold mb-v0-4 text-v0-text-primary">
              Task 5.2.4: Interactive Element Animations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-v0-4">
              
              <Interactive variant="default">
                <Button variant="outline" className="w-full">
                  Scale Hover
                </Button>
              </Interactive>

              <Interactive variant="subtle">
                <Button variant="outline" className="w-full">
                  Subtle Hover
                </Button>
              </Interactive>

              <Interactive variant="glow">
                <Button variant="outline" className="w-full">
                  Glow Effect
                </Button>
              </Interactive>

              <Interactive variant="lift">
                <Button variant="outline" className="w-full">
                  Lift Effect
                </Button>
              </Interactive>

              <Interactive variant="bounce">
                <Button variant="outline" className="w-full">
                  Bounce Effect
                </Button>
              </Interactive>

              <Interactive variant="fade">
                <Button variant="outline" className="w-full">
                  Fade Effect
                </Button>
              </Interactive>

              <Interactive variant="border">
                <Button variant="outline" className="w-full">
                  Border Effect
                </Button>
              </Interactive>

              <Interactive variant="rotate">
                <Button variant="outline" className="w-full">
                  Rotate Effect
                </Button>
              </Interactive>
            </div>

            {/* Speed Variations */}
            <div className="mt-v0-6">
              <h4 className="text-md font-medium mb-v0-3 text-v0-text-secondary">
                Animation Speeds
              </h4>
              <div className="flex space-x-v0-4">
                <Interactive variant="default" speed="fast">
                  <Button variant="outline">Fast (150ms)</Button>
                </Interactive>
                <Interactive variant="default" speed="normal">
                  <Button variant="outline">Normal (200ms)</Button>
                </Interactive>
                <Interactive variant="default" speed="slow">
                  <Button variant="outline">Slow (300ms)</Button>
                </Interactive>
                <Interactive variant="default" speed="slower">
                  <Button variant="outline">Slower (500ms)</Button>
                </Interactive>
              </div>
            </div>

            {/* Disabled State */}
            <div className="mt-v0-4">
              <Interactive variant="default" disabled={true}>
                <Button variant="outline" disabled>
                  Disabled Button
                </Button>
              </Interactive>
            </div>
          </section>

          {/* Task 5.2.5: Page Transition Animations */}
          <section>
            <h3 className="text-lg font-semibold mb-v0-4 text-v0-text-primary">
              Task 5.2.5: Page Transition Animations
            </h3>
            
            {/* Fade Transitions */}
            <div className="space-y-v0-4">
              <div className="flex items-center space-x-v0-4">
                <Button 
                  onClick={() => setShowContent(!showContent)}
                  variant="outline"
                >
                  Toggle Fade Transition
                </Button>
                <span className="text-sm text-v0-text-muted">
                  Current state: {showContent ? 'Visible' : 'Hidden'}
                </span>
              </div>
              
              <Card className="h-32">
                <FadeTransition show={showContent} duration="normal">
                  <CardContent className="p-v0-6">
                    <h4 className="font-medium text-v0-text-primary">Fade Transition Content</h4>
                    <p className="text-sm text-v0-text-secondary mt-v0-2">
                      This content fades in and out smoothly using the v0 animation system.
                    </p>
                  </CardContent>
                </FadeTransition>
              </Card>
            </div>

            {/* Slide Transitions */}
            <div className="space-y-v0-4 mt-v0-6">
              <div className="flex items-center space-x-v0-4">
                <Button 
                  onClick={() => setShowContent(!showContent)}
                  variant="outline"
                >
                  Toggle Slide Transition
                </Button>
                <select 
                  value={slideDirection} 
                  onChange={(e) => setSlideDirection(e.target.value as any)}
                  className="px-v0-3 py-v0-1 border border-v0-border-primary rounded bg-v0-dark-bg text-v0-text-primary"
                >
                  <option value="left">Slide Left</option>
                  <option value="right">Slide Right</option>
                  <option value="up">Slide Up</option>
                  <option value="down">Slide Down</option>
                </select>
              </div>
              
              <Card className="h-32 overflow-hidden">
                <SlideTransition show={showContent} direction={slideDirection} duration="normal">
                  <CardContent className="p-v0-6">
                    <h4 className="font-medium text-v0-text-primary">Slide Transition Content</h4>
                    <p className="text-sm text-v0-text-secondary mt-v0-2">
                      This content slides in from the {slideDirection} direction.
                    </p>
                  </CardContent>
                </SlideTransition>
              </Card>
            </div>
          </section>

          {/* Pulse Indicators */}
          <section>
            <h3 className="text-lg font-semibold mb-v0-4 text-v0-text-primary">
              Pulse Indicators
            </h3>
            <div className="flex items-center space-x-v0-6">
              <div className="flex items-center space-x-v0-2">
                <PulseIndicator variant="default" />
                <span className="text-sm">Default</span>
              </div>
              <div className="flex items-center space-x-v0-2">
                <PulseIndicator variant="success" />
                <span className="text-sm">Success</span>
              </div>
              <div className="flex items-center space-x-v0-2">
                <PulseIndicator variant="warning" />
                <span className="text-sm">Warning</span>
              </div>
              <div className="flex items-center space-x-v0-2">
                <PulseIndicator variant="error" />
                <span className="text-sm">Error</span>
              </div>
            </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
};
