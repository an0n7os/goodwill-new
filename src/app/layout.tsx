import type { Metadata } from "next";
import {siteUrl,testSite} from "@/lib/site";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const jakarta=localFont({src:'../assets/fonts/plus-jakarta-sans.woff2',variable:'--font-jakarta',weight:'200 800',display:'swap'});
const instrumentSerif=localFont({src:[{path:'../assets/fonts/instrument-serif-regular.woff2',weight:'400',style:'normal'},{path:'../assets/fonts/instrument-serif-italic.woff2',weight:'400',style:'italic'}],variable:'--font-serif-display',display:'swap',adjustFontFallback:'Times New Roman'});
const jetbrainsMono=localFont({src:'../assets/fonts/jetbrains-mono.woff2',variable:'--font-mono',weight:'100 800',display:'swap'});

export const metadata: Metadata = {
  metadataBase:new URL(siteUrl()),
  robots:testSite()?{index:false,follow:false}:undefined,
  title: "Goodwill Electrical World | Electrical, Plumbing & Sanitary Wares",
  description: "A unique shop with a large collection of Electrical, Plumbing, Sanitary Wares & Bath Fittings in Kulappully, Shoranur, Kerala. Get direct company prices and maximum discounts.",
  keywords: ["electrical shop Kulappully", "plumbing shop Shoranur", "sanitary ware Palakkad", "Jaquar dealer Shoranur", "Supreme pipes Kerala"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/goodwill-icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/brand/goodwill-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

// Removes attributes injected by browser extensions until the page has finished hydrating
const STRIP_EXTENSION_ATTRS = `(function(){
  var re=/^(bis_|__processed_)/;
  function clean(el){
    if(!el||!el.attributes)return;
    for(var i=el.attributes.length-1;i>=0;i--){var n=el.attributes[i].name;if(re.test(n))el.removeAttribute(n);}
  }
  var mo=new MutationObserver(function(list){
    for(var i=0;i<list.length;i++){
      var m=list[i];
      if(m.type==="attributes"&&re.test(m.attributeName||""))clean(m.target);
      else if(m.type==="childList")for(var j=0;j<m.addedNodes.length;j++){var node=m.addedNodes[j];clean(node);if(node.querySelectorAll)node.querySelectorAll("*").forEach(clean);}
    }
  });
  function sweep(){document.querySelectorAll("*").forEach(clean);}
  mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true});
  sweep();
  document.addEventListener("DOMContentLoaded",sweep);
  window.addEventListener("load",function(){setTimeout(function(){mo.disconnect();},3000);});
})();`;

import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
        <FloatingWhatsApp />
        {/* Dev only: some browser extensions (e.g. Bitdefender's bis_* attributes) write into the DOM
            before React hydrates, which floods the console with hydration mismatch errors. */}
        {process.env.NODE_ENV !== "production" && (
          <Script id="strip-extension-attrs" strategy="beforeInteractive">
            {STRIP_EXTENSION_ATTRS}
          </Script>
        )}
      </body>
    </html>
  );
}
