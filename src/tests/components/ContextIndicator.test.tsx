import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContextIndicator } from '@/components/v0-components/context-indicator';

describe('ContextIndicator Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<ContextIndicator />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Context Analysis')).toBeInTheDocument();
      expect(screen.getByText('847 / 1,203 items (70%)')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
      render(
        <ContextIndicator
          isProcessing={true}
          processedItems={250}
          totalItems={500}
          ariaLabel="Custom processing indicator"
        />
      );
      
      expect(screen.getByText('250 / 500 items (50%)')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Custom processing indicator');
    });
  });

  describe('Processing Phases', () => {
    it('displays idle phase correctly', () => {
      render(
        <ContextIndicator
          isProcessing={false}
          processedItems={0}
          totalItems={100}
        />
      );
      
      expect(screen.getByText('Context Analysis')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-busy', 'false');
    });

    it('displays initializing phase correctly', () => {
      render(
        <ContextIndicator
          isProcessing={true}
          processedItems={0}
          totalItems={100}
        />
      );
      
      expect(screen.getByText('Initializing...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-live', 'polite');
    });

    it('displays processing phase correctly', () => {
      render(
        <ContextIndicator
          isProcessing={true}
          processedItems={50}
          totalItems={100}
        />
      );
      
      expect(screen.getByText('Context Analysis')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });

    it('displays completing phase correctly', () => {
      render(
        <ContextIndicator
          isProcessing={true}
          processedItems={96}
          totalItems={100}
        />
      );
      
      expect(screen.getByText('Finalizing...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '96');
    });

    it('displays complete phase correctly', () => {
      render(
        <ContextIndicator
          isProcessing={false}
          processedItems={100}
          totalItems={100}
        />
      );
      
      expect(screen.getByText('Analysis Complete')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('displays error phase correctly', () => {
      render(
        <ContextIndicator
          isProcessing={false}
          processedItems={25}
          totalItems={100}
          error="Network connection failed"
        />
      );
      
      expect(screen.getByText('Processing Error')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });
  });

  describe('Progress Scenarios', () => {
    it('handles 0% progress', () => {
      render(
        <ContextIndicator
          processedItems={0}
          totalItems={1000}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0 / 1,000 items (0%)')).toBeInTheDocument();
    });

    it('handles 25% progress', () => {
      render(
        <ContextIndicator
          isProcessing={true}
          processedItems={250}
          totalItems={1000}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
      expect(screen.getByText('250 / 1,000 items (25%)')).toBeInTheDocument();
    });

    it('handles 50% progress', () => {
      render(
        <ContextIndicator
          isProcessing={true}
          processedItems={500}
          totalItems={1000}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      expect(screen.getByText('500 / 1,000 items (50%)')).toBeInTheDocument();
    });

    it('handles 75% progress', () => {
      render(
        <ContextIndicator
          isProcessing={true}
          processedItems={750}
          totalItems={1000}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
      expect(screen.getByText('750 / 1,000 items (75%)')).toBeInTheDocument();
    });

    it('handles 100% progress', () => {
      render(
        <ContextIndicator
          processedItems={1000}
          totalItems={1000}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByText('1,000 / 1,000 items (100%)')).toBeInTheDocument();
    });

    it('handles large numbers with proper formatting', () => {
      render(
        <ContextIndicator
          processedItems={1234567}
          totalItems={9876543}
        />
      );
      
      expect(screen.getByText('1,234,567 / 9,876,543 items (12%)')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes', () => {
      render(
        <ContextIndicator
          id="test-indicator"
          processedItems={50}
          totalItems={100}
        />
      );
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('id', 'test-indicator');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('tabindex', '0');
    });

    it('supports keyboard navigation', () => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      
      render(
        <ContextIndicator
          onFocus={onFocus}
          onBlur={onBlur}
          processedItems={50}
          totalItems={100}
        />
      );
      
      const progressbar = screen.getByRole('progressbar');
      
      fireEvent.focus(progressbar);
      expect(onFocus).toHaveBeenCalled();
      
      fireEvent.blur(progressbar);
      expect(onBlur).toHaveBeenCalled();
    });

    it('announces status on Enter key press', async () => {
      render(
        <ContextIndicator
          processedItems={50}
          totalItems={100}
        />
      );
      
      const progressbar = screen.getByRole('progressbar');
      fireEvent.keyDown(progressbar, { key: 'Enter' });
      
      // Check that announcement element is temporarily created
      await waitFor(() => {
        const announcements = document.querySelectorAll('[aria-live="assertive"]');
        expect(announcements.length).toBeGreaterThan(0);
      });
    });

    it('announces status on Space key press', async () => {
      render(
        <ContextIndicator
          processedItems={75}
          totalItems={100}
        />
      );
      
      const progressbar = screen.getByRole('progressbar');
      fireEvent.keyDown(progressbar, { key: ' ' });
      
      await waitFor(() => {
        const announcements = document.querySelectorAll('[aria-live="assertive"]');
        expect(announcements.length).toBeGreaterThan(0);
      });
    });

    it('has proper live region for processing state', () => {
      const { rerender } = render(
        <ContextIndicator
          isProcessing={false}
          processedItems={50}
          totalItems={100}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-live', 'off');
      
      rerender(
        <ContextIndicator
          isProcessing={true}
          processedItems={50}
          totalItems={100}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Visual States and Animations', () => {
    it('applies correct CSS classes for different phases', () => {
      const { rerender } = render(
        <ContextIndicator
          isProcessing={true}
          processedItems={0}
          totalItems={100}
        />
      );
      
      // Initializing phase
      expect(screen.getByRole('progressbar')).toHaveClass('bg-blue-50', 'border-blue-200');
      
      // Processing phase
      rerender(
        <ContextIndicator
          isProcessing={true}
          processedItems={50}
          totalItems={100}
        />
      );
      
      // Completing phase
      rerender(
        <ContextIndicator
          isProcessing={true}
          processedItems={96}
          totalItems={100}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveClass('bg-green-50', 'border-green-200');
      
      // Complete phase
      rerender(
        <ContextIndicator
          isProcessing={false}
          processedItems={100}
          totalItems={100}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveClass('bg-green-50', 'border-green-200');
      
      // Error phase
      rerender(
        <ContextIndicator
          error="Test error"
          processedItems={50}
          totalItems={100}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('shows progress bar with correct width', () => {
      render(
        <ContextIndicator
          processedItems={30}
          totalItems={100}
        />
      );
      
      const progressBar = document.querySelector('[style*="width: 30%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows minimum progress for initializing phase', () => {
      render(
        <ContextIndicator
          isProcessing={true}
          processedItems={0}
          totalItems={100}
        />
      );
      
      const progressBar = document.querySelector('[style*="width: 5%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total items', () => {
      render(
        <ContextIndicator
          processedItems={0}
          totalItems={0}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles processed items exceeding total items', () => {
      render(
        <ContextIndicator
          processedItems={150}
          totalItems={100}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '150');
    });

    it('handles negative values gracefully', () => {
      render(
        <ContextIndicator
          processedItems={-10}
          totalItems={100}
        />
      );
      
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '-10');
    });

    it('handles very long error messages', () => {
      const longError = 'This is a very long error message that should be displayed properly without breaking the component layout or accessibility features';
      
      render(
        <ContextIndicator
          error={longError}
          processedItems={25}
          totalItems={100}
        />
      );
      
      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders quickly with large numbers', () => {
      const startTime = performance.now();
      
      render(
        <ContextIndicator
          processedItems={9999999}
          totalItems={10000000}
        />
      );
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should render in less than 50ms
    });

    it('updates efficiently when props change', () => {
      const { rerender } = render(
        <ContextIndicator
          processedItems={0}
          totalItems={100}
        />
      );
      
      const startTime = performance.now();
      
      // Simulate rapid progress updates
      for (let i = 1; i <= 100; i += 10) {
        rerender(
          <ContextIndicator
            processedItems={i}
            totalItems={100}
          />
        );
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should update efficiently
    });
  });
});
