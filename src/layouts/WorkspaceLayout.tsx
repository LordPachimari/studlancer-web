import styles from "../pages/workspace/workspace.module.css";

import React, { useState } from "react";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { GeneralStore } from "../zustand/general";

const WorkspaceLayout = ({ children }: { children: React.ReactNode }) => {
  const [showList, toggleShowList] = useState(true);
  const setRedirectUrl = GeneralStore((state) => state.setRedirectUrl);
  const router = useRouter();

  const { isSignedIn, isLoaded } = useAuth();
  console.log("isSignedIn", isSignedIn);
  if (!isSignedIn && isLoaded) {
    setRedirectUrl("/workspace");
    router.push("/sign-in");
  }

  return (
    <div className={styles.parentContainer}>
      <List showList={showList} toggleShowList={toggleShowList} />
      <div
        className={`${styles.workspaceContainer} ${showList && styles.adjust}`}
      >
        <div className={styles.toggleListContainer}>
          {!showList ? (
            <button
              className={styles.openListButton}
              onClick={() => toggleShowList((val) => !val)}
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
                  fill="var(--character)"
                />
              </svg>
            </button>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
};

export default WorkspaceLayout;
