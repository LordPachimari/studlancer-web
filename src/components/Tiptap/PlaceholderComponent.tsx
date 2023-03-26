import { NodeViewWrapper } from "@tiptap/react";
import React from "react";
import styles from "./tiptap.module.css";

export default (props) => {
  return (
    <NodeViewWrapper className={styles.placeholderComponent}>
      <div
        className={styles.placeholderContainer}
        onClick={() => {
          props.deleteNode();
        }}
      >
        Write the quest content...
      </div>
    </NodeViewWrapper>
  );
};
