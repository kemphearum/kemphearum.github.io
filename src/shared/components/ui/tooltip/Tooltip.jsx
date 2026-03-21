import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = ({ children, content, delayDuration = 200, side = 'top', className = '', ...props }) => (
    <TooltipPrimitive.Root delayDuration={delayDuration} {...props}>
        <TooltipPrimitive.Trigger asChild>
            {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                side={side}
                className={`ui-tooltip-content ${className}`}
                sideOffset={5}
            >
                {content}
                <TooltipPrimitive.Arrow className="ui-tooltip-arrow" />
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
);

export default Tooltip;
export { Tooltip, TooltipProvider };
