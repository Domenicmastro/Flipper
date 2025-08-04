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
    Input,
    Textarea,
    Select,
    VStack,
    HStack,
    useToast,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Checkbox,
    CheckboxGroup,
    Tag,
    TagLabel,
    TagCloseButton,
    Wrap,
    WrapItem,
    Box,
    Image,
    IconButton,
    Flex,
    AspectRatio,
    useColorModeValue,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@chakra-ui/icons";
import type { Product, Category, Condition, Attribute, AttributeCategory, AttributeValue, Location } from "@/types/Product";
import { Category as CategoryEnum, Condition as ConditionEnum, Attributes } from "@/types/Product";
import { useAppDispatch } from "../redux/hooks";
import { updateProductThunk } from "../redux/slices/productSlice";
import ImageUpload from "../components/ImageUpload";
import LocationInput from "./LocationInput";

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product;
    onSubmit?: (productData: Partial<Product>) => void;
}

interface ImageCarouselProps {
    images: string[];
    onRemoveImage?: (index: number) => void;
    canRemove?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, onRemoveImage, canRemove = false }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const bg = useColorModeValue('gray.50', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    if (images.length === 0) {
        return null;
    }

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <Box position="relative" bg={bg} borderRadius="md" p={2} border="1px solid" borderColor={borderColor}>
            <AspectRatio ratio={4/3} maxW="400px" mx="auto">
                <Box position="relative" borderRadius="md" overflow="hidden">
                    <Image
                        src={images[currentIndex]}
                        alt={`Product image ${currentIndex + 1}`}
                        objectFit="cover"
                        w="100%"
                        h="100%"
                    />
                    
                    {canRemove && onRemoveImage && (
                        <IconButton
                            aria-label="Remove image"
                            icon={<CloseIcon />}
                            size="sm"
                            position="absolute"
                            top={2}
                            right={2}
                            colorScheme="red"
                            onClick={() => onRemoveImage(currentIndex)}
                        />
                    )}
                    
                    {images.length > 1 && (
                        <>
                            <IconButton
                                aria-label="Previous image"
                                icon={<ChevronLeftIcon />}
                                position="absolute"
                                left={2}
                                top="50%"
                                transform="translateY(-50%)"
                                onClick={goToPrevious}
                                bg="blackAlpha.600"
                                color="white"
                                _hover={{ bg: "blackAlpha.800" }}
                                size="sm"
                            />
                            <IconButton
                                aria-label="Next image"
                                icon={<ChevronRightIcon />}
                                position="absolute"
                                right={2}
                                top="50%"
                                transform="translateY(-50%)"
                                onClick={goToNext}
                                bg="blackAlpha.600"
                                color="white"
                                _hover={{ bg: "blackAlpha.800" }}
                                size="sm"
                            />
                        </>
                    )}
                </Box>
            </AspectRatio>
            
            {images.length > 1 && (
                <Flex justify="center" mt={2} gap={1}>
                    {images.map((_, index) => (
                        <Box
                            key={index}
                            w={2}
                            h={2}
                            borderRadius="full"
                            bg={index === currentIndex ? "blue.500" : "gray.400"}
                            cursor="pointer"
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </Flex>
            )}
            
            <Box textAlign="center" mt={2} fontSize="sm" color="gray.500">
                {currentIndex + 1} of {images.length}
            </Box>
        </Box>
    );
};

const EditProductModal: React.FC<EditProductModalProps> = ({
    isOpen,
    onClose,
    product,
    onSubmit,
}) => {
    const dispatch = useAppDispatch();
    const [formData, setFormData] = useState({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        condition: product.condition,
        categories: product.categories || [],
        tags: product.tags || [],
        attributes: product.attributes || [],
        images: product.images || [],
        location: product.location,
    });
    const [newTag, setNewTag] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast({
                title: "Please provide a product name",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!formData.description.trim()) {
            toast({
                title: "Please provide a product description",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (formData.price <= 0) {
            toast({
                title: "Please provide a valid price",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!formData.location) {
            toast({
                title: "Please provide a location",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const updateData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: formData.price,
                condition: formData.condition,
                categories: formData.categories,
                tags: formData.tags,
                attributes: formData.attributes,
                images: formData.images,
                location: formData.location,
            };

            if (onSubmit) {
                // Use custom submit handler if provided
                await onSubmit(updateData);
            } else {
                // Use Redux thunk for updating product
                await dispatch(updateProductThunk({
                    productId: product.id,
                    updates: updateData
                })).unwrap();
            }
            
            toast({
                title: "Product updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            
            onClose();
        } catch (error) {
            toast({
                title: "Failed to update product",
                description: error instanceof Error ? error.message : "Please try again later",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            console.error("Error updating product:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Reset form to original product data
        setFormData({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            condition: product.condition,
            categories: product.categories || [],
            tags: product.tags || [],
            attributes: product.attributes || [],
            images: product.images || [],
            location: product.location,
        });
        setNewTag("");
        onClose();
    };

    const handleImageUpload = (urls: string[]) => {
        setFormData({
            ...formData,
            images: [...formData.images, ...urls]
        });
    };

    const handleRemoveImage = (index: number) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, i) => i !== index)
        });
    };

    const handleLocationChange = (location: Location | null) => {
        setFormData({
            ...formData,
            location: location || product.location // Fallback to original location if null
        });
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, newTag.trim()],
            });
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove),
        });
    };

    const handleAttributeChange = (category: AttributeCategory, value: AttributeValue, checked: boolean) => {
        if (checked) {
            // Add attribute
            const newAttribute: Attribute = { category, value };
            setFormData({
                ...formData,
                attributes: [...formData.attributes.filter(attr => !(attr.category === category && attr.value === value)), newAttribute],
            });
        } else {
            // Remove attribute
            setFormData({
                ...formData,
                attributes: formData.attributes.filter(attr => !(attr.category === category && attr.value === value)),
            });
        }
    };

    const isAttributeChecked = (category: AttributeCategory, value: string) => {
        return formData.attributes.some(attr => attr.category === category && attr.value === value);
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalOverlay />
            <ModalContent maxH="90vh" overflowY="auto">
                <ModalHeader>Edit Product</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        {/* Current Images Carousel */}
                        {formData.images.length > 0 && (
                            <Box>
                                <FormLabel>Current Images</FormLabel>
                                <ImageCarousel
                                    images={formData.images}
                                    onRemoveImage={handleRemoveImage}
                                    canRemove={true}
                                />
                            </Box>
                        )}

                        {/* Image Upload */}
                        <ImageUpload
                            multiple={true}
                            maxFiles={5}
                            label="Add More Images"
                            placeholder="Upload additional product images"
                            onUploadComplete={handleImageUpload}
                            existingImages={[]}
                            aspectRatio={4/3}
                            variant="compact"
                        />

                        <FormControl>
                            <FormLabel>Product Name</FormLabel>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter product name"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your product..."
                                rows={4}
                                resize="vertical"
                            />
                        </FormControl>

                        <LocationInput
                            label="Product Location"
                            placeholder="Where is this product located?"
                            value={formData.location}
                            onChange={handleLocationChange}
                            showCurrentLocationButton={true}
                            showClearButton={true}
                        />

                        <HStack spacing={4}>
                            <FormControl>
                                <FormLabel>Price ($)</FormLabel>
                                <NumberInput
                                    value={formData.price}
                                    onChange={(valueString) => setFormData({ ...formData, price: parseFloat(valueString) || 0 })}
                                    min={0}
                                    precision={2}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Condition</FormLabel>
                                <Select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as Condition })}
                                >
                                    {Object.values(ConditionEnum).map(condition => (
                                        <option key={condition} value={condition}>
                                            {condition}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        </HStack>

                        <FormControl>
                            <FormLabel>Categories</FormLabel>
                            <CheckboxGroup
                                value={formData.categories}
                                onChange={(values) => setFormData({ ...formData, categories: values as Category[] })}
                            >
                                <Wrap>
                                    {Object.values(CategoryEnum).map(category => (
                                        <WrapItem key={category}>
                                            <Checkbox value={category} size="sm">
                                                {category}
                                            </Checkbox>
                                        </WrapItem>
                                    ))}
                                </Wrap>
                            </CheckboxGroup>
                        </FormControl>

                        {/* Attributes */}
                        {Object.entries(Attributes).map(([category, values]) => (
                            <FormControl key={category}>
                                <FormLabel>{category}</FormLabel>
                                <CheckboxGroup>
                                    <Wrap>
                                        {values.map(value => (
                                            <WrapItem key={value}>
                                                <Checkbox
                                                    isChecked={isAttributeChecked(category as AttributeCategory, value)}
                                                    onChange={(e) => handleAttributeChange(category as AttributeCategory, value, e.target.checked)}
                                                    size="sm"
                                                >
                                                    {value}
                                                </Checkbox>
                                            </WrapItem>
                                        ))}
                                    </Wrap>
                                </CheckboxGroup>
                            </FormControl>
                        ))}

                        <FormControl>
                            <FormLabel>Tags</FormLabel>
                            <HStack mb={2}>
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add a tag"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                />
                                <Button onClick={handleAddTag} colorScheme="teal" variant="outline">
                                    Add
                                </Button>
                            </HStack>
                            <Wrap>
                                {formData.tags.map((tag, index) => (
                                    <WrapItem key={index}>
                                        <Tag size="md" colorScheme="teal" variant="solid" borderRadius="full">
                                            <TagLabel># {tag}</TagLabel>
                                            <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                                        </Tag>
                                    </WrapItem>
                                ))}
                            </Wrap>
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
                        loadingText="Updating..."
                    >
                        Update Product
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditProductModal;