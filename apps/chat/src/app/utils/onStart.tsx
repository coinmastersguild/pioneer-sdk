
import { toaster } from '@/components/ui/toaster';
import { usePioneer } from '@coinmasters/pioneer-react';
const TAG = " | onStart | "
export const useOnStartApp = () => {
    const { onStart } = usePioneer();

    const onStartApp = async () => {
      let tag = TAG+" | onStartApp | "
      try {
            const pioneerSetup = {
                appName: 'KeepKey Portfolio',
                appIcon: 'https://pioneers.dev/coins/keepkey.png',
                spec:"https://pioneers.dev/spec/swagger.json",
                wss:"wss://pioneers.dev",
                // spec:"http://127.0.0.1:9001/spec/swagger.json",
                // wss:"ws://127.0.0.1:9001"
            };
            console.log('OnStart App');
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
