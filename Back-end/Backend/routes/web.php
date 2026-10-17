<?php

use Illuminate\Support\Facades\Route;

// Tells your team the backend engine is running perfectly
Route::get('/', function () {
    return response()->json([
        'status' => 'Laravel Backend Engine Active',
        'framework' => 'Laravel ' . app()->version(),
        'environment' => config('app.env')
    ]);
});
