import type { Template } from "../types";
import { LOAN, CONTRACT } from "../nepal";

/**
 * Private loan agreement (ऋण सम्झौता) under the Muluki Civil Code, 2074.
 *
 * Informal lending between individuals is extremely common in Nepal and is where
 * most recoverable debt becomes unrecoverable — the money moves without a written
 * instrument. A witnessed written agreement is the whole product here.
 */
export const loanAgreement: Template = {
  slug: "loan-agreement",
  category: "business",
  priceNpr: 499,
  title: { ne: "ऋण सम्झौता", en: "Loan Agreement" },
  summary: {
    ne: "व्यक्ति वा व्यवसायबीच रकम सापटी दिने लिखित सम्झौता। ब्याजदर, भुक्तानी तालिका र धितो समावेश।",
    en: "Written agreement for a loan between individuals or businesses. Covers principal, interest, repayment schedule, security, and default.",
  },
  governingAct: LOAN,
  review: {
    name: { ne: "अधिवक्ता नियुक्ति बाँकी", en: "Advocate not yet assigned" },
    nbcLicence: null,
    reviewedOnBs: "2083-05-10",
    nextReviewBs: "2084-05-10",
  },
  execution: [
    {
      ne: "दुवै पक्ष र दुई जना साक्षीको हस्ताक्षर अनिवार्य छ। साक्षीको नागरिकता नम्बर र सम्पर्क विवरण खुलाउनुहोस्।",
      en: "Signatures of both parties and two witnesses are essential. Record each witness's citizenship number and contact details.",
    },
    {
      ne: "धितो राखिएको भए सम्बन्धित मालपोत कार्यालयमा दर्ता गर्नुपर्नेछ। यो कागजातले मात्र धितो सिर्जना गर्दैन।",
      en: "Where security is given, registration at the relevant Land Revenue Office is required. This document alone does not create a registered charge.",
    },
    {
      ne: "ठूलो रकमको कारोबार बैंकिङ प्रणालीमार्फत गर्नु प्रमाणका दृष्टिले बलियो हुन्छ।",
      en: "Disbursing a substantial sum through the banking system produces far stronger evidence than cash.",
    },
  ],

  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        { id: "lenderName", type: "text", required: true, label: { ne: "ऋणदाताको नाम", en: "Lender name" } },
        { id: "lenderCitizenshipNo", type: "text", required: true, label: { ne: "ऋणदाताको नागरिकता नं.", en: "Lender citizenship no." } },
        { id: "lenderAddress", type: "textarea", required: true, label: { ne: "ऋणदाताको ठेगाना", en: "Lender address" } },
        { id: "borrowerName", type: "text", required: true, label: { ne: "ऋणीको नाम", en: "Borrower name" } },
        { id: "borrowerCitizenshipNo", type: "text", required: true, label: { ne: "ऋणीको नागरिकता नं.", en: "Borrower citizenship no." } },
        { id: "borrowerAddress", type: "textarea", required: true, label: { ne: "ऋणीको ठेगाना", en: "Borrower address" } },
      ],
    },
    {
      id: "terms",
      title: { ne: "ऋणका सर्तहरू", en: "Loan terms" },
      intro: {
        ne: "साँवा, ब्याज र भुक्तानी तालिका स्पष्ट नभएको सम्झौता असुली गर्न कठिन हुन्छ।",
        en: "A loan without a clear principal, rate and schedule is the hardest kind of debt to recover.",
      },
      fields: [
        { id: "principalNpr", type: "currency", required: true, label: { ne: "साँवा रकम (रु.)", en: "Principal amount (NPR)" } },
        {
          id: "interestRate",
          type: "number",
          required: true,
          label: { ne: "वार्षिक ब्याजदर (%)", en: "Annual interest rate (%)" },
          citation: LOAN,
          help: {
            ne: "अत्यधिक ब्याजदर अदालतले घटाउन सक्दछ। बजार दरभन्दा उल्लेख्य बढी दर राख्नुअघि अधिवक्तासँग परामर्श गर्नुहोस्।",
            en: "A court may reduce an excessive rate. Take advice before setting a rate materially above prevailing market rates.",
          },
          rules: [
            {
              kind: "max",
              value: 36,
              blocking: false,
              citation: LOAN,
              message: {
                ne: "यो ब्याजदर असामान्य रूपमा उच्च छ र अदालतमा चुनौती दिन सकिन्छ।",
                en: "This rate is unusually high and is open to challenge as excessive.",
              },
            },
          ],
        },
        { id: "disbursementDateBs", type: "date-bs", required: true, label: { ne: "रकम दिएको मिति (वि.सं.)", en: "Disbursement date (BS)" }, placeholder: { ne: "२०८३-०५-१५", en: "2083-05-15" } },
        { id: "repaymentMonths", type: "number", required: true, label: { ne: "भुक्तानी अवधि (महिना)", en: "Repayment period (months)" } },
        {
          id: "repaymentMode",
          type: "select",
          required: true,
          label: { ne: "भुक्तानी तरिका", en: "Repayment mode" },
          options: [
            { value: "monthly", label: { ne: "मासिक किस्ता", en: "Monthly instalments" } },
            { value: "lump", label: { ne: "अवधि सकिएपछि एकमुष्ट", en: "Lump sum at end of term" } },
          ],
        },
      ],
    },
    {
      id: "security",
      title: { ne: "धितो", en: "Security" },
      fields: [
        {
          id: "hasSecurity",
          type: "select",
          required: true,
          label: { ne: "धितो राखिएको छ?", en: "Is security provided?" },
          options: [
            { value: "no", label: { ne: "छैन, विश्वासमा", en: "No, unsecured" } },
            { value: "yes", label: { ne: "छ", en: "Yes" } },
          ],
        },
        {
          id: "securityDescription",
          type: "textarea",
          label: { ne: "धितोको विवरण", en: "Description of security" },
          placeholder: {
            ne: "जस्तै: कि.नं. ००० को जग्गा, वडा नं. ०",
            en: "e.g. land parcel no. 000, Ward No. 0",
          },
          help: {
            ne: "जग्गा वा सम्पत्ति भए कित्ता नम्बर र क्षेत्रफल स्पष्ट खुलाउनुहोस्।",
            en: "For land or property, state the parcel number and area precisely.",
          },
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
        ne: `यो ऋण सम्झौता {{disbursementDateBs}} मा {{lenderName}} (नागरिकता नं. {{lenderCitizenshipNo}}), ठेगाना {{lenderAddress}} (यसपछि "ऋणदाता" भनिने) र {{borrowerName}} (नागरिकता नं. {{borrowerCitizenshipNo}}), ठेगाना {{borrowerAddress}} (यसपछि "ऋणी" भनिने) बीच मुलुकी देवानी संहिता, २०७४ बमोजिम सम्पन्न भएको छ।`,
        en: `This Loan Agreement is made on {{disbursementDateBs}} between {{lenderName}} (citizenship no. {{lenderCitizenshipNo}}), of {{lenderAddress}} (the "Lender") and {{borrowerName}} (citizenship no. {{borrowerCitizenshipNo}}), of {{borrowerAddress}} (the "Borrower"), pursuant to the Muluki Civil Code, 2074.`,
      },
    },
    {
      id: "principal",
      heading: { ne: "साँवा रकम", en: "Principal" },
      citation: LOAN,
      body: {
        ne: `ऋणदाताले ऋणीलाई रु. {{principalNpr}} सापटी दिन मञ्जुर गरेको छ र ऋणीले सो रकम बुझी लिएको स्वीकार गर्दछ।`,
        en: `The Lender agrees to lend the Borrower NPR {{principalNpr}}, and the Borrower acknowledges receipt of that sum.`,
      },
    },
    {
      id: "interest",
      heading: { ne: "ब्याज", en: "Interest" },
      body: {
        ne: `साँवा रकममा वार्षिक {{interestRate}} प्रतिशतका दरले ब्याज लाग्नेछ। ब्याज रकम दिएको मितिदेखि गणना गरिनेछ।`,
        en: `Interest accrues on the principal at {{interestRate}}% per annum, calculated from the date of disbursement.`,
      },
    },
    {
      id: "repayment-monthly",
      heading: { ne: "भुक्तानी तालिका", en: "Repayment schedule" },
      when: { field: "repaymentMode", op: "eq", value: "monthly" },
      body: {
        ne: `ऋणीले साँवा र ब्याज सहितको रकम {{repaymentMonths}} मासिक किस्तामा भुक्तानी गर्नेछ। प्रत्येक किस्ता सम्बन्धित नेपाली महिनाभित्र बुझाउनुपर्नेछ र ऋणदाताले लिखित रसिद दिनुपर्नेछ।`,
        en: `The Borrower shall repay principal together with interest in {{repaymentMonths}} monthly instalments. Each instalment falls due within the corresponding Nepali month, and the Lender shall issue a written receipt for each payment.`,
      },
    },
    {
      id: "repayment-lump",
      heading: { ne: "भुक्तानी तालिका", en: "Repayment schedule" },
      when: { field: "repaymentMode", op: "eq", value: "lump" },
      body: {
        ne: `ऋणीले रकम दिएको मितिले {{repaymentMonths}} महिनाभित्र साँवा र सम्पूर्ण ब्याज एकमुष्ट रूपमा भुक्तानी गर्नेछ।`,
        en: `The Borrower shall repay the principal together with all accrued interest as a single lump sum within {{repaymentMonths}} months of the date of disbursement.`,
      },
    },
    {
      id: "security",
      heading: { ne: "धितो", en: "Security" },
      when: { field: "hasSecurity", op: "eq", value: "yes" },
      body: {
        ne: `यो ऋणको सुरक्षणबापत ऋणीले देहायको सम्पत्ति धितो राखेको छ: {{securityDescription}}। ऋणीले तोकिएको समयमा भुक्तानी नगरेमा ऋणदाताले प्रचलित कानुनी प्रक्रियाबमोजिम धितो सम्पत्तिबाट असुली गर्न सक्नेछ।`,
        en: `As security for this loan the Borrower charges the following property: {{securityDescription}}. On default the Lender may recover from the secured property in accordance with the process required by prevailing law.`,
      },
    },
    {
      id: "default",
      heading: { ne: "भुक्तानीमा चूक", en: "Default" },
      body: {
        ne: `ऋणीले तोकिएको मितिमा भुक्तानी नगरेमा ऋणदाताले लिखित सूचना दिनेछ। सूचना पाएको ३५ दिनभित्र पनि भुक्तानी नभएमा ऋणदाताले सम्पूर्ण बाँकी रकम एकमुष्ट माग गर्न र प्रचलित कानुनबमोजिम असुलीका लागि अदालतमा जान सक्नेछ।`,
        en: `On failure to pay when due the Lender shall give written notice. If payment is not made within thirty-five days of that notice, the Lender may demand the entire outstanding balance and pursue recovery through the courts under prevailing law.`,
      },
    },
    {
      id: "governing",
      heading: { ne: "प्रचलित कानुन", en: "Governing law" },
      locked: true,
      citation: CONTRACT,
      body: {
        ne: `यो सम्झौता नेपालको मुलुकी देवानी संहिता, २०७४ द्वारा निर्देशित हुनेछ र नेपालका अधिकारप्राप्त अदालतको क्षेत्राधिकार रहनेछ।`,
        en: `This agreement is governed by the Muluki Civil Code, 2074 of Nepal and is subject to the jurisdiction of the competent courts of Nepal.`,
      },
    },
  ],
};
