<?php

namespace HaatmaOkil\LegalDesk\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Mail;

/**
 * Sending one queued message.
 *
 * This endpoint takes a recipient, a subject and a body and puts them on the wire
 * from the firm's address. Left open, that is a mail relay wearing a law firm's name —
 * so it is behind a shared secret, compared in constant time, and refuses outright
 * if the secret has not been configured. Failing closed matters more than failing
 * usefully here: an unconfigured relay that still sends is the bad outcome.
 *
 * The application queues messages whether or not this succeeds. Delivery is the part
 * that can fail; the record of what the firm told a client is not.
 */
class MailController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $expected = (string) env('LEGAL_API_SECRET', '');

        if ($expected === '') {
            return response()->json(['error' => 'not_configured'], 503);
        }

        if (! hash_equals($expected, (string) $request->header('X-Legal-Secret'))) {
            return response()->json(['error' => 'forbidden'], 403);
        }

        $data = $request->validate([
            'recipient' => ['required', 'email'],
            'subject'   => ['required', 'string', 'max:255'],
            'body'      => ['required', 'string', 'max:50000'],
            'reply_to'  => ['nullable', 'email'],
        ]);

        try {
            Mail::raw($data['body'], function ($message) use ($data) {
                $message->to($data['recipient'])->subject($data['subject']);

                /*
                 * A reply-to nobody reads is worse than no email at all: someone
                 * answering a notification about their own legal matter must reach the
                 * firm rather than a void.
                 */
                if (! empty($data['reply_to'])) {
                    $message->replyTo($data['reply_to']);
                }
            });
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 502);
        }

        return response()->json(['ok' => true]);
    }
}
