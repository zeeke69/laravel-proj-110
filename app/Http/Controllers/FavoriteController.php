<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    public function index()
    {
        $favorites = Favorite::where('user_id', Auth::id())->get();

        return Inertia::render('Favorites/Index', [
            'favorites' => $favorites
        ]);
    }

// Store favorite
public function store(Request $request)
{
    $request->validate([
        'artifact_id' => 'required|string',
        'item_name' => 'required|string|max:255',
        'source' => 'nullable|string',
        'image_url' => 'nullable|string|max:2048',
        'culture' => 'nullable|string|max:255',
        'object_date' => 'nullable|string|max:255',
    ]);

    if (Favorite::where('user_id', Auth::id())
        ->where('artifact_id', $request->artifact_id)
        ->exists()) {
        return redirect()->back()->with('message', 'Already in favorites!');
    }

    Favorite::create([
        'user_id' => Auth::id(),
        'artifact_id' => $request->artifact_id,
        'item_name' => $request->item_name,
        'source' => $request->source ?? 'history',
        'image_url' => $request->image_url,
        'culture' => $request->culture,
        'object_date' => $request->object_date,
    ]);

    return redirect()->back()->with('message', 'Added to favorites!');
}

// Update notes
public function update(Request $request, Favorite $favorite)
{
    $request->validate([
        'notes' => 'nullable|string|max:1000',
    ]);

    if ($favorite->user_id !== Auth::id()) {
        abort(403);
    }

    $favorite->update($request->only('notes'));

    return redirect()->back()->with('message', 'Notes updated!');
}

// Delete favorite
public function destroy(Favorite $favorite)
{
    if ($favorite->user_id !== Auth::id()) {
        abort(403);
    }

    $favorite->delete();

    return redirect()->back()->with('message', 'Deleted successfully!');
}


}
