interface YarnLogoProps {
  className?: string;
  /** Alternative text for screen readers */
  alt?: string;
  /** Whether the logo is decorative only */
  decorative?: boolean;
}

export function YarnLogo({ 
  className = "w-6 h-6", 
  alt = "Project Yarn",
  decorative = false 
}: YarnLogoProps) {
  return (
    <div 
      className={`flex items-center ${className}`} 
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : `${alt} Logo`}
      aria-hidden={decorative ? "true" : undefined}
      title={decorative ? undefined : `${alt} Logo`}
    >
      <span 
        className="font-serif text-v0-gold font-normal text-xl leading-none select-none"
        aria-hidden="true"
      >
        Y
      </span>
      <div 
        className="w-1.5 h-1.5 bg-v0-red rounded-full ml-0.5 mt-1"
        aria-hidden="true"
      ></div>
    </div>
  )
}
