import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

function Checkbox({ className, checked, onChange, onCheckedChange, ...props }) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={(val, event) => {
        if (onCheckedChange) onCheckedChange(val, event)
        if (onChange) {
          onChange({ target: { checked: val } })
        }
      }}
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-sm border border-app-border bg-app-input shadow-xs transition-colors outline-none focus-visible:border-app-accent focus-visible:ring-1 focus-visible:ring-app-accent data-[checked]:bg-app-accent data-[checked]:border-app-accent data-[checked]:text-app-accentText disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check size={12} weight="bold" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
