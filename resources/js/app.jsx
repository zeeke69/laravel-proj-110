import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Handle 403/419 errors globally - use Inertia router instead of full page reload
router.on('error', (errors) => {
    if (errors.status === 403 || errors.status === 419) {
        alert('Your session has expired. Redirecting to login...');
        // Use Inertia router for seamless navigation instead of full page reload
        router.visit('/login', {
            preserveState: false,
            preserveScroll: false,
        });
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
        showSpinner: true,
    },
    // Enable seamless navigation with smooth transitions
    onStart: () => {
        // Optional: Add any pre-navigation logic here
    },
    onFinish: () => {
        // Optional: Add any post-navigation logic here
    },
});
