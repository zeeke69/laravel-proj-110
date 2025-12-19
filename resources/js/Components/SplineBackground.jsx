import React, { useEffect } from 'react';

/**
 * Full-screen Spline background.
 *
 * Preferred: use Spline's embed as a <spline-viewer> scene.
 * Configure with VITE_SPLINE_SCENE_URL in your .env, e.g.
 * VITE_SPLINE_SCENE_URL="https://prod.spline.design/XXXX/scene.splinecode"
 *
 * Fallback: iframe url via VITE_SPLINE_EMBED_URL (older setup).
 */
export default function SplineBackground({ sceneUrl: sceneUrlProp, iframeUrl: iframeUrlProp } = {}) {
    const sceneUrl = sceneUrlProp ?? import.meta.env.VITE_SPLINE_SCENE_URL;
    const iframeUrl = iframeUrlProp ?? import.meta.env.VITE_SPLINE_EMBED_URL;

    useEffect(() => {
        // Suppress specific harmless WebGL errors from Spline viewer
        const originalError = console.error;
        const webGLErrorFilter = (...args) => {
            const message = args.join(' ');
            // Only suppress the specific mipmap generation error - it's harmless
            if (
                message.includes('GL_INVALID_OPERATION') &&
                message.includes('glGenerateMipmap') &&
                message.includes('zero-size texture')
            ) {
                return; // Suppress this specific harmless error
            }
            originalError.apply(console, args);
        };
        console.error = webGLErrorFilter;

        return () => {
            console.error = originalError;
        };
    }, []);

    useEffect(() => {
        if (!sceneUrl) return;
        if (customElements.get('spline-viewer')) return;

        const existing = document.querySelector('script[data-spline-viewer="true"]');
        if (existing) return;

        const script = document.createElement('script');
        script.type = 'module';
        script.async = true;
        script.dataset.splineViewer = 'true';
        script.src = 'https://unpkg.com/@splinetool/viewer@1.12.23/build/spline-viewer.js';
        document.head.appendChild(script);
    }, [sceneUrl]);

    if (!sceneUrl && !iframeUrl) return null;

    return (
        <div className="pointer-events-none fixed inset-0 -z-10">
            {sceneUrl ? (
                <spline-viewer
                    loading-anim-type="none"
                    url={sceneUrl}
                    style={{ width: '100%', height: '100%' }}
                />
            ) : (
                <iframe
                    src={iframeUrl}
                    title="3D Background"
                    className="h-full w-full"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allow="fullscreen; xr-spatial-tracking"
                />
            )}

            {/* Optional readability overlay (tweak/disable as you like) */}
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
        </div>
    );
}


