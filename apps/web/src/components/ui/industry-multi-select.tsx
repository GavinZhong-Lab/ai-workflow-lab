'use client';

import { Plus, X } from 'lucide-react';
import { IndustrySelect } from './industry-select';
import { cn } from '@/lib/cn';

interface IndustryMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function IndustryMultiSelect({ value, onChange, disabled, className }: IndustryMultiSelectProps) {
  const add = () => onChange([...value, '']);
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const update = (idx: number, v: string) => {
    const next = [...value];
    next[idx] = v;
    onChange(next);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            <IndustrySelect
              value={v}
              onChange={(newVal) => update(i, newVal)}
              disabled={disabled}
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            className="mt-1 p-1 rounded hover:bg-red-500/10 text-[rgb(var(--color-text-muted))] hover:text-red-500 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled || value.length >= 10}
        className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 disabled:opacity-40 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add industry
      </button>
    </div>
  );
}
