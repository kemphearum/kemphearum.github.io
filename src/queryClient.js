import { QueryClient } from '@tanstack/react-query';

// Configure the global React Query client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // How long data is considered "fresh" before a background refetch is triggered.
            // 5 minutes by default for public content to save Firestore reads.
            staleTime: 5 * 60 * 1000,

            // How long unused/inactive data is kept in memory before garbage collection.
            // 10 minutes. This ensures revisiting pages is instant without exploding memory.
            gcTime: 10 * 60 * 1000,

            // Disable refetching every time the user clicks away and focuses the browser window.
            // This is crucial for SPA portfolio apps to avoid spamming Firestore reads.
            refetchOnWindowFocus: false,

            // Only retry failed requests once instead of the default 3 times.
            retry: 1,

            // Disable refetching when reconnecting to the network for public data
            refetchOnReconnect: false,
        },
    },
});
