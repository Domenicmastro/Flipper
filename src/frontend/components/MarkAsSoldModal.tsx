import {
	Box,
	Button,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	VStack,
	HStack,
	Avatar,
	useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { useAppSelector } from "../redux/hooks";
import { selectAllUsers } from "../redux/slices/userSlice";
import type { Product, User } from "../../types";

type MarkAsSoldModalProps = {
	isOpen: boolean;
	onClose: () => void;
	product: Product;
	onMarkAsSold: (buyerId: string) => Promise<void>;
};

export default function MarkAsSoldModal({
	isOpen,
	onClose,
	product,
	onMarkAsSold,
}: MarkAsSoldModalProps) {
	const [selectedBuyer, setSelectedBuyer] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);
	const toast = useToast();
	// const dispatch = useAppDispatch();
	
	const allUsers = useAppSelector(selectAllUsers);
	const currentUser = useAppSelector((state) => state.users.currentUser);
	
	// Filter out the current user (seller) from the list
	const availableBuyers = allUsers.filter(user => user.id !== currentUser?.id);

	const handleSubmit = async () => {
		if (!selectedBuyer) {
			toast({
				title: "Please select a buyer",
				status: "warning",
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		setLoading(true);
		try {
			await onMarkAsSold(selectedBuyer.id);
			toast({
				title: "Product marked as sold!",
				description: `${product.name} has been sold to ${selectedBuyer.name}`,
				status: "success",
				duration: 3000,
				isClosable: true,
			});
			onClose();
		} catch (error) {
			toast({
				title: "Failed to mark as sold",
				description: error instanceof Error ? error.message : "An error occurred",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setSelectedBuyer(null);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="md">
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Mark "{product.name}" as Sold</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<VStack spacing={4} align="stretch">
						<Text fontSize="sm" color="gray.600">
							Select the buyer who purchased this item:
						</Text>
						
						<Box
							maxH="300px"
							overflowY="auto"
							border="1px solid"
							borderColor="gray.200"
							borderRadius="md"
							p={2}
						>
							{availableBuyers.length === 0 ? (
								<Text color="gray.500" textAlign="center" py={4}>
									No other users available
								</Text>
							) : (
								<VStack spacing={2} align="stretch">
									{availableBuyers.map((user) => (
										<Box
											key={user.id}
											p={3}
											borderRadius="md"
											cursor="pointer"
											bg={selectedBuyer?.id === user.id ? "blue.50" : "white"}
											border="1px solid"
											borderColor={selectedBuyer?.id === user.id ? "blue.200" : "gray.200"}
											_hover={{ bg: "gray.50" }}
											onClick={() => setSelectedBuyer(user)}
										>
											<HStack spacing={3}>
												<Avatar
													size="sm"
													src={user.image}
													name={user.name}
												/>
												<VStack align="start" spacing={0} flex={1}>
													<Text fontWeight="medium">{user.name}</Text>
													<Text fontSize="sm" color="gray.600">
														{user.email}
													</Text>
													{user.location?.label && (
														<Text fontSize="xs" color="gray.500">
															{user.location.label}
														</Text>
													)}
												</VStack>
											</HStack>
										</Box>
									))}
								</VStack>
							)}
						</Box>
						
						{selectedBuyer && (
							<Box
								p={3}
								bg="blue.50"
								borderRadius="md"
								border="1px solid"
								borderColor="blue.200"
							>
								<Text fontSize="sm" fontWeight="medium" color="blue.800">
									Selected Buyer:
								</Text>
								<HStack spacing={3} mt={2}>
									<Avatar
										size="sm"
										src={selectedBuyer.image}
										name={selectedBuyer.name}
									/>
									<VStack align="start" spacing={0}>
										<Text fontWeight="medium">{selectedBuyer.name}</Text>
										<Text fontSize="sm" color="gray.600">
											{selectedBuyer.email}
										</Text>
									</VStack>
								</HStack>
							</Box>
						)}
					</VStack>
				</ModalBody>

				<ModalFooter>
					<Button variant="ghost" mr={3} onClick={handleClose}>
						Cancel
					</Button>
					<Button
						colorScheme="green"
						onClick={handleSubmit}
						isLoading={loading}
						loadingText="Marking as sold..."
						isDisabled={!selectedBuyer}
					>
						Mark as Sold
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}