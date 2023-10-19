import {
    ApiError,
    DashboardBasicDetails,
    UpdateMultipleDashboards,
} from '@lightdash/common';
import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from 'react-query';
import { lightdashApi } from '../../api';
import useToaster from '../toaster/useToaster';
import useQueryError from '../useQueryError';

const getDashboards = async (
    projectUuid: string,
    includePrivateSpaces: boolean,
) =>
    lightdashApi<DashboardBasicDetails[]>({
        url: `/projects/${projectUuid}/dashboards?includePrivate=${includePrivateSpaces}`,
        method: 'GET',
        body: undefined,
    });

const getDashboardsContainingChart = async (
    projectUuid: string,
    chartId: string,
) =>
    lightdashApi<DashboardBasicDetails[]>({
        url: `/projects/${projectUuid}/dashboards?chartUuid=${chartId}`,
        method: 'GET',
        body: undefined,
    });

export const useDashboards = (
    projectUuid: string,
    useQueryOptions?: UseQueryOptions<DashboardBasicDetails[], ApiError>,
    includePrivateSpaces: boolean = false,
) => {
    const setErrorResponse = useQueryError();

    return useQuery<DashboardBasicDetails[], ApiError>(
        ['dashboards', projectUuid, includePrivateSpaces],
        () => getDashboards(projectUuid || '', includePrivateSpaces),
        {
            enabled: projectUuid !== undefined,
            ...useQueryOptions,
            onError: (result) => {
                setErrorResponse(result);
                useQueryOptions?.onError?.(result);
            },
        },
    );
};

export const useDashboardsContainingChart = (
    projectUuid: string,
    chartId: string,
) => {
    const setErrorResponse = useQueryError();
    return useQuery<DashboardBasicDetails[], ApiError>({
        queryKey: ['dashboards-containing-chart', projectUuid, chartId],
        queryFn: () => getDashboardsContainingChart(projectUuid, chartId),
        onError: (result) => setErrorResponse(result),
    });
};

const updateMultipleDashboard = async (
    projectUuid: string,
    data: UpdateMultipleDashboards[],
) =>
    lightdashApi<undefined>({
        url: `/projects/${projectUuid}/dashboards`,
        method: 'PATCH',
        body: JSON.stringify(data),
    });

export const useUpdateMultipleDashboard = (projectUuid: string) => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<undefined, ApiError, UpdateMultipleDashboards[]>(
        (data) => updateMultipleDashboard(projectUuid, data),
        {
            mutationKey: ['dashboard_update_multiple'],
            onSuccess: async (_, variables) => {
                await queryClient.invalidateQueries(['space', projectUuid]);

                await queryClient.invalidateQueries('dashboards');
                await queryClient.invalidateQueries(
                    'dashboards-containing-chart',
                );
                await queryClient.invalidateQueries(
                    'most-popular-and-recently-updated',
                );

                const invalidateQueries = variables.map((dashboard) => [
                    'saved_dashboard_query',
                    dashboard.uuid,
                ]);
                await queryClient.invalidateQueries(invalidateQueries);

                showToastSuccess({
                    title: `Success! Dashboards were updated.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to update dashboard`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};
