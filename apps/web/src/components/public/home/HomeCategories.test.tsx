// The category row on the home page: real links to the filtered job search, and arrow buttons that page through a
// row wider than the screen and stop at each end. jsdom has no layout, so each test sets the row's geometry.
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { HomeCategories } from './HomeCategories';

function category(id: string, name: string, children: string[] = []): IJobCategoryDto {
  return {
    categoryId: id,
    name,
    childCategories: children.map((child, i) => ({ categoryId: `${id}-${i}`, name: child })),
  } as unknown as IJobCategoryDto;
}

const many = Array.from({ length: 10 }, (_, i) => category(`c${i}`, `Ngành ${i + 1}`));

/** Gives the row a width and a scroll position, then lets the component measure them again. */
function layOut(list: HTMLElement, geometry: { clientWidth: number; scrollWidth: number }) {
  let left = 0;
  Object.defineProperties(list, {
    clientWidth: { configurable: true, get: () => geometry.clientWidth },
    scrollWidth: { configurable: true, get: () => geometry.scrollWidth },
    scrollLeft: { configurable: true, get: () => left },
  });
  const scrollBy = vi.fn();
  list.scrollBy = scrollBy as unknown as HTMLElement['scrollBy'];
  fireEvent(window, new Event('resize'));
  return {
    scrollBy,
    scrollTo(position: number) {
      left = position;
      fireEvent.scroll(list);
    },
  };
}

function reducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches, media: query }));
}

describe('HomeCategories', () => {
  it('renders nothing without categories (the API gives guests none)', () => {
    const { container } = render(<HomeCategories categories={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('links each category to the job search filtered by it and names its sub-categories', () => {
    render(
      <HomeCategories
        categories={[category('it', 'Công nghệ thông tin', ['Frontend', 'Backend']), category('design', 'Thiết kế')]}
      />,
    );

    const it = screen.getByRole('link', { name: /Công nghệ thông tin/ });
    expect(it).toHaveAttribute('href', '/job-postings?categoryId=it');
    expect(it).toHaveTextContent('Frontend · Backend');
    expect(screen.getByRole('link', { name: 'Thiết kế' })).toHaveAttribute('href', '/job-postings?categoryId=design');
  });

  it('shows the first eight categories', () => {
    render(<HomeCategories categories={many} />);

    expect(screen.getAllByRole('link', { name: /^Ngành \d+$/ }).map((link) => link.textContent)).toEqual(
      ['Ngành 1', 'Ngành 2', 'Ngành 3', 'Ngành 4', 'Ngành 5', 'Ngành 6', 'Ngành 7', 'Ngành 8'],
    );
  });

  it('shows no arrows while every card fits', () => {
    render(<HomeCategories categories={many} />);

    layOut(screen.getByRole('list'), { clientWidth: 1200, scrollWidth: 1200 });

    expect(screen.queryByRole('button', { name: /Xem các ngành/ })).toBeNull();
  });

  it('pages through a wider row and stops at each end', async () => {
    reducedMotion(false);
    const user = userEvent.setup();
    render(<HomeCategories categories={many} />);
    const row = layOut(screen.getByRole('list'), { clientWidth: 1000, scrollWidth: 2000 });
    const previous = screen.getByRole('button', { name: 'Xem các ngành trước' });
    const next = screen.getByRole('button', { name: 'Xem các ngành tiếp theo' });

    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);
    expect(row.scrollBy).toHaveBeenCalledWith({ left: 800, behavior: 'smooth' });

    row.scrollTo(1000);
    expect(previous).toBeEnabled();
    expect(next).toBeDisabled();

    await user.click(previous);
    expect(row.scrollBy).toHaveBeenLastCalledWith({ left: -800, behavior: 'smooth' });
  });

  // A button that turns disabled drops focus to <body>; a keyboard user must stay on the rail.
  it('hands focus to the other arrow when the focused one stops at its end', async () => {
    reducedMotion(true);
    const user = userEvent.setup();
    render(<HomeCategories categories={many} />);
    const row = layOut(screen.getByRole('list'), { clientWidth: 1000, scrollWidth: 2000 });
    const previous = screen.getByRole('button', { name: 'Xem các ngành trước' });
    const next = screen.getByRole('button', { name: 'Xem các ngành tiếp theo' });

    next.focus();
    await user.keyboard('{Enter}');
    row.scrollTo(1000);

    expect(next).toBeDisabled();
    expect(previous).toHaveFocus();

    await user.keyboard('{Enter}');
    row.scrollTo(0);

    expect(previous).toBeDisabled();
    expect(next).toHaveFocus();
  });

  it('leaves focus alone when the arrow that stops is not the focused one', () => {
    render(<HomeCategories categories={many} />);
    const row = layOut(screen.getByRole('list'), { clientWidth: 1000, scrollWidth: 2000 });
    const link = screen.getByRole('link', { name: 'Ngành 1' });

    link.focus();
    row.scrollTo(1000);

    expect(link).toHaveFocus();
  });

  it('jumps instead of gliding when the OS asks for reduced motion', async () => {
    reducedMotion(true);
    const user = userEvent.setup();
    render(<HomeCategories categories={many} />);
    const row = layOut(screen.getByRole('list'), { clientWidth: 1000, scrollWidth: 2000 });

    await user.click(screen.getByRole('button', { name: 'Xem các ngành tiếp theo' }));

    expect(row.scrollBy).toHaveBeenCalledWith({ left: 800, behavior: 'auto' });
  });
});
