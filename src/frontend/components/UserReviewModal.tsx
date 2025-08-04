import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalCloseButton,
	Box,
	Text,
	Divider,
	Flex,
} from "@chakra-ui/react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { type User, type Review } from "@/types/User";

interface UserReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	user: User;
}

const renderStars = (score: number) => {
	const stars = [];
	for (let i = 1; i <= 5; i++) {
		if (score >= i) stars.push(<FaStar key={i} color="gold" />);
		else if (score >= i - 0.5)
			stars.push(<FaStarHalfAlt key={i} color="gold" />);
		else stars.push(<FaRegStar key={i} color="lightgray" />);
	}
	return <Flex>{stars}</Flex>;
};

const UserReviewModal = ({ isOpen, onClose, user }: UserReviewModalProps) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>{user.name}'s Reviews</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					{user.reviews.length === 0 ? (
						<Text>No reviews yet.</Text>
					) : (
						user.reviews.map((review: Review, index: number) => (
							<Box key={index} mb={4}>
								{renderStars(review.score)}
								<Text fontSize="sm" color="gray.700" mt={1}>
									{review.comment}
								</Text>
								<Text fontSize="xs" color="gray.500" mt={1}>
									— as {review.role}
								</Text>
								<Divider mt={2} />
							</Box>
						))
					)}
				</ModalBody>
			</ModalContent>
		</Modal>
	);
};

export default UserReviewModal;
