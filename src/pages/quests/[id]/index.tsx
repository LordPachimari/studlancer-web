import { ReactElement, useRef } from "react";
import GlobalLayout from "../../../layouts/GlobalLayout";
import SidebarLayout from "../../../layouts/SidebarLayout";
import { PublishedQuest, SolverPartial } from "../../../types/main";
import { useQueryClient } from "@tanstack/react-query";

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Circle,
  Flex,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "@clerk/nextjs";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import superjson from "superjson";
import {
  NonEditableContent,
  NonEditableQuestAttributes,
} from "~/components/workspace/Preview";
import { appRouter } from "~/server/api/root";
import { createContextInner } from "~/server/api/trpc";
import { trpc } from "~/utils/api";

export default function PublishedQuestPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { userId, isSignedIn } = useAuth();

  const quest = trpc.quest.publishedQuest.useQuery(
    { id },
    { staleTime: 10 * 60 * 1000 }
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const createSolution = trpc.solution.createSolution.useMutation();
  const cancelRef = useRef(null);
  const toast = useToast();
  const solutionStatuses = [
    "POSTED",
    "REJECTED",
    "ACKOWLEDGED",
    "ACCEPTED",
  ] as const;

  const join = trpc.quest.addSolver.useMutation();
  const queryClient = useQueryClient();

  if (!quest.data || !quest.data.quest) {
    return <div>No data</div>;
  }

  const isCreator = quest.data.quest.creatorId === userId;
  const emptySlots: {}[] = [];
  for (
    let i = 0;
    i < quest.data.quest.slots - quest.data.quest.solverCount;
    i++
  ) {
    emptySlots.push({});
  }

  return (
    <Center w="100%" flexDirection={{ base: "column", md: "row" }} mb={20}>
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
              Publisher
            </CardHeader>
            <CardBody>
              <Publisher publisherId={quest.data.quest.creatorId} />
            </CardBody>
          </Card>
          <Center>
            <Button colorScheme="blue">MESSAGE</Button>
          </Center>

          <Card w="100%" height={{ base: "xs" }} maxW="72" borderRadius="2xl">
            <CardHeader
              display="flex"
              justifyContent="center"
              fontSize="xl"
              fontWeight="bold"
              p={2}
            >
              Winner
            </CardHeader>
            {quest.data.quest.winnerId && (
              <Winner winnerId={quest.data.quest.winnerId} />
            )}
          </Card>
        </Center>

        <Box w={{ base: "100%", md: "70%" }}>
          <QuestComponent quest={quest.data.quest} />
          {!isCreator ? (
            <></>
          ) : (
            <Center my={5}>
              <Button
                colorScheme="green"
                onClick={onOpen}
                isDisabled={!isSignedIn}
              >
                JOIN!
              </Button>

              <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
              >
                <AlertDialogOverlay>
                  <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                      Confirm your action
                    </AlertDialogHeader>

                    <AlertDialogBody>By confirming you ...</AlertDialogBody>

                    <AlertDialogFooter>
                      <Button ref={cancelRef} onClick={onClose}>
                        Cancel
                      </Button>
                      <Button
                        colorScheme="green"
                        isLoading={join.isLoading}
                        onClick={() => {
                          join.mutate(
                            { questId: id },
                            {
                              onSuccess: () => {
                                createSolution.mutate({
                                  id,
                                  questId: quest.data.quest?.id,
                                  questCreatorId: quest.data.quest?.creatorId,
                                });
                                onClose();
                                queryClient.invalidateQueries({
                                  queryKey: ["solvers"],
                                }).catch(err=>console.log(err));
                                toast({
                                  title: "Successfully joined!",
                                  description: "Don't forget to post solution!",
                                  status: "success",
                                  duration: 5000,
                                  isClosable: true,
                                });
                              },
                              onError: () => {
                                onClose();
                                toast({
                                  title: "Failed to join!",
                                  description: "Not allowed!",
                                  status: "error",
                                  duration: 5000,
                                  isClosable: true,
                                });
                              },
                            }
                          );
                        }}
                        ml={3}
                      >
                        JOIN!
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialogOverlay>
              </AlertDialog>
            </Center>
          )}

          <Flex gap={3} wrap="wrap" my={5}>
            {solutionStatuses.map((status, i) => (
              <Flex key={i} gap={2}>
                <Circle
                  size="25px"
                  bg={
                    status === "POSTED"
                      ? "yellow.200"
                      : status === "ACCEPTED"
                      ? "green.300"
                      : status === "ACKOWLEDGED"
                      ? "green.300"
                      : "red.400"
                  }
                ></Circle>
                <Text>{status}</Text>
              </Flex>
            ))}
          </Flex>
          <SolverComponent
            emptySlots={emptySlots}
            solversPartial={quest.data.solvers}
          />
        </Box>
      </Box>
    </Center>
  );
}
const Publisher = ({ publisherId }: { publisherId: string }) => {
  const publisher = trpc.user.userById.useQuery(
    { id: publisherId },
    { staleTime: 10 * 60 * 1000 }
  );
  if (publisher.isLoading) {
    return (
      <>
        <Skeleton w="100%" height="40" />

        <SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" />
      </>
    );
  }
  return (
    <>
      <Box w="36" height="md"></Box>
      <Text>{publisher.data?.username}</Text>
    </>
  );
};
const Winner = ({ winnerId }: { winnerId: string }) => {
  const winner = trpc.user.userById.useQuery({ id: winnerId });
  if (winner.isLoading) {
    return (
      <>
        <Skeleton w="100%" height="40" />

        <SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" />
      </>
    );
  }
  return (
    <>
      <Box w="36" height="md"></Box>
      <Text>{winner.data?.username}</Text>
    </>
  );
};
const QuestComponent = ({ quest }: { quest: PublishedQuest }) => {
  return (
    <Card borderRadius="2xl">
      <CardHeader>
        <NonEditableQuestAttributes quest={quest} />
      </CardHeader>
      <CardBody>
        <NonEditableContent content={quest.content} />
      </CardBody>
    </Card>
  );
};
const SolverComponent = ({
  solversPartial,
  emptySlots,
}: {
  solversPartial: SolverPartial[];
  emptySlots: {}[];
}) => {
  const emptySkeletonSlots: {}[] = [];
  for (let i = 0; i < 5; i++) {
    emptySkeletonSlots.push({});
  }

  const solvers = trpc.quest.solvers.useQuery(
    { solversPartial },
    { staleTime: 10 * 60 * 1000 }
  );
  console.log("solvers", solvers.data);

  return (
    <Flex wrap="wrap" gap={5}>
      {solvers.isLoading
        ? emptySkeletonSlots.map((s, i) => <SolverSkeleton key={i} />)
        : solvers.data &&
          solvers.data.map((s) => (
            <Flex key={s.id}>
              <Solver level={s.level} username={s.username} />
            </Flex>
          ))}

      {!solvers.isLoading && emptySlots.map((s, i) => <EmptySlot key={i} />)}
    </Flex>
  );
};
const SolverSkeleton = () => {
  return (
    <Flex alignItems="center" gap={2}>
      <Card
        w="44"
        h="14"
        display="flex"
        alignItems="center"
        flexDirection="row"
        gap={2}
        borderRadius="xl"
      >
        <SkeletonCircle size="40px" ml={2}></SkeletonCircle>
        <Flex flexDirection="column" gap={3}>
          <Skeleton w="28" h="2" />
          <Skeleton w="20" h="2" />
        </Flex>
      </Card>
      <Circle size="25px" borderWidth="2px" borderColor="gray.300"></Circle>
    </Flex>
  );
};
const Solver = ({ level, username }: { level: number; username: string }) => {
  return (
    <Flex alignItems="center" gap={2}>
      <Card
        w="44"
        h="14"
        display="flex"
        alignItems="center"
        flexDirection="row"
        gap={2}
        borderRadius="xl"
      >
        <Circle size="40px" ml={2}></Circle>
        <Flex flexDirection="column" gap={3}>
          <Badge>level</Badge>
          <Text>{username}</Text>
        </Flex>
      </Card>
      <Circle size="25px" borderWidth="2px" borderColor="gray.300"></Circle>
    </Flex>
  );
};
const EmptySlot = () => {
  return (
    <Flex alignItems="center" gap={2}>
      <Center
        w="44"
        h="14"
        borderWidth="2px"
        borderColor="gray.300"
        borderRadius="xl"
        bg="gray.200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M14 14.252v2.09A6 6 0 0 0 6 22l-2-.001a8 8 0 0 1 10-7.748zM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm6 6v-3h2v3h3v2h-3v3h-2v-3h-3v-2h3z"
            fill="var(--gray)"
          />
        </svg>
      </Center>
      <Circle size="25px" borderWidth="2px" borderColor="gray.300"></Circle>
    </Flex>
  );
};
export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>
) {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: createContextInner({ user: null }),
    transformer: superjson,
  });
  const id = context.params?.id as string;
  /*
   * Prefetching the `post.byId` query here.
   * `prefetch` does not return the result and never throws - if you need that behavior, use `fetch` instead.
   */
  await ssg.quest.publishedQuest.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}

PublishedQuestPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>{page}</SidebarLayout>
    </GlobalLayout>
  );
};
