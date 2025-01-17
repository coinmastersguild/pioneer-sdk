import { FC } from "react";
import { Flex, Button, Link } from "@chakra-ui/react";
import { Avatar } from "@/components/ui/avatar";

interface Props {
  currentNav: "portfolio" | "wallet" | "swap" | "explore";
  setCurrentNav: (nav: "portfolio" | "wallet" | "swap" | "explore") => void;
}

export const Header: FC<Props> = ({ currentNav, setCurrentNav }) => {
  return (
    <Flex maxW="8xl" mx="auto" px={5} py={5} align="center" position="relative">
      {/* Clickable smaller avatar linking to https://keepkey.info */}


      {/* Centered navigation */}
      <Flex
        position="absolute"
        left="50%"
        transform="translateX(-50%)"
        display={{ base: "none", md: "flex" }}
        gap={6}
        align="center"
      >
        Chat

        {/*<Button*/}
        {/*  variant="ghost"*/}
        {/*  color="white"*/}
        {/*  _hover={{ color: "white" }}*/}
        {/*  onClick={() => setCurrentNav("swap")}*/}
        {/*>*/}
        {/*  Swap*/}
        {/*</Button>*/}
      </Flex>
    </Flex>
  );
};
