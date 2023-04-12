import { ReactElement, useEffect, useRef, useState } from "react";
import GlobalLayout from "../../../layouts/GlobalLayout";
import SidebarLayout from "../../../layouts/SidebarLayout";
import {
  PublishedQuest,
  Solver,
  SolverPartial,
  SolutionStatus,
} from "../../../types/main";
import { useQueryClient } from "@tanstack/react-query";

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
import { getQueryKey } from "@trpc/react-query";
import { ulid } from "ulid";
import Link from "next/link";
import { buildClerkProps, getAuth } from "@clerk/nextjs/server";

export default function PublishedQuestPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { userId, isSignedIn } = useAuth();

  const quest = trpc.quest.publishedQuest.useQuery(
    { id },
    { staleTime: 10 * 60 * 1000 }
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isLeaveAlertOpen,
    onOpen: onLeaveAlertOpen,
    onClose: onLeaveAlertClose,
  } = useDisclosure();

  const solutionStatuses = [
    "POSTED SOLUTION",
    "REJECTED",
    "ACKOWLEDGED",
    "ACCEPTED",
  ] as const;

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
              Publisher
            </CardHeader>
            <CardBody>
              <Publisher publisherId={quest.data.quest.creatorId} />
            </CardBody>
          </Card>
          <Center>
            <Button colorScheme="blue">MESSAGE</Button>
          </Center>

          {quest.data.quest.winnerId && (
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
              <Winner winnerId={quest.data.quest.winnerId} />
            </Card>
          )}
        </Center>

        <Box w={{ base: "100%", md: "70%" }}>
          <QuestComponent quest={quest.data.quest} />
          {isCreator ? (
            <></>
          ) : (
            <Center my={5}>
              {quest.data.solvers.some((s) => s.id === userId) && userId && (
                <>
                  <Button
                    colorScheme="red"
                    onClick={onLeaveAlertOpen}
                    mr={5}
                    w={20}
                  >
                    LEAVE
                  </Button>
                  <LeaveAlert
                    isOpen={isLeaveAlertOpen}
                    onClose={onLeaveAlertClose}
                    questId={quest.data.quest.id}
                    solverId={userId}
                  />
                </>
              )}
              <Button
                colorScheme="green"
                onClick={onOpen}
                w={20}
                isDisabled={
                  !isSignedIn ||
                  quest.data.solvers.some((s) => s.id === userId) ||
                  quest.data.quest.slots === quest.data.quest.solverCount
                }
              >
                JOIN
              </Button>
              <JoinAlert
                isOpen={isOpen}
                isSolver={quest.data.solvers.some((s) => s.id === userId)}
                onClose={onClose}
                quest={quest.data.quest}
              />
            </Center>
          )}
          <Heading size="sm" my="5">
            Solution statuses
          </Heading>

          <Flex
            gap={3}
            wrap="wrap"
            mb={5}
            borderWidth="2px"
            borderColor="gray.200"
            padding="2"
            borderRadius="xl"
          >
            {solutionStatuses.map((status, i) => (
              <Flex key={i} gap={2}>
                <Circle
                  size="25px"
                  color="white"
                  bg={
                    status === "POSTED SOLUTION"
                      ? "yellow.200"
                      : status === "ACCEPTED"
                      ? "green.300"
                      : status === "ACKOWLEDGED"
                      ? "green.300"
                      : "red.400"
                  }
                >
                  {status === "ACCEPTED" && "V"}
                </Circle>
                <Text>{status}</Text>
              </Flex>
            ))}
          </Flex>
          <SolverComponent
            emptySlots={emptySlots}
            solversPartial={quest.data.solvers}
            creatorId={quest.data.quest.creatorId}
          />
        </Box>
      </Box>
    </Center>
  );
}
const LeaveAlert = ({
  isOpen,
  onClose,
  questId,
  solverId,
}: {
  isOpen: boolean;
  onClose: () => void;
  questId: string;
  solverId: string;
}) => {
  const cancelRef = useRef(null);

  const queryClient = useQueryClient();
  const questKey = getQueryKey(trpc.quest.publishedQuest);
  const leave = trpc.quest.removeSolver.useMutation();

  const toast = useToast();
  return (
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

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              isLoading={leave.isLoading}
              onClick={() => {
                leave.mutate(
                  { questId, solverId },
                  {
                    onSuccess: () => {
                      queryClient
                        .invalidateQueries({
                          queryKey: questKey,
                        })
                        .then(() => {
                          toast({
                            title: "Successfully leaved!",
                            description: "WHAT A QUITTER! (just kidding)",
                            status: "success",
                            duration: 5000,
                            isClosable: true,
                          });

                          onClose();
                        })
                        .catch((err) => console.log(err));
                    },
                    onError: () => {
                      toast({
                        title: "Failed to leave!",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                      });

                      onClose();
                    },
                  }
                );
              }}
              ml={3}
            >
              Leave
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
const JoinAlert = ({
  isOpen,
  onClose,
  quest,
  isSolver,
}: {
  isOpen: boolean;
  onClose: () => void;
  quest: PublishedQuest;
  isSolver: boolean;
}) => {
  const join = trpc.quest.addSolver.useMutation();
  const cancelRef = useRef(null);

  const queryClient = useQueryClient();

  const createSolution = trpc.solution.createSolution.useMutation();

  const questKey = getQueryKey(trpc.quest.publishedQuest);

  const toast = useToast();
  return (
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

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              isLoading={join.isLoading}
              onClick={() => {
                join.mutate(
                  { questId: quest.id },
                  {
                    onSuccess: () => {
                      createSolution.mutate({
                        id: ulid(),
                        questId: quest.id,
                        questCreatorId: quest.creatorId,
                      });
                      queryClient
                        .invalidateQueries({
                          queryKey: questKey,
                        })
                        .then(() => {
                          toast({
                            title: "Successfully joined!",
                            description: "Don't forget to post solution!",
                            status: "success",
                            duration: 5000,
                            isClosable: true,
                          });

                          onClose();
                        })
                        .catch((err) => console.log(err));
                    },
                    onError: () => {
                      toast({
                        title: "Failed to join!",
                        description: "Not allowed!",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                      });

                      onClose();
                    },
                  }
                );
              }}
              ml={3}
            >
              JOIN
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
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
      <Box w="36" height="48"></Box>
      <Text textAlign="center" fontWeight="bold">
        {publisher.data?.username.toUpperCase()}
      </Text>
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
  creatorId,
}: {
  solversPartial: SolverPartial[];
  emptySlots: {}[];
  creatorId: string;
}) => {
  const emptySkeletonSlots: {}[] = [];
  for (let i = 0; i < 5; i++) {
    emptySkeletonSlots.push({});
  }
  const { userId } = useAuth();

  const solvers = trpc.quest.solvers.useQuery(
    { solversPartial },
    { staleTime: 10 * 60 * 1000 }
  );

  return (
    <Flex wrap="wrap" gap={5}>
      {solvers.isLoading
        ? emptySkeletonSlots.map((s, i) => <SolverSkeleton key={i} />)
        : solvers.data &&
          solvers.data.map((s) => (
            <Flex key={s.id}>
              <_Solver
                solver={s}
                isAuthorised={userId === creatorId || userId === s.id}
              />
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
const _Solver = ({
  solver,
  isAuthorised,
}: {
  solver: Solver;
  isAuthorised: boolean;
}) => {
  return (
    <Box>
      <Flex gap={2}>
        <Link href={`/profile/${solver.id}`}>
          <Card
            w="44"
            h="14"
            display="flex"
            alignItems="center"
            flexDirection="row"
            gap={2}
            borderRadius="xl"
          >
            {/* <Circle size="40px" ml={2}></Circle> */}
            <Avatar
              ml={1}
              size="md"
              name={solver.username}
              // src="https://bit.ly/sage-adebayo"
            />
            <Flex flexDirection="column">
              <Badge colorScheme="blue" w="10">
                {solver.level} LVL
              </Badge>
              <Text
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {solver.username}
              </Text>
            </Flex>
          </Card>
        </Link>

        <Center alignItems="center" h="14">
          {solver.status ? (
            <Tooltip label={solver.status} placement="top">
              <Circle
                size="25px"
                bg={
                  solver.status === "ACCEPTED"
                    ? "green.300"
                    : solver.status === "ACKNOWLEDGED"
                    ? " green.300"
                    : solver.status === "REJECTED"
                    ? "red.300"
                    : "yellow.200"
                }
              >
                {solver.status === "ACCEPTED" && "V"}
              </Circle>
            </Tooltip>
          ) : (
            <Tooltip label="status" placement="top">
              <Circle
                size="25px"
                borderWidth="2px"
                borderColor="gray.300"
              ></Circle>
            </Tooltip>
          )}
        </Center>
      </Flex>
      {isAuthorised && solver.solutionId && (
        <Link href={`/solutions/${solver.solutionId}`}>
          <Button
            colorScheme="green"
            ml="7"
            size="sm"
            h="5"
            mt="2"
            textAlign="center"
          >
            View solution
          </Button>
        </Link>
      )}
    </Box>
  );
};
const EmptySlot = () => {
  return (
    <Flex gap={2}>
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

      <Center alignItems="center" h="14">
        <Tooltip label="status" placement="top">
          <Circle size="25px" borderWidth="2px" borderColor="gray.300"></Circle>
        </Tooltip>
      </Center>
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
      ...buildClerkProps(context.req),
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
