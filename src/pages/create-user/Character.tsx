import { Card, CardHeader, Heading } from "@chakra-ui/react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useState } from "react";

const Character = () => {
  // const {userId} = useAuth()
  const router = useRouter();
  const array = [{}, {}, {}, {}, {}, {}];
  //   const handleFinish = () => {
  //     router.push(`/profile/${userId}`);
  //   };
  //   const handleSkip = () => {
  //     router.push(`/profile/${userId}`);
  //   };

  return (
    <Card w="2xl">
      <CardHeader display="flex" justifyContent="center">
        <Heading size={{ base: "md" }}>Build your character</Heading>
      </CardHeader>
    </Card>
  );
};
export default Character;
