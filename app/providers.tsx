"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Config, WagmiProvider } from "wagmi";
import { defaultConfig, XellarKitProvider, darkTheme } from "@xellar/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lisk } from "wagmi/chains";
export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;
const xellarAppId = process.env.NEXT_PUBLIC_XELLAR_APP_ID!;
const queryClient = new QueryClient();

const config = defaultConfig({
  appName: "Test",
  walletConnectProjectId,
  xellarAppId,
  xellarEnv: "production",
  chains: [lisk],
}) as Config;

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <WagmiProvider config={config}>
        <NextThemesProvider {...themeProps}>
          <QueryClientProvider client={queryClient}>
            <XellarKitProvider theme={darkTheme}>{children}</XellarKitProvider>
          </QueryClientProvider>
        </NextThemesProvider>
      </WagmiProvider>
    </HeroUIProvider>
  );
}
