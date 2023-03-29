import { NodeViewWrapper } from "@tiptap/react";
import React from "react";
import styles from "./tiptap.module.css";

export default function FileComponent(props: {
  [key: string]: any;
  as?: React.ElementType;
}) {
  return (
    <NodeViewWrapper className={styles.fileComponent}>
      <div
        className={styles.fileContainer}
        draggable="true"
        data-drag-handle
        contentEditable="false"
      >
        <a href={props.node.attrs.link}>{props.node.attrs.src}</a>
        <button
          className={styles.deleteFileButton}
          onClick={() => {
            console.log("clicked");
            props.deleteNode(props.node);
          }}
        >
          X
        </button>
      </div>
    </NodeViewWrapper>
  );
}
