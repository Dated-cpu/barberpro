import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../ui/input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input id="name" label="Name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Input id="email" label="Email" error="Invalid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Input ref={ref} id="test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
