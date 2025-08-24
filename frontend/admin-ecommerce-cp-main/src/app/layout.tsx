import type { Metadata } from "next";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import { Inter } from 'next/font/google';
import AntdWarningSuppress from '@/components/common/AntdWarningSuppress';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Dashboard - Ecommerce CP",
  description: "Admin dashboard for ecommerce customizable products",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
                colorBgContainer: '#ffffff',
              },
              algorithm: undefined, // We'll handle theme switching in dashboard layout
            }}
          >
            <App>
              <AntdWarningSuppress />
              {children}
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
