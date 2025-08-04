import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fetchUserById, setCurrentUser } from "../redux/slices/userSlice";
import type { AppDispatch } from "../redux/store";
import {
  getCurrentUser,
  signIn,
  signInWithFacebook,
  signInWithGoogle,
} from "@/utils/auth.ts";

const LoginValidation = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const form = useForm<z.infer<typeof LoginValidation>>({
    resolver: zodResolver(LoginValidation),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof LoginValidation>) => {
    try {
      await signIn(values.email, values.password);
      const user = getCurrentUser();
      if (!user) return;
      const userData = await dispatch(fetchUserById(user.uid)).unwrap();
      dispatch(setCurrentUser(userData));
      navigate(from);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleOAuth = async (method: "google" | "facebook") => {
    try {
      const result =
          method === "google"
              ? await signInWithGoogle()
              : await signInWithFacebook();
      
      const userData = await dispatch(fetchUserById(result.user.uid)).unwrap();
      dispatch(setCurrentUser(userData));
      navigate(from);
    } catch (err) {
      console.error("OAuth login error:", err);
    }
  };


  // Chakra UI 다크모드 대응 색상
  const bg = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const linkColor = useColorModeValue("blue.500", "blue.300");

  return (
      <Box
          maxW="md"
          mx="auto"
          mt={10}
          p={6}
          bg={bg}
          borderRadius="lg"
          boxShadow="2xl"
          border="3px solid"
          borderColor={useColorModeValue("gray.300", "gray.600")}  // 테두리도 약간 추가
      >
        <Heading textAlign="center" size="lg" color={textColor} mb={6}>
          Welcome to Flipper
        </Heading>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Stack spacing={4}>
            <FormControl isInvalid={!!form.formState.errors.email}>
              <FormLabel color={textColor}>Email</FormLabel>
              <Input
                  {...form.register("email")}
                  type="email"
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  _focus={{ borderColor: "blue.500" }}
              />
            </FormControl>

            <FormControl isInvalid={!!form.formState.errors.password}>
              <FormLabel color={textColor}>Password</FormLabel>
              <Input
                  {...form.register("password")}
                  type="password"
                  bg={inputBg}
                  borderColor={borderColor}
                  color={textColor}
                  _focus={{ borderColor: "blue.500" }}
              />
            </FormControl>

            <Button type="submit" colorScheme="blue" w="full">
              Log In
            </Button>

            <Button
                onClick={() => handleOAuth("google")}
                bg="red.500"
                color="white"
                _hover={{ bg: "red.600" }}
                w="full"
            >
              Continue with Google
            </Button>

            <Text textAlign="center" color={textColor} mt={2}>
              Don’t have an account?{" "}
              <Box as={RouterLink} to="/signup" color={linkColor} fontWeight="bold">
                Sign up
              </Box>
            </Text>

            <Text textAlign="center" color={textColor} mt={4}>
              <Box as={RouterLink} to="/" color={linkColor} fontWeight="bold">
                Go back to main page
              </Box>
            </Text>
          </Stack>
        </form>
      </Box>
  );
};

export default Login;