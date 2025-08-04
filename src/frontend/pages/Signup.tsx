import { useNavigate, Link as RouterLink } from "react-router-dom";
import { signUp } from "@/utils/auth.ts";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Box, Heading, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import { z } from "zod";

const SignupValidation = z.object({
	email: z.string().email(),
	password: z.string().min(8, "Password must be at least 8 characters."),
});

const Signup = () => {
	const navigate = useNavigate();
	const btnBg = useColorModeValue("blue.600", "blue.400");
	const btnHoverBg = useColorModeValue("blue.700", "blue.500");
	const btnTextColor = useColorModeValue("white", "gray.900");

	const form = useForm<z.infer<typeof SignupValidation>>({
		resolver: zodResolver(SignupValidation),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = async (values: z.infer<typeof SignupValidation>) => {
		try {
			await signUp(values.email, values.password);
			navigate("/login");
		} catch (error: unknown) {
			console.error("Signup failed", error);
		}
	};

	// 다크모드 대응 색상
	const bg = useColorModeValue("white", "gray.800");
	const textColor = useColorModeValue("gray.800", "gray.100");
	const subTextColor = useColorModeValue("gray.600", "gray.400");
	const inputBg = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.300", "gray.600");
	const linkColor = useColorModeValue("blue.500", "blue.300");

	return (
		<Form {...form}>
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
				<Heading textAlign="center" size="lg" color={textColor} mb={2}>
					Create a new account
				</Heading>
				<Text textAlign="center" fontSize="md" color={subTextColor} mb={6}>
					To use Flipper, enter your new account details below.
				</Text>

				<form onSubmit={form.handleSubmit(onSubmit)}>
					<Stack spacing={4}>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel color={textColor}>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											bg={inputBg}
											borderColor={borderColor}
											color={textColor}
											_focus={{ borderColor: "blue.500" }}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel color={textColor}>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											bg={inputBg}
											borderColor={borderColor}
											color={textColor}
											_focus={{ borderColor: "blue.500" }}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							bg={btnBg}
							color={btnTextColor}
							_hover={{ bg: btnHoverBg }}
							boxShadow="md"
							border="1px solid"
							borderColor={useColorModeValue("blue.700", "blue.300")}
							w="full"
						>
							Sign Up
						</Button>

						<Text textAlign="center" fontSize="sm" color={subTextColor} mt={2}>
							Already have an account?{" "}
							<Box as={RouterLink} to="/login" color={linkColor} fontWeight="bold">
								Log in
							</Box>
						</Text>
					</Stack>
				</form>
			</Box>
		</Form>
	);
};

export default Signup;