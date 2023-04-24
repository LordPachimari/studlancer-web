import {
  Box,
  Card,
  CardHeader,
  Center,
  Circle,
  Flex,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Text,
} from "@chakra-ui/react";
import debounce from "lodash.debounce";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ObjectTypesType,
  Post,
  PublishedQuest,
  TopicsType,
  User,
} from "~/types/main";
import { trpc } from "~/utils/api";
import { TopicColor } from "~/utils/topicsColor";
const SearchInput = ({
  setSearchLoading,
  setSearchComponents,
  isFocused,
  setIsFocused,
}: {
  setSearchComponents: Dispatch<
    SetStateAction<(PublishedQuest | User | Post)[] | null>
  >;
  isFocused: boolean;
  setIsFocused: Dispatch<SetStateAction<boolean>>;
  setSearchLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  const [text, setText] = useState("");
  const [enableFetch, setEnableFetch] = useState(false);
  const globalSearch = trpc.search.globalSearch.useQuery(
    { text },
    { enabled: enableFetch }
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce((event: ChangeEvent<HTMLInputElement>) => {
      setEnableFetch(true);
      setText(event.target.value);
    }, 500),
    []
  );

  useEffect(() => {
    if (globalSearch.data) {
      setSearchComponents(globalSearch.data);
      setSearchLoading(false);
      setEnableFetch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSearch.data]);
  return (
    <InputGroup size="md" w="100%" maxW="3xl">
      <Input
        borderBottomRadius={isFocused ? "0" : "md"}
        size="lg"
        bg="gray.100"
        height="10"
        placeholder="Global Search..."
        onBlur={() => {
          setIsFocused(false);
        }}
        onFocus={() => {
          setIsFocused(true);
        }}
        onChange={(e) => {
          setSearchLoading(true);
          if (!e.target.value) {
            setSearchComponents(null);
            setSearchLoading(false);

            handleSearch.cancel();
          } else {
            handleSearch(e);
          }
        }}
      />

      <InputRightElement>
        <IconButton
          aria-label="search quests"
          justifyContent="flex-start"
          pl="2"
          borderRadius={0}
          bg="none"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15zm-3.847-8.699a2 2 0 1 0 2.646 2.646 4 4 0 1 1-2.646-2.646z"
                fill="var(--blue)"
              />
            </svg>
          }
          w="100%"
          color="gray.500"
        />
      </InputRightElement>
    </InputGroup>
  );
};
const SearchComponent = ({
  title,
  id,
  topic,
  text,
  type,
  username,
}: {
  title?: string;
  id: string;
  topic?: TopicsType;
  text?: string;
  type: "QUEST" | "USER" | "POST";
  username?: string;
}) => {
  return (
    <Flex
      h="14"
      w="100%"
      _hover={{ bg: "blue.100" }}
      cursor="pointer"
      alignItems="center"
      gap={2}
    >
      <Center w="10" h="14" bg="blue.50">
        {type === "QUEST" ? (
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
        ) : type === "USER" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              d="M3.78307 2.82598L12 1L20.2169 2.82598C20.6745 2.92766 21 3.33347 21 3.80217V13.7889C21 15.795 19.9974 17.6684 18.3282 18.7812L12 23L5.6718 18.7812C4.00261 17.6684 3 15.795 3 13.7889V3.80217C3 3.33347 3.32553 2.92766 3.78307 2.82598ZM5 4.60434V13.7889C5 15.1263 5.6684 16.3752 6.7812 17.1171L12 20.5963L17.2188 17.1171C18.3316 16.3752 19 15.1263 19 13.7889V4.60434L12 3.04879L5 4.60434ZM12 11C10.6193 11 9.5 9.88071 9.5 8.5C9.5 7.11929 10.6193 6 12 6C13.3807 6 14.5 7.11929 14.5 8.5C14.5 9.88071 13.3807 11 12 11ZM7.52746 16C7.77619 13.75 9.68372 12 12 12C14.3163 12 16.2238 13.75 16.4725 16H7.52746Z"
              fill="var(--blue)"
            ></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <path
              d="M20 2C20.5523 2 21 2.44772 21 3V6.757L19 8.757V4H5V20H19V17.242L21 15.242V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20ZM21.7782 8.80761L23.1924 10.2218L15.4142 18L13.9979 17.9979L14 16.5858L21.7782 8.80761ZM13 12V14H8V12H13ZM16 8V10H8V8H16Z"
              fill="var(--blue)"
            ></path>
          </svg>
        )}
      </Center>
      {(type === "QUEST" || type === "POST") && topic && (
        <Circle size="8" bg={TopicColor({ topic })}>
          {topic[0]}
        </Circle>
      )}
      <Box p="2" overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
        <Heading
          size="sm"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
        >
          {type === "QUEST" || type === "POST" ? title : username}
        </Heading>
        {text && (
          <Text
            fontSize="sm"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
          >
            {text}
          </Text>
        )}
      </Box>
    </Flex>
  );
};
const LoadingSpinner = () => {
  return (
    <Center w="100%" h="14">
      <LoadingSpinner />
    </Center>
  );
};
export function GlobalSearch() {
  const [searchLoading, setSearchLoading] = useState(false);

  const [isFocused, setIsFocused] = useState(false);
  const [searchComponents, setSearchComponents] = useState<
    (PublishedQuest | User | Post)[] | null
  >(null);
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      // flexDir="column-reverse"
      w="100%"
      h="fit-content"
      position="relative"
      // minH="36"
    >
      <Card
        w="60%"
        maxW="2xl"
        h="fit-content"
        p="0"
        position="absolute"
        top="-5"
      >
        <SearchInput
          isFocused={isFocused}
          setIsFocused={setIsFocused}
          setSearchComponents={setSearchComponents}
          setSearchLoading={setSearchLoading}
        />
        {isFocused && (
          <>
            {searchLoading ? (
              <LoadingSpinner />
            ) : searchComponents && searchComponents.length > 0 ? (
              searchComponents.map((item) => {
                if (item.type === "QUEST") {
                  const quest = item as PublishedQuest;
                  return (
                    <SearchComponent
                      key={quest.id}
                      id={quest.id}
                      text={quest.text}
                      type="QUEST"
                      title={quest.title}
                      topic={quest.topic}
                    />
                  );
                } else if (item.type === "POST") {
                  const post = item as Post;
                  return (
                    <SearchComponent
                      key={post.id}
                      id={post.id}
                      text={post.text}
                      type="POST"
                      title={post.title}
                      topic={post.topic}
                    />
                  );
                } else {
                  const user = item as User;
                  return (
                    <SearchComponent
                      key={user.id}
                      id={user.id}
                      type="USER"
                      username={user.username}
                    />
                  );
                }
              })
            ) : searchComponents && searchComponents.length === 0 ? (
              <Center w="100%" h="14">
                <Text>{"Nothing found :("}</Text>
              </Center>
            ) : (
              <Center w="100%" h="14">
                <Text>{"Recent search"}</Text>
              </Center>
            )}
          </>
        )}
      </Card>
    </Flex>
  );
}
