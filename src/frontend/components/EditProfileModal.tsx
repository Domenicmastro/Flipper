import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    Button,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    VStack,
    useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../redux/store";
import { updateUserData } from "../redux/slices/userSlice";
import type { User } from "@/types/User";
import { type Location } from "@/types";
import ImageUpload from "../components/ImageUpload";
import LocationInput from "./LocationInput";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

const EditProfileModal = ({
    isOpen,
    onClose,
    user,
}: EditProfileModalProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const toast = useToast();
    
    const [name, setName] = useState(user.name ?? "");
    const [image, setImage] = useState(user.image ?? "");
    const [bio, setBio] = useState(user.bio ?? "");
    const [location, setLocation] = useState<Location | null>(user.location || null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        
        try {
            await dispatch(updateUserData({
				userId: user.id,
				updates: {
					name,
					image,
					bio,
					location: location || undefined
				}
			})).unwrap();
            
            toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated.",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            
            onClose();
        } catch (error) {
            toast({
                title: "Update failed",
                description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };


    const handleImageUpload = (urls: string[]) => {
        if (urls.length > 0) {
            setImage(urls[0]);
        }
    };

    const handleLocationChange = (newLocation: Location | null) => {
        setLocation(newLocation);
    };

    const handleClose = () => {
        // Reset form to original user data
        setName(user.name ?? "");
        setImage(user.image ?? "");
        setBio(user.bio ?? "");
        setLocation(user.location || null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Edit Profile</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <ImageUpload
                            multiple={false}
                            maxFiles={1}
                            label="Profile Picture"
                            placeholder="Click to select profile picture"
                            onUploadComplete={handleImageUpload}
                            existingImages={image ? [image] : []}
                            maxWidth="200px"
                            aspectRatio={1}
                            variant="profile"
                        />
                        
                        <FormControl>
                            <FormLabel>Display Name</FormLabel>
                            <Input 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your display name"
                            />
                        </FormControl>
                        
                        <FormControl>
                            <FormLabel>Bio</FormLabel>
                            <Textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                resize="vertical"
                            />
                        </FormControl>
                        
                        <LocationInput
                            label="Location"
                            placeholder="Search for your location..."
                            value={location}
                            onChange={handleLocationChange}
                            showCurrentLocationButton={true}
                            showClearButton={true}
                        />
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleClose} mr={3} isDisabled={isLoading}>
                        Cancel
                    </Button>
                    <Button 
                        colorScheme="blue" 
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        loadingText="Saving..."
                    >
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditProfileModal;