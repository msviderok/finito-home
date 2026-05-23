import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const popoverArrowBase =
  "relative block h-1.5 w-3 overflow-clip before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:-translate-x-1/2 before:translate-y-1/2 before:rotate-45 before:border before:content-[''] data-[side=bottom]:top-[-6px] data-[side=left]:right-[-10px] data-[side=left]:rotate-90 data-[side=right]:left-[-10px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180";

export const popoverContentVariants = cva(
  [
    'z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-lg border p-2.5 text-xs shadow-md ring-1 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
  ],
  {
    variants: {
      variant: {
        default: 'border-foreground/50 bg-popover text-popover-foreground ring-foreground/10',
        destructive:
          'border-destructive/40 bg-(--destructive-popover) text-muted-foreground shadow-destructive/10 ring-destructive/20',
        success: 'border-success/40 bg-(--success-popover) text-muted-foreground shadow-success/10 ring-success/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export const popoverArrowVariants = cva(popoverArrowBase, {
  variants: {
    variant: {
      default: 'before:border-foreground/50 before:bg-popover',
      destructive: 'before:border-destructive/50 before:bg-(--destructive-popover)',
      success: 'before:border-success/50 before:bg-(--success-popover)',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverArrow({
  className,
  variant,
  ...props
}: PopoverPrimitive.Arrow.Props & VariantProps<typeof popoverArrowVariants>) {
  return (
    <PopoverPrimitive.Arrow
      data-slot="popover-arrow"
      className={cn(popoverArrowVariants({ variant }), className)}
      {...props}
    />
  );
}

function PopoverBackdrop({ ...props }: PopoverPrimitive.Backdrop.Props) {
  return <PopoverPrimitive.Backdrop data-slot="popover-backdrop" {...props} />;
}

function PopoverContent({
  anchor,
  className,
  variant,
  align = 'center',
  alignOffset = 4,
  side = 'bottom',
  sideOffset = 6,
  arrowPadding = 12,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'anchor' | 'side' | 'sideOffset' | 'arrowPadding'> &
  VariantProps<typeof popoverContentVariants>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute dark:opacity-50" />
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        side={side}
        sideOffset={sideOffset}
        arrowPadding={arrowPadding}
        className="isolate z-50"
      >
        <PopoverPrimitive.Arrow className={popoverArrowVariants({ variant })} />

        <PopoverPrimitive.Popup
          data-slot="popover-content"
          data-variant={variant}
          className={cn(popoverContentVariants({ variant }), className)}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('flex flex-col gap-1 text-xs', className)} {...props} />;
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title data-slot="popover-title" className={cn('text-sm font-medium', className)} {...props} />
  );
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  );
}

const createHandle = PopoverPrimitive.createHandle;

export {
  Popover,
  PopoverArrow,
  PopoverBackdrop,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  createHandle,
};
