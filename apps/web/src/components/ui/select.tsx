/**
 * Select 下拉选择组件 — 基于 @radix-ui/react-select
 * 用于替代原生 <select>，统一 dark/light 样式
 */
'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 rounded-lg border border-[rgb(var(--color-border))]',
          'bg-[rgb(var(--color-surface))] text-sm text-[rgb(var(--color-text))]',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:border-ink-500 transition-colors',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="w-4 h-4 text-ink-400" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-50 min-w-[8rem] overflow-hidden rounded-lg glass-surface border border-[rgb(var(--color-border))] shadow-lg animate-in fade-in-0 zoom-in-95"
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 bg-gradient-to-b from-ink-800/50 to-transparent text-ink-400">
            <ChevronDown className="w-4 h-4 rotate-180" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex items-center px-3 py-2 rounded text-sm text-[rgb(var(--color-text))]',
                  'data-[highlighted]:bg-amber-500/10 data-[highlighted]:text-amber-500',
                  'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed',
                  'cursor-pointer outline-none select-none',
                )}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 bg-gradient-to-t from-ink-800/50 to-transparent text-ink-400">
            <ChevronDown className="w-4 h-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
