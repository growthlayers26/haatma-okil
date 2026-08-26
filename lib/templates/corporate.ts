import type { Template } from "../types";
import { ARTICLES, SHARE_TRANSFER, BOARD, CONTRACT, COMPANY, formatNpr } from "../nepal";
import {
  pendingReview,
  nameField,
  citizenshipField,
  addressField,
  bsDateField,
  moneyField,
  governingLawClause,
  EXECUTION,
} from "./common";

/* ------------------------------------------------------------------ share transfer */

/**
 * Share transfer deed.
 *
 * A private company's shares are not freely transferable — the articles restrict
 * them, which is what makes it private. A transfer executed without board approval
 * and without honouring pre-emption rights is the usual way a small Nepali company
 * ends up with a shareholder nobody agreed to.
 */
export const shareTransferDeed: Template = {
  slug: "share-transfer-deed",
  category: "business",
  priceNpr: 599,
  title: { ne: "शेयर हस्तान्तरण लिखत", en: "Share Transfer Deed" },
  summary: {
    ne: "कम्पनी ऐन, २०६३ बमोजिम शेयर हस्तान्तरण गर्ने लिखत। सञ्चालक समितिको स्वीकृति र अग्राधिकारसम्बन्धी व्यवस्था समावेश।",
    en: "Deed transferring shares under the Companies Act, 2063. Covers board approval and pre-emption rights.",
  },
  governingAct: SHARE_TRANSFER,
  review: pendingReview(),
  execution: [
    EXECUTION.bothSign,
    {
      ne: "हस्तान्तरण सञ्चालक समितिबाट स्वीकृत भई कम्पनीको शेयरधनी दर्ता किताबमा चढेपछि मात्र पूरा हुन्छ।",
      en: "The transfer is complete only when approved by the board and entered in the company's register of shareholders.",
    },
    {
      ne: "कम्पनी रजिस्ट्रारको कार्यालयमा शेयरधनी विवरण अद्यावधिक गराउनुपर्नेछ।",
      en: "The shareholder particulars must be updated at the Office of the Company Registrar.",
    },
  ],
  steps: [
    {
      id: "company",
      title: { ne: "कम्पनीको विवरण", en: "The company" },
      fields: [
        nameField("companyName", { ne: "कम्पनीको नाम", en: "Company name" }),
        nameField("companyRegNo", { ne: "कम्पनी दर्ता नं.", en: "Company registration no." }),
        bsDateField("transferDateBs", { ne: "हस्तान्तरण मिति (वि.सं.)", en: "Transfer date (BS)" }),
      ],
    },
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("transferorName", { ne: "हस्तान्तरण गर्नेको नाम", en: "Transferor name" }),
        citizenshipField("transferorCitizenshipNo", {
          ne: "हस्तान्तरण गर्नेको नागरिकता नं.",
          en: "Transferor citizenship no.",
        }),
        addressField("transferorAddress", { ne: "हस्तान्तरण गर्नेको ठेगाना", en: "Transferor address" }),
        nameField("transfereeName", { ne: "हस्तान्तरण पाउनेको नाम", en: "Transferee name" }),
        citizenshipField("transfereeCitizenshipNo", {
          ne: "हस्तान्तरण पाउनेको नागरिकता नं.",
          en: "Transferee citizenship no.",
        }),
        addressField("transfereeAddress", { ne: "हस्तान्तरण पाउनेको ठेगाना", en: "Transferee address" }),
      ],
    },
    {
      id: "shares",
      title: { ne: "शेयरको विवरण", en: "The shares" },
      fields: [
        {
          id: "shareCount",
          type: "number",
          required: true,
          label: { ne: "हस्तान्तरण हुने शेयर संख्या (कित्ता)", en: "Number of shares transferred" },
        },
        moneyField("shareValueNpr", { ne: "प्रति शेयर अंकित मूल्य (रु.)", en: "Nominal value per share (NPR)" }),
        moneyField("considerationNpr", { ne: "कुल कारोबार रकम (रु.)", en: "Total consideration (NPR)" }),
        {
          id: "boardApproved",
          type: "select",
          required: true,
          label: { ne: "सञ्चालक समितिबाट स्वीकृत भएको?", en: "Has the board approved the transfer?" },
          citation: SHARE_TRANSFER,
          help: {
            ne: "स्वीकृति नलिई गरिएको हस्तान्तरण कम्पनीले मान्यता नदिन सक्दछ।",
            en: "A transfer made without board approval may be refused registration by the company, leaving the buyer with nothing.",
          },
          options: [
            { value: "yes", label: { ne: "स्वीकृत भएको", en: "Approved" } },
            { value: "pending", label: { ne: "स्वीकृति लिन बाँकी", en: "Approval still to be obtained" } },
          ],
        },
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "लिखतको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: SHARE_TRANSFER,
      body: {
        ne: `यो शेयर हस्तान्तरण लिखत {{transferDateBs}} मा {{transferorName}} (नागरिकता नं. {{transferorCitizenshipNo}}), ठेगाना {{transferorAddress}} (यसपछि "हस्तान्तरणकर्ता" भनिने) र {{transfereeName}} (नागरिकता नं. {{transfereeCitizenshipNo}}), ठेगाना {{transfereeAddress}} (यसपछि "प्राप्तकर्ता" भनिने) बीच सम्पन्न भएको छ।`,
        en: `This Share Transfer Deed is made on {{transferDateBs}} between {{transferorName}} (citizenship no. {{transferorCitizenshipNo}}), of {{transferorAddress}} (the "Transferor") and {{transfereeName}} (citizenship no. {{transfereeCitizenshipNo}}), of {{transfereeAddress}} (the "Transferee").`,
      },
    },
    {
      id: "transfer",
      heading: { ne: "हस्तान्तरण", en: "The transfer" },
      citation: SHARE_TRANSFER,
      body: {
        ne: `हस्तान्तरणकर्ताले {{companyName}} (दर्ता नं. {{companyRegNo}}) मा आफूले धारण गरेको प्रति कित्ता रु. {{shareValueNpr}} अंकित मूल्यको {{shareCount}} कित्ता शेयर रु. {{considerationNpr}} मा प्राप्तकर्तालाई हस्तान्तरण गरेको छ।`,
        en: `The Transferor transfers to the Transferee {{shareCount}} shares of nominal value NPR {{shareValueNpr}} each held by the Transferor in {{companyName}} (registration no. {{companyRegNo}}), for consideration of NPR {{considerationNpr}}.`,
      },
    },
    {
      id: "warranty",
      heading: { ne: "हस्तान्तरणकर्ताको प्रत्याभूति", en: "Transferor's warranty" },
      locked: true,
      body: {
        ne: `हस्तान्तरणकर्ताले उक्त शेयर आफ्नो पूर्ण स्वामित्वमा रहेको, कुनै धितो, बन्धक वा दाबीबाट मुक्त रहेको र हस्तान्तरण गर्न कानुनी अधिकार रहेको प्रत्याभूति दिन्छ।`,
        en: `The Transferor warrants that the shares are legally and beneficially owned by them, are free of any pledge, charge or claim, and that they have full authority to transfer them.`,
      },
    },
    {
      id: "board-approved",
      heading: { ne: "सञ्चालक समितिको स्वीकृति", en: "Board approval" },
      when: { field: "boardApproved", op: "eq", value: "yes" },
      citation: SHARE_TRANSFER,
      body: {
        ne: `यो हस्तान्तरण कम्पनीको सञ्चालक समितिबाट स्वीकृत भइसकेको छ र कम्पनीको शेयरधनी दर्ता किताबमा प्राप्तकर्ताको नाम चढाइनेछ।`,
        en: `This transfer has been approved by the board of the company, and the Transferee's name shall be entered in the company's register of shareholders.`,
      },
    },
    {
      id: "board-pending",
      heading: { ne: "स्वीकृति बाँकी", en: "Approval outstanding" },
      when: { field: "boardApproved", op: "eq", value: "pending" },
      locked: true,
      citation: SHARE_TRANSFER,
      body: {
        ne: `यो हस्तान्तरण सञ्चालक समितिको स्वीकृतिमा भर पर्नेछ। स्वीकृति नभएसम्म प्राप्तकर्ता शेयरधनीका रूपमा दर्ता हुने छैन र शेयरधनीको अधिकार प्रयोग गर्न पाउने छैन। स्वीकृति नभएमा कारोबार रकम फिर्ता गर्नुपर्नेछ।`,
        en: `This transfer is conditional on approval by the board. Until approval is given, the Transferee will not be registered as a shareholder and cannot exercise shareholder rights. If approval is refused, the consideration must be returned.`,
      },
    },
    {
      id: "preemption",
      heading: { ne: "अग्राधिकार", en: "Pre-emption" },
      locked: true,
      citation: ARTICLES,
      body: {
        ne: `कम्पनीको नियमावलीमा विद्यमान शेयरधनीलाई अग्राधिकार दिने व्यवस्था भएमा सो प्रक्रिया पूरा भएको हुनुपर्नेछ। सो प्रक्रिया पूरा नगरी गरिएको हस्तान्तरण बदर हुन सक्दछ।`,
        en: `Where the company's articles confer pre-emption rights on existing shareholders, that process must have been completed. A transfer made without it may be set aside.`,
      },
    },
    governingLawClause(SHARE_TRANSFER),
  ],
};

/* ------------------------------------------------------------------ board resolution */

/** Board resolution — the record a bank, registrar or counterparty asks for. */
export const boardResolution: Template = {
  slug: "board-resolution",
  category: "business",
  priceNpr: 299,
  title: { ne: "सञ्चालक समितिको निर्णय", en: "Board Resolution" },
  summary: {
    ne: "कम्पनीको सञ्चालक समितिले गरेको निर्णयको औपचारिक अभिलेख। बैंक, रजिस्ट्रार र कारोबारी पक्षले माग्ने कागजात।",
    en: "Formal record of a decision by the company's board. The document banks, the registrar and counterparties ask for.",
  },
  governingAct: BOARD,
  review: pendingReview(),
  execution: [
    {
      ne: "उपस्थित सबै सञ्चालकले हस्ताक्षर गर्नुपर्नेछ र निर्णय कम्पनीको माइन्युट किताबमा चढाउनुपर्नेछ।",
      en: "All directors present must sign, and the resolution must be entered in the company's minute book.",
    },
    {
      ne: "गणपूरक संख्या नपुगेको बैठकको निर्णय अमान्य हुन्छ।",
      en: "A resolution passed without a quorum is invalid.",
    },
  ],
  steps: [
    {
      id: "meeting",
      title: { ne: "बैठकको विवरण", en: "The meeting" },
      fields: [
        nameField("companyName", { ne: "कम्पनीको नाम", en: "Company name" }),
        nameField("companyRegNo", { ne: "कम्पनी दर्ता नं.", en: "Company registration no." }),
        bsDateField("meetingDateBs", { ne: "बैठक मिति (वि.सं.)", en: "Date of meeting (BS)" }),
        addressField("meetingVenue", { ne: "बैठक स्थल", en: "Venue" }),
        {
          id: "meetingNumber",
          type: "text",
          required: true,
          label: { ne: "बैठक संख्या", en: "Meeting number" },
          placeholder: { ne: "जस्तै: १२औं", en: "e.g. 12th" },
        },
      ],
    },
    {
      id: "attendance",
      title: { ne: "उपस्थिति", en: "Attendance" },
      fields: [
        nameField("chairName", { ne: "अध्यक्षता गर्नेको नाम", en: "Name of the chair" }),
        {
          id: "directorsPresent",
          type: "textarea",
          required: true,
          label: { ne: "उपस्थित सञ्चालकहरू", en: "Directors present" },
          help: {
            ne: "प्रत्येक सञ्चालकको नाम छुट्टै लाइनमा लेख्नुहोस्।",
            en: "List each director on a separate line.",
          },
        },
        {
          id: "totalDirectors",
          type: "number",
          required: true,
          label: { ne: "कुल सञ्चालक संख्या", en: "Total number of directors" },
        },
      ],
    },
    {
      id: "resolution",
      title: { ne: "निर्णय", en: "The resolution" },
      fields: [
        {
          id: "agenda",
          type: "textarea",
          required: true,
          label: { ne: "छलफलको विषय", en: "Matter considered" },
        },
        {
          id: "resolutionText",
          type: "textarea",
          required: true,
          label: { ne: "पारित निर्णय", en: "Resolution passed" },
          help: {
            ne: "निर्णय स्पष्ट र कार्यान्वयनयोग्य भाषामा लेख्नुहोस्। बैंकले यसैको आधारमा काम गर्दछ।",
            en: "Write the resolution in clear, actionable terms — a bank will act on this wording alone.",
          },
        },
        nameField("authorisedPerson", {
          ne: "कार्यान्वयन गर्न अधिकार दिइएको व्यक्ति",
          en: "Person authorised to act",
        }, false),
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "बैठकको विवरण", en: "Record of meeting" },
      locked: true,
      citation: BOARD,
      body: {
        ne: `{{companyName}} (दर्ता नं. {{companyRegNo}}) को सञ्चालक समितिको {{meetingNumber}} बैठक {{meetingDateBs}} मा {{meetingVenue}} मा बसेको थियो। बैठकको अध्यक्षता {{chairName}}ले गर्नुभएको थियो।`,
        en: `The {{meetingNumber}} meeting of the board of directors of {{companyName}} (registration no. {{companyRegNo}}) was held on {{meetingDateBs}} at {{meetingVenue}}, chaired by {{chairName}}.`,
      },
    },
    {
      id: "quorum",
      heading: { ne: "उपस्थिति तथा गणपूरक संख्या", en: "Attendance and quorum" },
      citation: BOARD,
      body: {
        ne: `कुल {{totalDirectors}} जना सञ्चालकमध्ये देहायका सञ्चालक उपस्थित हुनुहुन्थ्यो:\n\n{{directorsPresent}}\n\nगणपूरक संख्या पुगेको हुँदा बैठक प्रारम्भ भयो।`,
        en: `Of {{totalDirectors}} directors in total, the following were present:\n\n{{directorsPresent}}\n\nA quorum being present, the meeting proceeded to business.`,
      },
    },
    {
      id: "agenda",
      heading: { ne: "छलफलको विषय", en: "Matter considered" },
      body: {
        ne: `बैठकमा देहायको विषयमा छलफल भयो: {{agenda}}`,
        en: `The board considered the following: {{agenda}}`,
      },
    },
    {
      id: "resolved",
      heading: { ne: "निर्णय", en: "Resolved" },
      body: {
        ne: `छलफलपश्चात् सर्वसम्मतिले देहायबमोजिम निर्णय गरियो:\n\n{{resolutionText}}`,
        en: `After discussion it was unanimously RESOLVED as follows:\n\n{{resolutionText}}`,
      },
    },
    {
      id: "authority",
      heading: { ne: "कार्यान्वयनको अधिकार", en: "Authority to act" },
      when: { field: "authorisedPerson", op: "truthy" },
      body: {
        ne: `माथिको निर्णय कार्यान्वयन गर्न आवश्यक कागजातमा हस्ताक्षर गर्ने तथा सम्बन्धित निकायसँग कारोबार गर्ने अधिकार {{authorisedPerson}}लाई प्रदान गरियो।`,
        en: `{{authorisedPerson}} is authorised to sign all documents and deal with all authorities necessary to give effect to this resolution.`,
      },
    },
    {
      id: "certification",
      heading: { ne: "प्रमाणीकरण", en: "Certification" },
      locked: true,
      body: {
        ne: `यो निर्णय कम्पनीको माइन्युट किताबमा चढाइएको सही प्रतिलिपि हो भनी प्रमाणित गरिन्छ।`,
        en: `Certified to be a true copy of the resolution entered in the company's minute book.`,
      },
    },
  ],
};

/* ------------------------------------------------------------------ articles */

/**
 * Articles of Association.
 *
 * Filed alongside the memorandum — the memorandum alone is not sufficient to
 * incorporate. Where the memorandum says what the company is, the articles say how
 * it is run, and it is the articles that decide whether a founder can be forced out.
 */
export const articlesOfAssociation: Template = {
  slug: "articles-of-association",
  category: "business",
  priceNpr: 2_499,
  title: { ne: "नियमावली", en: "Articles of Association" },
  summary: {
    ne: "कम्पनी ऐन, २०६३ बमोजिम प्राइभेट कम्पनीको नियमावली। शेयर हस्तान्तरण, सञ्चालक समिति र साधारण सभाको व्यवस्था समावेश।",
    en: "Articles of Association for a private company under the Companies Act, 2063. Covers share transfer, the board, and general meetings.",
  },
  governingAct: ARTICLES,
  review: pendingReview(),
  execution: [
    {
      ne: "सबै संस्थापक शेयरधनीले प्रत्येक पृष्ठमा हस्ताक्षर गर्नुपर्नेछ।",
      en: "Every founding shareholder must sign each page.",
    },
    {
      ne: "प्रबन्धपत्रसँगै कम्पनी रजिस्ट्रारको कार्यालयमा पेस गर्नुपर्नेछ। नियमावली बिना दर्ता हुँदैन।",
      en: "Must be filed with the memorandum at the Office of the Company Registrar. Registration cannot proceed without it.",
    },
  ],
  steps: [
    {
      id: "company",
      title: { ne: "कम्पनीको विवरण", en: "The company" },
      fields: [
        nameField("companyName", { ne: "कम्पनीको नाम", en: "Company name" }),
        moneyField("authorisedCapitalNpr", { ne: "अधिकृत पुँजी (रु.)", en: "Authorised capital (NPR)" }, {
          ne: `प्राइभेट कम्पनीको न्यूनतम चुक्ता पुँजी ${formatNpr(COMPANY.minPaidUpCapitalNpr, "ne")} हो।`,
          en: `Minimum paid-up capital for a private company is ${formatNpr(COMPANY.minPaidUpCapitalNpr)}.`,
        }),
        moneyField("shareValueNpr", { ne: "प्रति शेयर अंकित मूल्य (रु.)", en: "Nominal value per share (NPR)" }),
      ],
    },
    {
      id: "governance",
      title: { ne: "सञ्चालन व्यवस्था", en: "Governance" },
      fields: [
        {
          id: "directorCount",
          type: "number",
          required: true,
          label: { ne: "सञ्चालक संख्या", en: "Number of directors" },
          citation: BOARD,
        },
        {
          id: "boardQuorum",
          type: "number",
          required: true,
          label: { ne: "सञ्चालक बैठकको गणपूरक संख्या", en: "Board meeting quorum" },
          help: {
            ne: "गणपूरक संख्या नपुगेको बैठकको निर्णय अमान्य हुन्छ।",
            en: "A board decision taken without a quorum is invalid.",
          },
        },
        {
          id: "transferRestriction",
          type: "select",
          required: true,
          label: { ne: "शेयर हस्तान्तरणमा बन्देज", en: "Restriction on share transfer" },
          citation: SHARE_TRANSFER,
          help: {
            ne: "प्राइभेट कम्पनीमा शेयर हस्तान्तरणमा बन्देज हुनु अनिवार्य विशेषता हो।",
            en: "Restricting share transfer is a defining feature of a private company, not an optional extra.",
          },
          options: [
            {
              value: "preemption",
              label: { ne: "विद्यमान शेयरधनीलाई अग्राधिकार", en: "Pre-emption to existing shareholders" },
            },
            { value: "board", label: { ne: "सञ्चालक समितिको स्वीकृति", en: "Board approval required" } },
            { value: "both", label: { ne: "दुवै", en: "Both" } },
          ],
        },
      ],
    },
  ],
  clauses: [
    {
      id: "interpretation",
      heading: { ne: "नाम तथा व्याख्या", en: "Name and interpretation" },
      locked: true,
      citation: ARTICLES,
      body: {
        ne: `यो नियमावली "{{companyName}}" को हो। यसमा प्रयोग भएका शब्दको अर्थ कम्पनी ऐन, २०६३ मा दिइएबमोजिम हुनेछ।`,
        en: `These are the Articles of Association of "{{companyName}}". Words used have the meanings given to them in the Companies Act, 2063.`,
      },
    },
    {
      id: "capital",
      heading: { ne: "शेयर पुँजी", en: "Share capital" },
      body: {
        ne: `कम्पनीको अधिकृत पुँजी रु. {{authorisedCapitalNpr}} रहनेछ, जुन प्रति कित्ता रु. {{shareValueNpr}} का दरले साधारण शेयरमा विभाजित छ।`,
        en: `The authorised capital of the company is NPR {{authorisedCapitalNpr}}, divided into ordinary shares of NPR {{shareValueNpr}} each.`,
      },
    },
    {
      id: "transfer-preemption",
      heading: { ne: "शेयर हस्तान्तरणमा बन्देज", en: "Restriction on transfer of shares" },
      when: { field: "transferRestriction", op: "neq", value: "board" },
      citation: SHARE_TRANSFER,
      body: {
        ne: `कुनै शेयरधनीले शेयर बिक्री गर्न चाहेमा सर्वप्रथम विद्यमान शेयरधनीहरूलाई आफ्नो शेयर अनुपातमा किन्न प्रस्ताव गर्नुपर्नेछ। तीस दिनभित्र कुनै शेयरधनीले नकिनेमा मात्र बाह्य व्यक्तिलाई बिक्री गर्न सकिनेछ।`,
        en: `A shareholder wishing to sell shares must first offer them to the existing shareholders in proportion to their holdings. Only if no shareholder takes them up within thirty days may the shares be offered to an outsider.`,
      },
    },
    {
      id: "transfer-board",
      heading: { ne: "हस्तान्तरणमा सञ्चालक समितिको स्वीकृति", en: "Board approval of transfers" },
      when: { field: "transferRestriction", op: "neq", value: "preemption" },
      citation: SHARE_TRANSFER,
      body: {
        ne: `कुनै पनि शेयर हस्तान्तरण सञ्चालक समितिको स्वीकृति बिना कम्पनीको शेयरधनी दर्ता किताबमा चढाइने छैन।`,
        en: `No transfer of shares shall be entered in the company's register of shareholders without the approval of the board.`,
      },
    },
    {
      id: "board",
      heading: { ne: "सञ्चालक समिति", en: "The board of directors" },
      citation: BOARD,
      body: {
        ne: `कम्पनीको सञ्चालक समितिमा {{directorCount}} जना सञ्चालक रहनेछन्। सञ्चालक समितिको बैठकको गणपूरक संख्या {{boardQuorum}} जना हुनेछ। गणपूरक संख्या नपुगी गरिएको निर्णय अमान्य हुनेछ।`,
        en: `The board shall consist of {{directorCount}} directors. The quorum for a board meeting is {{boardQuorum}} directors. A decision taken without a quorum is invalid.`,
      },
    },
    {
      id: "general-meeting",
      heading: { ne: "साधारण सभा", en: "General meetings" },
      locked: true,
      body: {
        ne: `कम्पनीले प्रत्येक आर्थिक वर्ष समाप्त भएको छ महिनाभित्र वार्षिक साधारण सभा बोलाउनुपर्नेछ। सभाको सूचना कम्तीमा एक्काइस दिनअगावै दिनुपर्नेछ।`,
        en: `The company shall hold an annual general meeting within six months of the end of each financial year. Notice of at least twenty-one days must be given.`,
      },
    },
    {
      id: "dividend",
      heading: { ne: "लाभांश", en: "Dividends" },
      locked: true,
      body: {
        ne: `लाभांश साधारण सभाबाट स्वीकृत भएपछि मात्र वितरण गरिनेछ र शेयरधनीहरूलाई निजहरूले धारण गरेको शेयरको अनुपातमा वितरण गरिनेछ।`,
        en: `Dividends shall be distributed only after approval by the general meeting, and shall be paid to shareholders in proportion to the shares held by them.`,
      },
    },
    {
      id: "private",
      heading: { ne: "प्राइभेट कम्पनीको विशेषता", en: "Private company restrictions" },
      locked: true,
      citation: ARTICLES,
      body: {
        ne: `कम्पनीले सर्वसाधारणलाई शेयर वा ऋणपत्र बिक्री गर्न पाउने छैन र शेयरधनीको संख्या एक सय एक जनाभन्दा बढी हुने छैन।`,
        en: `The company shall not offer its shares or debentures to the public, and the number of shareholders shall not exceed one hundred and one.`,
      },
    },
    governingLawClause(ARTICLES),
  ],
};

/* ------------------------------------------------------------------ founders */

/**
 * Founders' agreement.
 *
 * Sits alongside the articles and covers what the articles do not: vesting, what
 * happens when a founder leaves, and who decides when founders deadlock. The single
 * most valuable document an early Nepali startup does not have.
 */
export const foundersAgreement: Template = {
  slug: "founders-agreement",
  category: "business",
  priceNpr: 1_499,
  title: { ne: "संस्थापक सम्झौता", en: "Founders' Agreement" },
  summary: {
    ne: "संस्थापकहरूबीचको सम्झौता। शेयर बाँडफाँट, भेस्टिङ, बाहिरिने प्रक्रिया र निर्णयमा गतिरोध समाधान समावेश।",
    en: "Agreement between founders covering equity split, vesting, what happens when a founder leaves, and deadlock.",
  },
  governingAct: CONTRACT,
  review: pendingReview(),
  execution: [
    EXECUTION.bothSign,
    {
      ne: "यो सम्झौता कम्पनीको नियमावलीसँग बाझिएमा नियमावली नै लागू हुन्छ। दुवै एकैसाथ तयार गर्नु उपयुक्त हुन्छ।",
      en: "Where this agreement conflicts with the company's articles, the articles prevail. Draft both together.",
    },
  ],
  steps: [
    {
      id: "company",
      title: { ne: "कम्पनी तथा संस्थापक", en: "Company and founders" },
      fields: [
        nameField("companyName", { ne: "कम्पनीको नाम", en: "Company name" }),
        bsDateField("agreementDateBs", { ne: "सम्झौता मिति (वि.सं.)", en: "Date of agreement (BS)" }),
        {
          id: "founderDetails",
          type: "textarea",
          required: true,
          label: { ne: "संस्थापकको नाम र शेयर प्रतिशत", en: "Founders and equity split" },
          placeholder: {
            ne: "जस्तै: सीता श्रेष्ठ — ६०%\nराम थापा — ४०%",
            en: "e.g. Sita Shrestha — 60%\nRam Thapa — 40%",
          },
        },
        {
          id: "roles",
          type: "textarea",
          required: true,
          label: { ne: "प्रत्येक संस्थापकको भूमिका", en: "Role of each founder" },
        },
      ],
    },
    {
      id: "vesting",
      title: { ne: "भेस्टिङ", en: "Vesting" },
      intro: {
        ne: "भेस्टिङ नभएमा सुरुमै छाडेर जाने संस्थापकले पनि पूरा शेयर लिएर जान्छ।",
        en: "Without vesting, a founder who leaves in month three keeps their full stake — which is how early companies become unfundable.",
      },
      fields: [
        {
          id: "vestingYears",
          type: "number",
          required: true,
          label: { ne: "भेस्टिङ अवधि (वर्ष)", en: "Vesting period (years)" },
          placeholder: { ne: "४", en: "4" },
        },
        {
          id: "cliffMonths",
          type: "number",
          required: true,
          label: { ne: "क्लिफ अवधि (महिना)", en: "Cliff (months)" },
          help: {
            ne: "क्लिफ अवधि नपुग्दै छाडेमा कुनै शेयर भेस्ट हुँदैन।",
            en: "A founder leaving before the cliff vests nothing at all.",
          },
        },
        {
          id: "deadlockResolution",
          type: "select",
          required: true,
          label: { ne: "गतिरोध भएमा", en: "If founders deadlock" },
          options: [
            { value: "chair", label: { ne: "अध्यक्षको निर्णायक मत", en: "Chair has a casting vote" } },
            { value: "mediation", label: { ne: "मध्यस्थता", en: "Mediation" } },
            { value: "buyout", label: { ne: "एकले अर्कोको शेयर किन्ने", en: "One founder buys the other out" } },
          ],
        },
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "सम्झौताको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: CONTRACT,
      body: {
        ne: `यो संस्थापक सम्झौता {{agreementDateBs}} मा {{companyName}} का संस्थापकहरूबीच सम्पन्न भएको छ।`,
        en: `This Founders' Agreement is made on {{agreementDateBs}} between the founders of {{companyName}}.`,
      },
    },
    {
      id: "equity",
      heading: { ne: "शेयर बाँडफाँट", en: "Equity split" },
      body: {
        ne: `संस्थापकहरूबीच शेयर देहायबमोजिम बाँडफाँट हुनेछ:\n\n{{founderDetails}}`,
        en: `Equity in the company is held between the founders as follows:\n\n{{founderDetails}}`,
      },
    },
    {
      id: "roles",
      heading: { ne: "भूमिका तथा जिम्मेवारी", en: "Roles and responsibilities" },
      body: {
        ne: `प्रत्येक संस्थापकको भूमिका देहायबमोजिम रहनेछ:\n\n{{roles}}`,
        en: `Each founder's role is as follows:\n\n{{roles}}`,
      },
    },
    {
      id: "vesting",
      heading: { ne: "भेस्टिङ", en: "Vesting" },
      body: {
        ne: `प्रत्येक संस्थापकको शेयर {{vestingYears}} वर्षको अवधिमा क्रमशः भेस्ट हुनेछ। पहिलो {{cliffMonths}} महिनाको क्लिफ अवधि पूरा नगरी कम्पनी छाडेमा कुनै पनि शेयर भेस्ट हुने छैन र सो शेयर कम्पनीमा फिर्ता हुनेछ।`,
        en: `Each founder's shares vest progressively over {{vestingYears}} years. A founder who leaves before completing the {{cliffMonths}}-month cliff vests no shares at all, and those shares return to the company.`,
      },
    },
    {
      id: "leaver",
      heading: { ne: "संस्थापक बाहिरिएमा", en: "Departing founders" },
      locked: true,
      body: {
        ne: `कुनै संस्थापक कम्पनीबाट बाहिरिएमा भेस्ट नभएको शेयर कम्पनीमा फिर्ता हुनेछ। भेस्ट भइसकेको शेयर निजकै रहनेछ, तर नियमावलीको हस्तान्तरण बन्देज लागू हुनेछ।`,
        en: `If a founder leaves, their unvested shares return to the company. Vested shares remain theirs, subject to the transfer restrictions in the articles.`,
      },
    },
    {
      id: "ip",
      heading: { ne: "बौद्धिक सम्पत्ति", en: "Intellectual property" },
      locked: true,
      body: {
        ne: `संस्थापकहरूले कम्पनीको कामको सिलसिलामा सिर्जना गरेको सम्पूर्ण बौद्धिक सम्पत्ति कम्पनीको स्वामित्वमा रहनेछ।`,
        en: `All intellectual property created by a founder in the course of the company's business belongs to the company.`,
      },
    },
    {
      id: "deadlock-chair",
      heading: { ne: "गतिरोध समाधान", en: "Deadlock" },
      when: { field: "deadlockResolution", op: "eq", value: "chair" },
      body: {
        ne: `सञ्चालक समितिमा मत बराबर भएमा अध्यक्षको निर्णायक मत रहनेछ।`,
        en: `Where the board is equally divided, the chair has a casting vote.`,
      },
    },
    {
      id: "deadlock-mediation",
      heading: { ne: "गतिरोध समाधान", en: "Deadlock" },
      when: { field: "deadlockResolution", op: "eq", value: "mediation" },
      body: {
        ne: `संस्थापकहरूबीच निर्णयमा गतिरोध उत्पन्न भएमा दुवै पक्षले सहमति जनाएको मध्यस्थकर्ता मार्फत समाधान खोजिनेछ।`,
        en: `Where the founders reach deadlock, the matter shall be referred to a mediator agreed by both.`,
      },
    },
    {
      id: "deadlock-buyout",
      heading: { ne: "गतिरोध समाधान", en: "Deadlock" },
      when: { field: "deadlockResolution", op: "eq", value: "buyout" },
      body: {
        ne: `गतिरोध कायमै रहेमा एक संस्थापकले अर्को संस्थापकको शेयर उचित मूल्यमा किन्न प्रस्ताव गर्न सक्नेछ। प्रस्ताव पाउने संस्थापकले सोही मूल्यमा किन्ने वा बेच्ने छनौट गर्न पाउनेछन्।`,
        en: `If deadlock persists, either founder may offer to buy the other's shares at a stated price. The receiving founder may elect either to sell at that price or to buy at it.`,
      },
    },
    governingLawClause(CONTRACT),
  ],
};
