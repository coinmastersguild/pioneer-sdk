import { useEffect } from 'react';
import { toaster } from '#components/ui/toaster';
import { usePioneer } from '@coinmasters/pioneer-react';

export const useOnStartApp = () => {
    const { onStart } = usePioneer();

    const onStartApp = async () => {
        try {
            const pioneerSetup = {
                appName: 'KeepKey Portfolio',
                appIcon: 'https://pioneers.dev/coins/keepkey.png',
            };

            const events = await onStart([], pioneerSetup);

            // Subscribe to all events
            events.on('*', (action: string, data: any) => {
                console.log('Event: ',action, data);
                toaster.create({
                    title: `Event: ${action}`,
                    description: JSON.stringify(data),
                    duration: 5000,
                });
            });
        } catch (e) {
            console.error('Failed to start app!', e);
        }
    };

    return onStartApp;
};
