import type { Template } from "../types";
import { CONTRACT, SALE, AGENCY_SERVICE, RESTRAINT, LABOUR, MIN_MONTHLY_WAGE_NPR, formatNpr } from "../nepal";
import {
  pendingReview,
  nameField,
  addressField,
  bsDateField,
  moneyField,
  yesNoField,
  governingLawClause,
  EXECUTION,
} from "./common";

/* ------------------------------------------------------------------ supply */

/** Vendor supply agreement — recurring supply rather than a one-off sale. */
export const supplyAgreement: Template = {
  slug: "supply-agreement",
  category: "business",
  priceNpr: 699,
  title: { ne: "आपूर्ति सम्झौता", en: "Supply Agreement" },
  summary: {
    ne: "नियमित रूपमा मालसामान आपूर्ति गर्ने सम्झौता। मूल्य, गुणस्तर, सुपुर्दगी र भुक्तानी सर्त समावेश।",
    en: "Agreement for the recurring supply of goods — price, quality, delivery and payment terms.",
  },
  governingAct: SALE,
  review: pendingReview(),
  execution: [EXECUTION.bothSign, EXECUTION.notExecutedByDownload],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("supplierName", { ne: "आपूर्तिकर्ताको नाम", en: "Supplier name" }),
        addressField("supplierAddress", { ne: "आपूर्तिकर्ताको ठेगाना", en: "Supplier address" }),
        nameField("buyerName", { ne: "खरिदकर्ताको नाम", en: "Buyer name" }),
        addressField("buyerAddress", { ne: "खरिदकर्ताको ठेगाना", en: "Buyer address" }),
      ],
    },
    {
      id: "supply",
      title: { ne: "आपूर्तिको विवरण", en: "The supply" },
      fields: [
        {
          id: "goods",
          type: "textarea",
          required: true,
          label: { ne: "मालसामान तथा गुणस्तर", en: "Goods and specification" },
          help: {
            ne: "गुणस्तर स्पष्ट नलेखिएमा 'यो त हामीले चाहेको जस्तो होइन' भन्ने विवाद अनिवार्य आउँछ।",
            en: "An unstated specification guarantees a later argument about whether what arrived was what was ordered.",
          },
        },
        {
          id: "frequency",
          type: "select",
          required: true,
          label: { ne: "आपूर्ति आवृत्ति", en: "Supply frequency" },
          options: [
            { value: "weekly", label: { ne: "साप्ताहिक", en: "Weekly" } },
            { value: "monthly", label: { ne: "मासिक", en: "Monthly" } },
            { value: "on_order", label: { ne: "अर्डरअनुसार", en: "On order" } },
          ],
        },
        moneyField("unitPriceNpr", { ne: "प्रति एकाइ मूल्य (रु.)", en: "Unit price (NPR)" }),
        {
          id: "termMonths",
          type: "number",
          required: true,
          label: { ne: "सम्झौता अवधि (महिना)", en: "Term (months)" },
        },
        {
          id: "paymentDays",
          type: "number",
          required: true,
          label: { ne: "भुक्तानी अवधि (दिन)", en: "Payment due (days)" },
        },
        yesNoField(
          "priceFixed",
          { ne: "अवधिभर मूल्य स्थिर रहने?", en: "Is the price fixed for the term?" },
          { ne: "स्थिर", en: "Fixed" },
          { ne: "परिवर्तन हुन सक्ने", en: "May change" },
        ),
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
        ne: `यो आपूर्ति सम्झौता {{supplierName}}, ठेगाना {{supplierAddress}} (यसपछि "आपूर्तिकर्ता") र {{buyerName}}, ठेगाना {{buyerAddress}} (यसपछि "खरिदकर्ता") बीच सम्पन्न भएको छ।`,
        en: `This Supply Agreement is made between {{supplierName}}, of {{supplierAddress}} (the "Supplier") and {{buyerName}}, of {{buyerAddress}} (the "Buyer").`,
      },
    },
    {
      id: "goods",
      heading: { ne: "मालसामान", en: "The goods" },
      citation: SALE,
      body: {
        ne: `आपूर्तिकर्ताले {{frequency}} रूपमा देहायको मालसामान प्रति एकाइ रु. {{unitPriceNpr}} का दरले आपूर्ति गर्नेछ:\n\n{{goods}}`,
        en: `The Supplier shall supply the following goods {{frequency}}, at NPR {{unitPriceNpr}} per unit:\n\n{{goods}}`,
      },
    },
    {
      id: "term",
      heading: { ne: "अवधि", en: "Term" },
      body: {
        ne: `यो सम्झौता {{termMonths}} महिनासम्म कायम रहनेछ।`,
        en: `This agreement continues for {{termMonths}} months.`,
      },
    },
    {
      id: "price-fixed",
      heading: { ne: "मूल्य स्थिरता", en: "Price stability" },
      when: { field: "priceFixed", op: "eq", value: "yes" },
      body: {
        ne: `सम्झौता अवधिभर मूल्य स्थिर रहनेछ। दुवै पक्षको लिखित सहमतिबिना मूल्य परिवर्तन गरिने छैन।`,
        en: `The price is fixed for the term and shall not change without the written agreement of both parties.`,
      },
    },
    {
      id: "price-variable",
      heading: { ne: "मूल्य परिवर्तन", en: "Price changes" },
      when: { field: "priceFixed", op: "eq", value: "no" },
      body: {
        ne: `मूल्य परिवर्तन गर्नुपरेमा आपूर्तिकर्ताले कम्तीमा तीस दिनअगावै लिखित सूचना दिनुपर्नेछ। खरिदकर्ताले सो नमञ्जुर भएमा सम्झौता अन्त्य गर्न सक्नेछ।`,
        en: `The Supplier must give at least thirty days' written notice of any price change. If the Buyer does not accept it, the Buyer may terminate.`,
      },
    },
    {
      id: "quality",
      heading: { ne: "गुणस्तर तथा अस्वीकृति", en: "Quality and rejection" },
      locked: true,
      citation: SALE,
      body: {
        ne: `सुपुर्द गरिएको मालसामान तोकिएको गुणस्तरअनुरूप नभएमा खरिदकर्ताले सुपुर्दगीको सात दिनभित्र अस्वीकार गर्न सक्नेछ। अस्वीकृत मालसामान आपूर्तिकर्ताको खर्चमा फिर्ता लगिनेछ।`,
        en: `Goods not conforming to the agreed specification may be rejected by the Buyer within seven days of delivery. Rejected goods are returned at the Supplier's cost.`,
      },
    },
    {
      id: "payment",
      heading: { ne: "भुक्तानी", en: "Payment" },
      body: {
        ne: `बिजक पेस भएको {{paymentDays}} दिनभित्र भुक्तानी गर्नुपर्नेछ।`,
        en: `Invoices fall due within {{paymentDays}} days of presentation.`,
      },
    },
    governingLawClause(SALE),
  ],
};

/* ------------------------------------------------------------------ distribution */

/** Distribution agreement — the exclusivity term is what parties actually argue over. */
export const distributionAgreement: Template = {
  slug: "distribution-agreement",
  category: "business",
  priceNpr: 899,
  title: { ne: "वितरण सम्झौता", en: "Distribution Agreement" },
  summary: {
    ne: "निश्चित क्षेत्रमा उत्पादन वितरण गर्ने अधिकार दिने सम्झौता। एकाधिकार र अन्त्यका सर्त समावेश।",
    en: "Grants the right to distribute a product in a defined territory. Covers exclusivity and termination.",
  },
  governingAct: CONTRACT,
  review: pendingReview(),
  execution: [EXECUTION.bothSign, EXECUTION.notExecutedByDownload],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("principalName", { ne: "उत्पादक/आपूर्तिकर्ताको नाम", en: "Principal / supplier name" }),
        addressField("principalAddress", { ne: "ठेगाना", en: "Address" }),
        nameField("distributorName", { ne: "वितरकको नाम", en: "Distributor name" }),
        addressField("distributorAddress", { ne: "वितरकको ठेगाना", en: "Distributor address" }),
      ],
    },
    {
      id: "terms",
      title: { ne: "वितरणका सर्त", en: "Distribution terms" },
      fields: [
        {
          id: "products",
          type: "textarea",
          required: true,
          label: { ne: "उत्पादनको विवरण", en: "The products" },
        },
        {
          id: "territory",
          type: "text",
          required: true,
          label: { ne: "क्षेत्र", en: "Territory" },
          placeholder: { ne: "जस्तै: बागमती प्रदेश", en: "e.g. Bagmati Province" },
        },
        {
          id: "exclusive",
          type: "select",
          required: true,
          label: { ne: "एकाधिकार", en: "Exclusivity" },
          citation: CONTRACT,
          help: {
            ne: "एकाधिकार दिँदा उत्पादकले सोही क्षेत्रमा अरूलाई वितरण गर्न दिन पाउँदैन।",
            en: "Granting exclusivity means the principal cannot appoint anyone else in that territory — including selling there directly.",
          },
          options: [
            { value: "exclusive", label: { ne: "एकल वितरक", en: "Exclusive" } },
            { value: "non_exclusive", label: { ne: "गैर-एकल", en: "Non-exclusive" } },
          ],
        },
        {
          id: "termMonths",
          type: "number",
          required: true,
          label: { ne: "अवधि (महिना)", en: "Term (months)" },
        },
        {
          id: "minimumPurchase",
          type: "currency",
          label: { ne: "न्यूनतम वार्षिक खरिद (रु.)", en: "Minimum annual purchase (NPR)" },
          help: {
            ne: "एकाधिकार दिँदा न्यूनतम खरिद तोक्नु सामान्य अभ्यास हो।",
            en: "Where exclusivity is granted, a minimum purchase target is what stops the territory sitting idle.",
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
        ne: `यो वितरण सम्झौता {{principalName}}, ठेगाना {{principalAddress}} र {{distributorName}}, ठेगाना {{distributorAddress}} बीच सम्पन्न भएको छ।`,
        en: `This Distribution Agreement is made between {{principalName}}, of {{principalAddress}}, and {{distributorName}}, of {{distributorAddress}}.`,
      },
    },
    {
      id: "appointment-exclusive",
      heading: { ne: "एकल वितरकको नियुक्ति", en: "Appointment as exclusive distributor" },
      when: { field: "exclusive", op: "eq", value: "exclusive" },
      body: {
        ne: `{{territory}} क्षेत्रमा देहायका उत्पादन वितरण गर्न {{distributorName}} लाई एकल वितरक नियुक्त गरिएको छ:\n\n{{products}}\n\nसो अवधिभर उत्पादकले उक्त क्षेत्रमा अर्को वितरक नियुक्त गर्ने वा प्रत्यक्ष बिक्री गर्ने छैन।`,
        en: `{{distributorName}} is appointed exclusive distributor of the following products in {{territory}}:\n\n{{products}}\n\nDuring the term the Principal shall not appoint another distributor in that territory, nor sell there directly.`,
      },
    },
    {
      id: "appointment-non-exclusive",
      heading: { ne: "वितरकको नियुक्ति", en: "Appointment as distributor" },
      when: { field: "exclusive", op: "eq", value: "non_exclusive" },
      body: {
        ne: `{{territory}} क्षेत्रमा देहायका उत्पादन वितरण गर्न {{distributorName}} लाई नियुक्त गरिएको छ। यो एकाधिकार होइन र उत्पादकले सोही क्षेत्रमा अरू वितरक नियुक्त गर्न सक्नेछ:\n\n{{products}}`,
        en: `{{distributorName}} is appointed to distribute the following products in {{territory}}. This appointment is not exclusive and the Principal may appoint others in the same territory:\n\n{{products}}`,
      },
    },
    {
      id: "minimum",
      heading: { ne: "न्यूनतम खरिद", en: "Minimum purchase" },
      when: { field: "minimumPurchase", op: "truthy" },
      body: {
        ne: `वितरकले प्रत्येक वर्ष कम्तीमा रु. {{minimumPurchase}} बराबरको उत्पादन खरिद गर्नुपर्नेछ। सो नपुगेमा उत्पादकले एकाधिकार खारेज गर्न सक्नेछ।`,
        en: `The Distributor shall purchase at least NPR {{minimumPurchase}} of product each year. Falling short entitles the Principal to withdraw exclusivity.`,
      },
    },
    {
      id: "term",
      heading: { ne: "अवधि तथा अन्त्य", en: "Term and termination" },
      body: {
        ne: `यो सम्झौता {{termMonths}} महिनासम्म कायम रहनेछ। कुनै पक्षले साठी दिनको लिखित सूचना दिई अन्त्य गर्न सक्नेछ। अन्त्य हुँदा वितरकसँग रहेको मौज्दात उत्पादकले फिर्ता लिने वा बिक्री गर्न दिने विषय लिखित रूपमा टुंग्याइनेछ।`,
        en: `This agreement continues for {{termMonths}} months. Either party may terminate on sixty days' written notice. On termination the parties shall agree in writing whether remaining stock is bought back or sold through.`,
      },
    },
    {
      id: "trademark",
      heading: { ne: "चिह्नको प्रयोग", en: "Use of marks" },
      locked: true,
      body: {
        ne: `वितरकले उत्पादकको ट्रेडमार्क तथा चिह्न वितरणको प्रयोजनका लागि मात्र प्रयोग गर्न पाउनेछ। सम्झौता अन्त्य भएपछि सो प्रयोग तत्काल बन्द गर्नुपर्नेछ।`,
        en: `The Distributor may use the Principal's trademarks and marks only for the purpose of distribution, and must cease all such use immediately on termination.`,
      },
    },
    governingLawClause(CONTRACT),
  ],
};

/* ------------------------------------------------------------------ IP assignment */

/** IP assignment — transfers what a services contract may only have licensed. */
export const ipAssignment: Template = {
  slug: "ip-assignment",
  category: "business",
  priceNpr: 699,
  title: { ne: "बौद्धिक सम्पत्ति हस्तान्तरण", en: "Intellectual Property Assignment" },
  summary: {
    ne: "सिर्जना गरिएको कामको बौद्धिक सम्पत्तिको हक अर्को पक्षमा हस्तान्तरण गर्ने लिखत।",
    en: "Assigns ownership of intellectual property in created work to another party.",
  },
  governingAct: CONTRACT,
  review: pendingReview(),
  execution: [
    EXECUTION.bothSign,
    {
      ne: "हस्तान्तरण लिखित र प्रतिफलसहित हुनुपर्दछ। बिना प्रतिफलको हस्तान्तरण चुनौतीयोग्य हुन सक्दछ।",
      en: "An assignment should be in writing and supported by consideration. One given for nothing is open to challenge.",
    },
    {
      ne: "दर्ता भएको ट्रेडमार्क वा पेटेन्टको हकमा सम्बन्धित कार्यालयमा नामसारी गराउनुपर्दछ।",
      en: "Where a registered trademark or patent is assigned, the register must also be updated at the relevant office.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("assignorName", { ne: "हस्तान्तरण गर्नेको नाम", en: "Assignor name" }),
        addressField("assignorAddress", { ne: "ठेगाना", en: "Address" }),
        nameField("assigneeName", { ne: "प्राप्तकर्ताको नाम", en: "Assignee name" }),
        addressField("assigneeAddress", { ne: "प्राप्तकर्ताको ठेगाना", en: "Assignee address" }),
        bsDateField("assignmentDateBs", { ne: "मिति (वि.सं.)", en: "Date (BS)" }),
      ],
    },
    {
      id: "work",
      title: { ne: "कामको विवरण", en: "The work" },
      fields: [
        {
          id: "workDescription",
          type: "textarea",
          required: true,
          label: { ne: "हस्तान्तरण हुने कामको विवरण", en: "Description of the work assigned" },
          help: {
            ne: "जति स्पष्ट लेख्नुहुन्छ, पछि 'यो त समावेश थिएन' भन्ने विवाद त्यति नै कम हुन्छ।",
            en: "The more precisely this is described, the less room there is to argue later about what was and was not included.",
          },
        },
        moneyField("considerationNpr", { ne: "प्रतिफल (रु.)", en: "Consideration (NPR)" }),
        yesNoField(
          "includesMoralRights",
          { ne: "भविष्यमा सिर्जना हुने काम पनि समावेश?", en: "Does this cover work created in future?" },
          { ne: "समावेश", en: "Yes" },
          { ne: "समावेश छैन", en: "No" },
        ),
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "लिखतको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: CONTRACT,
      body: {
        ne: `यो बौद्धिक सम्पत्ति हस्तान्तरण लिखत {{assignmentDateBs}} मा {{assignorName}}, ठेगाना {{assignorAddress}} र {{assigneeName}}, ठेगाना {{assigneeAddress}} बीच सम्पन्न भएको छ।`,
        en: `This Assignment is made on {{assignmentDateBs}} between {{assignorName}}, of {{assignorAddress}}, and {{assigneeName}}, of {{assigneeAddress}}.`,
      },
    },
    {
      id: "assignment",
      heading: { ne: "हस्तान्तरण", en: "Assignment" },
      citation: CONTRACT,
      body: {
        ne: `प्रतिफल बापत रु. {{considerationNpr}} बुझी हस्तान्तरण गर्नेले देहायको काममा रहेको सम्पूर्ण बौद्धिक सम्पत्तिको हक प्राप्तकर्तालाई हस्तान्तरण गरेको छ:\n\n{{workDescription}}`,
        en: `In consideration of NPR {{considerationNpr}}, the Assignor assigns to the Assignee all intellectual property rights in the following work:\n\n{{workDescription}}`,
      },
    },
    {
      id: "future-work",
      heading: { ne: "भविष्यको काम", en: "Future work" },
      when: { field: "includesMoralRights", op: "eq", value: "yes" },
      body: {
        ne: `यस लिखतको प्रयोजनसँग सम्बन्धित भई भविष्यमा सिर्जना हुने कामको बौद्धिक सम्पत्ति समेत सिर्जना हुनासाथ प्राप्तकर्तामा हस्तान्तरण हुनेछ।`,
        en: `Intellectual property in work created in future for the purposes of this assignment vests in the Assignee as it is created.`,
      },
    },
    {
      id: "warranty",
      heading: { ne: "प्रत्याभूति", en: "Warranty" },
      locked: true,
      body: {
        ne: `हस्तान्तरण गर्नेले उक्त काम आफैँले सिर्जना गरेको, अरू कसैको हक हनन नगरेको र हस्तान्तरण गर्ने पूर्ण अधिकार रहेको प्रत्याभूति दिन्छ।`,
        en: `The Assignor warrants that the work is their own creation, does not infringe anyone else's rights, and that they have full authority to assign it.`,
      },
    },
    {
      id: "assistance",
      heading: { ne: "थप सहयोग", en: "Further assurance" },
      body: {
        ne: `दर्ता वा नामसारीका लागि आवश्यक कागजातमा हस्ताक्षर गर्न हस्तान्तरण गर्नेले सहयोग गर्नेछ।`,
        en: `The Assignor shall sign any further documents needed to record or register the assignment.`,
      },
    },
    governingLawClause(CONTRACT),
  ],
};

/* ------------------------------------------------------------------ retainer */

/** Consultancy retainer — ongoing availability rather than a defined deliverable. */
export const consultancyRetainer: Template = {
  slug: "consultancy-retainer",
  category: "business",
  priceNpr: 599,
  title: { ne: "परामर्श रिटेनर सम्झौता", en: "Consultancy Retainer" },
  summary: {
    ne: "नियमित मासिक शुल्कमा परामर्श सेवा लिने सम्झौता। समयको सीमा र दायराको स्पष्टता समावेश।",
    en: "Engages a consultant for a recurring monthly fee. Covers the hours included and what falls outside them.",
  },
  governingAct: AGENCY_SERVICE,
  review: pendingReview(),
  execution: [EXECUTION.bothSign],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("clientName", { ne: "सेवाग्राहीको नाम", en: "Client name" }),
        addressField("clientAddress", { ne: "ठेगाना", en: "Address" }),
        nameField("consultantName", { ne: "परामर्शदाताको नाम", en: "Consultant name" }),
        addressField("consultantAddress", { ne: "परामर्शदाताको ठेगाना", en: "Consultant address" }),
      ],
    },
    {
      id: "terms",
      title: { ne: "सेवाका सर्त", en: "Terms of engagement" },
      fields: [
        {
          id: "scope",
          type: "textarea",
          required: true,
          label: { ne: "परामर्शको दायरा", en: "Scope of the advice" },
        },
        moneyField("monthlyFeeNpr", { ne: "मासिक शुल्क (रु.)", en: "Monthly fee (NPR)" }),
        {
          id: "includedHours",
          type: "number",
          required: true,
          label: { ne: "मासिक समावेश घण्टा", en: "Hours included each month" },
          help: {
            ne: "घण्टा नतोकिएको रिटेनरमा 'अझै कति काम गर्ने' भन्ने विवाद आउँछ।",
            en: "A retainer with no hour limit turns into an argument about how much work the fee was supposed to buy.",
          },
        },
        moneyField("extraHourlyNpr", { ne: "थप घण्टाको दर (रु.)", en: "Rate for additional hours (NPR)" }, undefined, false),
        {
          id: "noticeDays",
          type: "number",
          required: true,
          label: { ne: "अन्त्यको सूचना (दिन)", en: "Notice to end (days)" },
        },
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "सम्झौताको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: AGENCY_SERVICE,
      body: {
        ne: `यो परामर्श सम्झौता {{clientName}}, ठेगाना {{clientAddress}} र {{consultantName}}, ठेगाना {{consultantAddress}} बीच सम्पन्न भएको छ।`,
        en: `This Retainer is made between {{clientName}}, of {{clientAddress}}, and {{consultantName}}, of {{consultantAddress}}.`,
      },
    },
    {
      id: "scope",
      heading: { ne: "दायरा", en: "Scope" },
      body: {
        ne: `परामर्शदाताले देहायको विषयमा परामर्श उपलब्ध गराउनेछ: {{scope}}`,
        en: `The Consultant shall advise on the following: {{scope}}`,
      },
    },
    {
      id: "fee",
      heading: { ne: "शुल्क तथा समय", en: "Fee and hours" },
      body: {
        ne: `मासिक शुल्क रु. {{monthlyFeeNpr}} हुनेछ, जसमा महिनाको {{includedHours}} घण्टा समावेश छ।`,
        en: `The monthly fee is NPR {{monthlyFeeNpr}}, which includes {{includedHours}} hours a month.`,
      },
    },
    {
      id: "extra-hours",
      heading: { ne: "थप घण्टा", en: "Additional hours" },
      when: { field: "extraHourlyNpr", op: "truthy" },
      body: {
        ne: `समावेश घण्टाभन्दा बढी काम गर्नुपरेमा प्रति घण्टा रु. {{extraHourlyNpr}} का दरले छुट्टै शुल्क लाग्नेछ। थप घण्टा सुरु गर्नुअघि सेवाग्राहीको सहमति लिइनेछ।`,
        en: `Work beyond the included hours is charged at NPR {{extraHourlyNpr}} per hour, and the Client's agreement is obtained before those hours begin.`,
      },
    },
    {
      id: "independent",
      heading: { ne: "स्वतन्त्र हैसियत", en: "Independent contractor" },
      locked: true,
      body: {
        ne: `परामर्शदाता स्वतन्त्र हैसियतमा काम गर्नेछन् र यो सम्झौताले रोजगारदाता-श्रमिक सम्बन्ध सिर्जना गर्ने छैन।`,
        en: `The Consultant acts independently and this agreement does not create an employment relationship.`,
      },
    },
    {
      id: "termination",
      heading: { ne: "अन्त्य", en: "Termination" },
      body: {
        ne: `कुनै पक्षले {{noticeDays}} दिनको लिखित सूचना दिई सम्झौता अन्त्य गर्न सक्नेछ।`,
        en: `Either party may end this retainer on {{noticeDays}} days' written notice.`,
      },
    },
    governingLawClause(AGENCY_SERVICE),
  ],
};

/* ------------------------------------------------------------------ internship */

/**
 * Internship agreement.
 *
 * Carries the same substance-over-label warning as the freelance agreement, for the
 * same reason: an "intern" doing an employee's work at an employee's hours is an
 * employee, and calling the arrangement an internship does not change what the
 * Labour Act requires.
 */
export const internshipAgreement: Template = {
  slug: "internship-agreement",
  category: "employment",
  priceNpr: 399,
  title: { ne: "इन्टर्नसिप सम्झौता", en: "Internship Agreement" },
  summary: {
    ne: "सिकाइका लागि गरिने इन्टर्नसिपको सम्झौता। वास्तवमा रोजगारी भएमा श्रम ऐन लागू हुने कुरा स्पष्ट पारिएको।",
    en: "Agreement for a learning internship, written to make plain when the Labour Act applies regardless of the label.",
  },
  governingAct: LABOUR.writtenContract,
  review: pendingReview(),
  execution: [
    EXECUTION.bothSign,
    {
      ne: "इन्टर्नले नियमित कर्मचारीसरह काम गरेको र नियन्त्रणमा रहेको देखिएमा श्रम ऐन, २०७४ लागू हुन्छ — नाम जे राखे पनि।",
      en: "If the intern in substance does an employee's work under an employer's direction, the Labour Act 2074 applies whatever the document is called.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("organisationName", { ne: "संस्थाको नाम", en: "Organisation name" }),
        addressField("organisationAddress", { ne: "संस्थाको ठेगाना", en: "Organisation address" }),
        nameField("internName", { ne: "इन्टर्नको नाम", en: "Intern's name" }),
        addressField("internAddress", { ne: "इन्टर्नको ठेगाना", en: "Intern's address" }),
      ],
    },
    {
      id: "terms",
      title: { ne: "इन्टर्नसिपका सर्त", en: "Terms" },
      fields: [
        {
          id: "learningObjectives",
          type: "textarea",
          required: true,
          label: { ne: "सिकाइका उद्देश्य", en: "Learning objectives" },
          help: {
            ne: "इन्टर्नसिपको उद्देश्य सिकाइ हो। सिकाइ नभई काम मात्र भएमा त्यो रोजगारी हो।",
            en: "An internship is for learning. If there is no learning and only work, the arrangement is employment.",
          },
        },
        bsDateField("startDateBs", { ne: "सुरु मिति (वि.सं.)", en: "Start date (BS)" }),
        {
          id: "durationMonths",
          type: "number",
          required: true,
          label: { ne: "अवधि (महिना)", en: "Duration (months)" },
        },
        {
          id: "weeklyHours",
          type: "number",
          required: true,
          label: { ne: "साप्ताहिक घण्टा", en: "Hours per week" },
        },
        moneyField("stipendNpr", { ne: "मासिक भत्ता (रु.)", en: "Monthly stipend (NPR)" }, {
          ne: `भत्ता दिनु अनिवार्य नभए पनि पूर्ण समय काम गराउने अवस्थामा न्यूनतम पारिश्रमिक (${formatNpr(MIN_MONTHLY_WAGE_NPR, "ne")}) सम्बन्धी प्रश्न उठ्न सक्दछ।`,
          en: `A stipend is not always required, but where an intern works full hours the minimum wage (${formatNpr(MIN_MONTHLY_WAGE_NPR)}) becomes a live question.`,
        }, false),
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "सम्झौताको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: LABOUR.writtenContract,
      body: {
        ne: `यो इन्टर्नसिप सम्झौता {{organisationName}}, ठेगाना {{organisationAddress}} र {{internName}}, ठेगाना {{internAddress}} बीच सम्पन्न भएको छ।`,
        en: `This Internship Agreement is made between {{organisationName}}, of {{organisationAddress}}, and {{internName}}, of {{internAddress}}.`,
      },
    },
    {
      id: "purpose",
      heading: { ne: "उद्देश्य", en: "Purpose" },
      body: {
        ne: `यो इन्टर्नसिपको उद्देश्य देहायबमोजिमको सिकाइ हो:\n\n{{learningObjectives}}`,
        en: `The purpose of this internship is the following learning:\n\n{{learningObjectives}}`,
      },
    },
    {
      id: "duration",
      heading: { ne: "अवधि तथा समय", en: "Duration and hours" },
      body: {
        ne: `इन्टर्नसिप {{startDateBs}} देखि {{durationMonths}} महिनासम्म, साप्ताहिक {{weeklyHours}} घण्टाका दरले सञ्चालन हुनेछ।`,
        en: `The internship runs from {{startDateBs}} for {{durationMonths}} months, at {{weeklyHours}} hours a week.`,
      },
    },
    {
      id: "stipend",
      heading: { ne: "भत्ता", en: "Stipend" },
      when: { field: "stipendNpr", op: "truthy" },
      body: {
        ne: `संस्थाले इन्टर्नलाई मासिक रु. {{stipendNpr}} भत्ता उपलब्ध गराउनेछ।`,
        en: `The organisation shall pay the intern a stipend of NPR {{stipendNpr}} a month.`,
      },
    },
    {
      id: "substance",
      heading: { ne: "वास्तविक सम्बन्ध", en: "The substance of the arrangement" },
      locked: true,
      citation: LABOUR.writtenContract,
      body: {
        ne: `यो सम्झौता सिकाइका लागि हो र रोजगारी करार होइन। तर काम गर्ने तरिका, समय र नियन्त्रणका आधारमा वास्तविक सम्बन्ध रोजगारीको देखिएमा श्रम ऐन, २०७४ का व्यवस्था यस सम्झौताको नामले असर नपारी लागू हुनेछन्।`,
        en: `This agreement is for learning and is not a contract of employment. If, on the substance of the arrangement — the hours, the direction and the degree of control — the relationship is in fact employment, the Labour Act 2074 applies regardless of what this document is called.`,
      },
    },
    {
      id: "certificate",
      heading: { ne: "प्रमाणपत्र", en: "Certificate" },
      body: {
        ne: `इन्टर्नसिप सन्तोषजनक रूपमा पूरा भएमा संस्थाले प्रमाणपत्र उपलब्ध गराउनेछ।`,
        en: `On satisfactory completion the organisation shall issue a certificate.`,
      },
    },
    governingLawClause(CONTRACT),
  ],
};

/* ------------------------------------------------------------------ non-compete */

/**
 * Non-compete and non-solicitation.
 *
 * Sold with a warning attached rather than as a weapon. A restraint wider than the
 * interest it protects may simply not be enforced, which means an employer who
 * over-drafts ends up with nothing — the opposite of what they paid for.
 */
export const nonCompete: Template = {
  slug: "non-compete",
  category: "employment",
  priceNpr: 599,
  title: { ne: "प्रतिस्पर्धा नगर्ने सम्झौता", en: "Non-Compete and Non-Solicitation" },
  summary: {
    ne: "रोजगारी वा सेवा अन्त्यपछि प्रतिस्पर्धा र ग्राहक/कर्मचारी तान्ने कार्यमा बन्देज लगाउने सम्झौता। अत्यधिक बन्देज कार्यान्वयन नहुन सक्दछ।",
    en: "Restricts competing and soliciting after an engagement ends. A restraint drawn too wide may not be enforced at all.",
  },
  governingAct: RESTRAINT,
  review: pendingReview(),
  execution: [
    EXECUTION.bothSign,
    {
      ne: "अवधि, क्षेत्र वा कामको दायरा अनावश्यक फराकिलो भएमा अदालतले बन्देज कार्यान्वयन नगर्न सक्दछ। बचाउनुपर्ने वास्तविक हितसम्म मात्र सीमित राख्नुहोस्।",
      en: "A court may decline to enforce a restraint whose duration, area or scope is wider than the interest it protects. Keep it to what genuinely needs protecting.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("companyName", { ne: "संस्थाको नाम", en: "Company name" }),
        addressField("companyAddress", { ne: "संस्थाको ठेगाना", en: "Company address" }),
        nameField("personName", { ne: "व्यक्तिको नाम", en: "Person's name" }),
        addressField("personAddress", { ne: "व्यक्तिको ठेगाना", en: "Person's address" }),
      ],
    },
    {
      id: "restraint",
      title: { ne: "बन्देजका सर्त", en: "The restraint" },
      intro: {
        ne: "जति साँघुरो बन्देज, त्यति नै कार्यान्वयन हुने सम्भावना।",
        en: "The narrower the restraint, the likelier it is to be enforced. Breadth is not strength here.",
      },
      fields: [
        {
          id: "protectedInterest",
          type: "textarea",
          required: true,
          label: { ne: "बचाउनुपर्ने हित", en: "The interest being protected" },
          citation: RESTRAINT,
          help: {
            ne: "जस्तै: ग्राहक सूची, मूल्य संरचना, प्राविधिक जानकारी। सामान्य प्रतिस्पर्धा रोक्नु मात्र वैध हित होइन।",
            en: "For example: a client list, pricing structure, technical know-how. Simply not wanting competition is not on its own an interest the law protects.",
          },
        },
        {
          id: "restraintMonths",
          type: "number",
          required: true,
          label: { ne: "बन्देजको अवधि (महिना)", en: "Duration of the restraint (months)" },
        },
        {
          id: "territory",
          type: "text",
          required: true,
          label: { ne: "क्षेत्र", en: "Territory" },
        },
        yesNoField(
          "includesNonSolicit",
          { ne: "ग्राहक/कर्मचारी नतान्ने बन्देज समावेश?", en: "Include non-solicitation?" },
          { ne: "समावेश", en: "Yes" },
          { ne: "समावेश छैन", en: "No" },
          {
            ne: "ग्राहक र कर्मचारी नतान्ने बन्देज सामान्यतया पूर्ण प्रतिस्पर्धा बन्देजभन्दा बढी कार्यान्वयनयोग्य हुन्छ।",
            en: "A non-solicitation clause is usually easier to enforce than a full ban on competing, because it is narrower.",
          },
        ),
        moneyField("compensationNpr", { ne: "बन्देज बापत प्रतिफल (रु.)", en: "Compensation for the restraint (NPR)" }, {
          ne: "बन्देज बापत छुट्टै प्रतिफल दिँदा सम्झौता कार्यान्वयनयोग्य हुने सम्भावना बढ्दछ।",
          en: "Paying separately for the restraint materially improves the odds of it being upheld.",
        }, false),
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "सम्झौताको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: RESTRAINT,
      body: {
        ne: `यो सम्झौता {{companyName}}, ठेगाना {{companyAddress}} र {{personName}}, ठेगाना {{personAddress}} बीच सम्पन्न भएको छ।`,
        en: `This agreement is made between {{companyName}}, of {{companyAddress}}, and {{personName}}, of {{personAddress}}.`,
      },
    },
    {
      id: "interest",
      heading: { ne: "बचाउनुपर्ने हित", en: "The protected interest" },
      citation: RESTRAINT,
      body: {
        ne: `यो बन्देज देहायको हित बचाउने प्रयोजनका लागि मात्र राखिएको हो:\n\n{{protectedInterest}}`,
        en: `This restraint exists solely to protect the following interest:\n\n{{protectedInterest}}`,
      },
    },
    {
      id: "restraint",
      heading: { ne: "प्रतिस्पर्धा बन्देज", en: "Restraint on competing" },
      body: {
        ne: `सम्बन्ध अन्त्य भएको मितिले {{restraintMonths}} महिनासम्म {{territory}} क्षेत्रभित्र माथि उल्लिखित हितसँग प्रत्यक्ष प्रतिस्पर्धा हुने कारोबारमा संलग्न नहुन मञ्जुर गरिएको छ।`,
        en: `For {{restraintMonths}} months after the engagement ends, the person agrees not to engage within {{territory}} in business directly competing with the interest described above.`,
      },
    },
    {
      id: "non-solicit",
      heading: { ne: "ग्राहक तथा कर्मचारी", en: "Non-solicitation" },
      when: { field: "includesNonSolicit", op: "eq", value: "yes" },
      body: {
        ne: `सोही अवधिभित्र संस्थाका ग्राहक वा कर्मचारीलाई संस्थाबाट अलग गराउने उद्देश्यले सम्पर्क नगर्न मञ्जुर गरिएको छ।`,
        en: `During the same period the person agrees not to approach the company's clients or staff with a view to taking them away from it.`,
      },
    },
    {
      id: "compensation",
      heading: { ne: "प्रतिफल", en: "Compensation" },
      when: { field: "compensationNpr", op: "truthy" },
      body: {
        ne: `यस बन्देज बापत संस्थाले रु. {{compensationNpr}} प्रतिफल उपलब्ध गराउनेछ।`,
        en: `The company shall pay NPR {{compensationNpr}} in consideration of this restraint.`,
      },
    },
    {
      id: "reasonableness",
      heading: { ne: "बन्देजको सीमा", en: "Limits on the restraint" },
      locked: true,
      citation: RESTRAINT,
      body: {
        ne: `यो बन्देज माथि उल्लिखित हित बचाउन आवश्यक हदसम्म मात्र लागू हुनेछ। कुनै सर्त अनुचित रूपमा फराकिलो ठहरिएमा सो हदसम्म मात्र सीमित गरी बाँकी सर्त कायम रहनेछन्। यस्तो बन्देज कार्यान्वयन हुने वा नहुने अन्ततः अदालतले तय गर्दछ।`,
        en: `This restraint applies only so far as is necessary to protect the interest described above. If any term is found unreasonably wide, it is to be read down to what is reasonable and the remainder stands. Whether such a restraint is enforceable is ultimately for a court to decide.`,
      },
    },
    governingLawClause(RESTRAINT),
  ],
};
