import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventPattern } from '@nestjs/microservices';
import { CreateCardEvent } from './create-card.event';
import { Request, Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.usersService.create(createUserDto, response);
  }

  @Post('login')
  userlogin(
    @Body() updateUserDto: UpdateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.usersService.userlogin(updateUserDto, response);
  }

  @Get()
  findAll(@Req() request: Request) {
    return this.usersService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    return this.usersService.findOne(id, request);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ) {
    return this.usersService.update(id, updateUserDto, request);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.usersService.remove(id, request);
  }

  @EventPattern('card_created')
  handleCardCreated(data: CreateCardEvent) {
    return this.usersService.handleCardCreated(data);
  }

  @EventPattern('card_updated')
  handleCardUpdated(data: CreateCardEvent) {
    return this.usersService.handleCardUpdated(data);
  }

  @EventPattern('card_deleted')
  handleCardDeleted(data: CreateCardEvent) {
    return this.usersService.handleCardDeleted(data);
  }
}
