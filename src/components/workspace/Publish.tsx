import { Quest, Solution } from "../../types/main";
import { get, update } from "idb-keyval";
import React, {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { z } from "zod";

import Preview from "./Preview";
import styles from "./workspace.module.css";
import { trpc } from "~/utils/api";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
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
} from "@chakra-ui/react";

const Publish = ({
  solutionId,
  questId,
  type,
  questCreatorId,
  isOpen,
  onOpen,
  onClose,
}: {
  solutionId?: string;

  questId?: string;
  questCreatorId?: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  type: "QUEST" | "SOLUTION";
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const QuestAttributesZod = z.object({
    id: z.string(),
    title: z.string(),
    subtopic: z.array(z.string()),
    topic: z.string(),
    content: z.string(),
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
    content: z.string(),
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
      get(questId).then((val) => {
        setQuestOrSolution(val);

        const result = QuestAttributesZod.safeParse(val);

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
      });
    }
    if (type === "SOLUTION" && solutionId) {
      get(solutionId).then((val) => {
        setQuestOrSolution(val);
        const result = SolutionAttributesZod.safeParse(val);

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
      });
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
    if (questId && type === "QUEST") {
      publishQuest.mutate(
        { id: questId },
        {
          onSuccess: () => {
            update(questId, (item) => {
              const value = item as Quest | Solution;

              value.published = true;
              setQuestOrSolution(value);
              return value;
            });
          },
          onError(error, variables, context) {
            setErrorMessage(error.message);
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
            update(solutionId, (item) => {
              const value = item as Quest | Solution;
              value.published = true;
              setQuestOrSolution(value);
              return value;
            });
          },
          onError(error, variables, context) {
            setErrorMessage(error.message);
          },
        }
      );
    }
  };
  return (
    <Center>
      <Button
        w="100%"
        colorScheme="blue"
        mt={3}
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
            {QuestOrSolution?.published ? (
              <Text>PUBLISHED</Text>
            ) : type === "QUEST" ? (
              <>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Confirm Publish
                </AlertDialogHeader>

                <AlertDialogBody>
                  {errorMessage && <Text color="red">{errorMessage}</Text>}
                  You will pay {(QuestOrSolution as Quest)?.reward || 0} for
                  publishing the quest.
                  <Text>
                    Note: Once the publisher viewed the solution, the quest can
                    not be unpublished or deleted.
                  </Text>
                </AlertDialogBody>
              </>
            ) : (
              <></>
            )}

            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={onClose} colorScheme="red">
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
                    <Button
                      colorScheme="green"
                      isDisabled={!!errorMessage}
                      onClick={() => {
                        handlePublish({ questId, solutionId });
                      }}
                    >
                      Publish
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
