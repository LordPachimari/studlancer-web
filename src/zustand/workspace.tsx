import produce, { enableMapSet } from "immer";
import { create } from "zustand";

import { TEST_USER } from "../constants/TEST_USER";
import {
  Quest,
  QuestListComponent,
  Solution,
  SolutionListComponent,
  QuestAttributesType,
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
    userId,
  }: {
    id: string;
    type: "QUEST" | "SOLUTION";
    userId: string;
  }) => void;
  deleteQuestOrSolution: ({
    id,
    type,
  }: {
    id: string;
    type: "QUEST" | "SOLUTION";
  }) => void;
  setWorkspaceList: ({
    quests,
    solutions,
  }: {
    quests?: QuestListComponent[];
    solutions?: SolutionListComponent[];
  }) => void;
  updateListState: <
    Attr extends "title" | "topic",
    Value extends QuestListComponent[Attr]
  >(props: {
    type: "QUEST" | "SOLUTION";
    id: string;
    attribute: Attr;
    value: Value;
  }) => void;
}

export const WorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaceList: { quests: [], solutions: [] },
  transactionQueue: new Map(),

  addTransaction: (props) => {
    const { id, attribute, value } = props;
    console.log("transaction", attribute);
    set(
      produce((state: WorkspaceState) => {
        const transactions = state.transactionQueue.get(id);
        if (!transactions) {
          console.log("first transaction", attribute);
          state.transactionQueue.set(id, { transactions: [props] });
        } else {
          const transactionIndex = transactions.transactions.findIndex(
            (t) => t.attribute === attribute
          );
          if (transactionIndex < 0) {
            console.log("new unique transaction", attribute);
            const newTransaction = props;
            transactions.transactions.push(newTransaction);
            state.transactionQueue.set(id, transactions);
          } else {
            console.log("update old transaction", attribute);
            const transaction = transactions.transactions[transactionIndex];
            if (transaction) {
              transaction.value = value;
              state.transactionQueue.set(id, transactions);
            }
          }
        }
      })
    );
  },
  clearTransactionQueue: () => set({ transactionQueue: new Map() }),
  createQuestOrSolution: ({ id, type, userId }) => {
    if (type === "QUEST") {
      const quest: Quest = {
        id,
        published: false,
        inTrash: false,
        createdAt: new Date().toISOString(),
        creatorId: userId,
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
        creatorId: userId,
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

  setWorkspaceList: ({ solutions, quests }) =>
    set(
      produce((state: WorkspaceState) => {
        if (quests && solutions) {
          state.workspaceList.quests = quests;
          state.workspaceList.solutions = solutions;
        } else if (quests) {
          state.workspaceList.quests = quests;
        } else if (solutions) {
          state.workspaceList.solutions = solutions;
        }
      })
    ),

  updateListState: ({ id, attribute, value, type }) =>
    set(
      produce((state: WorkspaceState) => {
        if (type === "QUEST") {
          const index = state.workspaceList.quests.findIndex(
            (q) => q.id === id
          );
          if (index < 0) {
            return;
          }

          const quest = state.workspaceList.quests[index];
          if (quest) {
            quest[attribute] = value;
            state.workspaceList.quests[index] = quest;
          }
        }
        if (type === "SOLUTION") {
          const index = state.workspaceList.solutions.findIndex(
            (q) => q.id === id
          );
          if (index < 0) {
            return;
          }
          const solution = state.workspaceList.solutions[index];
          if (solution) {
            solution[attribute] = value;
            state.workspaceList.solutions[index] = solution;
          }
        }
      })
    ),
}));
