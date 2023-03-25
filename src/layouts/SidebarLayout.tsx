import { Flex, IconButton } from "@chakra-ui/react";
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
            aria-label="Close Sidebar"
            onClick={() => toggleShowSidebar()}
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
          />
        ) : null}
        yo
        {children}
      </div>
    </Flex>
  );
};
export default SidebarLayout;
