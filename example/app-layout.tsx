import { NextDevKit } from "@internetfriends/next-aria-devkit";
import "@internetfriends/next-aria-devkit/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <NextDevKit bridgeUrl="/api/next-devkit" />
      </body>
    </html>
  );
}
