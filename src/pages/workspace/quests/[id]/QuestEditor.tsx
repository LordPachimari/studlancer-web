import { get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "react";
import { QuestAttributesSkeleton } from "./QuestAttributes";
const QuestAttributes = dynamic(() => import("./QuestAttributes"), {
  ssr: false,
});
import {
  Quest,
  TransactionQueue,
  UpdateTransaction,
  Versions,
} from "../../../../types/main";
import { update } from "idb-keyval";

import Publish from "../../Publish";

import debounce from "lodash.debounce";
import { mapReplacer } from "../../../../utils/mapReplacer";
import { WorkspaceStore } from "../../../../zustand/workspace";
// import TiptapEditor from "../../TiptapEditor";
const TiptapEditor = dynamic(() => import("../../TiptapEditor"), {
  ssr: false,
});
import { trpc } from "~/utils/api";
import {
  Box,
  Button,
  Card,
  SkeletonText,
  useDisclosure,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";

// const TiptapEditor = dynamic(() => import("./TiptapEditor"), {
//   ssr: false,
// });

const QuestEditor = ({ id }: { id: string }) => {
  const [quest, setQuest] = useState<Quest | null | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
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

  const updateQuestAttributesHandler = useCallback(
    debounce(
      async ({
        transactionQueue,
        //last transaction needs to be pushed into transactionQueue,
        //as the last addTransaction function is executed in parallel with updateQuestAttributeHandler,
        //and cannot be captured inside of updateQuestAttributeHandler function
        lastTransaction,
      }: {
        transactionQueue: TransactionQueue;
        lastTransaction: UpdateTransaction;
      }) => {
        //transactionQueue supposed to be immutable, but I'll allow myself to mutate the copy of it
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
            update(id, (quest) => {
              quest[attribute] = value;

              return quest;
            });
          }

          //updating the indexedb quest version after changes

          update(key, (item) => {
            const quest = item as Quest;
            quest.lastUpdated = updateTime;
            return quest;
          });
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
        set(id, serverQuest.data);
        localStorage.setItem(
          id,
          JSON.stringify({
            server: serverQuest.data?.lastUpdated,
            local: serverQuest.data?.lastUpdated,
          })
        );
      }
    } else {
      get(id).then((val) => {
        setQuest(val);
        //if someone deleted local quest in indexedb, delete version so next time fetch from server
        if (!val) {
          localStorage.removeItem(id);
        }
      });
    }
  }, [serverQuest.data, id]);

  if (quest === null) {
    return <Box>Quest does not exist</Box>;
  }

  return (
    <>
      {quest === undefined || (serverQuest.isLoading && shouldUpdate) ? (
        <QuestAttributesSkeleton />
      ) : (
        <QuestAttributes
          quest={quest}
          // isLoading={shouldUpdate && serverQuest.isLoading}
          updateQuestAttributesHandler={updateQuestAttributesHandler}
        />
      )}
      {quest === undefined || (serverQuest.isLoading && shouldUpdate) ? (
        <SkeletonText mt="10" noOfLines={5} spacing="4" skeletonHeight="2" />
      ) : (
        <TiptapEditor
          id={quest.id}
          content={quest.content}
          updateAttributesHandler={updateQuestAttributesHandler}
        />
      )}

      <Publish
        questId={id}
        type="QUEST"
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
      <Button
        colorScheme="blue"
        mt={3}
        onClick={() => {
          onOpen();
          setErrorMessage(undefined);
        }}
      >
        Publish
      </Button>
    </>
  );
};
export default QuestEditor;
