import { get, set } from "idb-keyval";
import { useCallback, useEffect, useState } from "react";

import {
  Solution,
  TransactionQueue,
  UpdateTransaction,
  Versions,
} from "../../../../types/main";
import { update } from "idb-keyval";

import Publish from "../../Publish";

import debounce from "lodash.debounce";
// import TiptapEditor from "../../TiptapEditor";
import SolutionAttributes, {
  SolutionAttributesSkeleton,
} from "./SolutionAttributes";

import { trpc } from "~/utils/api";
import { WorkspaceStore } from "~/zustand/workspace";
import { mapReplacer } from "~/utils/mapReplacer";
import { Box, SkeletonText, useDisclosure } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import TiptapEditor from "../../TiptapEditor";

const SolutionEditor = ({ id }: { id: string }) => {
  const [solution, setSolution] = useState<Solution | null | undefined>(
    undefined
  );

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const solutionVersion = JSON.parse(
    localStorage.getItem(id) as string
  ) as Versions | null;
  const shouldUpdate =
    !solutionVersion ||
    new Date(solutionVersion.local) < new Date(solutionVersion.server);

  const serverSolution = trpc.solution.workspaceSolution.useQuery(
    { id },
    {
      staleTime: 10 * 60 * 1000,
      enabled: shouldUpdate,
    }
  );
  const updateSolutionAttributes =
    trpc.solution.updateSolutionAttributes.useMutation({
      // retry: 3,
    });

  const addTransaction = WorkspaceStore((state) => state.addTransaction);
  const clearTransactionQueue = WorkspaceStore(
    (state) => state.clearTransactionQueue
  );

  const updateSolutionAttributesHandler = useCallback(
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
            update(id, (quest) => {
              quest[attribute] = value;

              return quest;
            });
          }

          //updating the indexedb quest version after changes

          update(key, (item) => {
            const solution = item as Solution;
            solution.lastUpdated = updateDate;
            return solution;
          });
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

        console.log("redacting transaction", _transactionQueue);
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
        set(id, serverSolution.data);
        localStorage.setItem(
          id,
          JSON.stringify({
            server: serverSolution.data?.lastUpdated,
            local: serverSolution.data?.lastUpdated,
          })
        );
      }
    } else {
      get(id).then((val) => {
        setSolution(val);
      });
    }
  }, [serverSolution.data, id]);

  if (solution === null) {
    return <Box>Quest does not exist</Box>;
  }

  return (
    <>
      {solution === undefined || (serverSolution.isLoading && shouldUpdate) ? (
        <SolutionAttributesSkeleton />
      ) : (
        <SolutionAttributes
          solution={solution}
          updateSolutionAttributesHandler={updateSolutionAttributesHandler}
        />
      )}
      {solution === undefined || (serverSolution.isLoading && shouldUpdate) ? (
        <SkeletonText mt="10" noOfLines={5} spacing="4" skeletonHeight="2" />
      ) : (
        <TiptapEditor
          id={solution.id}
          content={solution.content}
          updateAttributesHandler={updateSolutionAttributesHandler}
        />
      )}
      {solution && (
        <Publish
          solutionId={solution.id}
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          type="SOLUTION"
          questId={solution.questId}
          questCreatorId={solution.questCreatorId}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
    </>
  );
};
export default SolutionEditor;
