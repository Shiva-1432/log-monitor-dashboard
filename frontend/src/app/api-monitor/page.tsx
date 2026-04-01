import ApiMonitorPage from "./ApiMonitorPage";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "API Monitor",
  description: "Real-time monitoring of simulated external API traffic.",
};

export default function Page() {
  return (
    <PageTransition>
      <ApiMonitorPage />
    </PageTransition>
  );
}
