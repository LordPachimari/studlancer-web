import {
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react";
import { ReactElement } from "react";
import GlobalLayout from "~/layouts/GlobalLayout";
import SidebarLayout from "~/layouts/SidebarLayout";
import AboutUser from "./About";
import Achievements from "./Achiements";
import UserQuests from "./Quests";
import UserTopics from "./Topics";

export default function Profile() {
  return (
    <Flex w="100%" justify="center">
      <Box
        w="90%"
        display={{ base: "block", md: "flex" }}
        columnGap={15}
        mt={16}
      >
        <Box w={{ base: "100%", md: "30%" }} mb={10}>
          <Card w="100%" height={{ base: "xs" }} borderRadius="2xl"></Card>
          <Center gap={10} mt={2}>
            <Text color="gray.500" fontWeight="bold">
              69 followers
            </Text>
            <Text color="gray.500" fontWeight="bold">
              69 following
            </Text>
          </Center>
          <Flex flexDirection="column">
            <Button
              colorScheme="blue"
              mt={5}
              w={{ base: "90%", md: "40" }}
              mx="auto"
            >
              Send message
            </Button>
            <Button
              colorScheme="blue"
              mt={5}
              w={{ base: "90%", md: "40" }}
              mx="auto"
            >
              Follow
            </Button>
          </Flex>
        </Box>
        <Box w={{ base: "100%", md: "70%" }}>
          <AboutUser />
          <Heading as="h3" size="md" my={5}>
            Topics
          </Heading>
          <UserTopics />
          <Heading as="h3" size="md" my={5}>
            Achievements
          </Heading>
          <Achievements />
          <Heading as="h3" size="md" my={5}>
            Quests
          </Heading>
          <UserQuests />
        </Box>
      </Box>
    </Flex>
  );
}
Profile.getLayout = function getLayout(page: ReactElement) {
  return (
    <GlobalLayout>
      <SidebarLayout>{page}</SidebarLayout>
    </GlobalLayout>
  );
};
