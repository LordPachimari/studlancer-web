import { Quest, Solution, TopicsType } from "../../types/main";
import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import _Text from "@tiptap/extension-text";
import parse, { attributesToProps } from "html-react-parser";
import { useMemo } from "react";

import { generateHTML } from "@tiptap/react";
import Image, { ImageLoaderProps } from "next/image";
import FileExtension from "../../components/Tiptap/FileExtension";
import ImageExtension from "../../components/Tiptap/ImageExtension";

import styles from "./workspace.module.css";
import { Badge, Box, Flex, Heading, Text } from "@chakra-ui/react";
import { FromNow } from "~/utils/dayjs";
export const HtmlParseOptions = {
  replace: (domNode: any) => {
    if (domNode.attribs && domNode.name === "image-component") {
      const props = attributesToProps(domNode.attribs);
      const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `${src}?w=${width}&q=${quality || 75}`;
      };

      return (
        <Image
          width={Math.round(parseInt(props.width!))}
          height={Math.round(parseInt(props.height!))}
          src={props.src!}
          loader={imageLoader}
          alt="image"
          sizes="(max-width: 768px) 90vw, (min-width: 1024px) 400px"
        />
      );
    }

    if (domNode.attribs && domNode.name === "file-component") {
      const props = attributesToProps(domNode.attribs);

      return (
        <div className={styles.fileContainer}>
          <a href={props.link}>{props.src}</a>
        </div>
      );
    }
  },
};
const Title = ({ title }: { title: string | undefined }) => {
  return (
    <Heading as="h2" id="title">
      {title}
    </Heading>
  );
};
const Topic = ({ topic }: { topic?: TopicsType | undefined }) => {
  return <Badge>{topic && topic}</Badge>;
};

const Subtopic = ({ subtopic }: { subtopic: string[] | undefined }) => {
  return (
    <Box id="subtopic">
      {subtopic && subtopic.map((s, i) => <Badge key={i}>{s}</Badge>)}
    </Box>
  );
};

const Reward = ({ reward }: { reward: number | undefined }) => {
  return (
    <Flex id="reward">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M4.873 3h14.254a1 1 0 0 1 .809.412l3.823 5.256a.5.5 0 0 1-.037.633L12.367 21.602a.5.5 0 0 1-.706.028c-.007-.006-3.8-4.115-11.383-12.329a.5.5 0 0 1-.037-.633l3.823-5.256A1 1 0 0 1 4.873 3zm.51 2l-2.8 3.85L12 19.05 21.417 8.85 18.617 5H5.383z"
          fill="var(--diamond)"
        />
      </svg>
      {reward}
    </Flex>
  );
};
const Slots = ({ slots }: { slots: number | undefined }) => {
  return (
    <Flex id="slots">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M2 22a8 8 0 1 1 16 0h-2a6 6 0 1 0-12 0H2zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm8.284 3.703A8.002 8.002 0 0 1 23 22h-2a6.001 6.001 0 0 0-3.537-5.473l.82-1.824zm-.688-11.29A5.5 5.5 0 0 1 21 8.5a5.499 5.499 0 0 1-5 5.478v-2.013a3.5 3.5 0 0 0 1.041-6.609l.555-1.943z"
          fill="var(--character)"
        />
      </svg>
      {slots}
    </Flex>
  );
};
const Date = ({ questDate }: { questDate: string }) => {
  const dueDate = new Date(questDate).toDateString();
  const exactDate = new Date(questDate).toLocaleDateString();
  console.log(dueDate);

  return (
    <Flex>
      <Text>DUE</Text>
      <Badge size="small" color="blue">
        {FromNow({ date: dueDate })}

        {exactDate}
      </Badge>
    </Flex>
  );
};

const QuestAttributes = ({ quest }: { quest: Quest }) => {
  return (
    <div className={`${styles.rowMargins}`}>
      <Title title={quest.title} />

      {quest.deadline && <Date questDate={quest.deadline} />}
      <Topic topic={quest.topic} />
      <Subtopic subtopic={quest.subtopic} />
      <Reward reward={quest.reward} />
      <Slots slots={quest.slots} />
    </div>
  );
};
const SolutionAttributes = ({ solution }: { solution: Solution }) => {
  return <Heading as="h2" title={solution.title} />;
};
const Content = ({ content }: { content: string }) => {
  const contentJSON = JSON.parse(content);
  const output = useMemo(() => {
    return generateHTML(contentJSON, [
      Document,
      Paragraph,
      _Text,
      Bold,
      ImageExtension,
      FileExtension,
      // other extensions …
    ]);
  }, [contentJSON]);

  return <>{parse(output, HtmlParseOptions)}</>;
};
const Preview = ({
  quest,
  solution,
  content,
  type,
}: {
  quest?: Quest;
  content?: string;
  solution?: Solution;
  type: "SOLUTION" | "QUEST";
}) => {
  if (type === "QUEST" && quest) {
    return (
      <>
        <QuestAttributes quest={quest} />

        {content && <Content content={content} />}
      </>
    );
  }
  if (type === "SOLUTION" && solution) {
    return (
      <>
        <SolutionAttributes solution={solution} />
        {content && <Content content={content} />}
      </>
    );
  }
  return <></>;
};
export default Preview;
