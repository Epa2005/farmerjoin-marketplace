import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import rw from "./locales/rw/translation.json";
import sw from "./locales/sw/translation.json";

i18n.use(initReactI18next).init({
  resources: {
    rw: { translation: rw },
    sw: { translation: sw }
  },
  lng: "rw", // default language = Kinyarwanda
  fallbackLng: "rw",
  interpolation: { escapeValue: false }
});

export default i18n;
