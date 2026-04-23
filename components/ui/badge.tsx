import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded px-2 py-0.5 text-xs font-bold whitespace-nowrap transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(255,165,0,0.12)] text-[#FFA500] border border-[rgba(255,165,0,0.25)]",
        secondary:
          "bg-[rgba(90,90,90,0.18)] text-[#A0A0A0] border border-[rgba(90,90,90,0.3)]",
        destructive:
          "bg-[rgba(239,68,68,0.12)] text-[#EF4444] border border-[rgba(239,68,68,0.25)]",
        outline:
          "bg-[rgba(90,90,90,0.18)] text-[#A0A0A0] border border-[rgba(90,90,90,0.3)]",
        success:
          "bg-[rgba(34,197,94,0.10)] text-[#22C55E] border border-[rgba(34,197,94,0.22)]",
        warning:
          "bg-[rgba(245,158,11,0.12)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)]",
        blue:
          "bg-[rgba(96,165,250,0.12)] text-[#60A5FA] border border-[rgba(96,165,250,0.25)]",
        ghost:
          "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>
