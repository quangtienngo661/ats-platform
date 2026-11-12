import {
    Children,
    cloneElement,
    isValidElement,
    type CSSProperties,
    type ReactElement,
    type ReactNode,
} from 'react';
import { staggerDelay } from '@/lib/motion';

const DOM_CHILDREN = new Set(['div', 'li', 'section', 'article']);

type ChildProps = { className?: string; style?: CSSProperties };

function rise(className: string | undefined) {
    return className ? `animate-rise ${className}` : 'animate-rise';
}

/**
 * Fades its children in one after another with a CSS animation (spec §6). Only the first 8
 * animate; the rest render as they are. A `div`/`li`/`section`/`article` child keeps its own
 * props; any other child is wrapped in `li` (lists) or `div`.
 */
export function Stagger({
    children,
    as: Container = 'div',
    className,
}: {
    children: ReactNode;
    as?: 'div' | 'ul' | 'ol';
    className?: string;
}) {
    const Wrapper = Container === 'div' ? 'div' : 'li';
    return (
        <Container className={className}>
            {Children.toArray(children).map((child, i) => {
                const delay = staggerDelay(i);
                if (delay === null || !isValidElement(child)) return child;
                const animationDelay = `${delay}s`;
                if (typeof child.type === 'string' && DOM_CHILDREN.has(child.type)) {
                    const el = child as ReactElement<ChildProps>;
                    return cloneElement(el, {
                        className: rise(el.props.className),
                        style: { ...el.props.style, animationDelay },
                    });
                }
                return (
                    <Wrapper key={child.key ?? i} className="animate-rise" style={{ animationDelay }}>
                        {child}
                    </Wrapper>
                );
            })}
        </Container>
    );
}
