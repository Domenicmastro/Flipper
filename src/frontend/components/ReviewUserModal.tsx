import { useState } from "react";
import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	Button,
	FormControl,
	FormLabel,
	Textarea,
	Select,
	VStack,
	HStack,
	Text,
	useToast,
} from "@chakra-ui/react";
import { FaStar, FaRegStar } from "react-icons/fa";
import type { ReviewScore, User } from "@/types/User";

interface ReviewUserModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: User;
	onSubmit: (reviewData: {
		score: ReviewScore;
		comment: string;
		role: "buyer" | "seller";
	}) => Promise<void>;
}

const ReviewUserModal: React.FC<ReviewUserModalProps> = ({
	isOpen,
	onClose,
	user,
	onSubmit,
}) => {
	const [score, setScore] = useState<ReviewScore>(5);
	const [comment, setComment] = useState<string>("");
	const [role, setRole] = useState<"buyer" | "seller">("buyer");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const toast = useToast();

	const handleSubmit = async () => {
		if (!comment.trim()) {
			toast({
				title: "Please provide a comment",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit({
				score,
				comment: comment.trim(),
				role,
			});
			// Reset form on success
			handleClose();
		} catch (error) {
			// Error handling is done in parent component via useReviewSubmission
			console.error("Review submission error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		// Reset form state
		setScore(5);
		setComment("");
		setRole("buyer");
		onClose();
	};

	const renderStarRating = () => {
		const stars = [];
		for (let i = 1; i <= 5; i++) {
			stars.push(
				<Button
					key={i}
					variant="ghost"
					size="sm"
					p={1}
					minW="auto"
					onClick={() => setScore(i as ReviewScore)}
					_hover={{ bg: "transparent" }}
				>
					{i <= score ? (
						<FaStar color="gold" size={24} />
					) : (
						<FaRegStar color="lightgray" size={24} />
					)}
				</Button>
			);
		}
		return stars;
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="md">
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Review {user.name}</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<VStack spacing={4} align="stretch">
						<FormControl>
							<FormLabel>Rating</FormLabel>
							<HStack justify="center" spacing={1}>
								{renderStarRating()}
							</HStack>
							<Text textAlign="center" fontSize="sm" color="gray.600" mt={2}>
								{score} star{score !== 1 ? "s" : ""}
							</Text>
						</FormControl>

						<FormControl>
							<FormLabel>Your Role</FormLabel>
							<Select
								value={role}
								onChange={(e) => setRole(e.target.value as "buyer" | "seller")}
							>
								<option value="buyer">I was a buyer</option>
								<option value="seller">I was a seller</option>
							</Select>
						</FormControl>

						<FormControl>
							<FormLabel>Comment</FormLabel>
							<Textarea
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								placeholder="Share your experience with this user..."
								rows={4}
								resize="vertical"
							/>
						</FormControl>
					</VStack>
				</ModalBody>

				<ModalFooter>
					<Button variant="ghost" mr={3} onClick={handleClose}>
						Cancel
					</Button>
					<Button
						colorScheme="blue"
						onClick={handleSubmit}
						isLoading={isSubmitting}
						loadingText="Submitting..."
					>
						Submit Review
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default ReviewUserModal;