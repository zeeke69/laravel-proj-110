import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function ArtMovements() {
    const { artworks = [], movements = {}, selectedMovement, favorites = [], favoriteIds = [] } = usePage().props;
    
    const [isAdding, setIsAdding] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [notesEdit, setNotesEdit] = useState('');

    // Draggable "Favorites bubble" panel positioning (persisted in localStorage).
    const [favPos, setFavPos] = useState(() => {
        try {
            const raw = localStorage.getItem('artMovements:favoritesPos');
            if (!raw) return { x: 24, y: 120 };
            const parsed = JSON.parse(raw);
            if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed;
        } catch {
            // ignore
        }
        return { x: 24, y: 120 };
    });
    const [draggingFav, setDraggingFav] = useState(null); // { startX, startY, originX, originY }
    const [favMinimized, setFavMinimized] = useState(() => {
        try {
            return localStorage.getItem('artMovements:favoritesMinimized') === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('artMovements:favoritesPos', JSON.stringify(favPos));
        } catch {
            // ignore
        }
    }, [favPos]);

    useEffect(() => {
        try {
            localStorage.setItem('artMovements:favoritesMinimized', favMinimized ? '1' : '0');
        } catch {
            // ignore
        }
    }, [favMinimized]);

    useEffect(() => {
        if (!draggingFav) return;

        const onMove = (e) => {
            const clientX = e.touches?.[0]?.clientX ?? e.clientX;
            const clientY = e.touches?.[0]?.clientY ?? e.clientY;

            const dx = clientX - draggingFav.startX;
            const dy = clientY - draggingFav.startY;

            const panelW = 420;
            const panelH = 520;
            const margin = 8;

            const maxX = Math.max(margin, window.innerWidth - panelW - margin);
            const maxY = Math.max(margin, window.innerHeight - panelH - margin);

            const nextX = Math.min(maxX, Math.max(margin, draggingFav.originX + dx));
            const nextY = Math.min(maxY, Math.max(margin, draggingFav.originY + dy));

            setFavPos({ x: nextX, y: nextY });
        };

        const onUp = () => setDraggingFav(null);

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
    }, [draggingFav]);

    const handleAddToFavorites = (artwork) => {
        // Check if already in favorites
        if (favoriteIds.includes(artwork.objectID.toString())) {
            alert('Already in favorites!');
            return;
        }

        setIsAdding(prev => ({ ...prev, [artwork.objectID]: true }));

        router.post('/favorites', {
            artifact_id: artwork.objectID.toString(),
            item_name: artwork.title,
            source: 'art-movements',
            image_url: artwork.primaryImageSmall || null,
            culture: artwork.culture || artwork.artistDisplayName || null,
            object_date: artwork.objectDate || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAdding(prev => {
                    const next = { ...prev };
                    delete next[artwork.objectID];
                    return next;
                });
                router.reload({ only: ['favorites', 'favoriteIds'], preserveScroll: true });
            },
            onError: () => {
                setIsAdding(prev => {
                    const next = { ...prev };
                    delete next[artwork.objectID];
                    return next;
                });
            },
        });
    };

    const isFavorite = (artworkId) => {
        return favoriteIds.includes(artworkId.toString());
    };

    const handleMovementChange = (movementKey) => {
        router.visit(`/art-movements/${movementKey}`, {
            preserveScroll: false,
        });
    };

    const handleDeleteFavorite = (id) => {
        if (confirm('Delete this favorite?')) {
            router.delete(`/favorites/${id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['favorites', 'favoriteIds'], preserveScroll: true });
                },
            });
        }
    };

    const handleStartEdit = (favorite) => {
        setEditingId(favorite.id);
        setNotesEdit(favorite.notes || '');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNotesEdit('');
    };

    const handleSaveEdit = (favorite) => {
        router.put(`/favorites/${favorite.id}`, { notes: notesEdit }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingId(null);
                setNotesEdit('');
                router.reload({ only: ['favorites'], preserveScroll: true });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">An Expedition Through Art Movements</h2>}>
            <Head title="Art Movements" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Draggable Favorites bubble/panel */}
                    {favorites.length > 0 && (
                        <div
                            className="fixed z-30"
                            style={{ left: `${favPos.x}px`, top: `${favPos.y}px` }}
                        >
                            <div className={`${favMinimized ? 'w-[220px] h-[52px]' : 'w-[420px] h-[520px]'} rounded-3xl border border-white/40 bg-white/80 backdrop-blur shadow-xl overflow-hidden`}>
                                <div
                                    className="pointer-events-auto flex items-center justify-between px-4 py-3 bg-white/70 border-b border-white/40 cursor-grab active:cursor-grabbing"
                                    onMouseDown={(e) => {
                                        setDraggingFav({
                                            startX: e.clientX,
                                            startY: e.clientY,
                                            originX: favPos.x,
                                            originY: favPos.y,
                                        });
                                    }}
                                    onTouchStart={(e) => {
                                        const t = e.touches[0];
                                        setDraggingFav({
                                            startX: t.clientX,
                                            startY: t.clientY,
                                            originX: favPos.x,
                                            originY: favPos.y,
                                        });
                                    }}
                                >
                                    <div className="text-sm font-semibold text-gray-900">
                                        Favorites{!favMinimized ? ` (${favorites.length})` : ''}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="pointer-events-auto rounded bg-white/70 px-2 py-1 text-xs hover:bg-white"
                                            onClick={() => setFavMinimized((v) => !v)}
                                            title={favMinimized ? 'Restore' : 'Minimize'}
                                        >
                                            {favMinimized ? '▢' : '—'}
                                        </button>
                                        <div className="text-xs text-gray-700">
                                            Drag
                                        </div>
                                    </div>
                                </div>

                                {!favMinimized && (
                                    <div className="h-[calc(520px-52px)] overflow-auto p-3">
                                        {favorites.length === 0 ? (
                                            <div className="text-sm text-gray-600">No favorites yet.</div>
                                        ) : (
                                            <ul className="space-y-3">
                                                {favorites.map(fav => (
                                                    <li key={fav.id} className="flex justify-between items-center border bg-white rounded-xl shadow-sm p-2">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            {fav.image_url ? (
                                                                <img
                                                                    src={fav.image_url}
                                                                    alt={fav.item_name}
                                                                    className="h-14 w-14 object-cover rounded-lg"
                                                                />
                                                            ) : (
                                                                <div className="h-14 w-14 bg-gray-100 rounded-lg" />
                                                            )}

                                                            <div className="flex-1">
                                                                <div className="font-semibold">{fav.item_name}</div>
                                                                {(fav.culture || fav.object_date) && (
                                                                    <div className="text-sm text-gray-600">
                                                                        {[fav.culture, fav.object_date].filter(Boolean).join(' — ')}
                                                                    </div>
                                                                )}
                                                                <div className="text-sm">
                                                                    {editingId === fav.id ? (
                                                                        <input
                                                                            type="text"
                                                                            value={notesEdit}
                                                                            onChange={e => setNotesEdit(e.target.value)}
                                                                            className="border p-1 rounded w-full"
                                                                        />
                                                                    ) : (
                                                                        fav.notes
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 pl-2">
                                                            {editingId === fav.id ? (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleSaveEdit(fav)} 
                                                                        className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button 
                                                                        onClick={handleCancelEdit} 
                                                                        className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleStartEdit(fav)} 
                                                                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteFavorite(fav.id)} 
                                                                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="overflow-hidden bg-transparent sm:rounded-lg">
                        <div className="p-6">
                            {/* Header */}
                            <div className="mb-8">
                                <h1 className="text-4xl font-bold mb-4 text-yellow-300 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] shadow-lg">
                                    An Expedition Through Art Movements
                                </h1>
                                <p className="text-lg text-gray-100 mb-6 drop-shadow-lg">
                                    Journey through time and explore the evolution of artistic expression across different eras and movements.
                                    Discover masterpieces from Renaissance to Contemporary art, each telling a unique story of human creativity.
                                </p>
                            </div>

                            {/* Movement Filter Tabs */}
                            <div className="mb-8">
                                <div className="flex flex-wrap gap-2 border-b border-white/30 pb-4">
                                    {Object.entries(movements).map(([key, movement]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleMovementChange(key)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                                selectedMovement === key
                                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                                                    : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30'
                                            }`}
                                        >
                                            {movement.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Movement Info */}
                            {selectedMovement && movements[selectedMovement] && (
                                <div className="mb-6 p-4 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-lg">
                                    <h2 className="text-2xl font-semibold text-white mb-2 drop-shadow-lg">
                                        {movements[selectedMovement].name}
                                    </h2>
                                    <p className="text-gray-100 drop-shadow-md">
                                        Explore artworks from this remarkable period in art history. Click on any artwork to add it to your favorites collection.
                                    </p>
                                </div>
                            )}

                            {/* Favorites moved to a draggable floating panel */}

                            {/* Artworks Grid */}
                            {artworks.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-100 text-lg drop-shadow-lg">Loading artworks...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {artworks.map((artwork) => (
                                        <div
                                            key={artwork.objectID}
                                            className="group border border-gray-200 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                        >
                                            {/* Artwork Image */}
                                            <div className="relative overflow-hidden bg-gray-100 aspect-square">
                                                {artwork.primaryImageSmall ? (
                                                    <img
                                                        src={artwork.primaryImageSmall}
                                                        alt={artwork.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                
                                                {/* Favorite Badge */}
                                                {isFavorite(artwork.objectID) && (
                                                    <div className="absolute top-2 right-2 bg-yellow-400 text-white rounded-full p-2 shadow-lg">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Artwork Info */}
                                            <div className="p-4">
                                                <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-800">
                                                    {artwork.title}
                                                </h3>
                                                
                                                {artwork.artistDisplayName && (
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <span className="font-medium">Artist:</span> {artwork.artistDisplayName}
                                                    </p>
                                                )}
                                                
                                                {artwork.objectDate && (
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <span className="font-medium">Date:</span> {artwork.objectDate}
                                                    </p>
                                                )}
                                                
                                                {artwork.culture && (
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        <span className="font-medium">Culture:</span> {artwork.culture}
                                                    </p>
                                                )}

                                                {/* Add to Favorites Button */}
                                                <button
                                                    onClick={() => handleAddToFavorites(artwork)}
                                                    disabled={isFavorite(artwork.objectID) || isAdding[artwork.objectID]}
                                                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                                                        isFavorite(artwork.objectID)
                                                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                            : isAdding[artwork.objectID]
                                                            ? 'bg-blue-400 text-white cursor-wait'
                                                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg transform hover:scale-105'
                                                    }`}
                                                >
                                                    {isFavorite(artwork.objectID) ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                            In Favorites
                                                        </span>
                                                    ) : isAdding[artwork.objectID] ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Adding...
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                            </svg>
                                                            Add to Favorites
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

