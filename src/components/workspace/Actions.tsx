import { useRouter } from "next/router";

import { set } from "idb-keyval";
import { ulid } from "ulid";
import { TEST_USER } from "../../constants/TEST_USER";
import { Quest, Solution } from "../../types/main";

import { Button, Center } from "@chakra-ui/react";
import { trpc } from "~/utils/api";
import { WorkspaceStore } from "../../zustand/workspace";
export const storeQuestOrSolution = ({
  id,
  type,
}: {
  id: string;
  type: "QUEST" | "SOLUTION";
}) => {
  const newDate = new Date().toISOString();
  if (type === "QUEST") {
    const versions = { server: 1, local: 1 };
    localStorage.setItem(id, JSON.stringify(versions));

    const newQuest: Quest = {
      id,
      published: false,
      createdAt: newDate,
      creatorId: TEST_USER.id,
      inTrash: false,
      lastUpdated: newDate,
      type: "QUEST",
    };
    set(id, newQuest).catch((err) => console.log(err));
  } else if (type === "SOLUTION") {
    const newSolution: Solution = {
      id,
      published: false,
      createdAt: newDate,
      creatorId: TEST_USER.id,
      inTrash: false,

      lastUpdated: newDate,
      type: "SOLUTION",
    };

    set(id, newSolution).catch((err) => console.log(err));
  }

  return true;
};
//hello world
const Actions = () => {
  const router = useRouter();
  const createQuestOrSolutionState = WorkspaceStore(
    (state) => state.createQuestOrSolution
  );
  const createQuest = trpc.quest.createQuest.useMutation();
  const createSolution = trpc.solution.createSolution.useMutation();

  return (
    <Center flexDirection="column" gap={5} mt="16">
      <Button
        colorScheme="blue"
        w={{ base: "90%", md: "60" }}
        isLoading={createQuest.isLoading}
        onClick={() => {
          const id = ulid();
          createQuestOrSolutionState({ id, type: "QUEST" });
          storeQuestOrSolution({ id, type: "QUEST" });
          createQuest.mutate(
            { id },
            {
              onSuccess: () => {
                void router.push(`/workspace/quests/${id}`);
              },
            }
          );
        }}
      >
        CREATE QUEST
      </Button>

      <Button
        colorScheme="blue"
        w={{ base: "90%", md: "60" }}
        isLoading={createSolution.isLoading}
        onClick={() => {
          const id = ulid();
          createQuestOrSolutionState({ id, type: "SOLUTION" });
          storeQuestOrSolution({ id, type: "SOLUTION" });
          createSolution.mutate(
            { id },
            {
              onSuccess: () => {
                void router.push(`/workspace/solutions/${id}`);
              },
            }
          );
        }}
      >
        CREATE SOLUTION
      </Button>
    </Center>
  );
};
export default Actions;
