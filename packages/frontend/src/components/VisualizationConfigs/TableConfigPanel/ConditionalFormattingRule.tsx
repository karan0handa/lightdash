import {
    ConditionalFormattingWithConditionalOperator,
    ConditionalOperator,
    FilterableItem,
    FilterType,
} from '@lightdash/common';
import {
    ActionIcon,
    Collapse,
    Group,
    Select,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconX } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { FilterTypeConfig } from '../../common/Filters/configs';
import MantineIcon from '../../common/MantineIcon';

// conditional formatting only supports number fields for now
const filterConfig = FilterTypeConfig[FilterType.NUMBER];

interface ConditionalFormattingRuleProps {
    isDefaultOpen?: boolean;
    ruleIndex: number;
    rule: ConditionalFormattingWithConditionalOperator;
    field: FilterableItem;
    hasRemove?: boolean;
    onChangeRule: (
        newRule: ConditionalFormattingWithConditionalOperator,
    ) => void;
    onChangeRuleOperator: (newOperator: ConditionalOperator) => void;
    onRemoveRule: () => void;
}

const ConditionalFormattingRule: FC<ConditionalFormattingRuleProps> = ({
    isDefaultOpen = true,
    ruleIndex,
    rule,
    field,
    onChangeRule,
    onChangeRuleOperator,
    onRemoveRule,
    hasRemove,
}) => {
    const [isOpen, setIsOpen] = useState(isDefaultOpen);

    return (
        <Stack spacing="xs">
            <Group noWrap position="apart">
                <Group spacing="xs">
                    <ActionIcon onClick={() => setIsOpen(!isOpen)} size="sm">
                        <MantineIcon
                            icon={isOpen ? IconChevronUp : IconChevronDown}
                        />
                    </ActionIcon>

                    <Text fw={500}>Condition {ruleIndex + 1}</Text>
                </Group>

                {hasRemove && (
                    <Tooltip label="Remove rule" position="left">
                        <ActionIcon onClick={onRemoveRule} size="sm">
                            <MantineIcon icon={IconX} />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>

            <Collapse in={isOpen}>
                <Stack spacing="xs">
                    <Select
                        value={rule.operator}
                        data={filterConfig.operatorOptions}
                        onChange={(value) => {
                            if (!value) return;
                            onChangeRuleOperator(value as ConditionalOperator);
                        }}
                    />

                    <filterConfig.inputs
                        filterType={FilterType.NUMBER}
                        field={field}
                        rule={rule}
                        onChange={onChangeRule}
                    />
                </Stack>
            </Collapse>
        </Stack>
    );
};

export default ConditionalFormattingRule;
