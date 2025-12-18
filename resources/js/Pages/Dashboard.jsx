import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function Dashboard() {
    const { artifacts = [], favorites: favoritesProp = [] } = usePage().props;

    const quotes = useMemo(() => ([
        {
            quote: "Artifacts are history’s possessions—kept not to own the past, but to remember it.",
            author: "Museum Notes",
        },
        {
            quote: "What we inherit is not just gold and stone, but the meaning we attach to them.",
            author: "On Civilization",
        },
        {
            quote: "Every object survives two journeys: through time, and through the hands that choose to keep it.",
            author: "Archive Reflection",
        },
        {
            quote: "A civilization is often understood by what it carried forward—and what it left behind.",
            author: "History Reader",
        },
        {
            quote: "Possessions become artifacts the moment a story outgrows the owner.",
            author: "Curator’s Line",
        },
        {
            quote: "We do not collect objects; we collect echoes.",
            author: "Gallery Wall",
        },
    ]), []);

    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setQuoteIndex((i) => (quotes.length ? (i + 1) % quotes.length : 0));
        }, 7000);
        return () => clearInterval(id);
    }, [quotes.length]);

    // Draggable "Favorites bubble" panel positioning (persisted in localStorage).
    const [favPos, setFavPos] = useState(() => {
        try {
            const raw = localStorage.getItem('dashboard:favoritesPos');
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
            return localStorage.getItem('dashboard:favoritesMinimized') === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('dashboard:favoritesPos', JSON.stringify(favPos));
        } catch {
            // ignore
        }
    }, [favPos]);

    useEffect(() => {
        try {
            localStorage.setItem('dashboard:favoritesMinimized', favMinimized ? '1' : '0');
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

    // Render favorites from server props (source of truth).
    // Keep ONLY UI state (editing + draft notes) locally, keyed by favorite id.
    const [uiById, setUiById] = useState({});

    useEffect(() => {
        setUiById(prev => {
            const next = { ...prev };
            for (const fav of favoritesProp) {
                if (!next[fav.id]) {
                    next[fav.id] = { editing: false, notesEdit: fav.notes || '' };
                } else if (!next[fav.id].editing) {
                    // If not actively editing, keep draft aligned to latest server notes.
                    next[fav.id] = { ...next[fav.id], notesEdit: fav.notes || '' };
                }
            }
            // Drop UI state for favorites that no longer exist.
            for (const id of Object.keys(next)) {
                if (!favoritesProp.some(f => String(f.id) === String(id))) {
                    delete next[id];
                }
            }
            return next;
        });
    }, [favoritesProp]);

    const favorites = useMemo(() => {
        return favoritesProp.map(fav => ({
            ...fav,
            editing: uiById[fav.id]?.editing ?? false,
            notesEdit: uiById[fav.id]?.notesEdit ?? (fav.notes || ''),
        }));
    }, [favoritesProp, uiById]);

    // Add artifact to favorites
    const handleAdd = (artifact) => {
        // Prevent duplicates
        if (favorites.some(f => f.item_name === artifact.title)) {
            alert('Already in favorites!');
            return;
        }

        router.post('/favorites', {
            artifact_id: artifact.objectID.toString(),
            item_name: artifact.title,
            source: 'history',
            image_url: artifact.primaryImageSmall || null,
            culture: artifact.culture || null,
            object_date: artifact.objectDate || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // The redirect back should already update props; this guarantees it.
                router.reload({ only: ['favorites'], preserveScroll: true, preserveState: false });
            },
        });
    };

    // Delete favorite
    const handleDelete = (id) => {
        if (confirm('Delete this favorite?')) {
            router.delete(`/favorites/${id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ['favorites'], preserveScroll: true, preserveState: false });
                },
            });
        }
    };

    // Save edited notes
    const handleSave = (fav) => {
        router.put(`/favorites/${fav.id}`, { notes: fav.notesEdit }, {
            preserveScroll: true,
            onSuccess: () => {
                // Close edit mode locally right away, then sync from server.
                setUiById(prev => ({
                    ...prev,
                    [fav.id]: { ...(prev[fav.id] || {}), editing: false },
                }));
                router.reload({ only: ['favorites'], preserveScroll: true, preserveState: false });
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>}>
            <Head title="Dashboard" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Draggable Favorites bubble/panel */}
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
                                                            {fav.editing ? (
                                                                <input
                                                                    type="text"
                                                                    value={fav.notesEdit}
                                                                    onChange={e => {
                                                                        const value = e.target.value;
                                                                        setUiById(prev => ({
                                                                            ...prev,
                                                                            [fav.id]: { ...(prev[fav.id] || {}), notesEdit: value },
                                                                        }));
                                                                    }}
                                                                    className="border p-1 rounded w-full"
                                                                />
                                                            ) : (
                                                                fav.notes
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 pl-2">
                                                    {fav.editing ? (
                                                        <>
                                                            <button onClick={() => handleSave(fav)} className="bg-green-500 text-white px-2 py-1 rounded">Save</button>
                                                            <button onClick={() => {
                                                                setUiById(prev => ({
                                                                    ...prev,
                                                                    [fav.id]: { ...(prev[fav.id] || {}), editing: false, notesEdit: fav.notes || '' },
                                                                }));
                                                            }} className="bg-gray-500 text-white px-2 py-1 rounded">Cancel</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => {
                                                                setUiById(prev => ({
                                                                    ...prev,
                                                                    [fav.id]: { ...(prev[fav.id] || {}), editing: true, notesEdit: prev[fav.id]?.notesEdit ?? (fav.notes || '') },
                                                                }));
                                                            }} className="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
                                                            <button onClick={() => handleDelete(fav.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
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

                    {/* Transparent section wrapper so the Spline background shows through */}
                    <div className="overflow-hidden bg-transparent sm:rounded-lg">
                        <div className="p-6 text-gray-900">

                            {/* Artifacts */}
                            <h1 className="text-3xl font-bold mb-4">Civilizations Through Artifacts</h1>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                {artifacts.map(artifact => (
                                    <div key={artifact.objectID} className="group border bg-white rounded-lg p-4 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                                        <div className="overflow-hidden rounded mb-3">
                                            <img
                                                src={artifact.primaryImageSmall}
                                                alt={artifact.title}
                                                className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        </div>
                                        <h2 className="font-semibold text-lg group-hover:text-blue-600 transition-colors duration-300">{artifact.title}</h2>
                                        <p className="text-sm text-gray-600">{artifact.culture} — {artifact.objectDate}</p>
                                        <button
                                            className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-all duration-300 transform group-hover:scale-105"
                                            onClick={() => handleAdd(artifact)}
                                        >
                                            ⭐ Add to Favorites
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Quotes in the middle */}
                            <div className="my-10">
                                <div className="mx-auto max-w-3xl rounded-xl border border-white/30 bg-white/25 backdrop-blur-md p-6 text-gray-900 shadow-sm">
                                    <div className="text-xs font-semibold tracking-wide text-gray-800/80 uppercase text-center">
                                        History & Possessions
                                    </div>
                                    <div className="mt-4 text-lg leading-relaxed text-center">
                                        “{quotes[quoteIndex]?.quote}”
                                    </div>
                                    <div className="mt-3 text-sm text-gray-800/80 text-center">
                                        — {quotes[quoteIndex]?.author}
                                    </div>
                                    <div className="mt-5 flex justify-center gap-3">
                                        <button
                                            type="button"
                                            className="pointer-events-auto rounded bg-white/70 px-3 py-1 text-sm hover:bg-white"
                                            onClick={() => setQuoteIndex((i) => (quotes.length ? (i - 1 + quotes.length) % quotes.length : 0))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="pointer-events-auto rounded bg-white/70 px-3 py-1 text-sm hover:bg-white"
                                            onClick={() => setQuoteIndex((i) => (quotes.length ? (i + 1) % quotes.length : 0))}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Favorites moved to a draggable floating panel */}

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
