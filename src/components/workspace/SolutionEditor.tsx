import { get, set } from "idb-keyval";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  PublishedSolution,
  Solution,
  TransactionQueue,
  UpdateTransaction,
  Versions,
} from "../../types/main";
import { update } from "idb-keyval";

import Publish from "./Publish";

import debounce from "lodash.debounce";
// import TiptapEditor from "../../TiptapEditor";
import SolutionAttributes, {
  SolutionAttributesSkeleton,
} from "./SolutionAttributes";

import { trpc } from "~/utils/api";
import { WorkspaceStore } from "~/zustand/workspace";
import { mapReplacer } from "~/utils/mapReplacer";
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
  FormLabel,
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
import dynamic from "next/dynamic";
import TiptapEditor from "./TiptapEditor";
import { NonEditableContent } from "./Preview";
import { useRouter } from "next/router";
import QuestComponent, { QuestComponentSkeleton } from "../QuestComponent";
import produce from "immer";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";

const SolutionEditor = ({ id }: { id: string }) => {
  const [solution, setSolution] = useState<Solution | null | undefined>(
    undefined
  );
  const router = useRouter();
  const toast = useToast();
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
      staleTime: 10 * 60 * 1000,
      enabled: shouldUpdate,
    }
  );
  const solutionKey = getQueryKey(trpc.solution.publishedSolution);
  const workspaceSolutionKey = getQueryKey(trpc.solution.workspaceSolution);
  const publishedQuestKey = getQueryKey(trpc.quest.publishedQuest);
  const updateSolutionAttributes =
    trpc.solution.updateSolutionAttributes.useMutation({
      // retry: 3,
    });
  const quest = trpc.quest.publishedQuest.useQuery(
    { id: (!!solution && solution.questId) || "" },
    {
      enabled: !!solution && !!solution.questId,

      staleTime: 10 * 60 * 1000,
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
          questId: (solution as PublishedSolution).questId,
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
            queryClient
              .invalidateQueries({
                queryKey: [
                  ...solutionKey,
                  ...publishedQuestKey,
                  ...workspaceSolutionKey,
                ],
              })
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

        updateSolutionAttributes.mutate({
          transactionsString: JSON.stringify(_transactionQueue, mapReplacer),
        });
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
  console.log("solution", solution);
  return (
    <Center mt={10} flexDirection="column">
      {solution?.questId ? (
        <Box w="85%" minH="36" mb={10}>
          {quest.isLoading ? (
            <QuestComponentSkeleton includeContent={false} />
          ) : quest.data && quest.data.quest ? (
            <QuestComponent
              includeContent={false}
              includeDetails={false}
              quest={quest.data.quest}
            />
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
      />
      <Card w="85%" bg="white" p={5} maxW="2xl" borderRadius="2xl">
        {solution === undefined ||
        (serverSolution.isLoading && shouldUpdate) ? (
          <SolutionAttributesSkeleton />
        ) : (
          <SolutionAttributes
            solution={solution}
            updateSolutionAttributesHandler={updateSolutionAttributesHandler}
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
            updateAttributesHandler={updateSolutionAttributesHandler}
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
              void router.push(`/solutions/${solution.id}`);
            }}
          >
            View Published Quest
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
}: {
  isModalOpen: boolean;
  onModalOpen: () => void;
  onModalClose: () => void;
}) => {
  const initialRef = useRef(null);
  return (
    <Modal
      initialFocusRef={initialRef}
      isOpen={isModalOpen}
      onClose={onModalClose}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Search for quests</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <Input ref={initialRef} placeholder="Search for quests..." />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onModalClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export default SolutionEditor;
