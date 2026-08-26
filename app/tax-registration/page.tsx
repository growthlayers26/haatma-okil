import { FilingServicePage } from "@/components/filing-service";
import { taxRegistrationFiling } from "@/lib/filings";

export default function TaxRegistrationPage() {
  return <FilingServicePage service={taxRegistrationFiling} />;
}
