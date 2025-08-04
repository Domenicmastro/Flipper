import { Badge } from "@chakra-ui/react";
import { Condition } from "@/types/Product";

export default function ConditionLabel({ condition }: { condition: string }) {
	const colorSwitch = ((condition: string) => {
		switch (condition) {
			case Condition.New:
				return "green";
			case Condition.LikeNew:
				return "yellow";
			case Condition.Used:
				return "orange";
			case Condition.NotWorking:
				return "red";
			default:
				return "white";
		}
	})(condition);

	return (
		<Badge colorScheme={colorSwitch} minWidth="4rem" textAlign="center">
			{condition}
		</Badge>
	);
}
