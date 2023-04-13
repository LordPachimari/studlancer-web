import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const forIndividuals: { heading: string; description: string }[] = [
    {
      heading: "Skill enhancement",
      description:
        "Stand out in the job market or your industry by showcasing your unique combination of skills and achievements earned through solving Studlancer's quests.",
    },
    {
      heading: "Flexible Learning",
      description:
        "Choose quests and topics that fit your needs and preferences, allowing you to learn at your own pace and in line with your personal or career goals.",
    },
    {
      heading: "Rewarding Progress",
      description:
        "Earn diamonds, experience, and achievements as you successfully complete quests. Use your achievements to showcase your expertise and motivate yourself to reach new heights",
    },
    {
      heading: "Collaborative environment",
      description:
        " Build connections and network with fellow learners. Studlancer introduces guild and global chat for different topics, allowing you to connect and form a group of like-minded individuals! ",
    },
  ];
  const forCompanies: { heading: string; description: string }[] = [
    {
      heading: "Crowdsourced Solutions",
      description:
        " Gain access to a variety of innovative solutions and perspectives from a diverse pool of users, enabling you to tackle challenges more effectively.",
    },
    {
      heading: "Talent discovery",
      description:
        "Identify skilled individuals who excel in the quests you've posted, making it easier to find potential employees, collaborators, or partners for your organization or projects.",
    },

    {
      heading: "Brand exposure",
      description:
        " Enhance your brand recognition and reputation by creating high-quality, engaging quests that showcase your organization's expertise and commitment to learning.",
    },
    {
      heading: "Community Building",
      description:
        "Develop a network of individuals who are passionate about your subject matter or industry, creating a supportive community that fosters knowledge exchange and collaboration.",
    },
  ];
  return (
    <Box w="100%">
      <Flex
        w="100%"
        flexDirection={{ base: "column", lg: "row" }}
        justifyContent="center"
      >
        <Box w={{ base: "100%", lg: "60%" }} minHeight="100vh">
          <Flex
            w="100%"
            h="100vh"
            alignItems="center"
            flexDir="column"
            pt="30%"
            px={5}
          >
            <Heading fontSize="5xl" fontWeight="extrabold" textAlign="center">
              Welcome to Studlancer!
            </Heading>
            <Text fontWeight="bold" fontSize="md" pt={5} textAlign="center">
              Unleash your potential by conquering quests and leveling up your
              skill!
            </Text>
            <Center pt={10} flexDirection="column" rowGap={5}>
              <Button
                colorScheme="blue"
                w="32"
                onClick={() => {
                  void router.push("/home");
                }}
              >
                View Quests
              </Button>

              <Button
                bg="blue.300"
                _hover={{ bg: "blue.400" }}
                w="32"
                color="white"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    window.scrollBy({
                      top: window.innerHeight - 50,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                Sign up
              </Button>
            </Center>
          </Flex>
        </Box>
        <Flex
          justifyContent="center"
          alignItems={{ base: "baseline", lg: "center" }}
          w={{ base: "100%", lg: "40%" }}
          h="100vh"
        >
          {children}
        </Flex>
      </Flex>

      <Box w="100%">
        <Center
          flexDirection="column"
          w="100%"
          h="fit-content"
          bg="white"
          p={10}
        >
          <Flex
            flexDir={{ base: "column", lg: "row" }}
            h="70%"
            pt={10}
            columnGap="10"
            justifyContent="center"
            alignItems="center"
          ></Flex>
          <Heading fontSize="3xl">For individuals</Heading>
          <Flex
            flexDir={{ base: "column", lg: "row" }}
            h="70%"
            pt={10}
            columnGap="10"
            justifyContent="center"
            alignItems="center"
          >
            {forIndividuals.map((info, i) => (
              <Box w="100%" h="100%" key={i} pb={5}>
                <Heading fontSize="md" textAlign="center" h="10">
                  {info.heading}
                </Heading>
                <Text pt={2} h="40">
                  {info.description}
                </Text>
              </Box>
            ))}
          </Flex>
        </Center>
        <Center
          flexDirection="column"
          w="100%"
          h="fit-content"
          bg="gray.100"
          p={10}
        >
          <Heading fontSize="3xl">For companies</Heading>
          <Flex
            flexDir={{ base: "column", lg: "row" }}
            h="70%"
            pt={10}
            columnGap="10"
            justifyContent="center"
            alignItems="center"
          >
            {forCompanies.map((info, i) => (
              <Box w="100%" h="100%" key={i} pb={5}>
                <Heading fontSize="md" textAlign="center" h="10">
                  {info.heading}
                </Heading>
                <Text pt={2} h="40">
                  {info.description}
                </Text>
              </Box>
            ))}
          </Flex>
        </Center>
        <Flex
          borderTop="2px"
          borderColor="gray.200"
          flexDirection={{ base: "column", lg: "row" }}
          w="100%"
          h="fit-content"
          p="16"
          bg="white"
        >
          <Flex flexDir="column" w={{ base: 100, lg: "30%" }}>
            <Heading fontSize="xl">Studlancer</Heading>
            <Text>Links</Text>
          </Flex>
          <Flex>
            <Flex flexDir="column" rowGap={2}>
              <Heading fontSize="lg">Company</Heading>
              <Text>About us</Text>

              <Text>Jobs</Text>
            </Flex>
          </Flex>
        </Flex>{" "}
      </Box>
    </Box>
  );
}
