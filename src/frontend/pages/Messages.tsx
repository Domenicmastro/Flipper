import {
  Box,
  Heading,
  VStack,
  Flex,
  Text,
  Input,
  Button,
  useColorModeValue,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import { FaUser } from "react-icons/fa";
import HomeProductCard from "@/frontend/components/HomeProductCard";
import {useAppSelector} from "@/frontend/redux/hooks.ts";
import {fetchUserById, selectCurrentUser} from "@/frontend/redux/slices/userSlice.ts";
import {useNavigate} from "react-router-dom";
import { type Conversation, fetchConversations, fetchMessages, selectMessageMap, sendMessage } from "@/frontend/redux/slices/messageSlice";
import type { Message, Product, User} from "@/types";
import { useAppDispatch } from "@/frontend/redux/hooks";
import {fetchProduct} from "@/frontend/redux/slices/productSlice.ts";
import { useParams } from "react-router-dom";
import { serverTimestamp } from "firebase/firestore";
import { useCallback } from "react";


export function MessagesPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [modalUser, setModalUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const navigator = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const [userConversations, setUserConversations] = useState<Conversation[]>([]);
  const [conversationUsers, setConversationUsers] = useState<Record<string, User>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const dispatch = useAppDispatch();
  const messageMap = useAppSelector(selectMessageMap);
  const selectedConversation = userConversations.find((c) => c.id === selectedUserId) || null;
  const selectedOtherUserId = selectedConversation?.participants.find((id) => id !== currentUser?.id) || null;
  const selectedOtherUser = selectedOtherUserId ? conversationUsers[selectedOtherUserId] : null;
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const sortedUserConversations = [...userConversations].sort((a, b) => {
    const timeA = a.lastUpdated.seconds * 1000 + a.lastUpdated.nanoseconds / 1e6;
    const timeB = b.lastUpdated.seconds * 1000 + b.lastUpdated.nanoseconds / 1e6;
    return timeB - timeA; // Descending order
  });

  // if conversationId is provided in the URL, set it as selectedUserId
  const { conversationId } = useParams<{ conversationId?: string }>();

  // UI Color Mode Values
  const bgSidebar = useColorModeValue("gray.50", "gray.800");
  const bgSelected = useColorModeValue("blue.100", "blue.700");
  const bgHover = useColorModeValue("gray.200", "gray.600");
  const chatMeBg = useColorModeValue("blue.500", "blue.400");
  const chatThemBg = useColorModeValue("gray.300", "gray.600");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorderColor = useColorModeValue("gray.300", "gray.600");
  const modalBioColor = useColorModeValue("gray.700", "gray.200");
  const modalLocationColor = useColorModeValue("gray.600", "gray.300");

  const handleUserClick = useCallback(async (conversation: Conversation) => {
    setSelectedUserId(conversation.id);
    setModalUser(conversationUsers[conversation.id] || null);

    try {
      await dispatch(fetchMessages(conversation.id));
    } catch (err) {
      console.error("Failed to load messages", err);
    }

    if (conversation.productId) {
      try {
        const resultAction = await dispatch(fetchProduct(conversation.productId));
        if (fetchProduct.fulfilled.match(resultAction)) {
          setSelectedProduct(resultAction.payload);
        } else {
          setSelectedProduct(null);
        }
      } catch (error) {
        setSelectedProduct(null);
        console.error("Failed to fetch product", error);
      }
    } else {
      setSelectedProduct(null);
    }

    setUnreadCounts((prev) => ({ ...prev, [conversation.id]: 0 }));
  }, [conversationUsers, dispatch]);

  const selectedMessages = selectedUserId ? messageMap[selectedUserId] || [] : [];

  const handleAvatarClick = (user: User) => {
    setModalUser(user);
    onOpen();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !currentUser) return;

    const messageToSend: Omit<Message, "id"> = {
      senderId: currentUser.id,
      conversationId: selectedUserId,
      text: newMessage.trim(),
      timestamp: serverTimestamp(), // ✅ Let Firestore generate the timestamp
    };

    try {
      await dispatch(sendMessage(messageToSend)); // ✅ Actually send the message
      setNewMessage(""); // ✅ Clear the input field on success
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  useEffect(() => {
    async function loadConversations() {

      try {
        if (!currentUser) {
          navigator("/login");
          return;
        }

        const res = await dispatch(fetchConversations(currentUser.id));
        if (fetchConversations.rejected.match(res)) {
          console.error("Failed to fetch conversations:", res.error.message);
          return;
        }
        const conversations = res.payload as Conversation[];
        setUserConversations(conversations);

        const otherUserIds = conversations
            .map((c) => c.participants.find((id) => id !== currentUser.id))
            .filter((id): id is string => !!id);

        const uniqueUserIds = [...new Set(otherUserIds)];

        const fetchedUsers = await Promise.all(
            uniqueUserIds.map(async (userId) => {
              const res = await dispatch(fetchUserById(userId));
              if (fetchUserById.fulfilled.match(res) && res.payload) {
                return [userId, res.payload]; // as const 제거
              }
              return null;
            })
        );

        const entries = fetchedUsers.filter((entry): entry is [string, User] => entry !== null);
        const userMap = Object.fromEntries(entries);
        setConversationUsers(userMap);

      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    }

    loadConversations().then(() =>
        console.log("Conversations loaded successfully")
        ).catch(err =>
        console.error("Error loading conversations:", err)
    );
  }, [currentUser, dispatch, navigator]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [selectedUserId, messageMap]);



// ✅ conversations가 로딩된 이후에만 실행되도록 변경
  useEffect(() => {
    if (!conversationId || userConversations.length === 0) return;

    const matchedConversation = userConversations.find(
        (c) => c.id === conversationId
    );

    if (matchedConversation) {
      handleUserClick(matchedConversation).then(() => {
        console.log("Conversation loaded:", matchedConversation.id);
      });
    }
  }, [conversationId, handleUserClick, userConversations, userConversations.length]); // 💡 handleUserClick 제거도 OK


  return (
      <Flex
          direction={{base: "column", md: "row"}}
          height="calc(100vh - 60px)"
          overflow="hidden"
          bg={useColorModeValue("white", "gray.900")}
          fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      >
        {/* Sidebar: 사용자 리스트 + 연락하기 버튼 + 상품 카드 간단 뷰 */}
        <Box
            w={{base: "100%", md: "350px"}}
            borderRight={{base: "none", md: "1px solid"}}
            borderBottom={{base: "1px solid", md: "none"}}
            borderColor={useColorModeValue("gray.300", "gray.700")}
            p={4}
            overflowY="auto"
            bg={bgSidebar}
            display="flex"
            flexDirection="column"
        >
          <Heading size="md" mb={4} fontWeight="semibold" letterSpacing="wide">
            Conversations
          </Heading>
          <VStack align="stretch" spacing={1} flexGrow={1} overflowY="auto">
            {sortedUserConversations.map((conversation) => {
              // 대화 상대방 id 구하기 (내 id 제외)
              const otherUserId = conversation.participants.find(id => id !== currentUser?.id)!;
              // 상대 유저 정보 가져오기
              const user = conversationUsers[otherUserId];

              // 마지막 메시지 (없으면 기본값)
              const lastMessage = conversation.lastMessage || "No messages yet";

              return (
                  <HStack
                      key={conversation.id}
                      p={3}
                      borderRadius="md"
                      bg={selectedUserId === otherUserId ? bgSelected : "transparent"}
                      cursor="pointer"
                      onClick={() => handleUserClick(conversation)} // conversation 넘기기 (필요하면 변경)
                      spacing={3}
                      _hover={{bg: bgHover}}
                      transition="background-color 0.2s"
                  >
                    <Avatar
                        size="md"
                        src={user?.image}
                        name={user?.name}
                        icon={<FaUser/>}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user) handleAvatarClick(user);
                        }}
                        cursor="pointer"
                    />
                    <Box flex="1" position="relative">
                      <Text fontWeight="bold" fontSize="md" display="inline-block">
                        {user?.name || "Unknown User"}
                      </Text>

                      {unreadCounts[otherUserId] > 0 && (
                          <Box
                              as="span"
                              ml={2}
                              bg="red.500"
                              color="white"
                              fontSize="xs"
                              fontWeight="bold"
                              borderRadius="full"
                              px={2}
                              minW="20px"
                              textAlign="center"
                              userSelect="none"
                              display="inline-block"
                          >
                            {unreadCounts[otherUserId]}
                          </Box>
                      )}

                      <Text color={textColor}
                          fontSize="sm"
                          noOfLines={1}
                          mt={1}
                      >
                        {lastMessage}
                      </Text>
                    </Box>

                    {conversation.productId && (
                        <Box
                            px={2}
                            py={1}
                            bg="blue.500"
                            color="white"
                            fontSize="xs"
                            fontWeight="bold"
                            borderRadius="md"
                            userSelect="none"
                        >
                          Product
                        </Box>
                    )}
                  </HStack>
              );
            })}
          </VStack>
          {selectedProduct && (
          <>
            <Divider my={4} />
            <Text fontWeight="semibold" mb={2}>
              Product related to chat:
            </Text>
            <Box cursor="default">
              <HomeProductCard product={selectedProduct} sellerName={selectedProduct?.name ?? ""} />
            </Box>
          </>
          )}
        </Box>

        {/* Chat Window */}
        <Flex flex={1} direction="column" p={{base: 3, md: 6}} overflow="hidden"
              bg={useColorModeValue("gray.50", "gray.800")}>
          {selectedUserId ? (
              <>
                {/* Header */}
                <Flex align="center" mb={4}>
                  <Avatar
                      size="lg"
                      src={selectedOtherUser?.image}
                      name={selectedOtherUser?.name}
                      mr={4}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedOtherUser) handleAvatarClick(selectedOtherUser);
                      }}
                      cursor="pointer"
                  />
                  <Box>
                    <Heading size="lg" fontWeight="semibold">
                      {selectedOtherUser?.name || "Unknown"}
                    </Heading>
                    {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
                    <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                      {selectedConversation?.productId ? "Chatting about the product" : "Start a conversation"}
                    </Text>
                  </Box>
                </Flex>

                {/* 메시지 영역 (상품 카드 없음) */}
                <VStack
                    flex={1}
                    align="stretch"
                    spacing={3}
                    overflowY="auto"
                    maxH="calc(100vh - 60px - 140px)" // 헤더 + 입력창 영역 고려
                    px={{base: 2, md: 4}}
                >
                  {selectedMessages.map((msg, i) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                        <Flex
                            key={i}
                            justify={isMe ? "flex-end" : "flex-start"}
                            align="flex-start"
                            px={2}
                        >
                          {!isMe && (
                              <Avatar
                                  name={selectedOtherUser?.name}
                                  src={selectedOtherUser?.image}
                                  boxSize="40px"
                                  mr={3}
                                  mt={1}
                              />
                          )}
                          <Box
                              bg={isMe ? chatMeBg : chatThemBg}
                              color={isMe ? "white" : (chatThemBg === "gray.300" ? "black" : "white")}
                              px={4}
                              py={2}
                              borderRadius="lg"
                              maxW={{ base: "75%", md: "60%" }}
                              whiteSpace="pre-wrap"
                              wordBreak="break-word"
                              boxShadow="md"
                              fontSize={{ base: "sm", md: "md" }}
                          >
                            {msg.text}
                          </Box>
                        </Flex>
                    );
                  })}
                  <div ref={messagesEndRef}/>
                </VStack>

                {/* 입력창 */}
                <HStack mt={4} spacing={3}>
                  <Input
                      placeholder="Type a message and press Enter..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      resize="none"
                      fontSize={{base: "sm", md: "md"}}
                      bg={inputBg}
                      borderColor={inputBorderColor}
                      _focus={{borderColor: "blue.400", boxShadow: "0 0 0 1px #3182CE"}}
                  />
                  <Button
                      colorScheme="blue"
                      onClick={handleSendMessage}
                      fontSize={{base: "sm", md: "md"}}
                      minW="80px"
                  >
                    Send
                  </Button>
                </HStack>
              </>
          ) : (
              <Flex flex={1} justify="center" align="center">
                <Text color={textColor} fontSize="lg">
                  Select a conversation to start chatting
                </Text>
              </Flex>
          )}
        </Flex>

        {/* 사용자 프로필 모달 */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay/>
          <ModalContent maxW="320px" borderRadius="lg" boxShadow="lg" bg={useColorModeValue("white", "gray.700")}>
            <ModalHeader fontSize="xl" fontWeight="bold" textAlign="center" borderBottom="1px solid"
                         borderColor={useColorModeValue("gray.200", "gray.600")}>{modalUser?.name || "User"}'s
              Profile</ModalHeader>
            <ModalCloseButton _focus={{boxShadow: "none"}}/>
            <ModalBody pb={6} px={6}>
              <VStack spacing={6} align="center">
                <Avatar
                    name={modalUser?.name}
                    src={modalUser?.image}
                    size="2xl"
                    boxShadow="md"
                    border="2px solid"
                    borderColor={useColorModeValue("blue.400", "blue.300")}
                    mt="10"  // 위쪽 공간 확보
                />

                <Text fontSize="sm"
                      color={useColorModeValue("gray.600", "gray.300")}><strong>Email:</strong> {modalUser?.email}
                </Text>

                {modalUser?.location && (
                    <Text fontSize="sm" color={modalLocationColor}>
                      <strong>Location:</strong>{" "}
                      {modalUser.location.city || "Unknown City"}, {modalUser.location.province || "Unknown Province"}
                    </Text>
                )}

                <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.300")}>
                  <strong>Joined:</strong>{" "}
                  {modalUser?.joinedAt ? new Date(modalUser.joinedAt).toLocaleDateString() : "N/A"}
                </Text>

                {modalUser?.bio && (
                    <Text fontSize="md" fontStyle="italic" textAlign="center"
                          color={modalBioColor}>
                      {modalUser.bio}
                    </Text>
                )}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Flex>
  );
}