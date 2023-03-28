import { Box, Card, CardHeader, Center, ScaleFade } from "@chakra-ui/react";
import { useAuth } from "@clerk/nextjs";
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
  const { isSignedIn, userId } = useAuth();

  return (
    <Center w="100%" minH="100vh" p="3">
      <ScaleFade initialScale={0.9} in={componentName === "USERNAME"}>
        {isSignedIn ? (
          <Username
            componentName={componentName}
            setComponentName={setComponentName}
            userId={userId}
          />
        ) : (
          <Card>
            <CardHeader>Please authenticate.</CardHeader>
          </Card>
        )}
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
