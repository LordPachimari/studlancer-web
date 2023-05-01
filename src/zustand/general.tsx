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
import { StaticImageData } from "next/image";
enableMapSet();

interface GeneralState {
  profile: StaticImageData | undefined;
  setProfile: ({ image }: { image: StaticImageData }) => void;
}

export const WorkspaceStore = create<GeneralState>((set, get) => ({
  profile: undefined,
  setProfile: ({ image }) => set({ profile: image }),
}));
