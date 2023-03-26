import { AppProps, type AppType } from "next/app";

import { trpc } from "~/utils/api";

import "~/styles/globals.css";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp: AppType = ({
  Component,
  pageProps: { ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ClerkProvider {...pageProps}>
      <ChakraProvider>{getLayout(<Component {...pageProps} />)}</ChakraProvider>
    </ClerkProvider>
  );
};

export default trpc.withTRPC(MyApp);
