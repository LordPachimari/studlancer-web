import { del, get, set } from "idb-keyval";
import { useCallback, useEffect, useRef, useState } from "react";
import QuestAttributes, { QuestAttributesSkeleton } from "./QuestAttributes";

import { update } from "idb-keyval";
import {
  PublishedQuest,
  Quest,
  TransactionQueue,
  UpdateTransaction,
  Versions,
} from "../../types/main";

import Publish from "./Publish";

import debounce from "lodash.debounce";
import { mapReplacer } from "../../utils/mapReplacer";
import { WorkspaceStore } from "../../zustand/workspace";
import TiptapEditor from "./TiptapEditor";

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
  SkeletonText,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import produce from "immer";
import { useRouter } from "next/router";
import { trpc } from "~/utils/api";
import { NonEditableContent, NonEditableQuestAttributes } from "./Preview";

// const TiptapEditor = dynamic(() => import("./TiptapEditor"), {
//   ssr: false,
// });
const QuestEditor = ({ id }: { id: string }) => {
  const [quest, setQuest] = useState<
    (Quest & { status?: "OPEN" | "CLOSED" }) | null | undefined
  >(undefined);
  const router = useRouter();
  const cancelRef = useRef(null);
  const unpublishQuest = trpc.quest.unpublishQuest.useMutation();

  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAlertOpen,
    onOpen: onAlertOpen,
    onClose: onAlertClose,
  } = useDisclosure();
  const questVersion = JSON.parse(
    localStorage.getItem(id) as string
  ) as Versions | null;
  const shouldUpdate =
    !questVersion ||
    new Date(questVersion.local) < new Date(questVersion.server);
  const publishedQuestsKey = getQueryKey(trpc.quest.publishedQuests);
  const publishedQuestKey = getQueryKey(trpc.quest.publishedQuest);
  const workspaceQuestKey = getQueryKey(trpc.quest.workspaceQuest);

  const serverQuest = trpc.quest.workspaceQuest.useQuery(
    { id },
    {
      staleTime: 10 * 60 * 1000,
      enabled: shouldUpdate || false,
    }
  );
  const updateQuestAttributes = trpc.quest.updateQuestAttributes.useMutation({
    retry: 3,
  });

  const clearTransactionQueue = WorkspaceStore(
    (state) => state.clearTransactionQueue
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateQuestAttributesHandler = useCallback(
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
        //transactionQueue is immutable, but I'll allow myself to mutate the copy of it
        const _transactionQueue = structuredClone(transactionQueue);
        const updateTime = new Date().toISOString();

        const questTransactions = _transactionQueue.get(lastTransaction.id);
        const { attribute, value } = lastTransaction;
        if (!questTransactions) {
          _transactionQueue.set(lastTransaction.id, {
            transactions: [
              lastTransaction,
              {
                id: lastTransaction.id,
                attribute: "lastUpdated",
                value: updateTime,
              },
            ],
          });
        } else {
          const transactionIndex = questTransactions?.transactions.findIndex(
            (t) => t.attribute === attribute
          );

          if (transactionIndex < 0) {
            questTransactions.transactions.push(lastTransaction);
          } else {
            questTransactions.transactions[transactionIndex]!.value = value;
          }
          questTransactions.transactions.push({
            id: lastTransaction.id,
            attribute: "lastUpdated",
            value: updateTime,
          });

          _transactionQueue.set(lastTransaction.id, questTransactions);
        }

        const transactionString = JSON.stringify(
          _transactionQueue,
          mapReplacer
        );

        updateQuestAttributes.mutate(
          {
            transactionsString: transactionString,
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

                update<Quest | undefined>(key, (quest) => {
                  if (quest) {
                    quest.lastUpdated = updateTime;
                    return quest;
                  }
                }).catch((err) => console.log(err));
                //updating the localstorage quest versions after change
                const questVersion = JSON.parse(
                  localStorage.getItem(key) as string
                ) as Versions;
                if (questVersion) {
                  const newVersions = {
                    server: updateTime,
                    local: updateTime,
                  };
                  localStorage.setItem(key, JSON.stringify(newVersions));
                }
              }

              clearTransactionQueue();
            },
          }
        );
      },
      1000
    ),
    []
  );
  const handleUnpublish = () => {
    unpublishQuest.mutate(
      { id },
      {
        onSuccess: () => {
          update<PublishedQuest | undefined>(id, (quest) => {
            if (quest) {
              quest.published = false;
              return quest;
            }
          }).catch((err) => console.log(err));
          setQuest(
            produce((quest) => {
              if (quest) {
                quest.published = false;
              }
            })
          );
          queryClient
            .invalidateQueries({
              queryKey: [
                ...publishedQuestKey,
                ...publishedQuestsKey,
                ...workspaceQuestKey,
              ],
            })
            .then(() => {
              toast({
                title: "Quest Unpublished.",
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
  };

  useEffect(() => {
    //if local version is behind server's then fetch the quest from the server and update the local version
    if (shouldUpdate) {
      if (serverQuest.data) {
        setQuest(serverQuest.data);
        set(id, serverQuest.data).catch((err) => console.log(err));
        localStorage.setItem(
          id,
          JSON.stringify({
            server: serverQuest.data?.lastUpdated,
            local: serverQuest.data?.lastUpdated,
          })
        );
      }
    } else {
      get(id)
        .then((val: Quest) => {
          setQuest(val);
          //if someone deleted local quest in indexedb, delete version so next time fetch from server
          if (!val) {
            localStorage.removeItem(id);
          }
        })
        .catch((err) => console.log(err));
    }
  }, [serverQuest.data, id, shouldUpdate]);

  if (quest === null) {
    return <Box>Quest does not exist</Box>;
  }

  return (
    <Center mt={10} flexDirection="column" mb={20}>
      <Card w="85%" bg="white" p={5} maxW="2xl" borderRadius="2xl">
        {quest === undefined || (serverQuest.isLoading && shouldUpdate) ? (
          <QuestAttributesSkeleton />
        ) : quest.published ? (
          <NonEditableQuestAttributes quest={quest} />
        ) : (
          <QuestAttributes
            quest={quest}
            // isLoading={shouldUpdate && serverQuest.isLoading}
            updateQuestAttributesHandler={updateQuestAttributesHandler}
          />
        )}
        {quest === undefined || (serverQuest.isLoading && shouldUpdate) ? (
          <SkeletonText mt="10" noOfLines={5} spacing="4" skeletonHeight="2" />
        ) : quest.published && quest.content ? (
          <NonEditableContent content={quest.content} />
        ) : (
          <TiptapEditor id={quest.id} content={quest.content} type="QUEST" />
        )}
      </Card>
      {quest && !quest.published && (
        <Publish
          questId={id}
          type="QUEST"
          isOpen={isOpen}
          onClose={onClose}
          onOpen={onOpen}
          setQuest={setQuest}
        />
      )}
      {quest && quest.published && (
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

                <AlertDialogBody>
                  Are you sure? All current active solvers will be lost
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onAlertClose}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={handleUnpublish}
                    isLoading={unpublishQuest.isLoading}
                    ml={3}
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
              void router.push(`/quests/${quest.id}`);
            }}
          >
            View Published Quest
          </Button>
        </Flex>
      )}
      {/* <Button
        onClick={() =>
          router.push("/workspace/quests/quest1", undefined, {
            shallow: "true",
          })
        }
      >
        Check
      </Button> */}
    </Center>
  );
};
export default QuestEditor;
