'use client';

import { useState, useEffect } from 'react';
import { Select } from './select';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { useTranslations } from '@/hooks/use-translations';

const SEP = '::';

interface IndustryOption {
  value: string;
  label: string;
  children?: IndustryOption[];
}

interface IndustrySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function IndustrySelect({ value, onChange, disabled, className }: IndustrySelectProps) {
  const tc = useTranslations('common');
  const [data, setData] = useState<IndustryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse value using safe separator
  const parts = value.split(SEP);
  const l1Value = parts[0] || '';
  const l2Value = parts[1] || '';
  const l3Value = parts[2] || '';

  const l1Options = data.map((o) => ({ value: o.value, label: o.label }));
  const l2Options = data.find((o) => o.value === l1Value)?.children?.map((o) => ({ value: o.value, label: o.label })) || [];
  const l3Options = data.find((o) => o.value === l1Value)?.children?.find((c) => c.value === l2Value)?.children?.map((o) => ({ value: o.value, label: o.label })) || [];

  useEffect(() => {
    api.get<{ code: number; data: IndustryOption[] }>('/api/v1/industries')
      .then((res) => {
        if (res.code === 0) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleL1Change = (v: string) => onChange(v);

  const handleL2Change = (v: string) => {
    const l1 = data.find((o) => o.value === l1Value);
    const hasL3 = l1?.children?.find((c) => c.value === v)?.children?.length;
    onChange(hasL3 ? `${l1Value}${SEP}${v}` : `${l1Value}${SEP}${v}${SEP}`);
  };

  const handleL3Change = (v: string) => onChange(`${l1Value}${SEP}${l2Value}${SEP}${v}`);

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      <div>
        <Select
          options={l1Options}
          value={l1Value}
          onChange={handleL1Change}
          placeholder={loading ? tc('loading') : tc('selectIndustry')}
          disabled={disabled || loading}
        />
      </div>
      <div>
        {l1Value && l2Options.length > 0 && (
          <Select
            options={l2Options}
            value={l2Value}
            onChange={handleL2Change}
            placeholder={tc('selectCategory')}
            disabled={disabled}
          />
        )}
      </div>
      <div>
        {l2Value && l3Options.length > 0 && (
          <Select
            options={l3Options}
            value={l3Value}
            onChange={handleL3Change}
            placeholder={tc('selectSubcategory')}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
