import SettingsPage from "./SettingsPage";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Settings",
  description: "Configure system thresholds and dashboard preferences.",
};

export default function Page() {
  return (
    <PageTransition>
      <SettingsPage />
    </PageTransition>
  );
}
