import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

const Tabs = React.forwardRef(({ className = '', ...props }, ref) => (
    <TabsPrimitive.Root
        ref={ref}
        className={`ui-tabs ${className}`}
        {...props}
    />
));
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef(({ className = '', ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={`ui-tabs-list ${className}`}
        {...props}
    />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ className = '', ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={`ui-tabs-trigger ${className}`}
        {...props}
    />
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ className = '', ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={`ui-tabs-content ${className}`}
        {...props}
    />
));
TabsContent.displayName = 'TabsContent';

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

export default Tabs;
export { Tabs, TabsList, TabsTrigger, TabsContent };
