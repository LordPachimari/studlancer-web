// import Editor from "./Editor";
import { Spinner } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import GlobalLayout from "../../../../layouts/GlobalLayout";
import SidebarLayout from "../../../../layouts/SidebarLayout";
import WorkspaceLayout from "../../../../layouts/WorkspaceLayout";
import { NextPageWithLayout } from "../../../_app";
const Editor = dynamic(
  () => import("../../../../components/workspace/QuestEditor"),
  {
    ssr: false,
  }
);

// import QuestAttributes from "./questAttributes";

const WorkspaceQuest: NextPageWithLayout = () =>
  // { params }: { params: { id: string } }
  {
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

    return <Editor id={id} />;
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
