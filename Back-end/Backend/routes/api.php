<?php

use Illuminate\Support\Facades\Route;


Route::get('/connection-test', function () {
    return response()->json([
        'status' => 'Success',
        'message' => 'Hello from your Laravel backend server!',
        'timestamp' => now()->toIso8601String()
    ]);
});
