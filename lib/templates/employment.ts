import type { Template } from "../types";
import {
  LABOUR,
  MIN_MONTHLY_WAGE_NPR,
  MAX_PROBATION_MONTHS,
  MAX_WEEKLY_HOURS,
  LEAVE_FLOOR,
  SSF,
  formatNpr,
  toNepaliDigits,
} from "../nepal";

/**
 * Statutory constants embedded in Nepali clause text need Devanagari numerals —
 * they are baked in at module load, so the renderer's per-answer formatting never
 * sees them. `ne()` is that conversion; `{{token}}` values are handled by the renderer.
 */
const ne = toNepaliDigits;

/**
 * Employment contract under the Labour Act, 2074.
 *
 * §11 makes a written contract mandatory for every employee other than casual
 * workers, with a NPR 5,000–25,000 penalty for non-compliance. That obligation is
 * why this template leads the catalogue.
 */
export const employmentContract: Template = {
  slug: "employment-contract",
  category: "employment",
  priceNpr: 599,
  title: {
    ne: "रोजगार करार",
    en: "Employment Contract",
  },
  summary: {
    ne: "श्रम ऐन, २०७४ को दफा ११ बमोजिम अनिवार्य लिखित रोजगार करार। तलब, बिदा, र समाप्तिका सर्तहरू समावेश।",
    en: "The written employment contract mandated by Labour Act 2074 §11. Covers remuneration, statutory leave, working hours, and termination.",
  },
  governingAct: LABOUR.writtenContract,
  review: {
    name: { ne: "अधिवक्ता नियुक्ति बाँकी", en: "Advocate not yet assigned" },
    nbcLicence: null,
    reviewedOnBs: "2083-05-10",
    nextReviewBs: "2084-05-10",
  },
  execution: [
    {
      ne: "दुवै पक्षले प्रत्येक पृष्ठमा हस्ताक्षर गर्नुपर्नेछ र प्रत्येक पक्षले एक-एक प्रति राख्नुपर्नेछ।",
      en: "Both parties must sign every page, and each party must retain one original copy.",
    },
    {
      ne: "कम्तीमा एक जना साक्षीको हस्ताक्षर र सम्पर्क विवरण आवश्यक पर्दछ।",
      en: "At least one witness signature with contact details is required.",
    },
    {
      ne: "रोजगारदाताले श्रम कार्यालयमा दर्ता अभिलेख राख्नुपर्नेछ। यो कागजात डाउनलोड गर्दैमा करार सम्पन्न हुँदैन।",
      en: "The employer must maintain records for the Labour Office. Downloading this document does not by itself execute the contract.",
    },
  ],

  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      intro: {
        ne: "करारका दुवै पक्षको कानुनी पहिचान।",
        en: "Legal identification of both parties to the contract.",
      },
      fields: [
        {
          id: "employerName",
          type: "text",
          required: true,
          label: { ne: "रोजगारदाताको नाम", en: "Employer name" },
          placeholder: { ne: "जस्तै: हिमाल टेक प्रा.लि.", en: "e.g. Himal Tech Pvt. Ltd." },
        },
        {
          id: "employerRegNo",
          type: "text",
          label: { ne: "कम्पनी दर्ता नम्बर", en: "Company registration number" },
          help: {
            ne: "कम्पनी रजिस्ट्रारको कार्यालयबाट जारी दर्ता नम्बर।",
            en: "Registration number issued by the Office of the Company Registrar.",
          },
        },
        {
          id: "employerAddress",
          type: "textarea",
          required: true,
          label: { ne: "रोजगारदाताको ठेगाना", en: "Employer address" },
        },
        {
          id: "employeeName",
          type: "text",
          required: true,
          label: { ne: "श्रमिकको नाम", en: "Employee name" },
        },
        {
          id: "employeeCitizenshipNo",
          type: "text",
          required: true,
          label: { ne: "नागरिकता प्रमाणपत्र नम्बर", en: "Citizenship certificate number" },
          help: {
            ne: "श्रमिकको पहिचान स्थापित गर्न आवश्यक।",
            en: "Required to establish the employee's identity on the instrument.",
          },
        },
        {
          id: "employeeAddress",
          type: "textarea",
          required: true,
          label: { ne: "श्रमिकको ठेगाना", en: "Employee address" },
        },
      ],
    },

    {
      id: "role",
      title: { ne: "पद तथा कार्यस्थल", en: "Position and workplace" },
      fields: [
        {
          id: "position",
          type: "text",
          required: true,
          label: { ne: "पद", en: "Job title" },
        },
        {
          id: "workplace",
          type: "text",
          required: true,
          label: { ne: "कार्यस्थल", en: "Place of work" },
        },
        {
          id: "employmentType",
          type: "select",
          required: true,
          label: { ne: "रोजगारीको प्रकार", en: "Type of employment" },
          citation: LABOUR.writtenContract,
          help: {
            ne: "श्रम ऐन, २०७४ ले नियमित, समय-आधारित, कार्य-आधारित र आकस्मिक रोजगारी छुट्याएको छ।",
            en: "Labour Act 2074 distinguishes regular, time-based, work-based and casual employment. Casual workers are the only category exempt from a written contract.",
          },
          options: [
            { value: "regular", label: { ne: "नियमित", en: "Regular" } },
            { value: "time-based", label: { ne: "समय-आधारित", en: "Time-based" } },
            { value: "work-based", label: { ne: "कार्य-आधारित", en: "Work-based" } },
          ],
        },
        {
          id: "startDateBs",
          type: "date-bs",
          required: true,
          label: { ne: "सेवा प्रारम्भ मिति (वि.सं.)", en: "Start date (Bikram Sambat)" },
          placeholder: { ne: "२०८३-०५-१५", en: "2083-05-15" },
        },
      ],
    },

    {
      id: "remuneration",
      title: { ne: "पारिश्रमिक तथा सुविधा", en: "Remuneration and benefits" },
      intro: {
        ne: "न्यूनतम पारिश्रमिकभन्दा कम रकममा करार सिर्जना गर्न मिल्दैन।",
        en: "A contract below the statutory minimum wage cannot be generated.",
      },
      fields: [
        {
          id: "salaryNpr",
          type: "currency",
          required: true,
          label: { ne: "मासिक पारिश्रमिक (रु.)", en: "Monthly remuneration (NPR)" },
          citation: LABOUR.remuneration,
          help: {
            ne: `श्रम मन्त्रालयले तोकेको न्यूनतम मासिक पारिश्रमिक ${formatNpr(MIN_MONTHLY_WAGE_NPR, "ne")} हो।`,
            en: `The Ministry of Labour's minimum monthly remuneration is ${formatNpr(MIN_MONTHLY_WAGE_NPR)}. The wizard will not generate a contract below it.`,
          },
          rules: [
            {
              kind: "min",
              value: MIN_MONTHLY_WAGE_NPR,
              blocking: true,
              citation: LABOUR.remuneration,
              message: {
                ne: `पारिश्रमिक न्यूनतम ${formatNpr(MIN_MONTHLY_WAGE_NPR, "ne")} हुनुपर्दछ।`,
                en: `Remuneration must be at least ${formatNpr(MIN_MONTHLY_WAGE_NPR)}.`,
              },
            },
          ],
        },
        {
          id: "payDay",
          type: "number",
          required: true,
          label: { ne: "भुक्तानी दिन (महिनाको गते)", en: "Payment day of month" },
          rules: [
            {
              kind: "max",
              value: 32,
              blocking: true,
              citation: LABOUR.remuneration,
              message: {
                ne: "मान्य गते प्रविष्ट गर्नुहोस्।",
                en: "Enter a valid day of the Nepali month.",
              },
            },
          ],
        },
        {
          id: "probationMonths",
          type: "number",
          label: { ne: "परीक्षणकाल (महिना)", en: "Probation period (months)" },
          citation: LABOUR.probation,
          help: {
            ne: `परीक्षणकाल बढीमा ${ne(MAX_PROBATION_MONTHS)} महिनासम्म मात्र हुन सक्दछ।`,
            en: `Probation may not exceed ${MAX_PROBATION_MONTHS} months. Beyond that the employee becomes permanent by operation of law.`,
          },
          rules: [
            {
              kind: "max",
              value: MAX_PROBATION_MONTHS,
              blocking: true,
              citation: LABOUR.probation,
              message: {
                ne: `परीक्षणकाल ${ne(MAX_PROBATION_MONTHS)} महिनाभन्दा बढी हुन सक्दैन।`,
                en: `Probation cannot exceed ${MAX_PROBATION_MONTHS} months.`,
              },
            },
          ],
        },
      ],
    },

    {
      id: "hours",
      title: { ne: "काम गर्ने समय", en: "Working hours" },
      intro: {
        ne: "बिदा सम्बन्धी व्यवस्था कानुनद्वारा निर्धारित छ र घटाउन मिल्दैन।",
        en: "Leave entitlements are fixed by statute and are rendered as locked clauses. A contract may grant more, never less.",
      },
      fields: [
        {
          id: "weeklyHours",
          type: "number",
          required: true,
          label: { ne: "साप्ताहिक कार्यघण्टा", en: "Weekly working hours" },
          citation: LABOUR.workingHours,
          help: {
            ne: `साप्ताहिक बढीमा ${ne(MAX_WEEKLY_HOURS)} घण्टा, दैनिक ८ घण्टा।`,
            en: `A maximum of ${MAX_WEEKLY_HOURS} hours per week and 8 hours per day.`,
          },
          rules: [
            {
              kind: "max",
              value: MAX_WEEKLY_HOURS,
              blocking: true,
              citation: LABOUR.workingHours,
              message: {
                ne: `साप्ताहिक कार्यघण्टा ${ne(MAX_WEEKLY_HOURS)} भन्दा बढी हुन सक्दैन।`,
                en: `Weekly hours cannot exceed ${MAX_WEEKLY_HOURS}.`,
              },
            },
          ],
        },
        {
          id: "restDay",
          type: "select",
          required: true,
          label: { ne: "साप्ताहिक बिदा", en: "Weekly rest day" },
          options: [
            { value: "saturday", label: { ne: "शनिबार", en: "Saturday" } },
            { value: "sunday", label: { ne: "आइतबार", en: "Sunday" } },
          ],
        },
      ],
    },

    {
      id: "termination",
      title: { ne: "करार समाप्ति", en: "Termination" },
      fields: [
        {
          id: "noticeDays",
          type: "number",
          required: true,
          label: { ne: "सूचना अवधि (दिन)", en: "Notice period (days)" },
          citation: LABOUR.termination,
          help: {
            ne: "सेवा अवधिअनुसार कानुनी न्यूनतम सूचना अवधि फरक पर्दछ।",
            en: "The statutory minimum notice varies with length of service. Confirm the applicable period with the firm's advocate for long-serving employees.",
          },
        },
      ],
    },

    {
      id: "confidentiality",
      title: { ne: "गोपनीयता", en: "Confidentiality" },
      fields: [
        {
          id: "includeConfidentiality",
          type: "select",
          required: true,
          label: { ne: "गोपनीयता धारा समावेश गर्ने?", en: "Include a confidentiality clause?" },
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
      id: "preamble",
      heading: { ne: "करारको प्रारम्भ", en: "Preamble" },
      citation: LABOUR.writtenContract,
      locked: true,
      body: {
        ne: `यो रोजगार करार {{employerName}} (दर्ता नं. {{employerRegNo}}), ठेगाना {{employerAddress}} (यसपछि "रोजगारदाता" भनिने) र {{employeeName}} (नागरिकता प्रमाणपत्र नं. {{employeeCitizenshipNo}}), ठेगाना {{employeeAddress}} (यसपछि "श्रमिक" भनिने) बीच श्रम ऐन, २०७४ को दफा ११ बमोजिम सम्पन्न भएको छ।`,
        en: `This Employment Contract is made between {{employerName}} (registration no. {{employerRegNo}}), of {{employerAddress}} (the "Employer") and {{employeeName}} (citizenship certificate no. {{employeeCitizenshipNo}}), of {{employeeAddress}} (the "Employee"), pursuant to section 11 of the Labour Act, 2074.`,
      },
    },
    {
      id: "position",
      heading: { ne: "पद तथा कार्यस्थल", en: "Position and place of work" },
      body: {
        ne: `श्रमिकलाई {{position}} पदमा {{employmentType}} रोजगारीका रूपमा नियुक्त गरिएको छ। कार्यस्थल {{workplace}} रहनेछ र सेवा {{startDateBs}} देखि प्रारम्भ हुनेछ।`,
        en: `The Employee is engaged as {{position}} on a {{employmentType}} basis. The place of work is {{workplace}} and service commences on {{startDateBs}}.`,
      },
    },
    {
      id: "remuneration",
      heading: { ne: "पारिश्रमिक", en: "Remuneration" },
      citation: LABOUR.remuneration,
      body: {
        ne: `रोजगारदाताले श्रमिकलाई मासिक रु. {{salaryNpr}} पारिश्रमिक प्रत्येक नेपाली महिनाको {{payDay}} गतेभित्र भुक्तानी गर्नेछ। यो रकम श्रम मन्त्रालयले तोकेको न्यूनतम पारिश्रमिकभन्दा कम छैन।`,
        en: `The Employer shall pay the Employee monthly remuneration of NPR {{salaryNpr}}, payable on or before day {{payDay}} of each Nepali month. This amount is not less than the minimum remuneration prescribed by the Ministry of Labour.`,
      },
    },
    {
      id: "ssf",
      heading: { ne: "सामाजिक सुरक्षा कोष", en: "Social Security Fund" },
      locked: true,
      body: {
        ne: `प्रचलित कानुनबमोजिम श्रमिकको आधारभूत पारिश्रमिकको ${ne(SSF.employeePercent)} प्रतिशत श्रमिकबाट र ${ne(SSF.employerPercent)} प्रतिशत रोजगारदाताबाट सामाजिक सुरक्षा कोषमा जम्मा गरिनेछ।`,
        en: `In accordance with prevailing law, ${SSF.employeePercent}% of the Employee's basic remuneration shall be deducted and ${SSF.employerPercent}% contributed by the Employer to the Social Security Fund.`,
      },
    },
    {
      id: "probation",
      heading: { ne: "परीक्षणकाल", en: "Probation" },
      citation: LABOUR.probation,
      when: { field: "probationMonths", op: "truthy" },
      body: {
        ne: `श्रमिकको परीक्षणकाल {{probationMonths}} महिनाको हुनेछ। परीक्षणकाल सफलतापूर्वक पूरा भएपछि श्रमिक नियमित सेवामा स्थायी हुनेछ।`,
        en: `The Employee shall serve a probation period of {{probationMonths}} months. On successful completion the Employee is confirmed in regular service.`,
      },
    },
    {
      id: "hours",
      heading: { ne: "काम गर्ने समय", en: "Working hours" },
      citation: LABOUR.workingHours,
      body: {
        ne: `श्रमिकले साप्ताहिक {{weeklyHours}} घण्टा र दैनिक बढीमा ८ घण्टा काम गर्नेछ। {{restDay}} साप्ताहिक बिदाको दिन हुनेछ। तोकिएको समयभन्दा बढी काम गरेमा प्रचलित कानुनबमोजिम डेढी दरले अतिरिक्त समय भत्ता पाइनेछ।`,
        en: `The Employee shall work {{weeklyHours}} hours per week and no more than 8 hours in any day. {{restDay}} shall be the weekly rest day. Work beyond prescribed hours attracts overtime at one and a half times the ordinary rate, as required by law.`,
      },
    },
    {
      id: "leave",
      heading: { ne: "बिदा", en: "Leave" },
      citation: LABOUR.leave,
      locked: true,
      body: {
        ne: `श्रमिकले प्रचलित कानुनबमोजिम देहायको बिदा पाउनेछ: प्रत्येक ${ne(LEAVE_FLOOR.annualPerDaysWorked.per)} दिन काम गरेबापत १ दिन वार्षिक बिदा; वार्षिक ${ne(LEAVE_FLOOR.sickDaysPerYear)} दिन बिरामी बिदा; ${ne(LEAVE_FLOOR.maternityDays)} दिन प्रसूति बिदा; ${ne(LEAVE_FLOOR.paternityDays)} दिन पितृत्व बिदा; र ${ne(LEAVE_FLOOR.mourningDays)} दिन क्रियाकर्म बिदा। यी न्यूनतम व्यवस्था हुन् र यसभन्दा कम गर्न पाइने छैन।`,
        en: `The Employee is entitled to statutory leave as follows: one day of annual leave for every ${LEAVE_FLOOR.annualPerDaysWorked.per} days worked; ${LEAVE_FLOOR.sickDaysPerYear} days of sick leave per year; ${LEAVE_FLOOR.maternityDays} days of maternity leave; ${LEAVE_FLOOR.paternityDays} days of paternity leave; and ${LEAVE_FLOOR.mourningDays} days of mourning leave. These are statutory minimums and may not be reduced by agreement.`,
      },
    },
    {
      id: "confidentiality",
      heading: { ne: "गोपनीयता", en: "Confidentiality" },
      when: { field: "includeConfidentiality", op: "eq", value: "yes" },
      body: {
        ne: `श्रमिकले रोजगारीको क्रममा प्राप्त गरेको रोजगारदाताको व्यापारिक, प्राविधिक तथा ग्राहक सम्बन्धी गोपनीय सूचना रोजगारी अवधिभर र सेवा समाप्त भएपछि पनि कुनै तेस्रो पक्षलाई प्रकट गर्ने छैन।`,
        en: `The Employee shall not disclose to any third party the Employer's confidential commercial, technical or customer information obtained in the course of employment, either during the term or after its termination.`,
      },
    },
    {
      id: "termination",
      heading: { ne: "करार समाप्ति", en: "Termination" },
      citation: LABOUR.termination,
      body: {
        ne: `कुनै पनि पक्षले {{noticeDays}} दिनको लिखित सूचना दिई यो करार अन्त्य गर्न सक्नेछ। रोजगारदाताले श्रमिकलाई हटाउँदा श्रम ऐन, २०७४ ले तोकेको कार्यविधि र सुनुवाइको अवसर अनिवार्य रूपमा पालना गर्नुपर्नेछ।`,
        en: `Either party may terminate this contract by giving {{noticeDays}} days' written notice. Any dismissal by the Employer must follow the procedure and afford the opportunity to be heard required by the Labour Act, 2074.`,
      },
    },
    {
      id: "governing",
      heading: { ne: "प्रचलित कानुन", en: "Governing law" },
      locked: true,
      citation: LABOUR.writtenContract,
      body: {
        ne: `यो करार नेपालको प्रचलित कानुन, विशेषतः श्रम ऐन, २०७४ र मुलुकी देवानी संहिता, २०७४ द्वारा निर्देशित हुनेछ। यस करारका कुनै पनि सर्त प्रचलित कानुनसँग बाझिएमा सो हदसम्म कानुन नै लागू हुनेछ।`,
        en: `This contract is governed by the prevailing law of Nepal, in particular the Labour Act, 2074 and the Muluki Civil Code, 2074. Where any term conflicts with prevailing law, the law prevails to the extent of the conflict.`,
      },
    },
  ],
};
