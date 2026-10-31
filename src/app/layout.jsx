import { tools } from "@/lib/tools";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import Workspace from "@/components/workspace";
import "./globals.css";
export const metadata = {
  title: {
    default: "DevToolBox — Workspace developer",
    template: "%s | DevToolBox",
  },
  description: `${tools.length} alat developer praktis, privat, dan berjalan langsung di browser.`,
};
export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          <Workspace>{children}</Workspace>
        </AntdRegistry>
      </body>
    </html>
  );
}
