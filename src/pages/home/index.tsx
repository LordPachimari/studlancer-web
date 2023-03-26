import { Box, Center, Flex } from "@chakra-ui/react";
import { ReactElement } from "react";
import QuestComponent, {
  QuestComponentSkeleton,
} from "~/components/QuestComponent";
import GlobalLayout from "~/layouts/GlobalLayout";
import SidebarLayout from "~/layouts/SidebarLayout";
import GeneralChat from "./Chat";
import Leaderboard from "./Leaderboard";

export default function Home() {
  return (
    <Flex w="100%" justifyContent="center">
      <Flex w="90%" columnGap={15} mt={16}>
        <Flex w={{ base: "100%", lg: "70%" }} flexDirection="column" gap={10}>
          <QuestComponent />
          <QuestComponentSkeleton />
        </Flex>
        <Box
          w={{ lg: "30%" }}
          display={{ base: "none", lg: "flex" }}
          flexDirection="column"
          justifyContent="center"
          gap={10}
        >
          <Leaderboard />
          <GeneralChat />
        </Box>

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
