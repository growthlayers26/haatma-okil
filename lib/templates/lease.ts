import type { Template } from "../types";
import { LEASE, CONTRACT } from "../nepal";

/**
 * Residential lease under the Muluki Civil Code, 2074 (Chapter on lease, §583 onward).
 *
 * Rent receipts and a written agreement are what a tenant needs to establish
 * possession in a dispute, which is why this is the highest-volume consumer document.
 */
export const residentialLease: Template = {
  slug: "residential-lease",
  category: "property",
  priceNpr: 399,
  title: { ne: "घरबहाल सम्झौता", en: "Residential Lease Agreement" },
  summary: {
    ne: "मुलुकी देवानी संहिता, २०७४ बमोजिम घर वा कोठा बहालमा दिने लिखित सम्झौता। बहाल रकम, धरौटी, र अवधि समावेश।",
    en: "Written residential tenancy agreement under the Muluki Civil Code, 2074. Covers rent, deposit, term, and the grounds for ending the tenancy.",
  },
  governingAct: LEASE,
  review: {
    name: { ne: "अधिवक्ता नियुक्ति बाँकी", en: "Advocate not yet assigned" },
    nbcLicence: null,
    reviewedOnBs: "2083-05-10",
    nextReviewBs: "2084-05-10",
  },
  execution: [
    {
      ne: "दुवै पक्ष र दुई जना साक्षीको हस्ताक्षर आवश्यक पर्दछ।",
      en: "Signatures of both parties and two witnesses are required.",
    },
    {
      ne: "बहाल आय सम्बन्धी कर दायित्वका लागि स्थानीय तहमा दर्ता गर्नुपर्ने हुन सक्दछ।",
      en: "Registration with the local ward may be required for rental income tax purposes.",
    },
    {
      ne: "लामो अवधिको बहाल सम्झौताका लागि मालपोत कार्यालयमा दर्ता गर्नुपर्ने हुन सक्दछ। अधिवक्तासँग परामर्श गर्नुहोस्।",
      en: "Long-term leases may require registration at the Land Revenue Office. Confirm with an advocate before relying on this document alone.",
    },
  ],

  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        { id: "landlordName", type: "text", required: true, label: { ne: "घरधनीको नाम", en: "Landlord name" } },
        { id: "landlordCitizenshipNo", type: "text", required: true, label: { ne: "घरधनीको नागरिकता नं.", en: "Landlord citizenship no." } },
        { id: "landlordAddress", type: "textarea", required: true, label: { ne: "घरधनीको ठेगाना", en: "Landlord address" } },
        { id: "tenantName", type: "text", required: true, label: { ne: "बहालवालाको नाम", en: "Tenant name" } },
        { id: "tenantCitizenshipNo", type: "text", required: true, label: { ne: "बहालवालाको नागरिकता नं.", en: "Tenant citizenship no." } },
        { id: "tenantAddress", type: "textarea", required: true, label: { ne: "बहालवालाको स्थायी ठेगाना", en: "Tenant permanent address" } },
      ],
    },
    {
      id: "property",
      title: { ne: "सम्पत्तिको विवरण", en: "The property" },
      intro: {
        ne: "विवाद परेको खण्डमा सम्पत्ति पहिचान गर्न सकिने गरी विवरण खुलाउनुहोस्।",
        en: "Describe the property precisely enough to identify it in a dispute.",
      },
      fields: [
        { id: "propertyAddress", type: "textarea", required: true, label: { ne: "सम्पत्तिको ठेगाना", en: "Property address" } },
        { id: "wardNo", type: "text", required: true, label: { ne: "वडा नं.", en: "Ward number" } },
        {
          id: "propertyType",
          type: "select",
          required: true,
          label: { ne: "प्रकार", en: "Property type" },
          options: [
            { value: "flat", label: { ne: "फ्ल्याट", en: "Flat" } },
            { value: "room", label: { ne: "कोठा", en: "Room" } },
            { value: "house", label: { ne: "पूरै घर", en: "Whole house" } },
            { value: "shutter", label: { ne: "पसल/सटर", en: "Shop / shutter" } },
          ],
        },
        { id: "roomCount", type: "number", label: { ne: "कोठा संख्या", en: "Number of rooms" } },
      ],
    },
    {
      id: "terms",
      title: { ne: "बहाल तथा अवधि", en: "Rent and term" },
      fields: [
        { id: "monthlyRentNpr", type: "currency", required: true, label: { ne: "मासिक बहाल (रु.)", en: "Monthly rent (NPR)" } },
        {
          id: "depositNpr",
          type: "currency",
          required: true,
          label: { ne: "धरौटी रकम (रु.)", en: "Security deposit (NPR)" },
          help: {
            ne: "धरौटी फिर्ता गर्ने सर्त सम्झौतामा स्पष्ट खुलाउनु विवाद रोक्ने सबैभन्दा प्रभावकारी उपाय हो।",
            en: "Stating the conditions for returning the deposit is the single most effective way to prevent a dispute at the end of the tenancy.",
          },
        },
        { id: "rentDueDay", type: "number", required: true, label: { ne: "बहाल बुझाउने गते", en: "Rent due day of month" } },
        { id: "startDateBs", type: "date-bs", required: true, label: { ne: "प्रारम्भ मिति (वि.सं.)", en: "Start date (BS)" }, placeholder: { ne: "२०८३-०६-०१", en: "2083-06-01" } },
        { id: "termMonths", type: "number", required: true, label: { ne: "अवधि (महिना)", en: "Term (months)" } },
        {
          id: "utilitiesIncluded",
          type: "select",
          required: true,
          label: { ne: "बिजुली/पानी बहालमा समावेश?", en: "Are utilities included in rent?" },
          options: [
            { value: "no", label: { ne: "समावेश छैन, छुट्टै तिर्ने", en: "Not included, paid separately" } },
            { value: "yes", label: { ne: "समावेश छ", en: "Included" } },
          ],
        },
      ],
    },
    {
      id: "notice",
      title: { ne: "सम्झौता अन्त्य", en: "Ending the tenancy" },
      fields: [
        { id: "noticeDays", type: "number", required: true, label: { ne: "सूचना अवधि (दिन)", en: "Notice period (days)" } },
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
        ne: `यो घरबहाल सम्झौता {{landlordName}} (नागरिकता नं. {{landlordCitizenshipNo}}), ठेगाना {{landlordAddress}} (यसपछि "घरधनी" भनिने) र {{tenantName}} (नागरिकता नं. {{tenantCitizenshipNo}}), स्थायी ठेगाना {{tenantAddress}} (यसपछि "बहालवाला" भनिने) बीच मुलुकी देवानी संहिता, २०७४ बमोजिम सम्पन्न भएको छ।`,
        en: `This Residential Lease Agreement is made between {{landlordName}} (citizenship no. {{landlordCitizenshipNo}}), of {{landlordAddress}} (the "Landlord") and {{tenantName}} (citizenship no. {{tenantCitizenshipNo}}), permanently of {{tenantAddress}} (the "Tenant"), pursuant to the Muluki Civil Code, 2074.`,
      },
    },
    {
      id: "premises",
      heading: { ne: "बहालमा दिइएको सम्पत्ति", en: "The demised premises" },
      body: {
        ne: `घरधनीले {{propertyAddress}}, वडा नं. {{wardNo}} मा अवस्थित {{propertyType}} बहालवालालाई बसोबासका लागि बहालमा दिन मञ्जुर गरेको छ।`,
        en: `The Landlord agrees to let to the Tenant the {{propertyType}} situated at {{propertyAddress}}, Ward No. {{wardNo}}, for residential occupation.`,
      },
    },
    {
      id: "rent",
      heading: { ne: "बहाल रकम", en: "Rent" },
      citation: LEASE,
      body: {
        ne: `बहालवालाले प्रत्येक नेपाली महिनाको {{rentDueDay}} गतेभित्र मासिक रु. {{monthlyRentNpr}} बहाल घरधनीलाई बुझाउनेछ। घरधनीले प्रत्येक भुक्तानीको लिखित रसिद दिनुपर्नेछ।`,
        en: `The Tenant shall pay monthly rent of NPR {{monthlyRentNpr}} to the Landlord on or before day {{rentDueDay}} of each Nepali month. The Landlord shall issue a written receipt for every payment.`,
      },
    },
    {
      id: "deposit",
      heading: { ne: "धरौटी", en: "Security deposit" },
      body: {
        ne: `बहालवालाले रु. {{depositNpr}} धरौटीबापत घरधनीलाई बुझाएको छ। सम्झौता अन्त्य भई सम्पत्ति फिर्ता गरेपछि, सामान्य टुटफुट बाहेकको क्षति र बाँकी बहाल कट्टा गरी बाँकी रकम बहालवालालाई फिर्ता गरिनेछ।`,
        en: `The Tenant has paid NPR {{depositNpr}} to the Landlord as a security deposit. On termination and vacant possession being given, the balance shall be refunded to the Tenant after deducting arrears of rent and the cost of damage beyond fair wear and tear.`,
      },
    },
    {
      id: "term",
      heading: { ne: "अवधि", en: "Term" },
      body: {
        ne: `यो सम्झौता {{startDateBs}} देखि लागू भई {{termMonths}} महिनासम्म कायम रहनेछ। दुवै पक्षको लिखित सहमतिमा नवीकरण गर्न सकिनेछ।`,
        en: `This agreement takes effect on {{startDateBs}} and continues for {{termMonths}} months. It may be renewed by written agreement of both parties.`,
      },
    },
    {
      id: "utilities-separate",
      heading: { ne: "बिजुली, पानी तथा अन्य महसुल", en: "Utilities and charges" },
      when: { field: "utilitiesIncluded", op: "eq", value: "no" },
      body: {
        ne: `बिजुली, खानेपानी, फोहोर व्यवस्थापन तथा इन्टरनेटको महसुल बहालवालाले छुट्टै व्यहोर्नेछ र समयमै भुक्तानी गर्नेछ।`,
        en: `Charges for electricity, water, waste management and internet are payable separately by the Tenant, who shall settle them when due.`,
      },
    },
    {
      id: "utilities-included",
      heading: { ne: "बिजुली, पानी तथा अन्य महसुल", en: "Utilities and charges" },
      when: { field: "utilitiesIncluded", op: "eq", value: "yes" },
      body: {
        ne: `बिजुली र खानेपानीको महसुल मासिक बहाल रकममा समावेश छ।`,
        en: `Charges for electricity and water are included in the monthly rent.`,
      },
    },
    {
      id: "tenant-obligations",
      heading: { ne: "बहालवालाको दायित्व", en: "Tenant's obligations" },
      body: {
        ne: `बहालवालाले सम्पत्तिको सामान्य हेरचाह गर्नेछ, घरधनीको लिखित स्वीकृतिबिना संरचनात्मक परिवर्तन वा उप-बहालमा दिने छैन, र छिमेकीलाई असुविधा नहुने गरी प्रयोग गर्नेछ।`,
        en: `The Tenant shall take reasonable care of the premises, shall not make structural alterations or sublet without the Landlord's written consent, and shall not use the premises so as to cause nuisance to neighbours.`,
      },
    },
    {
      id: "landlord-obligations",
      heading: { ne: "घरधनीको दायित्व", en: "Landlord's obligations" },
      body: {
        ne: `घरधनीले बहालवालालाई शान्तिपूर्ण भोगचलनको अधिकार दिनेछ र संरचनात्मक मर्मतसम्भारको जिम्मेवारी लिनेछ। आपतकालीन अवस्था बाहेक प्रवेश गर्नुअघि उचित सूचना दिनुपर्नेछ।`,
        en: `The Landlord shall give the Tenant quiet enjoyment of the premises and remains responsible for structural repairs. Save in an emergency, the Landlord shall give reasonable notice before entering.`,
      },
    },
    {
      id: "termination",
      heading: { ne: "सम्झौता अन्त्य", en: "Termination" },
      body: {
        ne: `कुनै पनि पक्षले {{noticeDays}} दिनको लिखित सूचना दिई यो सम्झौता अन्त्य गर्न सक्नेछ। लगातार दुई महिना बहाल नबुझाएमा घरधनीले प्रचलित कानुनी प्रक्रिया अपनाई सम्झौता अन्त्य गर्न सक्नेछ।`,
        en: `Either party may terminate this agreement on {{noticeDays}} days' written notice. Where rent remains unpaid for two consecutive months the Landlord may terminate, following the process required by prevailing law.`,
      },
    },
    {
      id: "governing",
      heading: { ne: "प्रचलित कानुन", en: "Governing law" },
      locked: true,
      citation: CONTRACT,
      body: {
        ne: `यो सम्झौता नेपालको मुलुकी देवानी संहिता, २०७४ द्वारा निर्देशित हुनेछ। विवाद उत्पन्न भएमा सम्पत्ति रहेको क्षेत्रको अधिकारप्राप्त अदालतको क्षेत्राधिकार रहनेछ।`,
        en: `This agreement is governed by the Muluki Civil Code, 2074 of Nepal. Any dispute falls within the jurisdiction of the competent court for the district in which the property is situated.`,
      },
    },
  ],
};
