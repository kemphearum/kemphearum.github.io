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
            // Check if error is a chunk load error (common in production apps with lazy loading)
            const isChunkError = this.state.error?.name === 'ChunkLoadError' || 
                               this.state.error?.message?.includes('Loading chunk');
            
            return (
                <MaintenancePage 
                    title={isChunkError ? "Update Available" : "Component Error"}
                    message={isChunkError 
                        ? "A new version of the app is available. Please refresh to load the latest updates." 
                        : "We hit a snag loading a part of this page. You can try refreshing to fix it."}
                    error={this.state.error}
                    resetErrorBoundary={() => {
                        this.setState({ hasError: false, error: null });
                        if (isChunkError) window.location.reload();
                    }}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
