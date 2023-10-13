import {
    CompactConfigMap,
    CompactOrAlias,
    ComparisonFormatTypes,
    getItemId,
} from '@lightdash/common';
import {
    ActionIcon,
    Radio,
    Select,
    Stack,
    Switch,
    Tabs,
    TextInput,
} from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import FieldSelect from '../../common/FieldSelect';
import MantineIcon from '../../common/MantineIcon';
import { useVisualizationContext } from '../../LightdashVisualization/VisualizationProvider';

const StyleOptions = [
    { value: '', label: 'none' },
    ...Object.values(CompactConfigMap).map(({ compact, label }) => ({
        value: compact,
        label,
    })),
];

const BigNumberConfigTabs = () => {
    const {
        bigNumberConfig: {
            bigNumberLabel,
            defaultLabel,
            setBigNumberLabel,
            bigNumberStyle,
            setBigNumberStyle,
            showStyle,
            availableFields,
            selectedField: selectedFieldId,
            setSelectedField,
            getField,
            showBigNumberLabel,
            setShowBigNumberLabel,
            showComparison,
            setShowComparison,
            comparisonFormat,
            setComparisonFormat,
            flipColors,
            setFlipColors,
            comparisonLabel,
            setComparisonLabel,
        },
    } = useVisualizationContext();

    const selectedField = getField(selectedFieldId);

    return (
        <Tabs w={320} defaultValue="layout">
            <Tabs.List>
                <Tabs.Tab value="layout">Layout</Tabs.Tab>
                <Tabs.Tab value="comparison">Comparison</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="layout">
                <Stack spacing="md" mt="sm">
                    <FieldSelect
                        label="Field"
                        item={selectedField}
                        items={availableFields}
                        onChange={(newValue) => {
                            setSelectedField(
                                newValue ? getItemId(newValue) : undefined,
                            );
                        }}
                    />

                    <TextInput
                        label="Label"
                        value={bigNumberLabel}
                        placeholder={defaultLabel}
                        onChange={(e) =>
                            setBigNumberLabel(e.currentTarget.value)
                        }
                        rightSection={
                            <ActionIcon
                                onClick={() => {
                                    setShowBigNumberLabel(!showBigNumberLabel);
                                }}
                            >
                                {showBigNumberLabel ? (
                                    <MantineIcon icon={IconEye} />
                                ) : (
                                    <MantineIcon icon={IconEyeOff} />
                                )}
                            </ActionIcon>
                        }
                    />

                    {showStyle && (
                        <Select
                            label="Format"
                            data={StyleOptions}
                            value={bigNumberStyle ?? ''}
                            onChange={(newValue) => {
                                if (!newValue) {
                                    setBigNumberStyle(undefined);
                                } else {
                                    setBigNumberStyle(
                                        newValue as CompactOrAlias,
                                    );
                                }
                            }}
                        />
                    )}
                </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="comparison">
                <Stack spacing="lg" mt="sm">
                    <Switch
                        label="Compare to previous row"
                        checked={showComparison}
                        onChange={() => {
                            setShowComparison(!showComparison);
                        }}
                    />

                    {showComparison ? (
                        <>
                            <Radio.Group
                                label="Compare by:"
                                value={comparisonFormat}
                                onChange={(e) => {
                                    setComparisonFormat(
                                        e === 'raw'
                                            ? ComparisonFormatTypes.RAW
                                            : ComparisonFormatTypes.PERCENTAGE,
                                    );
                                }}
                            >
                                <Stack spacing="xs" mt="sm">
                                    <Radio
                                        label="Raw value"
                                        value={ComparisonFormatTypes.RAW}
                                    />
                                    <Radio
                                        label="Percentage"
                                        value={ComparisonFormatTypes.PERCENTAGE}
                                    />
                                </Stack>
                            </Radio.Group>

                            <Switch
                                label="Flip positive color"
                                checked={flipColors}
                                onChange={() => {
                                    setFlipColors(!flipColors);
                                }}
                            />

                            <TextInput
                                label="Comparison label"
                                value={comparisonLabel ?? ''}
                                placeholder={'Add an optional label'}
                                onChange={(e) =>
                                    setComparisonLabel(e.currentTarget.value)
                                }
                            />
                        </>
                    ) : null}
                </Stack>
            </Tabs.Panel>
        </Tabs>
    );
};

export default BigNumberConfigTabs;
