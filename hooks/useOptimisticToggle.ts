import { useCallback, useState } from 'react';

type UseOptimisticToggleOptions = {
  checked: boolean;
  onToggle: (next: boolean) => Promise<boolean>;
};

export function useOptimisticToggle({
  checked,
  onToggle,
}: UseOptimisticToggleOptions) {
  const [value, setValue] = useState(checked);
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState(0);

  const toggle = useCallback(
    async (next: boolean) => {
      const previous = value;
      setValue(next);
      setIsLoading(true);

      let succeeded = false;
      try {
        succeeded = await onToggle(next);
      } catch {
        succeeded = false;
      }

      if (!succeeded) {
        setValue(previous);
        setErrorKey((key) => key + 1);
      }
      setIsLoading(false);
    },
    [value, onToggle],
  );

  return { checked: value, isLoading, errorKey, toggle };
}
