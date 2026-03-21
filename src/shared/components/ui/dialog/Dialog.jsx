import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef(({ className = '', ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={`ui-dialog-overlay ${className}`}
        {...props}
    />
));
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef(({ className = '', children, maxWidth, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={`ui-dialog-content ${className}`}
            style={{ maxWidth, ...props.style }}
            aria-describedby={props['aria-describedby'] || undefined}
            {...props}
        >
            {children}
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className = '', ...props }) => (
    <div className={`ui-dialog-header ${className}`} {...props} />
);

const DialogBody = ({ className = '', ...props }) => (
    <div className={`ui-dialog-body ${className}`} {...props} />
);

const DialogFooter = ({ className = '', ...props }) => (
    <div className={`ui-dialog-footer ${className}`} {...props} />
);

const DialogClose = React.forwardRef(({ className = '', ...props }, ref) => (
    <DialogPrimitive.Close
        ref={ref}
        className={`ui-dialog-close ${className}`}
        {...props}
    >
        <X size={18} />
    </DialogPrimitive.Close>
));
DialogClose.displayName = 'DialogClose';

const DialogTitle = React.forwardRef(({ className = '', ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={`ui-dialog-title ${className}`}
        {...props}
    />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef(({ className = '', ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={`ui-dialog-description ${className}`}
        {...props}
    />
));
DialogDescription.displayName = 'DialogDescription';

Dialog.Trigger = DialogTrigger;
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;
Dialog.Close = DialogClose;

export default Dialog;
export { 
    Dialog, 
    DialogTrigger, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogBody, 
    DialogFooter, 
    DialogClose 
};
