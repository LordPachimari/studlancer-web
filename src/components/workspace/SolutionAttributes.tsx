import {
  Solution,
  TransactionQueue,
  UpdateTransaction,
} from "../../types/main";
import { FormEvent, KeyboardEvent, useRef } from "react";

import { WorkspaceStore } from "../../zustand/workspace";
import styles from "./workspace.module.css";
import { Flex, Skeleton } from "@chakra-ui/react";
const SolutionAttributes = ({
  solution,
  updateSolutionAttributesHandler,
}: {
  solution: Solution;
  updateSolutionAttributesHandler: ({
    transactionQueue,
    lastTransaction,
  }: {
    transactionQueue: TransactionQueue;
    lastTransaction: UpdateTransaction;
  }) => void;
}) => {
  const { id } = solution;

  const updateSolutionListAttribute = WorkspaceStore(
    (state) => state.updateSolutionState
  );
  const transactionQueue = WorkspaceStore((state) => state.transactionQueue);
  const titlePlaceholderText = "Write title here";
  const titleRef = useRef<HTMLDivElement>(null);
  const handleTitleChange = (e: FormEvent<HTMLDivElement>) => {
    updateSolutionListAttribute({
      id,
      attribute: "title",
      value: e.currentTarget.textContent as string,
    });

    updateSolutionAttributesHandler({
      transactionQueue,
      lastTransaction: {
        id,
        attribute: "title",
        value: e.currentTarget.textContent as string,
      },
    });
  };

  const handleTitleFocus = () => {
    if (titleRef.current?.firstChild?.nodeType === 1) {
      titleRef.current.firstChild.remove();
      const r = document.createRange();

      r.setStart(titleRef.current, 0);
      r.setEnd(titleRef.current, 0);
      document.getSelection()?.removeAllRanges();
      document.getSelection()?.addRange(r);
    }
  };

  const handleTitleBlur = () => {
    if (titleRef.current?.textContent === "") {
      console.log("uo");
      const placeholder = document.createElement("div");
      placeholder.textContent = titlePlaceholderText;
      placeholder.className = styles.titlePlaceholder!;
      titleRef.current.appendChild(placeholder);
    }
  };
  if (!solution) {
    return <div>No data</div>;
  }
  return (
    <div
      id="title"
      contentEditable
      ref={titleRef}
      className={styles.titleContainer}
      onFocus={handleTitleFocus}
      onBlur={handleTitleBlur}
      suppressContentEditableWarning={true}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Backspace") {
          const title = document.getElementById("title");
          if (
            !title?.childNodes[0]! ||
            title?.childNodes[0]!.textContent === ""
          ) {
            e.preventDefault();
          }
        }
      }}
      onInput={handleTitleChange}
    >
      {solution.title || (
        <div className={styles.titlePlaceholder}>{titlePlaceholderText}</div>
      )}
    </div>
  );
};
export const SolutionAttributesSkeleton = () => {
  return (
    <Flex flexDirection="column" gap={2}>
      <Skeleton height="30px" width="100%" />
    </Flex>
  );
};

export default SolutionAttributes;
