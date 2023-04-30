import { del, get, set, update } from "idb-keyval";
import {
  Quest,
  QuestListComponent,
  Solution,
  SolutionListComponent,
  Versions,
  WorkspaceList,
} from "../../types/main";
// import Link from "next/link";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Circle,
  Divider,
  Flex,
  FormControl,
  IconButton,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import produce from "immer";
import debounce from "lodash.debounce";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { ulid } from "ulid";
import { trpc } from "~/utils/api";
import { TopicColor } from "~/utils/topicsColor";
import { WorkspaceStore } from "../../zustand/workspace";
import { storeQuestOrSolution } from "./Actions";
import styles from "./workspace.module.css";
const List = ({
  showList,
  toggleShowList,
  userId,
}: {
  showList: boolean;
  toggleShowList: React.Dispatch<React.SetStateAction<boolean>>;
  userId: string;
}) => {
  const emptyLists: {}[] = [];
  for (let i = 0; i < 3; i++) {
    emptyLists.push({});
  }
  const router = useRouter();
  const createQuest = trpc.quest.createQuest.useMutation();
  const createSolution = trpc.solution.createSolution.useMutation();

  const queryClient = useQueryClient();
  const listKey = getQueryKey(trpc.workspace.workspaceList);
  const serverWorkspaceList = trpc.workspace.workspaceList.useQuery(undefined, {
    staleTime: 10 * 60 * 3000,
  });
  console.log("list", serverWorkspaceList.data);
  const workspaceListState = WorkspaceStore((state) => state.workspaceList);
  const deleteQuest = trpc.quest.deleteQuest.useMutation();
  const deleteSolution = trpc.solution.deleteSolution.useMutation();
  const deleteQuestPermanently =
    trpc.quest.deleteQuestPermanently.useMutation();
  const deleteSolutionPermanently =
    trpc.solution.deleteSolutionPermanently.useMutation();

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
  const [trash, setTrash] = useState<{
    quests: QuestListComponent[];
    solutions: SolutionListComponent[];
  }>({
    quests: [],
    solutions: [],
  });
  const {
    isOpen: isOpenTrashModal,
    onOpen: onOpenTrashModal,
    onClose: onCloseTrashModal,
  } = useDisclosure();
  const toast = useToast();
  //deleteQuest deletes quest in local storage and the server (not actually deletes but marks as inTrash)
  const deleteListComponent = ({ id }: { id: string }) => {
    const lastUpdated = new Date().toISOString();
    get(id)
      .then((component: Quest | Solution) => {
        if (component.published) {
          toast({
            title: "Not allowed",
            description: "Unpublish the quest before deletion",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        if (component.type === "QUEST") {
          const quest = component satisfies Quest;
          if (quest && (quest.title || quest.content)) {
            //saving quest if content exist
            deleteQuest.mutate(
              { id: quest.id, lastUpdated },
              {
                onSuccess: () => {
                  deleteQuestOrSolution({ id, type: "QUEST" });
                  setTrash(
                    produce((trash) => {
                      const _component = structuredClone(component);
                      _component.lastUpdated = lastUpdated;
                      trash.quests.push(_component);
                    })
                  );

                  del(id).catch((err) => console.log(err));
                  localStorage.removeItem(id);

                  queryClient
                    .invalidateQueries(listKey)
                    .catch((err) => console.log(err));
                },
              }
            );
          } else {
            deleteQuestPermanently.mutate(
              { id: quest.id },
              {
                onSuccess: () => {
                  deleteQuestOrSolution({ id, type: "QUEST" });
                  setTrash(
                    produce((trash) => {
                      trash.quests.push(component);
                    })
                  );

                  del(id).catch((err) => console.log(err));
                  localStorage.removeItem(id);

                  queryClient
                    .invalidateQueries(listKey)
                    .catch((err) => console.log(err));
                },
              }
            );
          }
        } else if (component.type === "SOLUTION") {
          const solution = component satisfies Solution;
          if (solution && (solution.title || solution.content)) {
            //saving solution if content exist
            deleteSolution.mutate(
              { id: solution.id, lastUpdated },
              {
                onSuccess: () => {
                  deleteQuestOrSolution({ id, type: "SOLUTION" });
                  setTrash(
                    produce((trash) => {
                      const _component = structuredClone(component);
                      _component.lastUpdated = lastUpdated;
                      trash.quests.push(_component);
                    })
                  );

                  del(id).catch((err) => console.log(err));
                  localStorage.removeItem(id);

                  queryClient
                    .invalidateQueries(listKey)
                    .catch((err) => console.log(err));
                },
              }
            );
            //791038091
          } else {
            deleteSolutionPermanently.mutate(
              { id: solution.id },
              {
                onSuccess: () => {
                  deleteQuestOrSolution({ id, type: "SOLUTION" });
                  setTrash(
                    produce((trash) => {
                      trash.quests.push(component);
                    })
                  );

                  del(id).catch((err) => console.log(err));

                  localStorage.removeItem(id);

                  queryClient
                    .invalidateQueries(listKey)
                    .catch((err) => console.log(err));
                },
              }
            );
          }
        }
        update<Quest | Solution | undefined>(id, (item) => {
          if (item) {
            item.inTrash = true;
            return item;
          }
        }).catch((err) => console.log(err));
        localStorage.removeItem(id);
        if (router.query.id === id) {
          void router.push("/workspace");
        }
      })
      .catch((err) => console.log(err));
  };

  // const restoreQuest = ({ id }: { id: string }) => {
  //   //fetch the quest from the server and push it to the list.
  // };
  const createQuestOrSolutionHandler = ({
    type,
  }: {
    type: "QUEST" | "SOLUTION";
  }) => {
    const createdAt = new Date().toISOString();
    if (type === "QUEST") {
      const id = ulid();

      createQuest.mutate(
        { id, createdAt },
        {
          onSuccess: () => {
            createQuestOrSolutionState({ id, type: "QUEST", userId });
            storeQuestOrSolution({ id, type: "QUEST", userId, createdAt });

            queryClient
              .invalidateQueries(listKey)
              .catch((err) => console.log(err));
            if (!router.query.id) {
              void router.push(`/workspace/quests/${id}`);
            }
          },
        }
      );

      if (router.query.id) {
        void router.push(`/workspace/quests/${id}`, undefined, {
          shallow: true,
        });
      }
    } else if (type === "SOLUTION") {
      const id = ulid();

      createSolution.mutate(
        { id, createdAt },
        {
          onSuccess: () => {
            createQuestOrSolutionState({ id, type: "SOLUTION", userId });

            storeQuestOrSolution({ id, type: "SOLUTION", userId, createdAt });

            queryClient
              .invalidateQueries(listKey)
              .catch((err) => console.log(err));
            if (!router.query.id) {
              void router.push(`/workspace/solutions/${id}`);
            }
          },
        }
      );
      if (router.query.id) {
        void router.push(`/workspace/solutions/${id}`, undefined, {
          shallow: true,
        });
      }
    }
  };

  useEffect(() => {
    if (serverWorkspaceList.data) {
      const nonDeletedQuests: Quest[] = [];
      const nonDeletedSolutions: Solution[] = [];
      const deletedQuests: Quest[] = [];
      const deletedSolutions: Solution[] = [];
      serverWorkspaceList.data.quests.forEach((quest) => {
        if (quest.inTrash) {
          deletedQuests.push(quest);
        } else {
          nonDeletedQuests.push(quest);
        }
      });
      serverWorkspaceList.data.solutions.forEach((solution) => {
        if (solution.inTrash) {
          deletedSolutions.push(solution);
        } else {
          nonDeletedSolutions.push(solution);
        }
      });

      nonDeletedQuests.forEach((q) => {
        const questVersion = JSON.parse(
          localStorage.getItem(q.id) as string
        ) as Versions | null;
        if (questVersion) {
          const updatedVersions: Versions = {
            server: q.lastUpdated,
            local: questVersion.local,
          };

          localStorage.setItem(q.id, JSON.stringify(updatedVersions));
        }
      });
      nonDeletedSolutions.forEach((s) => {
        const solutionVersion = JSON.parse(
          localStorage.getItem(s.id) as string
        ) as Versions | null;
        if (solutionVersion) {
          const updatedVersions: Versions = {
            server: s.lastUpdated,
            local: solutionVersion.local,
          };

          localStorage.setItem(s.id, JSON.stringify(updatedVersions));
        }
      });

      setWorkspaceListState({
        quests: nonDeletedQuests,
        solutions: nonDeletedSolutions,
      });
      setTrash({
        quests: deletedQuests,
        solutions: deletedSolutions,
      });
    }
  }, [serverWorkspaceList.data, setWorkspaceListState]);

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
        <Button
          // pos="absolute"
          // bottom="0"
          // left="0"
          justifyContent="flex-start"
          pl="2"
          borderRadius={0}
          bg="none"
          onClick={onOpenTrashModal}
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
        <TrashComponent
          isOpen={isOpenTrashModal}
          onOpen={onOpenTrashModal}
          onClose={onCloseTrashModal}
          trash={trash}
          setTrash={setTrash}
          workspaceListState={workspaceListState}
          setWorkspaceListState={setWorkspaceListState}
        />
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
            {serverWorkspaceList.isLoading
              ? emptyLists.map((l, i) => (
                  <Flex key={i} alignItems="center" gap={2} p="2">
                    <SkeletonCircle size="7" />
                    <Skeleton height="15px" w="52" />
                  </Flex>
                ))
              : !workspaceListState.quests
              ? null
              : workspaceListState.quests.map((q) => (
                  <ListComponent
                    type="QUEST"
                    key={q.id}
                    listComponent={q}
                    deleteListComponent={deleteListComponent}
                    isQuestLoading={
                      (deleteQuest.isLoading &&
                        !!deleteQuest.variables &&
                        deleteQuest.variables.id === q.id) ||
                      (deleteQuestPermanently.isLoading &&
                        !!deleteQuestPermanently.variables &&
                        deleteQuestPermanently.variables.id === q.id)
                    }
                  />
                ))}
            <Button
              justifyContent="flex-start"
              pl="2"
              borderRadius={0}
              bg="none"
              onClick={() => createQuestOrSolutionHandler({ type: "QUEST" })}
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
              isLoading={createQuest.isLoading}
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
            {serverWorkspaceList.isLoading
              ? emptyLists.map((l, i) => (
                  <Flex key={i} alignItems="center" gap={2} p="2">
                    <SkeletonCircle size="7" />
                    <Skeleton height="15px" w="52" />
                  </Flex>
                ))
              : !workspaceListState.solutions
              ? null
              : workspaceListState.solutions.map((s) => (
                  <ListComponent
                    type="SOLUTION"
                    key={s.id}
                    listComponent={s}
                    deleteListComponent={deleteListComponent}
                    isSolutionLoading={
                      (deleteSolution.isLoading &&
                        !!deleteSolution.variables &&
                        deleteSolution.variables.id === s.id) ||
                      (deleteSolutionPermanently.isLoading &&
                        !!deleteSolutionPermanently.variables &&
                        deleteSolutionPermanently.variables.id === s.id)
                    }
                  />
                ))}

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
              onClick={() => createQuestOrSolutionHandler({ type: "SOLUTION" })}
              isLoading={createSolution.isLoading}
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
  const {
    isOpen: isOpenSearchModal,
    onOpen: onOpenSearchModal,
    onClose: onCloseSearchModal,
  } = useDisclosure();

  return (
    <>
      {/* <Button
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
        onClick={onOpenSearchModal}
      >
        Search
      </Button> */}
      {/* <SearchComponent
        onClose={onCloseSearchModal}
        isOpen={isOpenSearchModal}
        onOpen={onOpenSearchModal}
      /> */}
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
      {children}
    </>
  );
};
const TrashComponent = ({
  trash,
  onClose,
  onOpen,
  isOpen,
  setTrash,
  workspaceListState,
  setWorkspaceListState,
}: {
  trash: WorkspaceList;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  workspaceListState: WorkspaceList;
  setWorkspaceListState: ({
    quests,
    solutions,
  }: {
    quests?: QuestListComponent[] | undefined;
    solutions?: SolutionListComponent[] | undefined;
  }) => void;

  setTrash: React.Dispatch<
    React.SetStateAction<{
      quests: QuestListComponent[];
      solutions: SolutionListComponent[];
    }>
  >;
}) => {
  const initialRef = React.useRef(null);

  const deleteQuestPermanently =
    trpc.quest.deleteQuestPermanently.useMutation();
  const deleteSolutionPermanently =
    trpc.solution.deleteSolutionPermanently.useMutation();
  const restoreQuest = trpc.quest.restoreQuest.useMutation();
  const restoreSolution = trpc.solution.restoreSolution.useMutation();
  const listKey = getQueryKey(trpc.workspace.workspaceList);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [QuestOrSolutionList, setQuestOrSolutionList] = useState<WorkspaceList>(
    { quests: [], solutions: [] }
  );
  useEffect(() => {
    const _trash = structuredClone(trash);
    _trash.quests.sort((a, b) => {
      if (new Date(a.lastUpdated) > new Date(b.lastUpdated)) {
        return -1;
      }
      if (new Date(a.lastUpdated) < new Date(b.lastUpdated)) {
        return 1;
      }
      // a must be equal to b
      return 0;
    });
    _trash.solutions.sort((a, b) => {
      if (new Date(a.lastUpdated) > new Date(b.lastUpdated)) {
        return -1;
      }

      if (new Date(a.lastUpdated) < new Date(b.lastUpdated)) {
        return 1;
      }
      // a must be equal to b
      return 0;
    });
    setQuestOrSolutionList(_trash);
  }, [trash]);

  const searchText = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);

    setQuestOrSolutionList({
      quests: [],
      solutions: [],
    });
    if (!e.target.value.trim()) {
      setQuestOrSolutionList(trash);
      return;
    }

    const filteredQuests = trash.quests.filter(
      (value) =>
        value.type === "QUEST" &&
        value.title &&
        value.title?.search(e.target.value) > -1
    );

    const filteredSolution = trash.solutions.filter(
      (value) =>
        value.type === "SOLUTION" &&
        value.title &&
        value.title?.search(e.target.value) > -1
    );

    setQuestOrSolutionList({
      quests: filteredQuests,
      solutions: filteredSolution,
    });
  }, 500);

  return (
    <Modal initialFocusRef={initialRef} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="blue.50">
        <ModalHeader>Trash</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <Input
              ref={initialRef}
              placeholder="Search by title..."
              onInput={searchText}
              bg="white"
            />
          </FormControl>

          {QuestOrSolutionList &&
            QuestOrSolutionList.quests.map((q) => (
              <Flex
                mt={2}
                _hover={{ borderWidth: "2px", borderColor: "blue.100" }}
                pl="2"
                borderRadius={4}
                bg="none"
                w="100%"
                h="10"
                color="black"
                key={q.id}
                gap={2}
                alignItems="center"
                onClick={() => console.log(q.id)}
              >
                <Circle
                  size="24px"
                  borderWidth="1px"
                  borderColor="black"
                  bg={q.topic ? TopicColor({ topic: q.topic }) : "white"}
                ></Circle>
                <Text
                  fontSize="md"
                  fontWeight="semibold"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {q.title || "Untitled"}
                </Text>
                <Spacer />
                <IconButton
                  size="sm"
                  aria-label="restore"
                  bg="blue.100"
                  _hover={{ bg: "blue.200" }}
                  isLoading={
                    restoreQuest.isLoading &&
                    !!restoreQuest.variables &&
                    restoreQuest.variables.id === q.id
                  }
                  onClick={() => {
                    restoreQuest.mutate(
                      { id: q.id },
                      {
                        onSuccess: (data: Quest | undefined) => {
                          setTrash(
                            produce((trash) => {
                              const filteredQuests = trash.quests.filter(
                                (v) => v.id !== q.id
                              );
                              trash.quests = filteredQuests;
                            })
                          );
                          queryClient
                            .invalidateQueries(listKey)
                            .then(() => {
                              if (data) {
                                set(data.id, data).catch((err) =>
                                  console.log(err)
                                );
                                questList.push({
                                  id: data.id,
                                  inTrash: data.inTrash,
                                  lastUpdated: data.lastUpdated,
                                  type: "QUEST",
                                  title: data.title,
                                  topic: data.topic,
                                });
                                questList.sort((a, b) => {
                                  if (a.id < b.id) {
                                    return -1;
                                  }
                                  if (a.id > b.id) {
                                    return 1;
                                  }
                                  // a must be equal to b
                                  return 0;
                                });
                                setWorkspaceListState({ quests: questList });
                                toast({
                                  status: "success",
                                  title: "Quest successfuly restored!",
                                  duration: 5000,
                                  isClosable: true,
                                });

                                onClose();
                              }
                            })
                            .catch((err) => console.log(err));

                          const questList = structuredClone(
                            workspaceListState.quests
                          );
                        },
                        onError: () => {
                          toast({
                            status: "error",
                            title: "Error in restoring the quest!",
                            duration: 5000,
                            isClosable: true,
                          });

                          onClose();
                        },
                      }
                    );
                  }}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path
                        d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z"
                        fill="var(--blue)"
                      />
                    </svg>
                  }
                ></IconButton>

                <IconButton
                  mr={1}
                  size="sm"
                  aria-label="permanently delete"
                  isLoading={
                    deleteQuestPermanently.isLoading &&
                    !!deleteQuestPermanently.variables &&
                    deleteQuestPermanently.variables.id === q.id
                  }
                  onClick={() => {
                    deleteQuestPermanently.mutate(
                      { id: q.id },
                      {
                        onSuccess: () => {
                          const filteredQuests = trash.quests.filter(
                            (item) => item.id !== q.id
                          );

                          setTrash((trash) => {
                            return {
                              solutions: trash.solutions,
                              quests: filteredQuests,
                            };
                          });
                          queryClient
                            .invalidateQueries(listKey)
                            .catch((err) => console.log(err));
                        },
                      }
                    );
                  }}
                  bg="blue.100"
                  _hover={{ bg: "blue.200" }}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path
                        d="M7 4V2h10v2h5v2h-2v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6H2V4h5zM6 6v14h12V6H6zm3 3h2v8H9V9zm4 0h2v8h-2V9z"
                        fill="var(--blue)"
                      />
                    </svg>
                  }
                ></IconButton>
              </Flex>
            ))}

          {QuestOrSolutionList &&
            QuestOrSolutionList.solutions.map((s) => (
              <Flex
                mt={2}
                borderWidth="1px"
                borderColor="blue"
                pl="2"
                borderRadius={4}
                bg="none"
                w="100%"
                color="black"
                key={s.id}
                alignItems="center"
              >
                <Text
                  fontSize="md"
                  fontWeight="semibold"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {s.title || "Untitled"}
                </Text>

                <Spacer />
                <IconButton
                  size="sm"
                  aria-label="restore"
                  bg="blue.100"
                  _hover={{ bg: "blue.200" }}
                  isLoading={
                    restoreSolution.isLoading &&
                    !!restoreSolution.variables &&
                    restoreSolution.variables.id === s.id
                  }
                  onClick={() => {
                    restoreSolution.mutate(
                      { id: s.id },
                      {
                        onSuccess: (data: Solution | undefined) => {
                          setTrash(
                            produce((trash) => {
                              const filteredSolutions = trash.solutions.filter(
                                (v) => v.id !== s.id
                              );
                              trash.solutions = filteredSolutions;
                            })
                          );
                          queryClient
                            .invalidateQueries(listKey)
                            .then(() => {
                              if (data) {
                                set(data.id, data).catch((err) =>
                                  console.log(err)
                                );
                                solutionList.push({
                                  id: data.id,
                                  inTrash: data.inTrash,
                                  lastUpdated: data.lastUpdated,
                                  type: "SOLUTION",
                                  title: data.title || "",
                                });
                                solutionList.sort((a, b) => {
                                  if (a.id < b.id) {
                                    return -1;
                                  }
                                  if (a.id > b.id) {
                                    return 1;
                                  }
                                  // a must be equal to b
                                  return 0;
                                });
                                setWorkspaceListState({
                                  solutions: solutionList,
                                });
                                toast({
                                  status: "success",
                                  title: "Solution successfuly restored!",
                                  duration: 5000,
                                  isClosable: true,
                                });

                                onClose();
                              }
                            })
                            .catch((err) => console.log(err));

                          const solutionList = structuredClone(
                            workspaceListState.solutions
                          );
                        },
                        onError: () => {
                          toast({
                            status: "error",
                            title: "Error in restoring the solution!",
                            duration: 5000,
                            isClosable: true,
                          });

                          onClose();
                        },
                      }
                    );
                  }}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path
                        d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z"
                        fill="var(--blue)"
                      />
                    </svg>
                  }
                ></IconButton>

                <IconButton
                  mr={1}
                  size="sm"
                  aria-label="delete permanently"
                  isLoading={
                    deleteSolutionPermanently.isLoading &&
                    !!deleteSolutionPermanently.variables &&
                    deleteSolutionPermanently.variables.id === s.id
                  }
                  onClick={() => {
                    deleteSolutionPermanently.mutate(
                      { id: s.id },
                      {
                        onSuccess: () => {
                          const filteredSolutions =
                            QuestOrSolutionList.solutions.filter(
                              (item) => item.id !== s.id
                            );

                          setTrash((trash) => {
                            return {
                              quests: trash.quests,
                              solutions: filteredSolutions,
                            };
                          });
                          queryClient
                            .invalidateQueries(listKey)
                            .catch((err) => console.log(err));
                        },
                      }
                    );
                  }}
                  bg="blue.100"
                  _hover={{ bg: "blue.200" }}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path
                        d="M7 4V2h10v2h5v2h-2v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6H2V4h5zM6 6v14h12V6H6zm3 3h2v8H9V9zm4 0h2v8h-2V9z"
                        fill="var(--blue)"
                      />
                    </svg>
                  }
                ></IconButton>
              </Flex>
            ))}
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} colorScheme="blue">
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
// <Link
//         href={`/workspace/quests/${questListComponent.id}`}
//       ></Link>

const ListComponent = ({
  listComponent,
  deleteListComponent,
  type,
  isQuestLoading,
  isSolutionLoading,
}: {
  listComponent: QuestListComponent | SolutionListComponent;
  deleteListComponent: ({ id }: { id: string }) => void;
  isQuestLoading?: boolean;
  isSolutionLoading?: boolean;

  type: "QUEST" | "SOLUTION";
}) => {
  if (type === "QUEST") {
    const questListComponent = listComponent satisfies QuestListComponent;
    return (
      <Flex
        pl="2"
        borderRadius={0}
        bg="none"
        w="100%"
        h="10"
        color="black"
        gap={2}
        alignItems="center"
        _hover={{
          bg: "gray.100",
        }}
        opacity={isQuestLoading ? "50%" : "100%"}
      >
        <Link
          width="100%"
          href={`/workspace/quests/${questListComponent.id}`}
          as={NextLink}
          display="flex"
          gap={2}
          _hover={{
            textDecor: "none",
          }}
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          alignItems="center"
        >
          {isQuestLoading ? (
            <Spinner size="xs" colorScheme="gray" />
          ) : (
            <Circle
              size="24px"
              bg={
                questListComponent.topic
                  ? TopicColor({ topic: questListComponent.topic })
                  : "gray.100"
              }
              color="black"
              fontWeight="bold"
            >
              {questListComponent.topic && questListComponent.topic[0]}
            </Circle>
          )}

          <Text
            fontSize="md"
            fontWeight="semibold"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {questListComponent.title || "Untitled"}
          </Text>
        </Link>

        <Spacer />

        <Menu>
          <MenuButton
            bg="none"
            _hover={{
              bg: "gray.200",
            }}
            borderRadius="sm"
            as={Button}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M12 3c-.825 0-1.5.675-1.5 1.5S11.175 6 12 6s1.5-.675 1.5-1.5S12.825 3 12 3zm0 15c-.825 0-1.5.675-1.5 1.5S11.175 21 12 21s1.5-.675 1.5-1.5S12.825 18 12 18zm0-7.5c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5-.675-1.5-1.5-1.5z"
                fill="var(--blue)"
              />
            </svg>
          </MenuButton>
          <MenuList>
            {/* <MenuItem>{"Duplicate (in progress)"} </MenuItem> */}
            <MenuItem
              onClick={() => deleteListComponent({ id: questListComponent.id })}
            >
              {"Delete"}
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    );
  }
  if (type === "SOLUTION") {
    const SolutionListComponent = listComponent satisfies SolutionListComponent;
    return (
      <Flex
        pl="2"
        borderRadius={0}
        bg="none"
        w="100%"
        h="10"
        color="black"
        gap={2}
        alignItems="center"
        _hover={{
          bg: "gray.100",
        }}
        className="listComponent"
        opacity={isSolutionLoading ? "50%" : "100%"}
      >
        <Link
          width="100%"
          as={NextLink}
          gap={2}
          display="flex"
          _hover={{
            textDecor: "none",
          }}
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          alignItems="center"
          href={`/workspace/solutions/${listComponent.id}`}
        >
          {isSolutionLoading ? (
            <Spinner size="xs" colorScheme="gray" />
          ) : (
            <Circle
              size="24px"
              bg={
                listComponent.topic
                  ? TopicColor({ topic: listComponent.topic })
                  : "gray.100"
              }
              color="black"
              fontWeight="bold"
            >
              {listComponent.topic && listComponent.topic[0]}
            </Circle>
          )}

          <Text
            fontSize="md"
            fontWeight="semibold"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {SolutionListComponent.title || "Untitled"}
          </Text>
        </Link>

        <Spacer />

        <Menu>
          <MenuButton
            bg="none"
            _hover={{
              bg: "gray.200",
            }}
            borderRadius="sm"
            className="actionButton"
            as={Button}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M12 3c-.825 0-1.5.675-1.5 1.5S11.175 6 12 6s1.5-.675 1.5-1.5S12.825 3 12 3zm0 15c-.825 0-1.5.675-1.5 1.5S11.175 21 12 21s1.5-.675 1.5-1.5S12.825 18 12 18zm0-7.5c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5-.675-1.5-1.5-1.5z"
                fill="var(--blue)"
              />
            </svg>
          </MenuButton>
          <MenuList transition="none">
            {/* <MenuItem>{"Duplicate (in progress)"} </MenuItem> */}
            <MenuItem
              onClick={() =>
                deleteListComponent({ id: SolutionListComponent.id })
              }
            >
              {"Delete"}
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    );
  }
  return <></>;
};

export default List;
