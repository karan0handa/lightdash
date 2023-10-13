import { PostHogProvider, usePostHog } from 'posthog-js/react';
import { FC } from 'react';
import { IntercomProvider } from 'react-use-intercom';
import { Intercom } from '../components/Intercom';
import useSentry from '../hooks/thirdPartyServices/useSentry';
import { useApp } from './AppProvider';

const PosthogIdentified: FC = ({ children }) => {
    const { user } = useApp();
    const posthog = usePostHog();
    if (user.data) {
        posthog.identify(user.data.userUuid, {
            uuid: user.data.userUuid,
            ...(user.data.isTrackingAnonymized
                ? {}
                : {
                      email: user.data.email,
                      first_name: user.data.firstName,
                      last_name: user.data.lastName,
                  }),
        });
        if (user.data.organizationUuid) {
            posthog.group('organization', user.data.organizationUuid, {
                uuid: user.data.organizationUuid,
                name: user.data.organizationName,
            });
        }
    }
    return <>{children}</>;
};

const ThirdPartyServicesEnabledProvider: FC = ({ children }) => {
    const { health, user } = useApp();

    useSentry(health?.data?.sentry, user.data);

    return (
        <IntercomProvider
            appId={health.data?.intercom.appId || ''}
            shouldInitialize={!!health.data?.intercom.appId}
            apiBase={health.data?.intercom.apiBase || ''}
            autoBoot
        >
            <PostHogProvider
                apiKey={health.data?.posthog.projectApiKey || ''}
                options={{
                    api_host: health.data?.posthog.apiHost,
                    bootstrap: {
                        featureFlags: {
                            'lightdash-team-flair': false,
                            'extended-usage-analytics': false,
                        },
                    },
                }}
            >
                <PosthogIdentified>
                    <Intercom />
                    {children}
                </PosthogIdentified>
            </PostHogProvider>
        </IntercomProvider>
    );
};

interface ThirdPartyServicesProviderProps {
    enabled?: boolean;
}

const ThirdPartyServicesProvider: FC<ThirdPartyServicesProviderProps> = ({
    children,
    enabled,
}) => {
    if (enabled) {
        return (
            <ThirdPartyServicesEnabledProvider>
                {children}
            </ThirdPartyServicesEnabledProvider>
        );
    } else {
        return <>{children}</>;
    }
};

export default ThirdPartyServicesProvider;
