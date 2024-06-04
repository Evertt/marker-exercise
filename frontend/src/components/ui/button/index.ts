import { type VariantProps, cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

const bgColorsOnHover = `
  relative
  before:content-['']
  before:absolute
  before:left-0
  before:top-0
  before:w-full
  before:h-full
  before:bg-inherit
  before:opacity-0
  before:transition-opacity
  before:contrast-125
  before:brightness-90
  hover:before:opacity-60
  hover:before:mix-blend-color-burn
`

export const buttonVariants = cva(
  `inline-flex items-center justify-center whitespace-nowrap rounded-[3px] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${bgColorsOnHover}`,
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline:
          'border border-input bg-white hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 rounded px-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
