<?php

namespace Webkul\Esewa\Providers;

use Illuminate\Support\ServiceProvider;

class EsewaServiceProvider extends ServiceProvider
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

        $this->loadViewsFrom(__DIR__.'/../Resources/views', 'esewa');
    }
}
