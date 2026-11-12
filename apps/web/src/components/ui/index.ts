// Task 5 — action and form primitives. Tasks 6 and 7 append their own exports below.
export {
    Button,
    buttonClasses,
    iconButtonClasses,
    type ButtonProps,
    type ButtonSize,
    type ButtonVariant,
    type IconButtonSize,
} from './Button';
export { ButtonLink, type ButtonLinkProps } from './ButtonLink';
export { IconButton, type IconButtonProps } from './IconButton';
export { Field, type FieldControl, type FieldProps } from './Field';
export { Input, type ControlFieldProps, type ControlSize, type InputProps } from './Input';
export { Textarea, type TextareaProps } from './Textarea';
export { Select, type SelectProps } from './Select';
export { Checkbox, type CheckboxProps } from './Checkbox';
export { Switch, type SwitchProps } from './Switch';
export { Kbd } from './Kbd';
export { Reveal } from './motion/Reveal';
export { Stagger } from './motion/Stagger';

// Task 6 — data display primitives.
export { Badge } from './Badge';
export { StatusChip } from './StatusChip';
export { Surface, type SurfaceProps } from './Surface';
export { Avatar } from './Avatar';
export { Skeleton } from './Skeleton';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Stat } from './Stat';
export { ScoreBar } from './ScoreBar';
export { Table, THead, TBody, TR, TH, TD } from './Table';
export { PageToolbar } from './PageToolbar';
export { Breadcrumbs } from './Breadcrumbs';
export { statusTone, type StatusKind, type Tone } from '@/lib/status-tones';

// Task 7 — overlay and navigation primitives.
export { Dialog, type DialogProps } from './Dialog';
export { Sheet, type SheetProps } from './Sheet';
export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator,
} from './DropdownMenu';
export { Tooltip, TooltipProvider, type TooltipProps } from './Tooltip';
export { Segmented, type SegmentedProps } from './Segmented';
export { Tabs, type TabsProps } from './Tabs';
