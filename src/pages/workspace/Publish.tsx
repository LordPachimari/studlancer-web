import { Quest, Solution } from "../../types/main";
import { get, update } from "idb-keyval";
import React, { useCallback, useState } from "react";
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
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

const Publish = ({
  solutionId,
  questId,
  type,
  questCreatorId,
}: {
  solutionId?: string;
  questId?: string;
  questCreatorId?: string;

  type: "QUEST" | "SOLUTION";
}) => {
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [QuestOrSolution, setQuestOrSolution] = useState<
    Quest | Solution | undefined
  >();
  const cancelRef = React.useRef();
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();

  const validate = useCallback(() => {
    setErrorMessage(undefined);
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

          return;
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

          return;
        }
      });
    }
  }, []);
  const handlePublish = ({
    solutionId,
    questId,
  }: {
    solutionId?: string;
    questId?: string;
  }) => {
    if (questId && type === "QUEST") {
      publishQuest.mutate({ id: questId });

      update(questId, (item) => {
        const value = item as Quest | Solution;

        value.published = true;
        setQuestOrSolution(value);
        return value;
      });
    }
    if (solutionId && type === "SOLUTION" && questId && questCreatorId) {
      publishSolution.mutate({
        id: solutionId,
        questCreatorId,
        questId,
      });
      update(solutionId, (item) => {
        const value = item as Quest | Solution;
        value.published = true;
        setQuestOrSolution(value);
        return value;
      });
    }
  };
  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          {QuestOrSolution?.published ? (
            <Text>PUBLISHED</Text>
          ) : QuestOrSolution?.type === "QUEST" ? (
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

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="gray.200">Preview</Button>
            <Modal isOpen={isPreviewOpen} onClose={onPreviewClose}>
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
                  <Button colorScheme="blue" mr={3} onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    colorScheme="green"
                    disabled={!!errorMessage}
                    onClick={() => handlePublish({ questId, solutionId })}
                  >
                    Publish
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
            <Button colorScheme="blue" onClick={validate} ml={3}>
              Publish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
export default Publish;
