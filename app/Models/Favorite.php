<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id',
    'artifact_id',
    'item_name',
    'notes',
    'source',
    'image_url',
    'culture',
    'object_date',
];

}
