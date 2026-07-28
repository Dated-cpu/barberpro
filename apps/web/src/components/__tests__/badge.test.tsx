import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../ui/badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success').className).toContain('bg-success-bg');

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-error-bg');

    rerender(<Badge variant="accent">Accent</Badge>);
    expect(screen.getByText('Accent').className).toContain('bg-accent-muted');
  });
});
