import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import type { JwtPayload } from '@hrms/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { ExpensesService } from './expenses.service';

class ExpenseItemBody {
  @IsString() category!: string;
  @IsString() description!: string;
  @IsNumber() amount!: number;
  @IsDateString() date!: string;
  @IsOptional() @IsString() receiptUrl?: string;
}

class CreateExpenseClaimBody {
  @IsString() title!: string;
  @IsOptional() @IsString() employeeId?: string;
  @IsOptional() @IsString() currency?: string;
  @IsArray() @ValidateNested({ each: true }) items!: ExpenseItemBody[];
}

class ExpenseDecisionBody {
  @IsIn(['approved', 'rejected', 'paid']) decision!: string;
}

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'expenses', version: '1' })
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('claims')
  @ApiOperation({ summary: 'List expense claims visible to the current user' })
  list(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.expensesService.list(user, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get expense claim summary' })
  summary(@CurrentUser() user: JwtPayload) {
    return this.expensesService.summary(user);
  }

  @Post('claims')
  @ApiOperation({ summary: 'Create a draft expense claim with line items' })
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateExpenseClaimBody) {
    return this.expensesService.create(user, body);
  }

  @Post('claims/:id/submit')
  @ApiOperation({ summary: 'Submit a draft expense claim for approval' })
  submit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.expensesService.submit(user, id);
  }

  @Post('claims/:id/decision')
  @Roles('hr_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'Approve, reject, or mark an expense claim as paid' })
  decide(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: ExpenseDecisionBody) {
    return this.expensesService.decide(user, id, body.decision);
  }
}
