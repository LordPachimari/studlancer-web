import { get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "react";
import QuestAttributes, { QuestAttributesSkeleton } from "./QuestAttributes";

import { update } from "idb-keyval";
import {
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
  Box,
  Button,
  Card,
  Center,
  SkeletonText,
  useDisclosure,
} from "@chakra-ui/react";
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

  const { isOpen, onOpen, onClose } = useDisclosure();
  const questVersion = JSON.parse(
    localStorage.getItem(id) as string
  ) as Versions | null;
  const shouldUpdate =
    !questVersion ||
    new Date(questVersion.local) < new Date(questVersion.server);

  const serverQuest = trpc.quest.workspaceQuest.useQuery(
    { id },
    {
      staleTime: 10 * 60 * 1000,
      enabled: shouldUpdate || false,
    }
  );
  const updateQuestAttributes = trpc.quest.updateQuestAttributes.useMutation({
    // retry: 3,
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

        console.log("redacting transaction", _transactionQueue);
        updateQuestAttributes.mutate({
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
    console.log("shouldUpdate again", shouldUpdate);
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
  console.log("quest", quest);

  console.log("published", quest && quest.published);

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
          <TiptapEditor
            id={quest.id}
            content={quest.content}
            updateAttributesHandler={updateQuestAttributesHandler}
          />
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
        <Center>
          <Button>Unpublish</Button>
          <Button
            mt={3}
            colorScheme="green"
            w="100%"
            onClick={() => {
              void router.push(`/quests/${quest.id}`);
            }}
          >
            View Published Quest
          </Button>
        </Center>
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
