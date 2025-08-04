import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Input,
	useToast,
} from "@chakra-ui/react";
import { useState } from "react";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	productId: string;
	currentUserId: string;
	onSuccess?: () => void;
};

export default function PlaceBidModal({
	isOpen,
	onClose,
	productId,
	currentUserId,
	onSuccess,
}: Props) {
	const toast = useToast();
	const [bidAmount, setBidAmount] = useState<string>("");

	const handleSubmit = async () => {
		try {
			const numericAmount = parseFloat(bidAmount);

			if (!bidAmount || isNaN(numericAmount) || numericAmount <= 0) {
				toast({
					title: "Invalid Bid",
					description: "Please enter a valid positive number",
					status: "warning",
					duration: 3000,
					isClosable: true,
				});
				return;
			}

			const res = await fetch(`/api/bids/${productId}/bid`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amount: numericAmount, userId: currentUserId }),
			});

			if (!res.ok) {
				const { error } = await res.json();
				throw new Error(error || "Failed to place bid");
			}

			toast({
				title: "Bid placed!",
				status: "success",
				duration: 3000,
				isClosable: true,
			});

			onClose();
			onSuccess?.();
		} catch (err: any) {
			toast({
				title: "Bid failed",
				description: err.message,
				status: "error",
				duration: 3000,
				isClosable: true,
			});
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Place a Bid</ModalHeader>
				<ModalBody>
					<Input
						type="number"
						placeholder="Enter your bid amount"
						value={bidAmount}
						onChange={(e) => setBidAmount(e.target.value)}
					/>
				</ModalBody>
				<ModalFooter>
					<Button onClick={onClose} mr={3}>
						Cancel
					</Button>
					<Button colorScheme="blue" onClick={handleSubmit}>
						Submit
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}