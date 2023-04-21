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
const LoadingSpinner = () => {
  return (
    <Center w="100%" h="90vh">
      <Spinner colorScheme="blue" />
    </Center>
  );
};

export default function Home() {
  const quests = trpc.quest.publishedQuests.useQuery({});

  const emptyQuests: {}[] = [];
  for (let i = 0; i < 3; i++) {
    emptyQuests.push({});
  }

  return (
    <Flex w="100%" justifyContent="center" mt={20} mb={20}>
      <Flex w="90%" justify="center" position="relative">
        <Flex w={{ base: "100%", lg: "50%" }} flexDirection="column" gap={3}>
          <InputGroup size="md" w="100%">
            <Input
              bg="white"
              borderRadius="2xl"
              placeholder="Search for quests..."
            />

            <InputRightElement>
              <IconButton
                aria-label="search quests"
                justifyContent="flex-start"
                pl="2"
                borderRadius={0}
                borderRightRadius="2xl"
                bg="none"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path fill="none" d="M0 0h24v24H0z" />
                    <path
                      d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15zm-3.847-8.699a2 2 0 1 0 2.646 2.646 4 4 0 1 1-2.646-2.646z"
                      fill="var(--blue)"
                    />
                  </svg>
                }
                w="100%"
                color="gray.500"
              />
            </InputRightElement>
          </InputGroup>
          <Flex w="100%" flexDirection="row-reverse">
            <Select
              w="40"
              border="2px"
              borderColor="blue.200"
              value="latest"
              bg="white"
            >
              <option value="latest">latest</option>
              <option value="high reward">high reward</option>
            </Select>
          </Flex>
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
            <Center w="100%" h="90vh">
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
