<?php

// CORS: kailangan lang ito kapag web ang gamit (browser).
// Sa phone (Expo Go) hindi ito issue. Bearer token ang gamit natin,
// walang cookies, kaya safe na i-allow ang lahat ng origin.
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
