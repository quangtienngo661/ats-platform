import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stagger } from './Stagger';

describe('Stagger', () => {
    it('renders all 10 children in order, including those past the cap', () => {
        render(
            <Stagger as="ul">
                {Array.from({ length: 10 }, (_, i) => (
                    <li key={i}>item {i}</li>
                ))}
            </Stagger>,
        );
        const items = screen.getAllByRole('listitem');
        expect(items.map((el) => el.textContent)).toEqual(
            Array.from({ length: 10 }, (_, i) => `item ${i}`),
        );
        expect(screen.getByRole('list')).toBeInTheDocument();
    });
});
