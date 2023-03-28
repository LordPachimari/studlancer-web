import { TransactionQueue, UpdateTransaction } from "../../types/main";
import {
  BubbleMenu,
  EditorContent,
  FloatingMenu,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import FileExtension from "../Tiptap/FileExtension";
import ImageExtension from "../Tiptap/ImageExtension";
import { WorkspaceStore } from "../../zustand/workspace";
import styles from "./workspace.module.css";
import { Box, SkeletonText } from "@chakra-ui/react";
import Placeholder from "@tiptap/extension-placeholder";

const TiptapEditor = (props: {
  id: string;
  content: string | undefined;
  updateAttributesHandler: ({
    transactionQueue,
    //last transaction needs to be pushed into transactionQueue,
    //as the last addTransaction function is executed in parallel with updateQuestAttributeHandler,
    //and cannot be captured inside of updateQuestAttributeHandler function
    lastTransaction,
  }: {
    transactionQueue: TransactionQueue;
    lastTransaction: UpdateTransaction;
  }) => void;
}) => {
  const { id, updateAttributesHandler, content } = props;
  const transactionQueue = WorkspaceStore((state) => state.transactionQueue);
  const addQuestTransaction = WorkspaceStore((state) => state.addTransaction);
  // const provider = new HocuspocusProvider({
  //   url: "ws://0.0.0.0:80",
  //   name: `${quest.id}`,
  //   token: TEST_USER.id,
  //   parameters: { creatorId: TEST_USER.id },
  // });

  // const ydoc = new Y.Doc();
  // new IndexeddbPersistence(`${quest.id}`, ydoc);
  // console.log("ydoc", ydoc);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        // Image,
        // Image.configure({
        //   // inline: true,
        //   HTMLAttributes: {
        //     class: styles.imageContainer,
        //   },
        // }),
        ImageExtension,
        FileExtension,
        Placeholder.configure({
          placeholder: "Write something …",
        }),

        // EventHandler,

        // Collaboration.configure({
        //   document: provider.document,
        // }),

        // Collaboration.configure({
        //   document: ydoc,
        // }),
      ],
      // content: JSON.parse(quest.content),
      ...(content && { content: JSON.parse(content) }),
      // onCreate: () => {
      //   console.log("editor created");
      // },

      onUpdate: ({ editor }) => {
        const json = editor.getJSON();
        const jsonString = JSON.stringify(json);
        addQuestTransaction({
          id: id,
          attribute: "content",
          value: jsonString,
        });
        updateAttributesHandler({
          transactionQueue,
          lastTransaction: {
            id: id,
            attribute: "content",
            value: jsonString,
          },
        });
        // updateQuest();
        // send the content to an API here
      },
    },
    [id]
  );

  const imageInputRef = useRef<HTMLInputElement>(null);

  const imageInputClick = () => {
    imageInputRef.current?.click();
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileInputClick = () => {
    fileInputRef.current?.click();
  };
  const addImage = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) {
        return;
      }
      const file = files[0];
      if (!file) {
        return;
      }
      const filename = encodeURIComponent(file.name);
      const fileType = encodeURIComponent(file.type);
      const res = await fetch(
        `/api/upload-image?file=${filename}&fileType=${fileType}`
      );

      const { url, fields } = await res.json();
      console.log("fields", fields);
      const formData = new FormData();
      Object.entries({ ...fields, file }).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      const upload = await fetch(url, {
        method: "POST",

        body: formData,
      });
      if (upload.ok) {
        console.log("Uploaded successfully!");
      } else {
        console.log("upload failed", upload.status, upload.statusText);
      }

      if (url && editor) {
        console.log("hello", `${url}${fields.key}`);
        const imageUrl = new URL(`${url}${fields.key}`);
        editor
          .chain()
          .focus()
          // .setImage({ src: `${imageUrl}` })
          .insertContent(
            `<image-component src=${imageUrl}></image-component><p></p>`
          )

          .run();
      }
      e.target.value = "";
    },
    [editor]
  );
  const addFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) {
        return;
      }
      const file = files[0];
      if (!file) {
        return;
      }
      const filename = encodeURIComponent(file.name);
      const fileType = encodeURIComponent(file.type);
      const res = await fetch(
        `/api/upload-file?file=${filename}&fileType=${fileType}`
      );

      const { url, fields } = await res.json();
      ``;

      console.log("fields", fields);
      const formData = new FormData();
      Object.entries({ ...fields, file }).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      const upload = await fetch(url, {
        method: "POST",

        body: formData,
      });

      const fileUrl = new URL(`${url}${fields.key}`);
      if (upload.ok) {
        console.log("Uploaded successfully!");
        if (url && editor) {
          console.log("hello from the underworld image");
          editor
            .chain()
            .focus()
            .insertContent(
              `<file-component link=${fileUrl} src=${fields.key}></file-component><p></p>`
            )
            .run();
        }
      } else {
        console.log("upload failed", upload.statusText);
      }

      e.target.value = "";
    },
    [editor]
  );
  return (
    <Box minH="200px">
      {editor && (
        <>
          <BubbleMenu
            editor={editor}
            className={styles.bubbleMenu}
            tippyOptions={{ duration: 100 }}
          >
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`${styles.bubbleMenuButton} ${
                editor.isActive("heading", { level: 1 }) ? styles.active : null
              }`}
            >
              h1
            </button>

            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`${styles.bubbleMenuButton} ${
                editor.isActive("bold") ? styles.active : null
              }`}
            >
              bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`${styles.bubbleMenuButton} ${
                editor.isActive("italic") ? styles.active : null
              }`}
            >
              italic
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`${styles.bubbleMenuButton} ${
                editor.isActive("strike") ? styles.active : null
              }`}
            >
              strike
            </button>
          </BubbleMenu>

          <FloatingMenu
            className={styles.floatingMenu}
            editor={editor}
            tippyOptions={{ duration: 100 }}
          >
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={styles.floatingMenuButton}
            >
              h1
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={styles.floatingMenuButton}
            >
              h2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={styles.floatingMenuButton}
            >
              bullet list
            </button>
            <button
              className={styles.floatingMenuButton}
              onClick={imageInputClick}
            >
              image
            </button>
            <input
              name="image"
              type="file"
              accept="image/*"
              ref={imageInputRef}
              className={styles.imageInput}
              onChange={addImage}
            />
            <button
              className={styles.floatingMenuButton}
              onClick={fileInputClick}
            >
              File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className={styles.imageInput}
              onChange={addFile}
            />
          </FloatingMenu>
        </>
      )}

      <EditorContent editor={editor} id="editor" />
    </Box>
  );
};

export default TiptapEditor;
