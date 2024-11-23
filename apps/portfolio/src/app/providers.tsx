"use client";
import { Provider } from "@/components/ui/provider"
import { PioneerProvider } from "@coinmasters/pioneer-react"

export default function Providers({ children }: any) {
    return (
        <PioneerProvider>
            <Provider>{children}</Provider>
        </PioneerProvider>
    );
}
