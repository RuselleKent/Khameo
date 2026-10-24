<?php

// Khameo settings. Values come from .env.
return [
    // Where the reset-password email link opens (the app).
    'frontend_reset_url' => env('FRONTEND_RESET_URL', 'http://localhost:8081/reset-password'),

    // Google client IDs the app uses (comma separated: web, android, ios).
    'google_client_ids' => env('GOOGLE_CLIENT_IDS', ''),
];
