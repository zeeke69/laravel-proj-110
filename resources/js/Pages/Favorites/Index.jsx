import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';

export default function Favorites() {
    const { favorites = [] } = usePage().props;

    const [editingId, setEditingId] = useState(null);
    const [notes, setNotes] = useState('');

    const startEdit = (favorite) => {
        setEditingId(favorite.id);
        setNotes(favorite.notes || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNotes('');
    };

    const saveEdit = (favorite) => {
        Inertia.put(`/favorites/${favorite.id}`, {
            item_name: favorite.item_name,
            notes: notes,
        });
        cancelEdit();
    };

    const deleteFavorite = (id) => {
        if (confirm('Delete this favorite?')) {
            Inertia.delete(`/favorites/${id}`);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">My Favorites</h1>

            {favorites.length === 0 && (
                <p className="text-gray-500">No favorites yet.</p>
            )}

            <ul className="space-y-4">
                {favorites.map((fav) => (
                    <li key={fav.id} className="border p-4 rounded">
                        <div className="flex items-start gap-3">
                            {fav.image_url ? (
                                <img
                                    src={fav.image_url}
                                    alt={fav.item_name}
                                    className="h-20 w-20 object-cover rounded"
                                />
                            ) : (
                                <div className="h-20 w-20 bg-gray-100 rounded" />
                            )}

                            <div className="flex-1">
                                <h2 className="font-semibold">{fav.item_name}</h2>
                                {(fav.culture || fav.object_date) && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {[fav.culture, fav.object_date].filter(Boolean).join(' — ')}
                                    </p>
                                )}

                        {editingId === fav.id ? (
                            <>
                                <textarea
                                    className="w-full border p-2 mt-2"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />

                                <div className="mt-2 space-x-2">
                                    <button
                                        onClick={() => saveEdit(fav)}
                                        className="bg-green-600 text-white px-3 py-1 rounded"
                                    >
                                        Save
                                    </button>

                                    <button
                                        onClick={cancelEdit}
                                        className="bg-gray-400 text-white px-3 py-1 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 mt-1">
                                    {fav.notes || 'No notes'}
                                </p>

                                <div className="mt-2 space-x-2">
                                    <button
                                        onClick={() => startEdit(fav)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => deleteFavorite(fav.id)}
                                        className="bg-red-600 text-white px-3 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
