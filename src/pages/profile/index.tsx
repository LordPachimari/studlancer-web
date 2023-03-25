import { Box } from "@chakra-ui/react";
import { ReactElement } from "react";
import GlobalLayout from "~/layouts/GlobalLayout";
import SidebarLayout from "~/layouts/SidebarLayout";

export default function Profile() {
  return <Box></Box>;
}
Profile.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>{page}</SidebarLayout>
    </GlobalLayout>
  );
};
