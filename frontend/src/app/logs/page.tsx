import LogsPage from "./LogsPage";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Logs Explorer",
  description: "Advanced log exploration with multi-level filtering and search.",
};

export default function Page() {
  return (
    <PageTransition>
      <LogsPage />
    </PageTransition>
  );
}
