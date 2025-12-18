<?php

use App\Models\Favorite;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ArtMovementsController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

Route::middleware(['auth'])->group(function () {

    // One-page Dashboard route with artifacts and favorites
    Route::get('/dashboard', function () {

        // Fetch artifact IDs from Met Museum API
        $artifactIds = Http::retry(2, 200)
            ->timeout(8)
            ->get('https://collectionapi.metmuseum.org/public/collection/v1/objects?departmentIds=1')
            ->json('objectIDs') ?? [];

        // Collect up to 12 artifacts that actually have images.
        // The API often returns many IDs without images; taking the "first 12" can produce an empty grid.
        $artifacts = [];
        if (!empty($artifactIds)) {
            shuffle($artifactIds);

            $targetCount = 12;
            $maxFetches = 80; // keep dashboard snappy
            $attempts = 0;

        foreach ($artifactIds as $id) {
                if (count($artifacts) >= $targetCount || $attempts >= $maxFetches) {
                    break;
                }
                $attempts++;

                $artifact = Http::retry(2, 200)
                    ->timeout(8)
                    ->get("https://collectionapi.metmuseum.org/public/collection/v1/objects/{$id}")
                ->json();

                if (!empty($artifact['primaryImageSmall']) && !empty($artifact['title'])) {
                $artifacts[] = $artifact;
                }
            }
        }

        // Fetch user's favorites
        $favorites = Favorite::where('user_id', Auth::id())->get();

        return Inertia::render('Dashboard', [
            'artifacts' => $artifacts,
            'favorites' => $favorites,
        ]);
    })->name('dashboard');

    // Art Movements Expedition
    Route::get('/art-movements/{movement?}', [ArtMovementsController::class, 'index'])->name('art-movements.index');

    // Favorites CRUD
    Route::post('/favorites', [FavoriteController::class, 'store'])->name('favorites.store');
    Route::put('/favorites/{favorite}', [FavoriteController::class, 'update'])->name('favorites.update'); // ✅ Fixed update route
    Route::delete('/favorites/{favorite}', [FavoriteController::class, 'destroy'])->name('favorites.destroy');

    // Profile Edit route for Ziggy (required by AuthenticatedLayout)
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');

    // Logout route for Ziggy
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

require __DIR__.'/auth.php';
