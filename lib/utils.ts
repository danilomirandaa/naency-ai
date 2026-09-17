import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge precisa conhecer os tokens customizados de app/globals.css,
 * senão trata `rounded-control` ou `text-body-md` como classes desconhecidas e
 * não resolve conflitos com `rounded-lg` / `text-sm`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: [
        'control-xs',
        'control-sm',
        'control',
        'control-lg',
        'control-xl',
        'control-2xl',
        'control-3xl',
      ],
      text: ['body-md', 'body-xs', 'caption-md', 'caption-md-emphasis'],
      shadow: ['input', 'panel-body', 'panel-body-dark'],
    },
  },
});

export function classMerge(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Nome usado pelo código de registries shadcn (components/evilcharts). No nosso código, use `classMerge`. */
export const cn = classMerge;
