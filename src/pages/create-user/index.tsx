import { Card, CardHeader, Center, ScaleFade } from "@chakra-ui/react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ReactElement, useState } from "react";
import GlobalLayout from "~/layouts/GlobalLayout";
import Username from "../../components/create-user/Username";
import { GetServerSidePropsContext } from "next";
import { buildClerkProps, getAuth } from "@clerk/nextjs/server";

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
export function getServerSideProps(context: GetServerSidePropsContext) {
  /*
   * Prefetching the `post.byId` query here.
   * `prefetch` does not return the result and never throws - if you need that behavior, use `fetch` instead.
   */

  return {
    props: {
      ...buildClerkProps(context.req),
    },
  };
}
