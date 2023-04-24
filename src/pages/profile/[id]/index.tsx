import {
  Box,
  Button,
  Card,
  Center,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react";
import { GetServerSidePropsContext } from "next";
import { ReactElement } from "react";
import GlobalLayout from "~/layouts/GlobalLayout";
import SidebarLayout from "~/layouts/SidebarLayout";
import AboutUser from "../../../components/profile/About";
import Achievements from "../../../components/profile/Achiements";
import UserQuests from "../../../components/profile/Quests";
import UserTopics from "../../../components/profile/Topics";
import { createContextInner } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { useRouter } from "next/router";
import { trpc } from "~/utils/api";
import { useAuth } from "@clerk/nextjs";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { getAuth } from "@clerk/nextjs/server";
export default function Profile() {
  const router = useRouter();
  const id = router.query.id as string;
  const user = trpc.user.userById.useQuery(
    { id },
    { staleTime: 10 * 60 * 1000 }
  );
  const { userId, isSignedIn } = useAuth();
  if (!user.data) {
    return <Box>No user found</Box>;
  }
  if (!user.data && id === userId) {
    return (
      <Center w="100%" h="100vh">
        <Button
          colorScheme="blue"
          onClick={() => void router.push("../create-user")}
        >
          Finish account creation
        </Button>
      </Center>
    );
  }
  return (
    <Flex w="100%" justify="center" mb={20}>
      <Box
        w="90%"
        maxW="7xl"
        display={{ base: "block", md: "flex" }}
        columnGap="16"
        mt={16}
      >
        <Flex
          flexDir="column"
          alignItems="center"
          w={{ base: "100%", md: "72" }}
          mb={10}
        >
          <Card height={{ base: "xs" }} w="72" borderRadius="2xl"></Card>
          <Center gap={10} mt={2}>
            <Text color="gray.500" fontWeight="bold">
              69 followers
            </Text>
            <Text color="gray.500" fontWeight="bold">
              69 following
            </Text>
          </Center>
          <Flex flexDirection="column">
            <Button
              colorScheme="blue"
              mt={5}
              w={{ base: "90%", md: "40" }}
              mx="auto"
            >
              Send message
            </Button>
            <Button
              colorScheme="blue"
              mt={5}
              w={{ base: "90%", md: "40" }}
              mx="auto"
            >
              Follow
            </Button>
          </Flex>
        </Flex>
        <Box w={{ base: "100%" }}>
          <AboutUser
            username={user.data.username}
            about={user.data.about}
            level={user.data.level}
            experience={user.data.experience}
            links={user.data.links}
          />
          <Heading as="h3" size="md" my={5}>
            Topics
          </Heading>
          <UserTopics />
          <Heading as="h3" size="md" my={5}>
            Achievements
          </Heading>
          <Achievements />
          <Heading as="h3" size="md" my={5}>
            Quests
          </Heading>
          <UserQuests />
        </Box>
      </Box>
    </Flex>
  );
}
Profile.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>{page}</SidebarLayout>
    </GlobalLayout>
  );
};
export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>
) {
  const auth = getAuth(context.req);
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: createContextInner({ auth }),
    transformer: superjson,
  });
  const id = context.params?.id as string;
  /*
   * Prefetching the `post.byId` query here.
   * `prefetch` does not return the result and never throws - if you need that behavior, use `fetch` instead.
   */
  await ssg.user.userById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}
