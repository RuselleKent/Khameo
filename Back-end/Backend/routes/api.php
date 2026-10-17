<?php

use Illuminate\Support\Facades\Route;

// React Native will call this using: http://<your-ip>:8000/api/connection-test
Route::get('/connection-test', function () {
    return response()->json([
        'status' => 'Success',
        'message' => 'Hello from your Laravel backend server to React Native!',
        'timestamp' => now()->toIso8601String()
    ]);
});
