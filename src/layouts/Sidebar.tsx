import {
  Box,
  Button,
  Center,
  Divider,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Heading,
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
import { useState } from "react";
import styles from "./sidebar.module.css";
const Sidebar = ({
  showSidebar,
  toggleShowSidebar,
}: {
  showSidebar: boolean;
  toggleShowSidebar: () => void;
}) => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userId, isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  //   const user = trpc.user.userById.useQuery(
  //     { id: userId as string },
  //     {
  //       enabled: !!isLoaded,

  //       staleTime: 10 * 60 * 1000,
  //     }
  //   );
  const links = [
    "home",
    "leaderboard",
    "workspace",
    "chat",
    "notifications",
    "guild",
    "forum",
    "settings",
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
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
            </svg>
          }
          onClick={toggleShowSidebar}
        >
          Box 1
        </IconButton>
      </Flex>
      <Center w="100%" h="80">
        <Box w="90%" h="72" bg="gray.100" borderRadius={"xl"}></Box>
      </Center>
      {links.map((l, i) => {
        // if (isSignedIn && user) {
        //   return (
        //     <Link href={`/${l}`} key={i}>
        //       <Box>
        //         <Text fontSize={{ base: "md" }}>{l.toUpperCase()}</Text>
        //       </Box>
        //     </Link>
        //   );
        // }
        return (
          <Stack
            direction="row"
            key={i}
            w="100%"
            h="10"
            p="0"
            alignItems="center"
            className="divider"
            cursor="pointer"
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

            <Text fontSize={{ base: "sm" }}>{l.toUpperCase()}</Text>
          </Stack>
        );
      })}
      <Button
        onClick={() => {
          signOut();
          router.push("/");
        }}
      >
        <Text fontSize={{ base: "sm" }}>Sign out</Text>
      </Button>
    </div>
  );
};
export default Sidebar;
