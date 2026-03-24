import React, { forwardRef } from 'react';
import { Input, TextArea } from '@/shared/components/ui';

/**
 * FormInput component for standard input fields.
 * Designed to be used inside FormField or as a standalone input.
 */
const FormInput = forwardRef(({
    type = 'text',
    isTextArea = false,
    ...props
}, ref) => {
    if (isTextArea) {
        return (
            <TextArea
                ref={ref}
                {...props}
            />
        );
    }

    return (
        <Input
            ref={ref}
            type={type}
            {...props}
        />
    );
});

FormInput.displayName = 'FormInput';

export default FormInput;
