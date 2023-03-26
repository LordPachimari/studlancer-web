import {
  Quest,
  QuestListComponent,
  Solution,
  SolutionListComponent,
  WorkspaceList,
} from "../../types/main";
import { useAuth } from "@clerk/nextjs";
import { del, get, update } from "idb-keyval";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ulid } from "ulid";
import { WorkspaceStore } from "../../zustand/workspace";
import { storeQuestOrSolution } from "./Actions";
import styles from "./workspace.module.css";
import { trpc } from "~/utils/api";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  Heading,
  IconButton,
  Text,
} from "@chakra-ui/react";
const List = ({
  showList,
  toggleShowList,
}: {
  showList: boolean;
  toggleShowList: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const emptyLists: {}[] = [];
  for (let i = 0; i < 3; i++) {
    emptyLists.push({});
  }
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  //   const createQuest = trpc.quest.createQuest.useMutation();
  //   const createSolution = trpc.solution.createSolution.useMutation();

  //   const serverWorkspaceList = trpc.workspace.workspaceList.useQuery(undefined, {
  //     staleTime: 10 * 60 * 1000,
  //     enabled: isLoaded,
  //   });
  //   const workspaceListState = WorkspaceStore((state) => state.workspaceList);
  //   const deleteQuest = trpc.quest.deleteQuest.useMutation();
  //   const deleteSolution = trpc.solution.deleteSolution.useMutation();
  //   const deleteQuestPermanently =
  //     trpc.quest.deleteQuestPermanently.useMutation();
  //   const deleteSolutionPermanently =
  //     trpc.solution.deleteSolutionPermanently.useMutation();

  const setWorkspaceListState = WorkspaceStore(
    (state) => state.setWorkspaceList
  );
  const createQuestOrSolutionState = WorkspaceStore(
    (state) => state.createQuestOrSolution
  );

  //deleteQuestState just deletes quest from the list state
  const deleteQuestOrSolution = WorkspaceStore(
    (state) => state.deleteQuestOrSolution
  );
  const [trash, setTrash] = useState<WorkspaceList>({
    quests: [],
    solutions: [],
  });

  const fetchDeletedQuestList = useCallback(() => {
    //fetch quest list in trash
  }, []);

  //deleteQuest deletes quest in local storage and the server (not actually deletes but marks as inTrash)
  const deleteListComponent = ({ id }: { id: string }) => {
    get(id).then(
      (listComponent: QuestListComponent | SolutionListComponent) => {
        if (listComponent.type === "QUEST") {
          const quest = listComponent as Quest;
          if (quest && (quest.title !== "" || quest.content)) {
            console.log("saving...");

            update(`TRASH#${userId}`, (item) => {
              const list = item as WorkspaceList;
              if (!list) {
                const newTrashList: WorkspaceList = {
                  quests: [
                    {
                      id: quest.id,
                      inTrash: quest.inTrash,
                      lastUpdated: quest.lastUpdated,
                      topic: quest.topic ? quest.topic : undefined,
                      type: "QUEST",
                    },
                  ],
                  solutions: [],
                };
                return newTrashList;
              } else {
                list.quests.push({
                  id: quest.id,
                  inTrash: quest.inTrash,
                  lastUpdated: quest.lastUpdated,
                  topic: quest.topic ? quest.topic : undefined,
                  type: "QUEST",
                });
                return list;
              }
            });
            // deleteQuest.mutate({ id: quest.id });
          } else {
            // deleteQuestPermanently.mutate({ id: quest.id });

            deletePermanentlyFromLocalStorage({ id: quest.id, type: "QUEST" });
          }
          deleteQuestOrSolution({ id, type: "QUEST" });
        } else if (listComponent.type === "SOLUTION") {
          const solution = listComponent as Solution;
          if (solution && solution.content) {
            console.log("saving...");
            update(`TRASH#${userId}`, (item) => {
              const list = item as WorkspaceList;
              if (!list) {
                const newTrashList: WorkspaceList = {
                  quests: [],
                  solutions: [
                    {
                      id: solution.id,
                      inTrash: solution.inTrash,
                      lastUpdated: solution.lastUpdated,
                      type: "SOLUTION",
                    },
                  ],
                };
                return newTrashList;
              } else {
                list.solutions.push({
                  id: solution.id,
                  inTrash: solution.inTrash,
                  lastUpdated: solution.lastUpdated,
                  type: "SOLUTION",
                });
                return list;
              }
            });
            // deleteSolution.mutate({ id: solution.id });
          } else {
            // deleteSolutionPermanently.mutate({ id: solution.id });
            deletePermanentlyFromLocalStorage({
              id: solution.id,
              type: "SOLUTION",
            });
          }

          deleteQuestOrSolution({ id, type: "SOLUTION" });
        }

        del(id);

        localStorage.removeItem(id);
        router.push("/workspace");
      }
    );
  };
  const deletePermanentlyFromLocalStorage = ({
    id,
    type,
  }: {
    id: string;
    type: "QUEST" | "SOLUTION";
  }) => {
    update(`TRASH#${userId}`, (item) => {
      const list = item as WorkspaceList;
      if (type === "QUEST") {
        const newQuests = list.quests.filter((q) => q.id !== id);
        list.quests = newQuests;
      } else if (type === "SOLUTION") {
        const newSolutions = list.solutions.filter((s) => s.id !== id);
        list.solutions = newSolutions;
      }

      setTrash(list);

      return list;
    });
  };
  const restoreQuest = ({ id }: { id: string }) => {
    //fetch the quest from the server and push it to the list.
  };
  const createQuestOrSolutionHandler = async ({
    type,
  }: {
    type: "QUEST" | "SOLUTION";
  }) => {
    if (type === "QUEST") {
      const id = ulid();
      createQuestOrSolutionState({ id, type: "QUEST" });
      storeQuestOrSolution({ id, type: "QUEST" });
      //   createQuest.mutate(
      //     { id },
      //     {
      //       onSuccess: () => {
      //         router.push(`/workspace/quests/${id}`);
      //       },
      //     }
      //   );
    } else if (type === "SOLUTION") {
      const id = ulid();
      createQuestOrSolutionState({ id, type: "SOLUTION" });

      storeQuestOrSolution({ id, type: "SOLUTION" });
      //   createSolution.mutate(
      //     { id },
      //     {
      //       onSuccess: () => {
      //         router.push(`/workspace/solutions/${id}`);
      //       },
      //     }
      //   );
    }
    // const result = await createQuest({ id });
    // if (result) {
    //   router.push(`/workspace/quests/${id}`);
    // }
  };
  // useEffect(() => {
  //   if (serverWorkspaceList.data) {
  //     const nonDeletedQuests: Quest[] = [];
  //     const nonDeletedSolutions: Solution[] = [];
  //     const deletedQuests: Quest[] = [];
  //     const deletedSolutions: Solution[] = [];
  //     serverWorkspaceList.data.quests.forEach((quest) => {
  //       if (quest.inTrash) {
  //         deletedQuests.push(quest);
  //       } else {
  //         nonDeletedQuests.push(quest);
  //       }
  //     });
  //     serverWorkspaceList.data.solutions.forEach((solution) => {
  //       if (solution.inTrash) {
  //         deletedSolutions.push(solution);
  //       } else {
  //         nonDeletedSolutions.push(solution);
  //       }
  //     });

  //     nonDeletedQuests.forEach((q) => {
  //       const questVersion = JSON.parse(
  //         localStorage.getItem(q.id) as string
  //       ) as Versions | null;
  //       if (questVersion) {
  //         const updatedVersions: Versions = {
  //           server: q.lastUpdated,
  //           local: questVersion.local,
  //         };

  //         localStorage.setItem(q.id, JSON.stringify(updatedVersions));
  //       }
  //     });
  //     nonDeletedSolutions.forEach((s) => {
  //       const solutionVersion = JSON.parse(
  //         localStorage.getItem(s.id) as string
  //       ) as Versions | null;
  //       if (solutionVersion) {
  //         const updatedVersions: Versions = {
  //           server: s.lastUpdated,
  //           local: solutionVersion.local,
  //         };

  //         localStorage.setItem(s.id, JSON.stringify(updatedVersions));
  //       }
  //     });

  //     setWorkspaceListState({
  //       quests: nonDeletedQuests,
  //       solutions: nonDeletedSolutions,
  //     });
  //     setTrash({
  //       quests: deletedQuests,
  //       solutions: deletedSolutions,
  //     });
  //   }
  // }, [serverWorkspaceList.data, setWorkspaceListState]);

  return (
    <div className={`${styles.listContainer} ${showList && styles.showList}`}>
      <Flex flexDirection="row-reverse">
        <IconButton
          m={2}
          aria-label="close list"
          onClick={() => {
            toggleShowList((val) => !val);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path fill="none" d="M0 0H24V24H0z" />
            <path
              d="M21 18v2H3v-2h18zM6.596 3.904L8.01 5.318 4.828 8.5l3.182 3.182-1.414 1.414L2 8.5l4.596-4.596zM21 11v2h-9v-2h9zm0-7v2h-9V4h9z"
              fill="var(--blue)"
            />
          </svg>
        </IconButton>
      </Flex>
      <ListSettings>
        <TrashComponent trash={trash} />
      </ListSettings>
      <Divider />
      <Accordion defaultIndex={[0]} allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton h="10" pl={2}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path
                  d="M19 22H5a3 3 0 0 1-3-3V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12h4v4a3 3 0 0 1-3 3zm-1-5v2a1 1 0 0 0 2 0v-2h-2zm-2 3V4H4v15a1 1 0 0 0 1 1h11zM6 7h8v2H6V7zm0 4h8v2H6v-2zm0 4h5v2H6v-2z"
                  fill="var(--blue)"
                />
              </svg>
              <Text fontSize="md" m={2} fontWeight="semibold" color="gray.500">
                Quests
              </Text>
              <AccordionIcon ml="auto" color="gray.500" />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4} p="0">
            <Button
              justifyContent="flex-start"
              pl="2"
              borderRadius={0}
              bg="none"
              leftIcon={<Circle size="24px" bg="tomato" color="white"></Circle>}
              w="100%"
              color="black"
            >
              title
            </Button>
            <Button
              justifyContent="flex-start"
              pl="2"
              borderRadius={0}
              bg="none"
              leftIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path
                    d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"
                    fill="var(--gray)"
                  />
                  :
                </svg>
              }
              w="100%"
              color="gray.500"
            >
              Add quest
            </Button>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <Accordion defaultIndex={[0]} allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton h="10" pl={2}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0L24 0 24 24 0 24z" />
                <path
                  d="M20 2c.552 0 1 .448 1 1v3.757l-2 2V4H5v16h14v-2.758l2-2V21c0 .552-.448 1-1 1H4c-.552 0-1-.448-1-1V3c0-.552.448-1 1-1h16zm1.778 6.808l1.414 1.414L15.414 18l-1.416-.002.002-1.412 7.778-7.778zM13 12v2H8v-2h5zm3-4v2H8V8h8z"
                  fill="var(--blue)"
                />
              </svg>

              <Text fontSize="md" m={2} fontWeight="semibold" color="gray.500">
                Solutions
              </Text>
              <AccordionIcon ml="auto" color="gray.500" />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4} p="0">
            <Button
              justifyContent="flex-start"
              pl="2"
              borderRadius={0}
              bg="none"
              leftIcon={<Circle size="24px" bg="tomato" color="white"></Circle>}
              w="100%"
              color="black"
            >
              title
            </Button>
            <Button
              justifyContent="flex-start"
              pl="2"
              borderRadius={0}
              bg="none"
              leftIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path
                    d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"
                    fill="var(--gray)"
                  />
                  :
                </svg>
              }
              w="100%"
              color="gray.500"
            >
              Add Solution
            </Button>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const ListSettings = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Button
        justifyContent="flex-start"
        pl="2"
        borderRadius={0}
        bg="none"
        leftIcon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path fill="none" d="M0 0h24v24H0z" />
            <path
              d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15zm-3.847-8.699a2 2 0 1 0 2.646 2.646 4 4 0 1 1-2.646-2.646z"
              fill="var(--blue)"
            />
          </svg>
        }
        w="100%"
        color="gray.500"
      >
        Search
      </Button>
      <Button
        justifyContent="flex-start"
        pl="2"
        borderRadius={0}
        bg="none"
        leftIcon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path fill="none" d="M0 0h24v24H0z" />
            <path
              d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zm1-8h3l-4 4-4-4h3V8h2v4z"
              fill="var(--blue)"
            />
          </svg>
        }
        w="100%"
        color="gray.500"
      >
        Import
      </Button>
      <Button
        pos="absolute"
        bottom="0"
        left="0"
        justifyContent="flex-start"
        pl="2"
        borderRadius={0}
        bg="none"
        leftIcon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path fill="none" d="M0 0h24v24H0z" />
            <path
              d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z"
              fill="var(--blue)"
            />
          </svg>
        }
        w="100%"
        color="gray.500"
      >
        Trash
      </Button>
    </>
  );
};
const TrashComponent = ({ trash }: { trash: WorkspaceList }) => {
  return (
    <div className={styles.trashContainer}>
      <div className={styles.trashListComponent}>
        {trash &&
          trash.quests.map((c, i) => (
            <div key={i} className={styles.listComponent}>
              <div className={styles.listComponentContent}>
                <div className={styles.iconContainer}>
                  <div>{!c.topic ? "" : c.topic[0]}</div>
                </div>
                {c.title || "Untitled"}
              </div>
              <div className="centerDiv">
                <button className={styles.listButton}></button>
                <button className={styles.listButton}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                  >
                    <path fill="none" d="M0 0h24v24H0z" />
                    <path
                      d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-9.414l2.828-2.829 1.415 1.415L13.414 12l2.829 2.828-1.415 1.415L12 13.414l-2.828 2.829-1.415-1.415L10.586 12 7.757 9.172l1.415-1.415L12 10.586z"
                      fill="var(--red)"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        <br />

        {trash &&
          trash.solutions.map((c, i) => (
            <div key={i} className={styles.listComponent}>
              <div className={styles.listComponentContent}>
                <div className={styles.iconContainer}>
                  <div className={styles.topicIcon}>
                    {/* {!c.topic ? "" : c.topic[0]} */}
                  </div>
                </div>
                {c.title || "Untitled"}
              </div>
              <div className="centerDiv">
                <button className={styles.trashButton}></button>
                <button className={styles.trashButton}></button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
const ListComponent = ({
  listComponent,
  deleteListComponent,
  type,
}: {
  listComponent: QuestListComponent | SolutionListComponent;
  deleteListComponent: ({ id }: { id: string }) => void;

  type: "QUEST" | "SOLUTION";
}) => {
  if (type === "QUEST") {
    const questListComponent = listComponent as QuestListComponent;
    return (
      <div className={styles.listComponent}>
        <Link
          className={styles.listComponentContent}
          href={`/workspace/quests/${listComponent.id}`}
        ></Link>
      </div>
    );
  }
  if (type === "SOLUTION") {
    return (
      <div className={styles.listComponent}>
        <Link
          className={styles.listComponentContent}
          href={`/workspace/solutions/${listComponent.id}`}
          key={listComponent.id}
        ></Link>
      </div>
    );
  }
  return <></>;
};
const ListComponentSkeleton = () => {
  return <Box></Box>;
};

export default List;
