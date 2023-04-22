import {
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { set } from "idb-keyval";
import debounce from "lodash.debounce";
import {
  ChangeEvent,
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { PublishedQuest } from "~/types/main";
import { trpc } from "~/utils/api";

export default function SearchQuest({
  serverQuests,
  setQuests,
  setSearchLoading,
}: {
  serverQuests: PublishedQuest[] | null | undefined;
  setSearchLoading: Dispatch<SetStateAction<boolean>>;
  setQuests: Dispatch<SetStateAction<PublishedQuest[] | null | undefined>>;
}) {
  const [text, setText] = useState("");
  const [enableFetch, setEnableFetch] = useState(false);
  const searchQuest = trpc.quest.searchPublishedQuest.useQuery(
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
    if (searchQuest.data) {
      setQuests(searchQuest.data);
      setSearchLoading(false);
      setEnableFetch(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuest.data]);

  return (
    <InputGroup size="md" w="100%" mb={5}>
      <Input
        bg="white"
        borderRadius="2xl"
        size="md"
        placeholder="Search for quests..."
        onChange={(e) => {
          setSearchLoading(true);
          if (!e.target.value) {
            setQuests(serverQuests);
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
          borderRightRadius="2xl"
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
}
