import { NonIdealState, Spinner } from '@blueprintjs/core';
import { subject } from '@casl/ability';
import { formatTimestamp, TimeFrames } from '@lightdash/common';
import {
    ActionIcon,
    Badge,
    Button,
    Flex,
    Group,
    Menu,
    Modal,
    NavLink,
    Stack,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';
import { IconDots, IconFileAnalytics, IconHistory } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Can } from '../components/common/Authorization';
import { EmptyState } from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import MantineIcon from '../components/common/MantineIcon';
import Page from '../components/common/Page/Page';
import PageBreadcrumbs from '../components/common/PageBreadcrumbs';
import Explorer from '../components/Explorer';
import { useChartVersionResultsMutation } from '../hooks/useQueryResults';
import {
    useChartHistory,
    useChartVersion,
    useChartVersionRollbackMutation,
} from '../hooks/useSavedQuery';
import { useApp } from '../providers/AppProvider';
import {
    ExplorerProvider,
    ExplorerSection,
} from '../providers/ExplorerProvider';
import { ReactComponent as NoTableIcon } from '../svgs/emptystate-no-table.svg';

const ChartHistory = () => {
    const history = useHistory();
    const { user } = useApp();
    const { savedQueryUuid, projectUuid } = useParams<{
        savedQueryUuid: string;
        projectUuid: string;
    }>();
    const [selectedVersionUuid, selectVersionUuid] = useState<string>();
    const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
    const historyQuery = useChartHistory(savedQueryUuid);

    const chartVersionQuery = useChartVersion(
        savedQueryUuid,
        selectedVersionUuid,
    );

    const queryResults = useChartVersionResultsMutation(
        savedQueryUuid,
        selectedVersionUuid,
    );

    const rollbackMutation = useChartVersionRollbackMutation(savedQueryUuid, {
        onSuccess: () => {
            history.push(
                `/projects/${projectUuid}/saved/${savedQueryUuid}/view`,
            );
        },
    });

    if (historyQuery.isLoading) {
        return (
            <div style={{ marginTop: '20px' }}>
                <NonIdealState title="Loading..." icon={<Spinner />} />
            </div>
        );
    }
    if (historyQuery.error) {
        return <ErrorState error={historyQuery.error.error} />;
    }

    return (
        <Page
            title="Chart History"
            withSidebarFooter
            withFullHeight
            withPaddedContent
            sidebar={
                <Stack
                    spacing="xl"
                    mah="100%"
                    sx={{ overflowY: 'hidden', flex: 1 }}
                >
                    <Flex gap="xs">
                        <PageBreadcrumbs
                            items={[
                                {
                                    title: 'Chart',
                                    to: `/projects/${projectUuid}/saved/${savedQueryUuid}/view`,
                                },
                                { title: 'History', active: true },
                            ]}
                        />
                        <Badge size="sm" variant="light">
                            BETA
                        </Badge>
                    </Flex>
                    <Stack spacing="xs" sx={{ flexGrow: 1, overflowY: 'auto' }}>
                        {historyQuery.data?.history.map((version, index) => (
                            <NavLink
                                key={version.versionUuid}
                                active={
                                    version.versionUuid === selectedVersionUuid
                                }
                                icon={<MantineIcon icon={IconFileAnalytics} />}
                                label={formatTimestamp(
                                    version.createdAt,
                                    TimeFrames.SECOND,
                                )}
                                description={
                                    <Text>
                                        Updated by:{' '}
                                        {version.createdBy?.firstName}{' '}
                                        {version.createdBy?.lastName}
                                    </Text>
                                }
                                rightSection={
                                    <>
                                        {index === 0 && (
                                            <Tooltip
                                                label={`This is the current version.`}
                                            >
                                                <Badge
                                                    size="xs"
                                                    variant="light"
                                                    color="green"
                                                >
                                                    current
                                                </Badge>
                                            </Tooltip>
                                        )}
                                        {index !== 0 &&
                                            version.versionUuid ===
                                                selectedVersionUuid && (
                                                <Can
                                                    I="manage"
                                                    this={subject(
                                                        'SavedChart',
                                                        {
                                                            organizationUuid:
                                                                user.data
                                                                    ?.organizationUuid,
                                                            projectUuid,
                                                        },
                                                    )}
                                                >
                                                    <Menu
                                                        withinPortal
                                                        position="bottom-start"
                                                        withArrow
                                                        arrowPosition="center"
                                                        shadow="md"
                                                        offset={-4}
                                                        closeOnItemClick
                                                        closeOnClickOutside
                                                    >
                                                        <Menu.Target>
                                                            <ActionIcon
                                                                sx={(
                                                                    theme,
                                                                ) => ({
                                                                    ':hover': {
                                                                        backgroundColor:
                                                                            theme
                                                                                .colors
                                                                                .gray[1],
                                                                    },
                                                                })}
                                                            >
                                                                <IconDots
                                                                    size={16}
                                                                />
                                                            </ActionIcon>
                                                        </Menu.Target>

                                                        <Menu.Dropdown
                                                            maw={320}
                                                        >
                                                            <Menu.Item
                                                                component="button"
                                                                role="menuitem"
                                                                icon={
                                                                    <IconHistory
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                }
                                                                onClick={() => {
                                                                    setIsRollbackModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                Restore this
                                                                version
                                                            </Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </Can>
                                            )}
                                    </>
                                }
                                onClick={() =>
                                    selectVersionUuid(version.versionUuid)
                                }
                            />
                        ))}
                    </Stack>
                </Stack>
            }
        >
            {!selectedVersionUuid && (
                <EmptyState
                    maw={500}
                    icon={<NoTableIcon />}
                    title="Select a version"
                />
            )}
            {chartVersionQuery.data && (
                <ExplorerProvider
                    key={selectedVersionUuid}
                    queryResults={queryResults}
                    initialState={{
                        shouldFetchResults: true,
                        previouslyFetchedState: undefined,
                        expandedSections: [ExplorerSection.VISUALIZATION],
                        unsavedChartVersion: chartVersionQuery.data.chart,
                        modals: {
                            additionalMetric: {
                                isOpen: false,
                            },
                        },
                    }}
                    savedChart={chartVersionQuery.data?.chart}
                >
                    <Explorer hideHeader={true} />
                </ExplorerProvider>
            )}

            <Modal
                opened={isRollbackModalOpen}
                onClose={() => setIsRollbackModalOpen(false)}
                withCloseButton={false}
                title={
                    <Group spacing="xs">
                        <MantineIcon icon={IconHistory} size="lg" />
                        <Title order={4}>Restore chart version</Title>
                    </Group>
                }
            >
                <Stack>
                    <Text>
                        By restoring to this chart version, a new version will
                        be generated and saved. All previous versions are still
                        safely stored and can be restored at any time.
                    </Text>
                    <Group position="right" spacing="xs">
                        <Button
                            variant="outline"
                            disabled={rollbackMutation.isLoading}
                            onClick={() => setIsRollbackModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            loading={rollbackMutation.isLoading}
                            onClick={() =>
                                selectedVersionUuid &&
                                rollbackMutation.mutate(selectedVersionUuid)
                            }
                            type="submit"
                        >
                            Restore
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Page>
    );
};

export default ChartHistory;
