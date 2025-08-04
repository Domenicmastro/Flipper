import { useToast } from "@chakra-ui/react";
import type { UseToastOptions } from "@chakra-ui/react";

/**
 * Utility function to show a toast notification for wishlist or skip actions.
 * @param toast - The Chakra UI toast function from useToast()
 * @param type - Either "wishlist" or "skip"
 * @param productName - Name of the product to include in the message
 */
export function showToast(
  toast: ReturnType<typeof useToast>,
  type: "wishlist" | "skip",
  productName: string
) {
  const config: Record<
    "wishlist" | "skip",
    { title: string; status: UseToastOptions["status"] }
  > = {
    wishlist: {
      title: "Added to Wishlist",
      status: "success",
    },
    skip: {
      title: "Skipped",
      status: "info",
    },
  };

  const { title, status } = config[type];

  toast({
    title,
    description: productName,
    status,
    duration: 1500,
    isClosable: true,
    position: "bottom-left",
  });
}
