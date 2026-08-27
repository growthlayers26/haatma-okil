import type { Template } from "../types";
import { LAND_TRANSFER, GIFT, LEASE } from "../nepal";
import {
  pendingReview,
  partyStep,
  nameField,
  addressField,
  bsDateField,
  moneyField,
  governingLawClause,
  EXECUTION,
} from "./common";

/* ------------------------------------------------------------------ land sale */

/**
 * Sale deed for land (राजीनामा).
 *
 * The single most consequential document in this catalogue, and the one where a
 * signature achieves the least. In Nepal an interest in land passes at the Land
 * Revenue Office, not on the page — a signed, witnessed, notarised deed that was
 * never registered transfers nothing at all. That fact is on the face of the
 * document rather than in a footnote, because people lose houses to it.
 */
export const landSaleDeed: Template = {
  slug: "land-sale-deed",
  category: "property",
  priceNpr: 1_499,
  title: { ne: "राजीनामा (घरजग्गा किनबेच)", en: "Sale Deed for Land" },
  summary: {
    ne: "घरजग्गा किनबेचको लिखत। मालपोत कार्यालयमा दर्ता नभएसम्म हक हस्तान्तरण नहुने कुरा स्पष्ट पारिएको।",
    en: "Deed for the sale of land, written to make plain that no interest passes until it is registered at the Land Revenue Office.",
  },
  governingAct: LAND_TRANSFER,
  review: pendingReview(),
  execution: [
    {
      ne: "यो लिखत मालपोत कार्यालयमा दर्ता नभएसम्म जग्गाको हक क्रेतामा सर्दैन। हस्ताक्षर र नोटरी मात्रले हस्तान्तरण हुँदैन।",
      en: "No interest in the land passes to the buyer until this deed is registered at the Land Revenue Office. Signature and notarisation alone do not transfer it.",
    },
    EXECUTION.bothSign,
    EXECUTION.twoWitnesses,
    {
      ne: "दर्ता गर्नुअघि जग्गा धनी प्रमाणपुर्जा, नापी नक्सा, तिरो रसिद र कर चुक्ता प्रमाण आवश्यक पर्दछ।",
      en: "Registration requires the ownership certificate, survey map, land revenue receipts and evidence that taxes are clear.",
    },
    {
      ne: "जग्गामा धितो, रोक्का वा मुद्दा छ कि छैन दर्ताअघि मालपोत कार्यालयमा जाँच गर्नुहोस्।",
      en: "Check at the Land Revenue Office for any mortgage, freeze order or pending litigation before registering.",
    },
    EXECUTION.stampDuty,
  ],
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
      id: "land",
      title: { ne: "जग्गाको विवरण", en: "The land" },
      intro: {
        ne: "कित्ता नम्बर र क्षेत्रफल जग्गा धनी प्रमाणपुर्जासँग अक्षरशः मिल्नुपर्दछ।",
        en: "The parcel number and area must match the ownership certificate exactly — a mismatch stops registration.",
      },
      fields: [
        {
          id: "parcelNo",
          type: "text",
          required: true,
          label: { ne: "कित्ता नं.", en: "Parcel (kitta) number" },
          citation: LAND_TRANSFER,
        },
        { id: "wardNo", type: "text", required: true, label: { ne: "वडा नं.", en: "Ward number" } },
        {
          id: "municipality",
          type: "text",
          required: true,
          label: { ne: "नगरपालिका/गाउँपालिका", en: "Municipality / rural municipality" },
        },
        { id: "district", type: "text", required: true, label: { ne: "जिल्ला", en: "District" } },
        {
          id: "area",
          type: "text",
          required: true,
          label: { ne: "क्षेत्रफल", en: "Area" },
          placeholder: { ne: "जस्तै: ०-४-२-० (रोपनी-आना-पैसा-दाम)", en: "e.g. 0-4-2-0 (ropani-aana-paisa-daam)" },
        },
        {
          id: "boundaries",
          type: "textarea",
          required: true,
          label: { ne: "चार किल्ला", en: "Boundaries on four sides" },
          help: {
            ne: "पूर्व, पश्चिम, उत्तर र दक्षिणतर्फ के-के छ खुलाउनुहोस्।",
            en: "State what lies to the east, west, north and south.",
          },
        },
      ],
    },
    {
      id: "price",
      title: { ne: "मूल्य तथा भुक्तानी", en: "Price and payment" },
      fields: [
        moneyField("priceNpr", { ne: "कुल मूल्य (रु.)", en: "Total price (NPR)" }),
        moneyField("advanceNpr", { ne: "अग्रिम भुक्तानी (रु.)", en: "Advance paid (NPR)" }, {
          ne: "दर्ताअघि दिइएको रकम यहाँ खुलाउनुहोस्।",
          en: "Record anything paid before registration — this is what a buyer must prove if the sale falls through.",
        }, false),
        bsDateField("deedDateBs", { ne: "लिखत मिति (वि.सं.)", en: "Date of the deed (BS)" }),
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "लिखतको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: LAND_TRANSFER,
      body: {
        ne: `यो राजीनामाको लिखत {{deedDateBs}} मा {{sellerName}} (नागरिकता नं. {{sellerCitizenshipNo}}), ठेगाना {{sellerAddress}} (यसपछि "बिक्रेता") र {{buyerName}} (नागरिकता नं. {{buyerCitizenshipNo}}), ठेगाना {{buyerAddress}} (यसपछि "क्रेता") बीच सम्पन्न भएको छ।`,
        en: `This Sale Deed is made on {{deedDateBs}} between {{sellerName}} (citizenship no. {{sellerCitizenshipNo}}), of {{sellerAddress}} (the "Seller") and {{buyerName}} (citizenship no. {{buyerCitizenshipNo}}), of {{buyerAddress}} (the "Buyer").`,
      },
    },
    {
      id: "land",
      heading: { ne: "जग्गाको विवरण", en: "The land" },
      citation: LAND_TRANSFER,
      body: {
        ne: `बिक्री हुने जग्गा {{district}} जिल्ला, {{municipality}}, वडा नं. {{wardNo}} स्थित कित्ता नं. {{parcelNo}} को क्षेत्रफल {{area}} रहेको छ। सो जग्गाको चार किल्ला देहायबमोजिम छ:\n\n{{boundaries}}`,
        en: `The land sold is parcel no. {{parcelNo}}, measuring {{area}}, situated in Ward No. {{wardNo}}, {{municipality}}, {{district}} District. Its boundaries are:\n\n{{boundaries}}`,
      },
    },
    {
      id: "price",
      heading: { ne: "मूल्य", en: "Price" },
      body: {
        ne: `उक्त जग्गाको कुल मूल्य रु. {{priceNpr}} कायम गरिएको छ।`,
        en: `The total price agreed for the land is NPR {{priceNpr}}.`,
      },
    },
    {
      id: "advance",
      heading: { ne: "अग्रिम भुक्तानी", en: "Advance payment" },
      when: { field: "advanceNpr", op: "truthy" },
      body: {
        ne: `क्रेताले बिक्रेतालाई अग्रिम बापत रु. {{advanceNpr}} बुझाइसकेको छ र बिक्रेताले सो रकम प्राप्त गरेको स्वीकार गर्दछ। बाँकी रकम दर्ताको समयमा बुझाइनेछ।`,
        en: `The Buyer has paid NPR {{advanceNpr}} in advance, receipt of which the Seller acknowledges. The balance is payable at registration.`,
      },
    },
    {
      id: "seller-warranty",
      heading: { ne: "बिक्रेताको प्रत्याभूति", en: "Seller's warranty" },
      locked: true,
      citation: LAND_TRANSFER,
      body: {
        ne: `बिक्रेताले उक्त जग्गा आफ्नो हकभोगमा रहेको, कुनै धितो, बन्धक, रोक्का वा अदालती विवादमा नरहेको र बिक्री गर्न पूर्ण कानुनी अधिकार रहेको प्रत्याभूति दिन्छ। यसमा झुट्ठा भएमा बिक्रेता कानुनबमोजिम जिम्मेवार हुनेछ।`,
        en: `The Seller warrants that the land is in their lawful ownership and possession, is free of any mortgage, charge, freeze order or pending litigation, and that they have full legal authority to sell it. The Seller is answerable at law for any falsehood in this warranty.`,
      },
    },
    {
      id: "registration",
      heading: { ne: "दर्ता नभई हक सर्दैन", en: "No transfer without registration" },
      locked: true,
      citation: LAND_TRANSFER,
      body: {
        ne: `यो लिखत सम्बन्धित मालपोत कार्यालयमा दर्ता भई क्रेताको नाममा जग्गा धनी प्रमाणपुर्जा जारी नभएसम्म जग्गाको हक क्रेतामा हस्तान्तरण भएको मानिने छैन। दुवै पक्ष दर्ताका लागि मालपोत कार्यालयमा उपस्थित हुन मञ्जुर गर्दछन्।`,
        en: `No interest in the land passes to the Buyer until this deed is registered at the relevant Land Revenue Office and an ownership certificate issues in the Buyer's name. Both parties agree to attend that office for registration.`,
      },
    },
    {
      id: "possession",
      heading: { ne: "कब्जा", en: "Possession" },
      body: {
        ne: `दर्ता सम्पन्न भई पूर्ण भुक्तानी भएपछि बिक्रेताले जग्गाको कब्जा क्रेतालाई हस्तान्तरण गर्नेछ।`,
        en: `The Seller shall deliver possession of the land to the Buyer on completion of registration and payment in full.`,
      },
    },
    {
      id: "taxes",
      heading: { ne: "कर तथा दस्तुर", en: "Taxes and duties" },
      body: {
        ne: `दर्तासम्मको मालपोत तथा अन्य कर बिक्रेताले चुक्ता गर्नेछ। दर्ता दस्तुर र रजिस्ट्रेशन शुल्क प्रचलित कानुनबमोजिम व्यहोरिनेछ।`,
        en: `Land revenue and other taxes up to registration are the Seller's responsibility. Registration fees and duties are borne as prevailing law provides.`,
      },
    },
    governingLawClause(LAND_TRANSFER),
  ],
};

/* ------------------------------------------------------------------ gift */

/** Gift deed (दान बकसपत्र) — commonly used for transfers within a family. */
export const giftDeed: Template = {
  slug: "gift-deed",
  category: "property",
  priceNpr: 999,
  title: { ne: "दान बकसपत्र", en: "Gift Deed" },
  summary: {
    ne: "बिना मूल्य सम्पत्ति हस्तान्तरण गर्ने लिखत। परिवारभित्रको हस्तान्तरणमा प्रयोग हुने।",
    en: "Deed transferring property without payment, most often within a family.",
  },
  governingAct: GIFT,
  review: pendingReview(),
  execution: [
    {
      ne: "घरजग्गाको दान बकसपत्र मालपोत कार्यालयमा दर्ता नभएसम्म हक हस्तान्तरण हुँदैन।",
      en: "A gift of land does not transfer any interest until registered at the Land Revenue Office.",
    },
    EXECUTION.twoWitnesses,
    EXECUTION.notarised,
    {
      ne: "पैतृक सम्पत्ति दान गर्दा अंशियारको हक असर पर्न सक्दछ — अधिवक्तासँग परामर्श गर्नुहोस्।",
      en: "Gifting ancestral property can cut across a coparcener's partition right. Take advice before doing it.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        ...partyStep(
          { prefix: "donor", role: { ne: "दाता", en: "Donor" } },
          { prefix: "donee", role: { ne: "ग्रहणकर्ता", en: "Recipient" } },
        ),
        nameField("relationship", { ne: "नाता", en: "Relationship" }, false),
      ],
    },
    {
      id: "property",
      title: { ne: "सम्पत्तिको विवरण", en: "The property" },
      fields: [
        {
          id: "propertyDetails",
          type: "textarea",
          required: true,
          label: { ne: "सम्पत्तिको विस्तृत विवरण", en: "Full description of the property" },
        },
        {
          id: "propertyOrigin",
          type: "select",
          required: true,
          label: { ne: "सम्पत्तिको स्रोत", en: "How the donor came to own it" },
          citation: GIFT,
          help: {
            ne: "पैतृक सम्पत्तिमा अंशियारको हक रहन्छ।",
            en: "Ancestral property carries coparcenary rights that a gift cannot simply override.",
          },
          options: [
            { value: "self", label: { ne: "आफ्नै आर्जनको", en: "Self-acquired" } },
            { value: "ancestral", label: { ne: "पैतृक", en: "Ancestral" } },
          ],
        },
        bsDateField("deedDateBs", { ne: "लिखत मिति (वि.सं.)", en: "Date of the deed (BS)" }),
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "लिखतको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: GIFT,
      body: {
        ne: `यो दान बकसपत्र {{deedDateBs}} मा {{donorName}} (नागरिकता नं. {{donorCitizenshipNo}}), ठेगाना {{donorAddress}} ले {{doneeName}} (नागरिकता नं. {{doneeCitizenshipNo}}), ठेगाना {{doneeAddress}} लाई दिएको हो।`,
        en: `This Gift Deed is made on {{deedDateBs}} by {{donorName}} (citizenship no. {{donorCitizenshipNo}}), of {{donorAddress}}, in favour of {{doneeName}} (citizenship no. {{doneeCitizenshipNo}}), of {{doneeAddress}}.`,
      },
    },
    {
      id: "relationship",
      heading: { ne: "नाता", en: "Relationship" },
      when: { field: "relationship", op: "truthy" },
      body: {
        ne: `ग्रहणकर्ता दाताको {{relationship}} हुनुहुन्छ।`,
        en: `The Recipient is the Donor's {{relationship}}.`,
      },
    },
    {
      id: "gift",
      heading: { ne: "दानको व्यहोरा", en: "The gift" },
      citation: GIFT,
      body: {
        ne: `दाताले स्वस्थ चित्त र स्वतन्त्र इच्छाले, कुनै करकाप वा प्रलोभनबिना, कुनै मूल्य नलिई देहायको सम्पत्ति ग्रहणकर्तालाई दान दिएको छ:\n\n{{propertyDetails}}`,
        en: `The Donor, of sound mind and acting freely without coercion or inducement, and without receiving any payment, gives the following property to the Recipient:\n\n{{propertyDetails}}`,
      },
    },
    {
      id: "ancestral-warning",
      heading: { ne: "अंश हकसम्बन्धी सीमा", en: "Limits arising from partition rights" },
      when: { field: "propertyOrigin", op: "eq", value: "ancestral" },
      locked: true,
      citation: GIFT,
      body: {
        ne: `यो सम्पत्ति पैतृक भएकाले अंशियारहरूको हक प्रचलित कानुनबमोजिम सुरक्षित रहनेछ। अंशियारको हक हनन हुने हदसम्म यो दान कार्यान्वयन नहुन सक्दछ।`,
        en: `Because this property is ancestral, the partition rights of coparceners remain protected under prevailing law. To the extent this gift would defeat those rights, it may not be given effect.`,
      },
    },
    {
      id: "acceptance",
      heading: { ne: "स्वीकृति", en: "Acceptance" },
      locked: true,
      body: {
        ne: `ग्रहणकर्ताले उक्त दान स्वीकार गरेको छ। दान स्वीकार नगरिएको खण्डमा यो लिखत प्रभावकारी हुँदैन।`,
        en: `The Recipient accepts the gift. A gift that is not accepted does not take effect.`,
      },
    },
    {
      id: "registration",
      heading: { ne: "दर्ता", en: "Registration" },
      locked: true,
      citation: GIFT,
      body: {
        ne: `घरजग्गाको हकमा यो लिखत मालपोत कार्यालयमा दर्ता नभएसम्म हक हस्तान्तरण भएको मानिने छैन।`,
        en: `Where the property is land, no interest passes until this deed is registered at the Land Revenue Office.`,
      },
    },
    governingLawClause(GIFT),
  ],
};

/* ------------------------------------------------------------------ rent receipt */

/** Rent receipt — small, and the thing a tenant most often cannot produce. */
export const rentReceipt: Template = {
  slug: "rent-receipt",
  category: "property",
  priceNpr: 149,
  title: { ne: "बहाल भुक्तानी रसिद", en: "Rent Receipt" },
  summary: {
    ne: "बहाल बुझेको प्रमाण। विवाद परेमा बहालवालाले देखाउन सक्ने एक मात्र कागजात प्राय: यही हुन्छ।",
    en: "Proof that rent was paid. In a dispute this is usually the only document a tenant can produce.",
  },
  governingAct: LEASE,
  review: pendingReview(),
  execution: [
    {
      ne: "घरधनीले हस्ताक्षर गरी बहालवालालाई दिनुपर्दछ। बहालवालाले प्रत्येक रसिद सुरक्षित राख्नुपर्दछ।",
      en: "Signed by the landlord and given to the tenant. Keep every receipt — they are only useful as a series.",
    },
  ],
  steps: [
    {
      id: "details",
      title: { ne: "विवरण", en: "Details" },
      fields: [
        nameField("landlordName", { ne: "घरधनीको नाम", en: "Landlord's name" }),
        nameField("tenantName", { ne: "बहालवालाको नाम", en: "Tenant's name" }),
        addressField("propertyAddress", { ne: "सम्पत्तिको ठेगाना", en: "Address of the property" }),
        moneyField("amountNpr", { ne: "बुझेको रकम (रु.)", en: "Amount received (NPR)" }),
        {
          id: "periodCovered",
          type: "text",
          required: true,
          label: { ne: "कुन अवधिको बहाल", en: "Period covered" },
          placeholder: { ne: "जस्तै: भाद्र २०८३", en: "e.g. Bhadra 2083" },
        },
        bsDateField("receiptDateBs", { ne: "रसिद मिति (वि.सं.)", en: "Date of receipt (BS)" }),
        {
          id: "method",
          type: "select",
          required: true,
          label: { ne: "भुक्तानी माध्यम", en: "Paid by" },
          options: [
            { value: "cash", label: { ne: "नगद", en: "Cash" } },
            { value: "bank", label: { ne: "बैंक", en: "Bank transfer" } },
            { value: "wallet", label: { ne: "मोबाइल वालेट", en: "Mobile wallet" } },
          ],
        },
      ],
    },
  ],
  clauses: [
    {
      id: "receipt",
      heading: { ne: "रसिद", en: "Receipt" },
      locked: true,
      citation: LEASE,
      body: {
        ne: `मिति {{receiptDateBs}} मा {{tenantName}} बाट {{propertyAddress}} स्थित सम्पत्तिको {{periodCovered}} को बहाल बापत रु. {{amountNpr}} {{method}} मार्फत बुझी लिएको व्यहोरा प्रमाणित गर्दछु।`,
        en: `I acknowledge receiving NPR {{amountNpr}} from {{tenantName}} on {{receiptDateBs}} by {{method}}, being rent for {{periodCovered}} in respect of the property at {{propertyAddress}}.`,
      },
    },
    {
      id: "landlord",
      heading: { ne: "घरधनी", en: "Landlord" },
      locked: true,
      body: {
        ne: `{{landlordName}}`,
        en: `{{landlordName}}`,
      },
    },
  ],
};
