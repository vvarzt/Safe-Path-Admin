import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common";
import th from "./locales/th/common";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en as any },
    th: { translation: th as any },
  },
  lng: "th",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
