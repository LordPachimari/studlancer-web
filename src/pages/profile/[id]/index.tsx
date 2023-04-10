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
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { createContextInner } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import { useRouter } from "next/router";
import { trpc } from "~/utils/api";

export default function Profile() {
  const router = useRouter();
  const id = router.query.id as string;
  const user = trpc.user.userById.useQuery({ id });
  if (!user.data) {
    return <div></div>;
  }
  return (
    <Flex w="100%" justify="center" mb={20}>
      <Box
        w="90%"
        display={{ base: "block", md: "flex" }}
        columnGap={15}
        mt={16}
      >
        <Box w={{ base: "100%", md: "30%" }} mb={10}>
          <Card w="100%" height={{ base: "xs" }} borderRadius="2xl"></Card>
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
        </Box>
        <Box w={{ base: "100%", md: "70%" }}>
          <AboutUser
            username={user.data.username}
            about={user.data.about}
            level={user.data.level}
            experience={user.data.experience}
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
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createContextInner({ user: null }),
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
