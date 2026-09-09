<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Outbound messages, queued before they are sent.
 *
 * Named `legal_notifications` because Bagisto already owns a `notifications` table
 * for its own admin alerts.
 *
 * The queue-first shape was originally forced — there was no mail provider, so
 * queuing was all the code could do. Bagisto now supplies a real mailer (Mailpit
 * locally, SMTP in production), but the shape stays, because the reason to keep it is
 * better than the reason it was built: a legal practice needs a queryable record of
 * what it told a client and when, tied to the matter it concerned. Handing a message
 * to an SMTP server leaves no such record.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_notifications', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            // Null for a recipient who has no account — an advocate is an admin, and a
            // signatory invited by email may be neither.
            $table->unsignedInteger('customer_id')->nullable();
            $table->enum('channel', ['email', 'sms'])->default('email');
            $table->string('recipient');

            // What happened, in a form that can be filtered and counted later.
            $table->string('kind');
            $table->string('subject');
            $table->text('body');

            // What it was about, so a message can be traced back to its cause.
            $table->char('enquiry_id', 36)->nullable();
            $table->char('document_id', 36)->nullable();
            $table->unsignedInteger('bagisto_order_id')->nullable();

            $table->enum('status', ['queued', 'sent', 'failed'])->default('queued');
            $table->dateTime('sent_at')->nullable();
            $table->text('error')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('enquiry_id')->references('id')->on('legal_enquiries')->onDelete('set null');
            $table->foreign('document_id')->references('id')->on('legal_documents')->onDelete('set null');
            $table->foreign('bagisto_order_id')->references('id')->on('orders')->onDelete('set null');

            $table->index(['status', 'created_at']);
            $table->index(['customer_id', 'created_at']);
        });

        DB::statement('ALTER TABLE `legal_notifications` MODIFY `id` CHAR(36) NOT NULL DEFAULT (UUID())');
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_notifications');
    }
};
