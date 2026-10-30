<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\ThrottleRequestsException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up', // Render gamit ito para malaman kung buhay pa ang app
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Nasa likod ng proxy ng Render ang app. Kailangan ito para tama
        // ang https at IP ng user (importante sa rate limit).
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Lahat ng /api/* ay laging JSON ang sagot, kahit may error.
        $exceptions->shouldRenderJsonWhen(function (Request $request) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // Malinaw na message kapag sobrang dami na ng try
        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(
                    ['message' => 'Too many attempts. Please wait a minute and try again.'],
                    429,
                    $e->getHeaders()
                );
            }
        });
    })
    ->create();
