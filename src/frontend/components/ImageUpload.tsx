import React, { useRef } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    HStack,
    VStack,
    Image,
    IconButton,
    Progress,
    Text,
    useToast,
    SimpleGrid,
    AspectRatio,
    Center,
    Flex,
} from '@chakra-ui/react';
import { CloseIcon, AddIcon } from '@chakra-ui/icons';
import { useImageUpload } from '../redux/hooks/useImageUpload';
import BoundedImage from './BoundedImage';

interface ImageUploadProps {
    multiple?: boolean;
    maxFiles?: number;
    label?: string;
    placeholder?: string;
    onUploadComplete?: (urls: string[]) => void;
    existingImages?: string[];
    maxWidth?: string;
    aspectRatio?: number;
    showProgress?: boolean;
    variant?: 'standard' | 'compact' | 'profile';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    multiple = false,
    maxFiles = 5,
    label = 'Upload Images',
    placeholder = 'Click to select images',
    onUploadComplete,
    existingImages = [],
    maxWidth = '200px',
    aspectRatio = 1,
    showProgress = true,
    variant = 'standard'
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const {
        previews,
        isUploading,
        uploadProgress,
        handleFileSelect,
        uploadImages,
        clearPreviews,
        removePreview
    } = useImageUpload({
        multiple,
        maxFiles,
        onSuccess: (urls) => {
            onUploadComplete?.(urls);
            toast({
                title: "Images uploaded successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        },
        onError: (error) => {
            toast({
                title: "Upload failed",
                description: error,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    });

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(event.target.files);
    };

    const handleUpload = async () => {
        try {
            await uploadImages();
        } catch (error) {
            // Error handling is done in the hook
            console.log(error)
        }
    };

    const allImages = [...existingImages, ...previews];
    const canAddMore = allImages.length < maxFiles;

    if (variant === 'profile') {
        return (
            <FormControl>
                <FormLabel>{label}</FormLabel>
                <VStack spacing={4}>
                    <AspectRatio ratio={aspectRatio} width={maxWidth}>
                        <Box
                            borderWidth={2}
                            borderStyle="dashed"
                            borderColor="gray.300"
                            borderRadius="md"
                            cursor="pointer"
                            onClick={handleClick}
                            _hover={{ borderColor: 'blue.400', bg: 'gray.50' }}
                            position="relative"
                        >
                            {allImages.length > 0 ? (
                                <Image
                                    src={allImages[0]}
                                    alt="Profile"
                                    objectFit="cover"
                                    borderRadius="md"
                                />
                            ) : (
                                <Center>
                                    <VStack>
                                        <AddIcon />
                                        <Text fontSize="sm" color="gray.500">
                                            {placeholder}
                                        </Text>
                                    </VStack>
                                </Center>
                            )}
                        </Box>
                    </AspectRatio>
                    
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        display="none"
                        multiple={multiple}
                    />
                    
                    {previews.length > 0 && (
                        <HStack>
                            <Button
                                size="sm"
                                onClick={handleUpload}
                                isLoading={isUploading}
                                loadingText="Uploading..."
                                colorScheme="blue"
                            >
                                Upload
                            </Button>
                            <Button size="sm" onClick={clearPreviews} variant="outline">
                                Clear
                            </Button>
                        </HStack>
                    )}
                    
                    {isUploading && showProgress && (
                        <Progress value={uploadProgress} width="100%" />
                    )}
                </VStack>
            </FormControl>
        );
    }

    if (variant === 'compact') {
        return (
            <FormControl>
                <FormLabel>{label}</FormLabel>
                <HStack spacing={4}>
                    <Button
                        onClick={handleClick}
                        leftIcon={<AddIcon />}
                        variant="outline"
                        size="sm"
                        isDisabled={!canAddMore}
                    >
                        Add {multiple ? 'Images' : 'Image'}
                    </Button>
                    
                    {previews.length > 0 && (
                        <Button
                            onClick={handleUpload}
                            isLoading={isUploading}
                            loadingText="Uploading..."
                            colorScheme="blue"
                            size="sm"
                        >
                            Upload ({previews.length})
                        </Button>
                    )}
                </HStack>
                
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    display="none"
                    multiple={multiple}
                />
                
                {isUploading && showProgress && (
                    <Progress value={uploadProgress} size="sm" mt={2} />
                )}
            </FormControl>
        );
    }

    // Standard variant
    return (
        <FormControl>
            <FormLabel>{label}</FormLabel>
            <VStack spacing={4} align="stretch">
                {allImages.length > 0 && (
                    <SimpleGrid columns={[2, 3, 4]} spacing={4}>
                        {allImages.map((image, index) => (
                            <Box key={index} position="relative">
                                <AspectRatio ratio={aspectRatio}>
                                    <BoundedImage
                                        src={image}
                                        alt={`Image ${index + 1}`}
                                        maxW={maxWidth}
                                    />
                                </AspectRatio>
                                {index >= existingImages.length && (
                                    <IconButton
                                        aria-label="Remove image"
                                        icon={<CloseIcon />}
                                        size="sm"
                                        position="absolute"
                                        top={1}
                                        right={1}
                                        onClick={() => removePreview(index - existingImages.length)}
                                        bg="red.500"
                                        color="white"
                                        _hover={{ bg: 'red.600' }}
                                    />
                                )}
                            </Box>
                        ))}
                        
                        {canAddMore && (
                            <AspectRatio ratio={aspectRatio}>
                                <Box
                                    borderWidth={2}
                                    borderStyle="dashed"
                                    borderColor="gray.300"
                                    borderRadius="md"
                                    cursor="pointer"
                                    onClick={handleClick}
                                    _hover={{ borderColor: 'blue.400', bg: 'gray.50' }}
                                >
                                    <Center>
                                        <VStack>
                                            <AddIcon />
                                            <Text fontSize="sm" color="gray.500">
                                                Add More
                                            </Text>
                                        </VStack>
                                    </Center>
                                </Box>
                            </AspectRatio>
                        )}
                    </SimpleGrid>
                )}
                
                {allImages.length === 0 && (
                    <AspectRatio ratio={aspectRatio} maxW={maxWidth}>
                        <Box
                            borderWidth={2}
                            borderStyle="dashed"
                            borderColor="gray.300"
                            borderRadius="md"
                            cursor="pointer"
                            onClick={handleClick}
                            _hover={{ borderColor: 'blue.400', bg: 'gray.50' }}
                        >
                            <Center>
                                <VStack>
                                    <AddIcon />
                                    <Text fontSize="sm" color="gray.500">
                                        {placeholder}
                                    </Text>
                                </VStack>
                            </Center>
                        </Box>
                    </AspectRatio>
                )}
                
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    display="none"
                    multiple={multiple}
                />
                
                {previews.length > 0 && (
                    <Flex justify="space-between" align="center">
                        <Text fontSize="sm" color="gray.600">
                            {previews.length} image{previews.length > 1 ? 's' : ''} selected
                        </Text>
                        <HStack>
                            <Button
                                size="sm"
                                onClick={handleUpload}
                                isLoading={isUploading}
                                loadingText="Uploading..."
                                colorScheme="blue"
                            >
                                Upload
                            </Button>
                            <Button size="sm" onClick={clearPreviews} variant="outline">
                                Clear
                            </Button>
                        </HStack>
                    </Flex>
                )}
                
                {isUploading && showProgress && (
                    <Progress value={uploadProgress} />
                )}
            </VStack>
        </FormControl>
    );
};

export default ImageUpload;