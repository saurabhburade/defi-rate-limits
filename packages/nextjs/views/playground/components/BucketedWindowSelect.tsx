"use client";

import { inputClassName } from "@/components/common/Input";
import { LOCAL_BUCKETED_WINDOW_OPTIONS } from "@/libs/rate-limit/localBucketed";
import { BucketedWindowPreset } from "@/types/rate-limit";

export const BucketedWindowSelect = ({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: BucketedWindowPreset) => void;
  value: BucketedWindowPreset;
}) => (
  <label className="block min-w-0">
    <span className="mb-2 block text-sm font-semibold text-muted-foreground">Limit window</span>
    <select
      className={`${inputClassName} cursor-pointer appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled}
      onChange={event => onChange(event.target.value as BucketedWindowPreset)}
      value={value}
    >
      {LOCAL_BUCKETED_WINDOW_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);
