import { Center, Flex, IconButton, Input } from "@chakra-ui/react";
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
                  fill="#3182CE"
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
          <Input
            size="lg"
            width="60%"
            bg="gray.100"
            height="10"
            placeholder="Search..."
          />
        </Center>
        {children}
      </div>
    </Flex>
  );
};
export default SidebarLayout;
