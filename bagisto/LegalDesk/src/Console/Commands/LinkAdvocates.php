<?php

namespace HaatmaOkil\LegalDesk\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Attach the firm's advocates to their Bagisto staff accounts.
 *
 * Linking happens automatically when an advocate signs into the desk, matching on
 * email. This command does the same thing ahead of time and, more usefully, says who
 * still has no staff account — because the failure mode it guards against is silent:
 * an advocate with a mistyped or missing account does not get an error, they get an
 * empty desk that looks exactly like having no matters.
 *
 * It deliberately does NOT create the accounts. Creating a login for a named,
 * practising advocate means choosing a password on their behalf, and those three
 * people are real. The firm creates them in Bagisto's admin panel, where Bagisto
 * handles the credentials properly; this then wires them up.
 */
class LinkAdvocates extends Command
{
    protected $signature = 'legal:link-advocates';

    protected $description = 'Link advocates to their Bagisto staff accounts, and report any without one';

    public function handle(): int
    {
        $admins = DB::table('admins')->select('id', 'email')->get();

        foreach ($admins as $admin) {
            DB::select('CALL legal_link_advocate_account(?, ?)', [$admin->id, $admin->email]);
        }

        $advocates = DB::table('legal_advocates as a')
            ->leftJoin('admins as ad', 'ad.id', '=', 'a.admin_id')
            ->select('a.full_name_en', 'a.email', 'a.admin_id', 'ad.email as admin_email')
            ->orderBy('a.full_name_en')
            ->get();

        $rows = [];
        $unlinked = 0;

        foreach ($advocates as $advocate) {
            $linked = $advocate->admin_id !== null;

            if (! $linked) {
                $unlinked++;
            }

            $rows[] = [
                $advocate->full_name_en,
                $advocate->email ?? '(no email on record)',
                $linked ? "linked → {$advocate->admin_email}" : 'NO STAFF ACCOUNT',
            ];
        }

        $this->table(['Advocate', 'Email on record', 'Desk access'], $rows);

        if ($unlinked > 0) {
            $this->warn("{$unlinked} advocate(s) cannot open the desk.");
            $this->line('Create a staff account for each in the admin panel, at the SAME address');
            $this->line('shown above, then run this again:');
            $this->line('  '.config('app.url').'/admin/settings/users/create');
            $this->newLine();
            $this->line('A mismatched address does not error — it simply never matches, and the');
            $this->line('advocate opens an empty desk with nothing on screen to explain why.');

            return self::FAILURE;
        }

        $this->info('Every advocate can open the desk.');

        return self::SUCCESS;
    }
}
