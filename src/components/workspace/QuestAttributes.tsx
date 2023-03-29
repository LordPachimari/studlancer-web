import { ChangeEvent, FormEvent, KeyboardEvent, useRef } from "react";
import {
  Quest,
  TopicsType,
  TransactionQueue,
  UpdateTransaction,
} from "../../types/main";

import {
  Badge,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { WorkspaceStore } from "../../zustand/workspace";
import styles from "./workspace.module.css";

const Title = ({
  title,
  handleTitleChange,
}: {
  title: string | undefined;
  handleTitleChange: (e: FormEvent<HTMLDivElement>) => void;
}) => {
  const titlePlaceholderText = "Write title here";
  const titleRef = useRef<HTMLDivElement>(null);

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
          console.log("backspace called");
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
      {title || (
        <div className={styles.titlePlaceholder}>{titlePlaceholderText}</div>
      )}
    </div>
  );
};
const TopicSelect = ({
  handleTopicChange,
  topic,
}: {
  topic?: TopicsType;
  handleTopicChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}) => {
  return (
    <Select
      size="sm"
      placeholder="Select topic"
      bg={
        topic?.toUpperCase() === "BUSINESS"
          ? "green.100"
          : topic === "PROGRAMMING"
          ? "purple.100"
          : topic === "MARKETING"
          ? "red.100"
          : topic === "VIDEOGRAPHY"
          ? "blue.100"
          : "none"
      }
      w="40"
      onChange={handleTopicChange}
      defaultValue={topic}
    >
      <option value="VIDEOGRAPHY">Business</option>
      <option value="PROGRAMMING">Programming</option>
      <option value="MARKETING">Marketing</option>
    </Select>
  );
};

const Subtopic = ({
  subtopic,
  handleSubtopicChange,
}: {
  subtopic: string[] | undefined;
  handleSubtopicChange: () => void;
}) => {
  const subtopicRef = useRef<HTMLDivElement>(null);

  const subtopicPlaceholderText = "Write subtopics and type , for styling";

  const handleSubtopicFocus = () => {
    if (
      subtopicRef.current?.childElementCount === 1 &&
      subtopicRef.current?.firstChild?.nodeType === 1 &&
      subtopicRef.current.firstChild.textContent === subtopicPlaceholderText
    ) {
      subtopicRef.current.firstChild.remove();
      const r = document.createRange();

      r.setStart(subtopicRef.current, 0);
      r.setEnd(subtopicRef.current, 0);
      document.getSelection()?.removeAllRanges();
      document.getSelection()?.addRange(r);
    }
  };
  const handleSubtopicBlur = () => {
    console.log(
      "checking",
      subtopicRef.current?.childElementCount === 0,
      subtopicRef.current?.textContent === ""
    );
    if (
      subtopicRef.current?.childElementCount === 0 &&
      subtopicRef.current?.textContent === ""
    ) {
      const placeholder = document.createElement("div");
      placeholder.textContent = subtopicPlaceholderText;
      placeholder.className = styles.subtopicPlaceholder!;
      subtopicRef.current.appendChild(placeholder);
    }
  };
  return (
    <div
      id="subtopic"
      contentEditable
      ref={subtopicRef}
      className={styles.subtopicContainer}
      suppressContentEditableWarning={true}
      onFocus={handleSubtopicFocus}
      onBlur={handleSubtopicBlur}
      onInput={(e) => {
        const content = document.getElementById("subtopic");
        const text =
          content?.childNodes[content.childNodes.length - 1]?.textContent;

        if (text && text.includes(",")) {
          const subtopic = text.split(",");
          content.removeChild(content.lastChild!);
          const div = document.createElement("div");
          const div2 = document.createElement("div");

          div2.innerHTML = "";
          div.className = styles.subtopicBadge!;
          div2.className = styles.subtopicBadge!;
          div.textContent = subtopic[0]!;
          content.appendChild(div);
          content.appendChild(div2);

          const r = document.createRange();
          r.setStart(div2, 0);
          r.setEnd(div2, 0);
          document.getSelection()?.removeAllRanges();
          document.getSelection()?.addRange(r);
        }
        handleSubtopicChange();
      }}
    >
      {subtopic ? (
        subtopic.map((s, i) => (
          <div className={styles.subtopicBadge} key={i}>
            {s}
          </div>
        ))
      ) : (
        <div className={styles.subtopicPlaceholder}>
          {subtopicPlaceholderText}
        </div>
      )}
    </div>
  );
};
const Reward = ({
  reward,
  handleRewardChange,
}: {
  reward: number | undefined;
  handleRewardChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <InputGroup gap={2}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M4.873 3h14.254a1 1 0 0 1 .809.412l3.823 5.256a.5.5 0 0 1-.037.633L12.367 21.602a.5.5 0 0 1-.706.028c-.007-.006-3.8-4.115-11.383-12.329a.5.5 0 0 1-.037-.633l3.823-5.256A1 1 0 0 1 4.873 3zm.51 2l-2.8 3.85L12 19.05 21.417 8.85 18.617 5H5.383z"
          fill="var(--purple)"
        />
      </svg>
      <Input
        p={2}
        size="sm"
        w={40}
        htmlSize={4}
        placeholder="Enter amount"
        defaultValue={reward}
        type="number"
        onChange={handleRewardChange}
        min={1}
      />
    </InputGroup>
  );
};
const Slots = ({
  handleSlotsChange,
  slots,
}: {
  handleSlotsChange: (e: ChangeEvent<HTMLInputElement>) => void;
  slots: number | undefined;
}) => {
  return (
    <InputGroup gap={2}>
      <InputLeftElement
        pointerEvents="none"
        color="gray.300"
        fontSize="1.2em"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M2 22a8 8 0 1 1 16 0h-2a6 6 0 1 0-12 0H2zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm8.284 3.703A8.002 8.002 0 0 1 23 22h-2a6.001 6.001 0 0 0-3.537-5.473l.82-1.824zm-.688-11.29A5.5 5.5 0 0 1 21 8.5a5.499 5.499 0 0 1-5 5.478v-2.013a3.5 3.5 0 0 0 1.041-6.609l.555-1.943z"
          fill="var(--gray)"
        />
      </svg>
      <Input
        p={2}
        size="sm"
        w={40}
        placeholder="Enter amount"
        defaultValue={slots}
        type="number"
        onChange={handleSlotsChange}
        min={1}
      />
    </InputGroup>
  );
};
const DatePicker = ({
  questId,
  questDate,
  transactionQueue,
  updateQuestAttributesHandler,
  addTransaction,
}: {
  questId: string;
  transactionQueue: TransactionQueue;
  questDate: string | undefined;
  updateQuestAttributesHandler: ({
    transactionQueue,
    lastTransaction,
  }: {
    transactionQueue: TransactionQueue;
    lastTransaction: UpdateTransaction;
  }) => void;
  addTransaction: (props: UpdateTransaction) => void;
}) => {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log("changin date", event.target.value);
    addTransaction({
      id: questId,
      attribute: "deadline",
      value: event.target.value,
    });
    updateQuestAttributesHandler({
      lastTransaction: {
        value: event.target.value,
        attribute: "deadline",
        id: questId,
      },
      transactionQueue,
    });
  };

  return (
    <div className="centerDivVertically">
      <Text fontWeight="semibold">Deadline</Text>
      <Input
        placeholder="Select Date and Time"
        w={{ base: "90%", md: "xs" }}
        size="md"
        type="datetime-local"
        defaultValue={questDate}
        onChange={onChange}
      />
    </div>
  );
};

const QuestAttributes = ({
  quest,
  updateQuestAttributesHandler,
}: {
  quest: Quest;
  updateQuestAttributesHandler: ({
    transactionQueue,
    lastTransaction,
  }: {
    transactionQueue: TransactionQueue;
    lastTransaction: UpdateTransaction;
  }) => void;
}) => {
  const updateQuestAttributesListAttribute = WorkspaceStore(
    (state) => state.updateQuestState
  );
  const addTransaction = WorkspaceStore((state) => state.addTransaction);
  const transactionQueue = WorkspaceStore((state) => state.transactionQueue);

  const handleTitleChange = (e: FormEvent<HTMLDivElement>) => {
    console.log("title update");
    addTransaction({
      id: quest.id,
      attribute: "title",
      value: e.currentTarget.textContent as string,
    });
    updateQuestAttributesListAttribute({
      id: quest.id,
      attribute: "title",
      value: e.currentTarget.textContent as string,
    });

    updateQuestAttributesHandler({
      transactionQueue,
      lastTransaction: {
        id: quest.id,
        attribute: "title",
        value: e.currentTarget.textContent as string,
      },
    });
  };

  const handleTopicChange = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log("event, ", e);
    addTransaction({
      id: quest.id,
      attribute: "topic",
      value: e.target.value,
    });
    updateQuestAttributesListAttribute({
      id: quest.id,
      attribute: "topic",
      value: e.target.value,
    });
    updateQuestAttributesHandler({
      transactionQueue,
      lastTransaction: {
        id: quest.id,
        attribute: "topic",
        value: e.target.value,
      },
    });
  };

  const handleSubtopicChange = () => {
    const content = document.getElementById("subtopic");

    const subtopicValues: string[] = [];
    console.log("content", content);
    content?.childNodes.forEach((c) => {
      if (c.textContent) {
        subtopicValues.push(c.textContent);
      }
    });
    if (subtopicValues.length > 0) {
      addTransaction({
        id: quest.id,
        attribute: "subtopic",
        value: subtopicValues,
      });
      updateQuestAttributesHandler({
        transactionQueue,
        lastTransaction: {
          id: quest.id,
          attribute: "subtopic",
          value: subtopicValues,
        },
      });
    }
  };
  const handleRewardChange = (e: ChangeEvent<HTMLInputElement>) => {
    addTransaction({
      id: quest.id,
      attribute: "reward",
      value: e.currentTarget.valueAsNumber,
    });
    updateQuestAttributesHandler({
      transactionQueue,
      lastTransaction: {
        id: quest.id,
        attribute: "reward",
        value: e.currentTarget.valueAsNumber,
      },
    });
  };
  const handleSlotsChange = (e: ChangeEvent<HTMLInputElement>) => {
    addTransaction({
      id: quest.id,
      attribute: "slots",
      value: e.currentTarget.valueAsNumber,
    });
    updateQuestAttributesHandler({
      transactionQueue,
      lastTransaction: {
        id: quest.id,
        attribute: "slots",
        value: e.currentTarget.valueAsNumber,
      },
    });
  };

  return (
    <Flex flexDirection="column" gap={2}>
      <Title handleTitleChange={handleTitleChange} title={quest.title} />
      <TopicSelect handleTopicChange={handleTopicChange} topic={quest.topic} />
      <Subtopic
        handleSubtopicChange={handleSubtopicChange}
        subtopic={quest.subtopic}
      />
      <Reward handleRewardChange={handleRewardChange} reward={quest.reward} />
      <Slots handleSlotsChange={handleSlotsChange} slots={quest.slots} />
      <DatePicker
        questId={quest.id}
        questDate={quest.deadline}
        updateQuestAttributesHandler={updateQuestAttributesHandler}
        transactionQueue={transactionQueue}
        addTransaction={addTransaction}
      />
    </Flex>
  );
};
export const QuestAttributesSkeleton = () => {
  return (
    <Flex flexDirection="column" gap={2}>
      <Skeleton height="30px" width="100%" />
      <Skeleton height="36px" width="40" />
      <Skeleton height="20px" width="50%" />
      <Skeleton height="20px" width="24" />
      <Skeleton height="20px" width="24" />
      <Skeleton height="25px" width="32" />
    </Flex>
  );
};
export default QuestAttributes;
