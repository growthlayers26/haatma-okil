import type { Template, Field } from "../types";
import { pendingReview, bsDateField, moneyField } from "./common";
import {
  ACTS,
  cite,
  caseReferenceStep,
  partiesStep,
  signatureDateField,
  petitionHeadingClause,
  partiesClause,
  courtFeeClause,
  closingClause,
  LITIGATION_EXECUTION,
} from "./litigation-common";

/**
 * The 52 Supreme Court of Nepal petition forms.
 *
 * Transcribed from the official templates the Court itself publishes — not drafted
 * independently — at:
 *   https://supremecourt.gov.np/web/supform  (by form type)
 *   https://supremecourt.gov.np/web/suptemp  (the same forms, by court level)
 *
 * Each slug carries the government's own form number (फाराम नं.) so a filing can be
 * checked back against its source. Where a form offers several statutory grounds to
 * choose between — the deadline-extension forms in particular — that choice is the
 * form's own structure, not something simplified away here: the field asking for it
 * is required, and the wrong choice is a real filing error, not a formatting one.
 *
 * What every one of these petitions asks the law to do is different from what the
 * other 31 templates in this catalogue ask it to do. An NDA or a lease is a private
 * instrument two parties choose the terms of; every template here is a request TO A
 * COURT, inside a case that already exists, and the court decides whether to grant
 * it. See LITIGATION_EXECUTION for what that means for the person filing.
 */

const REVIEW = pendingReview();

/* =================================================================================
 * Form 1 — accept service of a deadline in the court's own presence
 * ================================================================================= */
export const petitionOfficeDeadlineAcknowledged: Template = {
  slug: "court-petition-01-office-deadline-acknowledged",
  category: "litigation",
  priceNpr: 299,
  title: {
    ne: "अड्डाको रोहवरमा म्याद बुझिपाऊँ (फाराम नं. १)",
    en: "Accept a Deadline in the Court's Own Presence (Form 1)",
  },
  summary: {
    ne: "प्रतिउत्तर पेस गर्ने म्याद जारी भएकोमा, त्यही अड्डामा उपस्थित भई म्याद बुझिलिन दिने निवेदन।",
    en: "Petition to accept, in person at the court itself, a deadline already issued for filing a reply.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १०७", "§107"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "म्यादको विवरण", en: "The deadline" },
      fields: [
        {
          id: "issuingBasis",
          type: "select",
          required: true,
          label: { ne: "म्याद जारी हुनुको आधार", en: "Ground the deadline was issued on" },
          help: {
            ne: "अदालतले जारी गरेको आदेशमा उल्लेख भएको दफा छान्नुहोस्।",
            en: "Choose the section named in the court's own order.",
          },
          options: [
            { value: "civilCode222", label: { ne: "मुलुकी देवानी संहिता, २०७४ को दफा २२२(२)", en: "Civil Code §222(2)" } },
            { value: "cpc100", label: { ne: "मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १००", en: "Civil Procedure Code §100" } },
            { value: "cpc123", label: { ne: "ऐ. संहिताको दफा १२३", en: "same Code, §123" } },
            { value: "cpc202", label: { ne: "ऐ. संहिताको दफा २०२", en: "same Code, §202" } },
            { value: "cpc213", label: { ne: "ऐ. संहिताको दफा २१३", en: "same Code, §213" } },
          ],
        },
        {
          id: "documentsAttached",
          type: "text",
          required: false,
          label: { ne: "साथै राखिएको कागजात", en: "Documents attached" },
          placeholder: { ne: "नागरिकताको प्रतिलिपि", en: "Copy of citizenship certificate" },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "अड्डाको रोहवरमा म्याद बुझिपाऊँ", en: "Praying to accept a deadline in the court's own presence" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उपर्युक्त मुद्दामा मेरो/हाम्रो नाउँमा प्रतिउत्तर पेस गर्ने {{issuingBasis}} बमोजिम हाजिर हुन आउने आदेश भई म्याद जारी भएकाले सो म्याद मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १०७ बमोजिम बुझिलिन आफैं/वारिसमार्फत {{documentsAttached}} यसै साथ राखी निवेदन गरेको छु/छौं। तसर्थ मेरो/हाम्रो नामको म्याद बुझिलिई हाजिर हुन पाऊँ।",
        en: "In the above case, a deadline was issued for filing a reply in my/our name on the ground of {{issuingBasis}}. I present {{documentsAttached}} herewith and petition, under Civil Procedure Code §107, to accept that deadline in person or through an attorney, and to be permitted to appear accordingly.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 2 — take over one's own hearing date after acting through a representative
 * ================================================================================= */
export const petitionDateSelfTakenOver: Template = {
  slug: "court-petition-02-date-self-taken-over",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "तारिख सकार गरिपाऊँ (फाराम नं. २)", en: "Take Over One's Own Hearing Date (Form 2)" },
  summary: {
    ne: "वारिसलाई तोकिएको तारिखमा आफैं उपस्थित भई तारिख सकार गर्ने निवेदन।",
    en: "Petition for the party to personally take over a hearing date that had been fixed for their representative.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १५२", "§152"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "वारिसको विवरण", en: "The representative" },
      fields: [
        { id: "attorneyName", type: "text", required: true, label: { ne: "वारिसको नाम, थर", en: "Representative's name" } },
        { id: "attorneyDistrict", type: "text", required: false, label: { ne: "वारिस बस्ने जिल्ला", en: "Representative's district" } },
        { id: "attorneyMunicipality", type: "text", required: false, label: { ne: "न.पा./गा.पा.", en: "Municipality / rural municipality" } },
        { id: "attorneyWard", type: "text", required: false, label: { ne: "वडा नं.", en: "Ward no." } },
        bsDateField("hearingDateBs", { ne: "तोकिएको तारिख मिति (वि.सं.)", en: "The fixed hearing date (BS)" }),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "तारिख सकार गरिपाऊँ", en: "Praying to personally take over a hearing date" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा मैले/हामीले {{attorneyName}}, जिल्ला {{attorneyDistrict}}, {{attorneyMunicipality}} वडा नं. {{attorneyWard}} बस्नेलाई वारिस राख्न अख्तियारनामा लेखिदिएको र निज वारिसलाई यस अदालतबाट मिति {{hearingDateBs}} गतेको तारिख तोकिएकोमा म/हामी आफैं तारिखमा रहने हुँदा मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १५२ बमोजिम आफ्नो मुद्दाको तारिख आफैं सकार गरिपाऊँ।",
        en: "I/we had given a power of attorney to {{attorneyName}} of {{attorneyMunicipality}}, Ward No. {{attorneyWard}}, {{attorneyDistrict}} to act as representative, and that representative was given a hearing date of {{hearingDateBs}} (BS) by this Court. As I/we intend to remain on record personally, I/we petition under Civil Procedure Code §152 to personally take over the hearing date of my/our own case.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 3 — service by publication or broadcast, when direct service failed
 * ================================================================================= */
export const petitionServiceByPublication: Template = {
  slug: "court-petition-03-service-by-publication",
  category: "litigation",
  priceNpr: 299,
  title: {
    ne: "म्याद, सूचना प्रकाशन/प्रशारण गरी तामेल गरिपाऊँ (फाराम नं. ३)",
    en: "Serve a Deadline by Publication or Broadcast (Form 3)",
  },
  summary: {
    ne: "प्रतिवादीलाई म्याद रीतपूर्वक तामेल हुन नसकेकोमा पत्रिका, रेडियो, टेलिभिजन वा विद्युतीय माध्यमबाट तामेल गर्ने निवेदन।",
    en: "Petition to serve a deadline on a defendant, whom direct service could not reach, through a newspaper, radio, television or electronic medium.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १०५(२२)", "§105(22)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "विपक्षीको विवरण", en: "The party to be served" },
      intro: {
        ne: "तामेलदारले म्याद तामेल हुन नसकेको प्रतिवेदन दिइसकेको हुनुपर्छ।",
        en: "The court's own process server should already have reported that direct service could not be effected.",
      },
      fields: [
        { id: "respondentDetail", type: "textarea", required: true, label: { ne: "म्याद जारी गर्नुपर्ने विपक्षीको विवरण", en: "Details of the party the deadline is to be served on" }, help: { ne: "जिल्ला, न.पा./गा.पा., वडा नं., गाउँ/टोल र नाम सबैका लागि।", en: "District, municipality, ward, village/tole, and name — for each person to be served." } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "म्याद, सूचना प्रकाशन/प्रशारण गरी तामेल गरिपाऊँ", en: "Praying to serve a deadline by publication or broadcast" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उपर्युक्त मुद्दामा तपसिलका प्रतिवादीको नामको म्याद रीतपूर्वक तामेल हुन नसकेको भनी तामेलदारले अदालतमा प्रतिवेदन दिएको हुनाले निजका नाममा यस अदालतबाट मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १०५(२२) र मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ६२(१) र सर्वोच्च अदालत नियमावली, २०७४ को नियम १४८ बमोजिम राष्ट्रिय स्तरका दैनिक पत्रिका, रेडियो, टेलिभिजन वा विद्युतीय माध्यमबाट प्रकाशित/प्रसारण गरी म्याद तामेल गरिपाऊँ। यसरी म्याद तामेल गर्दा लाग्ने दस्तुर तोकिएबमोजिम म आफैंले बुझाउनेछु।\n\nम्याद जारी गर्नुपर्ने विपक्षीको विवरण:\n{{respondentDetail}}",
        en: "In the above case, the process server has reported that the deadline could not be regularly served on the named defendant. I petition, under Civil Procedure Code §105(22), Criminal Procedure Code §62(1) and Supreme Court Regulation Rule 148, to serve that deadline through a national daily newspaper, radio, television or electronic medium, and undertake to bear the prescribed cost of doing so.\n\nDetails of the party to be served:\n{{respondentDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 4 — a new address disclosed after service at the address on file failed
 * ================================================================================= */
export const petitionAddressDisclosed: Template = {
  slug: "court-petition-04-address-disclosed",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "वतन खुलाएको (फाराम नं. ४)", en: "New Address Disclosed (Form 4)" },
  summary: {
    ne: "बयान कागजमा उल्लेख गरेको ठेगानामा म्याद तामेल हुन नसकेकोमा विपक्षीको अर्को वतन खुलाई म्याद जारी गर्ने निवेदन।",
    en: "Petition disclosing a further address for a party the court could not serve at the address already on record.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १७१(२)", "§171(2)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "नयाँ वतन", en: "The new address" },
      fields: [
        {
          id: "newAddressDetail",
          type: "textarea",
          required: true,
          label: { ne: "विपक्षीको खुलेको वतन", en: "The address now disclosed" },
          help: {
            ne: "जिल्ला, न.पा./गा.पा., वडा नं., गाउँ/टोल, घर नं., बाबुको नाम, फोन/इमेल — पत्ता लागेजति।",
            en: "District, municipality, ward, village/tole, house no., father's name, phone/email — as much as is known.",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "वतन खुलाएको", en: "Disclosing an address" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा मैले पुनरावेदन पत्र/रिट निवेदनमा उल्लेख गरेको बयान कागजमा खुलाएको वतनमा विपक्षीका नाउँमा सम्मानित अदालतबाट जारी भएको म्याद रीतपूर्वक तामेल हुन नसकी मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १७१(२), ऐ. दफा २७५ र मुलुकी फौजदारी कार्यविधि नियमावली, २०७५ को नियम ८९ बमोजिम अर्को वतन खुलाउनु भन्ने आदेशानुसार विपक्षीको तपसिलबमोजिमको वतन खुलाएको छु। सोही वतनमा म्याद जारी गरिपाऊँ।\n\nतपसिल:\n{{newAddressDetail}}",
        en: "In the above case, the deadline issued to the opposing party at the address I had disclosed in my petition/writ could not be regularly served. Pursuant to the order requiring a further address under Civil Procedure Code §171(2), §275, and Criminal Procedure Rules Rule 89, I disclose the opposing party's address as follows, and pray that the deadline be issued at that address.\n\nParticulars:\n{{newAddressDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 5 — statement taken upon appearance under summons or warrant
 * ================================================================================= */
export const petitionStatementTaken: Template = {
  slug: "court-petition-05-statement-taken",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "बयान गराइपाऊँ (फाराम नं. ५)", en: "Statement Taken on Appearance (Form 5)" },
  summary: {
    ne: "जारी भएको म्याद वा पक्राउ पुर्जी बमोजिम हाजिर भई बयान लिइदिन माग गर्ने निवेदन।",
    en: "Petition to have one's statement taken, having appeared under a served deadline or arrest order.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १७५", "§175"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "म्यादको विवरण", en: "The deadline or warrant" },
      fields: [
        bsDateField("servedDateBs", { ne: "म्याद/पक्राउ पुर्जी तामेल भएको मिति (वि.सं.)", en: "Date the deadline/warrant was served (BS)" }),
        {
          id: "statementBasis",
          type: "select",
          required: true,
          label: { ne: "मुद्दाको किसिम", en: "Nature of the case" },
          options: [
            { value: "civil", label: { ne: "देवानी — कार्यविधि संहिता दफा १७५", en: "Civil — Procedure Code §175" } },
            { value: "criminal", label: { ne: "फौजदारी — कार्यविधि संहिता दफा ५२ र दफा १२२", en: "Criminal — Procedure Code §52 and §122" } },
          ],
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "बयान गराइपाऊँ", en: "Praying to have one's statement taken" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा यस अदालतबाट मेरा नाममा जारी भएको म्याद/पक्राउ पुर्जी मिति {{servedDateBs}} मा तामेल भएकाले म्याद भित्रै/जारी भएको म्याद/पक्राउ पुर्जी बमोजिम हाजिर हुन आएको छु। {{statementBasis}} बमोजिम बयान गराइपाऊँ।",
        en: "The deadline/arrest order issued in my name by this Court in the above case was served on {{servedDateBs}} (BS), and I appear accordingly, within the deadline. I petition, under {{statementBasis}}, that my statement be taken.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 6 — appear and give a statement
 * ================================================================================= */
export const petitionAppearAndStatement: Template = {
  slug: "court-petition-06-appear-and-statement",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "हाजिर गराई वयान गराइपाऊँ (फाराम नं. ६)", en: "Appear and Give a Statement (Form 6)" },
  summary: {
    ne: "जारी भएको म्याद तामेल भएपछि, म्यादभित्रै हाजिर भई बयानका लागि उपस्थित हुने निवेदन।",
    en: "Petition to appear, within the deadline served, for the purpose of giving one's statement.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १२३", "§123"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "म्यादको विवरण", en: "The deadline" },
      fields: [
        bsDateField("servedDateBs", { ne: "म्याद तामेल भएको मिति (वि.सं.)", en: "Date the deadline was served (BS)" }),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "हाजिर गराई वयान गराइपाऊँ", en: "Praying to appear and give a statement" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा मेरा नाममा मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १२३ बमोजिम जारी भएको म्याद मिति {{servedDateBs}} मा तामेल भएकाले तामेल भएका मितिले म्यादभित्रै बयानका लागि हाजिर हुन आएको छु। बयान गराइपाऊँ।",
        en: "The deadline issued in my name under Civil Procedure Code §123 was served on {{servedDateBs}} (BS), and I appear within that deadline for the purpose of giving my statement. I petition that my statement be taken accordingly.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 7 — certified copy of a document or piece of evidence on the file
 * ================================================================================= */
export const petitionCertifiedCopy: Template = {
  slug: "court-petition-07-certified-copy",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "नक्कल निवेदन (फाराम नं. ७)", en: "Request a Certified Copy (Form 7)" },
  summary: {
    ne: "मुद्दाको मिसिलमा रहेको लिखत वा प्रमाणको प्रमाणित नक्कल माग गर्ने निवेदन।",
    en: "Petition for a certified copy of a document or piece of evidence held on the case file.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा ४६", "§46"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      intro: {
        ne: "नक्कल निवेदनमा पूरा ठेगाना खुलाउनु पर्दैन — नाम र मुद्दामा भूमिका मात्र पुग्छ।",
        en: "A copy petition does not require full address detail — a name and role in the case is enough.",
      },
      fields: [
        { id: "petitionerName", type: "text", required: true, label: { ne: "निवेदकको नाम, थर", en: "Petitioner's name" } },
        {
          id: "petitionerRole",
          type: "select",
          required: true,
          label: { ne: "मुद्दामा भूमिका", en: "Role in the case" },
          options: [
            { value: "petitioner", label: { ne: "निवेदक", en: "Petitioner" } },
            { value: "plaintiff", label: { ne: "वादी", en: "Plaintiff" } },
            { value: "defendant", label: { ne: "प्रतिवादी", en: "Defendant" } },
          ],
        },
        { id: "opposingName", type: "text", required: false, label: { ne: "वादी/प्रतिवादीको नाम, थर", en: "Opposing party's name" } },
      ] as Field[],
    },
    {
      id: "documents",
      title: { ne: "माग गरिएको नक्कल", en: "The copy requested" },
      fields: [
        {
          id: "documentsRequested",
          type: "textarea",
          required: true,
          label: { ne: "नक्कल माग गरेका लिखत/प्रमाण", en: "Documents or evidence a copy is sought of" },
        },
        {
          id: "requestBasis",
          type: "select",
          required: true,
          label: { ne: "मुद्दाको किसिम", en: "Nature of the case" },
          options: [
            { value: "civil", label: { ne: "देवानी — कार्यविधि संहिता दफा ४६", en: "Civil — Procedure Code §46" } },
            { value: "criminal", label: { ne: "फौजदारी — कार्यविधि संहिता दफा १७५", en: "Criminal — Procedure Code §175" } },
          ],
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "निवेदनको शीर्ष", en: "To the court" },
      locked: true,
      body: {
        ne: "{{courtLevel}}मा चढाएको नक्कलको निवेदन पत्र\n{{courtName}}\n\nमुद्दा/रिट दर्ता नं. — {{caseRegNo}}\nमुद्दा/रिट नं. — {{caseNo}}",
        en: "Copy petition presented to the {{courtLevel}}\n{{courtName}}\n\nCase/writ registration no. — {{caseRegNo}}\nCase/writ no. — {{caseNo}}",
      },
    },
    {
      id: "parties",
      heading: { ne: "पक्षहरू", en: "The parties" },
      body: {
        ne: "{{petitionerName}} — {{petitionerRole}}\n\nविरुद्ध\n\n{{opposingName}} — वादी/प्रतिवादी।",
        en: "{{petitionerName}} — {{petitionerRole}}\n\nagainst\n\n{{opposingName}} — plaintiff/defendant.",
      },
    },
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "म निवेदक {{requestBasis}} बमोजिम निम्नबमोजिमको लिखत/प्रमाणको नक्कल अदालतको/आफ्नै तर्फबाट सारी लिन पाउँ भनी नियम बमोजिमको दस्तुर साथै राखी निवेदन गर्दछु।\n\nनक्कल माग गरेका लिखत/प्रमाण:\n{{documentsRequested}}",
        en: "I petition, under {{requestBasis}}, to be permitted to obtain a copy of the following document(s)/evidence — either prepared by the court or copied on my own behalf — with the prescribed fee.\n\nDocuments/evidence a copy is sought of:\n{{documentsRequested}}",
      },
    },
    closingClause("copy-petition"),
  ],
};

/* =================================================================================
 * Form 8 — a fee shortfall deposited
 * ================================================================================= */
export const petitionFeeDeposited: Template = {
  slug: "court-petition-08-fee-deposited",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "दस्तुर दाखिला गरेको (फाराम नं. ८)", en: "Fee Deposited (Form 8)" },
  summary: {
    ne: "अदालतले तोकेको थप वा नपुग दस्तुर बुझाई हाजिर हुने निवेदन।",
    en: "Petition confirming payment of a shortfall or additional fee the court has required.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा ७७", "§77"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "दस्तुरको विवरण", en: "The fee" },
      intro: {
        ne: "यो निवेदनले कुनचाहिँ किसिमको दस्तुर हो भन्ने छुट्याउँछ — लागू नहुनेलाई खाली छोड्नुहोस्।",
        en: "This petition distinguishes which kind of fee applies — leave the ones that do not apply blank.",
      },
      fields: [
        moneyField("shortfallFeeNpr", { ne: "नपुग अदालती शुल्क (रु.)", en: "Shortfall court fee (NPR)" }, undefined, false),
        moneyField("expertFeeNpr", { ne: "विशेषज्ञ/वैज्ञानिक परीक्षण दस्तुर (रु.)", en: "Expert/scientific examination fee (NPR)" }, undefined, false),
        moneyField("publicationFeeNpr", { ne: "म्याद/सूचना प्रकाशन दस्तुर (रु.)", en: "Publication/notice fee (NPR)" }, undefined, false),
        moneyField("otherFeeNpr", { ne: "अन्य दस्तुर (रु.)", en: "Other fee (NPR)" }, undefined, false),
        { id: "voucherNo", type: "text", required: false, label: { ne: "बैंक दाखिला भौचर नं.", en: "Bank deposit voucher no." } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "दस्तुर दाखिला गरेको", en: "Fee deposited" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा मलाई/हामीलाई सम्मानित अदालतबाट दस्तुर लिई हाजिर हुन आउनु भनी तारिख तोकी पाएकोमा देहायबमोजिमको दस्तुर लिई हाजिर हुन आएको छु/छौं।\n\nनपुग अदालती शुल्क (दफा ७७): रु. {{shortfallFeeNpr}}\nविशेषज्ञ/वैज्ञानिक परीक्षण दस्तुर: रु. {{expertFeeNpr}}\nम्याद/सूचना प्रकाशन दस्तुर (दफा १०५(२४)): रु. {{publicationFeeNpr}}\nअन्य दस्तुर: रु. {{otherFeeNpr}}\nबैंक दाखिला भौचर नं.: {{voucherNo}}",
        en: "In the above case, I/we were given a hearing date to appear with a fee, and I/we appear having paid the following:\n\nShortfall court fee (§77): NPR {{shortfallFeeNpr}}\nExpert/scientific examination fee: NPR {{expertFeeNpr}}\nPublication/notice fee (§105(24)): NPR {{publicationFeeNpr}}\nOther fee: NPR {{otherFeeNpr}}\nBank deposit voucher no.: {{voucherNo}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 37 — a lapsed hearing date condoned (criminal, §85(1))
 *
 * Five other official forms share all or part of this title and are easy to
 * mistake for one another — Forms 9, 10, 30, 32 and 36, all below. Each cites a
 * different section, and several offer a branching choice of grounds this one does
 * not. Filing the wrong one is a real error, not a formatting one; confirm the
 * correct form number with an advocate before relying on any of them.
 * ================================================================================= */
export const petitionLapsedDateCondoned37: Template = {
  slug: "court-petition-37-lapsed-date-condoned",
  category: "litigation",
  priceNpr: 299,
  title: {
    ne: "फौजदारी गुज्रेको तारिख थामिपाऊँ — दफा ८५ (फाराम नं. ३७)",
    en: "Condone a Lapsed Hearing Date, Criminal — §85 (Form 37)",
  },
  summary: {
    ne: "काबु बाहिरको परिस्थितिले फौजदारी मुद्दाको तारिखमा उपस्थित हुन नसकेकोमा गुज्रेको तारिख थामिदिन माग गर्ने निवेदन।",
    en: "Petition to condone a hearing date missed, in a criminal case, due to circumstances beyond one's control.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा ८५(१)", "§85(1)"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "उस्तै वा मिल्दोजुल्दो शीर्षकका अरू फाराम पनि छन् (नं. ९, १०, ३०, ३२, ३६) — फरक-फरक दफा र फरक-फरक शर्त भएका। सही फाराम पुष्टि नगरी नबुझाउनुहोस्।",
      en: "Other forms carry the same or a similar title (Nos. 9, 10, 30, 32, 36) — each citing a different section and different conditions. Confirm the right one before filing.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "गुज्रिएको कारण", en: "Why the date lapsed" },
      fields: [
        bsDateField("fixedDateBs", { ne: "तोकिएको तारिख (वि.सं.)", en: "The fixed date (BS)" }),
        { id: "totalDays", type: "text", required: false, label: { ne: "जम्मा दिन", en: "Total days allowed" } },
        { id: "instanceCount", type: "text", required: false, label: { ne: "पटक संख्या", en: "Which instance (first/second)" } },
        { id: "daysClaimed", type: "text", required: false, label: { ne: "गुज्रेको दिन संख्या", en: "Number of days lapsed" } },
        { id: "lapseReason", type: "textarea", required: true, label: { ne: "तारिख गुज्रिनुको कारण", en: "Reason the date lapsed" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "गुज्रेको तारिख थामिपाऊँ", en: "Praying that a lapsed hearing date be condoned" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा म/हामीले यस अदालतबाट मिति {{fixedDateBs}} गतेको तारिख तोकी पाएको थिएँ/थियौं। उक्त मितिमा अदालतमा उपस्थित भै तारिख लिनुपर्नेमा {{lapseReason}} भई तारिख गुज्रन गयो। तसर्थ मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ८५(१) बमोजिम {{totalDays}} दिनमध्ये {{instanceCount}} पटक {{daysClaimed}} दिन गुज्रेको तारिख थामिपाऊँ। आवश्यक प्रमाण यसैसाथ छ।",
        en: "In the above case, I/we had been given a hearing date of {{fixedDateBs}} (BS) by this Court. I/we were required to appear and take the next date on that date, but the date lapsed because {{lapseReason}}. I therefore petition, under Criminal Procedure Code §85(1), that {{daysClaimed}} of the {{totalDays}} day(s) allowed — the {{instanceCount}} instance — be condoned. The necessary evidence is attached.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 10 — a lapsed deadline condoned, choosing among five statutory grounds
 *
 * Form 9 (below) is nearly identical — same five grounds, same citations — but
 * adds a first-instance/second-instance distinction inside grounds (c) and (d)
 * that this form does not carry. That difference is the entire distinction between
 * the two official forms, so it is transcribed rather than merged away.
 * ================================================================================= */
export const petitionLapsedDeadlineMultiGround: Template = {
  slug: "court-petition-10-lapsed-deadline-multi-ground",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "गुज्रेको म्याद थामिपाऊँ (फाराम नं. १०)", en: "Condone a Lapsed Deadline (Form 10)" },
  summary: {
    ne: "काबु बाहिरको परिस्थितिले जारी भएको म्याद गुज्रिएकोमा, लागू हुने पाँच सम्भावित आधारमध्ये एक छानी म्याद थामिदिन माग गर्ने निवेदन।",
    en: "Petition to condone a lapsed deadline caused by circumstances beyond one's control, on whichever of five possible statutory grounds applies.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा २२३", "§223"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "यो फाराममा पाँच फरक कानुनी आधार दिइएका छन्। गलत आधार छानिए निवेदन नै अस्वीकृत हुन सक्छ — अधिवक्तासँग सही आधार पुष्टि नगरी पेस नगर्नुहोस्। फाराम नं. ९ लगभग उस्तै छ; भिन्नता पहिलो/दोस्रो पटकको हकमा मात्र हो।",
      en: "This form offers five distinct legal grounds. Choosing the wrong one can see the whole petition refused — confirm the correct ground with an advocate before filing. Form 9 is nearly identical; the two differ only over a first/second-instance distinction.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "म्याद र गुज्रिएको कारण", en: "The deadline and why it lapsed" },
      fields: [
        { id: "deadlineDays", type: "text", required: false, label: { ne: "जारी भएको म्याद (दिन)", en: "Deadline originally issued (days)" } },
        bsDateField("servedDateBs", { ne: "म्याद तामेल भएको मिति (वि.सं.)", en: "Date the deadline was served (BS)" }, false),
        bsDateField("dueDateBs", { ne: "हाजिर हुनुपर्ने मिति (वि.सं.)", en: "Date appearance was due (BS)" }, false),
        {
          id: "ground",
          type: "select",
          required: true,
          label: { ne: "लागू हुने आधार", en: "Ground relied on" },
          options: [
            { value: "summary", label: { ne: "(क) संक्षिप्त कार्यविधि ऐन, २०२८ को दफा ८(१) — १५ दिनभित्र", en: "(a) Summary Procedure Act §8(1) — within 15 days" } },
            { value: "special", label: { ne: "(ख) विशेष अदालत ऐन, २०५९ को दफा ११ — १५ दिनभित्र", en: "(b) Special Court Act §11 — within 15 days" } },
            { value: "cpc223", label: { ne: "(ग) मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा २२३ — १५ दिनभित्र", en: "(c) Civil Procedure Code §223 — within 15 days" } },
            { value: "cpc225", label: { ne: "(घ) ऐ. संहिताको दफा २२५(१) — बाटोको म्याद बाहेक", en: "(d) same Code, §225(1) — excluding travel time" } },
            { value: "scRule55", label: { ne: "(ङ) सर्वोच्च अदालत नियमावली, २०७४ को नियम ५५", en: "(e) Supreme Court Regulation, Rule 55" } },
          ],
        },
        { id: "groundDetail", type: "textarea", required: false, label: { ne: "(घ) छानिएमा: खण्ड, मिति र कारणको विवरण", en: "If (d) is chosen: the clause, date, and reason in detail" } },
        { id: "daysClaimed", type: "text", required: false, label: { ne: "माग गरिएको दिन संख्या", en: "Number of days claimed" } },
        { id: "lapseReason", type: "textarea", required: true, label: { ne: "काबु बाहिरको परिस्थितिको विवरण", en: "The circumstance beyond one's control" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "गुज्रेको म्याद थामिपाऊँ", en: "Praying that a lapsed deadline be condoned" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा सम्मानित अदालतबाट म/हामीका नाममा जारी भएको {{deadlineDays}} दिने म्याद मिति {{servedDateBs}} मा तामेल भई मिति {{dueDateBs}} सम्ममा हाजिर हुनुपर्नेमा {{lapseReason}} भई अदालतमा हाजिर हुन नसकी सो म्याद गुज्रिन गएकोले {{ground}} बमोजिम {{groundDetail}} {{daysClaimed}} दिनको म्याद थामिपाऊँ। प्रमाण यसैसाथ संलग्न गरेको छु।",
        en: "The {{deadlineDays}}-day deadline issued in my/our name by this Court was served on {{servedDateBs}} (BS), requiring appearance by {{dueDateBs}} (BS). I/we could not appear because {{lapseReason}}, and the deadline lapsed as a result. I petition, under {{ground}}, {{groundDetail}} that {{daysClaimed}} day(s) be condoned. The evidence is attached.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 11 — status quo pending final disposal of the case
 * ================================================================================= */
export const petitionStatusQuo: Template = {
  slug: "court-petition-11-status-quo",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "यथास्थितिमा राखिपाऊँ (फाराम नं. ११)", en: "Preserve the Status Quo (Form 11)" },
  summary: {
    ne: "दाबी भएको सम्पत्तिको भौतिक स्वरूप विपक्षीले बिगार्न लागेकोमा, मुद्दा किनारा नभएसम्म यथास्थितिमा राख्न माग गर्ने निवेदन।",
    en: "Petition to preserve disputed property in its present physical state until the case is finally decided.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १५६", "§156"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "सम्पत्तिको विवरण", en: "The property" },
      fields: [
        {
          id: "propertyDetail",
          type: "textarea",
          required: true,
          label: { ne: "यथास्थितिमा राख्नुपर्ने सम्पत्तिको विवरण", en: "The property to be preserved in its present state" },
          help: {
            ne: "अचल सम्पत्तिका लागि जिल्ला, न.पा./गा.पा., वडा नं., कित्ता नं., क्षेत्रफल, साविक दर्तावाला; चल सम्पत्ति भए छुट्टै उल्लेख गर्नुहोस्।",
            en: "For immovable property: district, municipality, ward, plot no., area, and the registered owner. Describe movable property separately.",
          },
        },
        { id: "riskDescription", type: "textarea", required: true, label: { ne: "भौतिक स्वरूप बिग्रन सक्ने आधार", en: "Why the physical state is at risk" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "यथास्थितिमा राखिपाऊँ", en: "Praying to preserve the status quo" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा मेरो/हाम्रो दाबी भएको सम्पत्तिमा विपक्षीले भौतिक स्वरूप बिगार्न लागेको हुँदा — {{riskDescription}} — मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १५६ बमोजिम मुद्दा किनारा नभएसम्म यथास्थितिमा राखिपाऊँ। आवश्यक प्रमाण कागज यसैसाथ छ।\n\nयथास्थितिमा राख्नुपर्ने सम्पत्तिको विवरण:\n{{propertyDetail}}",
        en: "In the above case, the opposing party is about to alter the physical state of property I/we claim, in that {{riskDescription}}. I petition, under Civil Procedure Code §156, that it be preserved in its present state until the case is finally decided. The necessary evidence is attached.\n\nDescription of the property:\n{{propertyDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 12 — an irregularly served deadline voided and re-served
 * ================================================================================= */
export const petitionIrregularServiceVoided: Template = {
  slug: "court-petition-12-irregular-service-voided",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "बेरीतको म्याद बदर गरिपाऊँ (फाराम नं. १२)", en: "Void an Irregularly Served Deadline (Form 12)" },
  summary: {
    ne: "तोकिएको तरिका नपुर्‍याई तामेल भएको म्याद वा सूचना बदर गरी पुनः तामेल गरिदिन माग गर्ने निवेदन।",
    en: "Petition to void a deadline or notice served without following the prescribed procedure, and to have it served again.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा ११७", "§117"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "तामेलमा भएको बेरीति", en: "The irregularity in service" },
      fields: [
        bsDateField("issuedDateBs", { ne: "म्याद/सूचना जारी भएको मिति (वि.सं.)", en: "Date the deadline/notice was issued (BS)" }),
        { id: "irregularityDetail", type: "textarea", required: true, label: { ne: "बेरीति भएको विवरण", en: "What was irregular about the service" }, help: { ne: "दफा १०५ मा तोकिएको तरिका के हो र कसरी पुर्‍याइएन।", en: "What §105 requires, and how it was not followed." } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "बेरीतको म्याद बदर गरिपाऊँ", en: "Praying to void an irregularly served deadline" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा मेरो/हाम्रो नाममा यस अदालतबाट मिति {{issuedDateBs}} मा जारी भएको म्याद/सूचना तामेल गर्दा मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १०५ बमोजिमको रीत नपुर्‍याई तामेल भएको हुँदा — {{irregularityDetail}} — सो म्याद ऐ. संहिताको दफा ११७ बमोजिम बदर गरी पुनः म्याद तामेल गरिपाऊँ।",
        en: "The deadline/notice issued in my/our name by this Court on {{issuedDateBs}} (BS) was served without following the procedure required by Civil Procedure Code §105, in that {{irregularityDetail}}. I petition, under §117 of the same Code, that it be voided and re-served.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 13 — free legal aid through a salaried advocate
 * ================================================================================= */
export const petitionFreeLegalAid: Template = {
  slug: "court-petition-13-free-legal-aid",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "निःशुल्क कानुनी सहायता उपलब्ध गराइपाऊँ (फाराम नं. १३)", en: "Request Free Legal Aid (Form 13)" },
  summary: {
    ne: "आर्थिक रूपमा विपन्न, असहाय, अशक्त वा नाबालक भई कानून व्यवसायी राख्न नसक्नेका लागि, वैतनिक कानून व्यवसायीमार्फत निःशुल्क कानुनी सहायता माग गर्ने निवेदन।",
    en: "Petition for free legal aid through a salaried advocate, for someone unable to afford one because they are destitute, incapacitated, or a minor.",
  },
  governingAct: cite(ACTS.supremeCourtRules, "नियम १४३", "Rule 143"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "सहायता आवश्यक पर्नुको आधार", en: "Why aid is needed" },
      fields: [
        {
          id: "aidGround",
          type: "select",
          required: true,
          label: { ne: "आधार", en: "Ground" },
          options: [
            { value: "helpless", label: { ne: "असहाय", en: "Helpless" } },
            { value: "poor", label: { ne: "आर्थिक रूपमा विपन्न", en: "Financially destitute" } },
            { value: "incapacitated", label: { ne: "अशक्त", en: "Incapacitated" } },
            { value: "detained", label: { ne: "थुनुवा", en: "In detention" } },
            { value: "minor", label: { ne: "नाबालिग", en: "A minor" } },
          ],
        },
        { id: "aidType", type: "select", required: true, label: { ne: "आवश्यक सहायताको किसिम", en: "Kind of aid needed" }, options: [
          { value: "drafting", label: { ne: "कानूनी लिखत तयार गर्ने", en: "Preparing legal documents" } },
          { value: "advocacy", label: { ne: "बहस पैरवी गरिदिने", en: "Arguing the case" } },
          { value: "both", label: { ne: "दुवै", en: "Both" } },
        ] },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "निःशुल्क कानुनी सहायता उपलब्ध गराइपाऊँ", en: "Praying for free legal aid" }),
    partiesClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "म/हामी {{aidGround}} भई कानून व्यवसायी राख्न असमर्थ भएकाले वैतनिक कानून व्यवसायी/अन्य कानून व्यवसायीमार्फत कानूनी सहायता ({{aidType}}) उपलब्ध गराई पाउन यो निवेदन गरेको छु/छौं। सर्वोच्च अदालत नियमावली, २०७४ को नियम १४३ बमोजिम वैतनिक कानून व्यवसायीमार्फत निःशुल्क कानुनी सहायता उपलब्ध गराइपाऊँ।",
        en: "I am/we are {{aidGround}} and unable to retain an advocate. I petition, under Supreme Court Regulation Rule 143, to be provided free legal aid ({{aidType}}) through a salaried advocate.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 14 — voluntary legal aid (pro bono service)
 * ================================================================================= */
export const petitionProBono: Template = {
  slug: "court-petition-14-pro-bono",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "प्रो बोनो सेवा उपलब्ध गराइपाऊँ (फाराम नं. १४)", en: "Request Pro Bono Service (Form 14)" },
  summary: {
    ne: "आर्थिक रूपमा विपन्न वा थुनामा रहेकाले स्वेच्छिक कानूनी सहायता (प्रो बोनो सेवा) माग गर्ने निवेदन।",
    en: "Petition for voluntary legal aid (pro bono service) for someone destitute or in detention.",
  },
  governingAct: cite(ACTS.supremeCourtRules, "नियम १४६", "Rule 146"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "सहायता आवश्यक पर्नुको आधार", en: "Why aid is needed" },
      fields: [
        {
          id: "aidGround",
          type: "select",
          required: true,
          label: { ne: "आधार", en: "Ground" },
          options: [
            { value: "helpless", label: { ne: "असहाय", en: "Helpless" } },
            { value: "incapacitated", label: { ne: "अशक्त", en: "Incapacitated" } },
            { value: "minor", label: { ne: "नाबालक", en: "A minor" } },
            { value: "poor", label: { ne: "आर्थिक रूपमा विपन्न", en: "Financially destitute" } },
            { value: "detained", label: { ne: "थुनामा रहेको", en: "In detention" } },
          ],
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "प्रो बोनो सेवा उपलब्ध गराइपाऊँ", en: "Praying for pro bono service" }),
    partiesClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "म/हामी {{aidGround}} भएकोले स्वेच्छिक कानूनी सहायता (प्रो बोनो सेवा) उपलब्ध गराई पाउन यो निवेदन गरेको छु/छौं। सर्वोच्च अदालत नियमावली, २०७४ को नियम १४६ बमोजिम स्वेच्छिक कानूनी सेवा (प्रो बोनो सेवा) उपलब्ध गराइपाऊँ।",
        en: "I am/we are {{aidGround}}, and I petition, under Supreme Court Regulation Rule 146, to be provided voluntary legal aid (pro bono service).",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 15 — original documents filed on the case record
 * ================================================================================= */
export const petitionOriginalDocumentFiled: Template = {
  slug: "court-petition-15-original-document-filed",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "सक्कल लिखत पेस गरेको (फाराम नं. १५)", en: "Original Document Filed (Form 15)" },
  summary: {
    ne: "अदालतको आदेशबमोजिम सक्कल लिखत, फोटो वा अन्य प्रमाण मिसिल साथ राख्न ल्याएको जानकारी दिने निवेदन।",
    en: "Petition confirming that original documents, photographs or other evidence have been brought for the case file, as the court ordered.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १६५(३)", "§165(3)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "पेस गरिएको कागजातको विवरण", en: "The documents presented" },
      fields: [
        bsDateField("orderDateBs", { ne: "अदालतको आदेश मिति (वि.सं.)", en: "Date of the court's order (BS)" }, false),
        {
          id: "requestBasis",
          type: "select",
          required: true,
          label: { ne: "मुद्दाको किसिम", en: "Nature of the case" },
          options: [
            { value: "civil", label: { ne: "देवानी — कार्यविधि संहिता दफा १६५(३)", en: "Civil — Procedure Code §165(3)" } },
            { value: "criminal", label: { ne: "फौजदारी — कार्यविधि संहिता दफा १००(४)", en: "Criminal — Procedure Code §100(4)" } },
          ],
        },
        {
          id: "documentDetail",
          type: "textarea",
          required: true,
          label: { ne: "तपसिल — पेस गरिएको सक्कल लिखत/फोटो/प्रमाण", en: "Particulars — original document(s)/photographs/evidence presented" },
          help: { ne: "प्रत्येक कागजातका लागि विवरण, प्रकार (कागज/फोटो) र थान संख्या।", en: "For each item: its description, type (document/photograph), and count." },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "सक्कल लिखत पेस गरेको", en: "Original document filed" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा {{requestBasis}} बमोजिम सम्मानित अदालतको मिति {{orderDateBs}} को आदेशबमोजिम तपसिलबमोजिमको सक्कल लिखत/फोटो/अन्य प्रमाण दाखिला गर्न ल्याएको छु। मिसिल सामेल गराइपाऊँ।\n\nतपसिल:\n{{documentDetail}}",
        en: "In the above case, pursuant to {{requestBasis}} and the Court's own order of {{orderDateBs}} (BS), I have brought the following original document(s)/photograph(s)/evidence for filing. I petition that they be placed on the record.\n\nParticulars:\n{{documentDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 16 — a witness produced and sworn
 * ================================================================================= */
export const petitionWitnessTestimony: Template = {
  slug: "court-petition-16-witness-testimony",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "साक्षी हाजिर गराई बकपत्र गराइपाऊँ (फाराम नं. १६)", en: "Produce and Swear a Witness (Form 16)" },
  summary: {
    ne: "फिरादपत्र वा बयानमा उल्लिखित साक्षी लिई उपस्थित भई, बकपत्र गराइदिन माग गर्ने निवेदन।",
    en: "Petition to have a witness named in the plaint or statement examined and sworn before the court.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १७९", "§179"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "साक्षीको विवरण", en: "The witness(es)" },
      fields: [
        {
          id: "requestBasis",
          type: "select",
          required: true,
          label: { ne: "मुद्दाको किसिम", en: "Nature of the case" },
          options: [
            { value: "civil", label: { ne: "देवानी — कार्यविधि संहिता दफा १७९, १८३, १८६", en: "Civil — Procedure Code §179, §183, §186" } },
            { value: "criminal", label: { ne: "फौजदारी — कार्यविधि संहिता दफा १०१, १०६", en: "Criminal — Procedure Code §101, §106" } },
          ],
        },
        bsDateField("hearingDateBs", { ne: "तारिख तोकिएको मिति (वि.सं.)", en: "Date the hearing was fixed for (BS)" }, false),
        {
          id: "witnessDetail",
          type: "textarea",
          required: true,
          label: { ne: "साक्षीको नाम, थर र ठेगाना", en: "Witness name(s) and address(es)" },
          help: { ne: "प्रत्येक साक्षीका लागि नाम, जिल्ला, न.पा./गा.पा., वडा नं. र उमेर।", en: "For each witness: name, district, municipality, ward, and age." },
        },
        {
          id: "swearingParty",
          type: "select",
          required: true,
          label: { ne: "बकपत्र गराउने पक्ष", en: "Who conducts the swearing" },
          options: [
            { value: "court", label: { ne: "अड्डाको तर्फबाट", en: "The court itself" } },
            { value: "self", label: { ne: "आफ्नै तर्फबाट", en: "Myself/ourselves" } },
            { value: "advocate", label: { ne: "कानून व्यवसायीमार्फत", en: "Through an advocate" } },
          ],
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "साक्षी हाजिर गराई बकपत्र गराइपाऊँ", en: "Praying to produce and swear a witness" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "{{requestBasis}} बमोजिम उल्लिखित मुद्दामा सम्मानित अदालतको आदेशबमोजिम फिरादपत्र र प्रतिउत्तरपत्र/बयानको प्रमाण खण्डमा उल्लिखित साक्षी लिई हाजिर हुन आउनु भनी मलाई/हामीलाई मिति {{hearingDateBs}} को तारिख तोकी पाएकोमा तपसिलमा उल्लिखित साक्षी लिई उपस्थित भएको छु/छौं। हाजिर गराई {{swearingParty}} बकपत्र गराइपाऊँ।\n\nसाक्षीको विवरण:\n{{witnessDetail}}",
        en: "Under {{requestBasis}}, and pursuant to the Court's order to produce, in the evidence stage, the witnesses named in the plaint and reply/statement, I/we were given a hearing date of {{hearingDateBs}} (BS) and now appear with the witnesses below. I petition that they be examined and sworn by {{swearingParty}}.\n\nWitness particulars:\n{{witnessDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 9 — a lapsed deadline condoned, five grounds, with a first/second-instance
 * distinction inside grounds (c) and (d) that Form 10 does not carry.
 * ================================================================================= */
export const petitionLapsedDeadlineMultiGround9: Template = {
  slug: "court-petition-09-lapsed-date-multi-ground",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "गुज्रेको तारिख थामिपाऊँ (फाराम नं. ९)", en: "Condone a Lapsed Hearing Date (Form 9)" },
  summary: {
    ne: "काबु बाहिरको परिस्थितिले तारिख गुज्रिएकोमा, लागू हुने पाँच सम्भावित आधारमध्ये एक छानी — पहिलो वा दोस्रो पटक भन्ने छुट्याई — तारिख थामिदिन माग गर्ने निवेदन।",
    en: "Petition to condone a lapsed hearing date on whichever of five possible statutory grounds applies, distinguishing whether this is the first or second such instance.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा २२३", "§223"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "फाराम नं. १० लगभग उस्तै छ, तर पहिलो/दोस्रो पटकको भिन्नता राख्दैन। सही फाराम अधिवक्तासँग पुष्टि गर्नुहोस्।",
      en: "Form 10 is nearly identical but does not carry the first/second-instance distinction. Confirm the correct form with an advocate.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "गुज्रिएको कारण र आधार", en: "Why it lapsed, and the ground" },
      fields: [
        bsDateField("fixedDateBs", { ne: "तोकिएको तारिख (वि.सं.)", en: "The fixed date (BS)" }, false),
        {
          id: "ground",
          type: "select",
          required: true,
          label: { ne: "लागू हुने आधार", en: "Ground relied on" },
          options: [
            { value: "summary", label: { ne: "(क) संक्षिप्त कार्यविधि ऐन, २०२८ को दफा ८(१)", en: "(a) Summary Procedure Act §8(1)" } },
            { value: "special", label: { ne: "(ख) विशेष अदालत ऐन, २०५९ को दफा ११", en: "(b) Special Court Act §11" } },
            { value: "cpc223", label: { ne: "(ग) मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा २२३ — २१ दिनमध्ये", en: "(c) Civil Procedure Code §223 — of 21 days" } },
            { value: "cpc225", label: { ne: "(घ) ऐ. संहिताको दफा २२५(१) — बाटोको म्याद बाहेक", en: "(d) same Code, §225(1) — excluding travel time" } },
            { value: "scRule55", label: { ne: "(ङ) सर्वोच्च अदालत नियमावली, २०७४ को नियम ५५", en: "(e) Supreme Court Regulation, Rule 55" } },
          ],
        },
        {
          id: "instance",
          type: "select",
          required: false,
          label: { ne: "पटक (ग/घ आधारमा मात्र लागू)", en: "Instance (applies only to grounds c/d)" },
          options: [
            { value: "first", label: { ne: "पहिलो पटक", en: "First instance" } },
            { value: "second", label: { ne: "दोस्रो पटक", en: "Second instance" } },
          ],
        },
        { id: "groundDetail", type: "textarea", required: false, label: { ne: "(घ) छानिएमा: खण्ड, मिति र कारणको विवरण", en: "If (d) is chosen: the clause, date, and reason in detail" } },
        { id: "daysClaimed", type: "text", required: false, label: { ne: "माग गरिएको दिन संख्या", en: "Number of days claimed" } },
        { id: "lapseReason", type: "textarea", required: true, label: { ne: "काबु बाहिरको परिस्थितिको विवरण", en: "The circumstance beyond one's control" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "गुज्रेको तारिख थामिपाऊँ", en: "Praying that a lapsed hearing date be condoned" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा सम्मानित अदालतबाट मलाई/हामीलाई मिति {{fixedDateBs}} गतेको तारिख तोकि पाएकोमा काबु बाहिरको परिस्थिति परी अदालतमा उपस्थित भै तारिख लिन नसकी सो तारिख गुज्रिन गएकोले — {{lapseReason}} — {{ground}} बमोजिम {{instance}} {{groundDetail}} {{daysClaimed}} दिनको तारिख थामिपाऊँ। प्रमाण यसैसाथ संलग्न गरेको छु।",
        en: "In the above case, I/we had been given a hearing date of {{fixedDateBs}} (BS). I/we could not appear and take a further date because {{lapseReason}}, and that date lapsed. I petition, under {{ground}} ({{instance}} instance), {{groundDetail}} that {{daysClaimed}} day(s) be condoned. The evidence is attached.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 30 — a lapsed date condoned AND permission to revive the case itself
 * (death, absconding, or loss of contact of the party pursuing it)
 * ================================================================================= */
export const petitionLapsedDateCaseRevival: Template = {
  slug: "court-petition-30-lapsed-date-case-revival",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "गुज्रेको तारिख थामी मुद्दा सकार गर्न अनुमति पाऊँ (फाराम नं. ३०)", en: "Condone a Lapsed Date and Revive the Case (Form 30)" },
  summary: {
    ne: "मुद्दा चलाउने पक्षको मृत्यु, हराएको वा बेपत्ता भएकोले तारिख गुज्रिएकोमा, तारिख थामी अर्को व्यक्तिबाट मुद्दा सकार गर्न अनुमति माग गर्ने निवेदन — कैद वा जरिवानाको सजाय नहुने फौजदारी मुद्दामा मात्र।",
    en: "Petition to condone a lapsed date and obtain permission for another person to carry the case forward, where the complainant died, absconded or went missing — for a criminal case not carrying imprisonment or a fine.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा १९०", "§190"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "कारण", en: "The circumstance" },
      fields: [
        {
          id: "revivalGround",
          type: "select",
          required: true,
          label: { ne: "कारण", en: "Ground" },
          options: [
            { value: "death", label: { ne: "उजुरवालाको मृत्यु भएकोले", en: "The complainant has died" } },
            { value: "notAtAddress", label: { ne: "उजुरवाला होस ठेगानमा नरहेकोले", en: "The complainant is no longer at their address" } },
            { value: "missing", label: { ne: "उजुरवाला बेपत्ता भएकोले", en: "The complainant has gone missing" } },
          ],
        },
        { id: "complainantName", type: "text", required: false, label: { ne: "उजुरवालाको नाम, थर", en: "Complainant's name" } },
        bsDateField("groundDateBs", { ne: "मृत्यु/बेपत्ता/होस ठेगाना छाडेको मिति (वि.सं.)", en: "Date of death/disappearance/leaving the address (BS)" }),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "गुज्रेको तारिख थामी मुद्दा सकार गर्न अनुमति पाऊँ", en: "Praying to condone a lapsed date and revive the case" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "वादी/प्रतिवादी भएको प्रस्तुत मुद्दा कैद वा जरिवानाको सजाय नहुने प्रकृतिको मुद्दा भएको र सम्मानित अदालतमा दर्ता भई कारबाहीयुक्त अवस्थामा रहेको छ। उजुरवाला {{complainantName}} {{revivalGround}}, मिति {{groundDateBs}} देखि, तोकिएको म्याद/तारिख गुज्रन गएको हुनाले गुज्रेको म्याद/तारिख थामी मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा १९० बमोजिम मृत्यु/होस ठेगाना नरहेको/बेपत्ता भएको मितिले बाटोको म्याद बाहेक पैंतिस दिनभित्र मुद्दा सकार गर्न अनुमति पाऊँ।",
        en: "This case, of a nature not carrying imprisonment or a fine, is pending before this Court. As the complainant {{complainantName}} {{revivalGround}} on {{groundDateBs}} (BS), the fixed deadline/date lapsed. I petition, under Criminal Procedure Code §190, to condone the lapsed date and to be permitted, within thirty-five days of that date (excluding travel time), to revive the case.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 32 — a lapsed hearing date condoned (criminal, §168(3))
 * ================================================================================= */
export const petitionLapsedDateCondoned32: Template = {
  slug: "court-petition-32-lapsed-date-condoned",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "गुज्रेको तारिख थामिपाऊँ — दफा १६८ (फाराम नं. ३२)", en: "Condone a Lapsed Hearing Date — §168 (Form 32)" },
  summary: {
    ne: "काबु बाहिरको परिस्थितिले तारिखमा उपस्थित हुन नसकेकोमा गुज्रेको तारिख थामिदिन माग गर्ने निवेदन।",
    en: "Petition to condone a hearing date missed due to circumstances beyond one's control.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा १६८(३)", "§168(3)"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "उस्तै वा मिल्दोजुल्दो शीर्षकका अरू फाराम पनि छन् (नं. ९, १०, ३०, ३६, ३७) — फरक-फरक दफा भएका। सही फाराम पुष्टि नगरी नबुझाउनुहोस्।",
      en: "Other forms carry the same or a similar title (Nos. 9, 10, 30, 36, 37), each citing a different section. Confirm the right one before filing.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "गुज्रिएको कारण", en: "Why the date lapsed" },
      fields: [
        bsDateField("fixedDateBs", { ne: "तोकिएको तारिख (वि.सं.)", en: "The fixed date (BS)" }),
        { id: "lapseReason", type: "textarea", required: true, label: { ne: "तारिख गुज्रिनुको कारण", en: "Reason the date lapsed" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "गुज्रेको तारिख थामिपाऊँ", en: "Praying that a lapsed hearing date be condoned" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा यस अदालतबाट मिति {{fixedDateBs}} गतेको तारिख तोकी पाएको थिएँ/थियौं। उक्त मितिमा अदालतमा उपस्थित भै तारिख लिनुपर्नेमा {{lapseReason}} भई तारिख गुज्रन गयो। तसर्थ मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा १६८(३) बमोजिम गुज्रेको तारिख थामिपाऊँ। आवश्यक प्रमाण यसैसाथ संलग्न छ।",
        en: "In the above case, I/we had been given a hearing date of {{fixedDateBs}} (BS) by this Court. I/we were required to appear and take the next date on that date, but the date lapsed because {{lapseReason}}. I therefore petition, under Criminal Procedure Code §168(3), that the lapsed date be condoned. The necessary evidence is attached.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 36 — a lapsed deadline condoned, three grounds ending in a criminal section
 * ================================================================================= */
export const petitionLapsedDeadlineThreeGround: Template = {
  slug: "court-petition-36-lapsed-deadline-three-ground",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "गुज्रेको म्याद थामिपाऊँ (फाराम नं. ३६)", en: "Condone a Lapsed Deadline (Form 36)" },
  summary: {
    ne: "काबु बाहिरको परिस्थितिले जारी भएको म्याद गुज्रिएकोमा, फौजदारी मुद्दामा लागू हुने तीन सम्भावित आधारमध्ये एक छानी म्याद थामिदिन माग गर्ने निवेदन।",
    en: "Petition to condone a lapsed deadline in a criminal case, on whichever of three possible statutory grounds applies.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा ५९(५)", "§59(5)"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "उस्तै वा मिल्दोजुल्दो शीर्षकका अरू फाराम पनि छन् (नं. ९, १०, ३०, ३२, ३७) — फरक-फरक दफा भएका। सही फाराम पुष्टि नगरी नबुझाउनुहोस्।",
      en: "Other forms carry the same or a similar title (Nos. 9, 10, 30, 32, 37), each citing a different section. Confirm the right one before filing.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "म्याद र गुज्रिएको कारण", en: "The deadline and why it lapsed" },
      fields: [
        { id: "deadlineDays", type: "text", required: false, label: { ne: "जारी भएको म्याद (दिन)", en: "Deadline originally issued (days)" } },
        bsDateField("servedDateBs", { ne: "म्याद तामेल भएको मिति (वि.सं.)", en: "Date the deadline was served (BS)" }, false),
        bsDateField("dueDateBs", { ne: "हाजिर हुनुपर्ने मिति (वि.सं.)", en: "Date appearance was due (BS)" }, false),
        {
          id: "ground",
          type: "select",
          required: true,
          label: { ne: "लागू हुने आधार", en: "Ground relied on" },
          options: [
            { value: "summary", label: { ne: "(क) संक्षिप्त कार्यविधि ऐन, २०२८ को दफा ८(१) — १५ दिनभित्र", en: "(a) Summary Procedure Act §8(1) — within 15 days" } },
            { value: "special", label: { ne: "(ख) विशेष अदालत ऐन, २०५९ को दफा ११ — १५ दिनभित्र", en: "(b) Special Court Act §11 — within 15 days" } },
            { value: "criminal59", label: { ne: "(ग) मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ५९(५)", en: "(c) Criminal Procedure Code §59(5)" } },
          ],
        },
        { id: "groundDetail", type: "textarea", required: false, label: { ne: "(ग) छानिएमा: मिति र कारणको विवरण", en: "If (c) is chosen: the date and reason in detail" } },
        { id: "daysClaimed", type: "text", required: false, label: { ne: "माग गरिएको दिन संख्या", en: "Number of days claimed" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "गुज्रेको म्याद थामिपाऊँ", en: "Praying that a lapsed deadline be condoned" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा सम्मानित अदालतबाट म/हामीका नाममा जारी भएको {{deadlineDays}} दिने म्याद मिति {{servedDateBs}} मा तामेल भई मिति {{dueDateBs}} सम्ममा हाजिर हुनुपर्नेमा काबु बाहिरको परिस्थिति परी अदालतमा हाजिर हुन नसकी सो म्याद गुज्रिन गएकोले {{ground}} बमोजिम {{groundDetail}} {{daysClaimed}} दिनको म्याद थामिपाऊँ। प्रमाण यसैसाथ संलग्न गरेको छु।",
        en: "The {{deadlineDays}}-day deadline issued in my/our name by this Court was served on {{servedDateBs}} (BS), requiring appearance by {{dueDateBs}} (BS). Circumstances beyond my/our control prevented appearance and the deadline lapsed. I petition, under {{ground}}, {{groundDetail}} that {{daysClaimed}} day(s) be condoned. The evidence is attached.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 17 — amend a filed pleading (clerical or typing error only)
 * ================================================================================= */
export const petitionAmendPleading: Template = {
  slug: "court-petition-17-amend-pleading",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "संशोधन गरिपाऊँ (फाराम नं. १७)", en: "Correct a Clerical Error in a Pleading (Form 17)" },
  summary: {
    ne: "पेस गरिसकेको पुनरावेदन पत्र, रिट निवेदन वा लिखित जवाफमा टाइप वा लेखाइको भुलबाट भएको त्रुटि सच्याउने निवेदन।",
    en: "Petition to correct a typing or clerical error in an appeal, writ petition or written reply already filed.",
  },
  governingAct: cite(ACTS.civilProcedureRules, "नियम १४", "Rule 14"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "यो फाराम टाइप वा लेखाइको भुल सच्याउनका लागि मात्र हो — दाबी वा तर्कको सारभूत परिवर्तनका लागि होइन।",
      en: "This form is only for a typing or clerical slip — not for a substantive change to a claim or argument.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "त्रुटि र सच्याइ", en: "The error and the correction" },
      fields: [
        {
          id: "documentType",
          type: "select",
          required: true,
          label: { ne: "कुन कागजातमा त्रुटि छ", en: "Which document carries the error" },
          options: [
            { value: "appeal", label: { ne: "पुनरावेदन पत्र", en: "Appeal" } },
            { value: "writ", label: { ne: "रिट निवेदन", en: "Writ petition" } },
            { value: "reply", label: { ne: "लिखित जवाफ", en: "Written reply" } },
          ],
        },
        { id: "pageNo", type: "text", required: false, label: { ne: "पाना नं.", en: "Page no." } },
        { id: "lineNo", type: "text", required: false, label: { ne: "हरफ", en: "Line" } },
        { id: "errorDetail", type: "textarea", required: true, label: { ne: "त्रुटि र सच्याइनुपर्ने बेहोरा", en: "The error, and the wording it should read instead" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "संशोधन गरिपाऊँ", en: "Praying to correct a clerical error" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा मैले/हामीले पेस गरेको {{documentType}}मा तपसिलमा उल्लेख भए अनुसारको टाइप/लेखाइको भुलबाट त्रुटि हुन गएको हुँदा सोको सट्टा तपसिलमा उल्लेख भए बमोजिमको बेहोरा कायम हुने गरी मुलुकी देवानी कार्यविधि नियमावली, २०७५ को नियम १४ र सर्वोच्च अदालत नियमावली, २०७४ को नियम १९ बमोजिम लिखत संशोधन गरिपाऊँ।\n\nपाना नं. {{pageNo}}, हरफ {{lineNo}}:\n{{errorDetail}}",
        en: "In the {{documentType}} I/we filed in the above case, a typing/clerical error occurred as set out below. I petition, under Civil Procedure Rules Rule 14 and Supreme Court Regulation Rule 19, that the document be corrected accordingly.\n\nPage {{pageNo}}, line {{lineNo}}:\n{{errorDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 18 — withdrawal of a case
 * ================================================================================= */
export const petitionCaseWithdrawal: Template = {
  slug: "court-petition-18-case-withdrawal",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "मुद्दा फिर्ता गरिपाऊँ (फाराम नं. १८)", en: "Withdraw the Case (Form 18)" },
  summary: {
    ne: "दायर गरेको रिट, निवेदन वा पुनरावेदनको दाबी त्यागी मुद्दा फिर्ता लिने निवेदन।",
    en: "Petition to abandon a claim in a filed writ, petition or appeal and withdraw the case.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १९६", "§196"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "मुद्दा फिर्ता लिएपछि सामान्यतया सोही दाबीमा फेरि उजुर गर्न पाइँदैन। अपरिवर्तनीय कदम हो — अधिवक्तासँग परामर्श नगरी नबुझाउनुहोस्।",
      en: "Once withdrawn, the same claim generally cannot be brought again. This is an irreversible step — do not file it without an advocate's advice.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "फिर्ताको आधार", en: "Ground for withdrawal" },
      fields: [
        {
          id: "withdrawalGround",
          type: "select",
          required: true,
          label: { ne: "आधार", en: "Ground" },
          options: [
            { value: "abandon", label: { ne: "दाबी त्यागी फिर्ता लिनका लागि", en: "To abandon the claim" } },
            { value: "cannotProve", label: { ne: "आफ्नो दाबी साबित गर्न नसक्ने भएकोले", en: "Unable to prove the claim" } },
            { value: "purposeServed", label: { ne: "दाबीको प्रयोजन समाप्त भएकोले", en: "The purpose of the claim has already been served" } },
          ],
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "मुद्दा फिर्ता गरिपाऊँ", en: "Praying to withdraw the case" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "मैले/हामीले दायर गरेको रिट/निवेदन/पुनरावेदनपत्र बमोजिमको दाबी त्यागी सो दाबी फिर्ता लिनको लागि — {{withdrawalGround}} — प्रस्तुत मुद्दा मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १९६ बमोजिम फिर्ता गरिपाउन यो निवेदन गरेको छु/छौं। माग बमोजिम मुद्दा फिर्ता गरिपाऊँ।",
        en: "I/we abandon the claim made in my/our filed writ/petition/appeal — the ground being that {{withdrawalGround}} — and petition, under Civil Procedure Code §196, that this case be withdrawn accordingly.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 19 — a case stayed pending a related, interdependent case
 * ================================================================================= */
export const petitionCaseStayed19: Template = {
  slug: "court-petition-19-case-stayed",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "मुद्दा मुलतबीमा राखिपाऊँ (फाराम नं. १९)", en: "Stay the Case (Form 19)" },
  summary: {
    ne: "अर्को अदालतमा विचाराधीन एउटा अन्तरप्रभावी मुद्दाको टुंगो नलागेसम्म, प्रस्तुत मुद्दा मुलतबीमा राख्न माग गर्ने निवेदन।",
    en: "Petition to stay the present case pending the outcome of another, interdependent case before a different court.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा २०१", "§201"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "अन्तरप्रभावी मुद्दाको विवरण", en: "The related case" },
      fields: [
        { id: "relatedCourt", type: "text", required: true, label: { ne: "विचाराधीन रहेको अदालत", en: "Court where the related case is pending" } },
        { id: "relatedParties", type: "text", required: false, label: { ne: "वादी/प्रतिवादी", en: "Plaintiff/defendant" } },
        { id: "relatedCaseNo", type: "text", required: false, label: { ne: "मु.नं.", en: "Case no." } },
        { id: "relatedCaseName", type: "text", required: false, label: { ne: "मुद्दाको किसिम", en: "Nature of that case" } },
        { id: "otherReasons", type: "textarea", required: false, label: { ne: "अन्य कारण भए", en: "Any other reason" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "मुद्दा मुलतबीमा राखिपाऊँ", en: "Praying to stay the case" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "प्रस्तुत मुद्दा सम्मानित अदालतमा दायर भई कारबाहीयुक्त अवस्थामा रहेको छ। {{relatedCourt}} मा कारबाहीयुक्त अवस्थामा रहेको वादी {{relatedParties}} भएको मु.नं. {{relatedCaseNo}} को {{relatedCaseName}} मुद्दा प्रस्तुत मुद्दासँग अन्तरप्रभावी रहेकाले सो मुद्दा फैसला नहुन्जेलसम्मका लागि, {{otherReasons}}, उल्लिखित मुद्दा मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा २०१ बमोजिम मुलतबीमा राखिपाऊँ।",
        en: "This case is pending before this Court. As a related and interdependent case — {{relatedCaseName}}, case no. {{relatedCaseNo}}, between {{relatedParties}} — remains pending before {{relatedCourt}}, and {{otherReasons}}, I petition, under Civil Procedure Code §201, that this case be stayed until that case is decided.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 20 — a stayed case revived, its purpose for staying having ended
 * ================================================================================= */
export const petitionCaseRevivedFromStay: Template = {
  slug: "court-petition-20-case-revived-from-stay",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "मुद्दा मुलतबीबाट जगाइपाऊँ (फाराम नं. २०)", en: "Revive a Stayed Case (Form 20)" },
  summary: {
    ne: "मुलतबी राख्नुको प्रयोजन समाप्त भइसकेकोमा, मुद्दा मुलतबीबाट जगाई कारबाही अगाडि बढाउन माग गर्ने निवेदन।",
    en: "Petition to revive a case from a stay whose original purpose has now ended, and to resume proceedings.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा २०२", "§202"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "मुलतबीको विवरण", en: "The stay" },
      fields: [
        bsDateField("stayOrderDateBs", { ne: "मुलतबी राख्ने आदेश मिति (वि.सं.)", en: "Date of the order staying the case (BS)" }, false),
        { id: "stayReason", type: "textarea", required: true, label: { ne: "मुलतबी राखिएको कारण", en: "The original reason for the stay" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "मुद्दा मुलतबीबाट जगाइपाऊँ", en: "Praying to revive the case from stay" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "प्रस्तुत मुद्दा {{stayReason}} कारणबाट सम्मानित अदालतको मिति {{stayOrderDateBs}} को आदेशानुसार मुलतबीमा रहेकोमा उक्त प्रयोजन समाप्त भइसकेकोले मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा २०२ बमोजिम मुलतबीबाट जगाई कारबाही गरिपाउन सम्बन्धित कागजात संलग्न राखी निवेदन गर्दछु/गर्दछौं। निवेदन मागबमोजिम मुद्दा मुलतबीबाट जगाइ पाऊँ।",
        en: "This case was stayed by the Court's order of {{stayOrderDateBs}} (BS) because {{stayReason}}, and that purpose has now ended. I petition, under Civil Procedure Code §202, with the relevant documents attached, that the case be revived from stay and proceedings resumed.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 21 — deferred court fee facility, for a party of limited means
 * ================================================================================= */
export const petitionDeferredFeeFacility: Template = {
  slug: "court-petition-21-deferred-fee-facility",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "अदालती शुल्क पछि बुझाउने गरी सुविधा पाऊँ (फाराम नं. २१)", en: "Defer Payment of the Court Fee (Form 21)" },
  summary: {
    ne: "आर्थिक हैसियत कमजोर भई तत्काल अदालती शुल्क दाखिला गर्न नसक्नेका लागि, पछि बुझाउने गरी सुविधा माग गर्ने निवेदन।",
    en: "Petition for a party of limited means to defer payment of a court fee they cannot pay immediately.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा ६५", "§65"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "शुल्क र आधार", en: "The fee and the ground" },
      fields: [
        moneyField("feeDueNpr", { ne: "दाखिला गर्नुपर्ने अदालती शुल्क (रु.)", en: "Court fee required (NPR)" }),
        {
          id: "hardshipGround",
          type: "select",
          required: true,
          label: { ne: "आधार", en: "Ground" },
          options: [
            { value: "noOtherProperty", label: { ne: "मुद्दा परेको सम्पत्ति बाहेक अन्य सम्पत्ति नभएकाले", en: "No property other than that in dispute" } },
            { value: "poor", label: { ne: "आर्थिक हैसियत कमजोर भएकाले", en: "Financial means are limited" } },
          ],
        },
        { id: "recommendationOffice", type: "text", required: false, label: { ne: "सिफारिस दिने न.पा./गा.पा.", en: "Municipality/rural municipality issuing the recommendation" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "अदालती शुल्क पछि बुझाउने गरी सुविधा पाऊँ", en: "Praying to defer the court fee" }),
    partiesClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उपरोक्त विषयमा विपक्षी उपर प्रस्तुत मुद्दा दायर गर्न यस अदालतको आदेशानुसार म/हामीसँगबाट माग भएअनुसारको अदालती शुल्क रु. {{feeDueNpr}} दाखिला गर्नुपर्ने भएकोमा {{hardshipGround}} उक्त अदालती शुल्क हाल दाखिल गर्न नसक्ने हुँदा मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा ६५ बमोजिम अदालती शुल्क पछि बुझाउने गरी सुविधा पाऊँ।\n\nसंलग्न कागजात: {{recommendationOffice}}को सिफारिसपत्र।",
        en: "I/we are required to deposit a court fee of NPR {{feeDueNpr}} to file this case, but {{hardshipGround}} I/we cannot pay it now. I petition, under Civil Procedure Code §65, to be allowed to pay the court fee later.\n\nAttached: recommendation letter from {{recommendationOffice}}.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 22 — belated evidence filed ahead of the hearing
 * ================================================================================= */
export const petitionBelatedEvidence: Template = {
  slug: "court-petition-22-belated-evidence",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "छुट प्रमाण पेस गरेको बारे (फाराम नं. २२)", en: "Belated Evidence Filed (Form 22)" },
  summary: {
    ne: "प्रमाण लाग्ने कागज पेस गर्न छुट भएकोमा, पेसी तारिखभन्दा अघि नै पेस गर्ने निवेदन।",
    en: "Petition confirming that evidence, omitted earlier, has now been filed ahead of the hearing date.",
  },
  governingAct: cite(ACTS.supremeCourtRules, "नियम ६९", "Rule 69"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "छुट भएको कारण र प्रमाण", en: "Why it was omitted, and the evidence" },
      fields: [
        { id: "omissionReason", type: "textarea", required: true, label: { ne: "पेस गर्न छुट भएको कारण", en: "Reason it was not filed earlier" } },
        { id: "evidenceList", type: "textarea", required: true, label: { ne: "पेस गरिएको प्रमाणको सूची", en: "List of the evidence now filed" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "छुट प्रमाण पेस गरेको बारे", en: "Belated evidence filed" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा प्रमाण लाग्ने निम्न कागज {{omissionReason}} कारणले पेस गर्न छुट भएको हुनाले पेसी तारिख अघि नै सर्वोच्च अदालत नियमावली, २०७४ को नियम ६९ बमोजिम छुट प्रमाण पेस गरेको छु। मिसिल सामेल राखिपाऊँ।\n\n{{evidenceList}}",
        en: "The following evidence, relevant to the case, was not filed earlier because {{omissionReason}}. I file it now, ahead of the hearing date, under Supreme Court Regulation Rule 69, and petition that it be placed on the record.\n\n{{evidenceList}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 23 — correction of a clerical error in a judgment or order
 * ================================================================================= */
export const petitionJudgmentCorrection: Template = {
  slug: "court-petition-23-judgment-correction",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "फैसला/आदेश संशोधन गरिपाऊँ (फाराम नं. २३)", en: "Correct a Clerical Error in a Judgment or Order (Form 23)" },
  summary: {
    ne: "अदालतबाट भएको फैसला वा आदेशमा टाइप वा लेखाइको भुलबाट भएको त्रुटि सच्याउने निवेदन।",
    en: "Petition to correct a typing or clerical error in the court's own judgment or order.",
  },
  governingAct: cite(ACTS.judicialAdministration, "दफा १८", "§18"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "यो फाराम टाइप वा लेखाइको भुल सच्याउनका लागि मात्र हो — फैसलाको तर्क वा नतिजा बदल्नका लागि होइन।",
      en: "This form is only for a typing or clerical slip — not for changing the judgment's reasoning or outcome.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "त्रुटि र सच्याइ", en: "The error and the correction" },
      fields: [
        bsDateField("judgmentDateBs", { ne: "फैसला/आदेश भएको मिति (वि.सं.)", en: "Date of the judgment/order (BS)" }),
        { id: "pageNo", type: "text", required: false, label: { ne: "पाना नं.", en: "Page no." } },
        { id: "lineNo", type: "text", required: false, label: { ne: "हरफ", en: "Line" } },
        { id: "errorDetail", type: "textarea", required: true, label: { ne: "त्रुटि र सच्याइनुपर्ने बेहोरा", en: "The error, and the wording it should read instead" } },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "फैसला/आदेश संशोधन गरिपाऊँ", en: "Praying to correct the judgment/order" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दा सम्मानित अदालतमा दायर भई मिति {{judgmentDateBs}} मा फैसला/आदेश भएको छ। सो फैसला/आदेशमा तपसिलमा उल्लेख भए अनुसारको टाइप/लेखाइको भुलबाट त्रुटि हुन गएको हुँदा सोको सट्टा तपसिलबमोजिमको बेहोरा कायम गर्ने गरी न्याय प्रशासन ऐन, २०७३ को दफा १८ र सर्वोच्च अदालत नियमावली, २०७४ को नियम ९४ बमोजिम संशोधन गरिपाऊँ।\n\nपाना नं. {{pageNo}}, हरफ {{lineNo}}:\n{{errorDetail}}",
        en: "Judgment/order was given in this case on {{judgmentDateBs}} (BS). A typing/clerical error occurred in it, as set out below. I petition, under Administration of Justice Act §18 and Supreme Court Regulation Rule 94, that it be corrected accordingly.\n\nPage {{pageNo}}, line {{lineNo}}:\n{{errorDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 24 — remain on the bond/deposit hearing roll pending the original case file
 * ================================================================================= */
export const petitionBondHearingDate: Template = {
  slug: "court-petition-24-bond-hearing-date",
  category: "litigation",
  priceNpr: 299,
  title: { ne: "धरौट तारेख पाऊँ (फाराम नं. २४)", en: "Remain on the Bond Hearing Roll (Form 24)" },
  summary: {
    ne: "पुनरावेदन वा दोहोऱ्याई हेर्ने निवेदन दर्ता भई तारिख तोकिएकोमा, सक्कल मिसिल प्राप्त हुन नआएकाले हाललाई धरौट तारेखमा रहन दिने निवेदन।",
    en: "Petition to remain provisionally on the bond hearing roll while the original case file has not yet arrived from the lower court.",
  },
  governingAct: cite(ACTS.supremeCourtRules, "नियम ६०(४)", "Rule 60(4)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "विवरण", en: "Detail" },
      fields: [
        { id: "originatingCourt", type: "text", required: false, label: { ne: "मुद्दा दायर भएको अदालत", en: "Court the case was filed through" } },
        {
          id: "petitionType",
          type: "select",
          required: true,
          label: { ne: "निवेदनको किसिम", en: "Kind of petition" },
          options: [
            { value: "appeal", label: { ne: "पुनरावेदन पत्र", en: "Appeal" } },
            { value: "review", label: { ne: "दोहोर्‍याई हेरी पाउँ निवेदन", en: "Petition for review" } },
          ],
        },
        bsDateField("dateFixedBs", { ne: "हाजिर हुन तोकिएको मिति (वि.सं.)", en: "Date fixed to appear (BS)" }, false),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "धरौट तारेख पाऊँ", en: "Praying to remain on the bond hearing roll" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दा {{originatingCourt}} अदालतमार्फत {{petitionType}} निवेदन दर्ता भई आज मिति {{dateFixedBs}} को तारिख तोकी हाजिर हुन जानु भनी पठाएकोमा उक्त मुद्दाको सक्कल मिसिल प्राप्त हुन नआएकाले सर्वोच्च अदालत नियमावली, २०७४ को नियम ६०(४) बमोजिम हाललाई धरौट तारेखमा रहन पाऊँ। तारिख पर्चाको प्रतिलिपि यसैसाथ छ।",
        en: "This {{petitionType}} was registered through {{originatingCourt}} and a hearing date of {{dateFixedBs}} (BS) was fixed, but the original case file has not yet arrived. I petition, under Supreme Court Regulation Rule 60(4), to remain provisionally on the bond hearing roll. A copy of the hearing slip is attached.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 25 — learn what a judgment said before the full text is ready
 * ================================================================================= */
export const petitionJudgmentInformation: Template = {
  slug: "court-petition-25-judgment-information",
  category: "litigation",
  priceNpr: 299,
  title: {
    ne: "फैसला/आदेशको जानकारी पाऊँ (फाराम नं. २५)",
    en: "Obtain the Substance of a Judgment or Order (Form 25)",
  },
  summary: {
    ne: "फैसला वा आदेश भइसकेको तर पूर्ण पाठ तयार हुन समय लाग्ने अवस्थामा, सरोकारवालाले बेहोराको जानकारी माग्ने निवेदन।",
    en: "Petition by an interested party for the substance of a judgment already delivered, where the full text will take time to prepare.",
  },
  governingAct: cite(ACTS.supremeCourtRules, "नियम ९१(५)(६)", "Rule 91(5)(6)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "फैसलाको विवरण", en: "The judgment" },
      fields: [
        bsDateField(
          "judgmentDateBs",
          { ne: "फैसला/आदेश भएको मिति (वि.सं.)", en: "Date of the judgment or order (BS)" },
          true,
        ),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "फैसला/आदेशको जानकारी पाऊँ",
      en: "Praying for the substance of a judgment or order",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा सम्मानित अदालतबाट मिति {{judgmentDateBs}} मा फैसला/आदेश भएकोमा पूर्ण पाठ तयार हुन समय लाग्ने भएकाले उक्त फैसला/आदेशको बेहोराको जानकारी पाउन म/हामी सरोकारवाला भएकाले यो निवेदन गरेको छु/छौं। सर्वोच्च अदालत नियमावली, २०७४ को नियम ९१(५)(६) बमोजिम उक्त मितिको फैसला/आदेशको जानकारी पाऊँ।",
        en: "In the above case this honourable court delivered its judgment or order on {{judgmentDateBs}} (BS). As the full text will take time to prepare and I am/we are an interested party, I/we petition under Supreme Court Regulation Rule 91(5)(6) to be informed of the substance of that judgment or order.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 26 — explain an absence caused by being in custody
 * ================================================================================= */
export const petitionDetentionNotice: Template = {
  slug: "court-petition-26-detention-notice",
  category: "litigation",
  priceNpr: 299,
  title: {
    ne: "थुनामा परेको जानकारी बारे (फाराम नं. २६)",
    en: "Notify the Court of Detention (Form 26)",
  },
  summary: {
    ne: "अर्को मुद्दामा थुनामा परेकाले तोकिएको तारिखमा हाजिर हुन नसकेको बेहोरा अदालतलाई जनाउने निवेदन।",
    en: "Petition informing the court that a fixed hearing date could not be attended because the party is in custody in another case.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १४०", "§140"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "थुनाको विवरण", en: "The detention" },
      intro: {
        ne: "यो निवेदन थुनामा परेको व्यक्ति आफैंले, वा एकासगोलको परिवार, कानून व्यवसायी वा वारिसले दिन सक्छ।",
        en: "This petition may be given by the detained person, or by a joint-family member, legal practitioner or attorney on their behalf.",
      },
      fields: [
        bsDateField(
          "hearingDateBs",
          { ne: "तोकिएको तारिख (वि.सं.)", en: "Hearing date that was fixed (BS)" },
          true,
        ),
        {
          id: "detentionCase",
          type: "text",
          required: true,
          label: { ne: "कुन मुद्दामा थुनामा", en: "Case in which detained" },
        },
        bsDateField(
          "detentionFromBs",
          { ne: "थुनामा परेको मिति (वि.सं.)", en: "In custody since (BS)" },
          true,
        ),
        {
          id: "informant",
          type: "select",
          required: true,
          label: { ne: "जानकारी दिने", en: "Who is giving this notice" },
          options: [
            { value: "self", label: { ne: "म आफैं", en: "the detained party" } },
            { value: "family", label: { ne: "एकासगोलको परिवार", en: "a joint-family member" } },
            { value: "lawyer", label: { ne: "कानून व्यवसायी", en: "a legal practitioner" } },
            { value: "attorney", label: { ne: "वारिस", en: "an attorney" } },
          ],
        },
        {
          id: "informantName",
          type: "text",
          required: false,
          label: { ne: "जानकारी दिनेको नाम", en: "Name of the person giving notice" },
          help: {
            ne: "थुनामा परेको व्यक्ति आफैंले दिएको भए खाली छोड्नुहोस्।",
            en: "Leave blank where the detained party is giving the notice themselves.",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "थुनामा परेको जानकारी बारे", en: "Notice of detention" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा म/हामीलाई मिति {{hearingDateBs}} को तारिख तोकिएकोमा म/हामी {{detentionCase}} मुद्दामा मिति {{detentionFromBs}} देखि थुनामा परेको हुनाले तारिखमा हाजिर हुन नसकेको हुँदा {{informant}} {{informantName}} बाट मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १४० बमोजिम थुनामा परेको बेहोरा जानकारीको लागि अनुरोध छ।",
        en: "A hearing date of {{hearingDateBs}} (BS) was fixed in the above case. I/we have been in custody since {{detentionFromBs}} (BS) in the case of {{detentionCase}} and could not attend. This notice of that detention is accordingly given by {{informant}} {{informantName}} under Civil Procedure Code §140.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 27 — have a settlement notified to the office that must act on it
 * ================================================================================= */
export const petitionSettlementNotice: Template = {
  slug: "court-petition-27-settlement-notice",
  category: "litigation",
  priceNpr: 399,
  title: {
    ne: "मिलापत्रको जानकारी गराइपाऊँ (फाराम नं. २७)",
    en: "Notify a Settlement to the Relevant Office (Form 27)",
  },
  summary: {
    ne: "पक्षहरूबीच मिलापत्र भइसकेपछि, सोबमोजिम गर्न सम्बन्धित अड्डाका नाममा जनाउ पुर्जी जारी गर्न माग्ने निवेदन।",
    en: "Petition, after the parties have settled, for a notice slip to issue to the office that must give effect to the settlement.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १९३(६)", "§193(6)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "मिलापत्रको विवरण", en: "The settlement" },
      fields: [
        {
          id: "settlementTerms",
          type: "textarea",
          required: true,
          label: { ne: "मिलापत्रको बेहोरा", en: "Terms of the settlement" },
          help: {
            ne: "मिलापत्रमा उल्लेख भएकै बेहोरा लेख्नुहोस्। यहाँ नयाँ सर्त थप्नु हुँदैन — जनाउ पुर्जी मिलापत्रकै आधारमा जारी हुन्छ।",
            en: "State the terms as they appear in the settlement itself. Do not add new terms here — the notice issues on the strength of the settlement as recorded.",
          },
        },
        bsDateField(
          "settlementDateBs",
          { ne: "मिलापत्र भएको मिति (वि.सं.)", en: "Date of the settlement (BS)" },
          true,
        ),
        {
          id: "targetOffice",
          type: "text",
          required: false,
          label: { ne: "जनाउ पुर्जी पठाउनुपर्ने अड्डा", en: "Office the notice should go to" },
          placeholder: { ne: "मालपोत कार्यालय, काठमाडौं", en: "Land Revenue Office, Kathmandu" },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "मिलापत्रको जानकारी गराइपाऊँ", en: "Praying that a settlement be notified" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उपर्युक्त मुद्दा सम्मानित अदालतमा दायर भई हामीहरूबीच {{settlementTerms}} बेहोराबाट मिति {{settlementDateBs}} मा मिलापत्र भएकाले मिलापत्रबमोजिम गरिदिनु भनी सम्बन्धित अड्डा {{targetOffice}} का नाममा मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १९३(६) बमोजिम जनाउ पुर्जी गरिपाऊँ।",
        en: "The above case was filed in this honourable court and the parties settled on {{settlementDateBs}} (BS) on the following terms: {{settlementTerms}}. I/we petition under Civil Procedure Code §193(6) for a notice slip to issue to {{targetOffice}}, directing that the settlement be given effect.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 28 — freeze disputed property before it can be transferred away
 * ================================================================================= */
export const petitionPropertyAttachment: Template = {
  slug: "court-petition-28-property-attachment",
  category: "litigation",
  priceNpr: 499,
  title: {
    ne: "सम्पत्ति रोक्का राखिपाऊँ (फाराम नं. २८)",
    en: "Attach Disputed Property (Form 28)",
  },
  summary: {
    ne: "विचाराधीन मुद्दामा दाबी गरिएको सम्पत्ति हक हस्तान्तरण वा धितो बन्धक राख्न नपाउने गरी रोक्का राख्न माग्ने निवेदन।",
    en: "Petition to freeze property claimed in a pending case, so it cannot be transferred or mortgaged while the case runs.",
  },
  governingAct: cite(ACTS.civilCode, "दफा २३०", "§230"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "रोक्का राख्नुपर्ने सम्पत्ति", en: "The property to be frozen" },
      intro: {
        ne: "यो निवेदनको आधार सम्पत्ति अन्यत्र हक हस्तान्तरण हुने सम्भावना हो। सम्पत्ति यति स्पष्ट खुलाउनुपर्छ कि मालपोत वा सम्बन्धित कार्यालयले ठ्याक्कै त्यही सम्पत्ति पहिचान गर्न सकोस्।",
        en: "The ground for this petition is the risk that the property will be transferred away. It must be described precisely enough that the land revenue or other relevant office can identify exactly the property meant.",
      },
      fields: [
        {
          id: "nationalIdNo",
          type: "text",
          required: false,
          label: { ne: "राष्ट्रिय परिचयपत्र नं.", en: "National identity card no." },
        },
        bsDateField(
          "caseFiledBs",
          { ne: "मुद्दा दायर गरेको मिति (वि.सं.)", en: "Date the case was filed (BS)" },
          true,
        ),
        {
          id: "immovableProperty",
          type: "textarea",
          required: false,
          label: { ne: "अचल सम्पत्तिको विवरण", en: "Immovable property" },
          help: {
            ne: "जिल्ला, न.पा./गा.पा., वडा नं., कित्ता नं., क्षेत्रफल, सिट नं., दर्तावालाको नाम — प्रत्येक कित्ता छुट्टै लाइनमा।",
            en: "District, municipality, ward, plot no., area, sheet no. and registered owner — one plot per line.",
          },
          placeholder: {
            ne: "काठमाडौं, काठमाडौं म.न.पा., वडा नं. १०, कि.नं. ४५६, क्षे.फ. ०-४-२-०, सिट नं. ७८, दर्तावाला: राम बहादुर",
            en: "Kathmandu, Kathmandu Metropolitan City, Ward 10, Plot 456, area 0-4-2-0, Sheet 78, registered to Ram Bahadur",
          },
        },
        {
          id: "movableProperty",
          type: "textarea",
          required: false,
          label: { ne: "चल सम्पत्तिको विवरण", en: "Movable property" },
        },
        {
          id: "attachedDocuments",
          type: "textarea",
          required: false,
          label: { ne: "संलग्न कागजात", en: "Documents attached" },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "सम्पत्ति रोक्का राखिपाऊँ", en: "Praying for attachment of property" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित विपक्षी उपर मैले मिति {{caseFiledBs}} मा प्रस्तुत मुद्दा दायर गरी हाल विचाराधीन अवस्थामा रहेको छ। मैले/हामीले दाबी गरेको सम्पत्ति अन्य व्यक्तिहरूलाई हक हस्तान्तरण गर्ने सम्भावना रहेको छ। उक्त सम्पत्ति हक हस्तान्तरण भई गएमा मेरो हकमा असर पर्ने भएकोले तपसिलबमोजिमको सम्पत्ति कुनै पनि बेहोराले हक हस्तान्तरण, धितो बन्धक समेत राख्न नपाउने गरी मुलुकी देवानी संहिता, २०७४ को दफा २३० बमोजिम रोक्का राखिपाऊँ।",
        en: "I filed the present case against the opposing party on {{caseFiledBs}} (BS) and it remains pending. There is a risk that the property I/we claim will be transferred to others, which would prejudice my rights. I/we therefore petition under Civil Code §230 that the property described below be frozen against any transfer of title or creation of mortgage or charge.",
      },
    },
    {
      id: "schedule",
      heading: { ne: "तपसिल — सम्पत्तिको विवरण", en: "Schedule — the property" },
      body: {
        ne: "(क) अचल सम्पत्ति:\n{{immovableProperty}}\n\n(ख) चल सम्पत्ति:\n{{movableProperty}}\n\nसंलग्न कागजात:\n{{attachedDocuments}}\n\nराष्ट्रिय परिचयपत्र नं.: {{nationalIdNo}}",
        en: "(a) Immovable property:\n{{immovableProperty}}\n\n(b) Movable property:\n{{movableProperty}}\n\nDocuments attached:\n{{attachedDocuments}}\n\nNational identity card no.: {{nationalIdNo}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 29 — get onto, or back onto, the hearing roll
 * ================================================================================= */
export const petitionRemainOnHearingRoll: Template = {
  slug: "court-petition-29-remain-on-hearing-roll",
  category: "litigation",
  priceNpr: 299,
  title: {
    ne: "तारेखमा बस्न पाऊँ (फाराम नं. २९)",
    en: "Remain on the Hearing Roll (Form 29)",
  },
  summary: {
    ne: "तारेखमा नरहने गरी मुद्दा दर्ता गराएकोमा तारेखमा बस्न, वा तारेख गुज्रिएकोमा पुनः तारेखमा बस्न माग्ने निवेदन।",
    en: "Petition to go onto the hearing roll after registering a case without doing so, or to return to it after a date has lapsed.",
  },
  governingAct: cite(ACTS.supremeCourtRules, "नियम ७१", "Rule 71"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "आधार", en: "The ground" },
      fields: [
        {
          id: "rollGround",
          type: "select",
          required: true,
          label: { ne: "कुन अवस्था हो", en: "Which situation applies" },
          help: {
            ne: "यी दुई फरक नियम हुन्। पहिलो कहिल्यै तारेखमा नबसेकोमा लागू हुन्छ; दोस्रो बसेर गुज्रिएकोमा। गलत छनोटले निवेदन नै अस्वीकार हुन सक्छ।",
            en: "These are two different rules. The first applies where the party never went onto the roll; the second where they were on it and the date lapsed. Choosing wrongly can get the petition refused outright.",
          },
          options: [
            {
              value: "rule71_2",
              label: {
                ne: "तारेखमा नरहने गरी दर्ता गराएको — नियम ७१(२)",
                en: "Registered without going onto the roll — Rule 71(2)",
              },
            },
            {
              value: "rule71_4",
              label: {
                ne: "तारेखमा बस्दा गुज्रन गएको — नियम ७१(४)",
                en: "Was on the roll and the date lapsed — Rule 71(4)",
              },
            },
          ],
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "तारेखमा बस्न पाऊँ", en: "Praying to remain on the hearing roll" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उपर्युक्त मुद्दामा मैले/हामीले सर्वोच्च अदालत नियमावली, २०७४ को {{rollGround}} बमोजिम निवेदनसाथ उपस्थित भएको छु/छौं। तारेखमा रहन पाऊँ।",
        en: "In the above case I/we appear with this petition under {{rollGround}} of the Supreme Court Regulation, 2074, and pray to be placed on the hearing roll.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 31 — stay proceedings where the bench has a conflict of interest
 * ================================================================================= */
export const petitionStayForConflict: Template = {
  slug: "court-petition-31-stay-for-conflict",
  category: "litigation",
  priceNpr: 499,
  title: {
    ne: "मुद्दाको कारबाही रोकिपाऊँ (फाराम नं. ३१)",
    en: "Stay Proceedings for Conflict of Interest (Form 31)",
  },
  summary: {
    ne: "पेसी चढेको इजलासका न्यायाधीशको स्वार्थ बाझिने भएकाले मुद्दाको कारबाही र किनारा रोक्न माग्ने निवेदन।",
    en: "Petition to stay proceedings and decision where the judge on the bench has an interest conflicting with the case.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा १७६(३)", "§176(3)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "स्वार्थ बाझिने आधार", en: "The conflict" },
      intro: {
        ne: "स्वार्थ बाझिने आधार संहिताले नै तोकेको छ। तलका पाँच आधारमध्ये जुन लागू हुन्छ त्यही छान्नुहोस् — आफ्नै शब्दमा नयाँ आधार बनाउनु हुँदैन।",
        en: "The grounds of conflict are prescribed by the Code itself. Choose whichever of the five applies rather than composing a new ground.",
      },
      fields: [
        {
          id: "benchNo",
          type: "text",
          required: false,
          label: { ne: "इजलास नं.", en: "Bench no." },
        },
        {
          id: "judgeName",
          type: "text",
          required: true,
          label: { ne: "माननीय न्यायाधीशको नाम", en: "Name of the Hon. Judge" },
        },
        {
          id: "conflictGround",
          type: "select",
          required: true,
          label: { ne: "स्वार्थ बाझिने कारण", en: "Ground of conflict" },
          options: [
            {
              value: "ownInterest",
              label: {
                ne: "आफ्नो वा नजिकको नातेदारको हकहित वा सरोकार भएको मुद्दा",
                en: "a case in which the judge or a close relative has a right or interest",
              },
            },
            {
              value: "wasParticipant",
              label: {
                ne: "आफू वारिस, कानून व्यवसायी वा साक्षी भएको मुद्दा",
                en: "a case in which the judge was an attorney, legal practitioner or witness",
              },
            },
            {
              value: "priorDecision",
              label: {
                ne: "आफूले न्यायाधीशको हैसियतमा निर्णय वा अन्तिम आदेश गरेको मुद्दा",
                en: "a case the judge decided or made a final order in, sitting as a judge",
              },
            },
            {
              value: "gaveOpinion",
              label: {
                ne: "मुद्दा चल्ने वा नचल्ने विषयमा राय दिएको मुद्दा",
                en: "a case on which the judge gave an opinion as to whether it should proceed",
              },
            },
            {
              value: "familyInterest",
              label: {
                ne: "आफ्नो र एकासगोलका परिवारको स्वार्थ आधारभूत रूपमा गाँसिएको मुद्दा",
                en: "a case fundamentally bound up with the interest of the judge or their joint family",
              },
            },
          ],
        },
        {
          id: "conflictDetail",
          type: "textarea",
          required: false,
          label: { ne: "थप विवरण", en: "Further particulars" },
          help: {
            ne: "जस्तै: कुन अदालतमा, कुन मितिमा। छानिएको आधारलाई ठोस बनाउने तथ्यमात्र लेख्नुहोस्।",
            en: "For example which court, and on what date. State only the facts that make the chosen ground concrete.",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "मुद्दाको कारबाही रोकिपाऊँ", en: "Praying that proceedings be stayed" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दा सम्मानित अदालतमा कारबाहीयुक्त अवस्थामा रही इजलास नं. {{benchNo}} मा पेसी चढेको रहेछ। उक्त इजलासका माननीय न्यायाधीश श्री {{judgeName}} को निम्न कारणले गर्दा प्रस्तुत मुद्दासँग स्वार्थ बाझिने भएको हुँदा मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा १७६(३) बमोजिम मुद्दाको कारबाही र किनारा रोकिपाऊँ।\n\nस्वार्थ बाझिने कारण: {{conflictGround}}\n\n{{conflictDetail}}",
        en: "The above case is proceeding in this honourable court and is listed before Bench No. {{benchNo}}. The Hon. Judge {{judgeName}} sitting on that bench has an interest conflicting with the present case on the ground below. I/we therefore petition under Criminal Procedure Code §176(3) that the proceedings and decision be stayed.\n\nGround of conflict: {{conflictGround}}\n\n{{conflictDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 33 — release property frozen beyond what the case actually required
 * ================================================================================= */
export const petitionReleaseExcessAttachment: Template = {
  slug: "court-petition-33-release-excess-attachment",
  category: "litigation",
  priceNpr: 499,
  title: {
    ne: "बढी रोक्का रहेको सम्पत्ति फुकुवा गरिपाऊँ (फाराम नं. ३३)",
    en: "Release Property Frozen in Excess (Form 33)",
  },
  summary: {
    ne: "मुद्दामा रोक्का राख्नुपर्नेभन्दा बढी सम्पत्ति रोक्का रहेकोमा, बढी भएजति फुकुवा गर्न माग्ने निवेदन।",
    en: "Petition to release property frozen over and above what the case required.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा १५६(३)", "§156(3)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "बढी रोक्का रहेको सम्पत्ति", en: "The excess" },
      intro: {
        ne: "प्रत्येक रोक्का छुट्टै लाइनमा लेख्नुहोस्, र कुन निकायले कुन मितिमा रोक्काको आदेश गरेको हो सो खुलाउनुहोस् — फुकुवाको आदेश त्यही निकायलाई जान्छ।",
        en: "List each attachment on its own line, naming the body that ordered it and the date, since the release order goes back to that same body.",
      },
      fields: [
        {
          id: "nationalIdNo",
          type: "text",
          required: false,
          label: { ne: "राष्ट्रिय परिचयपत्र नं.", en: "National identity card no." },
        },
        {
          id: "excessProperty",
          type: "textarea",
          required: true,
          label: { ne: "बढी रोक्का रहेको सम्पत्तिको विवरण", en: "Property frozen in excess" },
          help: {
            ne: "सम्पत्तिको विवरण, रोक्काको आदेश गर्ने निकाय, आदेश मिति, रोक्का राख्ने पत्रको च.नं. — प्रत्येक छुट्टै लाइनमा।",
            en: "Description, the body that ordered the attachment, the order date and the dispatch number of the attachment letter — one per line.",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "बढी रोक्का रहेको सम्पत्ति फुकुवा गरिपाऊँ",
      en: "Praying for release of property frozen in excess",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा रोक्का राख्नुपर्ने सम्पत्तिभन्दा बढी सम्पत्ति रोक्का राखिएको हुनाले बढी रोक्का राखिएको देहायको सम्पत्ति मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा १५६(३) बमोजिम फुकुवा गरिपाऊँ।\n\n{{excessProperty}}\n\nराष्ट्रिय परिचयपत्र नं.: {{nationalIdNo}}",
        en: "More property has been frozen in this case than the case required. I/we petition under Criminal Procedure Code §156(3) for the release of the excess described below.\n\n{{excessProperty}}\n\nNational identity card no.: {{nationalIdNo}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 34 — pay the cash deposit and get the property surety back
 * ================================================================================= */
export const petitionCashInsteadOfSurety: Template = {
  slug: "court-petition-34-cash-instead-of-surety",
  category: "litigation",
  priceNpr: 499,
  title: {
    ne: "जेथाको सट्टा नगद धरौटी दाखिला गरिपाऊँ (फाराम नं. ३४)",
    en: "Substitute Cash for a Property Surety (Form 34)",
  },
  summary: {
    ne: "पहिले नगद तिर्न नसकी जेथा जमानत राखेकोमा, अब नगद धरौटी दाखिला गरी जेथा फुकुवा गर्न माग्ने निवेदन।",
    en: "Petition to deposit the cash now, where property was given as surety because the cash could not be paid, and to have that property released.",
  },
  governingAct: cite(ACTS.dharautNirdeshika, "दफा २६(१)(२), २७(ग)", "§§26(1)(2), 27(c)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "धरौटी र जेथाको विवरण", en: "The deposit and the surety" },
      fields: [
        {
          id: "orderStage",
          type: "text",
          required: false,
          label: { ne: "कुन क्रममा आदेश भएको", en: "Stage at which the order was made" },
          placeholder: { ne: "पुर्पक्षको क्रममा", en: "during the trial" },
        },
        bsDateField(
          "orderDateBs",
          { ne: "आदेश भएको मिति (वि.सं.)", en: "Date of the order (BS)" },
          true,
        ),
        moneyField("orderedAmountNpr", {
          ne: "आदेश भएको धरौटी रकम",
          en: "Deposit amount ordered",
        }),
        moneyField("depositedAmountNpr", {
          ne: "अहिले दाखिला गरेको रकम",
          en: "Amount being deposited now",
        }),
        {
          id: "suretyProperty",
          type: "textarea",
          required: true,
          label: { ne: "जेथा जमानतमा रहेको सम्पत्ति", en: "Property held as surety" },
          help: {
            ne: "जिल्ला, न.पा./गा.पा., वडा नं., कि.नं., क्षे.फ., सिट नं., दर्तावाला — प्रत्येक कित्ता छुट्टै लाइनमा।",
            en: "District, municipality, ward, plot no., area, sheet no. and registered owner — one plot per line.",
          },
        },
        {
          id: "releaseDetail",
          type: "textarea",
          required: false,
          label: { ne: "फुकुवा माग गरिएको रोक्काको विवरण", en: "Attachment sought to be released" },
          help: {
            ne: "रोक्काको आदेश गर्ने निकाय, आदेश मिति, पत्रको च.नं., फुकुवा हुनुपर्ने कारण।",
            en: "The body that ordered the attachment, the order date, the dispatch number, and why it should now be released.",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "जेथाको सट्टा नगद धरौटी दाखिला गरिपाऊँ",
      en: "Praying to substitute cash for a property surety",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उपरोक्त मुद्दामा यस अदालतबाट {{orderStage}} को क्रममा मिति {{orderDateBs}} मा म/हामीबाट रु. {{orderedAmountNpr}} धरौटी वा सो बराबरको जेथा जमानत लिने आदेश भएकोमा नगद दाखिला गर्न नसकेको हुँदा सोबापत तपसिलमा उल्लिखित सम्पत्ति जेथा जमानी राखेकोमा, सोको सट्टा माग भएको रकम रु. {{depositedAmountNpr}} यसै निवेदनसाथ दाखिला गरेको छु/छौं। धरौट तथा जमानत निर्देशिका, २०७५ को दफा २६(१)(२) बमोजिम नगद धरौटी लिई, जेथा जमानतमा रहेको तपसिलको जग्गा ऐ. निर्देशिकाको दफा २७(ग) बमोजिम फुकुवा गरिपाऊँ।",
        en: "In the above case this court ordered, on {{orderDateBs}} (BS) during {{orderStage}}, that I/we furnish a deposit of NPR {{orderedAmountNpr}} or property surety of equal value. Being unable to pay in cash, I/we gave the property listed below as surety. I/we now deposit the sum of NPR {{depositedAmountNpr}} with this petition, and pray that the cash deposit be accepted under §26(1)(2) of the Deposit and Guarantee Directive, 2075, and the property released under §27(c) of the same Directive.",
      },
    },
    {
      id: "schedule",
      heading: { ne: "तपसिल", en: "Schedule" },
      body: {
        ne: "जेथा जमानतबापत रहेको र फुकुवा माग गरिएको सम्पत्ति:\n{{suretyProperty}}\n\nरोक्का फुकुवाको विवरण:\n{{releaseDetail}}",
        en: "Property held as surety and sought to be released:\n{{suretyProperty}}\n\nAttachment release particulars:\n{{releaseDetail}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 35 — swap one property surety for another
 * ================================================================================= */
export const petitionChangeSurety: Template = {
  slug: "court-petition-35-change-surety",
  category: "litigation",
  priceNpr: 499,
  title: {
    ne: "जेथा परिवर्तन गरिपाऊँ (फाराम नं. ३५)",
    en: "Change the Property Given as Surety (Form 35)",
  },
  summary: {
    ne: "जेथा जमानतमा रहेको सम्पत्तिको सट्टा अर्को सम्पत्ति राखी साबिकको जग्गा फुकुवा गर्न माग्ने निवेदन।",
    en: "Petition to substitute different property as surety and have the original released.",
  },
  governingAct: cite(ACTS.dharautNirdeshika, "दफा २६", "§26"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "जेथा परिवर्तनको विवरण", en: "The substitution" },
      fields: [
        {
          id: "orderStage",
          type: "text",
          required: false,
          label: { ne: "कुन क्रममा आदेश भएको", en: "Stage at which the order was made" },
        },
        bsDateField(
          "orderDateBs",
          { ne: "आदेश भएको मिति (वि.सं.)", en: "Date of the order (BS)" },
          true,
        ),
        moneyField("orderedAmountNpr", {
          ne: "आदेश भएको धरौटी रकम",
          en: "Deposit amount ordered",
        }),
        {
          id: "changeReason",
          type: "textarea",
          required: true,
          label: { ne: "जेथा परिवर्तन गर्नुपर्ने कारण", en: "Why the surety must be changed" },
        },
        {
          id: "formerSurety",
          type: "textarea",
          required: true,
          label: { ne: "साबिकमा जेथा जमानतबापत रहेको सम्पत्ति", en: "Property previously held as surety" },
          help: {
            ne: "जिल्ला, न.पा./गा.पा., वडा नं., कि.नं., क्षे.फ., सिट नं., दर्तावाला — प्रत्येक कित्ता छुट्टै लाइनमा।",
            en: "District, municipality, ward, plot no., area, sheet no. and registered owner — one plot per line.",
          },
        },
        {
          id: "newSurety",
          type: "textarea",
          required: true,
          label: { ne: "हाल जेथा जमानतबापत दिएको सम्पत्ति", en: "Property now offered as surety" },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "जेथा परिवर्तन गरिपाऊँ", en: "Praying to change the property surety" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उपर्युक्त मुद्दामा यस अदालतबाट {{orderStage}} को क्रममा मिति {{orderDateBs}} मा म/हामीबाट रु. {{orderedAmountNpr}} धरौटी वा सो बराबरको जेथा जमानत लिने आदेश भएकामा नगद दाखिला गर्न नसकेको हुँदा सोबापत तपसिलमा उल्लिखित सम्पत्ति जेथा जमानी राखेकोमा, {{changeReason}} कारणले गर्दा देहायबमोजिमको जेथा परिवर्तन गर्नुपर्ने भएको हुनाले धरौट तथा जमानत निर्देशिका, २०७५ को दफा २६ बमोजिम जेथा परिवर्तन गरी रोक्का जग्गा फुकुवा समेत गरिपाऊँ।",
        en: "In the above case this court ordered, on {{orderDateBs}} (BS) during {{orderStage}}, a deposit of NPR {{orderedAmountNpr}} or property surety of equal value, and being unable to pay in cash I/we gave the property below as surety. Because {{changeReason}}, that surety must now be changed. I/we petition under §26 of the Deposit and Guarantee Directive, 2075, for the substitution and for release of the attached land.",
      },
    },
    {
      id: "schedule",
      heading: { ne: "तपसिल", en: "Schedule" },
      body: {
        ne: "(क) साबिकमा जेथा जमानतबापत रहेको सम्पत्ति:\n{{formerSurety}}\n\n(ख) हाल जेथा जमानतबापत दिएको सम्पत्ति:\n{{newSurety}}",
        en: "(a) Property previously held as surety:\n{{formerSurety}}\n\n(b) Property now offered as surety:\n{{newSurety}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 38 — protection for a witness at risk
 * ================================================================================= */
export const petitionWitnessProtection: Template = {
  slug: "court-petition-38-witness-protection",
  category: "litigation",
  priceNpr: 399,
  title: {
    ne: "साक्षीको सुरक्षा प्रबन्ध गरिपाऊँ (फाराम नं. ३८)",
    en: "Arrange Protection for a Witness (Form 38)",
  },
  summary: {
    ne: "साक्षीको रूपमा रहेको व्यक्तिलाई अदालतमा उपस्थित हुन वा बकपत्र गरिसकेपछि सुरक्षामा खतरा भएमा सुरक्षा प्रबन्ध माग्ने निवेदन।",
    en: "Petition for protection where a witness is at risk, either in attending court or after having testified.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा ११४(१)", "§114(1)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "खतराको विवरण", en: "The risk" },
      intro: {
        ne: "यो निवेदन अदालतमा उपस्थित हुनुअघि वा बकपत्र गरिसकेपछि — दुवै अवस्थामा दिन सकिन्छ।",
        en: "This petition may be made either before attending court or after testifying.",
      },
      fields: [
        {
          id: "riskStage",
          type: "select",
          required: true,
          label: { ne: "कुन अवस्थामा खतरा", en: "When the risk arises" },
          options: [
            {
              value: "beforeAppearing",
              label: { ne: "अदालतमा उपस्थित हुन", en: "in attending court" },
            },
            {
              value: "afterTestifying",
              label: { ne: "बकपत्र गरिसकेपछि", en: "after having testified" },
            },
          ],
        },
        {
          id: "riskReason",
          type: "textarea",
          required: true,
          label: { ne: "सुरक्षामा खतरा हुनुको कारण", en: "Why there is a risk to safety" },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "साक्षीको सुरक्षा प्रबन्ध गरिपाऊँ", en: "Praying for witness protection" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा म/हामी साक्षीको रूपमा रहेको र {{riskReason}} कारणले {{riskStage}} म/हामीलाई सुरक्षामा खतरा रहेको हुनाले मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ११४(१) बमोजिम सुरक्षा प्रबन्ध गरिपाऊँ।",
        en: "I am/we are a witness in the above case, and because {{riskReason}} there is a risk to my/our safety {{riskStage}}. I/we petition under Criminal Procedure Code §114(1) for protection to be arranged.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 39 — revoke an attorney and take the hearing date personally
 * ================================================================================= */
export const petitionRevokeAttorney: Template = {
  slug: "court-petition-39-revoke-attorney",
  category: "litigation",
  priceNpr: 299,
  title: {
    ne: "वारेस बदर गरी तारिख सकार गरिपाऊँ (फाराम नं. ३९)",
    en: "Revoke an Attorney and Take Over the Hearing Date (Form 39)",
  },
  summary: {
    ne: "वारिस राख्न अख्तियारनामा दिइसकेकोमा आफैं तारिखमा रहन चाहेकाले वारेस बदर गरी तारिख सकार गर्ने निवेदन।",
    en: "Petition to revoke a power of attorney and personally take over a hearing date fixed for the attorney.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा ९३", "§93"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "वारिसको विवरण", en: "The attorney" },
      fields: [
        {
          id: "attorneyName",
          type: "text",
          required: true,
          label: { ne: "वारिसको नाम", en: "Name of the attorney" },
        },
        {
          id: "attorneyDistrict",
          type: "text",
          required: false,
          label: { ne: "वारिसको जिल्ला", en: "Attorney's district" },
        },
        {
          id: "attorneyMunicipality",
          type: "text",
          required: false,
          label: { ne: "वारिसको न.पा./गा.पा. र वडा नं.", en: "Attorney's municipality and ward" },
        },
        bsDateField(
          "attorneyDateBs",
          { ne: "वारिसलाई तोकिएको तारिख (वि.सं.)", en: "Date fixed for the attorney (BS)" },
          true,
        ),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "वारेस बदर गरी तारिख सकार गरिपाऊँ",
      en: "Praying to revoke an attorney and take over the hearing date",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा मैले/हामीले जिल्ला {{attorneyDistrict}}, {{attorneyMunicipality}} बस्ने {{attorneyName}} लाई वारिस राख्न अख्तियारनामा लेखिदिएको र निज वारिसलाई यस अदालतबाट मिति {{attorneyDateBs}} गतेको तारिख तोकिएकोमा म/हामी आफैं तारिखमा रहने हुँदा मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ९३ बमोजिम आफ्नो मुद्दाको तारिख आफैं सकार गरिपाऊँ।",
        en: "In the above case I/we executed a power of attorney appointing {{attorneyName}} of {{attorneyMunicipality}}, {{attorneyDistrict}} district, and this court fixed {{attorneyDateBs}} (BS) as the hearing date for that attorney. As I/we now wish to attend personally, I/we petition under Criminal Procedure Code §93 to take over the hearing date in my/our own name.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 40 — permission to appoint an attorney where attendance is impossible
 * ================================================================================= */
export const petitionAppointAttorney: Template = {
  slug: "court-petition-40-appoint-attorney",
  category: "litigation",
  priceNpr: 399,
  title: {
    ne: "वारिस नियुक्ति गर्न अनुमति पाऊँ (फाराम नं. ४०)",
    en: "Permission to Appoint an Attorney (Form 40)",
  },
  summary: {
    ne: "काबुबाहिरको परिस्थितिले आफैं उपस्थित हुन नसक्ने भएमा, संहिताले तोकेको आधारमा वारिस नियुक्त गर्न अनुमति माग्ने निवेदन।",
    en: "Petition for permission to appoint an attorney where circumstances beyond control prevent personal attendance, on the grounds the Code allows.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा ९५(१)", "§95(1)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "अनुमतिको आधार", en: "The ground for permission" },
      intro: {
        ne: "संहिताले वारिस नियुक्तिको अनुमति दिने आधार तोकेको छ। तलका आधारमध्ये आफ्नो मुद्दामा जुन लागू हुन्छ त्यही छान्नुहोस्।",
        en: "The Code prescribes the grounds on which an attorney may be appointed. Choose the one that applies to the case.",
      },
      fields: [
        bsDateField(
          "caseFiledBs",
          { ne: "मुद्दा दायर भएको मिति (वि.सं.)", en: "Date the case was filed (BS)" },
          false,
        ),
        {
          id: "impediment",
          type: "textarea",
          required: true,
          label: { ne: "काबुबाहिरको परिस्थिति", en: "Circumstance beyond control" },
          help: {
            ne: "आफैं उपस्थित हुन किन नसकिने हो सो खुलाउनुहोस्।",
            en: "State why personal attendance is not possible.",
          },
        },
        {
          id: "permissionGround",
          type: "select",
          required: true,
          label: { ne: "अनुमति पाउनुपर्ने कारण", en: "Ground on which permission is sought" },
          options: [
            {
              value: "upToThreeYearsNotDetained",
              label: {
                ne: "तीन वर्ष वा सोभन्दा घटीको कैद सजाय हुने मुद्दा भएको र थुनामा नबसेको",
                en: "the case carries three years' imprisonment or less and the party is not in custody",
              },
            },
            {
              value: "upToFiveYears",
              label: {
                ne: "पाँच वर्षसम्मको कैद सजाय हुन सक्ने मुद्दा भएको",
                en: "the case may carry imprisonment of up to five years",
              },
            },
            {
              value: "postpartumWoman",
              label: {
                ne: "अभियोग लागेको महिला सुत्केरी भएको",
                en: "the woman charged has recently given birth",
              },
            },
          ],
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "वारिस नियुक्ति गर्न अनुमति पाऊँ",
      en: "Praying for permission to appoint an attorney",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दा मिति {{caseFiledBs}} मा सम्मानित अदालतमा दायर भई कारबाहीयुक्त अवस्थामा छ। म/हामी आफैं तारिखमा हाजिर भई पुर्पक्ष गर्नुपर्नेमा म/हामीलाई {{impediment}} काबुबाहिरको परिस्थिति परी अदालतमा उपस्थित हुन नसक्ने भएको र उक्त मुद्दा निम्नबमोजिमको बेहोरा भएको हुनाले मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ९५(१) बमोजिम वारिस नियुक्त गर्न अनुमति पाऊँ।\n\nअनुमति पाउनुपर्ने कारण: {{permissionGround}}",
        en: "The above case was filed on {{caseFiledBs}} (BS) and is proceeding. Although I/we should attend and defend in person, {{impediment}} — a circumstance beyond my/our control — prevents attendance, and the case falls within the description below. I/we therefore petition under Criminal Procedure Code §95(1) for permission to appoint an attorney.\n\nGround: {{permissionGround}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 41 — stay a criminal case pending another that bears on it
 *
 * Distinct from Form 19, which stays a case under the CIVIL Procedure Code. Same
 * relief, different code, and filing under the wrong one is a real error.
 * ================================================================================= */
export const petitionCriminalCaseStayed: Template = {
  slug: "court-petition-41-criminal-case-stayed",
  category: "litigation",
  priceNpr: 399,
  title: {
    ne: "मुद्दा मुलतबीमा राखिपाऊँ — फौजदारी (फाराम नं. ४१)",
    en: "Stay a Criminal Case (Form 41)",
  },
  summary: {
    ne: "अन्तरप्रभावी अर्को मुद्दा फैसला नहुन्जेल प्रस्तुत फौजदारी मुद्दा मुलतबीमा राख्न माग्ने निवेदन।",
    en: "Petition to stay a criminal case until another case that bears on it has been decided.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा ९७(१)", "§97(1)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "मुलतबी रहनुपर्ने कारण", en: "Why the case should be stayed" },
      intro: {
        ne: "मुख्य आधार अर्को मुद्दासँग अन्तरप्रभावी हुनु हो। त्यो मुद्दा कुन अदालतमा, कसको बीचमा र कुन नम्बरको हो सो नखुलाई मुलतबीको आदेश हुँदैन।",
        en: "The principal ground is that another case bears on this one. The order will not issue without identifying that case — its court, its parties and its number.",
      },
      fields: [
        {
          id: "relatedCourt",
          type: "text",
          required: true,
          label: { ne: "अन्तरप्रभावी मुद्दा रहेको अदालत", en: "Court where the related case is pending" },
        },
        {
          id: "relatedPlaintiff",
          type: "text",
          required: false,
          label: { ne: "सो मुद्दाको वादी", en: "Plaintiff in that case" },
        },
        {
          id: "relatedDefendant",
          type: "text",
          required: false,
          label: { ne: "सो मुद्दाको प्रतिवादी", en: "Defendant in that case" },
        },
        {
          id: "relatedCaseNo",
          type: "text",
          required: true,
          label: { ne: "सो मुद्दाको साल र मु.नं.", en: "Year and case number of that case" },
        },
        {
          id: "relatedCaseType",
          type: "text",
          required: false,
          label: { ne: "सो मुद्दाको किसिम", en: "Nature of that case" },
        },
        {
          id: "otherGround",
          type: "textarea",
          required: false,
          label: { ne: "अन्य कारण", en: "Any other ground" },
        },
        {
          id: "attachedDocuments",
          type: "textarea",
          required: false,
          label: { ne: "संलग्न कागजात", en: "Documents attached" },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "मुद्दा मुलतबीमा राखिपाऊँ", en: "Praying that the case be stayed" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "प्रस्तुत मुद्दा सम्मानित अदालतमा दायर भई कारबाहीयुक्त अवस्थामा छ। निम्न कारण परेकोले उल्लिखित मुद्दा मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ९७(१) बमोजिम मुलतबीमा राखिपाऊँ।\n\nमुलतबी रहनुपर्ने कारण:\n(क) {{relatedCourt}} मा कारबाहीयुक्त अवस्थामा रहेको, वादी {{relatedPlaintiff}} प्रतिवादी {{relatedDefendant}} भएको {{relatedCaseNo}} को {{relatedCaseType}} मुद्दा प्रस्तुत मुद्दासँग अन्तरप्रभावी रहेकाले सो मुद्दा फैसला नहुन्जेलसम्मका लागि।\n(ख) {{otherGround}}\n\nसंलग्न कागजात: {{attachedDocuments}}",
        en: "The present case is pending before this honourable court. For the reasons below, I/we petition under Criminal Procedure Code §97(1) that it be stayed.\n\nGrounds:\n(a) The case numbered {{relatedCaseNo}} ({{relatedCaseType}}), between plaintiff {{relatedPlaintiff}} and defendant {{relatedDefendant}}, pending before {{relatedCourt}}, bears upon the present case, and a stay is sought until that case is decided.\n(b) {{otherGround}}\n\nDocuments attached: {{attachedDocuments}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 42 — another date on which to produce evidence
 * ================================================================================= */
export const petitionTimeToProduceEvidence: Template = {
  slug: "court-petition-42-time-to-produce-evidence",
  category: "litigation",
  priceNpr: 299,
  title: {
    ne: "प्रमाण पेस गर्न अनुमति पाऊँ (फाराम नं. ४२)",
    en: "Another Date on Which to Produce Evidence (Form 42)",
  },
  summary: {
    ne: "उजुरी, बयान वा प्रतिउत्तरसँगै पेस गर्नुपर्ने प्रमाण काबुबाहिरको परिस्थितिले पेस गर्न नसकेकोमा अर्को तारिख माग्ने निवेदन।",
    en: "Petition for a further date to produce evidence that should have been filed with the complaint, statement or reply but could not be, for reasons beyond control.",
  },
  governingAct: cite(ACTS.criminalProcedure, "दफा ९९(३)", "§99(3)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "प्रमाण र कारण", en: "The evidence and the reason" },
      fields: [
        {
          id: "filingOccasion",
          type: "select",
          required: true,
          label: { ne: "प्रमाण कहिले पेस गर्नुपर्ने थियो", en: "When the evidence should have been filed" },
          options: [
            { value: "complaint", label: { ne: "उजुरीसाथ", en: "with the complaint" } },
            { value: "statement", label: { ne: "बयानसाथ", en: "with the statement" } },
            { value: "reply", label: { ne: "प्रतिउत्तरपत्रसाथ", en: "with the written reply" } },
          ],
        },
        {
          id: "evidenceDescription",
          type: "textarea",
          required: true,
          label: { ne: "पेस गर्नुपर्ने प्रमाणको विवरण", en: "The evidence to be produced" },
        },
        {
          id: "impediment",
          type: "textarea",
          required: true,
          label: { ne: "पेस गर्न नसकेको कारण", en: "Why it could not be produced" },
          help: {
            ne: "काबुबाहिरको परिस्थिति खुलाउनुहोस् — यही आधारमा अर्को तारिख तोकिन्छ।",
            en: "State the circumstance beyond your control; the further date is granted on that basis.",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "प्रमाण पेस गर्न अनुमति पाऊँ", en: "Praying for time to produce evidence" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "प्रस्तुत मुद्दामा प्रमाण लाग्ने लिखत वा दसी प्रमाण {{filingOccasion}} पेस गर्नुपर्नेमा म/हामीले उक्त प्रमाणहरू — {{evidenceDescription}} — {{impediment}} काबुबाहिरको परिस्थिति परी पेस गर्न नसकेको हुनाले मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ९९(३) बमोजिम प्रमाण पेस गर्न अर्को तारिख तोकिपाऊँ।",
        en: "In the present case the documentary or material evidence should have been produced {{filingOccasion}}. That evidence — {{evidenceDescription}} — could not be produced because {{impediment}}, a circumstance beyond my/our control. I/we petition under Criminal Procedure Code §99(3) for a further date on which to produce it.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 43 — record that the person the court asked for has been produced
 * ================================================================================= */
export const petitionPersonProduced: Template = {
  slug: "court-petition-43-person-produced",
  category: "litigation",
  priceNpr: 249,
  title: {
    ne: "कारणी उपस्थित गराएको (फाराम नं. ४३)",
    en: "Record That the Person Concerned Has Been Produced (Form 43)",
  },
  summary: {
    ne: "अदालतले तोकेको तारेखमा कारणीलाई उपस्थित गराएको बेहोरा जनाउने निवेदन।",
    en: "Petition recording that the person the court required has been produced on the date fixed.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा १७२(६)", "§172(6)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "उपस्थित गराइएको विवरण", en: "Who has been produced" },
      fields: [
        {
          id: "purpose",
          type: "select",
          required: true,
          label: { ne: "कुन प्रयोजनका लागि तारेख तोकिएको", en: "Purpose the date was fixed for" },
          options: [
            {
              value: "cpc172_6",
              label: {
                ne: "मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १७२(६) बमोजिम",
                en: "under Civil Procedure Code §172(6)",
              },
            },
            { value: "discussion", label: { ne: "छलफलका निमित्त", en: "for a hearing or discussion" } },
          ],
        },
        bsDateField(
          "producedOnBs",
          { ne: "उपस्थित गराउनु भनी तोकिएको मिति (वि.सं.)", en: "Date fixed for production (BS)" },
          true,
        ),
        {
          id: "personProduced",
          type: "text",
          required: true,
          label: { ne: "उपस्थित गराइएको पक्ष/कारणीको नाम", en: "Name of the person produced" },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "कारणी उपस्थित गराएको", en: "Recording production of the person concerned" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा {{purpose}} आज मिति {{producedOnBs}} गते कारणीलाई उपस्थित गराउनु भनी तारेख तोकी पाएबमोजिम यसै निवेदनसाथ आफ्नो पक्ष/कारणी {{personProduced}} लाई उपस्थित गराएको छु। कानूनबमोजिम गरिपाऊँ।",
        en: "In the above case a date of {{producedOnBs}} (BS) was fixed {{purpose}} for the person concerned to be produced. With this petition I produce my party, {{personProduced}}, accordingly, and pray that the matter proceed as the law provides.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 44 — release attached property no longer needing to be held
 *
 * The government form cites "मुलुकी देवानी कार्यविधि संहिता, २०७५ को दफा १५६". The
 * Civil Procedure Code is of 2074, not 2075, so that year appears to be a slip on
 * the form itself. Transcribed as printed — an advocate should confirm which
 * provision is actually intended before filing.
 * ================================================================================= */
export const petitionReleaseAttachment: Template = {
  slug: "court-petition-44-release-attachment",
  category: "litigation",
  priceNpr: 449,
  title: {
    ne: "रोक्का रहेको सम्पत्ति फुकुवा गरिपाऊँ (फाराम नं. ४४)",
    en: "Release Attached Property (Form 44)",
  },
  summary: {
    ne: "रोक्का राख्न नपर्ने अवस्था भइसकेको सम्पत्ति फुकुवा गर्न माग्ने निवेदन।",
    en: "Petition to release attached property where the reason for holding it no longer applies.",
  },
  governingAct: cite(ACTS.criminalProcedureRules, "नियम ९२(२)", "Rule 92(2)"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "फुकुवा गर्नुपर्ने सम्पत्ति", en: "The property to be released" },
      fields: [
        {
          id: "releaseGround",
          type: "textarea",
          required: true,
          label: { ne: "रोक्का राख्न नपर्ने भएको कारण", en: "Why the property need no longer be held" },
        },
        {
          id: "attachedProperty",
          type: "textarea",
          required: true,
          label: { ne: "रोक्का रहेको सम्पत्तिको विवरण", en: "The attached property" },
          help: {
            ne: "सम्पत्तिको विवरण, रोक्काको आदेश गर्ने निकाय, आदेश मिति, पत्रको च.नं. र मिति, रोक्का रहेको निकाय, फुकुवा हुनुपर्ने कारण — प्रत्येक छुट्टै लाइनमा।",
            en: "Description, the body that ordered the attachment, the order date, the letter's dispatch number and date, where it is held, and why it should be released — one per line.",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "रोक्का रहेको सम्पत्ति फुकुवा गरिपाऊँ",
      en: "Praying for release of attached property",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दामा {{releaseGround}} भएकोले देहायको सम्पत्ति रोक्का राख्न नपर्ने हुँदा मुलुकी फौजदारी कार्यविधि नियमावली, २०७५ को नियम ९२(२) तथा मुलुकी देवानी कार्यविधि संहिताको दफा १५६ बमोजिम रोक्का रहेको जग्गा फुकुवा गरिपाऊँ।\n\n{{attachedProperty}}",
        en: "In the above case, {{releaseGround}}, so the property below need no longer be held. I/we petition under Rule 92(2) of the Criminal Procedure Rules, 2075, and §156 of the Civil Procedure Code, for release of the attached land.\n\n{{attachedProperty}}",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 45 — get a deposit back
 * ================================================================================= */
export const petitionDepositRefund: Template = {
  slug: "court-petition-45-deposit-refund",
  category: "litigation",
  priceNpr: 399,
  title: {
    ne: "धरौटी रकम फिर्ता पाऊँ (फाराम नं. ४५)",
    en: "Refund of a Deposit (Form 45)",
  },
  summary: {
    ne: "अदालतमा राखेको धरौटी रकम फिर्ता माग्ने निवेदन। देवानी र फौजदारी — कुन संहिताअन्तर्गत हो सो छान्नुपर्छ।",
    en: "Petition for the refund of a deposit held by the court, under whichever of the civil or criminal codes applies.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा २४८", "§248"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "धरौटीको विवरण", en: "The deposit" },
      fields: [
        {
          id: "refundBasis",
          type: "select",
          required: true,
          label: { ne: "कुन संहिताबमोजिम", en: "Which code applies" },
          help: {
            ne: "देवानी मुद्दाको धरौटी दफा २४८ बमोजिम, फौजदारीको दफा ७६ बमोजिम फिर्ता हुन्छ।",
            en: "A deposit in a civil case is refunded under §248; in a criminal case, under §76.",
          },
          options: [
            {
              value: "cpc248",
              label: {
                ne: "मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा २४८",
                en: "Civil Procedure Code §248",
              },
            },
            {
              value: "crpc76",
              label: {
                ne: "मुलुकी फौजदारी कार्यविधि संहिता, २०७४ को दफा ७६",
                en: "Criminal Procedure Code §76",
              },
            },
          ],
        },
        {
          id: "refundGround",
          type: "textarea",
          required: true,
          label: { ne: "फिर्ता हुनुपर्ने कारण", en: "Why the deposit should be refunded" },
        },
        {
          id: "depositDetail",
          type: "textarea",
          required: true,
          label: { ne: "धरौटीको विवरण", en: "Deposit particulars" },
          help: {
            ne: "धरौटी अङ्क, रसिद नं. र मिति, फिर्ता माग गरेको रकम — प्रत्येक छुट्टै लाइनमा।",
            en: "Amount, receipt number and date, and the sum claimed back — one per line.",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "धरौटी रकम फिर्ता पाऊँ", en: "Praying for refund of a deposit" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "{{refundGround}} भएकोले उक्त मुद्दामा मैले/हामीले यस अदालतमा राखेको निम्नानुसारको धरौटी {{refundBasis}} बमोजिम फिर्ता पाऊँ।\n\n{{depositDetail}}",
        en: "Because {{refundGround}}, I/we petition under {{refundBasis}} for the refund of the deposit placed with this court, as set out below.\n\n{{depositDetail}}",
      },
    },
    {
      id: "attachments",
      heading: { ne: "संलग्न कागजात", en: "Documents attached" },
      locked: true,
      body: {
        ne: "देहायको कागजात यसैसाथ संलग्न छ:\n(क) परिचय खुल्ने कागजात\n(ख) धरौट बुझाएको रसिद (भएमा)\n(ग) फैसला वा आदेशको प्रतिलिपि",
        en: "The following are attached:\n(a) proof of identity\n(b) the deposit receipt, if held\n(c) a copy of the judgment or order",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 46 — recover the court fee after a settlement
 * ================================================================================= */
export const petitionCourtFeeRefund: Template = {
  slug: "court-petition-46-court-fee-refund",
  category: "litigation",
  priceNpr: 349,
  title: {
    ne: "अदालती शुल्क फिर्ता पाऊँ (फाराम नं. ४६)",
    en: "Refund of Court Fee After Settlement (Form 46)",
  },
  summary: {
    ne: "मिलापत्र भएपछि मिलापत्रअनुसार फिर्ता पाउने ठहरेको अदालती शुल्क माग्ने निवेदन।",
    en: "Petition for the court fee found refundable under a settlement the parties reached.",
  },
  governingAct: cite(ACTS.civilProcedure, "दफा ८२", "§82"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "मिलापत्र र शुल्क", en: "The settlement and the fee" },
      fields: [
        bsDateField(
          "settlementDateBs",
          { ne: "मिलापत्र भएको मिति (वि.सं.)", en: "Date of the settlement (BS)" },
          true,
        ),
        moneyField("refundAmountNpr", {
          ne: "फिर्ता पाउने ठहरेको अदालती शुल्क",
          en: "Court fee found refundable",
        }),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "अदालती शुल्क फिर्ता पाऊँ", en: "Praying for refund of the court fee" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उक्त मुद्दा मिति {{settlementDateBs}} मा मिलापत्र भएको र सो मिलापत्रअनुसार मैले/हामीले फिर्ता पाउने ठहरेको अदालती शुल्क रु. {{refundAmountNpr}} मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा ८२ बमोजिम फिर्ता पाऊँ। आवश्यक कागजात यसैसाथ छ।",
        en: "The above case was settled on {{settlementDateBs}} (BS), and under that settlement a court fee of NPR {{refundAmountNpr}} was found refundable to me/us. I/we petition for its refund under Civil Procedure Code §82. The necessary documents are attached.",
      },
    },
    {
      id: "attachments",
      heading: { ne: "संलग्न कागजात", en: "Documents attached" },
      locked: true,
      body: {
        ne: "(क) मिलापत्रको प्रतिलिपि\n(ख) नागरिकता वा पहिचान खुल्ने कागजातको प्रतिलिपि\n(ग) अघि रकम बुझाएको भए रसिदको प्रतिलिपि",
        en: "(a) a copy of the settlement\n(b) a copy of citizenship or other proof of identity\n(c) a copy of the receipt, if the fee was paid earlier",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 47 — record a cash deposit made for bail or for leave to appeal
 * ================================================================================= */
export const petitionCashDepositMade: Template = {
  slug: "court-petition-47-cash-deposit-made",
  category: "litigation",
  priceNpr: 399,
  title: {
    ne: "नगद धरौट जम्मा गरेको (फाराम नं. ४७)",
    en: "Record a Cash Deposit Made (Form 47)",
  },
  summary: {
    ne: "थुनछेकको आदेश वा फैसलाबमोजिम धरौट राखी तारिखमा रहन वा पुनरावेदन दर्ता गर्न पाउने सुविधाबापत नगद दाखिला गरेको जनाउने निवेदन।",
    en: "Petition recording a cash deposit made under a remand order, or under a judgment allowing bail and appeal.",
  },
  governingAct: cite(ACTS.dharautNirdeshika, "दफा २६", "§26"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "धरौटको आधार", en: "The basis of the deposit" },
      intro: {
        ne: "दुई फरक अवस्थामा यो निवेदन दिइन्छ — थुनछेकको आदेशबापत, वा फैसलाले दिएको पुनरावेदनको सुविधाबापत। जुन लागू हुन्छ त्यही मात्र भर्नुहोस्।",
        en: "This petition arises in two different situations — under a remand order, or under a judgment allowing appeal on deposit. Fill in only the one that applies.",
      },
      fields: [
        {
          id: "depositBasis",
          type: "select",
          required: true,
          label: { ne: "कुन आधारमा धरौट", en: "Basis of the deposit" },
          options: [
            {
              value: "remandOrder",
              label: { ne: "थुनछेकको आदेशबमोजिम", en: "under a remand order" },
            },
            {
              value: "appealFacility",
              label: {
                ne: "फैसलाबमोजिम पुनरावेदनको सुविधाबापत",
                en: "under a judgment allowing appeal on deposit",
              },
            },
          ],
        },
        bsDateField("orderDateBs", { ne: "आदेश/फैसलाको मिति (वि.सं.)", en: "Date of the order or judgment (BS)" }, true),
        {
          id: "judgeName",
          type: "text",
          required: false,
          label: { ne: "आदेश गर्ने माननीय न्यायाधीश", en: "Hon. Judge who made the order" },
        },
        {
          id: "sentence",
          type: "text",
          required: false,
          label: { ne: "भएको कैद/जरिवाना", en: "Sentence or fine imposed" },
          help: {
            ne: "पुनरावेदनको सुविधाबापत धरौट राख्दा मात्र भर्नुहोस्।",
            en: "Fill in only where the deposit is against a judgment allowing appeal.",
          },
          placeholder: { ne: "२ वर्ष कैद / रु. ५०,०००।– जरिवाना", en: "2 years' imprisonment / NPR 50,000 fine" },
        },
        moneyField("depositAmountNpr", {
          ne: "दाखिला गरेको नगद रकम",
          en: "Cash amount deposited",
        }),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "नगद धरौट जम्मा गरेको", en: "Recording a cash deposit" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा मिति {{orderDateBs}} मा {{depositBasis}} माननीय न्यायाधीश श्री {{judgeName}} को इजलासबाट मलाई {{sentence}} बापत धरौट राख्ने आदेश/सुविधा प्राप्त भएकोले त्यसबापतको नगद रकम रु. {{depositAmountNpr}} यसै निवेदनसाथ दाखिला गरेको छु। उक्त धरौट रकम बुझी लिई कानूनबमोजिम तारिखमा रहन/पुनरावेदन दर्ता गर्न पाऊँ।",
        en: "In the above case, on {{orderDateBs}} (BS), {{depositBasis}}, the bench of Hon. Judge {{judgeName}} ordered or permitted a deposit in respect of {{sentence}}. I deposit the sum of NPR {{depositAmountNpr}} with this petition, and pray that it be accepted and that I be permitted to remain on the hearing roll or to register an appeal, as the law provides.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 48 — the same, but secured by a bank guarantee rather than cash
 * ================================================================================= */
export const petitionBankGuaranteeGiven: Template = {
  slug: "court-petition-48-bank-guarantee-given",
  category: "litigation",
  priceNpr: 449,
  title: {
    ne: "बैंक जमानत दिइएको (फाराम नं. ४८)",
    en: "Record a Bank Guarantee Given (Form 48)",
  },
  summary: {
    ne: "धरौट वा जमानतबापत नगदको सट्टा बैंक जमानत दाखिला गरेको जनाउने निवेदन।",
    en: "Petition recording that a bank guarantee has been furnished in place of a cash deposit or surety.",
  },
  governingAct: cite(ACTS.dharautNirdeshika, "दफा २६", "§26"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "बैंक जमानतको विवरण", en: "The bank guarantee" },
      intro: {
        ne: "बैंक जमानतको अवधि अदालतको आदेशले तोकेको अवधिभन्दा छोटो भयो भने जमानत नै काम लाग्दैन। मिति दुवै ध्यानपूर्वक भर्नुहोस्।",
        en: "A guarantee that expires before the period the court's order requires is of no use. Enter both dates carefully.",
      },
      fields: [
        {
          id: "depositBasis",
          type: "select",
          required: true,
          label: { ne: "कुन आधारमा जमानत", en: "Basis of the guarantee" },
          options: [
            { value: "remandOrder", label: { ne: "थुनछेकको आदेशबमोजिम", en: "under a remand order" } },
            {
              value: "appealFacility",
              label: {
                ne: "फैसलाबमोजिम पुनरावेदनको सुविधाबापत",
                en: "under a judgment allowing appeal on deposit",
              },
            },
          ],
        },
        bsDateField("orderDateBs", { ne: "आदेश/फैसलाको मिति (वि.सं.)", en: "Date of the order or judgment (BS)" }, true),
        {
          id: "judgeName",
          type: "text",
          required: false,
          label: { ne: "आदेश गर्ने माननीय न्यायाधीश", en: "Hon. Judge who made the order" },
        },
        {
          id: "sentence",
          type: "text",
          required: false,
          label: { ne: "भएको कैद/जरिवाना", en: "Sentence or fine imposed" },
        },
        moneyField("guaranteeAmountNpr", {
          ne: "बैंक जमानतको रकम",
          en: "Amount of the bank guarantee",
        }),
        {
          id: "bankName",
          type: "text",
          required: true,
          label: { ne: "जमानत जारी गर्ने बैंक", en: "Bank issuing the guarantee" },
        },
        {
          id: "bankOffice",
          type: "text",
          required: false,
          label: { ne: "बैंकको कार्यालय रहेको स्थान", en: "Where the bank's office is" },
        },
        bsDateField("guaranteeIssuedBs", { ne: "जमानत जारी भएको मिति (वि.सं.)", en: "Date the guarantee was issued (BS)" }, true),
        bsDateField("guaranteeValidUntilBs", { ne: "जमानतको अवधि (सम्म) (वि.सं.)", en: "Guarantee valid until (BS)" }, true),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({ ne: "बैंक जमानत दिइएको", en: "Recording a bank guarantee" }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "उल्लिखित मुद्दामा मिति {{orderDateBs}} मा {{depositBasis}} माननीय न्यायाधीश श्री {{judgeName}} को इजलासबाट मलाई {{sentence}} बापत रु. {{guaranteeAmountNpr}} धरौट वा जमानत माग्ने गरी आदेश भएकोले, त्यसबापत {{bankOffice}} मा कार्यालय रहेको {{bankName}} ले मिति {{guaranteeValidUntilBs}} सम्मको लागि मिति {{guaranteeIssuedBs}} मा जारी गरेको बैंक जमानत यसै निवेदनसाथ दाखिला गरेको छु। उक्त बैंक जमानत अदालतको आदेशानुसारको अवधिभर कायम रहने गरी बुझी लिई कानूनबमोजिम गरिपाऊँ।",
        en: "In the above case, on {{orderDateBs}} (BS), {{depositBasis}}, the bench of Hon. Judge {{judgeName}} ordered a deposit or surety of NPR {{guaranteeAmountNpr}} in respect of {{sentence}}. In satisfaction of that order I furnish herewith a bank guarantee issued on {{guaranteeIssuedBs}} (BS) by {{bankName}}, whose office is at {{bankOffice}}, valid until {{guaranteeValidUntilBs}} (BS). I pray that it be accepted as remaining in force for the period the court's order requires.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 49 — attend in person on a day otherwise taken online
 * ================================================================================= */
export const petitionAppearInPerson: Template = {
  slug: "court-petition-49-appear-in-person",
  category: "litigation",
  priceNpr: 249,
  title: {
    ne: "स्वयं उपस्थित भई हाजिर हुन पाऊँ (फाराम नं. ४९)",
    en: "Appear in Person Though Enrolled for Online Dates (Form 49)",
  },
  summary: {
    ne: "अनलाइन तारिखमा रहँदै आएको पक्ष तोकिएको तारिखमा अदालतमै उपस्थित भएकोमा हाजिर जनाउन माग्ने निवेदन।",
    en: "Petition by a party who has been taking dates online and has attended the court in person on the date fixed, to be marked present there.",
  },
  governingAct: cite(ACTS.onlineHearingDirective, "दफा १४", "§14"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "तारिखको विवरण", en: "The hearing date" },
      fields: [
        {
          id: "onlineThroughCourt",
          type: "text",
          required: false,
          label: { ne: "अनलाइन तारिख लिँदै आएको अदालत", en: "Court through which online dates were taken" },
        },
        {
          id: "dateType",
          type: "select",
          required: true,
          label: { ne: "तारिखको किसिम", en: "Type of date" },
          options: [
            { value: "ordinary", label: { ne: "साधारण तारिख", en: "an ordinary date" } },
            { value: "hearing", label: { ne: "पेसी तारिख", en: "a hearing date" } },
          ],
        },
        bsDateField("appearanceDateBs", { ne: "तोकिएको तारिख (वि.सं.)", en: "Date fixed (BS)" }, true),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "स्वयं उपस्थित भई हाजिर हुन पाऊँ",
      en: "Praying to be marked present, having attended in person",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "प्रस्तुत मुद्दामा म निवेदक {{onlineThroughCourt}} अदालतमार्फत अनलाइन तारिखमा रहँदै आएको र आज मिति {{appearanceDateBs}} गते तोकिएको {{dateType}} मा यसै अदालतमा उपस्थित भएको सन्दर्भमा सूचना प्रविधिको प्रयोग (अनलाइन) बाट तारिख लिने सम्बन्धी निर्देशिका, २०७२ को दफा १४ बमोजिम यसै अदालतमा तारिखमा हाजिर हुन पाऊँ भनी यो निवेदन पेस गरेको छु।",
        en: "In the present case I, the petitioner, have been taking dates online through {{onlineThroughCourt}}. Having today attended this court in person on {{dateType}} fixed for {{appearanceDateBs}} (BS), I present this petition under §14 of the Directive on Taking Dates Through Information Technology, 2072, to be marked present at this court.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 50 — appear within a 15-day notice and go onto the hearing roll
 * ================================================================================= */
export const petitionAppearWithinFifteenDays: Template = {
  slug: "court-petition-50-appear-within-fifteen-days",
  category: "litigation",
  priceNpr: 249,
  title: {
    ne: "१५ दिने म्यादमा हाजिर हुन पाऊँ (फाराम नं. ५०)",
    en: "Appear Within a Fifteen-Day Notice (Form 50)",
  },
  summary: {
    ne: "नियम ६७ बमोजिम जारी भएको १५ दिने म्याद तामेल भएपछि म्यादभित्रै हाजिर भई तारिखमा रहन माग्ने निवेदन।",
    en: "Petition to appear within a fifteen-day notice issued under Rule 67 and to go onto the hearing roll.",
  },
  governingAct: cite(ACTS.supremeCourtRules, "नियम ६७, ७१", "Rules 67, 71"),
  review: REVIEW,
  execution: LITIGATION_EXECUTION,
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "detail",
      title: { ne: "म्यादको विवरण", en: "The notice" },
      intro: {
        ne: "यो निवेदनको जोड म्याद तामेल भएको मितिमा छ — त्यही मितिबाट १५ दिन गनिन्छ, र म्याद नाघेपछि यो निवेदन काम लाग्दैन।",
        en: "Everything here turns on the date the notice was served: the fifteen days run from it, and once they lapse this petition no longer serves.",
      },
      fields: [
        bsDateField("noticeServedBs", { ne: "म्याद तामेल भएको मिति (वि.सं.)", en: "Date the notice was served (BS)" }, true),
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "१५ दिने म्यादमा हाजिर हुन पाऊँ",
      en: "Praying to appear within a fifteen-day notice",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "प्रस्तुत मुद्दामा सर्वोच्च अदालत नियमावली, २०७४ को नियम ६७ बमोजिम आदेश भई मेरा नाममा जारी भएको १५ दिने म्याद मिति {{noticeServedBs}} मा तामेल भएकोले म तामेल भएको मितिले म्यादभित्रै हाजिर हुन आएको छु। हाजिर भई सर्वोच्च अदालत नियमावली, २०७४ को नियम ७१ बमोजिम तारिखमा रहन पाऊँ।",
        en: "In the present case a fifteen-day notice issued in my name by order under Rule 67 of the Supreme Court Regulation, 2074, and was served on {{noticeServedBs}} (BS). I appear within that period from the date of service, and pray to be placed on the hearing roll under Rule 71 of the same Regulation.",
      },
    },
    closingClause(),
  ],
};

/* =================================================================================
 * Form 51 — enrol to take hearing dates online from a more convenient court
 *
 * Structurally unlike the other 51. This is Schedule 2 of the online-hearing
 * directive — an enrolment form a party fills in to be allowed to take dates
 * through information technology from a court near them, rather than a petition
 * asking a court to do something in a pending matter. It carries contact details
 * and a photograph precisely because it is an identity enrolment.
 * ================================================================================= */
export const petitionOnlineHearingEnrolment: Template = {
  slug: "court-petition-51-online-hearing-enrolment",
  category: "litigation",
  priceNpr: 349,
  title: {
    ne: "अनलाइन तारिखमा रहन पाऊँ (फाराम नं. ५१)",
    en: "Enrol to Take Hearing Dates Online (Form 51)",
  },
  summary: {
    ne: "बेइलाकाको अदालतबाट सूचना प्रविधिको प्रयोग गरी तारिख लिन चाहने पक्षले भर्नुपर्ने अनुसूची-२ को फाराम।",
    en: "The Schedule 2 form for a party who wishes to take hearing dates through information technology from a court outside their own locality.",
  },
  governingAct: cite(ACTS.onlineHearingDirective, "दफा ४(१), अनुसूची-२", "§4(1), Schedule 2"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "यो फारामसाथ हालसालै खिचिएको फोटो र दायाँ–बायाँ ल्याप्चे सहितको हस्ताक्षर आवश्यक पर्दछ — यी अदालतमै गरिने काम हुन्।",
      en: "This form requires a recent photograph and signatures with left and right thumb impressions, which are taken at the court itself.",
    },
  ],
  steps: [
    caseReferenceStep(),
    {
      id: "applicant",
      title: { ne: "पक्ष वा वारिसको विवरण", en: "The party or attorney" },
      intro: {
        ne: "यो फाराम पहिचानको अभिलेख हो। सम्पर्कका विवरण गलत भए अनलाइन तारिखको सूचना नै नपुग्न सक्छ।",
        en: "This form is a record of identity. Wrong contact details mean the notice of an online date may simply never arrive.",
      },
      fields: [
        {
          id: "branch",
          type: "text",
          required: false,
          label: { ne: "शाखा", en: "Branch" },
        },
        {
          id: "section",
          type: "text",
          required: false,
          label: { ne: "फाँट", en: "Section" },
        },
        {
          id: "applicantName",
          type: "text",
          required: true,
          label: { ne: "पक्ष वा वारिसको नाम, थर", en: "Name of the party or attorney" },
        },
        {
          id: "applicantAddress",
          type: "textarea",
          required: true,
          label: { ne: "वतन", en: "Address" },
        },
        {
          id: "mobileNo",
          type: "text",
          required: true,
          label: { ne: "मोबाइल नं.", en: "Mobile no." },
        },
        {
          id: "contactNo",
          type: "text",
          required: false,
          label: { ne: "सम्पर्क नं.", en: "Other contact no." },
        },
        {
          id: "email",
          type: "text",
          required: false,
          label: { ne: "इमेल", en: "Email" },
        },
        {
          id: "citizenshipNo",
          type: "text",
          required: false,
          label: { ne: "नागरिकता नं. (नेपाली नागरिकको हकमा)", en: "Citizenship no. (for Nepali citizens)" },
        },
        {
          id: "foreignId",
          type: "text",
          required: false,
          label: {
            ne: "पासपोर्ट नं. वा परिचय खुल्ने कागजात (विदेशी नागरिकको हकमा)",
            en: "Passport no. or other identity document (for foreign nationals)",
          },
        },
        {
          id: "convenientCourt1",
          type: "text",
          required: true,
          label: { ne: "पायक पर्ने अदालत — १", en: "Convenient court — 1" },
        },
        {
          id: "convenientCourt2",
          type: "text",
          required: false,
          label: { ne: "पायक पर्ने अदालत — २", en: "Convenient court — 2" },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "फारामको शीर्ष", en: "Heading" },
      locked: true,
      body: {
        ne: "अनुसूची-२\n(दफा ४(१) सँग सम्बन्धित)\n\nबेइलाकाको अदालतबाट सूचना प्रविधिको प्रयोग गरी तारिख लिन चाहने पक्षले भर्नुपर्ने फाराम\n\n{{courtLevel}} {{courtName}}\nशाखा: {{branch}}    फाँट: {{section}}\n\nमुद्दा र. नं.: {{caseRegNo}}    मुद्दा नं.: {{caseNo}}\nमुद्दाको नाम: {{caseName}}",
        en: "Schedule 2\n(relating to §4(1))\n\nForm to be completed by a party wishing to take hearing dates through information technology from a court outside their locality\n\n{{courtLevel}} {{courtName}}\nBranch: {{branch}}    Section: {{section}}\n\nCase reg. no.: {{caseRegNo}}    Case no.: {{caseNo}}\nCase: {{caseName}}",
      },
    },
    {
      id: "applicant",
      heading: { ne: "पक्ष वा वारिसको विवरण", en: "Particulars of the party or attorney" },
      body: {
        ne: "नाम, थर: {{applicantName}}\nवतन: {{applicantAddress}}\nमोबाइल नं.: {{mobileNo}}    सम्पर्क नं.: {{contactNo}}\nइमेल: {{email}}\nनागरिकता नं.: {{citizenshipNo}}\nपासपोर्ट नं. वा अन्य परिचय: {{foreignId}}\n\nपायक पर्ने अदालतको नाम:\n१. {{convenientCourt1}}\n२. {{convenientCourt2}}",
        en: "Name: {{applicantName}}\nAddress: {{applicantAddress}}\nMobile no.: {{mobileNo}}    Other contact: {{contactNo}}\nEmail: {{email}}\nCitizenship no.: {{citizenshipNo}}\nPassport no. or other identity: {{foreignId}}\n\nConvenient courts:\n1. {{convenientCourt1}}\n2. {{convenientCourt2}}",
      },
    },
    {
      id: "attestation",
      heading: { ne: "फोटो, हस्ताक्षर र ल्याप्चे", en: "Photograph, signature and thumb impressions" },
      locked: true,
      body: {
        ne: "हालसालै खिचिएको फोटो: ____________________\n\nहस्ताक्षर: ____________________\n\nल्याप्चे —  दायाँ: ____________    बायाँ: ____________\n\nइति संवत् {{signatureDateBs}} शुभम्।",
        en: "Recent photograph: ____________________\n\nSignature: ____________________\n\nThumb impressions —  right: ____________    left: ____________\n\nDated (BS): {{signatureDateBs}}.",
      },
    },
  ],
};

/* =================================================================================
 * Form 52 — a non-party caught by an order asks for one in their own case
 * ================================================================================= */
export const petitionRule62Order: Template = {
  slug: "court-petition-52-rule-62-order",
  category: "litigation",
  priceNpr: 599,
  title: {
    ne: "नियम ६२ बमोजिम आदेश जारी पाऊँ (फाराम नं. ५२)",
    en: "Order Under Rule 62 for a Person Affected (Form 52)",
  },
  summary: {
    ne: "अर्को मुद्दामा भएको आदेश वा निर्णय आफ्नो हकमा समेत आकर्षित हुने भएकाले सोहीबमोजिम आदेश जारी गर्न माग्ने निवेदन।",
    en: "Petition by a person on whom an order or decision in another case also bears, seeking an order to the same effect in their own right.",
  },
  governingAct: cite(ACTS.supremeCourtRules, "नियम ६२(१)", "Rule 62(1)"),
  review: REVIEW,
  execution: [
    ...LITIGATION_EXECUTION,
    {
      ne: "यो निवेदन पहिले निरूपण भइसकेको मुद्दाको सिद्धान्तमा भर पर्दछ। सो मुद्दाको नजिर आफ्नो अवस्थामा साँच्चै लागू हुन्छ कि हुँदैन भन्ने अधिवक्ताबाट जँचाउनु आवश्यक छ — यही निवेदनको सफलता त्यसैमा निर्भर हुन्छ।",
      en: "This petition rests on the principle settled in a case already decided. Whether that precedent genuinely reaches your situation is the question the petition turns on, and is worth an advocate's assessment before filing.",
    },
  ],
  steps: [
    caseReferenceStep(),
    partiesStep(),
    {
      id: "decided",
      title: { ne: "निरूपण भइसकेको मुद्दा", en: "The case already decided" },
      intro: {
        ne: "यो निवेदनको आधार अर्को मुद्दामा भएको निर्णय हो। सो मुद्दा र त्यसमा प्रतिपादित सिद्धान्त स्पष्ट नखुलाई नियम ६२ को आदेश जारी हुँदैन।",
        en: "The ground for this petition is a decision in another case. No order under Rule 62 issues without identifying that case and the principle it settled.",
      },
      fields: [
        {
          id: "decidedCaseParties",
          type: "text",
          required: true,
          label: { ne: "सो मुद्दाका निवेदक/प्रत्यर्थी", en: "Petitioner and respondent in that case" },
        },
        {
          id: "decidedCaseNo",
          type: "text",
          required: true,
          label: { ne: "सो मुद्दाको नं.", en: "Number of that case" },
        },
        {
          id: "decidedCaseSummary",
          type: "textarea",
          required: true,
          label: { ne: "निरूपण भएको मुद्दाको संक्षिप्त बेहोरा", en: "Brief facts of the case decided" },
        },
        {
          id: "decidedIssue",
          type: "textarea",
          required: true,
          label: {
            ne: "सो मुद्दामा निरूपण भएको मुख्य विषय र प्रश्न",
            en: "The principal issue and question decided",
          },
        },
        {
          id: "principle",
          type: "textarea",
          required: true,
          label: { ne: "प्रतिपादित सिद्धान्त / नजिर", en: "The principle or precedent established" },
        },
      ],
    },
    {
      id: "claim",
      title: { ne: "आफ्नो हकमा आकर्षित हुने आधार र माग", en: "Why it reaches you, and what you ask" },
      fields: [
        {
          id: "applicabilityGround",
          type: "textarea",
          required: true,
          label: {
            ne: "उक्त निर्णय आफ्नो हकमा समेत आकर्षित हुने आधार र कारण",
            en: "Grounds on which that decision also bears on your case",
          },
        },
        {
          id: "reliefSought",
          type: "textarea",
          required: true,
          label: { ne: "निवेदकको माग दाबी", en: "The relief sought" },
        },
        {
          id: "implementingBody",
          type: "text",
          required: true,
          label: {
            ne: "माग गरेको विषय कार्यान्वयन गर्नुपर्ने निकाय",
            en: "Body that must implement what is sought",
          },
        },
        signatureDateField(),
      ],
    },
  ],
  clauses: [
    petitionHeadingClause({
      ne: "नियम ६२ बमोजिम आदेश जारी पाऊँ",
      en: "Praying for an order under Rule 62",
    }),
    partiesClause(),
    courtFeeClause(),
    {
      id: "request",
      heading: { ne: "निवेदन", en: "The petition" },
      body: {
        ne: "{{decidedCaseParties}} भएको मुद्दा नं. {{decidedCaseNo}} को मुद्दामा भएको आदेश/निर्णय मेरो हकमा समेत आकर्षित हुने भएकोले सर्वोच्च अदालत नियमावली, २०७४ को नियम ६२ को उपनियम (१) बमोजिम देहायको निवेदन पेस गरेको छु।",
        en: "The order or decision in case no. {{decidedCaseNo}}, between {{decidedCaseParties}}, also bears upon my own position. I therefore present this petition under Rule 62(1) of the Supreme Court Regulation, 2074.",
      },
    },
    {
      id: "particulars",
      heading: { ne: "निवेदनको बेहोरा", en: "Particulars of the petition" },
      body: {
        ne: "निरूपण भएको मुद्दाको संक्षिप्त बेहोरा:\n{{decidedCaseSummary}}\n\nउक्त मुद्दामा निरूपण भएको मुख्य विषय र प्रश्न:\n{{decidedIssue}}\n\nउक्त निर्णय आफ्नो हकमा समेत आकर्षित हुने आधार र कारण:\n{{applicabilityGround}}\n\nअदालतबाट प्रतिपादित सिद्धान्त/नजिर:\n{{principle}}\n\nनिवेदकको माग दाबी:\n{{reliefSought}}\n\nमाग गरेको विषय कार्यान्वयन गर्नुपर्ने निकाय:\n{{implementingBody}}",
        en: "Brief facts of the case decided:\n{{decidedCaseSummary}}\n\nThe principal issue and question decided:\n{{decidedIssue}}\n\nGrounds on which that decision also bears on my case:\n{{applicabilityGround}}\n\nThe principle or precedent established by the court:\n{{principle}}\n\nRelief sought:\n{{reliefSought}}\n\nBody that must implement what is sought:\n{{implementingBody}}",
      },
    },
    closingClause(),
  ],
};
