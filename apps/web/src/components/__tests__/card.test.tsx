import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../ui/card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies elevated variant by default', () => {
    render(<Card>Default</Card>);
    const card = screen.getByText('Default');
    expect(card.className).toContain('bg-bg-elevated');
    expect(card.className).toContain('shadow-lg');
  });

  it('applies outlined variant', () => {
    render(<Card variant="outlined">Outlined</Card>);
    const card = screen.getByText('Outlined');
    expect(card.className).toContain('bg-transparent');
    expect(card.className).toContain('border-border');
  });
});
