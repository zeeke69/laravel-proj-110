import React from 'react';
import { usePage } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';

export default function History() {
    const { artifacts } = usePage().props;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">
                Civilizations Through Artifacts
            </h1>

            <p className="mb-6 text-gray-600">
                Artifacts offer a window into the lives, beliefs, and cultures of
                ancient civilizations. Explore selected historical objects below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {artifacts.map((item) => (
                    <div key={item.objectID} className="border rounded p-4">
                        <img
                            src={item.primaryImageSmall}
                            alt={item.title}
                            className="h-48 w-full object-cover mb-3"
                        />

                        <h2 className="font-semibold text-lg">{item.title}</h2>

                        <p className="text-sm text-gray-600">
                            {item.culture} — {item.objectDate}
                        </p>

                        <p className="text-sm mt-2">
                            {item.creditLine}
                        </p>

                        {/* ✅ ADD TO FAVORITES BUTTON */}
                       <button
    className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
    onClick={() => 
        Inertia.post('/favorites', {
            artifact_id: item.objectID.toString(),
            item_name: item.title,
            source: 'history',
        }).then(() => {
            alert('Added to Favorites!');
        })
    }
>
    ⭐ Add to Favorites
</button>


                    </div>
                ))}
            </div>
        </div>
    );
}
