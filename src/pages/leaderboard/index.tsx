import {
  Avatar,
  Badge,
  Box,
  Card,
  Center,
  Flex,
  Heading,
  IconButton,
  Spacer,
  Text,
  Link,
} from "@chakra-ui/react";
import Image, { StaticImageData } from "next/image";
import NextLink from "next/link";
import { ReactElement, useState } from "react";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import GlobalLayout from "~/layouts/GlobalLayout";
import SidebarLayout from "~/layouts/SidebarLayout";
import { LeaderboardType } from "~/types/main";
import { trpc } from "~/utils/api";

import * as pako from "pako";
const UserComponent = ({
  username,
  level,
  filter,
  position,
  profile,
  questsSolved,
  rewarded,
}: LeaderboardType) => {
  let userImage: StaticImageData | undefined = undefined;
  if (profile) {
    userImage = JSON.parse(profile) as StaticImageData;
  }
  return (
    <Card
      w="100%"
      h="16"
      flexDir="row"
      gap="2"
      alignItems="center"
      m="2"
      borderRadius="xl"
      p="2"
    >
      <Center h="12" w="4" color="blue.700">
        <Text fontWeight="bold">{position}</Text>
      </Center>

      {userImage ? (
        <div className="circular-image-container">
          <Image src={userImage} alt="avatar" className="circular-image" />
        </div>
      ) : (
        <Avatar name={username} size="sm" />
      )}
      <Box whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
        <Badge color="white" bg="blue.500">
          {`${level} lvl`}
        </Badge>
        <Text
          fontSize="sm"
          fontWeight="bold"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {username}
        </Text>
      </Box>
      <Spacer />
      {filter === "quests" && (
        <Flex mr="1" alignItems="center" gap="1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              d="M19 22H5C3.34315 22 2 20.6569 2 19V3C2 2.44772 2.44772 2 3 2H17C17.5523 2 18 2.44772 18 3V15H22V19C22 20.6569 20.6569 22 19 22ZM18 17V19C18 19.5523 18.4477 20 19 20C19.5523 20 20 19.5523 20 19V17H18ZM16 20V4H4V19C4 19.5523 4.44772 20 5 20H16ZM6 7H14V9H6V7ZM6 11H14V13H6V11ZM6 15H11V17H6V15Z"
              fill="var(--blue)"
            ></path>
          </svg>
          <Text fontWeight="bold" fontSize="md" color="blue.700">
            {questsSolved}
          </Text>
        </Flex>
      )}
      {filter === "reward" && (
        <Flex mr="1" alignItems="center" gap="1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              d="M4.87759 3.00293H19.1319C19.4518 3.00293 19.7524 3.15601 19.9406 3.41476L23.7634 8.67115C23.9037 8.86403 23.8882 9.12913 23.7265 9.30438L12.3721 21.6049C12.1848 21.8078 11.8685 21.8205 11.6656 21.6332C11.6591 21.6271 7.86486 17.5175 0.282992 9.30438C0.121226 9.12913 0.10575 8.86403 0.246026 8.67115L4.06886 3.41476C4.25704 3.15601 4.55766 3.00293 4.87759 3.00293ZM5.38682 5.00293L2.58738 8.85216L12.0047 19.0543L21.4221 8.85216L18.6226 5.00293H5.38682Z"
              fill="var(--purple)"
            ></path>
          </svg>
          <Text fontWeight="bold" fontSize="md" color="blue.700">
            {rewarded}
          </Text>
        </Flex>
      )}
    </Card>
  );
};
export default function Leaderboard() {
  const [filter, setFilter] = useState<"reward" | "quests">("quests");
  const leaders = trpc.general.leaderboard.useQuery({ filter, limit: 10 });
  return (
    <Flex justifyContent="center" mt="28" w="100%" minH="100vh">
      <Flex flexDir="column" w={{ base: "90%", lg: "50%" }} alignItems="center">
        <Heading>Leaderboard</Heading>

        <Flex justifyContent="space-around" w="100%" my="5">
          <IconButton
            bg="white"
            borderWidth="2px"
            borderColor="blue.200"
            size="lg"
            aria-label="filter by quests"
            _hover={{ bg: "blue.100" }}
            onClick={() => {
              if (filter !== "quests") setFilter("quests");
            }}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="32"
                height="32"
              >
                <path
                  d="M19 22H5C3.34315 22 2 20.6569 2 19V3C2 2.44772 2.44772 2 3 2H17C17.5523 2 18 2.44772 18 3V15H22V19C22 20.6569 20.6569 22 19 22ZM18 17V19C18 19.5523 18.4477 20 19 20C19.5523 20 20 19.5523 20 19V17H18ZM16 20V4H4V19C4 19.5523 4.44772 20 5 20H16ZM6 7H14V9H6V7ZM6 11H14V13H6V11ZM6 15H11V17H6V15Z"
                  fill="var(--blue)"
                ></path>
              </svg>
            }
          />
          <IconButton
            bg="white"
            borderWidth="2px"
            borderColor="blue.200"
            size="lg"
            aria-label="filter by reward"
            _hover={{ bg: "blue.100" }}
            onClick={() => {
              if (filter !== "reward") setFilter("reward");
            }}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="32"
                height="32"
              >
                <path
                  d="M4.87759 3.00293H19.1319C19.4518 3.00293 19.7524 3.15601 19.9406 3.41476L23.7634 8.67115C23.9037 8.86403 23.8882 9.12913 23.7265 9.30438L12.3721 21.6049C12.1848 21.8078 11.8685 21.8205 11.6656 21.6332C11.6591 21.6271 7.86486 17.5175 0.282992 9.30438C0.121226 9.12913 0.10575 8.86403 0.246026 8.67115L4.06886 3.41476C4.25704 3.15601 4.55766 3.00293 4.87759 3.00293ZM5.38682 5.00293L2.58738 8.85216L12.0047 19.0543L21.4221 8.85216L18.6226 5.00293H5.38682Z"
                  fill="var(--purple)"
                ></path>
              </svg>
            }
          />
        </Flex>
        {leaders.isLoading ? (
          <Center w="100%" h="30%">
            <LoadingSpinner />
          </Center>
        ) : (
          leaders.data &&
          leaders.data.map((u, i) => (
            <Link
              as={NextLink}
              key={u.id}
              href={`/profile/${u.username}`}
              w="100%"
              _hover={{ textDecor: "none" }}
            >
              <UserComponent
                key={u.id}
                filter={filter}
                username={u.username}
                level={u.level}
                position={i + 1}
                profile={u.profile}
                questsSolved={u.questsSolved}
                rewarded={u.rewarded}
              />
            </Link>
          ))
        )}
      </Flex>
    </Flex>
  );
}
Leaderboard.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>{page}</SidebarLayout>
    </GlobalLayout>
  );
};
