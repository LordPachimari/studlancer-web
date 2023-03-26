import { get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "react";
import QuestAttributes from "./QuestAttributes";

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
import TiptapEditor from "../../TiptapEditor";
import { trpc } from "~/utils/api";

// const TiptapEditor = dynamic(() => import("./TiptapEditor"), {
//   ssr: false,
// });

const QuestEditor = ({ id }: { id: string }) => {
  // const [quest, setQuest] = useState<Quest | null | undefined>(undefined);
  const quest: Quest = {
    id: "quest1",
    title: "quest1",
    createdAt: "2020-01-01T00:00:00",
    creatorId: "user1",
    inTrash: false,
    type: "QUEST",
    lastUpdated: "2020-01-01T00:00:0",
    published: false,
  };
  const questVersion = JSON.parse(
    localStorage.getItem(id) as string
  ) as Versions | null;
  const shouldUpdate =
    !questVersion || questVersion.local < questVersion.server;

  // const serverQuest = trpc.quest.workspaceQuest.useQuery(
  //   { id },
  //   {
  //     staleTime: 10 * 60 * 1000,
  //     enabled: shouldUpdate,
  //   }
  // );
  const updateQuestAttributes = trpc.quest.updateQuestAttributes.useMutation({
    // retry: 3,
  });

  const addTransaction = WorkspaceStore((state) => state.addTransaction);
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
        // updateQuestAttributes.mutate({
        //   transactionsString: JSON.stringify(_transactionQueue, mapReplacer),
        // });
        clearTransactionQueue();
      },
      1000
    ),
    []
  );

  // useEffect(() => {
  //   //if local version is behind server's then fetch the quest from the server and update the local version
  //   if (!questVersion || questVersion.local < questVersion.server) {
  //     if (serverQuest.data) {
  //       setQuest(serverQuest.data);
  //       set(id, serverQuest.data);
  //       localStorage.setItem(
  //         id,
  //         JSON.stringify({
  //           server: serverQuest.data?.lastUpdated,
  //           local: serverQuest.data?.lastUpdated,
  //         })
  //       );
  //     }
  //   } else {
  //     get(id).then((val) => {
  //       setQuest(val);
  //     });
  //   }
  // }, [serverQuest.data, id]);

  if (!quest) {
    return <div>Quest does not exist</div>;
  }

  return (
    <>
      <QuestAttributes
        quest={quest}
        // isLoading={shouldUpdate && serverQuest.isLoading}
        isLoading={false}
        updateQuestAttributesHandler={updateQuestAttributesHandler}
      />
      <TiptapEditor
        id={quest.id}
        content={quest.content}
        updateAttributesHandler={updateQuestAttributesHandler}
      />

      <Publish questId={quest.id} type="QUEST" />
    </>
  );
};
export default QuestEditor;
