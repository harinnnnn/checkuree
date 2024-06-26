'use client';

import React, { useEffect, useState } from 'react';

// Libraries
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Components
import {
    FormControl,
    TextField,
    Radio,
    RadioGroup,
    FormControlLabel,
    Modal,
} from '@mui/material';

// Utils
import { dateFormat } from '@/utils';

// Styles
import { Colors, Icons } from '@/styles/globalStyles';
import {
    CalendarContainer,
    FormContentsContainer,
} from '@/styles/app/listManagement.styles';
import {
    AttendanceData,
    AttendanceDetail,
    CreateAttendee,
    CreateSchedules,
} from '@/api/attendances/schema';
import Icon from '@/components/Icon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AttendanceApiClient from '@/api/attendances/AttendanceApiClient';

// Types
interface Inputs {
    name: string;
    gender: string;
    birth: string;
    mobileNumber: string;
    subMobileNumber: string;
    times: Record<string, string[]>;
}

const FormContents = ({
    data,
    attendanceId,
    onClose,
}: {
    data: AttendanceData;
    attendanceId: string;
    onClose: () => void;
}) => {
    const queryClient = useQueryClient();

    const [selectedDay, setSelectedDay] = useState<string>(data?.days[0] || '');
    const [timeOptions, setTimeOptions] = useState<
        { label: string; value: string }[]
    >([]);
    const [showCalendar, setShowCalendar] = useState(false);

    const {
        watch,
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<Inputs>({
        defaultValues: { gender: 'MALE' },
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
    });

    const onSubmit = handleSubmit((data) => {
        // TODO: times 정보는 schedule로 보내야 함.
        const { times, subMobileNumber, ...rest } = data;

        if (attendanceId) {
            mutateAttendee({ ...rest, attendanceId });
        }
    });

    const days: Record<string, string> = {
        MONDAY: '월',
        TUESDAY: '화',
        WEDNESDAY: '수',
        THURSDAY: '목',
        FRIDAY: '금',
        SATURDAY: '토',
        SUNDAY: '일',
    };

    const { mutate: mutateAttendee } = useMutation({
        mutationFn: async (parameters: CreateAttendee) => {
            const response =
                await AttendanceApiClient.getInstance().createAttendee(
                    parameters
                );
            return response.data;
        },
        onSuccess: async (data) => {
            // TODO: 출석부 정보 api 수정되면 선택 가능 시간 내에서 선택한 수업 시간으로 파라미터 수정 필요
            mutateSchedules({
                attendanceId,
                attendeeId: data.data.id,
                singleSchedules: [
                    {
                        day: 'SUNDAY',
                        time: '0930',
                    },
                ],
            });
        },
    });

    const { mutate: mutateSchedules } = useMutation({
        mutationFn: async (parameters: CreateSchedules) => {
            const response =
                await AttendanceApiClient.getInstance().createSchedules(
                    parameters
                );
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['attendee-list'],
            });
            onClose();
        },
    });

    // 30분 간격으로 시간을 생성하는 함수
    function generateTimeOptions() {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const timeValue = (hour * 100 + minute)
                    .toString()
                    .padStart(4, '0');
                options.push({ label: timeLabel, value: timeValue });
            }
        }
        return options;
    }

    useEffect(() => {
        if (data && data?.availableFrom && data?.availableTo) {
            const fromMinutes =
                parseInt(data.availableFrom.substring(0, 2)) * 60 +
                parseInt(data.availableFrom.substring(2));
            const toMinutes =
                parseInt(data.availableTo.substring(0, 2)) * 60 +
                parseInt(data.availableTo.substring(2));

            // 생성된 시간 중에서 from에서 to까지의 범위에 해당하는 시간들을 필터링
            const timeOptions = generateTimeOptions().filter((option) => {
                const currentTimeInMinutes =
                    parseInt(option.value.substring(0, 2)) * 60 +
                    parseInt(option.value.substring(2));
                return (
                    currentTimeInMinutes >= fromMinutes &&
                    currentTimeInMinutes <= toMinutes
                );
            });

            setTimeOptions(timeOptions);
        }

        if (data && data.days) {
            let initialDays = {};
            data.days.forEach((day) => {
                Object.assign(initialDays, { [day]: [] });
            });
            setValue('times', initialDays);
        }
    }, [data]);

    const handleSelectTime = (day: string, time: string) => {
        const updatedTimes = watch('times');
        const index = updatedTimes[day].indexOf(time);
        if (index !== -1) {
            updatedTimes[day].splice(index, 1);
        } else {
            updatedTimes[day].push(time);
        }
        setValue('times', updatedTimes);
    };

    return (
        <FormContentsContainer gender={watch('gender')}>
            <form id="create-attendees" onSubmit={onSubmit}>
                <div className="form-row">
                    <div className="label">이름</div>
                    <div className="value">
                        <TextField {...register('name')} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="label">성별</div>
                    <div className="value">
                        <FormControl>
                            <RadioGroup
                                defaultValue="MALE"
                                aria-labelledby="gender-radio-buttons-group-label"
                                name="radio-buttons-group"
                            >
                                <FormControlLabel
                                    value="MALE"
                                    control={
                                        <Radio
                                            {...register('gender')}
                                            sx={{
                                                color:
                                                    watch('gender') === 'MALE'
                                                        ? Colors.CheckureeGreen
                                                        : Colors.Gray60,
                                                '&.Mui-checked': {
                                                    color:
                                                        watch('gender') ===
                                                        'MALE'
                                                            ? Colors.CheckureeGreen
                                                            : Colors.Gray60,
                                                },
                                                '&.MuiFormControlLabel-label': {
                                                    color: Colors.Gray60,
                                                },
                                            }}
                                        />
                                    }
                                    label="남"
                                />
                                <FormControlLabel
                                    value="FEMALE"
                                    control={
                                        <Radio
                                            {...register('gender')}
                                            sx={{
                                                color:
                                                    watch('gender') === 'FEMALE'
                                                        ? Colors.CheckureeGreen
                                                        : Colors.Gray60,
                                                '&.Mui-checked': {
                                                    color:
                                                        watch('gender') ===
                                                        'FEMALE'
                                                            ? Colors.CheckureeGreen
                                                            : Colors.Gray60,
                                                },
                                                '&.MuiFormControlLabel-label': {
                                                    color: Colors.Gray60,
                                                },
                                            }}
                                        />
                                    }
                                    label="녀"
                                />
                            </RadioGroup>
                        </FormControl>
                    </div>
                </div>

                <div className="form-row">
                    <div className="label">생년월일</div>
                    <div className="value">
                        <div
                            className="calendar-input"
                            onClick={() => setShowCalendar(true)}
                        >
                            {watch('birth') ? (
                                dateFormat(new Date(watch('birth')), 'slash')
                            ) : (
                                <span>YYYY/MM/DD</span>
                            )}
                        </div>
                        <Modal
                            open={showCalendar}
                            onClose={() => setShowCalendar(false)}
                        >
                            <CalendarContainer>
                                <Calendar
                                    value={watch('birth')}
                                    onChange={(date) => {
                                        if (date && date instanceof Date) {
                                            setValue(
                                                'birth',
                                                dateFormat(date, 'dash')
                                            );
                                        }
                                        setShowCalendar(false);
                                    }}
                                />
                            </CalendarContainer>
                        </Modal>
                    </div>
                </div>

                <div className="form-row">
                    <div className="label">핸드폰 번호</div>
                    <div className="value">
                        <TextField {...register('mobileNumber')} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="label">보호자 핸드폰 번호</div>
                    <div className="value">
                        <TextField {...register('subMobileNumber')} />
                    </div>
                </div>

                <div className="days-times-container">
                    <div className="days-container">
                        {data?.days.map((day) => (
                            <div
                                className={`day ${selectedDay === day ? 'selected' : ''}`}
                                onClick={() => setSelectedDay(day)}
                            >
                                {days[day]}
                            </div>
                        ))}
                    </div>
                    <div className="time-container">
                        <div className="selected-times">
                            {watch('times') &&
                                watch('times')[selectedDay].map((item) => (
                                    <div className="selected-time">
                                        {`${item.slice(0, 2)}:${item.slice(2)}`}
                                        <Icon
                                            icon={Icons.highlight_off}
                                            size={20}
                                            color={Colors.CheckureeGreen}
                                            onClick={() =>
                                                handleSelectTime(
                                                    selectedDay,
                                                    item
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                        </div>
                        <div className="time-options">
                            {timeOptions.map((item) => {
                                const isSelected =
                                    watch('times') &&
                                    watch('times')[selectedDay].includes(
                                        item.value
                                    );

                                return (
                                    <div
                                        className={`time-option ${isSelected ? 'selected' : ''}`}
                                        onClick={() =>
                                            handleSelectTime(
                                                selectedDay,
                                                item.value
                                            )
                                        }
                                    >
                                        {item.label}
                                        <Icon
                                            icon={
                                                Icons[
                                                    isSelected
                                                        ? 'check_circle'
                                                        : 'radio_button_unchecked'
                                                ]
                                            }
                                            size={20}
                                            color={
                                                isSelected
                                                    ? Colors.CheckureeGreen
                                                    : Colors.Gray60
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </form>

            <section className="additional-button-container">
                <div className="additional-button">전체 스케줄보기</div>
                <div className="additional-button">출석 히스토리</div>
            </section>

            <div className="disabled-button">비활성화</div>

            <section className="button-container">
                <div className="button cancel" onClick={onClose}>
                    취소
                </div>
                <button
                    type="submit"
                    className="button confirm"
                    form="create-attendees"
                >
                    저장
                </button>
            </section>
        </FormContentsContainer>
    );
};

export default FormContents;
