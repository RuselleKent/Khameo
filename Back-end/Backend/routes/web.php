<?php

use Illuminate\Support\Facades\Route;

// This stops Laravel from trying to load a web page and prevents the $page error
Route::get('/', function () {
    return response()->json([
        'status' => 'Laravel Backend Engine Active',
        'api_endpoint' => 'http://127.0.0'
    ]);
});
