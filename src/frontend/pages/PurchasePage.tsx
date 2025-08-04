import {useNavigate, useParams} from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Box, Text, Heading, Flex, Button, Image } from "@chakra-ui/react";
import { type Product } from "@/types/Product";
import type { User } from "@/types/User";
import { GoogleMap, Circle, useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useRef } from "react";
import ConditionLabel from "../components/ConditionLabel";
import {useAppDispatch, useAppSelector} from "../redux/hooks";
import { fetchProduct } from "../redux/slices/productSlice";
import {selectCurrentUser} from "@/frontend/redux/slices/userSlice.ts";

const mapContainerStyle = {
	width: "100%",
	height: "400px",
};
const defaultZoom = 14;

const MAP_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Map with circle radius around seller's location
const SellerMap = ({ center }: { center: google.maps.LatLngLiteral }) => {
	const mapRef = useRef<google.maps.Map | null>(null);

	const handleLoad = (map: google.maps.Map) => {
		mapRef.current = map;
		map.panTo(center);
	};

	return (
		<GoogleMap
			mapContainerStyle={mapContainerStyle}
			center={center}
			zoom={defaultZoom}
			onLoad={handleLoad}
		>
			<Circle
				center={center}
				radius={500}
				options={{
					strokeColor: "#FF9333",
					strokeOpacity: 0.8,
					strokeWeight: 2,
					fillColor: "#FF9333",
					fillOpacity: 0.25,
					zIndex: 1000,
				}}
			/>
		</GoogleMap>
	);
};

const PurchasePage = () => {
	const { isLoaded } = useJsApiLoader({
		googleMapsApiKey: MAP_API_KEY,
	});
	const currentUser = useAppSelector(selectCurrentUser);
	const { id } = useParams<{ id: string }>() as { id: string };
	const [product, setProduct] = useState<Product | null>(null);
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	useEffect(() => {
		dispatch(fetchProduct(id)).then((result) => {
			if (fetchProduct.fulfilled.match(result)) {
				setProduct(result.payload);
			} else {
				console.error("Failed to retrieve product");
			}
		});
	}, [dispatch, id]);

	const seller = useSelector((state: RootState) =>
		state.users.users.find((u: User) => u.id === product?.sellerId)
	);

	const [center, setCenter] = useState<google.maps.LatLngLiteral | null>(null);

	useEffect(() => {
		const getCoordinates = async () => {
			if (!product?.location) return;
			if	(!seller?.location) return;

			try {
				const response = await fetch(
					`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
						product?.location.label ? product.location.label : seller.location.label
					)}&key=${MAP_API_KEY}`
				);
				const data = await response.json();

				if (data.results.length > 0) {
					const rawLocation = data.results[0].geometry.location as {
						lat: number;
						lng: number;
					};

					setCenter({
						lat: rawLocation.lat,
						lng: rawLocation.lng,
					});
				}
			} catch (err) {
				console.error("Geocode failed:", err);
			}
		};

		getCoordinates();
	}, [seller?.location]);

	if (!product) return <Text>Product not found</Text>;
	if (!seller) return <Text>Seller not found</Text>;

	return (
		<Box p={4}>
			<Flex gap={3} mt={3}>
				<Heading mb={4} mr={50}>
					Purchase Product
				</Heading>
				<Button>Contact Seller</Button>
				<Button disabled>Order Delivery</Button>
			</Flex>

			<Flex
				direction={{ base: "column", md: "row" }}
				gap={4}
				justifyItems="center"
			>
				<Box mt={6} width="50%">
					<Heading size="md" mb={2}>
						Seller Location
					</Heading>
					<Text>{seller.location.label}</Text>

					{!isLoaded && <Text>Loading map...</Text>}
					{isLoaded && !center && <Text>Getting seller location...</Text>}
					{isLoaded && center && <SellerMap center={center} />}

					<Heading size="md" mt={4}>
						Seller Info
					</Heading>
					<Text>Name: {seller.name}</Text>
					<Text>Email: {seller.email}</Text>
				</Box>

				<Box mt={6} textAlign="left" width="50%">
					<Heading size="md" textAlign="left">
						Product Details
					</Heading>
					<Text>{product.name}</Text>

					{product.images.length > 0 && (
						<Image
							src={product.images[0]}
							// width="300px"
							maxHeight="400px"
							objectFit="cover"
							borderRadius="md"
							justifySelf="center"
							alt={product.name}
						/>
					)}

					<Text fontWeight="bold" fontSize="xl" mt={2}>
						${product.price}
					</Text>

					{product.categories.map((cat) => (
						<Text key={cat}>{cat}</Text>
					))}

					<ConditionLabel condition={product.condition} />

					<Heading size="md" mt={4}>
						Seller Info:
					</Heading>
					<Text>Name: {seller.name}</Text>
					<Text>Email: {seller.email}</Text>
					<Text>Location: {seller.location.label}</Text>

					<Flex gap={3} mt={3}>
						<Button
							colorScheme="indigo"
							onClick={async () => {
								try {
									const res = await fetch("/api/messages/conversation/get-or-create", {
										method: "PUT",
										headers: {
											"Content-Type": "application/json",
										},
										body: JSON.stringify({
											userId1: currentUser?.id,
											userId2: seller.id,
											productId: product.id,
										}),
									});

									if (!res.ok) {
										throw new Error("Failed to create or get conversation");
									}
									console.log("Conversation created or retrieved successfully");
									const conversationId = await res.json();
									navigate(`/messages/${conversationId}`);
								} catch (error) {
									console.error("Failed to open message:", error);
									alert("Failed to open message. Please try again later.");
								}
							}}
						>
							Contact Seller
						</Button>
						<Button>Order Delivery</Button>
					</Flex>
				</Box>
			</Flex>
		</Box>
	);
};

export default PurchasePage;
