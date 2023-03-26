import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import Component from "./TitleComponent";

export default Node.create({
  name: "titleComponent",

  group: "block",

  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "title-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["title-component", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Component);
  },
});
