import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "Vela";
const THEME_SCRIPT = `(function(){try{var r=localStorage.getItem("vela-v1");var t="dark";if(r){var p=JSON.parse(r);t=(p.state&&p.state.settings&&p.state.settings.theme)||"dark";}if(t==="system")t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";var l="es";if(r){var q=JSON.parse(r);l=(q.state&&q.state.settings&&q.state.settings.locale)||l;}document.documentElement.classList.add(t==="light"?"light":"dark");document.documentElement.lang=l==="en"?"en":"es";}catch(e){document.documentElement.classList.add("dark");}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "description", content: "Vela — a clear mind with its own pulse." },
      { name: "theme-color", content: "#0c0d0f" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Toaster
          theme="system"
          position="bottom-right"
          toastOptions={{
            className: "font-sans !bg-popover !text-foreground !border-border",
          }}
        />
        <Scripts />
      </body>
    </html>
  ),
});
