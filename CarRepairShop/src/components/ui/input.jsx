import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({
  className,
  type = "text",
  icon: Icon,
  startIcon,
  endIcon,
  ...props
}) {
  const effectiveStartIcon = startIcon || (Icon ? (typeof Icon === 'function' ? <Icon size={14} className="text-app-muted" /> : Icon) : null)

  const hasCustomPx = className && /\b(?:[a-z]+:)?px-/.test(className)
  const hasCustomPl = className && /\b(?:[a-z]+:)?pl-/.test(className)
  const hasCustomPr = className && /\b(?:[a-z]+:)?pr-/.test(className)
  const hasCustomPy = className && /\b(?:[a-z]+:)?p[ybt]-/.test(className)

  const autoPl = (effectiveStartIcon && !hasCustomPl && !hasCustomPx) ? "pl-9" : ""

  let paddingX = "px-3.5 sm:px-3"
  if (hasCustomPx || (hasCustomPl && hasCustomPr) || (autoPl && hasCustomPr)) {
    paddingX = ""
  } else if (hasCustomPl || autoPl) {
    paddingX = "pr-3.5 sm:pr-3"
  } else if (hasCustomPr) {
    paddingX = "pl-3.5 sm:pl-3"
  }

  const paddingY = hasCustomPy ? "" : "py-2 sm:py-1.5"

  const inputEl = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "min-h-[44px] sm:min-h-0 h-11 sm:h-8 w-full min-w-0 rounded-lg border border-app-border bg-app-input text-base sm:text-xs text-app-text placeholder:text-app-caption transition-colors outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
        paddingX,
        paddingY,
        autoPl,
        className
      )}
      {...props}
    />
  )

  if (!effectiveStartIcon && !endIcon) {
    return inputEl
  }

  return (
    <div className="relative w-full">
      {effectiveStartIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted z-10 pointer-events-none flex items-center justify-center">
          {effectiveStartIcon}
        </span>
      )}
      {inputEl}
      {endIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted z-10 flex items-center justify-center">
          {endIcon}
        </span>
      )}
    </div>
  )
}

export { Input }
