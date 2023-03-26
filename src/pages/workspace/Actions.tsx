import styles from "./workspace.module.css";

import { useRouter } from "next/navigation";

import { Quest, Solution } from "../../types/main";
import { set } from "idb-keyval";
import { ulid } from "ulid";
import { TEST_USER } from "../../constants/TEST_USER";

import { WorkspaceStore } from "../../zustand/workspace";
import { trpc } from "~/utils/api";
import { Box, Button, Center, Flex } from "@chakra-ui/react";
export const storeQuestOrSolution = ({
  id,
  type,
}: {
  id: string;
  type: "QUEST" | "SOLUTION";
}) => {
  if (type === "QUEST") {
    const versions = { server: 1, local: 1 };
    localStorage.setItem(id, JSON.stringify(versions));

    const newQuest: Quest = {
      id,
      published: false,
      createdAt: new Date().toISOString(),
      creatorId: TEST_USER.id,
      inTrash: false,
      lastUpdated: new Date().toISOString(),
      type: "QUEST",
    };
    set(id, newQuest);
  } else if (type === "SOLUTION") {
    const newSolution: Solution = {
      id,
      published: false,
      createdAt: new Date().toISOString(),
      creatorId: TEST_USER.id,
      inTrash: false,

      lastUpdated: new Date().toISOString(),
      type: "SOLUTION",
    };

    set(id, newSolution);
  }

  return true;
};
const Actions = () => {
  const router = useRouter();
  const createQuestOrSolutionState = WorkspaceStore(
    (state) => state.createQuestOrSolution
  );
  const createQuest = trpc.quest.createQuest.useMutation();
  const createSolution = trpc.solution.createSolution.useMutation();
  // useEffect(() => {
  //   if (createQuest.isError) {
  //   }

  //   if (createQuest.isSuccess) {
  //   }
  // }, [createQuest.isError, createQuest.error?.message, createQuest.isSuccess]);

  return (
    <Center flexDirection="column" gap={5} mt="16">
      <Button
        colorScheme="blue"
        w={{ base: "90%", lg: "60" }}
        onClick={() => {
          const id = ulid();
          createQuestOrSolutionState({ id, type: "QUEST" });
          storeQuestOrSolution({ id, type: "QUEST" });
          createQuest.mutate(
            { id },
            {
              onSuccess: () => {
                router.push(`/workspace/quests/${id}`);
              },
            }
          );
        }}
      >
        {createQuest.isLoading ? "..." : " CREATE QUEST"}
      </Button>
      <Button
        colorScheme="blue"
        w={{ base: "90%", lg: "60" }}
        onClick={async () => {
          const id = ulid();

          createQuestOrSolutionState({ id, type: "SOLUTION" });
          storeQuestOrSolution({ id, type: "SOLUTION" });
          createSolution.mutate(
            { id },
            {
              onSuccess: () => {
                router.push(`/workspace/solutions/${id}`);
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
