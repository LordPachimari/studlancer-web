import produce, { enableMapSet } from "immer";
import { create } from "zustand";

import { TEST_USER } from "../constants/TEST_USER";
import {
  Quest,
  Solution,
  TransactionQueue,
  UpdateTransaction,
  WorkspaceList,
} from "../types/main";
enableMapSet();
interface WorkspaceState {
  transactionQueue: TransactionQueue;
  addTransaction: (props: UpdateTransaction) => void;
  clearTransactionQueue: () => void;
  workspaceList: WorkspaceList;
  createQuestOrSolution: ({
    id,
    type,
  }: {
    id: string;
    type: "QUEST" | "SOLUTION";
  }) => void;
  deleteQuestOrSolution: ({
    id,
    type,
  }: {
    id: string;
    type: "QUEST" | "SOLUTION";
  }) => void;
  setWorkspaceList: ({ quests, solutions }: WorkspaceList) => void;
  updateQuestState: (props: {
    id: string;
    attribute: "title" | "topic";
    value: string;
  }) => void;
  updateSolutionState: (props: {
    id: string;
    attribute: "title" | "topic";
    value: string;
  }) => void;
}

export const WorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaceList: { quests: [], solutions: [] },
  transactionQueue: new Map(),

  addTransaction: (props) => {
    const { id, attribute, value } = props;
    set(
      produce((state: WorkspaceState) => {
        const transactions = state.transactionQueue.get(id);
        if (!transactions) {
          state.transactionQueue.set(id, { transactions: [props] });
        } else {
          const transactionIndex = transactions.transactions.findIndex(
            (t) => t.attribute === attribute
          );
          if (transactionIndex < 0) {
            const newTransaction = props;
            transactions.transactions.push(newTransaction);
            state.transactionQueue.set(id, transactions);
          } else {
            transactions.transactions[transactionIndex]!.value = value;
            state.transactionQueue.set(id, transactions);
          }
        }
      })
    );
  },
  clearTransactionQueue: () => set({ transactionQueue: new Map() }),
  createQuestOrSolution: ({ id, type }) => {
    if (type === "QUEST") {
      const quest: Quest = {
        id,
        published: false,
        inTrash: false,
        createdAt: new Date().toISOString(),
        creatorId: TEST_USER.id,
        lastUpdated: new Date().toISOString(),
        type: "QUEST",
      };
      set(
        produce((state: WorkspaceState) => {
          state.workspaceList.quests.push(quest);
        })
      );
    } else if (type === "SOLUTION") {
      const solution: Solution = {
        id,
        createdAt: new Date().toISOString(),
        creatorId: TEST_USER.id,
        inTrash: false,
        published: false,
        type: "SOLUTION",
        lastUpdated: new Date().toISOString(),
      };
      set(
        produce((state: WorkspaceState) => {
          state.workspaceList.solutions.push(solution);
        })
      );
    }
  },

  deleteQuestOrSolution: ({ id, type }) => {
    if (type === "QUEST") {
      const quests = get().workspaceList.quests;
      const filteredQuests = quests.filter((q) => q.id !== id);
      set(
        produce((state: WorkspaceState) => {
          state.workspaceList.quests = filteredQuests;
        })
      );
    } else if (type === "SOLUTION") {
      const solutions = get().workspaceList.solutions;

      const filteredSolutions = solutions.filter((s) => s.id !== id);
      set(
        produce((state: WorkspaceState) => {
          state.workspaceList.solutions = filteredSolutions;
        })
      );
    }
  },

  setWorkspaceList: ({ solutions, quests }) => {
    set({ workspaceList: { quests, solutions } });
  },

  updateQuestState: ({ id, attribute, value }) =>
    set(
      produce((state: WorkspaceState) => {
        const index = state.workspaceList.quests.findIndex((q) => q.id === id);
        console.log("index", index);
        if (index < 0) {
          console.log("hellooooooo");
          return;
        }

        console.log("all good");
        state.workspaceList.quests[index]![attribute] = value;
      })
    ),
  updateSolutionState: ({ id, attribute, value }) =>
    set(
      produce((state: WorkspaceState) => {
        const index = state.workspaceList.solutions.findIndex(
          (q) => q.id === id
        );
        if (index < 0) {
          return;
        }
        state.workspaceList.solutions[index]![attribute] = value;
      })
    ),
}));
