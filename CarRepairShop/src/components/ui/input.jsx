import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({
  className,
  type = "text",
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-app-border bg-app-input px-3 py-1.5 text-xs text-app-text placeholder:text-app-caption transition-colors outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
