import {
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Spinner,
} from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
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
import { PublishedQuest } from "~/types/main";
import SearchQuest from "~/components/home/SearchQuest";

const GlobalChat = dynamic(
  () => import("../../components/home/GlobalChat/GlobalChat"),
  {
    loading: () => <LoadingChat />,
    ssr: false,
  }
);
const LoadingSpinner = () => {
  return (
    <Center w="100%" h="50vh">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="lg"
      />
    </Center>
  );
};

export default function Home() {
  const [quests, setQuests] = useState<PublishedQuest[] | null | undefined>(
    null
  );
  const serverQuests = trpc.quest.publishedQuests.useQuery({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectValue, setSelectValue] = useState<"latest" | "high reward">(
    "latest"
  );

  console.log(searchLoading);
  const emptyQuests: {}[] = [];
  for (let i = 0; i < 3; i++) {
    emptyQuests.push({});
  }
  useEffect(() => {
    if (serverQuests.data) {
      setQuests(serverQuests.data);
    }
  }, [serverQuests.data]);

  return (
    <Flex w="100%" justifyContent="center" mt={20} mb={20}>
      <Flex w="90%" justify="center" position="relative">
        <Flex w={{ base: "100%", lg: "50%" }} flexDirection="column" gap={3}>
          <Flex w="100%" flexDirection="row-reverse">
            <Select
              w="40"
              border="2px"
              borderColor="blue.200"
              value={selectValue}
              onChange={(e) =>
                setSelectValue(e.target.value as "latest" | "high reward")
              }
              bg="white"
            >
              <option value="latest">latest</option>
              {/* <option value="high reward">high reward</option> */}
            </Select>
          </Flex>
          <SearchQuest
            serverQuests={serverQuests.data}
            setQuests={setQuests}
            setSearchLoading={setSearchLoading}
          />
          {searchLoading ? (
            <LoadingSpinner />
          ) : serverQuests.isLoading ? (
            emptyQuests.map((q, i) => (
              <QuestComponentSkeleton key={i} includeContent={true} />
            ))
          ) : quests && quests.length > 0 ? (
            quests.map((quest) => (
              <QuestComponent
                key={quest.id}
                quest={quest}
                includeContent={true}
                includeDetails={true}
              />
            ))
          ) : (
            <Center w="100%" h="50vh">
              No quests...
            </Center>
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
