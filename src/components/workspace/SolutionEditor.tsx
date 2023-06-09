import { get, set } from "idb-keyval";
import {
  ChangeEvent,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { update } from "idb-keyval";
import {
  PublishedSolution,
  Solution,
  TransactionQueue,
  UpdateTransaction,
  Versions,
} from "../../types/main";

import Publish from "./Publish";

import debounce from "lodash.debounce";
// import TiptapEditor from "../../TiptapEditor";
import SolutionAttributes, {
  SolutionAttributesSkeleton,
} from "./SolutionAttributes";

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Card,
  Center,
  Flex,
  FormControl,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SkeletonText,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import produce from "immer";
import { useRouter } from "next/router";
import { trpc } from "~/utils/api";
import { mapReplacer } from "~/utils/mapReplacer";
import { WorkspaceStore } from "~/zustand/workspace";
import QuestComponent, { QuestComponentSkeleton } from "../QuestComponent";
import { NonEditableContent } from "./Preview";
import TiptapEditor from "./TiptapEditor";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "~/server/api/root";
import SearchQuestInput from "../home/SearchQuest";
import { LoadingSpinner } from "../LoadingSpinner";
import Toast from "../Toast";

const SolutionEditor = ({ id }: { id: string }) => {
  const [solution, setSolution] = useState<Solution | null | undefined>(
    undefined
  );
  const router = useRouter();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAlertOpen,
    onOpen: onAlertOpen,
    onClose: onAlertClose,
  } = useDisclosure();

  const queryClient = useQueryClient();
  const solutionVersion = JSON.parse(
    localStorage.getItem(id) as string
  ) as Versions | null;
  const shouldUpdate =
    !solutionVersion ||
    new Date(solutionVersion.local) < new Date(solutionVersion.server);
  const unpublish = trpc.solution.unpublishSolution.useMutation();
  const serverSolution = trpc.solution.workspaceSolution.useQuery(
    { id },
    {
      staleTime: 10 * 60 * 6000,
      enabled: shouldUpdate,
    }
  );
  const workspaceSolutionKey = getQueryKey(trpc.solution.workspaceSolution);
  const solversKey = getQueryKey(trpc.quest.solvers);
  const removeTargetQuest = trpc.solution.removeTargetQuest.useMutation({
    retry: 3,
  });
  const updateSolutionAttributes =
    trpc.solution.updateSolutionAttributes.useMutation({
      retry: 3,
    });
  const quest = trpc.quest.publishedQuest.useQuery(
    { id: (!!solution && solution.questId) || "" },
    {
      enabled: !!solution && !!solution.questId,

      staleTime: 10 * 60 * 6000,
    }
  );

  const addTransaction = WorkspaceStore((state) => state.addTransaction);
  const clearTransactionQueue = WorkspaceStore(
    (state) => state.clearTransactionQueue
  );
  const cancelRef = useRef(null);
  const handleUnpublish = () => {
    if (solution) {
      unpublish.mutate(
        {
          id,
          questId: (solution as Solution & { questId: string }).questId,
        },
        {
          onSuccess: () => {
            update<PublishedSolution | undefined>(id, (solution) => {
              if (solution) {
                solution.published = false;
                return solution;
              }
            }).catch((err) => console.log(err));
            setSolution(
              produce((solution) => {
                if (solution) {
                  solution.published = false;
                }
              })
            );
            Promise.all([
              queryClient.invalidateQueries({
                queryKey: workspaceSolutionKey,
              }),
              queryClient.invalidateQueries({
                queryKey: solversKey,
              }),
            ])

              .then(() => {
                toast({
                  title: "Solution Unpublished.",
                  status: "success",
                  duration: 5000,
                  isClosable: true,
                });

                onAlertClose();
              })
              .catch((err) => {
                console.log("error invalidating");
              });
          },
        }
      );
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateSolutionAttributesHandler = useCallback(
    debounce(
      ({
        transactionQueue,
        //last transaction needs to be pushed into transactionQueue,
        //as the last addTransaction function is executed in parallel with updateQuestAttributeHandler,
        //and cannot be captured inside of updateQuestAttributeHandler function
        lastTransaction,
      }: {
        transactionQueue: TransactionQueue;
        lastTransaction: UpdateTransaction;
      }) => {
        addTransaction({
          id: lastTransaction.id,
          attribute: lastTransaction.attribute,
          value: lastTransaction.value,
        });
        //transactionQueue supposed to be immutable, but I'll allow myself to mutate the copy of it
        const _transactionQueue = structuredClone(transactionQueue);

        const solutionTransactions = _transactionQueue.get(lastTransaction.id);
        const updateDate = new Date().toISOString();
        const { attribute, value } = lastTransaction;
        if (!solutionTransactions) {
          _transactionQueue.set(lastTransaction.id, {
            transactions: [
              lastTransaction,
              {
                id: lastTransaction.id,
                attribute: "lastUpdated",
                value: updateDate,
              },
            ],
          });
        } else {
          const transactionIndex = solutionTransactions?.transactions.findIndex(
            (t) => t.attribute === attribute
          );
          if (transactionIndex < 0) {
            solutionTransactions.transactions.push(lastTransaction);
          } else {
            solutionTransactions.transactions[transactionIndex]!.value = value;
          }
          solutionTransactions.transactions.push({
            id: lastTransaction.id,
            attribute: "lastUpdated",
            value: updateDate,
          });

          _transactionQueue.set(lastTransaction.id, solutionTransactions);
        }

        updateSolutionAttributes.mutate(
          {
            transactionsString: JSON.stringify(_transactionQueue, mapReplacer),
          },
          {
            onSuccess: () => {
              for (const [key, value] of _transactionQueue.entries()) {
                for (const item of value.transactions) {
                  const { attribute, value, id } = item;

                  update<
                    | Record<
                        string,
                        (string | number | string[]) &
                          (string | number | string[] | undefined)
                      >
                    | undefined
                  >(id, (quest) => {
                    if (quest) {
                      quest[attribute] = value;

                      return quest;
                    }
                  }).catch((err) => console.log(err));
                }

                //updating the indexedb quest version after changes

                update<Solution | undefined>(key, (solution) => {
                  if (solution) {
                    solution.lastUpdated = updateDate;
                    return solution;
                  }
                }).catch((err) => console.log(err));
                //updating the localstorage quest versions after change
                const solutionVersion = JSON.parse(
                  localStorage.getItem(key) as string
                ) as Versions;
                if (solutionVersion) {
                  const newVersions = {
                    server: updateDate,
                    local: updateDate,
                  };
                  localStorage.setItem(key, JSON.stringify(newVersions));
                }
              }
            },

            onSettled: () => setIsSaving(false),
          }
        );

        clearTransactionQueue();
      },
      1000
    ),
    []
  );

  useEffect(() => {
    //if local version is behind server's then fetch the quest from the server and update the local version
    if (shouldUpdate) {
      if (serverSolution.data) {
        setSolution(serverSolution.data);
        set(id, serverSolution.data).catch((err) => console.log(err));
        localStorage.setItem(
          id,
          JSON.stringify({
            server: serverSolution.data?.lastUpdated,
            local: serverSolution.data?.lastUpdated,
          })
        );
      }
    } else {
      get(id)
        .then((val: Solution) => {
          setSolution(val);
        })
        .catch((err) => console.log(err));
    }
  }, [serverSolution.data, id, shouldUpdate]);

  if (solution === null) {
    return <Box>Quest does not exist</Box>;
  }
  return (
    <Center mt={10} flexDirection="column">
      {solution?.questId ? (
        <Box w="85%" maxW="2xl" minH="36" mb={10}>
          {quest.isLoading ? (
            <QuestComponentSkeleton includeContent={false} />
          ) : quest.data ? (
            <Box position="relative">
              <IconButton
                aria-label="remove target quest"
                size="sm"
                position="absolute"
                zIndex={5}
                bottom="2"
                isLoading={removeTargetQuest.isLoading}
                onClick={() => {
                  removeTargetQuest.mutate(
                    { questId: quest.data!.id, solutionId: id },
                    {
                      onSuccess: () => {
                        update<Solution | undefined>(id, (solution) => {
                          if (solution) delete solution.questId;
                          setSolution(solution);
                          return solution;
                        }).catch((err) => console.log(err));
                        toast({
                          status: "success",
                          title: "Target quest removed successfully",
                          duration: 5000,
                          isClosable: true,
                        });
                      },
                      onError: () => {
                        toast({
                          status: "error",
                          title: "Error in removing target quest",
                          duration: 5000,
                          isClosable: true,
                        });
                      },
                    }
                  );
                }}
                right="2"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path
                      d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"
                      fill="var(--blue)"
                    ></path>
                  </svg>
                }
              />

              <QuestComponent
                includeContent={false}
                includeDetails={false}
                quest={quest.data}
              />
            </Box>
          ) : (
            <Button
              onClick={onModalOpen}
              w="100%"
              h="36"
              borderWidth="2px"
              borderColor="gray.300"
              borderRadius="2xl"
              bg="gray.200"
              color="gray.400"
            >
              + Add Quest
            </Button>
          )}
        </Box>
      ) : (
        <Button
          onClick={onModalOpen}
          w="85%"
          maxW="2xl"
          h="36"
          borderWidth="2px"
          borderColor="gray.300"
          borderRadius="2xl"
          bg="gray.200"
          color="gray.400"
          mb={10}
        >
          + Add Quest
        </Button>
      )}

      <QuestSearch
        isModalOpen={isModalOpen}
        onModalClose={onModalClose}
        onModalOpen={onModalOpen}
        solutionId={id}
        setSolution={setSolution}
      />
      <Card w="85%" bg="white" p={5} maxW="2xl" borderRadius="2xl">
        {solution === undefined ||
        (serverSolution.isLoading && shouldUpdate) ? (
          <SolutionAttributesSkeleton />
        ) : (
          <SolutionAttributes
            solution={solution}
            updateSolutionAttributesHandler={updateSolutionAttributesHandler}
            setIsSaving={setIsSaving}
          />
        )}
        {solution === undefined ||
        (serverSolution.isLoading && shouldUpdate) ? (
          <SkeletonText mt="10" noOfLines={5} spacing="4" skeletonHeight="2" />
        ) : solution.published && solution.content ? (
          <NonEditableContent content={solution.content} />
        ) : (
          <TiptapEditor
            id={solution.id}
            content={solution.content}
            type="SOLUTION"
            setIsSaving={setIsSaving}
          />
        )}
      </Card>

      {solution && !solution.published && (
        <Publish
          solutionId={solution.id}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          type="SOLUTION"
          questId={solution.questId}
          questCreatorId={solution.questCreatorId}
          setSolution={setSolution}
          isSaving={isSaving}
        />
      )}
      {solution && solution.published && (
        <Flex mt={3} columnGap={5}>
          <Button colorScheme="red" w="32" onClick={onAlertOpen}>
            Unpublish
          </Button>
          <AlertDialog
            isOpen={isAlertOpen}
            leastDestructiveRef={cancelRef}
            onClose={onAlertClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Confirm your action
                </AlertDialogHeader>

                <AlertDialogBody>Are you sure?</AlertDialogBody>

                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onAlertClose}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={handleUnpublish}
                    ml={3}
                    isLoading={unpublish.isLoading}
                  >
                    Unpublish
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
          <Button
            colorScheme="green"
            w="100%"
            onClick={() => {
              void router.push(
                `/solutions/${solution.id}?quest=${solution.questId}`
              );
            }}
          >
            View Published Solution
          </Button>
        </Flex>
      )}
    </Center>
  );
};

const QuestSearch = ({
  isModalOpen,
  onModalOpen,
  onModalClose,
  solutionId,

  setSolution,
}: {
  isModalOpen: boolean;
  onModalOpen: () => void;
  onModalClose: () => void;
  solutionId: string;
  setSolution: Dispatch<SetStateAction<Solution | null | undefined>>;
}) => {
  const [searchLoading, setSearchLoading] = useState(false);
  const initialRef = useRef(null);
  const [pages, setPages] = useState<
    inferProcedureOutput<AppRouter["quest"]["publishedQuests"]>[] | undefined
  >(undefined);

  const workspaceSolutionKey = getQueryKey(trpc.solution.workspaceSolution);
  const setTargetQuest = trpc.solution.setTargetQuest.useMutation();
  const queryClient = useQueryClient();

  const toast = useToast();

  return (
    <Modal
      initialFocusRef={initialRef}
      isOpen={isModalOpen}
      onClose={onModalClose}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent bg="blue.50">
        <ModalHeader>Search for quests</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <SearchQuestInput
            setPages={setPages}
            setSearchLoading={setSearchLoading}
            initialRef={initialRef}
          />
        </ModalBody>
        <Center>
          {searchLoading ? (
            <Center w="100%" h="50%">
              <LoadingSpinner />
            </Center>
          ) : pages && pages.length > 0 ? (
            pages.map((p, i) => (
              <Flex flexDir="column" gap={3} key={i} w="90%">
                {p &&
                  p.publishedQuests &&
                  p.publishedQuests.length > 0 &&
                  p.publishedQuests.map((quest) => (
                    <Box
                      cursor="pointer"
                      key={quest.id}
                      onClick={() => {
                        setTargetQuest.mutate(
                          {
                            questId: quest.id,
                            solutionId,
                          },
                          {
                            onSuccess: () => {
                              update<Solution | undefined>(
                                solutionId,
                                (solution) => {
                                  if (solution) {
                                    solution.questId = quest.id;
                                  }
                                  setSolution(solution);
                                  return solution;
                                }
                              ).catch((err) => console.log(err));
                              // setSolution(
                              //   produce((solution) => {
                              //     if (solution) solution.questId = quest.id;
                              //   })
                              // );
                              queryClient
                                .invalidateQueries(workspaceSolutionKey)
                                .then(() => {
                                  toast({
                                    title: "Successfuly added quest!",
                                    status: "success",
                                    isClosable: true,
                                    duration: 5000,
                                  });
                                  onModalClose();
                                })
                                .catch((err) => console.log(err));
                            },
                            onError: () => {
                              toast({
                                title: "Error in adding quest!",
                                status: "error",
                                isClosable: true,
                                duration: 5000,
                              });
                              onModalClose();
                            },
                          }
                        );
                      }}
                    >
                      <QuestComponent
                        quest={quest}
                        includeContent={false}
                        includeDetails={false}
                      />
                    </Box>
                  ))}
              </Flex>
            ))
          ) : (
            <Center w="100%" h="50%">
              No quests...
            </Center>
          )}
        </Center>

        <ModalFooter>
          <Button onClick={onModalClose} colorScheme="blue">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export default SolutionEditor;
