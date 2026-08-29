import type { Template } from "../types";
import { CONTRACT, PARTNERSHIP, SALE, AGENCY_SERVICE } from "../nepal";
import {
  pendingReview,
  partyStep,
  nameField,
  addressField,
  bsDateField,
  moneyField,
  yesNoField,
  governingLawClause,
  EXECUTION,
} from "./common";

/* ------------------------------------------------------------------ partnership */

/**
 * Partnership deed under the Partnership Act, 2020.
 *
 * Unregistered partnerships are extremely common in Nepal and are where informal
 * businesses come apart: without a written profit share and exit mechanism, a
 * disagreement between partners has nothing to resolve against.
 */
export const partnershipDeed: Template = {
  slug: "partnership-deed",
  category: "business",
  priceNpr: 799,
  title: { ne: "साझेदारी संलेख", en: "Partnership Deed" },
  summary: {
    ne: "साझेदारी ऐन, २०२० बमोजिम दुई वा बढी व्यक्तिबीचको व्यावसायिक साझेदारीको लिखित संलेख।",
    en: "Written partnership deed under the Partnership Act, 2020. Covers capital, profit share, management and exit.",
  },
  governingAct: PARTNERSHIP,
  review: pendingReview(),
  execution: [
    EXECUTION.bothSign,
    EXECUTION.twoWitnesses,
    {
      ne: "साझेदारी फर्म सम्बन्धित घरेलु तथा साना उद्योग कार्यालयमा दर्ता गर्नुपर्नेछ। दर्ता नभएको साझेदारीले अदालतमा दाबी गर्न कठिनाइ हुन्छ।",
      en: "The firm must be registered with the relevant Cottage and Small Industries Office. An unregistered partnership has real difficulty enforcing claims in court.",
    },
  ],
  steps: [
    {
      id: "firm",
      title: { ne: "फर्मको विवरण", en: "The firm" },
      fields: [
        nameField("firmName", { ne: "फर्मको नाम", en: "Firm name" }),
        addressField("firmAddress", { ne: "फर्मको ठेगाना", en: "Firm address" }),
        {
          id: "businessNature",
          type: "textarea",
          required: true,
          label: { ne: "व्यवसायको प्रकृति", en: "Nature of the business" },
          help: {
            ne: "साँघुरो लेखेमा भविष्यमा संलेख संशोधन गर्नुपर्ने हुन्छ।",
            en: "Describe it broadly. A narrow description forces an amendment when the business grows.",
          },
        },
        bsDateField("startDateBs", { ne: "साझेदारी सुरु मिति (वि.सं.)", en: "Commencement date (BS)" }),
      ],
    },
    {
      id: "partners",
      title: { ne: "साझेदारहरू", en: "The partners" },
      fields: [
        ...partyStep(
          { prefix: "partnerA", role: { ne: "पहिलो साझेदार", en: "First partner" } },
          { prefix: "partnerB", role: { ne: "दोस्रो साझेदार", en: "Second partner" } },
        ),
        {
          id: "additionalPartners",
          type: "textarea",
          label: { ne: "थप साझेदारको विवरण", en: "Additional partners" },
          help: {
            ne: "दुईभन्दा बढी साझेदार भए यहाँ नाम, ठेगाना र नागरिकता नम्बर लेख्नुहोस्।",
            en: "For more than two partners, list each name, address and citizenship number here.",
          },
        },
      ],
    },
    {
      id: "capital",
      title: { ne: "पुँजी तथा नाफा", en: "Capital and profit" },
      intro: {
        ne: "नाफा-नोक्सान बाँडफाँटको अनुपात स्पष्ट नभएको साझेदारी विवादको मुख्य कारण हो।",
        en: "An unclear profit split is the single most common cause of partnership disputes.",
      },
      fields: [
        moneyField("totalCapitalNpr", { ne: "कुल पुँजी (रु.)", en: "Total capital (NPR)" }),
        {
          id: "capitalContributions",
          type: "textarea",
          required: true,
          label: { ne: "प्रत्येक साझेदारको लगानी", en: "Contribution of each partner" },
          placeholder: {
            ne: "जस्तै: सीता श्रेष्ठ, रु. ५,००,०००",
            en: "e.g. Sita Shrestha, NPR 5,00,000",
          },
        },
        {
          id: "profitSharing",
          type: "textarea",
          required: true,
          label: { ne: "नाफा-नोक्सान बाँडफाँट अनुपात", en: "Profit and loss sharing ratio" },
          placeholder: { ne: "जस्तै: ६०:४०", en: "e.g. 60:40" },
        },
      ],
    },
    {
      id: "management",
      title: { ne: "व्यवस्थापन", en: "Management" },
      fields: [
        {
          id: "managingPartner",
          type: "text",
          required: true,
          label: { ne: "प्रबन्धक साझेदार", en: "Managing partner" },
        },
        moneyField(
          "bankLimitNpr",
          { ne: "एक्लै निर्णय गर्न सक्ने रकम सीमा (रु.)", en: "Spending limit for a single partner (NPR)" },
          {
            ne: "यो सीमाभन्दा माथिको निर्णयमा सबै साझेदारको सहमति चाहिने व्यवस्था विवाद रोक्न प्रभावकारी हुन्छ।",
            en: "Requiring all partners to agree above a threshold is the most effective single safeguard in a partnership deed.",
          },
        ),
        {
          id: "noticeDays",
          type: "number",
          required: true,
          label: { ne: "बाहिरिन दिनुपर्ने सूचना (दिन)", en: "Notice to retire (days)" },
        },
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "संलेखको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: PARTNERSHIP,
      body: {
        ne: `यो साझेदारी संलेख {{startDateBs}} मा {{partnerAName}} (नागरिकता नं. {{partnerACitizenshipNo}}), ठेगाना {{partnerAAddress}} र {{partnerBName}} (नागरिकता नं. {{partnerBCitizenshipNo}}), ठेगाना {{partnerBAddress}} बीच साझेदारी ऐन, २०२० बमोजिम सम्पन्न भएको छ।`,
        en: `This Partnership Deed is made on {{startDateBs}} between {{partnerAName}} (citizenship no. {{partnerACitizenshipNo}}), of {{partnerAAddress}}, and {{partnerBName}} (citizenship no. {{partnerBCitizenshipNo}}), of {{partnerBAddress}}, under the Partnership Act, 2020.`,
      },
    },
    {
      id: "additional-partners",
      heading: { ne: "थप साझेदार", en: "Additional partners" },
      when: { field: "additionalPartners", op: "truthy" },
      body: {
        ne: `देहायका व्यक्ति समेत यस साझेदारीका साझेदार रहनेछन्:\n\n{{additionalPartners}}`,
        en: `The following persons are also partners in the firm:\n\n{{additionalPartners}}`,
      },
    },
    {
      id: "firm",
      heading: { ne: "फर्मको नाम र कारोबार", en: "Firm name and business" },
      body: {
        ne: `साझेदारी फर्मको नाम "{{firmName}}" रहनेछ। फर्मको मुख्य कार्यालय {{firmAddress}} मा रहनेछ र फर्मले {{businessNature}} को कारोबार गर्नेछ।`,
        en: `The firm shall be known as "{{firmName}}", with its principal place of business at {{firmAddress}}. The firm shall carry on the business of {{businessNature}}.`,
      },
    },
    {
      id: "capital",
      heading: { ne: "पुँजी", en: "Capital" },
      citation: PARTNERSHIP,
      body: {
        ne: `फर्मको कुल पुँजी रु. {{totalCapitalNpr}} रहनेछ, जसमा साझेदारहरूको लगानी देहायबमोजिम हुनेछ:\n\n{{capitalContributions}}`,
        en: `The capital of the firm is NPR {{totalCapitalNpr}}, contributed by the partners as follows:\n\n{{capitalContributions}}`,
      },
    },
    {
      id: "profit",
      heading: { ne: "नाफा-नोक्सान", en: "Profit and loss" },
      body: {
        ne: `फर्मको नाफा तथा नोक्सान साझेदारहरूबीच {{profitSharing}} को अनुपातमा बाँडफाँट हुनेछ। हिसाब प्रत्येक आर्थिक वर्षको अन्त्यमा अन्तिम गरिनेछ।`,
        en: `Profits and losses of the firm shall be shared between the partners in the ratio {{profitSharing}}. Accounts shall be settled at the end of each financial year.`,
      },
    },
    {
      id: "management",
      heading: { ne: "व्यवस्थापन तथा अधिकार", en: "Management and authority" },
      body: {
        ne: `{{managingPartner}} प्रबन्धक साझेदारका रूपमा दैनिक कारोबार सञ्चालन गर्नेछन्। रु. {{bankLimitNpr}} भन्दा बढी रकमको दायित्व सिर्जना गर्ने कुनै पनि निर्णयमा सबै साझेदारको लिखित सहमति अनिवार्य हुनेछ।`,
        en: `{{managingPartner}} shall act as managing partner for day-to-day business. Any decision creating a liability exceeding NPR {{bankLimitNpr}} requires the written consent of all partners.`,
      },
    },
    {
      id: "accounts",
      heading: { ne: "हिसाब-किताब", en: "Books of account" },
      locked: true,
      body: {
        ne: `फर्मले नियमित हिसाब-किताब राख्नेछ र प्रत्येक साझेदारलाई सो हेर्न पाउने अधिकार हुनेछ। फर्मको बैंक खाता फर्मकै नाममा सञ्चालन गरिनेछ।`,
        en: `The firm shall maintain proper books of account, which every partner is entitled to inspect. The firm's bank account shall be operated in the name of the firm.`,
      },
    },
    {
      id: "retirement",
      heading: { ne: "साझेदारी त्याग तथा विघटन", en: "Retirement and dissolution" },
      body: {
        ne: `कुनै साझेदारले {{noticeDays}} दिनको लिखित सूचना दिई साझेदारीबाट बाहिरिन सक्नेछन्। बाहिरिने साझेदारको हिसाब त्यस मितिसम्मको नाफा-नोक्सानसहित अन्तिम गरी भुक्तानी दिइनेछ।`,
        en: `A partner may retire on {{noticeDays}} days' written notice. The retiring partner's account shall be settled up to that date, including their share of profit or loss, and paid out.`,
      },
    },
    {
      id: "disputes",
      heading: { ne: "विवाद समाधान", en: "Dispute resolution" },
      body: {
        ne: `साझेदारहरूबीच विवाद उत्पन्न भएमा पहिले आपसी छलफलबाट समाधान गर्ने प्रयास गरिनेछ। समाधान नभएमा प्रचलित कानुनबमोजिम अदालतको शरण लिन सकिनेछ।`,
        en: `Any dispute between partners shall first be addressed by discussion between them. Failing that, either partner may pursue the matter through the courts under prevailing law.`,
      },
    },
    governingLawClause(PARTNERSHIP),
  ],
};

/* ------------------------------------------------------------------ service */

/** Business-to-business service agreement — the standard commercial engagement. */
export const serviceAgreement: Template = {
  slug: "service-agreement",
  category: "business",
  priceNpr: 599,
  title: { ne: "सेवा करार", en: "Service Agreement" },
  summary: {
    ne: "एक पक्षले अर्को पक्षलाई सेवा प्रदान गर्ने व्यावसायिक करार। कार्यक्षेत्र, शुल्क र भुक्तानी सर्त समावेश।",
    en: "Commercial agreement for one party to provide services to another. Covers scope, fees, payment terms and termination.",
  },
  governingAct: AGENCY_SERVICE,
  review: pendingReview(),
  execution: [EXECUTION.bothSign, EXECUTION.notExecutedByDownload],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("clientName", { ne: "सेवाग्राहीको नाम", en: "Client name" }),
        addressField("clientAddress", { ne: "सेवाग्राहीको ठेगाना", en: "Client address" }),
        nameField("providerName", { ne: "सेवा प्रदायकको नाम", en: "Service provider name" }),
        addressField("providerAddress", { ne: "सेवा प्रदायकको ठेगाना", en: "Service provider address" }),
      ],
    },
    {
      id: "scope",
      title: { ne: "कार्यक्षेत्र", en: "Scope of work" },
      intro: {
        ne: "कार्यक्षेत्र अस्पष्ट भएमा 'यो पनि गर्नुपर्ने हो' भन्ने विवाद अनिवार्य रूपमा आउँछ।",
        en: "A vague scope guarantees a later argument about what was included.",
      },
      fields: [
        {
          id: "services",
          type: "textarea",
          required: true,
          label: { ne: "प्रदान गरिने सेवाको विवरण", en: "Description of the services" },
        },
        {
          id: "deliverables",
          type: "textarea",
          label: { ne: "बुझाउनुपर्ने काम", en: "Deliverables" },
        },
        bsDateField("startDateBs", { ne: "सुरु मिति (वि.सं.)", en: "Start date (BS)" }),
        {
          id: "durationMonths",
          type: "number",
          required: true,
          label: { ne: "अवधि (महिना)", en: "Duration (months)" },
        },
      ],
    },
    {
      id: "fees",
      title: { ne: "शुल्क तथा भुक्तानी", en: "Fees and payment" },
      fields: [
        moneyField("feeNpr", { ne: "कुल शुल्क (रु.)", en: "Total fee (NPR)" }),
        {
          id: "paymentSchedule",
          type: "select",
          required: true,
          label: { ne: "भुक्तानी तरिका", en: "Payment schedule" },
          options: [
            { value: "monthly", label: { ne: "मासिक", en: "Monthly" } },
            { value: "milestone", label: { ne: "चरणअनुसार", en: "On milestones" } },
            { value: "completion", label: { ne: "काम सकिएपछि एकमुष्ट", en: "In full on completion" } },
          ],
        },
        {
          id: "paymentDays",
          type: "number",
          required: true,
          label: { ne: "बिल पेस गरेपछि भुक्तानी अवधि (दिन)", en: "Payment due after invoice (days)" },
        },
        yesNoField(
          "withholdingTax",
          { ne: "अग्रिम कर कट्टी लागू हुन्छ?", en: "Is withholding tax applicable?" },
          { ne: "हुन्छ", en: "Yes" },
          { ne: "हुँदैन", en: "No" },
          {
            ne: "सेवा भुक्तानीमा प्रचलित दरले अग्रिम कर कट्टी हुन सक्दछ।",
            en: "Service payments in Nepal commonly attract withholding tax at the prevailing rate. Confirm the rate with your accountant.",
          },
        ),
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "करारको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: CONTRACT,
      body: {
        ne: `यो सेवा करार {{startDateBs}} मा {{clientName}}, ठेगाना {{clientAddress}} (यसपछि "सेवाग्राही" भनिने) र {{providerName}}, ठेगाना {{providerAddress}} (यसपछि "सेवा प्रदायक" भनिने) बीच सम्पन्न भएको छ।`,
        en: `This Service Agreement is made on {{startDateBs}} between {{clientName}}, of {{clientAddress}} (the "Client") and {{providerName}}, of {{providerAddress}} (the "Service Provider").`,
      },
    },
    {
      id: "scope",
      heading: { ne: "सेवाको दायरा", en: "Scope of services" },
      body: {
        ne: `सेवा प्रदायकले सेवाग्राहीलाई देहायबमोजिमको सेवा प्रदान गर्नेछ: {{services}}। यो करार {{durationMonths}} महिनासम्म कायम रहनेछ।`,
        en: `The Service Provider shall provide the following services to the Client: {{services}}. This agreement continues for {{durationMonths}} months.`,
      },
    },
    {
      id: "deliverables",
      heading: { ne: "बुझाउनुपर्ने काम", en: "Deliverables" },
      when: { field: "deliverables", op: "truthy" },
      body: {
        ne: `सेवा प्रदायकले देहायका काम बुझाउनुपर्नेछ: {{deliverables}}।`,
        en: `The Service Provider shall deliver the following: {{deliverables}}.`,
      },
    },
    {
      id: "fees",
      heading: { ne: "शुल्क", en: "Fees" },
      body: {
        ne: `यस करारबापत कुल शुल्क रु. {{feeNpr}} हुनेछ, जुन {{paymentSchedule}} भुक्तानी गरिनेछ। बिल पेस गरेको {{paymentDays}} दिनभित्र भुक्तानी दिनुपर्नेछ।`,
        en: `The total fee under this agreement is NPR {{feeNpr}}, payable {{paymentSchedule}}. Payment falls due within {{paymentDays}} days of invoice.`,
      },
    },
    {
      id: "tax",
      heading: { ne: "कर", en: "Tax" },
      when: { field: "withholdingTax", op: "eq", value: "yes" },
      body: {
        ne: `भुक्तानी गर्दा प्रचलित कानुनबमोजिम लाग्ने अग्रिम कर सेवाग्राहीले कट्टा गरी सम्बन्धित निकायमा दाखिला गर्नेछ र सेवा प्रदायकलाई कर कट्टीको प्रमाण उपलब्ध गराउनेछ।`,
        en: `The Client shall deduct withholding tax at the prevailing rate, deposit it with the relevant authority, and provide the Service Provider with evidence of the deduction.`,
      },
    },
    {
      id: "independent",
      heading: { ne: "स्वतन्त्र हैसियत", en: "Independent contractor" },
      locked: true,
      body: {
        ne: `सेवा प्रदायक स्वतन्त्र हैसियतमा काम गर्नेछ। यो करारले सेवाग्राही र सेवा प्रदायकबीच रोजगारदाता-श्रमिकको सम्बन्ध सिर्जना गर्ने छैन।`,
        en: `The Service Provider acts as an independent contractor. Nothing in this agreement creates an employer–employee relationship between the parties.`,
      },
    },
    {
      id: "confidentiality",
      heading: { ne: "गोपनीयता", en: "Confidentiality" },
      body: {
        ne: `कुनै पनि पक्षले यस करारको सिलसिलामा प्राप्त अर्को पक्षको गोपनीय सूचना तेस्रो पक्षलाई प्रकट गर्ने छैन।`,
        en: `Neither party shall disclose to any third party the confidential information of the other obtained in the course of this agreement.`,
      },
    },
    {
      id: "termination",
      heading: { ne: "करार अन्त्य", en: "Termination" },
      body: {
        ne: `कुनै पनि पक्षले तीस दिनको लिखित सूचना दिई यो करार अन्त्य गर्न सक्नेछ। अन्त्य हुँदासम्म सम्पन्न भइसकेको कामको शुल्क भुक्तानी दिनुपर्नेछ।`,
        en: `Either party may terminate this agreement on thirty days' written notice. Fees for work already performed up to termination remain payable.`,
      },
    },
    governingLawClause(CONTRACT),
  ],
};

/* ------------------------------------------------------------------ sale of goods */

/** Sale of goods — the instrument behind most small-business supply disputes. */
export const saleOfGoods: Template = {
  slug: "sale-of-goods",
  category: "business",
  priceNpr: 399,
  title: { ne: "किनबेच सम्झौता", en: "Sale of Goods Agreement" },
  summary: {
    ne: "मालसामान किनबेच सम्बन्धी लिखित सम्झौता। मूल्य, सुपुर्दगी, स्वामित्व हस्तान्तरण र वारेन्टी समावेश।",
    en: "Written agreement for the sale of goods. Covers price, delivery, transfer of title, and warranty.",
  },
  governingAct: SALE,
  review: pendingReview(),
  execution: [EXECUTION.bothSign, EXECUTION.stampDuty],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: partyStep(
        { prefix: "seller", role: { ne: "बिक्रेता", en: "Seller" } },
        { prefix: "buyer", role: { ne: "क्रेता", en: "Buyer" } },
      ),
    },
    {
      id: "goods",
      title: { ne: "मालसामानको विवरण", en: "The goods" },
      fields: [
        {
          id: "goodsDescription",
          type: "textarea",
          required: true,
          label: { ne: "मालसामानको विवरण", en: "Description of the goods" },
          help: {
            ne: "परिमाण, गुणस्तर र मोडेल स्पष्ट लेख्नुहोस्।",
            en: "State quantity, quality and model precisely. This is what a dispute turns on.",
          },
        },
        moneyField("priceNprTotal", { ne: "कुल मूल्य (रु.)", en: "Total price (NPR)" }),
        bsDateField("deliveryDateBs", { ne: "सुपुर्दगी मिति (वि.सं.)", en: "Delivery date (BS)" }),
        addressField("deliveryPlace", { ne: "सुपुर्दगी स्थान", en: "Place of delivery" }),
        {
          id: "warrantyMonths",
          type: "number",
          label: { ne: "वारेन्टी अवधि (महिना)", en: "Warranty period (months)" },
        },
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "सम्झौताको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: SALE,
      body: {
        ne: `यो किनबेच सम्झौता {{sellerName}} (नागरिकता नं. {{sellerCitizenshipNo}}), ठेगाना {{sellerAddress}} (यसपछि "बिक्रेता" भनिने) र {{buyerName}} (नागरिकता नं. {{buyerCitizenshipNo}}), ठेगाना {{buyerAddress}} (यसपछि "क्रेता" भनिने) बीच सम्पन्न भएको छ।`,
        en: `This Sale of Goods Agreement is made between {{sellerName}} (citizenship no. {{sellerCitizenshipNo}}), of {{sellerAddress}} (the "Seller") and {{buyerName}} (citizenship no. {{buyerCitizenshipNo}}), of {{buyerAddress}} (the "Buyer").`,
      },
    },
    {
      id: "goods",
      heading: { ne: "मालसामान तथा मूल्य", en: "Goods and price" },
      citation: SALE,
      body: {
        ne: `बिक्रेताले क्रेतालाई देहायको मालसामान रु. {{priceNprTotal}} मा बिक्री गर्न मञ्जुर गरेको छ: {{goodsDescription}}।`,
        en: `The Seller agrees to sell to the Buyer the following goods for NPR {{priceNprTotal}}: {{goodsDescription}}.`,
      },
    },
    {
      id: "delivery",
      heading: { ne: "सुपुर्दगी", en: "Delivery" },
      body: {
        ne: `मालसामान {{deliveryDateBs}} भित्र {{deliveryPlace}} मा सुपुर्द गरिनेछ। सुपुर्दगीको समयमा क्रेताले मालसामान जाँच गरी बुझ्नेछ।`,
        en: `The goods shall be delivered at {{deliveryPlace}} on or before {{deliveryDateBs}}. The Buyer shall inspect the goods on delivery.`,
      },
    },
    {
      id: "title",
      heading: { ne: "स्वामित्व हस्तान्तरण", en: "Transfer of title" },
      locked: true,
      citation: SALE,
      body: {
        ne: `मालसामानको स्वामित्व पूर्ण भुक्तानी प्राप्त भएपछि मात्र क्रेतामा सर्नेछ। सुपुर्दगीपछिको जोखिम भने क्रेताले व्यहोर्नेछ।`,
        en: `Title to the goods passes to the Buyer only on receipt of payment in full. Risk in the goods passes to the Buyer on delivery.`,
      },
    },
    {
      id: "warranty",
      heading: { ne: "वारेन्टी", en: "Warranty" },
      when: { field: "warrantyMonths", op: "truthy" },
      body: {
        ne: `बिक्रेताले सुपुर्दगी मितिले {{warrantyMonths}} महिनासम्म मालसामानको गुणस्तरको प्रत्याभूति गर्दछ। सो अवधिभित्र निर्माणगत त्रुटि देखिएमा बिक्रेताले मर्मत वा प्रतिस्थापन गर्नेछ।`,
        en: `The Seller warrants the goods for {{warrantyMonths}} months from delivery. Manufacturing defects appearing within that period shall be repaired or replaced by the Seller.`,
      },
    },
    governingLawClause(SALE),
  ],
};

/* ------------------------------------------------------------------ freelance */

/**
 * Freelance / independent contractor agreement.
 *
 * Deliberately distinct from the employment contract: misclassifying an employee as a
 * contractor to avoid Labour Act obligations is a real exposure, so this template
 * says so rather than quietly enabling it.
 */
export const freelanceAgreement: Template = {
  slug: "freelance-agreement",
  // Filed under employment rather than business: this is where someone looking to
  // engage a worker will look, and it sits next to the contract it warns about
  // being confused with.
  category: "employment",
  priceNpr: 499,
  title: { ne: "स्वतन्त्र कार्य करार", en: "Freelance Agreement" },
  summary: {
    ne: "स्वतन्त्र रूपमा काम गर्ने व्यक्तिसँगको करार। बौद्धिक सम्पत्तिको स्वामित्व र भुक्तानी सर्त समावेश।",
    en: "Agreement with an independent freelancer. Covers scope, intellectual property ownership and payment.",
  },
  governingAct: AGENCY_SERVICE,
  review: pendingReview(),
  execution: [
    EXECUTION.bothSign,
    {
      ne: "काम गर्ने व्यक्ति वास्तवमा श्रमिक हो भने श्रम ऐन, २०७४ लागू हुन्छ र यो करारले सो दायित्वबाट उम्किन मिल्दैन।",
      en: "If the person is in substance an employee, the Labour Act 2074 applies regardless of what this document is called, and its obligations cannot be avoided by labelling them a contractor.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("clientName", { ne: "कार्यदाताको नाम", en: "Client name" }),
        addressField("clientAddress", { ne: "कार्यदाताको ठेगाना", en: "Client address" }),
        nameField("freelancerName", { ne: "स्वतन्त्र कर्मीको नाम", en: "Freelancer name" }),
        addressField("freelancerAddress", { ne: "स्वतन्त्र कर्मीको ठेगाना", en: "Freelancer address" }),
      ],
    },
    {
      id: "work",
      title: { ne: "कार्य तथा शुल्क", en: "Work and fee" },
      fields: [
        {
          id: "workDescription",
          type: "textarea",
          required: true,
          label: { ne: "कामको विवरण", en: "Description of the work" },
        },
        moneyField("feeNpr", { ne: "शुल्क (रु.)", en: "Fee (NPR)" }),
        bsDateField("deadlineBs", { ne: "काम सक्नुपर्ने मिति (वि.सं.)", en: "Completion date (BS)" }),
        {
          id: "ipOwnership",
          type: "select",
          required: true,
          label: { ne: "बौद्धिक सम्पत्तिको स्वामित्व", en: "Who owns the intellectual property?" },
          citation: CONTRACT,
          help: {
            ne: "स्पष्ट नलेखिएमा सिर्जना गर्ने व्यक्तिको स्वामित्व रहन सक्दछ। सफ्टवेयर र डिजाइनमा यो सबैभन्दा बढी विवाद हुने विषय हो।",
            en: "Left unstated, ownership may rest with the creator. In software and design work this is the single most disputed term.",
          },
          options: [
            { value: "client", label: { ne: "कार्यदाताको", en: "Client owns it" } },
            { value: "freelancer", label: { ne: "स्वतन्त्र कर्मीको", en: "Freelancer retains it" } },
            { value: "licence", label: { ne: "कार्यदातालाई प्रयोग गर्ने अनुमति", en: "Freelancer retains, client licensed" } },
          ],
        },
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "करारको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: CONTRACT,
      body: {
        ne: `यो स्वतन्त्र कार्य करार {{clientName}}, ठेगाना {{clientAddress}} र {{freelancerName}}, ठेगाना {{freelancerAddress}} बीच सम्पन्न भएको छ।`,
        en: `This Freelance Agreement is made between {{clientName}}, of {{clientAddress}}, and {{freelancerName}}, of {{freelancerAddress}}.`,
      },
    },
    {
      id: "work",
      heading: { ne: "कार्य", en: "The work" },
      body: {
        ne: `स्वतन्त्र कर्मीले देहायको काम {{deadlineBs}} भित्र सम्पन्न गर्नेछ: {{workDescription}}। कार्यबापत रु. {{feeNpr}} शुल्क दिइनेछ।`,
        en: `The Freelancer shall complete the following work by {{deadlineBs}}: {{workDescription}}. The fee for the work is NPR {{feeNpr}}.`,
      },
    },
    {
      id: "ip-client",
      heading: { ne: "बौद्धिक सम्पत्ति", en: "Intellectual property" },
      when: { field: "ipOwnership", op: "eq", value: "client" },
      body: {
        ne: `यस करारअन्तर्गत सिर्जना गरिएको सम्पूर्ण कामको बौद्धिक सम्पत्तिको हक पूर्ण भुक्तानी प्राप्त भएपछि कार्यदातामा हस्तान्तरण हुनेछ।`,
        en: `All intellectual property in work created under this agreement transfers to the Client on payment in full.`,
      },
    },
    {
      id: "ip-freelancer",
      heading: { ne: "बौद्धिक सम्पत्ति", en: "Intellectual property" },
      when: { field: "ipOwnership", op: "eq", value: "freelancer" },
      body: {
        ne: `सिर्जना गरिएको कामको बौद्धिक सम्पत्तिको हक स्वतन्त्र कर्मीमै रहनेछ।`,
        en: `The Freelancer retains all intellectual property in the work created.`,
      },
    },
    {
      id: "ip-licence",
      heading: { ne: "बौद्धिक सम्पत्ति", en: "Intellectual property" },
      when: { field: "ipOwnership", op: "eq", value: "licence" },
      body: {
        ne: `बौद्धिक सम्पत्तिको हक स्वतन्त्र कर्मीमै रहनेछ। कार्यदातालाई सो काम आफ्नो व्यवसायमा प्रयोग गर्ने अनन्य नभएको, स्थायी अनुमति प्रदान गरिनेछ।`,
        en: `The Freelancer retains ownership of the intellectual property and grants the Client a perpetual, non-exclusive licence to use the work in its business.`,
      },
    },
    {
      id: "not-employment",
      heading: { ne: "रोजगारी सम्बन्ध होइन", en: "Not an employment relationship" },
      locked: true,
      body: {
        ne: `स्वतन्त्र कर्मी कार्यदाताको श्रमिक होइन र निजले आफ्नो कर दायित्व आफैँ व्यहोर्नेछ। तर काम गर्ने तरिका, समय र नियन्त्रणका आधारमा वास्तविक सम्बन्ध रोजगारीको देखिएमा श्रम ऐन, २०७४ लागू हुनेछ।`,
        en: `The Freelancer is not an employee of the Client and is responsible for their own tax. If the relationship is in fact employment, judged by the control exercised, the hours worked and the direction given, the Labour Act 2074 applies regardless of this clause.`,
      },
    },
    governingLawClause(CONTRACT),
  ],
};
