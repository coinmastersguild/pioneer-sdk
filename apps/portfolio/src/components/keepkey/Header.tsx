import { FC } from "react";
import { Flex, Button } from "@chakra-ui/react";

interface Props {
    currentNav: "portfolio" | "wallet" | "swap";
    setCurrentNav: (nav: "portfolio" | "wallet" | "swap") => void;
}

export const Header: FC<Props> = ({ currentNav, setCurrentNav }: Props) => {
    return (
        <Flex maxW="8xl" mx="auto" px={5} py={5} justify="space-between" align="center">
            <Flex
                position="absolute"
                left="50%"
                transform="translateX(-50%)"
                display={{ base: "none", md: "flex" }}
                gap={6}
                align="center"
            >
                {/* Portfolio Button */}
                <Button
                    variant="ghost"
                    color={currentNav === "portfolio" ? "yellow" : "white"}
                    _hover={{ color: "#FFD700" }}
                    onClick={() => setCurrentNav("portfolio")}
                >
                    Portfolio
                </Button>

                {/* Wallet Button */}
                <Button
                    variant="ghost"
                    color={currentNav === "wallet" ? "yellow" : "white"}
                    _hover={{ color: "#FFD700" }}
                    onClick={() => setCurrentNav("wallet")}
                >
                    Wallet
                </Button>

                {/* Swap Button */}
                <Button
                    variant="ghost"
                    color="white"
                    _hover={{ color: "white" }}
                    onClick={() => setCurrentNav("swap")}
                >
                    Swap
                </Button>
            </Flex>
        </Flex>
    );
};
