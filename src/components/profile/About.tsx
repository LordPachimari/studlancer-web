import {
  Badge,
  Card,
  CardBody,
  CardFooter,
  Flex,
  HStack,
  Progress,
  Text,
} from "@chakra-ui/react";

export default function AboutUser({
  username,
  about,
  level,
}: {
  username: string;
  about: string | undefined;
  level: number;
  experience: number;
}) {
  return (
    <Card w={{ base: "100%" }} height={{ base: "xs" }} borderRadius="2xl">
      <CardBody>
        <Flex alignItems="center">
          <Badge mr="1" variant="solid" colorScheme="blue" fontSize="15">
            {level} lvl
          </Badge>
          <Progress
            colorScheme="green"
            size="lg"
            value={20}
            w="100%"
            ml={5}
            borderRadius="xl"
          />
        </Flex>
        <Text fontSize={{ base: "xl", lg: "2xl" }} fontWeight="bold">
          {username}
        </Text>
        <Text fontSize={{ base: "xl" }}>{about && about}</Text>
      </CardBody>
      <CardFooter>
        <HStack>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path fill="none" d="M0 0h24v24H0z" />
            <path
              d="M15.3 5.55a2.9 2.9 0 0 0-2.9 2.847l-.028 1.575a.6.6 0 0 1-.68.583l-1.561-.212c-2.054-.28-4.022-1.226-5.91-2.799-.598 3.31.57 5.603 3.383 7.372l1.747 1.098a.6.6 0 0 1 .034.993L7.793 18.17c.947.059 1.846.017 2.592-.131 4.718-.942 7.855-4.492 7.855-10.348 0-.478-1.012-2.141-2.94-2.141zm-4.9 2.81a4.9 4.9 0 0 1 8.385-3.355c.711-.005 1.316.175 2.669-.645-.335 1.64-.5 2.352-1.214 3.331 0 7.642-4.697 11.358-9.463 12.309-3.268.652-8.02-.419-9.382-1.841.694-.054 3.514-.357 5.144-1.55C5.16 15.7-.329 12.47 3.278 3.786c1.693 1.977 3.41 3.323 5.15 4.037 1.158.475 1.442.465 1.973.538z"
              fill="rgba(50,152,219,1)"
            />
          </svg>
          <Text color="blue.500" ml="none">
            @Ivannguyen666
          </Text>
        </HStack>
        <HStack ml="5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path fill="none" d="M0 0h24v24H0z" />
            <path
              d="M13.914 14.58a8.998 8.998 0 0 1-.484.104 7.06 7.06 0 0 1-2.664-.01c-.154-.03-.372-.083-.653-.158l-.921 1.197c-2.273-.073-3.137-1.596-3.137-1.596 0-3.381 1.481-6.122 1.481-6.122 1.481-1.133 2.89-1.102 2.89-1.102l.403.525a1.12 1.12 0 0 1 .112-.01 8.527 8.527 0 0 1 2.314.01l.442-.525s1.41-.031 2.89 1.103c0 0 1.482 2.74 1.482 6.121 0 0-.875 1.522-3.148 1.596l-1.007-1.134zM10.076 11C9.475 11 9 11.45 9 12s.485 1 1.076 1c.6 0 1.075-.45 1.075-1 .01-.55-.474-1-1.075-1zm3.848 0c-.6 0-1.075.45-1.075 1s.485 1 1.075 1c.601 0 1.076-.45 1.076-1s-.475-1-1.076-1zM21 23l-4.99-5H19V4H5v14h11.003l.57 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v19z"
              fill="rgba(128,90,213,1)"
            />
          </svg>

          <Text color="purple.500" ml="none">
            Pachimari#5080
          </Text>
        </HStack>
      </CardFooter>
    </Card>
  );
}
