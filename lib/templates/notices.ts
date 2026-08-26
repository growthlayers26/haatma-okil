import type { Template } from "../types";
import { TERMINATION_NOTICE, LEASE, LABOUR, SSF } from "../nepal";
import { pendingReview, nameField, addressField, bsDateField, moneyField } from "./common";

/*
 * Notices and certificates.
 *
 * These differ from the agreement templates in one important way: they are unilateral.
 * Nobody countersigns a notice, so its legal effect turns entirely on whether it was
 * served correctly and in time. Each of these therefore says how to serve it, not
 * just what to say.
 */

/* ------------------------------------------------------------------ rent termination */

/** Notice ending a tenancy. Its whole effect depends on service and notice period. */
export const rentTerminationNotice: Template = {
  slug: "rent-termination-notice",
  category: "property",
  priceNpr: 299,
  title: { ne: "बहाल अन्त्यको सूचना", en: "Notice to Terminate Tenancy" },
  summary: {
    ne: "घरबहाल सम्झौता अन्त्य गर्न दिइने लिखित सूचना। घरधनी वा बहालवाला दुवैले प्रयोग गर्न सकिने।",
    en: "Written notice ending a tenancy, usable by either the landlord or the tenant.",
  },
  governingAct: TERMINATION_NOTICE,
  review: pendingReview(),
  execution: [
    {
      ne: "सूचना लिखित रूपमा दिनुपर्नेछ र बुझेको प्रमाण राख्नुपर्नेछ — बुझेको भरपाई, दर्ता गरिएको हुलाक रसिद वा साक्षीको हस्ताक्षर।",
      en: "The notice must be in writing and you must keep proof of service — a signed acknowledgement, a registered post receipt, or a witness signature.",
    },
    {
      ne: "प्रमाण नभएको सूचना विवादमा 'पाएकै छैन' भनी अस्वीकार गर्न सकिन्छ।",
      en: "Without proof of service the other side can simply deny receiving it, and usually does.",
    },
    {
      ne: "सम्झौतामा तोकिएको सूचना अवधि पालना नगरी दिइएको सूचनाले बहाल अन्त्य नहुन सक्दछ।",
      en: "A notice that does not honour the notice period in the tenancy agreement may not end the tenancy at all.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        {
          id: "sentBy",
          type: "select",
          required: true,
          label: { ne: "सूचना कसले दिँदैछ?", en: "Who is giving this notice?" },
          options: [
            { value: "landlord", label: { ne: "घरधनी", en: "The landlord" } },
            { value: "tenant", label: { ne: "बहालवाला", en: "The tenant" } },
          ],
        },
        nameField("senderName", { ne: "सूचना दिनेको नाम", en: "Name of the sender" }),
        addressField("senderAddress", { ne: "सूचना दिनेको ठेगाना", en: "Sender's address" }),
        nameField("recipientName", { ne: "सूचना पाउनेको नाम", en: "Name of the recipient" }),
        addressField("recipientAddress", { ne: "सूचना पाउनेको ठेगाना", en: "Recipient's address" }),
      ],
    },
    {
      id: "tenancy",
      title: { ne: "बहालको विवरण", en: "The tenancy" },
      fields: [
        addressField("propertyAddress", { ne: "बहालमा रहेको सम्पत्तिको ठेगाना", en: "Address of the property" }),
        bsDateField("agreementDateBs", { ne: "बहाल सम्झौताको मिति (वि.सं.)", en: "Date of the tenancy agreement (BS)" }),
        bsDateField("noticeDateBs", { ne: "सूचना दिइएको मिति (वि.सं.)", en: "Date of this notice (BS)" }),
        bsDateField("vacateDateBs", { ne: "बहाल अन्त्य हुने मिति (वि.सं.)", en: "Tenancy ends on (BS)" }),
        {
          id: "reason",
          type: "textarea",
          label: { ne: "कारण", en: "Reason" },
          help: {
            ne: "कारण खुलाउनु अनिवार्य नभए पनि खुलाउँदा पछि विवाद हुने सम्भावना घट्दछ।",
            en: "Stating a reason is not always required, but doing so reduces the scope for a later dispute.",
          },
        },
        moneyField("depositNpr", { ne: "फिर्ता गर्नुपर्ने धरौटी (रु.)", en: "Deposit to be returned (NPR)" }, {
          ne: "धरौटी फिर्ताको कुरा सूचनामै उल्लेख गर्दा पछि माग्न सजिलो हुन्छ।",
          en: "Naming the deposit in the notice itself makes it materially easier to recover later.",
        }, false),
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "सूचना", en: "Notice" },
      locked: true,
      citation: TERMINATION_NOTICE,
      body: {
        ne: `मिति: {{noticeDateBs}}\n\nश्री {{recipientName}}\n{{recipientAddress}}\n\nविषय: बहाल सम्झौता अन्त्य गरिएको बारे।`,
        en: `Date: {{noticeDateBs}}\n\nTo: {{recipientName}}\n{{recipientAddress}}\n\nSubject: Termination of tenancy agreement.`,
      },
    },
    {
      id: "body",
      heading: { ne: "सूचनाको व्यहोरा", en: "Notice" },
      citation: LEASE,
      body: {
        ne: `{{propertyAddress}} मा अवस्थित सम्पत्ति सम्बन्धमा मिति {{agreementDateBs}} मा सम्पन्न भएको बहाल सम्झौता मिति {{vacateDateBs}} देखि अन्त्य गरिएको व्यहोरा यसै सूचनाद्वारा जानकारी गराइन्छ।`,
        en: `This notice is to inform you that the tenancy agreement dated {{agreementDateBs}} in respect of the property at {{propertyAddress}} is terminated with effect from {{vacateDateBs}}.`,
      },
    },
    {
      id: "reason",
      heading: { ne: "कारण", en: "Reason" },
      when: { field: "reason", op: "truthy" },
      body: {
        ne: `बहाल अन्त्य गर्नुको कारण: {{reason}}`,
        en: `The reason for terminating the tenancy is: {{reason}}`,
      },
    },
    {
      id: "deposit",
      heading: { ne: "धरौटी फिर्ता", en: "Return of deposit" },
      when: { field: "depositNpr", op: "truthy" },
      body: {
        ne: `बहाल अन्त्य भई सम्पत्ति सुपुर्द भएपछि धरौटी बापतको रु. {{depositNpr}} फिर्ता गर्नुपर्नेछ। सम्पत्तिमा सामान्य प्रयोगबाहेकको क्षति भएमा सो कट्टा गर्न सकिनेछ।`,
        en: `On termination and handover of the property, the deposit of NPR {{depositNpr}} falls due for return. Deductions may be made only for damage beyond normal wear and tear.`,
      },
    },
    {
      id: "handover",
      heading: { ne: "सम्पत्ति सुपुर्दगी", en: "Handover" },
      locked: true,
      body: {
        ne: `बहाल अन्त्य हुने मितिसम्ममा सम्पत्ति सफा अवस्थामा सुपुर्द गर्नुपर्नेछ र बाँकी बहाल, बिजुली तथा पानीको महसुल चुक्ता गर्नुपर्नेछ। दुवै पक्षले सुपुर्दगीको समयमा मिटर रिडिङ र सम्पत्तिको अवस्था लिखित रूपमा टिपोट गर्नु उपयुक्त हुन्छ।`,
        en: `The property must be handed over in clean condition by the termination date, with all outstanding rent, electricity and water charges settled. Both parties should record meter readings and the condition of the property in writing at handover.`,
      },
    },
    {
      id: "sign",
      heading: { ne: "सूचना दिने", en: "Given by" },
      locked: true,
      body: {
        ne: `{{senderName}}\n{{senderAddress}}`,
        en: `{{senderName}}\n{{senderAddress}}`,
      },
    },
  ],
};

/* ------------------------------------------------------------------ salary certificate */

/**
 * Salary certificate.
 *
 * Requested constantly — by embassies for visas, by banks for loans, by landlords.
 * Issued by the employer, so the risk sits with accuracy rather than negotiation: a
 * certificate that overstates income to help someone get a visa is a document the
 * employer signed.
 */
export const salaryCertificate: Template = {
  slug: "salary-certificate",
  category: "employment",
  priceNpr: 199,
  title: { ne: "तलब प्रमाणपत्र", en: "Salary Certificate" },
  summary: {
    ne: "रोजगारदाताले जारी गर्ने तलब प्रमाणपत्र। भिसा, बैंक ऋण र बहालका लागि आवश्यक पर्ने कागजात।",
    en: "Salary certificate issued by an employer. Needed for visa applications, bank loans and tenancy checks.",
  },
  governingAct: LABOUR.remuneration,
  review: pendingReview(),
  execution: [
    {
      ne: "कम्पनीको लेटरहेडमा जारी गर्नुपर्नेछ र अधिकारप्राप्त व्यक्तिको हस्ताक्षर तथा कम्पनीको छाप हुनुपर्नेछ।",
      en: "Must be issued on company letterhead, signed by an authorised person and bearing the company stamp.",
    },
    {
      ne: "गलत विवरण उल्लेख गरिएको प्रमाणपत्रको दायित्व जारी गर्ने रोजगारदातामा रहन्छ।",
      en: "Responsibility for a certificate containing false particulars rests with the employer who issued it.",
    },
  ],
  steps: [
    {
      id: "employer",
      title: { ne: "रोजगारदाता", en: "The employer" },
      fields: [
        nameField("employerName", { ne: "रोजगारदाताको नाम", en: "Employer name" }),
        addressField("employerAddress", { ne: "रोजगारदाताको ठेगाना", en: "Employer address" }),
        nameField("issuerName", { ne: "जारी गर्नेको नाम", en: "Issued by (name)" }),
        nameField("issuerDesignation", { ne: "जारी गर्नेको पद", en: "Issued by (designation)" }),
        bsDateField("issueDateBs", { ne: "जारी मिति (वि.सं.)", en: "Date of issue (BS)" }),
      ],
    },
    {
      id: "employee",
      title: { ne: "कर्मचारीको विवरण", en: "The employee" },
      fields: [
        nameField("employeeName", { ne: "कर्मचारीको नाम", en: "Employee name" }),
        nameField("designation", { ne: "पद", en: "Designation" }),
        bsDateField("joinDateBs", { ne: "काम सुरु गरेको मिति (वि.सं.)", en: "Date joined (BS)" }),
        moneyField("basicSalaryNpr", { ne: "मासिक आधारभूत तलब (रु.)", en: "Monthly basic salary (NPR)" }),
        moneyField("allowancesNpr", { ne: "मासिक भत्ता (रु.)", en: "Monthly allowances (NPR)" }, undefined, false),
        {
          id: "purpose",
          type: "text",
          label: { ne: "प्रयोजन", en: "Purpose" },
          placeholder: { ne: "जस्तै: भिसा आवेदन", en: "e.g. visa application" },
          help: {
            ne: "प्रयोजन उल्लेख गर्दा प्रमाणपत्र अन्यत्र दुरुपयोग हुने सम्भावना घट्दछ।",
            en: "Naming the purpose reduces the chance of the certificate being reused for something else.",
          },
        },
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "प्रमाणपत्र", en: "Certificate" },
      locked: true,
      body: {
        ne: `{{employerName}}\n{{employerAddress}}\n\nमिति: {{issueDateBs}}\n\nविषय: तलब प्रमाणपत्र।`,
        en: `{{employerName}}\n{{employerAddress}}\n\nDate: {{issueDateBs}}\n\nSubject: Salary Certificate.`,
      },
    },
    {
      id: "body",
      heading: { ne: "प्रमाणित व्यहोरा", en: "Certification" },
      citation: LABOUR.remuneration,
      body: {
        ne: `यस {{employerName}} मा {{employeeName}} मिति {{joinDateBs}} देखि {{designation}} पदमा कार्यरत रहनुभएको व्यहोरा प्रमाणित गरिन्छ।`,
        en: `This is to certify that {{employeeName}} has been employed at {{employerName}} as {{designation}} since {{joinDateBs}}.`,
      },
    },
    {
      id: "salary",
      heading: { ne: "पारिश्रमिक", en: "Remuneration" },
      body: {
        ne: `निजको मासिक आधारभूत पारिश्रमिक रु. {{basicSalaryNpr}} रहेको छ।`,
        en: `Their monthly basic remuneration is NPR {{basicSalaryNpr}}.`,
      },
    },
    {
      id: "allowances",
      heading: { ne: "भत्ता", en: "Allowances" },
      when: { field: "allowancesNpr", op: "truthy" },
      body: {
        ne: `आधारभूत तलबका अतिरिक्त निजले मासिक रु. {{allowancesNpr}} भत्ता प्राप्त गर्नुहुन्छ।`,
        en: `In addition to basic salary, they receive monthly allowances of NPR {{allowancesNpr}}.`,
      },
    },
    {
      id: "deductions",
      heading: { ne: "कट्टी", en: "Statutory deductions" },
      locked: true,
      body: {
        ne: `प्रचलित कानुनबमोजिम सामाजिक सुरक्षा कोषमा कर्मचारीतर्फ ${SSF.employeePercent} प्रतिशत र रोजगारदातातर्फ ${SSF.employerPercent} प्रतिशत योगदान तथा लाग्ने आयकर कट्टा गरिन्छ।`,
        en: `Statutory deductions are made in accordance with prevailing law, comprising Social Security Fund contributions of ${SSF.employeePercent}% from the employee and ${SSF.employerPercent}% from the employer, together with applicable income tax.`,
      },
    },
    {
      id: "purpose",
      heading: { ne: "प्रयोजन", en: "Purpose" },
      when: { field: "purpose", op: "truthy" },
      body: {
        ne: `यो प्रमाणपत्र {{purpose}} को प्रयोजनका लागि निजको अनुरोधमा जारी गरिएको हो।`,
        en: `This certificate is issued at the employee's request for the purpose of {{purpose}}.`,
      },
    },
    {
      id: "issuer",
      heading: { ne: "जारी गर्ने", en: "Issued by" },
      locked: true,
      body: {
        ne: `{{issuerName}}\n{{issuerDesignation}}\n{{employerName}}\n\n(कम्पनीको छाप)`,
        en: `{{issuerName}}\n{{issuerDesignation}}\n{{employerName}}\n\n(Company stamp)`,
      },
    },
  ],
};

/* ------------------------------------------------------------------ experience letter */

/** Experience letter — the document a departing employee needs and often cannot get. */
export const experienceLetter: Template = {
  slug: "experience-letter",
  category: "employment",
  priceNpr: 199,
  title: { ne: "कार्य अनुभव पत्र", en: "Experience Letter" },
  summary: {
    ne: "रोजगारदाताले कर्मचारीलाई दिने कार्य अनुभवको प्रमाण। नयाँ रोजगारी र वैदेशिक अवसरका लागि आवश्यक।",
    en: "Employer's confirmation of an employee's service. Needed for a new job and for opportunities abroad.",
  },
  governingAct: LABOUR.writtenContract,
  review: pendingReview(),
  execution: [
    {
      ne: "कम्पनीको लेटरहेडमा, अधिकारप्राप्त व्यक्तिको हस्ताक्षर र कम्पनीको छापसहित जारी गर्नुपर्नेछ।",
      en: "Issue on company letterhead, signed by an authorised person and stamped.",
    },
  ],
  steps: [
    {
      id: "employer",
      title: { ne: "रोजगारदाता", en: "The employer" },
      fields: [
        nameField("employerName", { ne: "रोजगारदाताको नाम", en: "Employer name" }),
        addressField("employerAddress", { ne: "रोजगारदाताको ठेगाना", en: "Employer address" }),
        nameField("issuerName", { ne: "जारी गर्नेको नाम", en: "Issued by (name)" }),
        nameField("issuerDesignation", { ne: "जारी गर्नेको पद", en: "Issued by (designation)" }),
        bsDateField("issueDateBs", { ne: "जारी मिति (वि.सं.)", en: "Date of issue (BS)" }),
      ],
    },
    {
      id: "service",
      title: { ne: "सेवाको विवरण", en: "The service" },
      fields: [
        nameField("employeeName", { ne: "कर्मचारीको नाम", en: "Employee name" }),
        nameField("designation", { ne: "अन्तिम पद", en: "Final designation" }),
        bsDateField("joinDateBs", { ne: "काम सुरु गरेको मिति (वि.सं.)", en: "Date joined (BS)" }),
        bsDateField("endDateBs", { ne: "काम छाडेको मिति (वि.सं.)", en: "Date left (BS)" }),
        {
          id: "responsibilities",
          type: "textarea",
          label: { ne: "मुख्य जिम्मेवारी", en: "Principal responsibilities" },
        },
        {
          id: "includeConduct",
          type: "select",
          required: true,
          label: { ne: "आचरणबारे टिप्पणी समावेश गर्ने?", en: "Include a remark on conduct?" },
          help: {
            ne: "आचरणबारे लेखिएको कुरा पछि प्रमाणित गर्नुपर्ने हुन सक्दछ।",
            en: "Anything said about conduct may later have to be stood behind, so include it only if it is accurate.",
          },
          options: [
            { value: "yes", label: { ne: "समावेश गर्ने", en: "Include" } },
            { value: "no", label: { ne: "समावेश नगर्ने", en: "Omit" } },
          ],
        },
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "पत्रको शीर्ष", en: "Letterhead" },
      locked: true,
      body: {
        ne: `{{employerName}}\n{{employerAddress}}\n\nमिति: {{issueDateBs}}\n\nविषय: कार्य अनुभवको प्रमाण।`,
        en: `{{employerName}}\n{{employerAddress}}\n\nDate: {{issueDateBs}}\n\nSubject: Confirmation of service.`,
      },
    },
    {
      id: "body",
      heading: { ne: "प्रमाणित व्यहोरा", en: "Confirmation" },
      citation: LABOUR.writtenContract,
      body: {
        ne: `{{employeeName}} यस {{employerName}} मा मिति {{joinDateBs}} देखि {{endDateBs}} सम्म {{designation}} पदमा कार्यरत रहनुभएको व्यहोरा प्रमाणित गरिन्छ।`,
        en: `This is to confirm that {{employeeName}} was employed at {{employerName}} as {{designation}} from {{joinDateBs}} to {{endDateBs}}.`,
      },
    },
    {
      id: "responsibilities",
      heading: { ne: "जिम्मेवारी", en: "Responsibilities" },
      when: { field: "responsibilities", op: "truthy" },
      body: {
        ne: `निजको मुख्य जिम्मेवारी देहायबमोजिम रहेको थियो:\n\n{{responsibilities}}`,
        en: `Their principal responsibilities were as follows:\n\n{{responsibilities}}`,
      },
    },
    {
      id: "conduct",
      heading: { ne: "आचरण", en: "Conduct" },
      when: { field: "includeConduct", op: "eq", value: "yes" },
      body: {
        ne: `कार्यकालभर निजको आचरण सन्तोषजनक रहेको थियो। निजको भावी कार्यमा सफलताको शुभकामना व्यक्त गर्दछौं।`,
        en: `Their conduct throughout their service was satisfactory. We wish them well in their future work.`,
      },
    },
    {
      id: "issuer",
      heading: { ne: "जारी गर्ने", en: "Issued by" },
      locked: true,
      body: {
        ne: `{{issuerName}}\n{{issuerDesignation}}\n{{employerName}}\n\n(कम्पनीको छाप)`,
        en: `{{issuerName}}\n{{issuerDesignation}}\n{{employerName}}\n\n(Company stamp)`,
      },
    },
  ],
};
