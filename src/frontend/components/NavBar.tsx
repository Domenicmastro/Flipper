import {
	Box,
	Flex,
	HStack,
	IconButton,
	useDisclosure,
	Stack,
	Button,
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	Avatar,
	Image,
	useColorModeValue,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import type { RootState } from "../redux/store";
import type { User } from "@/types";
import { FaUser } from "react-icons/fa";
import logo from "../../assets/logo-tight.png";
import { setCurrentUser } from "../redux/slices/userSlice";
import { signOutUser } from "@/utils/auth.ts";
import AddItemModal from "./AddItemModal";

const NavLink = ({ label, path }: { label: string; path: string }) => {
	const hoverBg = useColorModeValue("gray.200", "gray.700");
	return (
		<Button as={Link} to={path} variant="ghost" _hover={{ bg: hoverBg }}>
			{label}
		</Button>
	);
};

export default function Navbar() {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
	const user: User | null | undefined = useSelector(
		(state: RootState) => state.users.currentUser
	);
	const userPath = user ? `/user/${user.id}` : "/login";
	const imagePath = user?.image || "";
	const navigate = useNavigate();
	const dispatch = useDispatch();

	// 컬러 모드에 따른 배경 및 텍스트 색상
	const navBg = useColorModeValue("brand.500", "brand.600");
	const navText = useColorModeValue("white", "gray.100");
	const menuBg = useColorModeValue("white", "gray.700");
	const menuText = useColorModeValue("black", "white");
	const menuHoverBg = useColorModeValue("gray.100", "gray.600");

	// 로그아웃 함수
	const handleLogout = async () => {
		try {
			await signOutUser();
			dispatch(setCurrentUser(null));
			navigate("/login");
		} catch (error) {
			console.error("Logout failed", error);
		}
	};

	const userMenu = user ? (
		<Box display={{ base: "none", md: "block" }}>
			<NavLink label="Wishlist" path="/wishlist" />
			<Button
				onClick={() => setIsAddItemModalOpen(true)}
				variant="ghost"
				_hover={{ bg: useColorModeValue("gray.200", "gray.700") }}
			>
				List an Item
			</Button>
			<Menu>
				<MenuButton as={Button} variant="ghost" rounded="full" p={0}>
					<Avatar size="sm" src={imagePath} icon={<FaUser />} />
				</MenuButton>
				<MenuList bg={menuBg}>
					<MenuItem
						onClick={() => navigate(userPath)}
						color={menuText}
						_hover={{ bg: menuHoverBg }}
					>
						View Profile
					</MenuItem>
					<MenuItem
						onClick={() => navigate("/messages")}
						color={menuText}
						_hover={{ bg: menuHoverBg }}
					>
						Messages
					</MenuItem>
					<MenuItem
						onClick={() => navigate("/settings")}
						color={menuText}
						_hover={{ bg: menuHoverBg }}
					>
						Settings
					</MenuItem>
					<MenuItem
						onClick={handleLogout}
						color={menuText}
						_hover={{ bg: menuHoverBg }}
					>
						Log out
					</MenuItem>
				</MenuList>
			</Menu>
		</Box>
	) : (
		<Box display={{ base: "none", md: "flex" }}>
			<NavLink label="Log In" path="/login" />
		</Box>
	);

	return (
		<Box w="100%" m={0} p={0} position="relative" top="0" left="0">
			<Flex
				as="nav"
				align="center"
				justify="space-between"
				wrap="wrap"
				w="100%"
				px={4}
				h="60px"
				bg={navBg}
				color={navText}
			>
				{/* Left side: Logo and Swipe */}
				<HStack display={{ base: "none", md: "flex" }}>
					<Button
						as={Link}
						to="/"
						variant="ghost"
						_hover={{ bg: useColorModeValue("gray.200", "gray.700") }}
						display="flex"
						alignItems="center"
						justifyContent="center"
						gap={2}
						px={3}
						py={2}
					>
						<Image
							src={logo}
							alt="Flipper Logo"
							maxHeight="30px"
							borderRadius="full"
						/>
						Flipper
					</Button>
					{user && <NavLink label="Swipe" path="/swipe" />}
					<NavLink label="View All Products" path="/ViewAll" />
				</HStack>

				{/* Right side: User menu */}
				{userMenu}

				{/* Mobile Hamburger */}
				<IconButton
					size="md"
					icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
					aria-label="Toggle Menu"
					display={{ md: "none" }}
					onClick={isOpen ? onClose : onOpen}
				/>
			</Flex>

			{/* Mobile Links */}
			{isOpen && (
				<Stack mt={2} display={{ md: "none" }}>
					{user ? (
						<>
							<NavLink label="Swipe" path="/swipe" />
							<Button
								onClick={() => setIsAddItemModalOpen(true)}
								variant="ghost"
								textAlign="left"
								justifyContent="flex-start"
							>
								List an Item
							</Button>
							<NavLink label="View Profile" path={userPath} />
							<Button onClick={handleLogout} variant="ghost">
								Log out
							</Button>
						</>
					) : (
						<NavLink label="Log In" path="/login" />
					)}
				</Stack>
			)}

			{/* Add Item Modal */}
			<AddItemModal 
				isOpen={isAddItemModalOpen} 
				onClose={() => setIsAddItemModalOpen(false)} 
			/>
		</Box>
	);
}