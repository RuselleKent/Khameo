<?php

use Illuminate\Support\Facades\Route;

// Simpleng check lang na buhay ang API. Walang sensitive info dito.
Route::get('/', function () {
    return response()->json(['app' => 'Khameo API', 'status' => 'ok']);
});
