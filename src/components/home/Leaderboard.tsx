import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Center,
  Flex,
  Heading,
  IconButton,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { trpc } from "~/utils/api";
import { LoadingSpinner } from "../LoadingSpinner";
import { LeaderboardType } from "~/types/main";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import * as pako from "pako";
const UserComponent = ({
  username,
  level,
  profile,
  questsSolved,
  rewarded,
  position,
  filter,
}: LeaderboardType) => {
  let userImage: StaticImageData | undefined = undefined;
  if (profile) {
    userImage = JSON.parse(profile) as StaticImageData;
  }
  return (
    <Flex
      flexDir="row"
      gap="2"
      alignItems="center"
      m="2"
      borderRadius="xl"
      p="2"
      // bg="blue.100"
      borderWidth="1px"
      borderColor="blue.200"
      h="14"
    >
      <Center h="12" w="4" color="blue.700">
        <Text fontWeight="bold">{position}</Text>
      </Center>
      {userImage ? (
        <div className="circular-image-container">
          <Image
            src={userImage}
            alt="avatar"
            className="circular-image"
            width={50}
          />
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
        <Flex mr="1" alignItems="center" gap="1" w="10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="18"
            height="18"
          >
            <path
              d="M19 22H5C3.34315 22 2 20.6569 2 19V3C2 2.44772 2.44772 2 3 2H17C17.5523 2 18 2.44772 18 3V15H22V19C22 20.6569 20.6569 22 19 22ZM18 17V19C18 19.5523 18.4477 20 19 20C19.5523 20 20 19.5523 20 19V17H18ZM16 20V4H4V19C4 19.5523 4.44772 20 5 20H16ZM6 7H14V9H6V7ZM6 11H14V13H6V11ZM6 15H11V17H6V15Z"
              fill="var(--blue)"
            ></path>
          </svg>
          <Text fontWeight="bold" fontSize="sm" color="blue.700">
            {questsSolved}
          </Text>
        </Flex>
      )}
      {filter === "reward" && (
        <Flex mr="1" alignItems="center" gap="1" w="10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path
              d="M4.87759 3.00293H19.1319C19.4518 3.00293 19.7524 3.15601 19.9406 3.41476L23.7634 8.67115C23.9037 8.86403 23.8882 9.12913 23.7265 9.30438L12.3721 21.6049C12.1848 21.8078 11.8685 21.8205 11.6656 21.6332C11.6591 21.6271 7.86486 17.5175 0.282992 9.30438C0.121226 9.12913 0.10575 8.86403 0.246026 8.67115L4.06886 3.41476C4.25704 3.15601 4.55766 3.00293 4.87759 3.00293ZM5.38682 5.00293L2.58738 8.85216L12.0047 19.0543L21.4221 8.85216L18.6226 5.00293H5.38682Z"
              fill="var(--purple)"
            ></path>
          </svg>
          <Text fontWeight="bold" fontSize="sm" color="blue.700">
            {rewarded}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};
export default function Leaderboard() {
  const [filter, setFilter] = useState<"reward" | "quests">("quests");
  const leaders = trpc.general.leaderboard.useQuery(
    { filter, limit: 5 },
    { staleTime: 10 * 60 * 1000 }
  );
  return (
    <Card w="90%" maxW="xs" minH="sm" borderRadius="2xl">
      <CardHeader p="2" display="flex" justifyContent="center">
        <Heading fontSize="lg" color="blue.700">
          Leaderboard
        </Heading>
      </CardHeader>
      <Flex justifyContent="space-around">
        <IconButton
          bg="blue.50"
          aria-label="filter by quests"
          _hover={{ bg: "blue.100" }}
          onClick={() => {
            if (filter !== "quests") setFilter("quests");
          }}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
            >
              <path
                d="M19 22H5C3.34315 22 2 20.6569 2 19V3C2 2.44772 2.44772 2 3 2H17C17.5523 2 18 2.44772 18 3V15H22V19C22 20.6569 20.6569 22 19 22ZM18 17V19C18 19.5523 18.4477 20 19 20C19.5523 20 20 19.5523 20 19V17H18ZM16 20V4H4V19C4 19.5523 4.44772 20 5 20H16ZM6 7H14V9H6V7ZM6 11H14V13H6V11ZM6 15H11V17H6V15Z"
                fill="var(--blue)"
              ></path>
            </svg>
          }
        />
        <IconButton
          bg="blue.50"
          aria-label="filter by reward"
          _hover={{ bg: "blue.100" }}
          onClick={() => {
            if (filter !== "reward") setFilter("reward");
          }}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
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
        <Center w="100%" h="100%">
          <LoadingSpinner />
        </Center>
      ) : (
        leaders.data &&
        leaders.data.map((u, i) => (
          <Link key={u.id} href={`/profile/${u.username}`}>
            <UserComponent
              username={u.username}
              level={u.level}
              profile={u.profile}
              questsSolved={u.questsSolved}
              position={i + 1}
              filter={filter}
              rewarded={u.rewarded}
            />
          </Link>
        ))
      )}
      <CardFooter justifyContent="center">
        <Link href="/leaderboard">
          <Button bg="blue.50" color="blue.500" _hover={{ bg: "blue.100" }}>
            See full leaderboard
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
