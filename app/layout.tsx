import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TraderHub • Fast Supplier & Deal Tracker',
  description: 'Clean, fast personal supplier & trading tracker for single business owners. Track deals, client receivables, vendor payables, and net profit.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var blocked = ['bis_skin_checked', 'bis_register', 'crxlauncher', 'crxlauncher-bridged'];
                  var origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, val) {
                    if (blocked.indexOf(name) !== -1 || name.indexOf('crxlauncher') === 0 || name.indexOf('__processed_') === 0) {
                      return;
                    }
                    return origSetAttr.apply(this, arguments);
                  };

                  var origConsoleError = console.error;
                  console.error = function() {
                    var str = arguments[0] ? String(arguments[0]) : '';
                    if (str.indexOf('hydration-mismatch') !== -1 && (str.indexOf('bis_skin_checked') !== -1 || str.indexOf('crxlauncher') !== -1 || str.indexOf('bis_register') !== -1)) {
                      return;
                    }
                    return origConsoleError.apply(console, arguments);
                  };
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body 
        className="bg-[#F4F5F9] text-slate-900 min-h-screen antialiased selection:bg-[#5345E6]/20 selection:text-[#5345E6]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
