import DashboardPage from "./DashboardPage";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Dashboard",
  description: "Real-time summary of your system health and log activity.",
};

export default function Page() {
  return (
    <PageTransition>
      <DashboardPage />
    </PageTransition>
  );
}
