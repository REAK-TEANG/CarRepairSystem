import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-xs font-semibold whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-app-accent text-app-accentText hover:bg-app-accentHover shadow-xs active:scale-[0.98]",
        outline:
          "border-app-border bg-app-card text-app-text hover:bg-app-hover shadow-xs active:scale-[0.98]",
        secondary:
          "bg-app-hover text-app-text hover:bg-app-border/70 active:scale-[0.98]",
        ghost:
          "text-app-muted hover:text-app-text hover:bg-app-hover active:scale-[0.98]",
        destructive:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/20 active:scale-[0.98]",
        link: "text-app-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 sm:h-8 gap-2 sm:gap-1.5 px-3.5 sm:px-3 text-xs",
        xs: "h-7 sm:h-6 gap-1 rounded-md px-2.5 sm:px-2 text-xs sm:text-[11px]",
        sm: "h-8 sm:h-7 gap-1.5 rounded-md px-2.5 text-xs",
        lg: "h-10 sm:h-9 gap-2 rounded-lg px-4 text-sm font-semibold",
        icon: "size-9 sm:size-8 rounded-lg p-0",
        "icon-xs": "size-7 sm:size-6 rounded-md p-0",
        "icon-sm": "size-8 sm:size-7 rounded-md p-0",
        "icon-lg": "size-10 sm:size-9 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
