import {
  Avatar,
  Badge,
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Flex,
  Heading,
  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { PublishedQuest } from "~/types/main";
import { FromNow } from "~/utils/dayjs";
import { TopicColorScheme } from "~/utils/topicsColor";

export default function QuestComponent({
  quest,
  includeContent,
  includeDetails,
}: {
  quest: PublishedQuest;
  includeContent: boolean;
  includeDetails: boolean;
}) {
  let creatorImage: StaticImageData | undefined = undefined;
  if (quest.creatorProfile) {
    creatorImage = JSON.parse(quest.creatorProfile) as StaticImageData;
  }
  return (
    <Card w="100%" h="fit-content" borderRadius="2xl">
      <CardHeader p={4}>
        <Flex gap={5} flexWrap="wrap">
          <Flex flex="1" gap="4" alignItems="center">
            <Link href={`/profile/${quest.creatorUsername}`}>
              {creatorImage ? (
                <div className="circular-image-container">
                  <Image
                    src={creatorImage}
                    alt="avatar"
                    className="circular-image"
                  />
                </div>
              ) : (
                <Avatar name={quest.creatorUsername} size="sm" />
              )}
            </Link>

            <Box>
              <Flex gap={2} alignItems="center">
                <Heading size="sm">{quest.creatorUsername}</Heading>
                <Text fontSize="sm">
                  {FromNow({ date: quest.publishedAt })}
                </Text>
              </Flex>

              <Link href={`/quests/${quest.id}`}>
                <Flex flexWrap="wrap" rowGap="1" columnGap="1">
                  <Badge colorScheme="blue">
                    {`due ${FromNow({ date: quest.deadline })} `}
                  </Badge>
                  <Badge colorScheme="blue">{`${dayjs(quest.deadline).format(
                    "MMM D, YYYY"
                  )}`}</Badge>
                </Flex>

                <Flex mt={2} gap={2} flexWrap="wrap">
                  <Badge colorScheme={TopicColorScheme(quest.topic)}>
                    {quest.topic}
                  </Badge>
                  {quest.subtopic.map((subtopic, i) => (
                    <Badge
                      colorScheme="blue"
                      key={i}
                      borderWidth="2px"
                      borderColor="blue.500"
                    >
                      {subtopic}
                    </Badge>
                  ))}
                </Flex>
              </Link>
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

      <Link href={`/quests/${quest.id}`}>
        <Text fontSize="lg" fontWeight="bold" pb={4} px={4}>
          {quest.title}
        </Text>
        {includeContent && (
          <CardBody
            py={0}
            // pb={4}
            px={4}
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            h={{ base: "20", md: "16" }}
          >
            {quest.text}
          </CardBody>
        )}

        <Divider color="gray.200" />
        {includeDetails && (
          <CardFooter px={4} py={2}>
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
          </CardFooter>
        )}
      </Link>
    </Card>
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
