<?php

namespace Webkul\Fonepay\Providers;

use Illuminate\Support\ServiceProvider;

class FonepayServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(
            dirname(__DIR__).'/Config/payment-methods.php',
            'payment_methods'
        );
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../Routes/web.php');
    }
}
