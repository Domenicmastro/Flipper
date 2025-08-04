import {
  Box,
  Heading,
  Switch,
  Text,
  Stack,
  useColorMode,
  useColorModeValue,
  Divider,
  FormControl,
  FormLabel,
  Button,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import type { RootState } from "@/frontend/redux/store";

export default function SettingsPage() {
  const { colorMode, toggleColorMode } = useColorMode();
  const user = useSelector((state: RootState) => state.users.currentUser);

  return (
    <Box
      maxW="600px"
      mx="auto"
      mt={8}
      p={6}
      borderRadius="md"
      bg={useColorModeValue("gray.50", "gray.800")}
      boxShadow="md"
    >
      <Heading size="lg" mb={6}>
        Account Settings
      </Heading>

      {/* User Info Section */}
      <Box mb={6}>
        <Text fontWeight="bold">Name</Text>
        <Text mb={3}>{user?.name ?? "Guest"}</Text>

        <Text fontWeight="bold">Email</Text>
        <Text>{user?.email ?? "Not available"}</Text>
      </Box>

      <Divider my={6} />

      {/* Dark Mode Toggle */}
      <FormControl display="flex" alignItems="center" mb={6}>
        <FormLabel htmlFor="dark-mode" mb="0">
          Enable Dark Mode
        </FormLabel>
        <Switch
          id="dark-mode"
          isChecked={colorMode === "dark"}
          onChange={toggleColorMode}
        />
      </FormControl>

      <Divider my={6} />

      {/* Notifications (placeholder) */}
      <Stack spacing={4}>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="email-notifications" mb="0">
            Email Notifications
          </FormLabel>
          <Switch id="email-notifications" defaultChecked />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="sms-notifications" mb="0">
            SMS Notifications
          </FormLabel>
          <Switch id="sms-notifications" />
        </FormControl>
      </Stack>

      <Divider my={6} />

      {/* Account Deletion */}
      <Box mt={6}>
        <Heading size="md" mb={3}>
          Danger Zone
        </Heading>
        <Text fontSize="sm" color="gray.500" mb={3}>
          Deleting your account is permanent and cannot be undone.
        </Text>
        <Button colorScheme="red" variant="outline" isDisabled>
          Delete Account
        </Button>
      </Box>
    </Box>
  );
}
