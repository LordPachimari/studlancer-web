import { get, update } from "idb-keyval";
import React, { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
import {
  PublishedQuest,
  PublishedSolution,
  Quest,
  Solution,
} from "../../types/main";
import * as pako from "pako";

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import produce from "immer";
import { trpc } from "~/utils/api";
import Preview from "./Preview";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const Publish = ({
  solutionId,
  questId,
  type,
  questCreatorId,
  isOpen,
  onOpen,
  onClose,
  setQuest,
  setSolution,
  isSaving,
}: {
  solutionId?: string;

  questId?: string;
  questCreatorId?: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isSaving: boolean;
  setQuest?: Dispatch<
    SetStateAction<(Quest & { status?: "OPEN" | "CLOSED" }) | null | undefined>
  >;

  setSolution?: Dispatch<SetStateAction<Solution | null | undefined>>;
  type: "QUEST" | "SOLUTION";
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [isInvalidating, setIsInvalidating] = useState(false);

  const queryClient = useQueryClient();
  const toast = useToast();
  const QuestAttributesZod = z.object({
    id: z.string(),
    title: z.string(),
    subtopic: z.array(z.string()).min(1, { message: "Missing subtopic" }),
    topic: z.string(),
    content: z.instanceof(Uint8Array, { message: "Missing content" }),
    reward: z
      .number()
      .min(1, { message: "Number of diamonds must be greater than 1" }),
    slots: z
      .number()
      .min(1, { message: "Number of slots must be more than 1" })
      .max(100, { message: "Number of slots must be less than 100" }),
    deadline: z.coerce.date().refine(
      (val) => {
        const currentDate = new Date();
        return val > currentDate;
      },
      {
        message: "Deadline must be in the future",
      }
    ),
  });
  const SolutionAttributesZod = z.object({
    id: z.string(),
    title: z.string(),
    content: z.instanceof(Uint8Array),
  });
  const publishQuest = trpc.quest.publishQuest.useMutation();
  const publishSolution = trpc.solution.publishSolution.useMutation();

  const [QuestOrSolution, setQuestOrSolution] = useState<
    Quest | Solution | undefined
  >();
  const cancelRef = React.useRef<any>();
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();

  const validate = () => {
    if (type === "QUEST" && questId) {
      get(questId)
        .then((quest: Quest) => {
          setQuestOrSolution(quest);

          const result = QuestAttributesZod.safeParse(quest);

          if (!result.success) {
            console.log("error", result.error);
            setErrorMessage(
              result.error.issues[0]?.message.startsWith("Required")
                ? `${result.error.issues[0]?.message} ${result.error.issues[0].path}`
                : result.error.issues[0]?.message
                ? result.error.issues[0].message
                : "Please fill all the quest attributes"
            );

            return false;
          }
        })
        .catch((err) => console.log(err));
    }
    if (type === "SOLUTION" && solutionId) {
      get(solutionId)
        .then((solution: Solution) => {
          setQuestOrSolution(solution);
          const result = SolutionAttributesZod.safeParse(solution);

          if (!result.success) {
            console.log("error", result.error.issues);
            setErrorMessage(
              result.error.issues[0]?.message.startsWith("Required")
                ? `${result.error.issues[0]?.message} ${result.error.issues[0].path}`
                : result.error.issues[0]?.message
                ? result.error.issues[0].message
                : "Please fill all the quest attributes"
            );

            return false;
          }
          if (!questId) {
            setErrorMessage("Please, add the target quest to publish to");
            return false;
          }
        })
        .catch((err) => console.log(err));
    }
    return false;
  };

  const handlePublish = ({
    solutionId,
    questId,
  }: {
    solutionId?: string;
    questId?: string;
  }) => {
    const publishedQuestsKey = getQueryKey(trpc.quest.publishedQuests);
    const publishedQuestKey = getQueryKey(trpc.quest.publishedQuest);
    const workspaceQuestKey = getQueryKey(trpc.quest.workspaceQuest);

    const solversKey = getQueryKey(trpc.quest.solvers);
    const workspaceSolutionKey = getQueryKey(trpc.solution.workspaceSolution);
    if (questId && type === "QUEST") {
      publishQuest.mutate(
        { id: questId },
        {
          onSuccess: () => {
            setIsInvalidating(true);
            update<(Quest & { status: "OPEN" | "CLOSED" }) | undefined>(
              questId,
              (value) => {
                if (value) {
                  value.published = true;
                  value.status = "OPEN";
                  if (setQuest) {
                    setQuest(value);
                  }
                  return value;
                }
              }
            ).catch((err) => console.log(err));
            Promise.all([
              queryClient.invalidateQueries({
                queryKey: workspaceQuestKey,
              }),
              queryClient.invalidateQueries({
                queryKey: publishedQuestsKey,
              }),
            ])
              .then(() => {
                onClose();
                toast({
                  title: "Quest uploaded successfully",
                  status: "success",
                  isClosable: true,
                });
              })
              .catch((err) => {
                console.log("error invalidating");
              })
              .finally(() => setIsInvalidating(false));
          },
          onError(error, variables, context) {
            setErrorMessage(error.message);
            toast({
              title: "Quest failed to upload",
              status: "error",
              isClosable: true,
            });
          },
        }
      );
    }
    if (solutionId && type === "SOLUTION" && questId && questCreatorId) {
      publishSolution.mutate(
        {
          id: solutionId,
          questCreatorId,
          questId,
        },
        {
          onSuccess: () => {
            setIsInvalidating(true);
            update<Solution | undefined>(solutionId, (value) => {
              if (value) {
                value.published = true;

                if (setSolution) {
                  setSolution(value);
                }
                return value;
              }
            }).catch((err) => console.log(err));
            Promise.all([
              queryClient.invalidateQueries({
                queryKey: workspaceSolutionKey,
              }),
              queryClient.invalidateQueries({
                queryKey: solversKey,
              }),
            ])
              .then(() => {
                onClose();
                toast({
                  title: "Solution uploaded successfully",
                  status: "success",
                  isClosable: true,
                });
              })
              .catch((err) => {
                console.log("error invalidating");
              })
              .finally(() => setIsInvalidating(false));
          },
          onError(error, variables, context) {
            setErrorMessage(error.message);
            toast({
              title: "Solution failed to upload",
              status: "error",
              isClosable: true,
            });
          },
        }
      );
    }
  };
  console.log("isSaving", isSaving);

  return (
    <Center>
      <Button
        w="100%"
        colorScheme="blue"
        mt={3}
        isLoading={isSaving}
        onClick={() => {
          onOpen();

          validate();
          setErrorMessage(undefined);
        }}
      >
        Publish
      </Button>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            {type === "QUEST" && QuestOrSolution ? (
              <>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Confirm Publish
                </AlertDialogHeader>

                <AlertDialogBody>
                  {errorMessage && <Text color="red">{errorMessage}</Text>}
                  You will pay {(QuestOrSolution as Quest)?.reward || 0}{" "}
                  diamonds for publishing the quest.
                  <Text fontWeight="bold">
                    Note: Once publisher viewed the solution, quest can not be
                    unpublished or deleted.
                  </Text>
                </AlertDialogBody>
              </>
            ) : (
              <>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Confirm Publish
                </AlertDialogHeader>

                <AlertDialogBody>
                  {errorMessage && <Text color="red">{errorMessage}</Text>}
                </AlertDialogBody>
              </>
            )}

            <AlertDialogFooter gap={2}>
              <Button
                ref={cancelRef}
                onClick={onClose}
                isDisabled={publishQuest.isLoading || isInvalidating}
                colorScheme="red"
              >
                Close
              </Button>

              <Spacer />
              <Button
                colorScheme="gray"
                onClick={() => {
                  onPreviewOpen();
                }}
              >
                Preview
              </Button>
              <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="2xl">
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Preview</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    {type === "QUEST" ? (
                      <Preview
                        quest={QuestOrSolution}
                        content={QuestOrSolution?.content}
                        type="QUEST"
                      />
                    ) : (
                      <Preview
                        solution={QuestOrSolution}
                        content={QuestOrSolution?.content}
                        type="SOLUTION"
                      />
                    )}
                  </ModalBody>

                  <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={onPreviewClose}>
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
              <Button
                colorScheme="green"
                onClick={() => {
                  handlePublish({ questId, solutionId });
                }}
                isDisabled={!!errorMessage}
                isLoading={
                  publishQuest.isLoading ||
                  publishSolution.isLoading ||
                  isInvalidating
                }
              >
                Publish
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Center>
  );
};
export default Publish;
