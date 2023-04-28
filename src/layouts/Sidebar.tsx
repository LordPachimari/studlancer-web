import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Flex,
  IconButton,
  Spacer,
  Stack,
  Switch,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "./sidebar.module.css";
import { trpc } from "~/utils/api";
import { useToast } from "@chakra-ui/react";
import * as pako from "pako";
import Image, { StaticImageData } from "next/image";
const Sidebar = ({
  showSidebar,
  toggleShowSidebar,
}: {
  showSidebar: boolean;
  toggleShowSidebar: () => void;
}) => {
  const toast = useToast();
  const router = useRouter();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const user = trpc.user.userComponent.useQuery(
    { id: userId! },
    { staleTime: 10 * 60 * 6000, enabled: isLoaded && !!userId }
  );

  const { signOut } = useClerk();

  let profileImage: StaticImageData | undefined = undefined;
  if (user.data && user.data.profile) {
    profileImage = JSON.parse(user.data.profile) as StaticImageData;
  }

  const links = [
    { page: "home", finished: true, public: true },
    { page: "leaderboard", finished: true, public: true },
    { page: "workspace", finished: true, public: false },
    { page: "chat", finished: false, public: false },
    { page: "notifications", finished: false, public: false },
    { page: "guild", finished: false, public: false },

    { page: "forum", finished: false, public: true },
    { page: "settings", finished: false, public: false },
  ] as const;

  // document.documentElement.setAttribute("data-theme", "dark");

  return (
    <div className={`${styles.sidebar} ${showSidebar && styles.show}`}>
      <Flex alignItems="center" p="2">
        <Switch size="lg" />

        <Spacer />
        <IconButton
          aria-label="Close sidebar"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"
                fill="var(--blue)"
              />
            </svg>
          }
          onClick={toggleShowSidebar}
        >
          Box 1
        </IconButton>
      </Flex>

      {isSignedIn && user.data ? (
        <Link href={`/profile/${user.data.username}`}>
          <Center w="100%" h="80">
            {profileImage ? (
              <Image src={profileImage} alt="Character" width={170} />
            ) : (
              <></>
            )}
          </Center>
          <Flex flexDir="column" alignItems="center" p="2">
            <Badge
              mr="1"
              variant="solid"
              colorScheme="blue"
              fontSize="15"
              w="12"
            >
              {user.data.level} lvl
            </Badge>
            <Text fontWeight="bold">{user.data.username}</Text>
          </Flex>

          <Divider />
        </Link>
      ) : isSignedIn && !user.data ? (
        <Card w="80" h="90" borderRadius="2xl">
          <Center w="100%" h="100%">
            <Button
              colorScheme="blue"
              onClick={() => void router.push("/create-user")}
            >
              Finish account creation
            </Button>
          </Center>
        </Card>
      ) : (
        <>
          <Center w="100%" h="80"></Center>
          <Divider />
        </>
      )}
      {links.map((l, i) => {
        // if (isSignedIn && user) {
        //   return (
        //     <Link href={`/${l}`} key={i}>
        //       <Box>
        //          <Text fontSize={{ base: "md" }}>{l.toUpperCase()}</Text>
        //       </Box>
        //     </Link>
        //   );
        // }
        if ((isSignedIn && l.finished) || (l.public && l.finished)) {
          return (
            <Link href={`/${l.page}`} key={l.page}>
              <Stack
                direction="row"
                key={i}
                w="100%"
                h="10"
                p="0"
                alignItems="center"
                className="divider"
                cursor="pointer"
                _hover={{ bg: "gray.100" }}
              >
                <Divider
                  orientation="vertical"
                  w="1"
                  bg="none"
                  sx={{
                    ".divider:hover &": {
                      bg: "blue.500",
                    },
                  }}
                />

                <Text fontSize={{ base: "sm" }} as={l.finished ? "p" : "u"}>
                  {l.page.toUpperCase()}
                </Text>
              </Stack>

              <Divider />
            </Link>
          );
        }
        if (isSignedIn && !l.finished) {
          return (
            <Box key={i}>
              <Stack
                direction="row"
                w="100%"
                h="10"
                p="0"
                alignItems="center"
                className="divider"
                cursor="pointer"
                _hover={{ bg: "gray.100" }}
                onClick={() => {
                  toast({
                    title: "Currently not ready :(",
                    description: <Text>Currently in development</Text>,
                    status: "info",
                    isClosable: true,
                  });
                }}
              >
                <Divider
                  orientation="vertical"
                  w="1"
                  bg="none"
                  sx={{
                    ".divider:hover &": {
                      bg: "blue.500",
                    },
                  }}
                />

                <Text fontSize={{ base: "sm" }} as={l.finished ? "p" : "s"}>
                  {l.page.toUpperCase()}
                </Text>
              </Stack>

              <Divider />
            </Box>
          );
        }
        return (
          <Box key={i}>
            <Stack
              direction="row"
              w="100%"
              h="10"
              p="0"
              alignItems="center"
              className="divider"
              cursor="pointer"
              _hover={{ bg: "gray.100" }}
              onClick={() => {
                toast({
                  title: "Please sign up",
                  description: (
                    <Link href="/">
                      <Text as="u">Click here to sign up</Text>
                    </Link>
                  ),
                  status: "info",
                  isClosable: true,
                });
              }}
            >
              <Divider
                orientation="vertical"
                w="1"
                bg="none"
                sx={{
                  ".divider:hover &": {
                    bg: "blue.500",
                  },
                }}
              />

              <Text fontSize={{ base: "sm" }} as={l.finished ? "p" : "s"}>
                {l.page.toUpperCase()}
              </Text>
            </Stack>

            <Divider />
          </Box>
        );
      })}
      {isSignedIn ? (
        <Center>
          {" "}
          <Button
            mt={5}
            colorScheme="red"
            onClick={() => {
              signOut().catch((err) => console.log("error logging out", err));
              void router.push("/");
            }}
          >
            <Text fontSize={{ base: "sm" }}>Sign out</Text>
          </Button>
        </Center>
      ) : (
        <Center>
          <Button
            mt={5}
            colorScheme="blue"
            onClick={() => {
              void router.push("/sign-in");
            }}
          >
            <Text fontSize={{ base: "sm" }}>Sign in</Text>
          </Button>
        </Center>
      )}
    </div>
  );
};
export default Sidebar;
