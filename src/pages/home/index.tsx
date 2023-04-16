import { Box, Flex } from "@chakra-ui/react";
import { ReactElement } from "react";
import QuestComponent, {
  QuestComponentSkeleton,
} from "~/components/QuestComponent";
import GlobalLayout from "~/layouts/GlobalLayout";
import SidebarLayout from "~/layouts/SidebarLayout";
import { trpc } from "~/utils/api";
import Leaderboard from "../../components/home/Leaderboard";
// import { GlobalChat } from "~/components/home/GlobalChat/GlobalChat";
import dynamic from "next/dynamic";
import { LoadingChat } from "../../components/home/GlobalChat/GlobalChat";

const GlobalChat = dynamic(
  () => import("../../components/home/GlobalChat/GlobalChat"),
  {
    loading: () => <LoadingChat />,
    ssr: false,
  }
);

export default function Home() {
  const quests = trpc.quest.publishedQuests.useQuery({});

  const emptyQuests: {}[] = [];
  for (let i = 0; i < 3; i++) {
    emptyQuests.push({});
  }

  return (
    <Flex w="100%" justifyContent="center" mt={20} mb={20}>
      <Flex w="90%" justify="center" position="relative">
        <Flex
          w={{ base: "100%", lg: "50%" }}
          h="200vh"
          flexDirection="column"
          gap={10}
        >
          {quests.isLoading ? (
            emptyQuests.map((q, i) => (
              <QuestComponentSkeleton key={i} includeContent={true} />
            ))
          ) : quests.data && quests.data.length > 0 ? (
            quests.data.map((quest) => (
              <QuestComponent
                key={quest.id}
                quest={quest}
                includeContent={true}
                includeDetails={true}
              />
            ))
          ) : (
            <div>No quests...</div>
          )}
        </Flex>
        <Flex
          position="sticky"
          top="0"
          w="80"
          h="100vh"
          display={{ base: "none", lg: "flex" }}
          flexDirection="column"
          gap={10}
          pl="10"
        >
          <Leaderboard />
          <GlobalChat />
        </Flex>

        <Box></Box>
      </Flex>
    </Flex>
  );
}
Home.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>{page}</SidebarLayout>
    </GlobalLayout>
  );
};
