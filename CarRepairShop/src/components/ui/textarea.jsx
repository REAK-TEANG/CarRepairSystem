import { cn } from "@/lib/utils"

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[64px] w-full rounded-lg border border-app-border bg-app-input px-3 py-2 text-xs text-app-text placeholder:text-app-caption transition-colors outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent disabled:cursor-not-allowed disabled:opacity-50 resize-y font-sans",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
