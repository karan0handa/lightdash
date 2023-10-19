import { MonthPickerInput, MonthPickerInputProps } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import { FC } from 'react';

type Props = Omit<MonthPickerInputProps, 'value' | 'onChange'> & {
    value: Date | null;
    onChange: (value: Date) => void;
};

const MonthAndYearInput: FC<Props> = ({ value, onChange, ...props }) => {
    const [isPopoverOpen, { open, close, toggle }] = useDisclosure();

    const yearValue = value ? dayjs(value).toDate() : null;

    return (
        <MonthPickerInput
            w="100%"
            size="xs"
            minDate={dayjs().year(1000).toDate()}
            maxDate={dayjs().year(9999).toDate()}
            onClick={toggle}
            {...props}
            popoverProps={{
                withArrow: true,
                withinPortal: false,
                shadow: 'md',
                // FIXME: remove this once we migrate off of Blueprint
                ...props.popoverProps,
                opened: isPopoverOpen,
                onOpen: () => {
                    props.popoverProps?.onOpen?.();
                    open();
                },
                onClose: () => {
                    props.popoverProps?.onClose?.();
                    close();
                },
            }}
            value={yearValue}
            onChange={(date) => {
                if (!date || Array.isArray(date)) return;
                onChange(date);
                close();
            }}
        />
    );
};

export default MonthAndYearInput;
