import React, { forwardRef } from 'react';
import { Select } from '@/shared/components/ui';

/**
 * FormSelect — Standard dropdown component for Admin forms.
 * Designed to be used inside FormField.
 */
const FormSelect = forwardRef(({
    options = [],
    ...props
}, ref) => {
    return (
        <Select
            ref={ref}
            options={options}
            {...props}
        />
    );
});

FormSelect.displayName = 'FormSelect';

export default FormSelect;
