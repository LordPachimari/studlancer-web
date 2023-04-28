import {
  Box,
  Button,
  Card,
  CardHeader,
  Center,
  Flex,
  FormControl,
  Grid,
  GridItem,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import GiornoSkin from "../../assets/Giorno2.png";
import Image, { StaticImageData } from "next/image";

import produce from "immer";
import { trpc } from "~/utils/api";
import {
  ActiveSlots,
  Inventory,
  InventorySlot,
  getEntries,
} from "~/types/main";
import * as pako from "pako";
import { getQueryKey } from "@trpc/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { get, set } from "idb-keyval";
import { Elsie_Swash_Caps } from "next/font/google";
type CharacterState = {
  activeSlots: ActiveSlots;
  profile: StaticImageData | null | string;
  inventorySlots: InventorySlot[];
};

const Character = ({
  id,
  profile,
  isCharacterOpen,
  onCharacterOpen,
  onCharacterClose,
}: {
  id: string;
  profile: string | undefined;
  isCharacterOpen: boolean;
  onCharacterOpen: () => void;
  onCharacterClose: () => void;
}) => {
  let characterLocalVersion: { server: string; local: string } | undefined =
    undefined;
  const characterLocalVersionString = localStorage.getItem(`CHARACTER#${id}`);
  if (characterLocalVersionString)
    characterLocalVersion = JSON.parse(characterLocalVersionString) as {
      server: string;
      local: string;
    };
  const shouldUpdateLocal =
    !characterLocalVersion ||
    (characterLocalVersion &&
      new Date(characterLocalVersion.server) >
        new Date(characterLocalVersion.local));
  const updateInventory = trpc.user.updateInventory.useMutation({
    retry: 3,
  });

  const inventory = trpc.user.getInventory.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    enabled: shouldUpdateLocal,
  });

  const userKey = getQueryKey(trpc.user.userById);
  const userComponentKey = getQueryKey(trpc.user.userComponent);

  const queryClient = useQueryClient();
  const defaultActiveSlots: ActiveSlots = {
    hat: null,
    glasses: null,
    hair: null,
    upper: null,
    eyes: null,
    lower: null,
    skin: null,
  };
  const toast = useToast();

  const [characterState, setCharacterState] = useState<CharacterState>({
    activeSlots: defaultActiveSlots,
    inventorySlots: [],
    profile: null,
  });

  const fetchCharacterFromServer = useCallback(
    ({
      inventory,
      activeSlots,
      profile,
      lastUpdated,
    }: {
      inventory: Uint8Array;
      activeSlots: Uint8Array;
      profile: string;
      lastUpdated: string;
    }) => {
      console.log("updating local...");
      const inventorySlots: InventorySlot[] = [];
      const inventoryDataString = pako.inflate(inventory, {
        to: "string",
      });
      const inventoryData = JSON.parse(inventoryDataString) as InventorySlot[];
      let count = inventoryData.length;
      for (let i = 0; i < 18 - inventoryData.length; i++) {
        if (count !== 0) {
          inventorySlots.push(inventoryData[i]!);
          count--;
        } else {
          inventorySlots.push({ index: i, item: null });
        }
      }
      const imageData = JSON.parse(profile) as StaticImageData;
      const activeSlotsString = pako.inflate(activeSlots, {
        to: "string",
      });
      const activeSlotsData = JSON.parse(activeSlotsString) as ActiveSlots;
      const state: CharacterState = {
        activeSlots: activeSlotsData,
        inventorySlots: inventorySlots,
        profile: imageData,
      };

      setCharacterState(state);
      set(`CHARACTER#${id}`, state).catch((err) => console.log(err));
      const localVersion = { server: lastUpdated, local: lastUpdated };
      const localVersionString = JSON.stringify(localVersion);

      localStorage.setItem(`CHARACTER#${id}`, localVersionString);
    },
    [id]
  );
  const fetchCharacterFromLocalStorage = useCallback(() => {
    console.log("fetching from local");
    get<CharacterState | undefined>(`CHARACTER#${id}`)
      .then((state) => {
        if (state) {
          setCharacterState(state);
        }
      })
      .catch((err) => {
        console.log("local fetching error", err);
      });
  }, [id]);

  useEffect(() => {
    if (characterState.activeSlots.skin === null) {
      //generate a new character based on active slots and set new profile
      //if skin persist then just show skin

      //if all slots empty then no profile
      const allSlotsEmpty = Object.values(characterState.activeSlots).every(
        (value) => value === null
      );
      if (allSlotsEmpty) {
        setCharacterState(
          produce((state) => {
            state.profile = null;
          })
        );
      }
    }
  }, [characterState.activeSlots]);
  useEffect(() => {
    if (shouldUpdateLocal) {
      //fetch character from the server if local version is stale
      if (
        profile &&
        inventory.data &&
        inventory.data.activeSlots &&
        inventory.data.activeSlots &&
        inventory.data.inventory
      ) {
        fetchCharacterFromServer({
          activeSlots: inventory.data.activeSlots,
          inventory: inventory.data.inventory,
          profile,
          lastUpdated: inventory.data.lastUpdated,
        });
      }
    } else {
      fetchCharacterFromLocalStorage();
    }
  }, [
    profile,
    inventory.data,
    fetchCharacterFromLocalStorage,
    fetchCharacterFromServer,
    shouldUpdateLocal,
  ]);

  const initialRef = React.useRef(null);
  return (
    <Modal
      size="6xl"
      initialFocusRef={initialRef}
      isOpen={isCharacterOpen}
      onClose={onCharacterClose}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent minH="80vh" bg="blue.100">
        <ModalHeader>Create your character</ModalHeader>

        <ModalCloseButton />
        <ModalBody pb={6} display={{ base: "block", md: "flex" }}>
          {/* <Grid templateColumns="repeat(2, 1fr)" gap="3" w="40" h="md"> */}
          <Flex
            flexDir={{ base: "column-reverse", sm: "row" }}
            gap="5"
            alignItems={{ base: "center", sm: "flex-start" }}
            justifyContent="center"
            mb="5"
          >
            <Flex
              flexWrap="wrap"
              gap="5"
              w={{ base: "100%", md: "40" }}
              mt={{ base: "0", md: "16" }}
              mb="5"
              minW="60"
              justifyContent="center"
            >
              {getEntries(characterState.activeSlots).map(([key, value]) => {
                if (value) {
                  return (
                    <Box key={key}>
                      <Text textAlign="center" color="blue.600">
                        {key}
                      </Text>

                      <Menu>
                        <MenuButton
                          w="20"
                          h="20"
                          bg="white"
                          borderRadius="md"
                          boxShadow="inset 0px 0px 4px 3px #63B3ED;"
                          display="flex"
                          flexDir="column"
                          alignItems="center"
                          justifyContent="center"
                          p="1"
                        >
                          <Image src={value} alt="Character" width={40} />
                        </MenuButton>
                        <MenuList minWidth="24" p="1">
                          <MenuItem
                            h="8"
                            p="1"
                            _hover={{ bg: "blue.100" }}
                            onClick={() => {
                              setCharacterState(
                                produce((state) => {
                                  state.activeSlots[key] = null;
                                  for (
                                    let i = 0;
                                    i < state.inventorySlots.length;
                                    i++
                                  ) {
                                    if (!state.inventorySlots[i]!.item) {
                                      state.inventorySlots[i]!.item = value;
                                      state.inventorySlots[i]!.type = key;
                                      break;
                                    }
                                  }
                                })
                              );
                            }}
                          >
                            Remove
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Box>
                  );
                } else {
                  return (
                    <Box key={key}>
                      <Text textAlign="center" color="blue.600">
                        {key}
                      </Text>
                      <GridItem
                        w="20"
                        h="20"
                        bg="white"
                        borderRadius="md"
                        boxShadow="inset 0px 0px 4px 3px #63B3ED;"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      />
                    </Box>
                  );
                }
              })}
            </Flex>

            {/* </Grid> */}
            <Center
              w="80"
              minW="80"
              h="xl"
              bg="white"
              borderRadius="2xl"
              boxShadow="inset 0px 0px 4px 3px #63B3ED;"
            >
              {characterState.profile && (
                <Image
                  src={characterState.profile}
                  alt="Character"
                  width={310}
                  height={560}
                />
              )}
            </Center>
          </Flex>

          <Flex w="100%" h="100%" justifyContent="center">
            <Box w={{ base: "100%", md: "85%" }}>
              <Flex w="100%" h="16" justifyContent="space-evenly">
                <Button colorScheme="blue">Inventory</Button>

                <Button colorScheme="blue">Shop</Button>
              </Flex>

              <Flex flexWrap="wrap" gap="5" w="100%">
                {characterState.inventorySlots.map((slot, i) => {
                  if (slot.item && slot.type) {
                    return (
                      <Box key={slot.index}>
                        <Menu>
                          <MenuButton
                            w="20"
                            h="20"
                            bg="white"
                            borderRadius="md"
                            boxShadow="inset 0px 0px 4px 3px #63B3ED;"
                            display="flex"
                            flexDir="column"
                            alignItems="center"
                            justifyContent="center"
                            p="1"
                          >
                            <Image src={slot.item} alt="Character" width={40} />
                          </MenuButton>
                          <MenuList minWidth="24" p="1">
                            <MenuItem
                              h="8"
                              p="1"
                              _hover={{ bg: "blue.100" }}
                              onClick={() => {
                                setCharacterState(
                                  produce((state) => {
                                    state.activeSlots[slot.type!] = slot.item;
                                    if (slot.type === "skin") {
                                      state.profile = slot.item;
                                    } else {
                                      //generate a new profile based on items
                                    }
                                    state.inventorySlots[i]!.item = null;
                                    delete state.inventorySlots[i]!.type;
                                  })
                                );
                              }}
                            >
                              Equip
                            </MenuItem>
                            <MenuItem h="8" p="1" _hover={{ bg: "blue.100" }}>
                              View
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Box>
                    );
                  } else {
                    return (
                      <Box key={slot.index}>
                        <GridItem
                          w="20"
                          h="20"
                          bg="white"
                          borderRadius="md"
                          boxShadow="inset 0px 0px 4px 3px #63B3ED;"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        ></GridItem>
                      </Box>
                    );
                  }
                })}
              </Flex>
            </Box>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="whatsapp"
            mr={3}
            w="28"
            isLoading={updateInventory.isLoading}
            onClick={() => {
              if (characterState.profile) {
                const profileString = JSON.stringify(characterState.profile);

                const activeSlotsString = JSON.stringify(
                  characterState.activeSlots
                );
                const activeSlotsData = pako.deflate(activeSlotsString);

                const filledInventory: InventorySlot[] = [];
                for (let i = 0; i < 18; i++) {
                  if (
                    characterState.inventorySlots[i] &&
                    characterState.inventorySlots[i]!.item
                  ) {
                    filledInventory.push(characterState.inventorySlots[i]!);
                  }
                }
                const filledInventoryString = JSON.stringify(filledInventory);
                const filledInventoryData = pako.deflate(filledInventoryString);
                const lastUpdated = new Date().toISOString();
                updateInventory.mutate(
                  {
                    profile: profileString,
                    activeSlots: activeSlotsData,
                    inventory: filledInventoryData,
                    lastUpdated: lastUpdated,
                  },
                  {
                    onSuccess: () => {
                      set(`CHARACTER#${id}`, {
                        profile: profileString,
                        activeSlots: activeSlotsData,
                        inventory: filledInventoryData,
                      }).catch((err) => console.log(err));
                      localStorage.setItem(`CHARACTER#${id}`, lastUpdated);
                      queryClient
                        .invalidateQueries([...userKey, ...userComponentKey])
                        .then(() => {
                          toast({
                            status: "success",
                            title: "User character updated",
                            duration: 5000,
                            isClosable: true,
                          });
                          onCharacterClose();
                        })
                        .catch((err) => console.log(err));
                    },
                  }
                );
              } else {
                toast({
                  status: "error",
                  title: "Finish character creation",
                  duration: 10000,
                  isClosable: true,
                });
              }
            }}
          >
            Save
          </Button>
          <Button
            onClick={() => {
              if (shouldUpdateLocal) {
                //fetch character from the server if local version is stale
                if (
                  profile &&
                  inventory.data &&
                  inventory.data.activeSlots &&
                  inventory.data.activeSlots &&
                  inventory.data.inventory
                ) {
                  fetchCharacterFromServer({
                    activeSlots: inventory.data.activeSlots,
                    inventory: inventory.data.inventory,
                    profile,
                    lastUpdated: inventory.data.lastUpdated,
                  });
                } else {
                  setCharacterState(
                    produce((state) => {
                      state.profile = null;
                      state.activeSlots = defaultActiveSlots;
                    })
                  );
                }
              } else {
                fetchCharacterFromLocalStorage();
              }

              onCharacterClose();
            }}
            colorScheme="blue"
            w="28"
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export default Character;
