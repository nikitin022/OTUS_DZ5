import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('отображает текст метки', () => {
    render(<Badge>срочная</Badge>);
    expect(screen.getByText('срочная')).toBeInTheDocument();
  });

  it('применяет красный тон для критичной срочности', () => {
    render(<Badge tone="danger">критичная</Badge>);
    expect(screen.getByText('критичная')).toHaveClass('bg-red-100');
  });
});
