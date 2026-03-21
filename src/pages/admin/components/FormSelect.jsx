import { Select } from '../../../shared/components/ui';
import styles from '../../Admin.module.scss';


/**
 * FormSelect — standard dropdown matching the User Account Profile style.
 */
const FormSelect = ({
    label,
    value,
    onChange,
    options = [],
    required = false,
    fullWidth = false,
    noWrapper = false,
    icon,
    style = {},
    containerStyle = {},
    hint
}) => {
    const selectElement = (
        <Select
            value={value}
            onChange={onChange}
            className={noWrapper ? styles.standardSelect : undefined}
            required={required}
            options={options}
            style={{
                marginTop: (!noWrapper && label) ? '0.4rem' : '0',
                ...style
            }}
            fullWidth={noWrapper || fullWidth}
        />
    );

    if (noWrapper) return selectElement;

    return (
        <div
            className={styles.inputGroup}
            style={{
                ...(fullWidth && typeof window !== 'undefined' && window.innerWidth > 600 ? { gridColumn: 'span 2' } : {}),
                ...containerStyle
            }}
        >
            {label && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {icon && <span style={{ fontSize: '1.1rem' }}>{icon}</span>}
                    {label}
                </label>
            )}
            {selectElement}
            {hint && <span className={styles.hint}>{hint}</span>}
        </div>
    );
};

export default FormSelect;
