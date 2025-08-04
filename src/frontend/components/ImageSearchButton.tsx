import { IconButton, Input as ChakraInput, Tooltip } from "@chakra-ui/react";
import { FaCamera } from "react-icons/fa";
import { useRef } from "react";

type ImageSearchButtonProps = {
	onImageSelected: (file: File) => void;
};

export default function ImageSearchButton({
	onImageSelected,
}: ImageSearchButtonProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onImageSelected(file);
			e.target.value = ""; // reset input to allow re-uploading the same file
		}
	};

	return (
		<>
			<Tooltip label="Search by image" placement="top">
				<IconButton
					aria-label="Search by image"
					icon={<FaCamera />}
					onClick={handleClick}
					variant="ghost"
					size="sm"
					ml={2}
				/>
			</Tooltip>
			<ChakraInput
				type="file"
				accept="image/*"
				onChange={handleChange}
				display="none"
				ref={fileInputRef}
			/>
		</>
	);
}
