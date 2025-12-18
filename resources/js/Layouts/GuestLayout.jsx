import ApplicationLogo from '@/Components/ApplicationLogo';
import SplineBackground from '@/Components/SplineBackground';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    const guestSceneUrl =
        import.meta.env.VITE_SPLINE_GUEST_SCENE_URL ||
        'https://prod.spline.design/T1QwvGMTin00mRFf/scene.splinecode';

    return (
        <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0">
            <SplineBackground sceneUrl={guestSceneUrl} />
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-gray-500" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white/85 backdrop-blur px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg sm:translate-x-10">
                {children}
            </div>
        </div>
    );
}
