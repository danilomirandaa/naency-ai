import { Text } from '@/components/ui/Text';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const sizes = [
  'inherit',
  '2xs',
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
] as const;
const colors = [
  'primary',
  'secondary',
  'accent',
  'success',
  'error',
  'warning',
] as const;
const weights = ['light', 'normal', 'medium', 'semibold', 'bold'] as const;
const variants = [
  'page-title',
  'section-title',
  'subtitle',
  'body',
  'description',
  'label',
  'caption',
] as const;
const elements = ['span', 'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

const meta: Meta<typeof Text> = {
  title: 'Design System/Text',
  component: Text,
  argTypes: {
    size: { control: 'select', options: sizes },
    color: { control: 'select', options: colors },
    weight: { control: 'select', options: weights },
    variant: { control: 'select', options: variants },
    element: { control: 'select', options: elements },
    children: { control: 'text' },
  },
  args: {
    children: 'Saldo disponível em conta corrente.',
    size: 'sm',
    color: 'primary',
    weight: 'normal',
  },
};

export default meta;

type Story = StoryObj<typeof Text>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {variants.map((variant) => (
        <div key={variant} className="flex items-baseline gap-4">
          <Text size="2xs" color="secondary" className="w-24 shrink-0 font-mono">
            {variant}
          </Text>
          <Text variant={variant}>The quick brown fox jumps over the lazy dog</Text>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {sizes.map((size) => (
        <div key={size} className="flex items-baseline gap-4">
          <Text size="2xs" color="secondary" className="w-24 shrink-0 font-mono">
            {size}
          </Text>
          <Text size={size}>The quick brown fox jumps over the lazy dog</Text>
        </div>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {colors.map((color) => (
        <div key={color} className="flex items-baseline gap-4">
          <Text size="2xs" color="secondary" className="w-24 shrink-0 font-mono">
            {color}
          </Text>
          <Text size="sm" color={color}>
            The quick brown fox jumps over the lazy dog
          </Text>
        </div>
      ))}
    </div>
  ),
};

export const Weights: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {weights.map((weight) => (
        <div key={weight} className="flex items-baseline gap-4">
          <Text size="2xs" color="secondary" className="w-24 shrink-0 font-mono">
            {weight}
          </Text>
          <Text size="sm" weight={weight}>
            The quick brown fox jumps over the lazy dog
          </Text>
        </div>
      ))}
    </div>
  ),
};

export const VariantOverride: Story = {
  args: {
    variant: 'section-title',
    color: 'accent',
    element: 'h3',
    children: 'Section title variant with accent colour and h3 element',
  },
};
