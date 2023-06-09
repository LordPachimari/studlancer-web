import { SignUp, useAuth } from "@clerk/nextjs";
import { buildClerkProps, clerkClient, getAuth } from "@clerk/nextjs/server";
import { GetServerSidePropsContext } from "next";
import { ReactElement, useEffect } from "react";
import { appRouter } from "~/server/api/root";
import { createContextInner } from "~/server/api/trpc";
import GlobalLayout from "../layouts/GlobalLayout";
import WelcomeLayout from "../layouts/WelcomeLayout";
import { NextPageWithLayout } from "./_app";

import superjson from "superjson";
import {
  Badge,
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
import Link from "next/link";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import Image, { StaticImageData } from "next/image";

const SignUpPage: NextPageWithLayout = () => {
  const { userId, isSignedIn, isLoaded } = useAuth();

  const router = useRouter();
  useEffect(() => {
    if (isSignedIn && userId) {
      router.push("/home").catch((err) => console.log(err));
    }
  }, [isSignedIn, router, userId]);
  if (!isLoaded) {
    return (
      <Card w="80" h="md" borderRadius="2xl">
        <Center w="100%" h="100%">
          <LoadingSpinner />
        </Center>
      </Card>
    );
  }
  // if (isSignedIn) {
  //   return (
  //     <Link href={`/profile/${userId}`}>
  //       <Card w="80" h="md" borderRadius="2xl">
  //         <CardHeader
  //           whiteSpace="nowrap"
  //           overflow="hidden"
  //           textOverflow="ellipsis"
  //         >
  //           <Heading display="center" justifyContent="center">
  //             {user.data.username.toUpperCase()}
  //           </Heading>
  //           <Center>
  //             <Badge
  //               mr="1"
  //               variant="solid"
  //               colorScheme="blue"
  //               fontSize="15"
  //               w="12"
  //             >
  //               {user.data.level} lvl
  //             </Badge>
  //           </Center>
  //           <CardBody p="1">
  //             <Center w="100%" h="80">
  //               {profileImage ? (
  //                 <Image src={profileImage} alt="Character" width={170} />
  //               ) : (
  //                 <></>
  //               )}
  //             </Center>
  //           </CardBody>
  //         </CardHeader>
  //       </Card>
  //     </Link>
  //   );
  // }

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
