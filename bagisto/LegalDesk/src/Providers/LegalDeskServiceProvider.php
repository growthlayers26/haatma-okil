<?php

namespace HaatmaOkil\LegalDesk\Providers;

use HaatmaOkil\LegalDesk\Console\Commands\SeedCatalogue;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Registers the legal domain inside Bagisto.
 *
 * This package deliberately owns the schema and nothing else. The legal reasoning —
 * which clauses a template carries, what the statute requires, whether a drafted
 * document breaches it — lives in the Next.js application in TypeScript, where it is
 * written once and shared by the server and the browser. Reimplementing any of that
 * here would put the same rule in two languages and let them drift apart, which is
 * the one failure mode a legal product cannot tolerate.
 *
 * So Bagisto holds the tables, the money and the admin UI; the application holds the
 * law.
 */
class LegalDeskServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');

        Route::middleware('api')
            ->prefix('api/legal')
            ->group(__DIR__.'/../Routes/api.php');

        // Under `web`, so the checkout hand-off runs in the customer's own session.
        Route::middleware('web')
            ->group(__DIR__.'/../Routes/web.php');

        if ($this->app->runningInConsole()) {
            $this->commands([SeedCatalogue::class]);
        }
    }

    public function register(): void
    {
        //
    }
}
