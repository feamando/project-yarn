
import { TypographyShowcase } from '@/components/ui/Typography';

// === TYPOGRAPHY TEST COMPONENT ===
// Test page to verify Task 5.1 implementation

export function TypographyTest() {
  return (
    <div className="min-h-screen bg-v0-dark-bg">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-v0-4xl font-v0-bold text-v0-text-heading mb-4">
            Typography System Test
          </h1>
          <p className="text-v0-lg text-v0-text-secondary">
            Task 5.1: Typography and Visual Hierarchy Implementation
          </p>
        </div>
        
        <TypographyShowcase />
      </div>
    </div>
  );
}
