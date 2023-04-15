import { Box, Center, Flex } from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import QuestComponent, {
  QuestComponentSkeleton,
} from "~/components/QuestComponent";
import GlobalLayout from "~/layouts/GlobalLayout";
import SidebarLayout from "~/layouts/SidebarLayout";
import { trpc } from "~/utils/api";
import Leaderboard from "../../components/home/Leaderboard";
// import { GlobalChat } from "~/components/home/GlobalChat/GlobalChat";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";

const GlobalChat = dynamic(
  () => import("../../components/home/GlobalChat/GlobalChat"),
  {
    loading: () => <p>Loading...</p>,
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
      <Flex w="90%" justify="center">
        <Flex w={{ base: "100%", lg: "50%" }} flexDirection="column" gap={10}>
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
          w="80"
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
