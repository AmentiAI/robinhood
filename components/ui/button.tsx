import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2FF]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]",
  {
    variants: {
      variant: {
        default:
          'rounded-full bg-[#2DE2FF] text-[#0a0a0c] hover:bg-[#7aefff] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(45,226,255,0.45)] active:translate-y-0 active:scale-[0.98]',
        secondary:
          'rounded-full bg-[#1c1c24] text-zinc-100 border border-white/[0.12] hover:bg-[#252530] hover:border-[#FF2BD6]/35 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,43,214,0.15)]',
        outline:
          'rounded-full border border-[#2DE2FF]/35 bg-transparent text-[#2DE2FF] hover:bg-[#2DE2FF]/10 hover:border-[#2DE2FF]/60 hover:-translate-y-0.5',
        ghost:
          'rounded-full bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.06]',
        destructive:
          'rounded-full bg-red-500/90 text-white hover:bg-red-500 hover:-translate-y-0.5',
        link: 'rounded-none text-[#2DE2FF] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 text-sm',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-12 px-7 text-[15px]',
        icon: 'size-10 rounded-full',
        'icon-sm': 'size-8 rounded-full',
        'icon-lg': 'size-12 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
