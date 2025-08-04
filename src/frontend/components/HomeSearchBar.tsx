import {
	Input,
	InputGroup,
	InputLeftElement,
	Box,
	useColorModeValue,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setSearchQuery, selectFilters } from "../redux/slices/productSlice";
import { useCallback, useEffect, useState } from "react";
import ImageSearchButton from "./ImageSearchButton";
import { useImageUpload } from "../redux/hooks/useImageUpload";
import { getImageEmbedding } from "@/backend/utils/getImageEmbedding";

// Debounce hook to avoid too many Redux updates
function useDebounce(value: string, delay: number) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

export default function HomeSearchBar({
	onImageSearchResults,
	onClearImageSearch,
	isImageSearchActive,
	setImageSearchLoading,
}: {
	onImageSearchResults?: (results: any[]) => void;
	onClearImageSearch?: () => void;
	isImageSearchActive?: boolean;
	setImageSearchLoading: (loading: boolean) => void;
}) {
	const dispatch = useAppDispatch();
	const filters = useAppSelector(selectFilters);
	const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery);

	const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

	const bg = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");

	useEffect(() => {
		if (debouncedSearchQuery !== filters.searchQuery) {
			dispatch(setSearchQuery(debouncedSearchQuery));
		}
	}, [debouncedSearchQuery, dispatch, filters.searchQuery]);

	// Update local state when Redux state changes
	useEffect(() => {
		if (filters.searchQuery !== localSearchQuery) {
			setLocalSearchQuery(filters.searchQuery);
		}
	}, [filters.searchQuery]);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setLocalSearchQuery(e.target.value);
		},
		[]
	);

	const { clearPreviews, uploadSingleImage } = useImageUpload({
		multiple: false,
		onError: (err) => console.error("Upload error:", err),
	});

	const handleImageSearch = async (file: File) => {
		try {
			setImageSearchLoading(true);
			const imageUrl = await uploadSingleImage(file);
			console.log("Uploaded to Cloudinary:", imageUrl);

			const embedding = await getImageEmbedding(imageUrl);
			if (!embedding) throw new Error("Failed to get embedding");
			console.log("Got embedding:", embedding);

			const res = await fetch("http://localhost:3000/api/products/image", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ embedding }),
			});

			if (!res.ok) throw new Error("Search API failed");

			const data = await res.json();
			console.log("Search results:", data.results);
			onImageSearchResults?.(data.results.map((r: any) => r.product));
		} catch (err) {
			console.error("Image search failed:", err);
		} finally {
			clearPreviews();
			setImageSearchLoading(false);
		}
	};

	return (
		<Box
			bg={useColorModeValue("white", "gray.700")}
			p={4}
			borderBottom="1px"
			borderColor={borderColor}
		>
			<InputGroup>
				<InputLeftElement pointerEvents="none">
					<SearchIcon color="gray.300" />
				</InputLeftElement>
				<Input
					type="text"
					placeholder="Search products..."
					value={localSearchQuery}
					onChange={handleSearchChange}
					bg={bg}
					borderColor={borderColor}
					_hover={{ borderColor: "blue.300" }}
					_focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
				/>
				<ImageSearchButton onImageSelected={handleImageSearch} />
			</InputGroup>
			{isImageSearchActive && onClearImageSearch && (
				<Box mt={2} textAlign="right">
					<button
						onClick={onClearImageSearch}
						style={{
							fontSize: "12px",
							color: "#0070f3",
							background: "none",
							border: "none",
							cursor: "pointer",
							textDecoration: "underline",
						}}
					>
						Clear image search
					</button>
				</Box>
			)}
		</Box>
	);
}
