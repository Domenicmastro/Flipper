import { useState, useCallback } from "react";

interface UseImageUploadOptions {
	multiple?: boolean;
	maxFiles?: number;
	onSuccess?: (urls: string[]) => void;
	onError?: (error: string) => void;
	maxRetries?: number;
	retryDelay?: number;
}

interface UseImageUploadReturn {
	previews: string[];
	isUploading: boolean;
	uploadProgress: number;
	handleFileSelect: (files: FileList | null) => void;
	selectSingleFile: (file: File) => void;
	uploadImages: () => Promise<string[]>;
	clearPreviews: () => void;
	removePreview: (index: number) => void;
	uploadSingleImage: (file: File) => Promise<string>;
}

// Utility function to wait for a specified delay
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry wrapper function
const withRetry = async <T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	delay: number = 1000
): Promise<T> => {
	let lastError: Error;

	for (let i = 0; i <= maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error("Unknown error");

			if (i === maxRetries) {
				throw lastError;
			}

			// Wait before retrying, with exponential backoff
			await wait(delay * Math.pow(2, i));
		}
	}

	throw lastError!;
};

export const useImageUpload = (
	options: UseImageUploadOptions = {}
): UseImageUploadReturn => {
	const {
		multiple = false,
		maxFiles = 5,
		onSuccess,
		onError,
		maxRetries = 3,
		retryDelay = 1000,
	} = options;

	const [previews, setPreviews] = useState<string[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	// Get Cloudinary config from environment variables
	const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
	const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

	const handleFileSelect = useCallback(
		(files: FileList | null) => {
			if (!files) return;

			const fileArray = Array.from(files);
			const filesToProcess = multiple
				? fileArray.slice(0, maxFiles)
				: fileArray.slice(0, 1);

			// Validate file types
			const validFiles = filesToProcess.filter((file) => {
				const isValid = file.type.startsWith("image/");
				if (!isValid) {
					onError?.(`${file.name} is not a valid image file`);
				}
				return isValid;
			});

			// Validate file sizes (10MB limit)
			const maxSize = 10 * 1024 * 1024; // 10MB
			const validSizedFiles = validFiles.filter((file) => {
				const isValidSize = file.size <= maxSize;
				if (!isValidSize) {
					onError?.(`${file.name} is too large. Maximum size is 10MB`);
				}
				return isValidSize;
			});

			// Create previews
			const newPreviews = validSizedFiles.map((file) =>
				URL.createObjectURL(file)
			);

			// Clean up old previews
			previews.forEach((preview) => {
				if (preview.startsWith("blob:")) {
					URL.revokeObjectURL(preview);
				}
			});

			setPreviews(newPreviews);
			setSelectedFiles(validSizedFiles);
		},
		[multiple, maxFiles, previews, onError]
	);

	const selectSingleFile = useCallback(
		(file: File) => {
			handleFileSelect({
				0: file,
				length: 1,
				item: (index: number) => (index === 0 ? file : null),
				[Symbol.iterator]: function* () {
					yield file;
				},
			} as FileList);
		},
		[handleFileSelect]
	);

	const uploadSingleImage = useCallback(
		async (file: File): Promise<string> => {
			if (!cloudName || !uploadPreset) {
				throw new Error(
					"Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file"
				);
			}

			const uploadFunction = async () => {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("upload_preset", uploadPreset);
				formData.append("folder", "uploads"); // Optional: organize uploads in folders

				const response = await fetch(
					`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
					{
						method: "POST",
						body: formData,
					}
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						`Upload failed: ${errorData.message || response.statusText}`
					);
				}

				const result = await response.json();

				if (result.error) {
					throw new Error(`Cloudinary error: ${result.error.message}`);
				}

				return result.secure_url;
			};

			return withRetry(uploadFunction, maxRetries, retryDelay);
		},
		[cloudName, uploadPreset, maxRetries, retryDelay]
	);

	const uploadImages = useCallback(async (): Promise<string[]> => {
		if (selectedFiles.length === 0) return [];

		if (!cloudName || !uploadPreset) {
			const errorMessage =
				"Cloudinary configuration missing. Please check your environment variables.";
			onError?.(errorMessage);
			throw new Error(errorMessage);
		}

		setIsUploading(true);
		setUploadProgress(0);

		const uploadedUrls: string[] = [];

		try {
			for (let i = 0; i < selectedFiles.length; i++) {
				const file = selectedFiles[i];

				try {
					const url = await uploadSingleImage(file);
					uploadedUrls.push(url);
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";

					// Handle specific Cloudinary errors
					if (errorMessage.includes("Invalid image file")) {
						throw new Error(`${file.name} is not a valid image file`);
					} else if (errorMessage.includes("File size too large")) {
						throw new Error(
							`${file.name} is too large. Please choose a smaller image`
						);
					} else if (errorMessage.includes("Upload failed")) {
						throw new Error(`Failed to upload ${file.name}. Please try again`);
					} else {
						throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
					}
				}

				// Update progress
				setUploadProgress(((i + 1) / selectedFiles.length) * 100);
			}

			onSuccess?.(uploadedUrls);
			return uploadedUrls;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to upload images";
			onError?.(errorMessage);
			throw error;
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	}, [
		selectedFiles,
		onSuccess,
		onError,
		uploadSingleImage,
		cloudName,
		uploadPreset,
	]);

	const clearPreviews = useCallback(() => {
		previews.forEach((preview) => {
			if (preview.startsWith("blob:")) {
				URL.revokeObjectURL(preview);
			}
		});
		setPreviews([]);
		setSelectedFiles([]);
	}, [previews]);

	const removePreview = useCallback(
		(index: number) => {
			const newPreviews = [...previews];
			const newFiles = [...selectedFiles];

			// Clean up the removed preview
			if (newPreviews[index]?.startsWith("blob:")) {
				URL.revokeObjectURL(newPreviews[index]);
			}

			newPreviews.splice(index, 1);
			newFiles.splice(index, 1);

			setPreviews(newPreviews);
			setSelectedFiles(newFiles);
		},
		[previews, selectedFiles]
	);

	return {
		previews,
		isUploading,
		uploadProgress,
		handleFileSelect,
		selectSingleFile,
		uploadImages,
		clearPreviews,
		removePreview,
		uploadSingleImage,
	};
};
