import type { Template } from "../types";
import { CONTRACT } from "../nepal";

/**
 * Mutual or one-way non-disclosure agreement under the Muluki Civil Code, 2074.
 *
 * Nepali courts will enforce a confidentiality obligation as a contractual term,
 * but a restraint must be reasonable in scope and duration to survive challenge —
 * which is why the duration field carries a warning rather than a free-text box.
 */
export const nda: Template = {
  slug: "nda",
  category: "business",
  priceNpr: 299,
  title: { ne: "गोपनीयता सम्झौता", en: "Non-Disclosure Agreement" },
  summary: {
    ne: "व्यापारिक वार्ता वा साझेदारीका क्रममा आदान-प्रदान हुने गोपनीय सूचनाको संरक्षण गर्ने सम्झौता।",
    en: "Protects confidential information exchanged during commercial negotiations or a partnership. Available as one-way or mutual.",
  },
  governingAct: CONTRACT,
  review: {
    name: { ne: "अधिवक्ता नियुक्ति बाँकी", en: "Advocate not yet assigned" },
    nbcLicence: null,
    reviewedOnBs: "2083-05-10",
    nextReviewBs: "2084-05-10",
  },
  execution: [
    {
      ne: "दुवै पक्षको हस्ताक्षर र मिति आवश्यक पर्दछ।",
      en: "Signature and date from both parties are required.",
    },
    {
      ne: "कम्पनीको तर्फबाट हस्ताक्षर गर्ने व्यक्तिसँग अख्तियारी भएको सुनिश्चित गर्नुहोस्।",
      en: "Where a company is a party, confirm the signatory holds authority to bind it.",
    },
  ],

  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        { id: "disclosingParty", type: "text", required: true, label: { ne: "सूचना दिने पक्ष", en: "Disclosing party" } },
        { id: "disclosingAddress", type: "textarea", required: true, label: { ne: "ठेगाना", en: "Address" } },
        { id: "receivingParty", type: "text", required: true, label: { ne: "सूचना प्राप्त गर्ने पक्ष", en: "Receiving party" } },
        { id: "receivingAddress", type: "textarea", required: true, label: { ne: "ठेगाना", en: "Address" } },
        {
          id: "mutual",
          type: "select",
          required: true,
          label: { ne: "सम्झौताको प्रकार", en: "Direction" },
          help: {
            ne: "दुवै पक्षले सूचना आदान-प्रदान गर्ने भए दुईतर्फी छान्नुहोस्।",
            en: "Choose mutual where both sides will share information. A one-way NDA binds only the receiving party.",
          },
          options: [
            { value: "one-way", label: { ne: "एकतर्फी", en: "One-way" } },
            { value: "mutual", label: { ne: "दुईतर्फी", en: "Mutual" } },
          ],
        },
      ],
    },
    {
      id: "scope",
      title: { ne: "गोपनीय सूचनाको दायरा", en: "Scope of confidential information" },
      fields: [
        {
          id: "purpose",
          type: "textarea",
          required: true,
          label: { ne: "प्रयोजन", en: "Purpose of disclosure" },
          placeholder: {
            ne: "जस्तै: सम्भावित लगानी सम्बन्धी छलफल",
            en: "e.g. evaluating a potential investment",
          },
          help: {
            ne: "प्रयोजन जति स्पष्ट हुन्छ, उल्लङ्घन प्रमाणित गर्न त्यति सजिलो हुन्छ।",
            en: "The narrower and clearer the stated purpose, the easier a breach is to establish.",
          },
        },
        {
          id: "durationYears",
          type: "number",
          required: true,
          label: { ne: "गोपनीयता अवधि (वर्ष)", en: "Confidentiality period (years)" },
          citation: CONTRACT,
          help: {
            ne: "अत्यधिक लामो अवधि अदालतले अनुचित बन्देज मानी खारेज गर्न सक्दछ। सामान्यतया २–५ वर्ष उपयुक्त मानिन्छ।",
            en: "An unreasonably long restraint risks being struck down as an unreasonable restriction. Two to five years is the usual range.",
          },
          rules: [
            {
              kind: "max",
              value: 10,
              blocking: false,
              citation: CONTRACT,
              message: {
                ne: "१० वर्षभन्दा लामो अवधि अनुचित बन्देज मानिन सक्दछ। अधिवक्तासँग परामर्श गर्नुहोस्।",
                en: "A period beyond 10 years may be treated as an unreasonable restraint. Have an advocate review before relying on it.",
              },
            },
          ],
        },
        { id: "effectiveDateBs", type: "date-bs", required: true, label: { ne: "प्रारम्भ मिति (वि.सं.)", en: "Effective date (BS)" }, placeholder: { ne: "२०८३-०५-१५", en: "2083-05-15" } },
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
        ne: `यो गोपनीयता सम्झौता {{effectiveDateBs}} मा {{disclosingParty}}, ठेगाना {{disclosingAddress}} र {{receivingParty}}, ठेगाना {{receivingAddress}} बीच मुलुकी देवानी संहिता, २०७४ बमोजिम सम्पन्न भएको छ।`,
        en: `This Non-Disclosure Agreement is made on {{effectiveDateBs}} between {{disclosingParty}}, of {{disclosingAddress}}, and {{receivingParty}}, of {{receivingAddress}}, pursuant to the Muluki Civil Code, 2074.`,
      },
    },
    {
      id: "purpose",
      heading: { ne: "प्रयोजन", en: "Purpose" },
      body: {
        ne: `पक्षहरूले {{purpose}} को प्रयोजनका लागि गोपनीय सूचना आदान-प्रदान गर्ने भएकाले यो सम्झौता गरिएको हो।`,
        en: `The parties wish to exchange confidential information for the purpose of {{purpose}}, and enter into this agreement accordingly.`,
      },
    },
    {
      id: "definition",
      heading: { ne: "गोपनीय सूचनाको परिभाषा", en: "Definition of confidential information" },
      body: {
        ne: `"गोपनीय सूचना" भन्नाले लिखित, मौखिक, विद्युतीय वा अन्य कुनै स्वरूपमा प्रकट गरिएको व्यापारिक योजना, वित्तीय विवरण, ग्राहक सूची, प्राविधिक जानकारी, स्रोत कोड, तथा गोपनीय भनी चिनाइएको अन्य कुनै सूचना सम्झनुपर्दछ।`,
        en: `"Confidential Information" means business plans, financial records, customer lists, technical information, source code and any other information identified as confidential, disclosed in written, oral, electronic or any other form.`,
      },
    },
    {
      id: "obligation-oneway",
      heading: { ne: "गोपनीयताको दायित्व", en: "Confidentiality obligation" },
      when: { field: "mutual", op: "eq", value: "one-way" },
      body: {
        ne: `{{receivingParty}} ले गोपनीय सूचनालाई गोप्य राख्नेछ, माथि उल्लिखित प्रयोजन बाहेक अन्य कुनै कार्यमा प्रयोग गर्ने छैन, र {{disclosingParty}} को लिखित स्वीकृतिबिना कुनै तेस्रो पक्षलाई प्रकट गर्ने छैन।`,
        en: `{{receivingParty}} shall keep the Confidential Information secret, shall not use it for any purpose other than the Purpose stated above, and shall not disclose it to any third party without the written consent of {{disclosingParty}}.`,
      },
    },
    {
      id: "obligation-mutual",
      heading: { ne: "गोपनीयताको दायित्व", en: "Confidentiality obligation" },
      when: { field: "mutual", op: "eq", value: "mutual" },
      body: {
        ne: `दुवै पक्षले एकअर्काबाट प्राप्त गोपनीय सूचनालाई गोप्य राख्नेछन्, माथि उल्लिखित प्रयोजन बाहेक प्रयोग गर्ने छैनन्, र सूचना दिने पक्षको लिखित स्वीकृतिबिना कुनै तेस्रो पक्षलाई प्रकट गर्ने छैनन्।`,
        en: `Each party shall keep confidential the Confidential Information received from the other, shall not use it other than for the Purpose, and shall not disclose it to any third party without the written consent of the disclosing party.`,
      },
    },
    {
      id: "exclusions",
      heading: { ne: "अपवाद", en: "Exclusions" },
      locked: true,
      body: {
        ne: `देहायको सूचना गोपनीय सूचना मानिने छैन: (क) सार्वजनिक रूपमा उपलब्ध सूचना; (ख) प्राप्त गर्ने पक्षसँग पहिलेदेखि रहेको सूचना; (ग) तेस्रो पक्षबाट वैध रूपमा प्राप्त सूचना; र (घ) अदालत वा कानुनी अधिकारीको आदेशबमोजिम प्रकट गर्नुपर्ने सूचना।`,
        en: `The following is not Confidential Information: (a) information in the public domain; (b) information already in the receiving party's possession; (c) information lawfully obtained from a third party; and (d) information required to be disclosed by order of a court or competent authority.`,
      },
    },
    {
      id: "duration",
      heading: { ne: "अवधि", en: "Duration" },
      body: {
        ne: `यो सम्झौताअन्तर्गतको गोपनीयताको दायित्व प्रारम्भ मितिदेखि {{durationYears}} वर्षसम्म कायम रहनेछ।`,
        en: `The confidentiality obligations under this agreement continue for {{durationYears}} years from the effective date.`,
      },
    },
    {
      id: "remedies",
      heading: { ne: "उपचार", en: "Remedies" },
      body: {
        ne: `यो सम्झौताको उल्लङ्घन भएमा पीडित पक्षले प्रचलित कानुनबमोजिम क्षतिपूर्ति दाबी गर्न तथा निषेधाज्ञा लगायतका उपचार माग गर्न पाउनेछ।`,
        en: `On breach, the aggrieved party may seek damages and injunctive relief, together with any other remedy available under prevailing law.`,
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
