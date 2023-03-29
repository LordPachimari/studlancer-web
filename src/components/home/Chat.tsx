import {
  Box,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  Heading,
  Input,
  Select,
} from "@chakra-ui/react";

export default function GeneralChat() {
  return (
    <Card
      w="90%"
      maxW="xs"
      minW="52"
      h="80"
      bg="none"
      borderWidth="3px"
      borderColor="gray.300"
      boxShadow="none"
      borderRadius="2xl"
    >
      <CardHeader display="flex" bg="white" h="12" pt="3" borderTopRadius="xl">
        <Heading as="h3" fontSize="lg">
          CHAT
        </Heading>
        <Select ml={5} placeholder="select channel..." size="sm">
          <option value="marketing">marketing</option>
          <option value="programming">programming</option>
          <option value="science">science</option>
        </Select>
      </CardHeader>
      <CardBody>
        <Center w="100%">
          <Card w="100%" h="14"></Card>
        </Center>
      </CardBody>
      <CardFooter
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="white"
        h="12"
        borderRadius="xl"
      >
        <Input w="100%" size="sm" bg="gray.200" borderRadius="xl" />
      </CardFooter>
    </Card>
  );
}
