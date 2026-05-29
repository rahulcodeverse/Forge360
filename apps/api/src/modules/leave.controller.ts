import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('leave')
@Controller('leave')
export class LeaveController {
  @Post('approve-preview')
  approvePreview(@Body() body: { durationDays: number }) {
    const opening = 12;
    const accrued = 2;
    const taken = 1 + body.durationDays;
    const pending = 0;
    return {
      data: {
        opening,
        accrued,
        taken,
        pending,
        closing: opening + accrued - taken - pending,
      },
    };
  }
}
