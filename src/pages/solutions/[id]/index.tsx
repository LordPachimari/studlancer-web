import { ReactElement, useEffect, useRef, useState } from "react";
import GlobalLayout from "../../../layouts/GlobalLayout";
import SidebarLayout from "../../../layouts/SidebarLayout";
import {
  Solver,
  SolverPartial,
  SolutionStatus,
  PublishedSolution,
} from "../../../types/main";
import { useQueryClient } from "@tanstack/react-query";
import { createServerSideHelpers } from "@trpc/react-query/server";

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Circle,
  Flex,
  Heading,
  Highlight,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "@clerk/nextjs";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import superjson from "superjson";
import {
  NonEditableContent,
  NonEditableSolutionAttributes,
} from "~/components/workspace/Preview";
import { appRouter } from "~/server/api/root";
import { createContextInner } from "~/server/api/trpc";
import { trpc } from "~/utils/api";
import { getQueryKey } from "@trpc/react-query";
import { ulid } from "ulid";
import Link from "next/link";
import { buildClerkProps, getAuth } from "@clerk/nextjs/server";

export default function PublishedSolutionPage() {
  const router = useRouter();
  const { quest, id } = router.query as {
    quest: string | undefined;
    id: string | undefined;
  };
  const { userId, isSignedIn } = useAuth();

  const solution = trpc.solution.publishedSolution.useQuery(
    { id: id || "", questId: quest || "" },
    { staleTime: 10 * 60 * 1000, enabled: !!id && !!quest }
  );

  if (!solution.data) {
    return <div>No data</div>;
  }

  const isCreator = solution.data.creatorId === userId;

  return (
    <Center
      w="100%"
      flexDirection={{ base: "column", md: "row" }}
      mb={20}
      mt={5}
    >
      <Box
        w="90%"
        display={{ base: "block", md: "flex" }}
        columnGap={10}
        flexDirection="row-reverse"
        mt={16}
      >
        <Center
          flexDirection="column"
          w={{ base: "100%", md: "30%" }}
          height="fit-content"
          mb={10}
          gap={5}
        >
          <Card w="100%" height={{ base: "xs" }} maxW="72" borderRadius="2xl">
            <CardHeader
              display="flex"
              justifyContent="center"
              fontSize="xl"
              fontWeight="bold"
              p={2}
            >
              Solver
            </CardHeader>
            <CardBody>
              <_Solver solverId={solution.data.creatorId} />
            </CardBody>
          </Card>
          <Center>
            <Button colorScheme="blue">MESSAGE</Button>
          </Center>
        </Center>

        <Box w={{ base: "100%", md: "70%" }}>
          <SolutionComponent solution={solution.data} />
          <Center columnGap={5} mt={10}>
            <Button colorScheme="red" w="32 ">
              REJECT
            </Button>

            <Button colorScheme="green" w="32   ">
              ACKNOWLEDGE
            </Button>

            <Button colorScheme="green" w="32   ">
              ACCEPT
            </Button>
          </Center>
        </Box>
      </Box>
    </Center>
  );
}

const _Solver = ({ solverId }: { solverId: string }) => {
  const solver = trpc.user.userById.useQuery(
    { id: solverId },
    { staleTime: 10 * 60 * 1000 }
  );
  if (solver.isLoading) {
    return (
      <>
        <Skeleton w="100%" height="40" />

        <SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" />
      </>
    );
  }
  return (
    <>
      <Box w="36" height="48"></Box>
      <Text textAlign="center" fontWeight="bold">
        {solver.data?.username.toUpperCase()}
      </Text>
    </>
  );
};

const SolutionComponent = ({ solution }: { solution: PublishedSolution }) => {
  return (
    <Card borderRadius="2xl">
      <CardHeader>
        <NonEditableSolutionAttributes solution={solution} />
      </CardHeader>
      <CardBody>
        {solution.content && <NonEditableContent content={solution.content} />}
      </CardBody>
    </Card>
  );
};

PublishedSolutionPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>{page}</SidebarLayout>
    </GlobalLayout>
  );
};
