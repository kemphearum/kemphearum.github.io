import React from 'react';
import MaintenancePage from './MaintenancePage';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <MaintenancePage 
                    error={this.state.error}
                    resetErrorBoundary={() => this.setState({ hasError: false, error: null })}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
