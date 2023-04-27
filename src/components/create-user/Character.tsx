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
import React, { useEffect, useState } from "react";
import GiornoSkin from "../../assets/Giorno2.png";
import Image, { StaticImageData } from "next/image";

import produce from "immer";
import { trpc } from "~/utils/api";
import { ActiveSlots, InventorySlot, getEntries } from "~/types/main";
import * as pako from "pako";
import { getQueryKey } from "@trpc/react-query";
import { useQueryClient } from "@tanstack/react-query";

const Character = ({
  profile,
  isCharacterOpen,
  onCharacterOpen,
  onCharacterClose,
  activeSlots,
  inventory,
}: {
  profile: string | undefined;
  activeSlots: Uint8Array | undefined;
  inventory: Uint8Array;
  isCharacterOpen: boolean;
  onCharacterOpen: () => void;
  onCharacterClose: () => void;
}) => {
  const updateUserAttributes = trpc.user.updateUserAttributes.useMutation({
    retry: 3,
  });
  const inventoryDataString = pako.inflate(inventory, { to: "string" });
  const inventoryData = JSON.parse(inventoryDataString) as InventorySlot[];
  const inventorySlots: InventorySlot[] = [];
  const userKey = getQueryKey(trpc.user.userById);
  const userComponentKey = getQueryKey(trpc.user.userComponent);
  let count = inventoryData.length;
  for (let i = 0; i < 18 - inventoryData.length; i++) {
    if (count !== 0) {
      inventorySlots.push(inventoryData[i]!);
      count--;
    } else {
      inventorySlots.push({ index: i, item: null });
    }
  }
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

  const [inventorySlotsState, setInventorySlots] =
    useState<InventorySlot[]>(inventorySlots);
  const [activeSlotsState, setActiveSlots] =
    useState<ActiveSlots>(defaultActiveSlots);
  const [profileState, setProfile] = useState<StaticImageData | null | string>(
    null
  );

  useEffect(() => {
    if (activeSlotsState.skin === null) {
      //generate a new character based on active slots and set new profile
      //if skin persist then just show skin

      //if all slots empty then no profile
      const allSlotsEmpty = Object.values(activeSlotsState).every(
        (value) => value === null
      );
      if (allSlotsEmpty) {
        setProfile(null);
      }
    }
  }, [activeSlotsState]);
  useEffect(() => {
    if (profile && activeSlots) {
      const imageData = JSON.parse(profile) as StaticImageData;
      const activeSlotsString = pako.inflate(activeSlots, { to: "string" });
      const activeSlotsData = JSON.parse(activeSlotsString) as ActiveSlots;

      setProfile(imageData);
      setActiveSlots(activeSlotsData);
    }
  }, [profile, activeSlots, inventory]);

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
              {getEntries(activeSlotsState).map(([key, value]) => {
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
                              setActiveSlots(
                                produce((slots) => {
                                  slots[key] = null;
                                })
                              );
                              setInventorySlots(
                                produce((inventory) => {
                                  for (let i = 0; i < inventory.length; i++) {
                                    if (!inventory[i]!.item) {
                                      inventory[i]!.item = value;
                                      inventory[i]!.type = key;
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
              {profileState && (
                <Image
                  src={profileState}
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
                {inventorySlotsState.map((slot, i) => {
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
                                setActiveSlots(
                                  produce((slots) => {
                                    slots[slot.type!] = slot.item;
                                    if (slot.type === "skin") {
                                      setProfile(slot.item);
                                    } else {
                                      //generate a new profile based on items
                                    }
                                  })
                                );
                                setInventorySlots(
                                  produce((inventory) => {
                                    inventory[i]!.item = null;
                                    delete inventory[i]!.type;
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
            colorScheme="green"
            mr={3}
            w="28"
            isLoading={updateUserAttributes.isLoading}
            onClick={() => {
              if (profileState) {
                const profileString = JSON.stringify(profileState);

                const activeSlotsString = JSON.stringify(activeSlotsState);
                const activeSlotsData = pako.deflate(activeSlotsString);

                const filledInventory: InventorySlot[] = [];
                for (let i = 0; i < 18; i++) {
                  if (inventorySlotsState[i] && inventorySlotsState[i]!.item) {
                    filledInventory.push(inventorySlotsState[i]!);
                  }
                }
                const filledInventoryString = JSON.stringify(filledInventory);
                const filledInventoryData = pako.deflate(filledInventoryString);

                updateUserAttributes.mutate(
                  {
                    profile: profileString,
                    activeSlots: activeSlotsData,
                    inventory: filledInventoryData,
                  },
                  {
                    onSuccess: () => {
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
              onCharacterClose();
              setInventorySlots(inventorySlots);
              if (profile && activeSlots) {
                const imageData = JSON.parse(profile) as StaticImageData;
                const activeSlotsString = pako.inflate(activeSlots, {
                  to: "string",
                });
                const activeSlotsData = JSON.parse(
                  activeSlotsString
                ) as ActiveSlots;

                setProfile(imageData);
                setActiveSlots(activeSlotsData);
              } else {
                setProfile(null);
                setActiveSlots(defaultActiveSlots);
              }
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
