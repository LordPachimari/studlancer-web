import { Center, ScaleFade } from "@chakra-ui/react";
import { ReactElement, useState } from "react";
import { z } from "zod";
import GlobalLayout from "~/layouts/GlobalLayout";
import WelcomeLayout from "~/layouts/WelcomeLayout";
import Character from "./Character";
import Username from "./Username";

export default function CreateUser() {
  const [componentName, setComponentName] = useState<"USERNAME" | "CHARACTER">(
    "USERNAME"
  );

  return (
    <Center w="100%" minH="100vh" p="3">
      <ScaleFade initialScale={0.9} in={componentName === "USERNAME"}>
        <Username
          componentName={componentName}
          setComponentName={setComponentName}
        />
      </ScaleFade>
      {/* <ScaleFade initialScale={0.9} in={componentName === "CHARACTER"}>
        <Character />
      </ScaleFade> */}
    </Center>
  );
}
CreateUser.getLayout = function getLayout(page: ReactElement) {
  return <GlobalLayout>{page}</GlobalLayout>;
};
