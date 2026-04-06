import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { ThemeProvider } from "@/hooks/useTheme";
import ToastContainer from "@/components/ui/ToastContainer";
import ShaderBackground from "@/components/ShaderBackground";

export const metadata = {
  title: "AttendanceIQ — Enterprise Attendance Management",
  description:
    "A modern, production-grade attendance management system for teams and enterprises.",
  keywords: ["attendance", "HR", "employee management", "leave management"],
  authors: [{ name: "AttendanceIQ" }],
  themeColor: "#0F172A",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// Inline script injected before any paint to avoid a flash of wrong theme.
// Reads localStorage and applies 'dark' or 'light' class to <html> synchronously.
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    var cls = t === 'light' ? 'light' : 'dark';
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(cls);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* ── Anti-FOUC: sets theme class before first paint ── */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ShaderBackground />
              {children}
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
