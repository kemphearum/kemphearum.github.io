import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

const Dropdown = DropdownMenuPrimitive.Root;
const DropdownTrigger = DropdownMenuPrimitive.Trigger;
const DropdownPortal = DropdownMenuPrimitive.Portal;
const DropdownGroup = DropdownMenuPrimitive.Group;

const DropdownContent = React.forwardRef(({ className = '', sideOffset = 4, ...props }, ref) => (
    <DropdownPortal>
        <DropdownMenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={`ui-dropdown-content ${className}`}
            {...props}
        />
    </DropdownPortal>
));
DropdownContent.displayName = 'DropdownContent';

const DropdownItem = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={`ui-dropdown-item ${variant !== 'default' ? `ui-dropdown-item--${variant}` : ''} ${className}`}
        {...props}
    />
));
DropdownItem.displayName = 'DropdownItem';

const DropdownSeparator = React.forwardRef(({ className = '', ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
        ref={ref}
        className={`ui-dropdown-separator ${className}`}
        {...props}
    />
));
DropdownSeparator.displayName = 'DropdownSeparator';

Dropdown.Trigger = DropdownTrigger;
Dropdown.Content = DropdownContent;
Dropdown.Item = DropdownItem;
Dropdown.Separator = DropdownSeparator;
Dropdown.Group = DropdownGroup;

export default Dropdown;
export { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator };
