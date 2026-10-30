<?php

// Mga setting ng Khameo. Galing lahat sa .env (o sa Environment ng Render).
// Ang "?:" ay para kapag walang laman ang variable, gagamitin pa rin ang default.
return [
    // Brevo = serbisyong nagpapadala ng email gamit ang HTTPS.
    // Bakit hindi Gmail SMTP? Bina-block ng Render (free) ang SMTP ports.
    // Kapag walang key, ang code ay isusulat lang sa log (para sa local).
    'brevo_api_key' => env('BREVO_API_KEY'),

    // Ang email na lalabas na "from". Dapat verified sender ito sa Brevo.
    'mail_from_address' => env('MAIL_FROM_ADDRESS') ?: 'hello@example.com',
    'mail_from_name' => env('MAIL_FROM_NAME') ?: 'Khameo',

    // Dito magbubukas ang link sa reset-password email.
    'frontend_reset_url' => env('FRONTEND_RESET_URL') ?: 'khameo://reset-password',

    // Google client IDs ng app (hiwalay gamit comma: web, android, ios).
    'google_client_ids' => env('GOOGLE_CLIENT_IDS', ''),
];
