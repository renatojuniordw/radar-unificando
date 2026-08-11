import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Box } from "@mui/material";
import { ThemeProvider } from "@/lib/infrastructure/ui/theme-provider";
import { AuthProvider } from "@/lib/infrastructure/ui/auth-provider";
import { SnackbarProvider } from "@/hooks/useSnackbar";
import { ChatAssistantProvider } from "@/contexts/chat-assistant-context";
import { ChatAssistantMount } from "@/components/chat/chat-mount";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Header, Footer } from "@/components/layout";
import { PwaRegister } from "@/components/ui/pwa-register";
import { CookieConsent } from "@/components/ui/cookie-consent";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import { StructuredData } from "@/components/seo/structured-data";
import { SITE, IMPACT } from "@/lib/core/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Radar Unificando — Buscador de Vagas Gupy + InHire em Tempo Real",
    template: "%s | Radar Unificando",
  },
  description:
    "Buscador e agregador de vagas em tempo real para as plataformas Gupy e InHire. Encontre vagas em Dados, BI, Produto, Vendas, RH e Tecnologia sem cadastro obrigatório.",
  keywords: [
    "vagas gupy",
    "vagas inhire",
    "radar de vagas",
    "vagas de dados",
    "vagas business intelligence",
    "agregador de vagas",
    "busca de empregos gupy",
    "vagas tecnologia brasil",
    "extensão chrome",
    "análise de vaga ats",
    "dicas de currículo",
    "score ats",
  ],
  authors: [{ name: "Radar Unificando" }],
  creator: "Radar Unificando",
  publisher: "Radar Unificando",
  alternates: {
    canonical: SITE.url,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE.url,
    siteName: "Radar Unificando",
    title: "Radar Unificando — Vagas Gupy e InHire Unificadas em Tempo Real",
    description:
      "Consulte vagas disponíveis em Gupy e InHire em tempo real com recomendação e análise por IA.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Radar Unificando - Buscador de Vagas Gupy + InHire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radar Unificando — Buscador de Vagas Gupy + InHire",
    description:
      "Encontre vagas de TI, Dados, Marketing e Vendas em Gupy e InHire em tempo real sem complicação.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { ConsoleEasterEgg } from "@/components/ui/console-easter-egg";

import { MobileFloatingBar } from "@/components/layout/mobile-floating-bar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <meta
          name="impact-site-verification"
          content={IMPACT.siteVerification}
          {...({ value: IMPACT.siteVerification } as Record<string, string>)}
        />
        <StructuredData />
      </head>
      <body
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <AuthProvider>
          <ThemeProvider>
            <SnackbarProvider>
              <ChatAssistantProvider>
                  {/* Skip link for keyboard navigation */}
                  <Box
                    component="a"
                    href="#main-content"
                    sx={{
                      position: "absolute",
                      top: -40,
                      left: 0,
                      zIndex: 9999,
                      p: 2,
                      bgcolor: "primary.main",
                      color: "common.white",
                      textDecoration: "none",
                      fontWeight: 700,
                      "&:focus": {
                        top: 0,
                      },
                    }}
                  >
                    Pular para conteúdo principal
                  </Box>

                  <ConsoleEasterEgg />
                  <Header />
                  <main id="main-content" style={{ flex: 1 }}>
                    {children}
                  </main>
                  <Footer />
                  <ErrorBoundary>
                    <ChatAssistantMount />
                  </ErrorBoundary>
                </ChatAssistantProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </AuthProvider>
        <MobileFloatingBar />
        <PwaRegister />
        <CookieConsent />
        <Script
          id="impact-tracking"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('${IMPACT.scriptUrl}','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`,
          }}
        />
      </body>
    </html>
  );
}
