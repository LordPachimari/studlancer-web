import { Box, Center, Flex } from "@chakra-ui/react";
import { ReactElement } from "react";
import QuestComponent, {
  QuestComponentSkeleton,
} from "~/components/QuestComponent";
import GlobalLayout from "~/layouts/GlobalLayout";
import SidebarLayout from "~/layouts/SidebarLayout";
import { trpc } from "~/utils/api";
import GeneralChat from "../../components/home/Chat";
import Leaderboard from "../../components/home/Leaderboard";

export default function Home() {
  const quests = trpc.quest.publishedQuests.useQuery(
    {},
    {
      staleTime: 10 * 60 * 1000,
    }
  );
  const emptyQuests: {}[] = [];
  for (let i = 0; i < 3; i++) {
    emptyQuests.push({});
  }
  console.log("quests", quests.data);
  return (
    <Flex w="100%" justifyContent="center" mt={20}>
      <Flex w="90%" columnGap={15}>
        <Flex w={{ base: "100%", lg: "70%" }} flexDirection="column" gap={10}>
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
        <Center
          w={{ lg: "30%" }}
          display={{ base: "none", lg: "flex" }}
          flexDirection="column"
          justifyContent="center"
          gap={10}
        >
          <Leaderboard />
          <GeneralChat />
        </Center>

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
