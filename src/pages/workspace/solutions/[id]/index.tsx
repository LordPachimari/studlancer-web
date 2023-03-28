import { Box, Card, Center, Spinner } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import { QuestComponentSkeleton } from "~/components/QuestComponent";
import GlobalLayout from "../../../../layouts/GlobalLayout";
import SidebarLayout from "../../../../layouts/SidebarLayout";
import WorkspaceLayout from "../../../../layouts/WorkspaceLayout";
const Editor = dynamic(
  () => import("../../../../components/workspace/SolutionEditor"),
  {
    ssr: false,
  }
);

// import QuestAttributes from "./questAttributes";

export default function WorkspaceSolution() {
  // { params }: { params: { id: string } }
  const router = useRouter();
  const id = router.query.id as string | undefined;

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
}
WorkspaceSolution.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>
        <WorkspaceLayout>{page}</WorkspaceLayout>
      </SidebarLayout>
    </GlobalLayout>
  );
};

const TargetQuest = () => {
  const exist = false;
  const isLoading = true;
  if (!exist) {
    return <Box></Box>;
  }
  return (
    <Box>
      {isLoading ? <QuestComponentSkeleton includeContent={false} /> : <></>}
    </Box>
  );
};
