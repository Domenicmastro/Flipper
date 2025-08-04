import { Box, Image, Stack, Text, Badge, Flex } from "@chakra-ui/react";
import PriceDisplay from "./PriceDisplay";
import type { Product } from "@/types/Product"; 

interface SwipeCardProps {
  product: Product;
  imageHeight: string | number;
}

export default function SwipeCard({ product, imageHeight }: SwipeCardProps) {
  return (
    <Box
      w="100%"
      h="100%"
      minH="570px"
      bg="white"
      borderRadius="2xl"
      boxShadow="lg"
      p={5}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      position="absolute"
      overflow="hidden"
      transition="transform 0.2s ease"
      _hover={{ transform: "scale(1.015)", boxShadow: "xl" }}
    >
      <Box
        w="100%"
        h={imageHeight}
        maxH="70%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        borderRadius="xl"
        mb={4}
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          maxH="100%"
          maxW="100%"
          objectFit="contain"
          borderRadius="lg"
        />
      </Box>

      <Stack spacing={2} textAlign="center" w="100%">
        <Text fontSize="xl" fontWeight="bold" noOfLines={1}>
          {product.name}
        </Text>
        <Text fontSize="sm" color="gray.600" noOfLines={3}>
          {product.description}
        </Text>
        <Flex align="center" justify="center" gap={2} mt={2}>
          <PriceDisplay
								basePrice={product.price ?? 0}
								priceComparisons={product.priceComparisons}
								fontSize="1em"
							/>
          <Badge colorScheme="teal" borderRadius="full" px={2}>
            {product.condition}
          </Badge>
        </Flex>
      </Stack>
    </Box>
  );
}