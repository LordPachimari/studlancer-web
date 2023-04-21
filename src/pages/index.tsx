import { SignUp, useAuth } from "@clerk/nextjs";
import { buildClerkProps, clerkClient, getAuth } from "@clerk/nextjs/server";
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
import { createServerSideHelpers } from "@trpc/react-query/server";

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
        <CardHeader
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
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
// export async function getServerSideProps(
//   context: GetServerSidePropsContext<{ id: string }>
// ) {
//   const auth = getAuth(context.req);

//   if (auth.userId) {
//     const ssg = createServerSideHelpers({
//       router: appRouter,
//       ctx: createContextInner({ auth }),
//       transformer: superjson,
//     });
//     auth.userId && (await ssg.user.userById.prefetch({ id: auth.userId }));

//     return {
//       props: {
//         ...buildClerkProps(context.req),
//         trpcState: ssg.dehydrate(),
//       },
//     };
//   }

//   return {
//     props: {
//       ...buildClerkProps(context.req),
//     },
//   };
// }
export default SignUpPage;
