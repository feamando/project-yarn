import { Brain, Zap, CheckCircle, AlertCircle } from "lucide-react"

type ProcessingPhase = 'idle' | 'initializing' | 'processing' | 'completing' | 'complete' | 'error'

interface ContextIndicatorProps {
  isProcessing?: boolean
  processedItems?: number
  totalItems?: number
  phase?: ProcessingPhase
  error?: string
  ariaLabel?: string
  id?: string
  onFocus?: () => void
  onBlur?: () => void
}

export function ContextIndicator({
  isProcessing = false,
  processedItems = 847,
  totalItems = 1203,
  // phase = 'idle', // Unused parameter
  error,
  ariaLabel,
  id,
  onFocus,
  onBlur,
}: ContextIndicatorProps) {
  const progress = Math.round((processedItems / totalItems) * 100)
  
  // Determine processing phase based on progress and state
  const currentPhase: ProcessingPhase = error ? 'error' : 
    !isProcessing ? (progress === 100 ? 'complete' : 'idle') :
    progress === 0 ? 'initializing' :
    progress >= 95 ? 'completing' : 'processing'
  
  // Animation classes based on processing phase
  const getAnimationClasses = (phase: ProcessingPhase) => {
    switch (phase) {
      case 'initializing':
        return 'animate-pulse'
      case 'processing':
        return 'animate-spin'
      case 'completing':
        return 'animate-bounce'
      case 'complete':
        return 'animate-pulse'
      case 'error':
        return 'animate-pulse'
      default:
        return ''
    }
  }
  
  // Icon and color based on processing phase
  const getPhaseDisplay = (phase: ProcessingPhase) => {
    switch (phase) {
      case 'complete':
        return {
          icon: CheckCircle,
          iconColor: 'text-v0-teal',
          bgColor: 'bg-v0-teal/10 border-v0-teal/20',
          zapColor: 'text-v0-teal/80'
        }
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-v0-red',
          bgColor: 'bg-v0-red/10 border-v0-red/20',
          zapColor: 'text-v0-red/80'
        }
      case 'initializing':
        return {
          icon: Brain,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50 border-blue-200',
          zapColor: 'text-blue-400'
        }
      case 'completing':
        return {
          icon: Brain,
          iconColor: 'text-v0-teal',
          bgColor: 'bg-v0-teal/10 border-v0-teal/20',
          zapColor: 'text-v0-teal/80'
        }
      default:
        return {
          icon: Brain,
          iconColor: 'text-v0-gold',
          bgColor: 'bg-v0-dark-bg border-v0-border-primary',
          zapColor: 'text-v0-teal'
        }
    }
  }
  
  const phaseDisplay = getPhaseDisplay(currentPhase)
  const IconComponent = phaseDisplay.icon

  // Generate comprehensive accessibility labels
  const defaultAriaLabel = `Context analysis progress: ${progress}% complete. Status: ${currentPhase}. ${error ? `Error: ${error}` : `${processedItems} of ${totalItems} items processed.`}`
  const finalAriaLabel = ariaLabel || defaultAriaLabel
  
  return (
    <div 
      id={id}
      className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${phaseDisplay.bgColor}`}
      role="progressbar"
      tabIndex={0}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={finalAriaLabel}
      aria-describedby={id ? `${id}-description` : undefined}
      aria-live={currentPhase === 'processing' ? 'polite' : 'off'}
      aria-busy={isProcessing}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={(e) => {
        // Allow screen readers to announce updates on Enter/Space
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // Announce current status
          const announcement = document.createElement('div')
          announcement.setAttribute('aria-live', 'assertive')
          announcement.setAttribute('aria-atomic', 'true')
          announcement.className = 'sr-only'
          announcement.textContent = finalAriaLabel
          document.body.appendChild(announcement)
          setTimeout(() => document.body.removeChild(announcement), 1000)
        }
      }}
    >
      <div className="relative">
        <IconComponent 
          className={`w-4 h-4 ${phaseDisplay.iconColor} transition-colors duration-300`} 
          aria-label={`AI processing - ${currentPhase}`} 
        />
        {(isProcessing || currentPhase === 'completing') && (
          <div className="absolute -top-1 -right-1">
            <Zap 
              className={`w-2 h-2 ${phaseDisplay.zapColor} ${getAnimationClasses(currentPhase)} transition-colors duration-300`} 
              aria-label="Processing active" 
            />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className={`text-xs font-medium transition-colors duration-300 ${
          currentPhase === 'error' ? 'text-v0-red' :
          currentPhase === 'complete' ? 'text-v0-teal' :
          currentPhase === 'initializing' ? 'text-blue-700' :
          'text-v0-text-primary'
        }`}>
          {currentPhase === 'error' ? 'Processing Error' :
           currentPhase === 'complete' ? 'Analysis Complete' :
           currentPhase === 'initializing' ? 'Initializing...' :
           currentPhase === 'completing' ? 'Finalizing...' :
           'Context Analysis'}
        </div>
        <div className="text-xs text-v0-text-muted" aria-live="polite">
          {error ? error : 
           `${processedItems.toLocaleString()} / ${totalItems.toLocaleString()} items (${progress}%)`}
        </div>
        
        {/* Progress bar for visual feedback */}
        <div className="w-full bg-gray-200 rounded-full h-1 mt-1 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              currentPhase === 'error' ? 'bg-v0-red' :
              currentPhase === 'complete' ? 'bg-v0-teal' :
              currentPhase === 'initializing' ? 'bg-blue-500' :
              currentPhase === 'completing' ? 'bg-v0-teal/80' :
              'bg-v0-teal'
            } ${currentPhase === 'processing' ? 'animate-pulse' : ''}`}
            style={{ width: `${Math.max(progress, currentPhase === 'initializing' ? 5 : 0)}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}
