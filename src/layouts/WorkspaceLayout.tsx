import styles from "../components/workspace/workspace.module.css";

import React, { useState } from "react";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { GeneralStore } from "../zustand/general";
import { Flex, IconButton } from "@chakra-ui/react";
import List from "~/components/workspace/List";

const WorkspaceLayout = ({ children }: { children: React.ReactNode }) => {
  const [showList, toggleShowList] = useState(true);
  const setRedirectUrl = GeneralStore((state) => state.setRedirectUrl);
  const router = useRouter();

  const { isSignedIn, isLoaded } = useAuth();
  if (!isSignedIn && isLoaded) {
    setRedirectUrl("/workspace");
    void router.push("/");
  }

  return (
    <Flex position="relative">
      <List showList={showList} toggleShowList={toggleShowList} />
      <div
        className={`${styles.workspaceContainer} ${showList && styles.adjust}`}
      >
        {!showList ? (
          <IconButton
            pos="absolute"
            m={2}
            aria-label="open list"
            className={styles.openListButton}
            onClick={() => toggleShowList((val) => !val)}
            zIndex={3}
            bg="none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0H24V24H0z" />
              <path
                d="M21 18v2H3v-2h18zM17.404 3.904L22 8.5l-4.596 4.596-1.414-1.414L19.172 8.5 15.99 5.318l1.414-1.414zM12 11v2H3v-2h9zm0-7v2H3V4h9z"
                fill="#3182CE"
              />
            </svg>
          </IconButton>
        ) : null}

        {children}
      </div>
    </Flex>
  );
};

export default WorkspaceLayout;
