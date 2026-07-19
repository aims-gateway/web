import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "zh", "ja", "de", "fr"],
  defaultLocale: "en",
  localeDetection: true,
  localePrefix: "always",
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
