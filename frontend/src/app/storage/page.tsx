import StoragePage from "./StoragePage";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Storage",
  description: "Browse and download historical log archives from S3.",
};

export default function Page() {
  return (
    <PageTransition>
      <StoragePage />
    </PageTransition>
  );
}
