/*
      CalculatingComponent
 */

import { Center, Text, useBreakpointValue } from "@chakra-ui/react";
import React, { useState, useEffect } from 'react';
// @ts-ignore
let calculatingAnimation = "/gif/calculating.gif";
import Image from "next/image";

function CalculatingComponent() {
    // Adjust image size based on breakpoint
    const imageSize = useBreakpointValue({
        base: "50%",
        sm: "60%",
        md: "70%",
        lg: "80%",
        xl: "800px", // This will cap the size at 800px for larger screens
    });

    return (
        <Center
            m="auto" // center the card horizontally
            maxWidth="md" // You can adjust this to set the maximum width of the card
            p={6}
            width="100%"
        >
            <Text fontSize="lg" mb={4} textAlign="center">
                Calculating Best Route...
            </Text>

            <Image alt="calculating" src={calculatingAnimation} width={'600'} height={'600'}/>
        </Center>
    );
}

export default CalculatingComponent;
