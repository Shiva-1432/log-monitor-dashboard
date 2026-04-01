import AlertsPage from "./AlertsPage";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Alerts",
  description: "Monitor and manage system-wide critical alert events.",
};

export default function Page() {
  return (
    <PageTransition>
      <AlertsPage />
    </PageTransition>
  );
}
