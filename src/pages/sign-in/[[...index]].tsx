import { SignIn } from "@clerk/nextjs";
import { ReactElement } from "react";
import GlobalLayout from "../../layouts/GlobalLayout";
import WelcomeLayout from "../../layouts/WelcomeLayout";
import { NextPageWithLayout } from "../_app";

const SignInPage: NextPageWithLayout = () => {
  return <SignIn path="/sign-in" routing="path" signUpUrl="/" />;
};
SignInPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <WelcomeLayout>{page}</WelcomeLayout>
    </GlobalLayout>
  );
};

export default SignInPage;
