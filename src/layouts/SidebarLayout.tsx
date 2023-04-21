import {
  Box,
  Center,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import styles from "./sidebar.module.css";

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const [showSidebar, toggle] = useState(false);

  const toggleShowSidebar = () => {
    toggle((val) => !val);
    localStorage.setItem("sidebar", JSON.stringify(!showSidebar));
  };

  useEffect(() => {
    const showSidebar = JSON.parse(
      localStorage.getItem("sidebar") as string
    ) as boolean;
    toggle(showSidebar);
  }, []);

  return (
    <Flex>
      <Sidebar
        showSidebar={showSidebar}
        toggleShowSidebar={toggleShowSidebar}
      />
      <div
        className={`${styles.childrenContainer} ${
          showSidebar && styles.adjustChildren
        }`}
        onClick={() => {
          if (window.innerWidth <= 1024) {
            if (showSidebar) {
              toggleShowSidebar();
            }
          }
        }}
      >
        {!showSidebar ? (
          <IconButton
            m={2}
            position="fixed"
            aria-label="Close Sidebar"
            onClick={() => toggleShowSidebar()}
            zIndex={3}
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
          />
        ) : null}
        <Center
          w="100%"
          bg="white"
          h="14"
          borderBottomWidth="1px"
          borderColor="gray.300"
          position="fixed"
          zIndex={2}
        >
          <InputGroup size="md" w="60%" maxW="3xl">
            <Input
              size="lg"
              bg="gray.100"
              height="10"
              placeholder="Search..."
            />

            <InputRightElement>
              <IconButton
                aria-label="search quests"
                justifyContent="flex-start"
                pl="2"
                borderRadius={0}
                borderRightRadius="xl"
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
        </Center>
        {children}
      </div>
    </Flex>
  );
};
export default SidebarLayout;
