import { ReactElement } from "react";
import Actions from "../../components/workspace/Actions";
import GlobalLayout from "../../layouts/GlobalLayout";
import SidebarLayout from "../../layouts/SidebarLayout";
import WorkspaceLayout from "../../layouts/WorkspaceLayout";
import { NextPageWithLayout } from "../_app";
import { Box } from "@chakra-ui/react";
const Workspace: NextPageWithLayout = () => {
  return (
    <Box>
      <Actions />
    </Box>
  );
};
Workspace.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>
        <WorkspaceLayout>{page}</WorkspaceLayout>
      </SidebarLayout>
    </GlobalLayout>
  );
};

export default Workspace;
