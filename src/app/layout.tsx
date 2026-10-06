import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goodwill Electrical World | Electrical, Plumbing & Sanitary Wares",
  description: "A unique shop with a large collection of Electrical, Plumbing, Sanitary Wares & Bath Fittings in Kulappully, Shoranur, Kerala. Get direct company prices and maximum discounts.",
  keywords: ["electrical shop Kulappully", "plumbing shop Shoranur", "sanitary ware Palakkad", "Jaquar dealer Shoranur", "Supreme pipes Kerala"],
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
