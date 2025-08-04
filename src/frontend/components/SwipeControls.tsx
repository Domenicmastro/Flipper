import { HStack, IconButton, Tooltip } from "@chakra-ui/react";
import { FiRotateCcw } from "react-icons/fi";

interface SwipeControlsProps {
  onUndo: () => void;
  disableUndo?: boolean;
}

export default function SwipeControls({
  onUndo,
  disableUndo = false,
}: SwipeControlsProps) {
  return (
    <HStack spacing={6} mt={6} justify="center">
      <Tooltip label="Undo last swipe" hasArrow placement="top">
        <IconButton
          aria-label="Undo"
          icon={<FiRotateCcw size="28px" />}
          onClick={onUndo}
          isDisabled={disableUndo}
          size="lg"
          variant="solid"
          colorScheme="yellow"
        />
      </Tooltip>
    </HStack>
  );
}