import { FC } from "react";
import { Flex, Button, Link } from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";

interface Props {
  currentNav: "portfolio" | "wallet" | "swap";
  setCurrentNav: (nav: "portfolio" | "wallet" | "swap") => void;
}

export const Header: FC<Props> = ({ currentNav, setCurrentNav }) => {
  return (
    <Flex maxW="8xl" mx="auto" px={5} py={5} align="center" position="relative">
      {/* Clickable smaller avatar linking to https://keepkey.info */}
      <Link href="https://keepkey.info">
        <Avatar
          name="KeepKey"
          src="https://pioneers.dev/coins/keepkey.png"
          shape="square"
          size="sm"
          cursor="pointer"
        />
      </Link>

      {/* Centered navigation */}
      <Flex
        position="absolute"
        left="50%"
        transform="translateX(-50%)"
        display={{ base: "none", md: "flex" }}
        gap={6}
        align="center"
      >
        <Button
          variant="ghost"
          color={currentNav === "portfolio" ? "yellow" : "white"}
          _hover={{ color: "#FFD700" }}
          onClick={() => setCurrentNav("portfolio")}
        >
          Portfolio
        </Button>

        <Button
          variant="ghost"
          color={currentNav === "wallet" ? "yellow" : "white"}
          _hover={{ color: "#FFD700" }}
          onClick={() => setCurrentNav("wallet")}
        >
          Wallet
        </Button>

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
