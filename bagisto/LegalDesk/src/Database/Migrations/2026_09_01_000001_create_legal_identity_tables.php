<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Identity, and the organisations a client may belong to.
 *
 * Every table here hangs off Bagisto's `customers`, which is now the only account in
 * the product. The old schema carried a `profiles` row mirroring name and phone;
 * Bagisto already stores those, so what survives is the one field it has no opinion
 * about — which language the person reads.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_profiles', function (Blueprint $table) {
            $table->unsignedInteger('customer_id')->primary();
            $table->enum('preferred_lang', ['ne', 'en'])->default('ne');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });

        Schema::create('legal_organisations', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('name');
            $table->unsignedInteger('owner_id');
            // Seats are bought, and legal_add_org_member refuses to exceed them.
            $table->unsignedInteger('seats')->default(1);
            /*
             * Whether drafts by members need sign-off before they can be bought. Off by
             * default: a firm that has not asked for an approval queue should not
             * discover one standing between their staff and a document they need.
             */
            $table->boolean('require_approval')->default(false);
            $table->timestamps();

            $table->foreign('owner_id')->references('id')->on('customers')->onDelete('cascade');
        });

        Schema::create('legal_memberships', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('org_id', 36);
            $table->unsignedInteger('customer_id');
            $table->enum('role', ['owner', 'admin', 'member'])->default('member');
            $table->timestamps();

            $table->foreign('org_id')->references('id')->on('legal_organisations')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');

            // One membership per person per organisation.
            $table->unique(['org_id', 'customer_id']);
            $table->index('customer_id');
            $table->index(['org_id', 'role']);
        });

        foreach (['legal_organisations', 'legal_memberships'] as $table) {
            DB::statement("ALTER TABLE `{$table}` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_memberships');
        Schema::dropIfExists('legal_organisations');
        Schema::dropIfExists('legal_profiles');
    }
};
