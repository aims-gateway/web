import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/navigation";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="bg-grid" style={{ minHeight: "100vh" }}>
        <NextIntlClientProvider messages={messages}>
          <TopNav />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
