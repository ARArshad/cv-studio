import {
  Crimson_Pro, DM_Sans, EB_Garamond, Inter, Lato, Libre_Baskerville, Lora, Manrope, Merriweather, Montserrat,
  Nunito, Open_Sans, Playfair_Display, Poppins, Raleway, Roboto, Source_Sans_3, Work_Sans,
} from "next/font/google";

/* Each font becomes a CSS variable on <html>. A browser only downloads the
   ones a CV actually uses. */
const inter = Inter({ subsets: ["latin"], variable: "--f-inter", display: "swap" });
const lato = Lato({ subsets: ["latin"], weight: ["300", "400", "700", "900"], style: ["normal", "italic"], variable: "--f-lato", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], variable: "--f-roboto", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--f-open-sans", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--f-source-sans", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--f-montserrat", display: "swap" });
const raleway = Raleway({ subsets: ["latin"], variable: "--f-raleway", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--f-poppins", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--f-nunito", display: "swap" });
const workSans = Work_Sans({ subsets: ["latin"], variable: "--f-work-sans", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--f-dm-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--f-manrope", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--f-merriweather", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--f-lora", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--f-playfair", display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: "--f-eb-garamond", display: "swap" });
const crimson = Crimson_Pro({ subsets: ["latin"], variable: "--f-crimson", display: "swap" });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--f-libre-baskerville", display: "swap" });

export const fontVariables = [
  inter, lato, roboto, openSans, sourceSans, montserrat, raleway, poppins, nunito, workSans, dmSans, manrope,
  merriweather, lora, playfair, ebGaramond, crimson, libreBaskerville,
].map((f) => f.variable).join(" ");
