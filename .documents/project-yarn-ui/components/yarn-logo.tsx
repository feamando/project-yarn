export function YarnLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="font-serif text-[#FFD700] font-normal text-xl leading-none">Y</span>
      <div className="w-1.5 h-1.5 bg-[#FF4136] rounded-full ml-0.5 mt-1"></div>
    </div>
  )
}
