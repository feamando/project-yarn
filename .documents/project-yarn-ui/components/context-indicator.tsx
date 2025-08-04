import { Brain, Zap } from "lucide-react"

interface ContextIndicatorProps {
  isProcessing?: boolean
  processedItems?: number
  totalItems?: number
}

export function ContextIndicator({
  isProcessing = false,
  processedItems = 847,
  totalItems = 1203,
}: ContextIndicatorProps) {
  const progress = Math.round((processedItems / totalItems) * 100)

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#1E1E1E] rounded-md border border-[#3E3E42]">
      <div className="relative">
        <Brain className="w-4 h-4 text-[#FFD700]" />
        {isProcessing && (
          <div className="absolute -top-1 -right-1">
            <Zap className="w-2 h-2 text-[#4EC9B0] animate-pulse" />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="text-xs font-medium text-[#D4D4D4]">Context Analysis</div>
        <div className="text-xs text-[#858585]">
          {processedItems.toLocaleString()} / {totalItems.toLocaleString()} items ({progress}%)
        </div>
      </div>
    </div>
  )
}
