import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../ui/modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<Modal open={false} onClose={() => {}}>Content</Modal>);
    expect(container.innerHTML).toBe('');
  });

  it('renders content when open', () => {
    render(<Modal open={true} onClose={() => {}}>Content</Modal>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal open={true} onClose={() => {}} title="Test Title">Content</Modal>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onClose when clicking overlay', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open={true} onClose={onClose}>Content</Modal>);
    await user.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open={true} onClose={onClose}>Content</Modal>);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
