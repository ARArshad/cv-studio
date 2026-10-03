import {
  EB_Garamond, Inter, Lato, Lora, Merriweather, Montserrat, Open_Sans,
  Playfair_Display, Raleway, Roboto, Source_Sans_3,
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
const merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--f-merriweather", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--f-lora", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--f-playfair", display: "swap" });
const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: "--f-eb-garamond", display: "swap" });

export const fontVariables = [
  inter, lato, roboto, openSans, sourceSans, montserrat, raleway, merriweather, lora, playfair, ebGaramond,
].map((f) => f.variable).join(" ");
