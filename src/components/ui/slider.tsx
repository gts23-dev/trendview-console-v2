import * as React from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';
import { cn } from '@/shared/utils/class-name';

function Slider({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        'relative flex h-4 w-full touch-none items-center select-none',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full overflow-hidden rounded-full bg-accent">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {children}
    </SliderPrimitive.Root>
  );
}

function SliderThumb({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Thumb>) {
  // 수정: 원본은 포커스 표시를 지워 키보드로 어느 손잡이에 있는지 알 수 없다.
  // Switch와 같은 포커스 링을 둔다.
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      className={cn(
        'box-content block size-4 shrink-0 cursor-pointer rounded-full border-[2px] border-primary bg-primary-foreground shadow-xs shadow-black/5 outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    />
  );
}

export { Slider, SliderThumb };
