<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use App\Models\Favorite;
use Illuminate\Support\Facades\Auth;

class ArtMovementsController extends Controller
{
    // Met Museum Department IDs mapped to art movements/eras
    private $movements = [
        'renaissance' => [
            'name' => 'Renaissance (1400-1600)',
            'departmentIds' => [11, 9], // European Paintings, European Sculpture
            'search' => 'renaissance',
        ],
        'baroque' => [
            'name' => 'Baroque (1600-1750)',
            'departmentIds' => [11, 9],
            'search' => 'baroque',
        ],
        'impressionism' => [
            'name' => 'Impressionism (1860-1886)',
            'departmentIds' => [11],
            'search' => 'impressionist',
        ],
        'modern' => [
            'name' => 'Modern Art (1900-1950)',
            'departmentIds' => [21, 19], // Modern and Contemporary Art, Photographs
            'search' => 'modern',
        ],
        'contemporary' => [
            'name' => 'Contemporary (1950-Present)',
            'departmentIds' => [21],
            'search' => 'contemporary',
        ],
        'medieval' => [
            'name' => 'Medieval (500-1400)',
            'departmentIds' => [17], // Medieval Art
            'search' => 'medieval',
        ],
        'ancient' => [
            'name' => 'Ancient Art (Before 500 CE)',
            'departmentIds' => [1, 3, 4, 5], // Egyptian, Ancient Near Eastern, Greek and Roman, etc.
            'search' => 'ancient',
        ],
    ];

    public function index($movement = null)
    {
        // If no movement specified, default to renaissance
        if (!$movement || !isset($this->movements[$movement])) {
            $movement = 'renaissance';
        }

        $selectedMovement = $this->movements[$movement];
        $favorites = Favorite::where('user_id', Auth::id())->get();
        $favoriteIds = $favorites->pluck('artifact_id')->toArray();

        // Cache key based on movement
        $cacheKey = "art_movements_{$movement}";
        
        try {
            $artworks = Cache::remember($cacheKey, 3600, function () use ($selectedMovement) {
            $artworks = [];
            $targetCount = 20;
            $maxFetches = 100;
            $attempts = 0;

            // Try to get artworks from departments
            foreach ($selectedMovement['departmentIds'] as $deptId) {
                if (count($artworks) >= $targetCount) {
                    break;
                }

                try {
                    $response = Http::retry(2, 200)
                        ->timeout(8)
                        ->get('https://collectionapi.metmuseum.org/public/collection/v1/objects', [
                            'departmentIds' => $deptId,
                            'hasImages' => true,
                        ]);

                    if (!$response->successful()) {
                        continue;
                    }

                    $objectIds = $response->json('objectIDs') ?? [];
                    
                    if (empty($objectIds) || !is_array($objectIds)) {
                        continue;
                    }

                    shuffle($objectIds);

                    foreach ($objectIds as $id) {
                        if (count($artworks) >= $targetCount || $attempts >= $maxFetches) {
                            break 2;
                        }
                        $attempts++;

                        try {
                            $artifactResponse = Http::retry(2, 200)
                                ->timeout(8)
                                ->get("https://collectionapi.metmuseum.org/public/collection/v1/objects/{$id}");

                            if (!$artifactResponse->successful()) {
                                continue;
                            }

                            $artifact = $artifactResponse->json();

                            if (is_array($artifact) && 
                                !empty($artifact['primaryImageSmall']) && 
                                !empty($artifact['title']) &&
                                !empty($artifact['objectDate'])) {
                                $artworks[] = $artifact;
                            }
                        } catch (\Exception $e) {
                            // Skip this artifact if there's an error
                            continue;
                        }
                    }
                } catch (\Exception $e) {
                    // Skip this department if there's an error
                    continue;
                }
            }

            // If we don't have enough, try search
            if (count($artworks) < $targetCount) {
                try {
                    $searchResponse = Http::retry(2, 200)
                        ->timeout(8)
                        ->get('https://collectionapi.metmuseum.org/public/collection/v1/search', [
                            'q' => $selectedMovement['search'],
                            'hasImages' => true,
                        ]);

                    if ($searchResponse->successful()) {
                        $searchIds = $searchResponse->json('objectIDs') ?? [];
                        
                        if (is_array($searchIds) && !empty($searchIds)) {
                            $searchIds = array_slice($searchIds, 0, 50);
                            shuffle($searchIds);

                            foreach ($searchIds as $id) {
                                if (count($artworks) >= $targetCount || $attempts >= $maxFetches) {
                                    break;
                                }
                                $attempts++;

                                // Skip if already added
                                if (collect($artworks)->contains('objectID', $id)) {
                                    continue;
                                }

                                try {
                                    $artifactResponse = Http::retry(2, 200)
                                        ->timeout(8)
                                        ->get("https://collectionapi.metmuseum.org/public/collection/v1/objects/{$id}");

                                    if (!$artifactResponse->successful()) {
                                        continue;
                                    }

                                    $artifact = $artifactResponse->json();

                                    if (is_array($artifact) && 
                                        !empty($artifact['primaryImageSmall']) && 
                                        !empty($artifact['title']) &&
                                        !empty($artifact['objectDate'])) {
                                        $artworks[] = $artifact;
                                    }
                                } catch (\Exception $e) {
                                    // Skip this artifact if there's an error
                                    continue;
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // If search fails, just return what we have
                }
            }

            return array_slice($artworks, 0, $targetCount);
            });
        } catch (\Exception $e) {
            // If cache fails, return empty array
            $artworks = [];
        }

        // Ensure artworks is always an array
        if (!is_array($artworks)) {
            $artworks = [];
        }

        return Inertia::render('ArtMovements/Index', [
            'artworks' => $artworks,
            'movements' => $this->movements,
            'selectedMovement' => $movement,
            'favorites' => $favorites,
            'favoriteIds' => $favoriteIds,
        ]);
    }
}

