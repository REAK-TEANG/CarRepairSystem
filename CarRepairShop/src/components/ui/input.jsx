import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({
  className,
  type = "text",
  ...props
}) {
  const hasCustomPx = className && /\b(?:[a-z]+:)?px-/.test(className)
  const hasCustomPl = className && /\b(?:[a-z]+:)?pl-/.test(className)
  const hasCustomPr = className && /\b(?:[a-z]+:)?pr-/.test(className)
  const hasCustomPy = className && /\b(?:[a-z]+:)?p[ybt]-/.test(className)

  let paddingX = "px-3.5 sm:px-3"
  if (hasCustomPx || (hasCustomPl && hasCustomPr)) {
    paddingX = ""
  } else if (hasCustomPl) {
    paddingX = "pr-3.5 sm:pr-3"
  } else if (hasCustomPr) {
    paddingX = "pl-3.5 sm:pl-3"
  }

  const paddingY = hasCustomPy ? "" : "py-2 sm:py-1.5"

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "min-h-[44px] sm:min-h-0 h-11 sm:h-8 w-full min-w-0 rounded-lg border border-app-border bg-app-input text-base sm:text-xs text-app-text placeholder:text-app-caption transition-colors outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
        paddingX,
        paddingY,
        className
      )}
      {...props}
    />
  )
}

export { Input }
