import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import Placeholder from "./PlaceholderComponent";

export default Node.create({
  name: "placeholderComponent",

  group: "block",
  draggable: true,

  parseHTML() {
    return [
      {
        tag: "placeholder-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["placeholder-component", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(Placeholder);
  },
});
