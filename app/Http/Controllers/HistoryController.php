<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class HistoryController extends Controller
{
    public function index()
    {
        $artifacts = Cache::remember('ancient_artifacts', 3600, function () {
            // Search for ancient artifacts
            $search = Http::get(
                'https://collectionapi.metmuseum.org/public/collection/v1/search',
                ['q' => 'ancient', 'hasImages' => true]
            );

            $ids = array_slice($search->json()['objectIDs'] ?? [], 0, 12);

            $items = [];

            foreach ($ids as $id) {
                $items[] = Http::get(
                    "https://collectionapi.metmuseum.org/public/collection/v1/objects/{$id}"
                )->json();
            }

            return $items;
        });

        return Inertia::render('History/Index', [
            'artifacts' => $artifacts
        ]);
    }
}
