import { ScreeningForm } from "@/components/screening/forms/ScreeningForm";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("Landing");

  return (
    <div className="min-h-screen bg-slate-50 pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="space-y-4 text-center lg:text-left">
          <h1 className="text-4xl font-extrabold text-slate-900">
            {t("title")}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        <ScreeningForm />
      </div>
    </div>
  );
}