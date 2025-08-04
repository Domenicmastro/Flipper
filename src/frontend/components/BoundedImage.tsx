import { AspectRatio, Image } from "@chakra-ui/react";

export default function BoundedImage ({src, alt, maxW}: {src:(string | undefined), alt:string, maxW:string}) {
    return (
        <AspectRatio ratio={4/3} maxW={maxW}>
            <Image src={src} alt={alt} borderRadius='md'/>
        </AspectRatio>
    )
}
