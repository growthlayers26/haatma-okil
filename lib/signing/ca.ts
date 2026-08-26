import type { Bilingual } from "../types";

/**
 * Certifying authority integration.
 *
 * The Electronic Transactions Act, 2063 recognises a digital signature when it is
 * backed by a certificate issued by a certifying authority licensed by the Office of
 * the Controller of Certification. Everything in this file is the shape of that
 * integration. None of it is connected to a live authority, and that is deliberate:
 * the firm must first select a licensed CA, and implementing against the wrong one
 * would be worse than implementing against none.
 *
 * The interface below is what an implementation has to satisfy. It is written down so
 * whoever wires up the chosen CA inherits the requirements rather than rediscovering
 * them.
 */

export type CertificateInput = {
  /** PEM or DER, as the authority issues it. */
  certificate: string;
  /** The detached signature over the document digest. */
  signature: string;
  /** Digest of the exact bytes that were signed. */
  documentDigest: string;
};

export type CertificateFacts = {
  subjectCommonName: string;
  serialNumber: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
};

export type VerificationResult =
  | { valid: true; facts: CertificateFacts }
  | {
      valid: false;
      /*
       * `revoked` and `untrusted_issuer` are the two that matter most and the two a
       * naive implementation forgets. A certificate can be well-formed, unexpired,
       * and still worthless because it was revoked this morning or because its issuer
       * holds no OCC licence.
       */
      reason:
        | "expired"
        | "revoked"
        | "untrusted_issuer"
        | "digest_mismatch"
        | "malformed"
        | "authority_unreachable";
      detail?: string;
    };

/**
 * What a certifying authority adapter must provide.
 *
 * An implementation is responsible for four things, all of them required by the Act
 * rather than by this codebase:
 *
 *  1. Confirming the issuer is currently licensed by the Controller. An expired CA
 *     licence invalidates certificates issued under it.
 *  2. Checking revocation at the time of verification — CRL or OCSP. Revocation is
 *     the whole point of a certificate infrastructure; skipping it reduces the
 *     signature to an assertion.
 *  3. Verifying the signature against the digest of the exact bytes signed, not a
 *     re-rendered copy of the document. Regenerating a PDF changes its bytes.
 *  4. Returning `authority_unreachable` rather than a guess when the CA cannot be
 *     reached. An unreachable authority must never resolve as valid.
 */
export interface CertifyingAuthorityAdapter {
  /** Display name of the authority. */
  readonly name: string;
  /** The authority's licence reference from the Controller, recorded in the audit trail. */
  readonly occLicenceRef: string;
  verify(input: CertificateInput): Promise<VerificationResult>;
}

/**
 * The configured adapter.
 *
 * Returns null because no authority has been selected. Every caller must handle null
 * — which is what keeps the digital route honestly unavailable instead of appearing
 * to work.
 */
export function getCertifyingAuthority(): CertifyingAuthorityAdapter | null {
  return null;
}

export function isDigitalSigningAvailable(): boolean {
  return getCertifyingAuthority() !== null;
}

/**
 * What each route actually achieves, in the words shown to users.
 *
 * Kept beside the adapter so the claim made in the interface and the claim made on
 * screen cannot drift apart.
 */
export const SIGNING_ROUTES = {
  wet_ink: {
    label: { ne: "हस्तलिखित हस्ताक्षर", en: "Sign by hand" },
    effect: {
      ne: "कानुनी रूपमा प्रभावकारी। कागजात छापेर हस्ताक्षर गरी सक्कल प्रति राख्नुहोस्।",
      en: "Legally effective. Print, sign by hand, and keep the executed original.",
    },
    available: true,
  },
  digital_certificate: {
    label: { ne: "विद्युतीय हस्ताक्षर", en: "Digital signature" },
    effect: {
      ne: "विद्युतीय कारोबार ऐन, २०६३ बमोजिम प्रमाणीकरण नियन्त्रकको कार्यालयबाट इजाजतप्राप्त निकायले जारी गरेको प्रमाणपत्र आवश्यक पर्दछ।",
      en: "Requires a certificate from an authority licensed by the Office of the Controller of Certification, as the Electronic Transactions Act, 2063 requires.",
    },
    available: false,
  },
} as const satisfies Record<string, { label: Bilingual; effect: Bilingual; available: boolean }>;

/**
 * Why there is no "type your name to sign" control anywhere in this product.
 *
 * Surfaced in the UI rather than buried here, because a user who has used foreign
 * e-signature tools will otherwise assume the feature is missing by accident.
 */
export const NO_CLICKWRAP_NOTE: Bilingual = {
  ne: "नाम टाइप गरेर वा बटन थिचेर गरिने 'हस्ताक्षर' विद्युतीय कारोबार ऐन, २०६३ ले मान्यता दिँदैन। त्यसरी हस्ताक्षर गरिएको कागजात अदालतमा काम नलाग्न सक्दछ, त्यसैले हामी त्यस्तो सुविधा दिँदैनौं।",
  en: "Typing your name or clicking a button is not a signature the Electronic Transactions Act, 2063 recognises, and a document executed that way may fail when it matters. We do not offer it — that is a decision, not a missing feature.",
};
