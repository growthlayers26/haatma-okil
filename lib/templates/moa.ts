import type { Template } from "../types";
import { ACTS, COMPANY, cite, formatNpr, toNepaliDigits } from "../nepal";

const ne = toNepaliDigits;

const COMPANIES = {
  incorporation: cite(ACTS.companies, "दफा ४", "§4"),
  memorandum: cite(ACTS.companies, "दफा १८", "§18"),
  articles: cite(ACTS.companies, "दफा २०", "§20"),
  capital: cite(ACTS.companies, "दफा ११", "§11"),
  liability: cite(ACTS.companies, "दफा ७", "§7"),
} as const;

/**
 * Memorandum of Association for a private limited company, Companies Act 2063.
 *
 * The Office of the Company Registrar runs registration online through CAMIS, and the
 * portal is free. What founders actually get wrong is the drafting — objectives that
 * are too narrow to cover what the business will do, capital structures that have to
 * be amended a year later, and a name that fails clearance. That is what this sells.
 */
export const memorandumOfAssociation: Template = {
  slug: "company-moa",
  category: "business",
  priceNpr: 2_499,
  title: { ne: "प्रबन्धपत्र", en: "Memorandum of Association" },
  summary: {
    ne: "कम्पनी ऐन, २०६३ बमोजिम प्राइभेट लिमिटेड कम्पनीको प्रबन्धपत्र। कम्पनी रजिस्ट्रारको कार्यालयमा पेस गर्न मिल्ने ढाँचामा।",
    en: "Memorandum of Association for a private limited company under the Companies Act, 2063, in a form acceptable to the Office of the Company Registrar.",
  },
  governingAct: COMPANIES.memorandum,
  review: {
    name: { ne: "अधिवक्ता नियुक्ति बाँकी", en: "Advocate not yet assigned" },
    nbcLicence: null,
    reviewedOnBs: "2083-05-10",
    nextReviewBs: "2084-05-10",
  },
  execution: [
    {
      ne: "सबै संस्थापक शेयरधनीले प्रत्येक पृष्ठमा हस्ताक्षर गर्नुपर्नेछ।",
      en: "Every founding shareholder must sign each page.",
    },
    {
      ne: "नियमावली (AOA) सँगै पेस गर्नुपर्नेछ। प्रबन्धपत्र एक्लै पर्याप्त हुँदैन।",
      en: "Must be filed together with the Articles of Association. The memorandum alone is not sufficient.",
    },
    {
      ne: "नागरिकताको प्रतिलिपि र नाम स्वीकृतिको पत्र संलग्न गर्नुपर्नेछ।",
      en: "Attach citizenship copies for each shareholder and the approved name-reservation letter.",
    },
    {
      ne: "ocr.gov.np को CAMIS पोर्टलमार्फत पेस गरिन्छ। दर्ता दस्तुर सरकारी दरअनुसार छुट्टै लाग्नेछ।",
      en: "Filed through the CAMIS portal at ocr.gov.np. Government registration fees apply separately.",
    },
  ],

  steps: [
    {
      id: "company",
      title: { ne: "कम्पनीको विवरण", en: "Company details" },
      intro: {
        ne: "नाम कम्पनी रजिस्ट्रारबाट स्वीकृत भइसकेको हुनुपर्दछ।",
        en: "The name must already have been cleared by the Company Registrar.",
      },
      fields: [
        {
          id: "companyName",
          type: "text",
          required: true,
          label: { ne: "कम्पनीको नाम", en: "Company name" },
          placeholder: { ne: "जस्तै: हिमाल टेक प्रा.लि.", en: "e.g. Himal Tech Pvt. Ltd." },
          citation: COMPANIES.incorporation,
          help: {
            ne: "प्राइभेट कम्पनीको नामको अन्त्यमा 'प्राइभेट लिमिटेड' वा 'प्रा.लि.' हुनुपर्दछ।",
            en: "A private company's name must end with 'Private Limited' or 'Pvt. Ltd.'. Reserve it on CAMIS before filing. A rejected name means refiling everything.",
          },
        },
        {
          id: "registeredOffice",
          type: "textarea",
          required: true,
          label: { ne: "दर्ता कार्यालयको ठेगाना", en: "Registered office address" },
          help: {
            ne: "सरकारी पत्राचार यही ठेगानामा आउँछ।",
            en: "All official correspondence goes here. It must be a real address in Nepal.",
          },
        },
        { id: "wardNo", type: "text", required: true, label: { ne: "वडा नं.", en: "Ward number" } },
        { id: "district", type: "text", required: true, label: { ne: "जिल्ला", en: "District" } },
      ],
    },

    {
      id: "objectives",
      title: { ne: "उद्देश्य", en: "Objectives" },
      intro: {
        ne: "उद्देश्य साँघुरो भएमा भविष्यमा प्रबन्धपत्र संशोधन गर्नुपर्ने हुन्छ।",
        en: "Objectives that are too narrow force an amendment later. Draft for what the business will plausibly do, not only what it does on day one.",
      },
      fields: [
        {
          id: "primaryObjective",
          type: "textarea",
          required: true,
          label: { ne: "मुख्य उद्देश्य", en: "Primary objective" },
          placeholder: {
            ne: "जस्तै: सफ्टवेयर विकास तथा सूचना प्रविधि सम्बन्धी सेवा प्रदान गर्ने",
            en: "e.g. to develop software and provide information technology services",
          },
        },
        {
          id: "secondaryObjectives",
          type: "textarea",
          label: { ne: "अन्य उद्देश्य", en: "Other objectives" },
          help: {
            ne: "भविष्यमा गर्न सकिने कारोबार पनि यहाँ समावेश गर्नु उपयुक्त हुन्छ।",
            en: "Include activities the company may reasonably move into. Adding them now is free; amending later is not.",
          },
        },
      ],
    },

    {
      id: "capital",
      title: { ne: "पुँजी संरचना", en: "Capital structure" },
      fields: [
        {
          id: "authorisedCapitalNpr",
          type: "currency",
          required: true,
          label: { ne: "अधिकृत पुँजी (रु.)", en: "Authorised capital (NPR)" },
          citation: COMPANIES.capital,
          help: {
            ne: `प्राइभेट कम्पनीको न्यूनतम चुक्ता पुँजी ${formatNpr(COMPANY.minPaidUpCapitalNpr, "ne")} हो।`,
            en: `The minimum paid-up capital for a private limited company is ${formatNpr(COMPANY.minPaidUpCapitalNpr)}. Authorised capital must be at least that.`,
          },
          rules: [
            {
              kind: "min",
              value: COMPANY.minPaidUpCapitalNpr,
              blocking: true,
              citation: COMPANIES.capital,
              message: {
                ne: `अधिकृत पुँजी कम्तीमा ${formatNpr(COMPANY.minPaidUpCapitalNpr, "ne")} हुनुपर्दछ।`,
                en: `Authorised capital must be at least ${formatNpr(COMPANY.minPaidUpCapitalNpr)}.`,
              },
            },
          ],
        },
        {
          id: "shareValueNpr",
          type: "currency",
          required: true,
          label: { ne: "प्रति शेयर अंकित मूल्य (रु.)", en: "Nominal value per share (NPR)" },
          placeholder: { ne: "१००", en: "100" },
        },
        {
          id: "shareholderCount",
          type: "number",
          required: true,
          label: { ne: "संस्थापक शेयरधनी संख्या", en: "Number of founding shareholders" },
          citation: COMPANIES.incorporation,
          help: {
            ne: `एक जना शेयरधनीले पनि प्राइभेट कम्पनी दर्ता गर्न सकिन्छ। बढीमा १०१ जनासम्म।`,
            en: "A single shareholder is enough. A one-person private company is valid under the Companies Act 2063. The ceiling is 101.",
          },
          rules: [
            {
              kind: "min",
              value: COMPANY.minShareholders,
              blocking: true,
              citation: COMPANIES.incorporation,
              message: {
                ne: "कम्तीमा एक जना शेयरधनी आवश्यक छ।",
                en: "At least one shareholder is required.",
              },
            },
            {
              kind: "max",
              value: 101,
              blocking: true,
              citation: COMPANIES.incorporation,
              message: {
                ne: "प्राइभेट कम्पनीमा १०१ जनाभन्दा बढी शेयरधनी हुन सक्दैनन्।",
                en: "A private company cannot have more than 101 shareholders.",
              },
            },
          ],
        },
      ],
    },

    {
      id: "subscribers",
      title: { ne: "संस्थापक", en: "Founding shareholders" },
      fields: [
        {
          id: "subscriberDetails",
          type: "textarea",
          required: true,
          label: { ne: "संस्थापकको नाम, ठेगाना र शेयर संख्या", en: "Name, address and shareholding of each founder" },
          placeholder: {
            ne: "जस्तै: सीता श्रेष्ठ, ललितपुर वडा नं. ५, ६०० कित्ता",
            en: "e.g. Sita Shrestha, Lalitpur Ward 5, 600 shares",
          },
          help: {
            ne: "प्रत्येक संस्थापकको नागरिकता नम्बर पनि खुलाउनुहोस्।",
            en: "Include each founder's citizenship number. OCR will ask for it and the attached copies must match.",
          },
        },
      ],
    },
  ],

  clauses: [
    {
      id: "name",
      heading: { ne: "कम्पनीको नाम", en: "Name of the company" },
      locked: true,
      citation: COMPANIES.incorporation,
      body: {
        ne: `कम्पनीको नाम "{{companyName}}" रहनेछ।`,
        en: `The name of the company is "{{companyName}}".`,
      },
    },
    {
      id: "office",
      heading: { ne: "दर्ता कार्यालय", en: "Registered office" },
      body: {
        ne: `कम्पनीको दर्ता कार्यालय {{registeredOffice}}, वडा नं. {{wardNo}}, {{district}} जिल्लामा रहनेछ।`,
        en: `The registered office of the company is situated at {{registeredOffice}}, Ward No. {{wardNo}}, {{district}} District, Nepal.`,
      },
    },
    {
      id: "objectives",
      heading: { ne: "कम्पनीको उद्देश्य", en: "Objectives of the company" },
      citation: COMPANIES.memorandum,
      body: {
        ne: `कम्पनीको मुख्य उद्देश्य {{primaryObjective}} रहनेछ।`,
        en: `The principal objective of the company is {{primaryObjective}}.`,
      },
    },
    {
      id: "objectives-secondary",
      heading: { ne: "अन्य उद्देश्य", en: "Ancillary objectives" },
      when: { field: "secondaryObjectives", op: "truthy" },
      body: {
        ne: `माथिको उद्देश्यका अतिरिक्त कम्पनीले देहायका कारोबार समेत गर्न सक्नेछ: {{secondaryObjectives}}।`,
        en: `In addition to the principal objective, the company may carry on the following: {{secondaryObjectives}}.`,
      },
    },
    {
      id: "liability",
      heading: { ne: "दायित्व", en: "Liability" },
      locked: true,
      citation: COMPANIES.liability,
      body: {
        ne: `शेयरधनीहरूको दायित्व निजहरूले लिएको शेयरको अंकित मूल्यमा नबुझाएको रकमसम्म मात्र सीमित रहनेछ।`,
        en: `The liability of the shareholders is limited to the amount, if any, unpaid on the shares held by them.`,
      },
    },
    {
      id: "capital",
      heading: { ne: "पुँजी", en: "Capital" },
      citation: COMPANIES.capital,
      body: {
        ne: `कम्पनीको अधिकृत पुँजी रु. {{authorisedCapitalNpr}} रहनेछ, जुन प्रति कित्ता रु. {{shareValueNpr}} का दरले साधारण शेयरमा विभाजित छ।`,
        en: `The authorised capital of the company is NPR {{authorisedCapitalNpr}}, divided into ordinary shares of NPR {{shareValueNpr}} each.`,
      },
    },
    {
      id: "shareholders",
      heading: { ne: "संस्थापक शेयरधनी", en: "Founding shareholders" },
      body: {
        ne: `देहायका {{shareholderCount}} जना संस्थापकले यस प्रबन्धपत्रमा सहमति जनाई शेयर लिन मञ्जुर गरेका छन्:\n\n{{subscriberDetails}}`,
        en: `The following {{shareholderCount}} founders subscribe to this memorandum and agree to take the shares set against their names:\n\n{{subscriberDetails}}`,
      },
    },
    {
      id: "private",
      heading: { ne: "प्राइभेट कम्पनीको विशेषता", en: "Private company restrictions" },
      locked: true,
      citation: COMPANIES.incorporation,
      body: {
        ne: `यो प्राइभेट कम्पनी हो। कम्पनीले सर्वसाधारणलाई शेयर वा ऋणपत्र बिक्री गर्न पाउने छैन र शेयरधनीको संख्या एक सय एक जनाभन्दा बढी हुने छैन। शेयर हस्तान्तरणमा नियमावलीबमोजिम बन्देज लाग्नेछ।`,
        en: `The company is a private company. It shall not offer its shares or debentures to the public, the number of shareholders shall not exceed one hundred and one, and the transfer of shares is restricted in accordance with the Articles of Association.`,
      },
    },
    {
      id: "governing",
      heading: { ne: "प्रचलित कानुन", en: "Governing law" },
      locked: true,
      citation: COMPANIES.incorporation,
      body: {
        ne: `यो प्रबन्धपत्र कम्पनी ऐन, २०६३ र सो अन्तर्गत बनेका नियमबमोजिम तयार गरिएको हो। ऐनसँग बाझिएका कुनै व्यवस्था सो हदसम्म अमान्य हुनेछन्।`,
        en: `This memorandum is made under the Companies Act, 2063 and the rules framed thereunder. Any provision inconsistent with the Act is void to the extent of the inconsistency.`,
      },
    },
  ],
};

/** Post-registration steps founders most often miss. Shown after the MOA is generated. */
export const POST_REGISTRATION_CHAIN = [
  {
    step: 1,
    label: { ne: "स्थायी लेखा नम्बर (PAN)", en: "Permanent Account Number (PAN)" },
    detail: {
      ne: "आन्तरिक राजस्व कार्यालयमा दर्ता। कारोबार सुरु गर्नुअघि अनिवार्य।",
      en: "Register at the Inland Revenue Office. Required before trading.",
    },
  },
  {
    step: 2,
    label: { ne: "मूल्य अभिवृद्धि कर (VAT)", en: "VAT registration" },
    detail: {
      ne: "तोकिएको कारोबार सीमा नाघेमा वा तोकिएका व्यवसायका हकमा अनिवार्य।",
      en: "Mandatory above the prescribed turnover threshold, and for certain business types regardless of turnover.",
    },
  },
  {
    step: 3,
    label: { ne: "स्थानीय तह दर्ता", en: "Ward / local body registration" },
    detail: {
      ne: "कम्पनी रहेको वडा कार्यालयमा व्यवसाय दर्ता।",
      en: "Register the business with the ward office where the company sits.",
    },
  },
  {
    step: 4,
    label: { ne: "क्षेत्रगत इजाजत", en: "Sectoral licence" },
    detail: {
      ne: "बैंकिङ, शिक्षा, स्वास्थ्य, पर्यटन जस्ता क्षेत्रमा छुट्टै इजाजत आवश्यक पर्दछ।",
      en: "Banking, education, health, tourism and similar sectors need a separate regulator licence.",
    },
  },
  {
    step: 5,
    label: { ne: "सामाजिक सुरक्षा कोष", en: "Social Security Fund" },
    detail: {
      ne: "कर्मचारी राखेपछि रोजगारदाताको रूपमा दर्ता गर्नुपर्नेछ।",
      en: "Register as an employer once you take on staff.",
    },
  },
] as const;

export const OCR_FACTS = {
  portal: "ocr.gov.np",
  system: "CAMIS",
  minPaidUpNpr: COMPANY.minPaidUpCapitalNpr,
  registrationFeeNpr: COMPANY.registrationFeeNpr,
  minShareholders: COMPANY.minShareholders,
  nameReservationDays: { ne: `१–३ दिन`, en: "1–3 days" },
  digits: ne,
};
