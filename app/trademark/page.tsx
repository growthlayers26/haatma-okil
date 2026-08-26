import { FilingServicePage } from "@/components/filing-service";
import { trademarkFiling } from "@/lib/filings";

export default function TrademarkPage() {
  return <FilingServicePage service={trademarkFiling} />;
}
