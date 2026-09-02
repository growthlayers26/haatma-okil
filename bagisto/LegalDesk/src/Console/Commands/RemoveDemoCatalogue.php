<?php

namespace HaatmaOkil\LegalDesk\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Webkul\Product\Repositories\ProductRepository;

/**
 * Take Bagisto's demo goods out of a law firm's shop.
 *
 * A fresh Bagisto install seeds a sample catalogue — tablets, a microwave oven,
 * jeans, concert tickets, restaurant reservations. They sit alongside the legal
 * documents and are live and buyable, so a client sent to pay for an employment
 * contract lands in a shop selling homeware.
 *
 * A command rather than a migration, because deleting products is destructive and
 * should be something the firm does deliberately, once, having seen the list.
 *
 * "Ours" means a SKU the catalogue seeder writes: doc-, svc- or plan-. Anything else
 * is treated as demo data — so if the firm later sells something of their own that is
 * not a legal document, exclude it with --keep before running this.
 */
class RemoveDemoCatalogue extends Command
{
    protected $signature = 'legal:remove-demo-catalogue
                            {--force : Delete without asking}
                            {--keep=* : SKU prefixes to preserve in addition to ours}';

    protected $description = "Remove Bagisto's sample products, leaving only the firm's catalogue";

    public function __construct(protected ProductRepository $productRepository)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $keep = array_merge(['doc-', 'svc-', 'plan-'], $this->option('keep'));

        $doomed = DB::table('products')
            ->select('id', 'sku')
            ->where(function ($query) use ($keep) {
                foreach ($keep as $prefix) {
                    $query->where('sku', 'not like', $prefix.'%');
                }
            })
            ->get();

        if ($doomed->isEmpty()) {
            $this->info('Nothing to remove — the catalogue is already only the firm\'s.');

            return self::SUCCESS;
        }

        $this->warn("{$doomed->count()} product(s) are not part of the firm's catalogue:");

        foreach ($doomed->take(10) as $product) {
            $this->line('  '.$product->sku);
        }

        if ($doomed->count() > 10) {
            $this->line('  … and '.($doomed->count() - 10).' more');
        }

        $this->newLine();
        $this->line('Preserving SKUs beginning: '.implode(', ', $keep));

        if (! $this->option('force') && ! $this->confirm('Delete these permanently?', false)) {
            $this->line('Nothing was deleted.');

            return self::SUCCESS;
        }

        $removed = 0;

        foreach ($doomed as $product) {
            try {
                // Through the repository so Bagisto tears down the attribute values,
                // flat rows, indices and media that belong to each product.
                $this->productRepository->delete($product->id);
                $removed++;
            } catch (\Throwable $e) {
                $this->error("  could not remove {$product->sku}: {$e->getMessage()}");
            }
        }

        $this->info("Removed {$removed} product(s).");

        $remaining = DB::table('products')->count();
        $this->line("The catalogue now holds {$remaining} product(s).");

        return self::SUCCESS;
    }
}
