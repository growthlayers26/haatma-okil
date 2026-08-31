<?php

namespace HaatmaOkil\LegalDesk\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Webkul\Attribute\Repositories\AttributeFamilyRepository;
use Webkul\Core\Repositories\ChannelRepository;
use Webkul\Product\Repositories\ProductRepository;

/**
 * Build the shop catalogue from the application's registry.
 *
 * The firm's price list lives in TypeScript, in lib/templates, lib/services and
 * lib/plans, and this command copies it into Bagisto rather than the catalogue being
 * maintained by hand in the admin panel. Two price lists is one too many: the day they
 * disagree, a client is charged something the site did not quote.
 *
 * Reads storage/app/catalogue.json, which the application writes from /api/catalogue.
 *
 * Products are `virtual`: a legal document has no weight, no stock and nothing to
 * ship, and marking them so is what keeps Bagisto from asking a buyer for a delivery
 * address.
 *
 * Idempotent. Run it again after changing a price and it updates in place, because
 * matching on SKU means re-running cannot produce a second listing of the same thing.
 */
class SeedCatalogue extends Command
{
    protected $signature = 'legal:seed-catalogue {--file=catalogue.json}';

    protected $description = "Create or update shop products from the application's price registry";

    public function __construct(
        protected ProductRepository $productRepository,
        protected AttributeFamilyRepository $attributeFamilyRepository,
        protected ChannelRepository $channelRepository,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $path = storage_path('app/'.$this->option('file'));

        if (! is_file($path)) {
            $this->error("No catalogue at {$path}.");
            $this->line('Write it first, with the application running:');
            $this->line('  curl -s http://localhost:3000/api/catalogue > '.$path);

            return self::FAILURE;
        }

        $payload = json_decode((string) file_get_contents($path), true);
        $entries = $payload['entries'] ?? null;

        if (! is_array($entries) || $entries === []) {
            $this->error('The catalogue file has no entries.');

            return self::FAILURE;
        }

        $family = $this->attributeFamilyRepository->findOneByField('code', 'default')
            ?? $this->attributeFamilyRepository->first();

        if (! $family) {
            $this->error('No attribute family exists. Is Bagisto installed?');

            return self::FAILURE;
        }

        $channel = $this->channelRepository->first();
        $channelCode = $channel->code ?? 'default';
        $locale = $channel->default_locale->code ?? 'en';

        $created = 0;
        $updated = 0;

        foreach ($entries as $entry) {
            $sku = (string) ($entry['sku'] ?? '');
            if ($sku === '') {
                continue;
            }

            $existing = $this->productRepository->findOneByField('sku', $sku);

            if (! $existing) {
                $existing = $this->productRepository->create([
                    'type'                => 'virtual',
                    'attribute_family_id' => $family->id,
                    'sku'                 => $sku,
                ]);
                $created++;
            } else {
                $updated++;
            }

            $this->productRepository->update([
                'sku'                  => $sku,
                'name'                 => (string) ($entry['name'] ?? $sku),
                'url_key'              => Str::slug($sku),
                'price'                => (float) ($entry['priceNpr'] ?? 0),
                'weight'               => 0,
                'status'               => 1,
                'visible_individually'  => 1,
                'short_description'    => (string) ($entry['nameNe'] ?? ''),
                'description'          => (string) ($entry['nameNe'] ?? ''),
                'channel'              => $channelCode,
                'locale'               => $locale,
                'guest_checkout'       => 0,
                /*
                 * Nothing runs out. A document is generated per buyer, so stock is a
                 * concept the catalogue has to carry and the product does not have.
                 */
                'inventories'          => [1 => 1000],
            ], $existing->id);
        }

        $this->info("Catalogue seeded: {$created} created, {$updated} updated.");

        return self::SUCCESS;
    }
}
