export {};
// const SearchComponent = ({
//   isOpen,
//   onClose,
//   onOpen,
// }: {
//   isOpen: boolean;
//   onOpen: () => void;
//   onClose: () => void;
// }) => {
//   const initialRef = React.useRef(null);
//   const [QuestOrSolutionList, setQuestOrSolutionList] = useState<WorkspaceList>(
//     { quests: [], solutions: [] }
//   );
// const serverWorkspaceList = trpc.workspace.workspaceList.useQuery(undefined, {
//     staleTime: 10 * 60 * 1000,
//     enabled: isLoaded,
//   });
//   const searchText = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
//     setQuestOrSolutionList({
//       quests: [],
//       solutions: [],
//     });
//     if (!e.target.value.trim()) {
//       return;
//     }

//         const filteredQuests = .filter(
//           (value) =>
//             value.type === "QUEST" &&
//             // (value.content && value.content.search(e.target.value) > -1) ||
//             value.title &&
//             value.title?.search(e.target.value) > -1
//         );

//         const filteredSolution = values.filter(
//           (value) =>
//             value.type === "SOLUTION" &&
//             // (value.content && value.content?.search(e.target.value) > -1) ||
//             value.title &&
//             value.title?.search(e.target.value) > -1
//         );

//         setQuestOrSolutionList({
//           quests: filteredQuests,
//           solutions: filteredSolution,
//         });
//       })

//   }, 500);
//   return (
//     <Modal initialFocusRef={initialRef} isOpen={isOpen} onClose={onClose}>
//       <ModalOverlay />
//       <ModalContent>
//         <ModalHeader>Search</ModalHeader>
//         <ModalCloseButton />
//         <ModalBody pb={6}>
//           <FormControl>
//             <Input
//               ref={initialRef}
//               placeholder="Search for quests and solutions..."
//               onChange={searchText}
//             />
//           </FormControl>
//           {QuestOrSolutionList.quests.length === 0 &&
//             QuestOrSolutionList.solutions.length === 0 && (
//               <Box mt={5}>Nothing...</Box>
//             )}
//           {QuestOrSolutionList.quests.map((item) => (
//             <Flex
//               mt={2}
//               _hover={{ bg: "gray.100" }}
//               cursor="pointer"
//               pl="2"
//               borderRadius={4}
//               bg="none"
//               w="100%"
//               h="10"
//               color="black"
//               key={item.id}
//               gap={2}
//               alignItems="center"
//             >
//               <Circle
//                 size="24px"
//                 borderWidth="1px"
//                 borderColor="black"
//                 bg={item.topic ? TopicColor({ topic: item.topic }) : "white"}
//               >
//                 {item.topic && item.topic[0]}
//               </Circle>
//               <Text
//                 fontSize="md"
//                 fontWeight="semibold"
//                 whiteSpace="nowrap"
//                 overflow="hidden"
//                 textOverflow="ellipsis"
//               >
//                 {item.title || "Untitled"}
//               </Text>
//               <Spacer />
//               <IconButton
//                 size="sm"
//                 aria-label="restore"
//                 icon={
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     viewBox="0 0 24 24"
//                     width="18"
//                     height="18"
//                   >
//                     <path fill="none" d="M0 0h24v24H0z" />
//                     <path
//                       d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z"
//                       fill="var(--gray)"
//                     />
//                   </svg>
//                 }
//               ></IconButton>
//             </Flex>
//           ))}

//           {QuestOrSolutionList.solutions.map((item) => (
//             <Flex
//               mt={2}
//               _hover={{ bg: "gray.100" }}
//               cursor="pointer"
//               pl="2"
//               borderRadius={4}
//               bg="none"
//               w="100%"
//               h="10"
//               color="black"
//               key={item.id}
//               gap={2}
//               alignItems="center"
//             >
//               <Circle
//                 size="24px"
//                 borderWidth="1px"
//                 borderColor="black"
//                 bg="blue.200"
//               >
//                 S
//               </Circle>

//               <Text
//                 fontSize="md"
//                 fontWeight="semibold"
//                 whiteSpace="nowrap"
//                 overflow="hidden"
//                 textOverflow="ellipsis"
//               >
//                 {item.title || "Untitled"}
//               </Text>
//               <Spacer />
//               <IconButton
//                 size="sm"
//                 aria-label="restore"
//                 icon={
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     viewBox="0 0 24 24"
//                     width="18"
//                     height="18"
//                   >
//                     <path fill="none" d="M0 0h24v24H0z" />
//                     <path
//                       d="M5.828 7l2.536 2.536L6.95 10.95 2 6l4.95-4.95 1.414 1.414L5.828 5H13a8 8 0 1 1 0 16H4v-2h9a6 6 0 1 0 0-12H5.828z"
//                       fill="var(--gray)"
//                     />
//                   </svg>
//                 }
//               ></IconButton>
//             </Flex>
//           ))}
//         </ModalBody>

//         <ModalFooter>
//           <Button colorScheme="blue" mr={3}>
//             Search
//           </Button>
//           <Button onClick={onClose}>Cancel</Button>
//         </ModalFooter>
//       </ModalContent>
//     </Modal>
//   );
// };
