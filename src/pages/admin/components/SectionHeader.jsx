import React from 'react';

const SectionHeader = ({
    title,
    description,
    icon: Icon,
    rightElement,
    style
}) => {
    return (
        <div className="ui-sectionHeader" style={style}>
            <div className="ui-headerInfo">
                {Icon && (
                    <div className="ui-headerIcon">
                        <Icon size={24} />
                    </div>
                )}
                <div>
                    <h2 className="ui-headerTitle">{title}</h2>
                    {description && <p className="ui-headerDescription">{description}</p>}
                </div>
            </div>
            {rightElement && (
                <div className="ui-headerActions">
                    {rightElement}
                </div>
            )}
        </div>
    );
};

export default SectionHeader;
