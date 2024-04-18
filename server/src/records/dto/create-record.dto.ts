import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Record } from '../entities/record.entity';
import { SingleRecord } from '../const/singleRecord.class';

export class CreateRecordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '출석부 PK',
    type: 'string',
    example: 'uuid-1234-uuid',
  })
  attendanceId: string;

  @IsArray()
  @ApiProperty({ description: '출석 기록', type: Array.of(SingleRecord) })
  singleRecords: SingleRecord[];

  createdAt: Date;

  toEntities(createId: string): Record[] {
    return this.singleRecords.map((singleRecord) => {
      const record = new Record();
      record.status = singleRecord.status;
      record.date = singleRecord.date;
      record.day = singleRecord.day;
      record.attendeeId = singleRecord.attendeeId;
      record.createId = createId;
      record.createdAt = new Date();
      return record;
    });
  }
}
