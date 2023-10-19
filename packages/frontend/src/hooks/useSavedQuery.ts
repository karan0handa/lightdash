import {
    ApiError,
    ChartHistory,
    ChartVersion,
    CreateSavedChart,
    CreateSavedChartVersion,
    SavedChart,
    UpdateMultipleSavedChart,
    UpdateSavedChart,
} from '@lightdash/common';
import {
    useMutation,
    UseMutationOptions,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import { lightdashApi } from '../api';
import { convertDateFilters } from '../utils/dateFilter';
import useToaster from './toaster/useToaster';
import useSearchParams from './useSearchParams';

const createSavedQuery = async (
    projectUuid: string,
    payload: CreateSavedChart,
): Promise<SavedChart> => {
    const timezoneFixPayload: CreateSavedChart = {
        ...payload,
        metricQuery: {
            ...payload.metricQuery,
            filters: convertDateFilters(payload.metricQuery.filters),
        },
    };
    return lightdashApi<SavedChart>({
        url: `/projects/${projectUuid}/saved`,
        method: 'POST',
        body: JSON.stringify(timezoneFixPayload),
    });
};

const duplicateSavedQuery = async (
    projectUuid: string,
    chartUuid: string,
): Promise<SavedChart> =>
    lightdashApi<SavedChart>({
        url: `/projects/${projectUuid}/saved?duplicateFrom=${chartUuid}`,
        method: 'POST',
        body: undefined,
    });

export const deleteSavedQuery = async (id: string) =>
    lightdashApi<undefined>({
        url: `/saved/${id}`,
        method: 'DELETE',
        body: undefined,
    });

const updateSavedQuery = async (
    id: string,
    data: UpdateSavedChart,
): Promise<SavedChart> => {
    return lightdashApi<SavedChart>({
        url: `/saved/${id}`,
        method: 'PATCH',
        body: JSON.stringify({
            name: data.name,
            description: data.description,
            spaceUuid: data.spaceUuid,
        }),
    });
};

const getSavedQuery = async (id: string): Promise<SavedChart> =>
    lightdashApi<SavedChart>({
        url: `/saved/${id}`,
        method: 'GET',
        body: undefined,
    });

const addVersionSavedQuery = async ({
    uuid,
    payload,
}: {
    uuid: string;
    payload: CreateSavedChartVersion;
}): Promise<SavedChart> => {
    const timezoneFixPayload: CreateSavedChartVersion = {
        ...payload,
        metricQuery: {
            ...payload.metricQuery,
            filters: convertDateFilters(payload.metricQuery.filters),
        },
    };
    return lightdashApi<SavedChart>({
        url: `/saved/${uuid}/version`,
        method: 'POST',
        body: JSON.stringify(timezoneFixPayload),
    });
};

interface Args {
    id?: string;
    useQueryOptions?: UseQueryOptions<SavedChart, ApiError>;
}

export const useSavedQuery = ({ id, useQueryOptions }: Args = {}) =>
    useQuery<SavedChart, ApiError>({
        queryKey: ['saved_query', id],
        queryFn: () => getSavedQuery(id || ''),
        enabled: id !== undefined,
        retry: false,
        ...useQueryOptions,
    });

const getChartHistoryQuery = async (chartUuid: string): Promise<ChartHistory> =>
    lightdashApi<ChartHistory>({
        url: `/saved/${chartUuid}/history`,
        method: 'GET',
        body: undefined,
    });

export const useChartHistory = (chartUuid: string) =>
    useQuery<ChartHistory, ApiError>({
        queryKey: ['chart_history', chartUuid],
        queryFn: () => getChartHistoryQuery(chartUuid),
        retry: false,
    });
const getChartVersionQuery = async (
    chartUuid: string,
    versionUuid: string,
): Promise<ChartVersion> =>
    lightdashApi<ChartVersion>({
        url: `/saved/${chartUuid}/version/${versionUuid}`,
        method: 'GET',
        body: undefined,
    });

export const useChartVersion = (chartUuid: string, versionUuid?: string) =>
    useQuery<ChartVersion, ApiError>({
        queryKey: ['chart_version', chartUuid, versionUuid],
        queryFn: () => getChartVersionQuery(chartUuid, versionUuid!),
        enabled: versionUuid !== undefined,
        retry: false,
    });

const rollbackChartQuery = async (
    chartUuid: string,
    versionUuid: string,
): Promise<undefined> =>
    lightdashApi<undefined>({
        url: `/saved/${chartUuid}/rollback/${versionUuid}`,
        method: 'POST',
        body: undefined,
    });
export const useChartVersionRollbackMutation = (
    chartUuid: string,
    useQueryOptions?: UseQueryOptions<undefined, ApiError>,
) => {
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<undefined, ApiError, string>(
        (versionUuid: string) => rollbackChartQuery(chartUuid, versionUuid),
        {
            mutationKey: ['saved_query_rollback'],
            ...useQueryOptions,
            onSuccess: async (data) => {
                showToastSuccess({
                    title: `Success! Chart was reverted.`,
                });
                useQueryOptions?.onSuccess?.(data);
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to revert chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useSavedQueryDeleteMutation = () => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<undefined, ApiError, string>(deleteSavedQuery, {
        mutationKey: ['saved_query_create'],
        onSuccess: async () => {
            await queryClient.invalidateQueries('spaces');
            await queryClient.invalidateQueries('space');
            await queryClient.invalidateQueries(
                'most-popular-and-recently-updated',
            );

            showToastSuccess({
                title: `Success! Chart was deleted.`,
            });
        },
        onError: (error) => {
            showToastError({
                title: `Failed to delete chart`,
                subtitle: error.error.message,
            });
        },
    });
};

const updateMultipleSavedQuery = async (
    projectUuid: string,
    data: UpdateMultipleSavedChart[],
): Promise<SavedChart[]> => {
    return lightdashApi<SavedChart[]>({
        url: `/projects/${projectUuid}/saved`,
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const useUpdateMultipleMutation = (projectUuid: string) => {
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();

    return useMutation<SavedChart[], ApiError, UpdateMultipleSavedChart[]>(
        (data) => {
            return updateMultipleSavedQuery(projectUuid, data);
        },
        {
            mutationKey: ['saved_query_multiple_update'],
            onSuccess: async (data) => {
                await queryClient.invalidateQueries(['space', projectUuid]);
                await queryClient.invalidateQueries('spaces');
                await queryClient.invalidateQueries(
                    'most-popular-and-recently-updated',
                );
                data.forEach((savedChart) => {
                    queryClient.setQueryData(
                        ['saved_query', savedChart.uuid],
                        savedChart,
                    );
                });
                showToastSuccess({
                    title: `Success! Charts were updated.`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to save chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useUpdateMutation = (
    dashboardUuid?: string,
    savedQueryUuid?: string,
) => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();

    return useMutation<
        SavedChart,
        ApiError,
        Pick<UpdateSavedChart, 'name' | 'description'>
    >(
        (data) => {
            if (savedQueryUuid) {
                return updateSavedQuery(savedQueryUuid, data);
            }
            throw new Error('Saved chart ID is undefined');
        },
        {
            mutationKey: ['saved_query_create'],
            onSuccess: async (data) => {
                await queryClient.invalidateQueries([
                    'space',
                    data.projectUuid,
                ]);

                await queryClient.invalidateQueries(
                    'most-popular-and-recently-updated',
                );

                await queryClient.invalidateQueries('spaces');
                queryClient.setQueryData(['saved_query', data.uuid], data);
                showToastSuccess({
                    title: `Success! Chart was saved.`,
                    action: dashboardUuid
                        ? {
                              text: 'Open dashboard',
                              icon: 'arrow-right',
                              onClick: () =>
                                  history.push(
                                      `/projects/${data.projectUuid}/dashboards/${dashboardUuid}`,
                                  ),
                          }
                        : undefined,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to save chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useMoveChartMutation = (
    options?: UseMutationOptions<
        SavedChart,
        ApiError,
        Pick<SavedChart, 'uuid' | 'spaceUuid'>
    >,
) => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { showToastSuccess, showToastError } = useToaster();

    return useMutation<
        SavedChart,
        ApiError,
        Pick<SavedChart, 'uuid' | 'spaceUuid'>
    >(({ uuid, spaceUuid }) => updateSavedQuery(uuid, { spaceUuid }), {
        mutationKey: ['saved_query_move'],
        ...options,
        onSuccess: async (data, _, __) => {
            await queryClient.invalidateQueries('spaces');
            await queryClient.invalidateQueries(['space', projectUuid]);
            await queryClient.invalidateQueries(
                'most-popular-and-recently-updated',
            );

            queryClient.setQueryData(['saved_query', data.uuid], data);
            showToastSuccess({
                title: `Chart has been moved to ${data.spaceName}`,
                action: {
                    text: 'Go to space',
                    icon: 'arrow-right',
                    onClick: () =>
                        history.push(
                            `/projects/${projectUuid}/spaces/${data.spaceUuid}`,
                        ),
                },
            });
            options?.onSuccess?.(data, _, __);
        },
        onError: (error) => {
            showToastError({
                title: `Failed to move chart`,
                subtitle: error.error.message,
            });
        },
    });
};

export const useCreateMutation = () => {
    const history = useHistory();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<SavedChart, ApiError, CreateSavedChart>(
        (data) => createSavedQuery(projectUuid, data),
        {
            mutationKey: ['saved_query_create', projectUuid],
            onSuccess: (data) => {
                queryClient.setQueryData(['saved_query', data.uuid], data);
                showToastSuccess({
                    title: `Success! Chart was saved.`,
                });
                history.push({
                    pathname: `/projects/${projectUuid}/saved/${data.uuid}/view`,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to save chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

type DuplicateChartMutationOptions = {
    showRedirectButton?: boolean;
};

export const useDuplicateChartMutation = (
    options?: DuplicateChartMutationOptions,
) => {
    const history = useHistory();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const queryClient = useQueryClient();
    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<SavedChart, ApiError, SavedChart['uuid']>(
        (chartUuid) => duplicateSavedQuery(projectUuid, chartUuid),
        {
            mutationKey: ['saved_query_create', projectUuid],
            onSuccess: async (data) => {
                await queryClient.invalidateQueries('spaces');
                await queryClient.invalidateQueries(['space', projectUuid]);
                await queryClient.invalidateQueries(
                    'most-popular-and-recently-updated',
                );

                if (!options?.showRedirectButton) {
                    history.push({
                        pathname: `/projects/${projectUuid}/saved/${data.uuid}`,
                    });
                }

                showToastSuccess({
                    title: `Chart successfully duplicated!`,
                    action: options?.showRedirectButton
                        ? {
                              text: 'Open chart',
                              icon: 'arrow-right',
                              onClick: () =>
                                  history.push(
                                      `/projects/${projectUuid}/saved/${data.uuid}`,
                                  ),
                          }
                        : undefined,
                });
            },
            onError: (error) => {
                showToastError({
                    title: `Failed to duplicate chart`,
                    subtitle: error.error.message,
                });
            },
        },
    );
};

export const useAddVersionMutation = () => {
    const history = useHistory();
    const queryClient = useQueryClient();
    const dashboardUuid = useSearchParams('fromDashboard');

    const { showToastSuccess, showToastError } = useToaster();
    return useMutation<
        SavedChart,
        ApiError,
        { uuid: string; payload: CreateSavedChartVersion }
    >(addVersionSavedQuery, {
        mutationKey: ['saved_query_version'],
        onSuccess: async (data) => {
            await queryClient.invalidateQueries('spaces');
            await queryClient.invalidateQueries(
                'most-popular-and-recently-updated',
            );

            queryClient.setQueryData(['saved_query', data.uuid], data);

            if (dashboardUuid)
                showToastSuccess({
                    title: `Success! Chart was updated.`,
                    action: {
                        text: 'Open dashboard',
                        icon: 'arrow-right',
                        onClick: () =>
                            history.push(
                                `/projects/${data.projectUuid}/dashboards/${dashboardUuid}`,
                            ),
                    },
                });
            else {
                showToastSuccess({
                    title: `Success! Chart was updated.`,
                });
                history.push({
                    pathname: `/projects/${data.projectUuid}/saved/${data.uuid}/view`,
                });
            }
        },
        onError: (error) => {
            showToastError({
                title: `Failed to update chart`,
                subtitle: error.error.message,
            });
        },
    });
};
