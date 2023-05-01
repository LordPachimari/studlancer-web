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
import { ReactElement, useEffect, useRef, useState } from "react";
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
import SearchQuestInput from "~/components/home/SearchQuest";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "~/server/api/root";
import { useInView } from "framer-motion";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";

const GlobalChat = dynamic(
  () => import("../../components/home/GlobalChat/GlobalChat"),
  {
    loading: () => <LoadingChat />,
    ssr: false,
  }
);
export const LoadingQuests = () => {
  return (
    <Center w="100%" h="50vh">
      <LoadingSpinner />
    </Center>
  );
};

export default function Home() {
  const [pages, setPages] = useState<
    inferProcedureOutput<AppRouter["quest"]["publishedQuests"]>[] | undefined
  >(undefined);
  const ref = useRef(null);
  const queryClient = useQueryClient();
  const questsKey = getQueryKey(trpc.quest.publishedQuests);

  const [showChat, setShowChat] = useState(false);
  const isInView = useInView(ref);
  const serverQuests = trpc.quest.publishedQuests.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => {
        if (lastPage) {
          return lastPage.next_cursor;
        }
      },
      staleTime: 10 * 60 * 1000,
    }
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectValue, setSelectValue] = useState<"latest" | "high reward">(
    "latest"
  );

  const emptyQuests: {}[] = [];
  for (let i = 0; i < 3; i++) {
    emptyQuests.push({});
  }
  useEffect(() => {
    if (isInView) {
      serverQuests.fetchNextPage().catch((err) => console.log(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);
  useEffect(() => {
    if (serverQuests.data) {
      setPages(serverQuests.data.pages);
    }
  }, [serverQuests.data]);

  return (
    <Flex
      w="100%"
      justifyContent="center"
      mt={20}
      mb={20}
      position="sticky"
      top="0"
    >
      <Flex w="90%" justify="center">
        <Flex w={{ base: "100%", lg: "50%" }} flexDirection="column" gap={3}>
          <Flex w="100%" flexDirection="row-reverse">
            {showChat ? (
              <GlobalChat setShowChat={setShowChat} />
            ) : (
              <Button
                aria-label="show chat"
                colorScheme="blue"
                size="md"
                position="fixed"
                bottom="8"
                right={{ base: "10", md: "20", lg: "52" }}
                zIndex={5}
                onClick={() => setShowChat(true)}
                rightIcon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path
                      d="M4.92893 19.0711C3.11929 17.2614 2 14.7614 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22H2L4.92893 19.0711ZM11 6V18H13V6H11ZM7 9V15H9V9H7ZM15 9V15H17V9H15Z"
                      fill="rgba(255,255,255,1)"
                    ></path>
                  </svg>
                }
              >
                Global Chat
              </Button>
            )}

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

          <SearchQuestInput
            initialPages={
              serverQuests.data ? serverQuests.data.pages : undefined
            }
            setPages={setPages}
            setSearchLoading={setSearchLoading}
          />
          <Flex flexDir="row-reverse">
            <IconButton
              aria-label="refresh"
              size="md"
              w="10"
              bg="white"
              borderWidth="1px"
              borderColor="blue.200"
              onClick={() => {
                queryClient
                  .invalidateQueries(questsKey)
                  .catch((err) => console.log(err));
              }}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    d="M5.46257 4.43262C7.21556 2.91688 9.5007 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C9.84982 4 7.89777 4.84827 6.46023 6.22842L5.46257 4.43262ZM18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 9.86386 2.66979 7.88416 3.8108 6.25944L7 12H4C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z"
                    fill="var(--blue)"
                  ></path>
                </svg>
              }
            />
          </Flex>
          {searchLoading ? (
            <LoadingQuests />
          ) : serverQuests.isLoading || serverQuests.isFetching ? (
            emptyQuests.map((q, i) => (
              <QuestComponentSkeleton key={i} includeContent={true} />
            ))
          ) : pages && pages.length > 0 ? (
            pages.map((p, i) => (
              <Flex flexDir="column" gap={3} key={i}>
                {p &&
                  p.publishedQuests &&
                  p.publishedQuests.length > 0 &&
                  p.publishedQuests.map((quest) => (
                    <QuestComponent
                      key={quest.id}
                      quest={quest}
                      includeContent={true}
                      includeDetails={true}
                    />
                  ))}
              </Flex>
            ))
          ) : (
            <Center w="100%" h="50vh">
              No quests...
            </Center>
          )}
          <Center>
            <Box ref={ref}></Box>
            {serverQuests.isFetchingNextPage && <LoadingSpinner />}
          </Center>
        </Flex>
        <Flex
          w="80"
          h="100vh"
          position="sticky"
          top="20"
          display={{ base: "none", lg: "flex" }}
          flexDirection="column"
          gap={10}
          pl="10"
        >
          <Leaderboard />
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
