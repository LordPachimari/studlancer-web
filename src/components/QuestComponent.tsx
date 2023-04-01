import {
  Avatar,
  Badge,
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import _Text from "@tiptap/extension-text";
import { generateHTML } from "@tiptap/html";
import dayjs from "dayjs";
import parse, { attributesToProps } from "html-react-parser";
import Link from "next/link";
import { useMemo } from "react";
import { PublishedQuest } from "~/types/main";
import { FromNow } from "~/utils/dayjs";
import FileExtension from "./Tiptap/FileExtension";
import ImageExtension from "./Tiptap/ImageExtension";
const HtmlParseOptions = {
  replace: (domNode: any) => {
    if (domNode.attribs && domNode.name === "image-component") {
      return <></>;
    }

    if (domNode.attribs && domNode.name === "file-component") {
      const props = attributesToProps(domNode.attribs);

      return <></>;
    }
  },
};
export default function QuestComponent({
  quest,
  includeContent,
  includeDetails,
}: {
  quest: PublishedQuest;
  includeContent: boolean;
  includeDetails: boolean;
}) {
  const contentJSON = JSON.parse(quest.content);
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
  return (
    <Link href={`/quests/${quest.id}`}>
      <Card w="100%" h="64" borderRadius="2xl" cursor="pointer">
        <CardHeader p={4}>
          <Flex gap={5} flexWrap="wrap">
            <Flex flex="1" gap="4" alignItems="center" flexWrap="wrap">
              <Link href={`/profile/${quest.creatorId}`}>
                <Avatar
                  name="Segun Adebayo"
                  src="https://bit.ly/sage-adebayo"
                />
              </Link>

              <Box>
                <Flex gap={2} alignItems="center">
                  <Heading size="sm">{quest.creatorUsername}</Heading>
                  <Text>{FromNow({ date: quest.publishedAt })}</Text>
                </Flex>
                <Badge colorScheme="blue">
                  {`due ${FromNow({ date: quest.deadline })} `}
                </Badge>
                <Badge colorScheme="blue" ml={2}>{`${dayjs(
                  quest.deadline
                ).format("MMM D, YYYY")}`}</Badge>
                <Flex mt={2} gap={2}>
                  <Badge colorScheme="red">{quest.topic}</Badge>
                  {quest.subtopic.map((subtopic, i) => (
                    <Badge
                      colorScheme="blue"
                      key={i}
                      borderWidth="2px"
                      borderColor="blue.500"
                    >
                      {quest.subtopic}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            </Flex>
            <Badge
              fontSize="md"
              h="8"
              minW="16"
              variant="solid"
              display="flex"
              alignItems="center"
              justifyContent="center"
              colorScheme="green"
              borderRadius="md"
            >
              {quest.status}
            </Badge>
          </Flex>
        </CardHeader>
        {includeContent && (
          <CardBody p={4}>{parse(output, HtmlParseOptions)}</CardBody>
        )}
        {includeDetails && (
          <CardFooter p={4}>
            <HStack>
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
              <Text fontWeight="bold" color="purple.500">
                {quest.reward}
              </Text>
            </HStack>
            <HStack ml={5}>
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
              <Text fontWeight="bold" color="gray.500">
                {`${quest.solverCount}/${quest.slots}`}
              </Text>
            </HStack>
            <HStack ml={5}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path
                  d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 1 1-4.78 3.527A2.499 2.499 0 0 0 12 9.5a2.5 2.5 0 0 0-1.473-2.28c.466-.143.96-.22 1.473-.22z"
                  fill="#718096"
                />
              </svg>
              <Text fontWeight="bold" color="gray.500">
                {quest.views}
              </Text>
            </HStack>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
export const QuestComponentSkeleton = ({
  includeContent,
}: {
  includeContent: boolean;
}) => {
  return (
    <Card
      w="100%"
      h={includeContent ? "64" : "36"}
      borderRadius="2xl"
      cursor="pointer"
    >
      <CardHeader pb="0">
        <Flex gap={5}>
          <Flex flex="1" gap="4" alignItems="center" flexWrap="wrap">
            <SkeletonCircle size="12" />

            <Box>
              <Skeleton h={6} w="40" />
              <Flex mt={2} gap={2}>
                <Skeleton h={4} w="20" />

                <Skeleton h={4} w="20" />
              </Flex>
            </Box>
          </Flex>

          <Skeleton h={8} w="16" />
        </Flex>
      </CardHeader>

      <CardBody>
        {includeContent && (
          <SkeletonText mt="4" noOfLines={4} spacing="4" skeletonHeight="2" />
        )}
      </CardBody>
    </Card>
  );
};
