import { SignUp, useAuth } from "@clerk/nextjs";
import { buildClerkProps, clerkClient, getAuth } from "@clerk/nextjs/server";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetServerSidePropsContext } from "next";
import { ReactElement } from "react";
import { appRouter } from "~/server/api/root";
import { createContextInner } from "~/server/api/trpc";
import GlobalLayout from "../layouts/GlobalLayout";
import WelcomeLayout from "../layouts/WelcomeLayout";
import { NextPageWithLayout } from "./_app";

import superjson from "superjson";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Heading,
} from "@chakra-ui/react";
import { trpc } from "~/utils/api";
import { useRouter } from "next/router";

const SignUpPage: NextPageWithLayout = () => {
  const { userId, isSignedIn } = useAuth();
  const user = trpc.user.userById.useQuery(
    { id: userId! },
    { enabled: !!userId, staleTime: 1800 }
  );
  const router = useRouter();
  if (isSignedIn && user.data) {
    return (
      <Card w="80" h="md" borderRadius="2xl">
        <CardHeader>
          <Heading display="center" justifyContent="center">
            {user.data.username.toUpperCase()}
          </Heading>
        </CardHeader>
      </Card>
    );
  }
  if (isSignedIn && !user.data) {
    return (
      <Card w="80" h="md" borderRadius="2xl">
        <Center w="100%" h="100%">
          <Button
            colorScheme="blue"
            onClick={() => void router.push("/create-user")}
          >
            Finish account creation
          </Button>
        </Center>
      </Card>
    );
  }
  return <SignUp signInUrl="/sign-in" />;
};
SignUpPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <WelcomeLayout>{page}</WelcomeLayout>
    </GlobalLayout>
  );
};
export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>
) {
  const { userId } = getAuth(context.req);
  const user = userId ? await clerkClient.users.getUser(userId) : undefined;

  if (userId) {
    const ssg = createProxySSGHelpers({
      router: appRouter,
      ctx: createContextInner({ user }),
      transformer: superjson,
    });
    userId && (await ssg.user.userById.prefetch({ id: userId }));

    return {
      props: {
        ...buildClerkProps(context.req),
        trpcState: ssg.dehydrate(),
      },
    };
  }

  return {
    props: {
      ...buildClerkProps(context.req),
    },
  };
}

export default SignUpPage;
