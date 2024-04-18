import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { User } from '../users/entities/user.entity';
import { Schedule } from './entities/schedule.entity';
import { ScheduleFilterDto } from './dto/schedule-filter.dto';
import { DeleteScheduleDto } from './dto/delete-schedule.dto';
import { CommonResponseDto } from '../common/response/common-response.dto';
import { ResponseWithoutPaginationDto } from '../common/response/responseWithoutPagination.dto';
export declare class SchedulesController {
    private readonly schedulesService;
    constructor(schedulesService: SchedulesService);
    create(createScheduleDto: CreateScheduleDto, user: User): Promise<CommonResponseDto<{
        ids: number[];
    }>>;
    findByAttendeeId(attendeeId: string): Promise<ResponseWithoutPaginationDto<Schedule>>;
    findByAttendanceId(attendanceId: string, scheduleFilterDto: ScheduleFilterDto): Promise<ResponseWithoutPaginationDto<Schedule>>;
    findTodayScheduleByAttendanceId(attendanceId: string, dateString: string, scheduleFilterDto: ScheduleFilterDto): Promise<ResponseWithoutPaginationDto<Schedule>>;
    deleteAll(deleteScheduleDto: DeleteScheduleDto): Promise<CommonResponseDto<any>>;
}
