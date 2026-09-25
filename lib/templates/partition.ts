import type { Template } from "../types";
import { pendingReview, bsDateField, yesNoField } from "./common";
import { litigantFields, litigantLine, signatureDateField } from "./litigation-common";
import { PARTITION, APPEAL_PROVISIONS, APPELLATE_JURISDICTION, cite, ACTS } from "../nepal";
import {
  additionalPartiesField,
  courtStep,
  courtAndCaseStep,
  pleadingHeadingClause,
  pleadingWithCaseHeadingClause,
  pleadingPartiesClause,
  jurisdictionClause,
  evidenceFields,
  evidenceClause,
  noAdvocateClause,
  pleadingClosingClause,
  PLEADING_EXECUTION,
} from "./pleadings-common";

/**
 * अंशचलन — partition of undivided family property among co-heirs.
 *
 * The single most common cause of action in the reference filings this catalogue was
 * built from: a co-heir denied their share petitions the court to have the family's
 * property valued, divided and physically handed over. The three documents below are
 * the ones that fact pattern actually produces — the plaint that opens the case, the
 * written statement a named co-heir answers it with, and the appeal against a
 * District Court judgment — transcribed in shape and citation from real, filed
 * examples of each, the same way the 52 court-petition forms are transcribed from the
 * Supreme Court's own published templates rather than drafted independently.
 *
 * Every family-history and property-description paragraph is a free-text field
 * rather than a fixed clause. Which siblings exist, why one was shut out, what the
 * property is — none of that repeats from filing to filing the way a petition's
 * boilerplate does; templating it as fixed prose would either force someone else's
 * family story into the reader's document or silently drop the one fact a court
 * actually needs to see.
 */

const REVIEW = pendingReview();

/* =================================================================================
 * The plaint — अंशचलन फिराद-पत्र
 * ================================================================================= */
export const partitionPlaint: Template = {
  slug: "partition-plaint-angshachalan",
  category: "litigation",
  layout: "petition",
  priceNpr: 1_499,
  title: { ne: "अंशचलन फिराद-पत्र", en: "Partition Suit — Plaint" },
  summary: {
    ne: "साझा पारिवारिक सम्पत्तिमा आफ्नो हक पाउन इन्कार गरिएको सहअंशियारले अदालतमा दायर गर्ने फिराद-पत्रको ढाँचा।",
    en: "The plaint a co-heir denied their share of undivided family property files to open a partition case in court.",
  },
  governingAct: PARTITION,
  review: REVIEW,
  execution: PLEADING_EXECUTION,
  steps: [
    courtStep({
      ne: "यो फिराद-पत्रले नै मुद्दा खोल्छ — यसअघि कुनै मुद्दा नम्बर हुँदैन।",
      en: "This plaint is what opens the case — there is no case number yet.",
    }),
    {
      id: "plaintiff",
      title: { ne: "फिरादीको विवरण", en: "The plaintiff" },
      fields: [...litigantFields("plaintiff", { ne: "फिरादी", en: "Plaintiff" })],
    },
    {
      id: "defendants",
      title: { ne: "विपक्षीहरूको विवरण", en: "The opposing parties" },
      intro: {
        ne: "प्रायः बाबु, दाजुभाई वा अन्य सहअंशियार नै विपक्षी हुन्छन्।",
        en: "The opposing parties are usually the father, siblings, or other co-heirs.",
      },
      fields: [
        ...litigantFields("defendant", { ne: "विपक्षी", en: "Opposing party" }),
        additionalPartiesField("otherDefendants", {
          ne: "थप विपक्षीहरू (अरू सहअंशियार भए)",
          en: "Other opposing parties (other co-heirs, if any)",
        }),
      ],
    },
    {
      id: "family",
      title: { ne: "अंशियारी सम्बन्ध", en: "The family relationship" },
      intro: {
        ne: "साझा पुर्खा को हो, हाल कति जना अंशियार छन् र प्रत्येकको अंशियारी हक के आधारमा हो भन्ने कुरा अदालतले सबैभन्दा पहिले हेर्छ।",
        en: "The court looks first at who the common ancestor is, how many heirs there are now, and the basis for each one's claim to a share.",
      },
      fields: [
        {
          id: "familyBackground",
          type: "textarea",
          required: true,
          label: { ne: "पारिवारिक पृष्ठभूमि र अंशियारहरूको सूची", en: "Family background and the list of co-heirs" },
          help: {
            ne: "साझा पुर्खा, हरेक अंशियारको नाम र नाता, र कोही बितिसकेको भए सोको उल्लेख गर्नुहोस्।",
            en: "Name the common ancestor, every co-heir and their relation, and note anyone who has died.",
          },
        },
        {
          id: "totalHeirs",
          type: "number",
          required: true,
          label: { ne: "कुल अंशियार संख्या", en: "Total number of co-heirs" },
          help: {
            ne: "सम्पत्ति कति भागमा बाँडिनुपर्छ भन्ने यसैबाट निर्धारण हुन्छ।",
            en: "This is what determines how many equal shares the property is divided into.",
          },
        },
      ],
    },
    {
      id: "dispute",
      title: { ne: "विवादको विवरण", en: "The dispute" },
      fields: [
        {
          id: "disputeNarrative",
          type: "textarea",
          required: true,
          label: { ne: "अंश माग्दा इन्कार गरिएको व्यहोरा", en: "How the request for a share was refused" },
          help: {
            ne: "अंश किन माग्नुपर्‍यो, कहिले र कसरी माग गरियो, र विपक्षीले किन/कसरी इन्कार गरे भन्ने क्रमबद्ध विवरण।",
            en: "Why the share had to be claimed, when and how it was requested, and how the opposing party refused.",
          },
        },
        {
          id: "propertyDescription",
          type: "textarea",
          required: true,
          label: { ne: "अंश हुनुपर्ने सम्पत्तिको विवरण", en: "Description of the property to be partitioned" },
          help: {
            ne: "जिल्ला, नगरपालिका/गाउँपालिका, वडा नं., कित्ता नं., क्षेत्रफल — हरेक जग्गा/घर छुट्टै लाइनमा।",
            en: "District, municipality, ward no., plot (kitta) no., area — one property per line.",
          },
        },
        yesNoField(
          "hasConcealedProperty",
          {
            ne: "विपक्षीले सम्पत्ति लुकाएको वा जानकारी नदिई बेचेको आरोप छ?",
            en: "Is there an allegation that the opposing party concealed or sold property without notice?",
          },
          { ne: "छ", en: "Yes" },
          { ne: "छैन", en: "No" },
          {
            ne: "अंश दपोट वा अंश भरपाईको दाबी समेत भए यहाँ उल्लेख गर्नुहोस्।",
            en: "Note it here if the claim also involves concealed or unaccounted-for property.",
          },
        ),
        {
          id: "concealedPropertyDetail",
          type: "textarea",
          required: false,
          label: { ne: "लुकाएको/बेचेको सम्पत्तिको विवरण", en: "Detail of the concealed or sold property" },
          help: {
            ne: "कहिले, कसरी थाहा भयो, र कुन लिखत/कारोबारको आधारमा भन्ने कुरा उल्लेख गर्नुहोस्।",
            en: "State when and how it came to light, and which deed or transaction it concerns.",
          },
        },
      ],
    },
    {
      id: "evidence",
      title: { ne: "साक्षी र प्रमाण", en: "Witnesses and evidence" },
      fields: [...evidenceFields(), signatureDateField()],
    },
  ],
  clauses: [
    pleadingHeadingClause({ ne: "फिराद-पत्र", en: "Plaint" }, { ne: "अंशचलन", en: "Partition (अंशचलन)" }),
    pleadingPartiesClause({ ne: "फिरादी", en: "Plaintiff" }, { ne: "विपक्षी", en: "Opposing party" }),
    jurisdictionClause(),
    {
      id: "family",
      numbered: true,
      heading: { ne: "अंशियारी सम्बन्ध", en: "The family relationship" },
      body: {
        ne: "{{familyBackground}} यसरी हामी एकासगोलका अंशियारहरूमा गरी जम्मा {{totalHeirs}} जना अंशियार रहेका छौं।",
        en: "{{familyBackground}} We are accordingly {{totalHeirs}} co-heirs of one undivided estate in total.",
      },
    },
    {
      id: "dispute",
      numbered: true,
      heading: { ne: "विवादको विवरण", en: "The dispute" },
      body: {
        ne: "{{disputeNarrative}} यसरी विपक्षीले मलाई/हामीलाई अन्याय गरी अंशहक दिन इन्कार गरेकाले मुद्दा मामिला गर्न बाध्यात्मक अवस्था सिर्जना भएकोले यसै सम्मानित अदालतमा यो अंशचलन मुद्दा दायर गरेको छु/छौं।",
        en: "{{disputeNarrative}} Having been wronged by the opposing party's refusal to grant the share I am/we are entitled to, I am/we are compelled to bring this partition suit before this honourable Court.",
      },
    },
    {
      id: "property",
      numbered: true,
      heading: { ne: "सम्पत्तिको विवरण र मागदावी", en: "The property and the relief sought" },
      citation: PARTITION,
      body: {
        ne: "अंश हुनुपर्ने सम्पत्तिको विवरण यस प्रकार छ:– {{propertyDescription}} उल्लेखित सम्पूर्ण सम्पत्तिको तायदाती फाँटवारी पेश गर्न लगाई सो सम्पत्तिलाई {{totalHeirs}} भाग लगाई सोको एक भाग मेरो/हाम्रो अंशहक कायम गरी, अंश दिलाई भराई चलन समेत चलाई न्याय इन्साफ दिलाई पाऊँ।",
        en: "The property to be partitioned is as follows:– {{propertyDescription}} I/we pray that a full inventory of the above property be filed, that it be divided into {{totalHeirs}} equal shares, that one such share be confirmed as my/our own, and that it be handed over and possession given accordingly.",
      },
    },
    {
      id: "concealed",
      numbered: true,
      when: { field: "hasConcealedProperty", op: "eq", value: "yes" },
      heading: { ne: "लुकाएको/बेचेको सम्पत्ति", en: "Concealed or sold property" },
      body: {
        ne: "साथै, {{concealedPropertyDetail}} भएकोले उक्त सम्पत्ति समेत तायदाती फाँटवारीमा समावेश गरी दपोट गरेको सम्पत्तिबापत समेत न्याय इन्साफ दिलाई पाऊँ।",
        en: "Further, {{concealedPropertyDetail}}, and I/we pray that this property too be included in the inventory and that justice be done in respect of the concealed portion.",
      },
    },
    evidenceClause(),
    noAdvocateClause(),
    pleadingClosingClause({ ne: "फिरादी", en: "Plaintiff" }, "plaintiffName"),
  ],
};

/* =================================================================================
 * The written statement — अंशचलन प्रतिउत्तर-पत्र
 * ================================================================================= */
export const partitionWrittenStatement: Template = {
  slug: "partition-written-statement",
  category: "litigation",
  layout: "petition",
  priceNpr: 1_499,
  title: { ne: "अंशचलन प्रतिउत्तर-पत्र", en: "Partition Suit — Written Statement" },
  summary: {
    ne: "अंशचलन मुद्दामा नामजारी भएको विपक्षीले फिराद दाबी जवाफ दिन अदालतमा पेस गर्ने प्रतिउत्तर-पत्रको ढाँचा।",
    en: "The written statement a named defendant files to answer a plaint in a partition case already before the court.",
  },
  governingAct: PARTITION,
  review: REVIEW,
  execution: PLEADING_EXECUTION,
  steps: [
    courtAndCaseStep({
      ne: "यो फिराद प्राप्त भएपछि, आफ्नो नाममा तामेल भएको म्यादभित्रै अदालतमा दर्ता गर्नुपर्छ — साधारणतः २१ दिन, म्याद तामेल भएको सूचनामा उल्लेख भएबमोजिम।",
      en: "This must be filed within the deadline served on you after receiving the plaint — ordinarily 21 days, as stated on your own summons.",
    }),
    {
      id: "respondent",
      title: { ne: "प्रतिउत्तरवाला (हजुरको) विवरण", en: "The respondent (you)" },
      fields: [...litigantFields("respondent", { ne: "प्रतिउत्तरवाला", en: "Respondent" })],
    },
    {
      id: "opponent",
      title: { ne: "वादी (फिराद गर्नेको) विवरण", en: "The plaintiff (who filed the case)" },
      fields: [
        ...litigantFields("opponent", { ne: "वादी", en: "Plaintiff" }),
        additionalPartiesField("otherOpponents", {
          ne: "थप वादी वा सहप्रतिउत्तरवाला (भए मात्र)",
          en: "Other plaintiffs or co-respondents (if any)",
        }),
      ],
    },
    {
      id: "defence",
      title: { ne: "जवाफ", en: "The answer" },
      fields: [
        yesNoField(
          "isDateLapsed",
          {
            ne: "म्याद गुज्रिसकेको हो र थमाउनुपर्ने छ?",
            en: "Has the deadline already lapsed, and does it need to be condoned?",
          },
          { ne: "हो", en: "Yes" },
          { ne: "होइन", en: "No" },
          {
            ne: "कावुबाहिरको परिस्थितिले म्याद गुज्रेको भए मात्र 'हो' छान्नुहोस्।",
            en: "Choose 'Yes' only if circumstances beyond your control caused the deadline to lapse.",
          },
        ),
        {
          id: "lapseReason",
          type: "textarea",
          required: false,
          label: { ne: "म्याद गुज्रिनुको कारण", en: "Why the deadline lapsed" },
        },
        {
          id: "defenceNarrative",
          type: "textarea",
          required: true,
          label: { ne: "फिराद दाबी अस्वीकार गर्ने आधार", en: "Grounds for denying the claim" },
          help: {
            ne: "वादीले उठाएका प्रत्येक दाबीलाई क्रमैसँग खण्डन गर्नुहोस् — जस्तै: पहिले नै अंश बुझिसकेको, हकदैया वा हदम्याद नपुगेको, वा तथ्य नै गलत भएको।",
            en: "Rebut each of the plaintiff's claims in turn — e.g. the share was already settled, the plaintiff lacks standing or is out of time, or the facts alleged are simply wrong.",
          },
        },
        yesNoField(
          "raisesLimitationDefence",
          {
            ne: "हकदैया वा हदम्याद नपुगेको जिकिर लिने?",
            en: "Raise a standing or limitation defence?",
          },
          { ne: "लिने", en: "Yes" },
          { ne: "नलिने", en: "No" },
        ),
      ],
    },
    {
      id: "evidence",
      title: { ne: "साक्षी र प्रमाण", en: "Witnesses and evidence" },
      fields: [...evidenceFields(), signatureDateField()],
    },
  ],
  clauses: [
    pleadingWithCaseHeadingClause({ ne: "प्रतिउत्तर-पत्र", en: "Written Statement" }, { ne: "अंशचलन", en: "Partition (अंशचलन)" }),
    {
      id: "parties",
      heading: { ne: "पक्षहरू", en: "The parties" },
      body: {
        ne: `${litigantLine("respondent").ne} — प्रतिउत्तरवाला।\n{{otherOpponents}}\n\nविरुद्ध\n\n${litigantLine("opponent").ne} — वादी।`,
        en: `${litigantLine("respondent").en} — respondent.\n\nagainst\n\n${litigantLine("opponent").en} — plaintiff.\n{{otherOpponents}}`,
      },
    },
    {
      id: "lapse",
      numbered: true,
      when: { field: "isDateLapsed", op: "eq", value: "yes" },
      heading: { ne: "म्याद थामी दिनुको अनुरोध", en: "Request to condone the lapsed deadline" },
      citation: cite(ACTS.civilProcedure, "दफा २२३", "§223"),
      body: {
        ne: "उक्त मुद्दाको प्रतिउत्तर पेस गर्ने म्याद {{lapseReason}} कारणले गुज्रन गएकोले मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा २२३ बमोजिम सो म्याद थामी, म्यादैभित्र यो प्रतिउत्तर-पत्र दर्ता गरिपाऊँ भनी निवेदन समेत गर्दछु/गर्दछौं।",
        en: "The deadline to file this written statement lapsed because {{lapseReason}}. I/we accordingly petition, under Civil Procedure Code §223, that the lapsed deadline be condoned and this written statement accepted as timely filed.",
      },
    },
    {
      id: "defence",
      numbered: true,
      heading: { ne: "जवाफ", en: "The answer" },
      body: {
        ne: "{{defenceNarrative}}",
        en: "{{defenceNarrative}}",
      },
    },
    {
      id: "limitation",
      numbered: true,
      when: { field: "raisesLimitationDefence", op: "eq", value: "yes" },
      heading: { ne: "हकदैया र हदम्याद", en: "Standing and limitation" },
      citation: cite(ACTS.civilProcedure, "दफा १०, ४८", "§§10, 48"),
      body: {
        ne: "साथै, वादीलाई प्रस्तुत मुद्दा दायर गर्ने हकदैया मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १० बमोजिम पुगेको देखिँदैन र/वा ऐ. दफा ४८ बमोजिमको हदम्यादभित्र मुद्दा दायर भएको देखिँदैन, तसर्थ यी आधारमा समेत फिराद दाबी खारेज गरिपाऊँ।",
        en: "Further, the plaintiff does not appear to have standing to bring this case under Civil Procedure Code §10, and/or has not filed it within the limitation period under §48. I/we pray that the claim be dismissed on these grounds as well.",
      },
    },
    evidenceClause(),
    noAdvocateClause(),
    pleadingClosingClause({ ne: "प्रतिउत्तरवाला", en: "Respondent" }, "respondentName"),
  ],
};

/* =================================================================================
 * The appeal — अंशचलन पुनरावेदन-पत्र
 * ================================================================================= */
export const partitionAppeal: Template = {
  slug: "partition-appeal",
  category: "litigation",
  layout: "petition",
  priceNpr: 1_999,
  title: { ne: "अंशचलन पुनरावेदन-पत्र", en: "Partition Suit — Appeal" },
  summary: {
    ne: "जिल्ला अदालतको अंशचलन फैसलामा चित्त नबुझी उच्च अदालतमा दायर गरिने पुनरावेदन-पत्रको ढाँचा।",
    en: "The appeal filed at the High Court against a District Court judgment in a partition case.",
  },
  governingAct: APPEAL_PROVISIONS,
  review: REVIEW,
  execution: PLEADING_EXECUTION,
  steps: [
    courtAndCaseStep({
      ne: "पुनरावेदन सामान्यतः फैसला प्रमाणित भएको मितिले ३० दिनभित्र दायर गर्नुपर्छ। यहाँ पुनरावेदन दायर हुने (माथिल्लो) अदालतको विवरण भर्नुहोस्।",
      en: "An appeal must ordinarily be filed within 30 days of the judgment being certified. Enter the details of the court the appeal itself is filed at (the court above the one that decided it).",
    }),
    {
      id: "appellant",
      title: { ne: "पुनरावेदकको विवरण", en: "The appellant" },
      fields: [...litigantFields("appellant", { ne: "पुनरावेदक", en: "Appellant" })],
    },
    {
      id: "respondent",
      title: { ne: "प्रत्यर्थीको विवरण", en: "The respondent" },
      fields: [
        ...litigantFields("respondent", { ne: "प्रत्यर्थी", en: "Respondent" }),
        additionalPartiesField("otherRespondents", {
          ne: "थप प्रत्यर्थीहरू (भए मात्र)",
          en: "Other respondents (if any)",
        }),
      ],
    },
    {
      id: "judgment",
      title: { ne: "फैसलाको विवरण", en: "The judgment being appealed" },
      fields: [
        {
          id: "lowerCourtName",
          type: "text",
          required: true,
          label: { ne: "फैसला गर्ने अदालत", en: "Court that gave the judgment" },
          placeholder: { ne: "जिल्ला अदालत काठमाडौं", en: "District Court, Kathmandu" },
        },
        {
          id: "judgeName",
          type: "text",
          required: false,
          label: { ne: "फैसला गर्ने न्यायाधीश", en: "Judge who gave the judgment" },
        },
        bsDateField("judgmentDateBs", { ne: "फैसला भएको मिति (वि.सं.)", en: "Date of the judgment (BS)" }),
        bsDateField("certifiedCopyDateBs", { ne: "फैसला प्रमाणित भएको मिति (वि.सं.)", en: "Date the judgment was certified (BS)" }),
        {
          id: "caseFileNo",
          type: "text",
          required: false,
          label: { ne: "मुद्दा मिसिल नं. / नि.नं.", en: "Case file no. / decision no." },
        },
      ],
    },
    {
      id: "grounds",
      title: { ne: "पुनरावेदनको आधार", en: "Grounds for appeal" },
      fields: [
        {
          id: "caseSummary",
          type: "textarea",
          required: true,
          label: { ne: "मुद्दाको संक्षिप्त विवरण", en: "Brief summary of the case" },
          help: {
            ne: "मूल फिराद दाबी र तल्लो अदालतमा भएको कारबाहीको छोटो सार।",
            en: "A short summary of the original claim and what happened in the lower court.",
          },
        },
        {
          id: "lowerCourtReasoning",
          type: "textarea",
          required: true,
          label: { ne: "तल्लो अदालतको फैसलाको आधार", en: "The lower court's reasoning" },
          help: {
            ne: "फैसलाले के ठहर गर्‍यो र किन भन्ने कुरा, फैसलाको प्रतिलिपिबाट सारमा उतार्नुहोस्।",
            en: "What the judgment decided, and why, summarised from the judgment itself.",
          },
        },
        {
          id: "appealGrounds",
          type: "textarea",
          required: true,
          label: { ne: "फैसला त्रुटीपूर्ण हुनुको आधार", en: "Why the judgment is wrong" },
          help: {
            ne: "फैसलाको कुन ठहरमा, किन असहमत हुनुहुन्छ भन्ने कुरा प्रकरणैपिच्छे किटानी दिनुहोस् — यही नै पुनरावेदनको सार हो।",
            en: "State, point by point, exactly which finding is wrong and why — this is the substance of the appeal.",
          },
        },
      ],
    },
    {
      id: "evidence",
      title: { ne: "संलग्न कागजात", en: "Documents to attach" },
      intro: {
        ne: "फैसलाको प्रमाणित प्रतिलिपि संलग्न गर्नु अनिवार्य छ।",
        en: "A certified copy of the judgment must be attached.",
      },
      fields: [...evidenceFields(), signatureDateField()],
    },
  ],
  clauses: [
    pleadingWithCaseHeadingClause({ ne: "पुनरावेदन-पत्र", en: "Appeal" }, { ne: "अंशचलन", en: "Partition (अंशचलन)" }),
    {
      id: "parties",
      heading: { ne: "पक्षहरू", en: "The parties" },
      body: {
        ne: `${litigantLine("appellant").ne} — पुनरावेदक/वादी वा प्रतिवादी।\n\nविरुद्ध\n\n${litigantLine("respondent").ne} — प्रत्यर्थी।\n{{otherRespondents}}`,
        en: `${litigantLine("appellant").en} — appellant.\n\nagainst\n\n${litigantLine("respondent").en} — respondent.\n{{otherRespondents}}`,
      },
    },
    {
      id: "judgment",
      numbered: true,
      heading: { ne: "फैसलाको विवरण र म्यादको पालना", en: "The judgment and timeliness" },
      body: {
        ne: "{{lowerCourtName}}का {{judgeName}}बाट मिति {{judgmentDateBs}} गते भएको फैसला (मुद्दा मिसिल नं./नि.नं. {{caseFileNo}}) मिति {{certifiedCopyDateBs}} गते प्रमाणित भई सोको प्रतिलिपि लिई हेर्दा मलाई/हामीलाई अन्याय परेको देखिएकाले सो फैसलामा चित्त नबुझी, प्रमाणित भएको मितिले तोकिएको म्यादभित्रै यो पुनरावेदन-पत्र दर्ता गर्न ल्याएको छु/छौं।",
        en: "The judgment given by {{judgeName}} of {{lowerCourtName}} on {{judgmentDateBs}} (BS) (case file/decision no. {{caseFileNo}}) was certified on {{certifiedCopyDateBs}} (BS). Having reviewed the certified copy and found it prejudicial, I am/we are dissatisfied with that judgment and file this appeal within the period allowed from certification.",
      },
    },
    {
      id: "summary",
      numbered: true,
      heading: { ne: "मुद्दाको संक्षिप्त विवरण", en: "Summary of the case" },
      body: { ne: "{{caseSummary}}", en: "{{caseSummary}}" },
    },
    {
      id: "reasoning",
      numbered: true,
      heading: { ne: "तल्लो अदालतको फैसलाको आधार", en: "The lower court's reasoning" },
      body: { ne: "{{lowerCourtReasoning}}", en: "{{lowerCourtReasoning}}" },
    },
    {
      id: "grounds",
      numbered: true,
      heading: { ne: "पुनरावेदन जिकिर", en: "Grounds for appeal" },
      citation: APPEAL_PROVISIONS,
      body: {
        ne: "{{appealGrounds}} उल्लिखित आधारहरूका साथै मुलुकी देवानी कार्यविधि संहिता, २०७४ को दफा १९०–१९२ बमोजिम माथि उल्लेखित फैसला त्रुटीपूर्ण भई बदरभागी छ। तसर्थ सो फैसला उल्टी बदर गरी मूल फिराद दाबी र प्रस्तुत पुनरावेदन जिकिरबमोजिम न्याय इन्साफ दिलाई पाऊँ।",
        en: "{{appealGrounds}} For the reasons above, and under Civil Procedure Code §§190–192, the judgment named above is erroneous and liable to be set aside. I/we accordingly pray that it be reversed and that judgment be given in accordance with the original claim and this appeal.",
      },
    },
    {
      id: "jurisdiction",
      numbered: true,
      heading: { ne: "अदालती शुल्क र क्षेत्राधिकार", en: "Court fee and jurisdiction" },
      locked: true,
      citation: APPELLATE_JURISDICTION,
      body: {
        ne: "पुनरावेदन पत्र दर्ता गर्न लाग्ने अदालती शुल्क यसैसाथ दाखिला गरेको छु/छौं। यो पुनरावेदन-पत्र न्याय प्रशासन ऐन, २०७३ को दफा ८(३) बमोजिम यसै अदालतको क्षेत्राधिकारभित्र पर्दछ।",
        en: "The court fee for filing this appeal is deposited herewith. This appeal falls within this Court's jurisdiction under Administration of Justice Act, 2073 §8(3).",
      },
    },
    evidenceClause(),
    noAdvocateClause(),
    pleadingClosingClause({ ne: "पुनरावेदक", en: "Appellant" }, "appellantName"),
  ],
};
