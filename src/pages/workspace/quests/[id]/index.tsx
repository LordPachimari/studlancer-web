import styles from "../../workspace.module.css";
// import Editor from "./Editor";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import GlobalLayout from "../../../../layouts/GlobalLayout";
import SidebarLayout from "../../../../layouts/SidebarLayout";
import WorkspaceLayout from "../../../../layouts/WorkspaceLayout";
import { NextPageWithLayout } from "../../../_app";
import { Box, Card, Center, Flex, Spinner } from "@chakra-ui/react";
const Editor = dynamic(() => import("./QuestEditor"), {
  ssr: false,
});

// import QuestAttributes from "./questAttributes";

const WorkspaceQuest: NextPageWithLayout = () =>
  // { params }: { params: { id: string } }
  {
    const router = useRouter();
    // const id = router.query.id as string | undefined;
    const id = "quest1";

    if (!id) {
      return (
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      );
    }

    return (
      <Center mt={10}>
        <Card w="85%" bg="white" p={5}>
          <Editor id={id} />
        </Card>
      </Center>
    );
  };
WorkspaceQuest.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>
        <WorkspaceLayout>{page}</WorkspaceLayout>
      </SidebarLayout>
    </GlobalLayout>
  );
};

export default WorkspaceQuest;
