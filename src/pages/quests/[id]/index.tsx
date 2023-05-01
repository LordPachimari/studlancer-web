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
  NonEditableQuestAttributes,
} from "~/components/workspace/Preview";
import { appRouter } from "~/server/api/root";
import { createContextInner } from "~/server/api/trpc";
import { trpc } from "~/utils/api";
import { getQueryKey } from "@trpc/react-query";
import { ulid } from "ulid";
import Link from "next/link";
import { buildClerkProps, getAuth } from "@clerk/nextjs/server";
import Image, { StaticImageData } from "next/image";
import { WorkspaceStore } from "~/zustand/workspace";
import { storeQuestOrSolution } from "~/components/workspace/Actions";

export default function PublishedQuestPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const { userId, isSignedIn } = useAuth();

  const quest = trpc.quest.publishedQuest.useQuery(
    { id },
    { staleTime: 10 * 60 * 1000 }
  );
  const solvers = trpc.quest.solvers.useQuery(
    { questId: id },
    { staleTime: 10 * 60 * 1000 }
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isLeaveAlertOpen,
    onOpen: onLeaveAlertOpen,
    onClose: onLeaveAlertClose,
  } = useDisclosure();
  const isSolver = !!solvers.data && solvers.data.some((s) => s.id === userId);

  const solutionStatuses = [
    "POSTED SOLUTION",
    "REJECTED",
    "ACKOWLEDGED",
    "ACCEPTED",
  ] as const;

  if (!quest.data) {
    return <div>No data</div>;
  }

  const isCreator = quest.data.creatorId === userId;
  const emptySlots: {}[] = [];
  for (let i = 0; i < quest.data.slots - quest.data.solverCount; i++) {
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
            <CardBody p="2">
              <Publisher publisherId={quest.data.creatorId} />
            </CardBody>
          </Card>
          <Center>
            <Button colorScheme="blue">MESSAGE</Button>
          </Center>

          {quest.data.winnerId && (
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
              <Winner winnerId={quest.data.winnerId} />
            </Card>
          )}
        </Center>

        <Box w={{ base: "100%", md: "70%" }}>
          <QuestComponent quest={quest.data} />
          {isCreator ? (
            <></>
          ) : (
            <Center my={5}>
              {isSolver && userId && (
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
                    questId={id}
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
                  isSolver ||
                  quest.data.slots === quest.data.solverCount
                }
              >
                JOIN
              </Button>
              {userId && (
                <JoinAlert
                  isOpen={isOpen}
                  isSolver={isSolver}
                  onClose={onClose}
                  quest={quest.data}
                  userId={userId}
                />
              )}
            </Center>
          )}
          <Heading textAlign="center" size="sm" my="5">
            Solution statuses
          </Heading>

          <Flex
            gap={3}
            wrap="wrap"
            mb={5}
            borderWidth="2px"
            borderColor="green.200"
            padding="2"
            borderRadius="xl"
            justifyContent="center"
          >
            {solutionStatuses.map((status, i) => (
              <Flex key={i} gap={2}>
                <Circle
                  size="25px"
                  color="white"
                  bg={
                    status === "POSTED SOLUTION"
                      ? "yellow.300"
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
            creatorId={quest.data.creatorId}
            questId={id}
            userId={userId}
            solvers={solvers.data}
            solversLoading={solvers.isLoading}
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

  const [isInvalidating, setIsInvalidating] = useState(false);
  const queryClient = useQueryClient();
  const questKey = getQueryKey(trpc.quest.publishedQuest);

  const solversKey = getQueryKey(trpc.quest.solvers);
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
            <Button
              ref={cancelRef}
              onClick={onClose}
              disabled={leave.isLoading || isInvalidating}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              isLoading={leave.isLoading || isInvalidating}
              onClick={() => {
                leave.mutate(
                  { questId, solverId },
                  {
                    onSuccess: () => {
                      setIsInvalidating(true);
                      queryClient
                        .invalidateQueries({
                          queryKey: [...questKey, ...solversKey],
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
                        .catch((err) => console.log(err))
                        .finally(() => setIsInvalidating(false));
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
  userId,
}: {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  quest: PublishedQuest;
  isSolver: boolean;
}) => {
  const userComponent = trpc.user.userComponent.useQuery({ id: userId });
  const join = trpc.quest.addSolver.useMutation();
  const cancelRef = useRef(null);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const queryClient = useQueryClient();
  const createQuestOrSolutionState = WorkspaceStore(
    (state) => state.createQuestOrSolution
  );

  const createSolution = trpc.solution.createSolution.useMutation();

  const questKey = getQueryKey(trpc.quest.publishedQuest);
  const solversKey = getQueryKey(trpc.quest.solvers);
  const listKey = getQueryKey(trpc.workspace.workspaceList);

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
            <Button
              ref={cancelRef}
              onClick={onClose}
              isDisabled={join.isLoading || isInvalidating}
            >
              Cancel
            </Button>
            <Button
              colorScheme="green"
              isLoading={join.isLoading || isInvalidating}
              onClick={() => {
                const createdAt = new Date().toISOString();
                const id = ulid();
                join.mutate(
                  { questId: quest.id, username: userId },

                  {
                    onSuccess: () => {
                      setIsInvalidating(true);
                      createSolution.mutate({
                        id,
                        questId: quest.id,
                        questCreatorId: quest.creatorId,
                        createdAt,
                      });

                      createQuestOrSolutionState({
                        id,
                        type: "SOLUTION",
                        userId,
                      });
                      storeQuestOrSolution({
                        id,
                        type: "SOLUTION",
                        userId,
                        createdAt,
                      });
                      Promise.all([
                        queryClient.invalidateQueries({
                          queryKey: questKey,
                        }),
                        queryClient.invalidateQueries({
                          queryKey: solversKey,
                        }),
                        queryClient.invalidateQueries({
                          queryKey: listKey,
                        }),
                      ])
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
                        .catch((err) => console.log(err))
                        .finally(() => setIsInvalidating(false));
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
  const publisher = trpc.user.userComponent.useQuery(
    { id: publisherId },
    { staleTime: 10 * 60 * 6000 }
  );
  let userImage: StaticImageData | undefined = undefined;
  if (publisher.data && publisher.data.profile) {
    userImage = JSON.parse(publisher.data.profile) as StaticImageData;
  }

  if (publisher.isLoading) {
    return (
      <>
        <Skeleton w="100%" height="40" />

        <SkeletonText mt="4" noOfLines={2} spacing="4" skeletonHeight="2" />
      </>
    );
  }
  if (publisher.data)
    return (
      <Link href={`/profile/${publisher.data.username}`}>
        <Center w="100%">
          {userImage && <Image src={userImage} alt="avatar" width={130} />}
        </Center>
        <Text textAlign="center" fontWeight="bold" mt="2">
          {publisher.data.username.toUpperCase()}
        </Text>
      </Link>
    );
  return (
    <>
      <Center w="100%"></Center>
      <Text textAlign="center" fontWeight="bold" mt="2"></Text>
    </>
  );
};
const Winner = ({ winnerId }: { winnerId: string }) => {
  const winner = trpc.user.userComponent.useQuery(
    { id: winnerId },
    { staleTime: 10 * 60 * 6000 }
  );
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
        {quest.content && <NonEditableContent content={quest.content} />}
      </CardBody>
    </Card>
  );
};
const SolverComponent = ({
  solvers,
  emptySlots,
  creatorId,
  questId,
  solversLoading,
  userId,
}: {
  solvers: Solver[] | undefined;
  solversLoading: boolean;
  emptySlots: {}[];
  creatorId: string;
  questId: string;
  userId: string | null | undefined;
}) => {
  const emptySkeletonSlots: {}[] = [];

  for (let i = 0; i < 5; i++) {
    emptySkeletonSlots.push({});
  }

  return (
    <Flex wrap="wrap" gap={5}>
      {solversLoading
        ? emptySkeletonSlots.map((s, i) => <SolverSkeleton key={i} />)
        : solvers &&
          solvers.map((s) => (
            <Flex key={s.id}>
              <_Solver
                solver={s}
                isAuthorised={userId === creatorId || userId === s.id}
                questId={questId}
              />
            </Flex>
          ))}

      {!solversLoading && emptySlots.map((s, i) => <EmptySlot key={i} />)}
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
  questId,
}: {
  solver: Solver;
  isAuthorised: boolean;
  questId: string;
}) => {
  let userImage: StaticImageData | undefined = undefined;
  if (solver.profile) {
    userImage = JSON.parse(solver.profile) as StaticImageData;
  }
  return (
    <Box>
      <Flex gap={2}>
        <Link href={`/profile/${solver.id}`}>
          <Card
            w="36"
            h="14"
            display="flex"
            alignItems="center"
            flexDirection="row"
            gap={2}
            borderRadius="xl"
          >
            {/* <Circle size="40px" ml={2}></Circle> */}

            {userImage ? (
              <div className="circular-image-container">
                <Image
                  src={userImage}
                  alt="avatar"
                  className="circular-image"
                  width={50}
                />
              </div>
            ) : (
              <Avatar name={solver.username} size="sm" />
            )}
            <Flex
              flexDirection="column"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              <Badge colorScheme="blue" w="10">
                {solver.level} LVL
              </Badge>
              <Text
                fontSize="sm"
                fontWeight="bold"
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
        <Link href={`/solutions/${solver.solutionId}?quest=${questId}`}>
          <Button colorScheme="green" size="sm" h="5" textAlign="center">
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
        w="28"
        h="14"
        borderWidth="2px"
        borderColor="blue.200"
        borderRadius="xl"
        bg="cyan.100"
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
            fill="var(--blue)"
          />
        </svg>
      </Center>

      <Center alignItems="center" h="14">
        <Tooltip label="status" placement="top">
          <Circle size="25px" borderWidth="2px" borderColor="blue.200"></Circle>
        </Tooltip>
      </Center>
    </Flex>
  );
};
export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>
) {
  const auth = getAuth(context.req);
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: createContextInner({ auth }),
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
