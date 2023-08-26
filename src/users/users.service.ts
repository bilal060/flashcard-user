import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUsers } from './users.interface';
import * as bcrypt from 'bcryptjs';
import { CreateCardEvent } from './create-card.event';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private userModel: Model<IUsers>,
    private jwtService: JwtService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    response: Response,
  ): Promise<IUsers> {
    let existingUser;
    try {
      existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error getting user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (existingUser) {
      throw new HttpException(
        'Email already registered',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error saving user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    let newUser;
    try {
      newUser = await this.userModel.create({
        ...createUserDto,
        password: hashedPassword,
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error saving user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const jwt = await this.jwtService.signAsync({ id: newUser._id });

    response.cookie('jwt', jwt, { httpOnly: true });

    return newUser;
  }

  async userlogin(updateUserDto: UpdateUserDto, response: Response) {
    let existingUser;
    if (updateUserDto.email) {
      try {
        existingUser = await this.userModel.findOne({
          email: updateUserDto.email,
        });
      } catch (error) {
        console.log(error);
        throw new HttpException(
          'Error saving user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    if (!existingUser) {
      throw new HttpException('Invalid email', HttpStatus.NOT_FOUND);
    }

    if (updateUserDto.password) {
      const checkPassword = await bcrypt.compare(
        updateUserDto.password,
        existingUser.password,
      );
      if (!checkPassword) {
        throw new HttpException('Invalid password', HttpStatus.NOT_FOUND);
      }
    }

    const jwt = await this.jwtService.signAsync({ id: existingUser._id });

    response.cookie('jwt', jwt, { httpOnly: true });

    return {
      _id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      username: existingUser.username,
    };
  }

  async findAll(request: Request): Promise<IUsers[]> {
    const token = request.cookies['jwt'];
    if (!token) {
      throw new UnauthorizedException();
    }
    let data;
    try {
      data = this.jwtService.verifyAsync(token);
      if (!data) {
        throw new UnauthorizedException();
      }
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }

    let existingUsers;
    try {
      existingUsers = await this.userModel.find({});
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error getting users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return existingUsers;
  }

  async findOne(userId: string, request: Request): Promise<IUsers> {
    const token = request.cookies['jwt'];
    if (!token) {
      throw new UnauthorizedException();
    }
    let data;
    try {
      data = this.jwtService.verifyAsync(token);
      if (!data) {
        throw new UnauthorizedException();
      }
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
    let existingUser;
    try {
      existingUser = await this.userModel.findById(userId);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error getting user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (!existingUser) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }

    return existingUser;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    request: Request,
  ): Promise<IUsers> {
    const token = request.cookies['jwt'];
    if (!token) {
      throw new UnauthorizedException();
    }
    let data;
    try {
      data = this.jwtService.verifyAsync(token);
      if (!data) {
        throw new UnauthorizedException();
      }
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
    const filter = {};
    for (const [key, value] of Object.entries(updateUserDto)) {
      if (value && key !== 'password') {
        filter[key] = value;
      }
    }

    let hashedPassword;
    if (updateUserDto.password) {
      try {
        hashedPassword = await bcrypt.hash(updateUserDto.password, 12);
      } catch (error) {
        console.log(error);
        throw new HttpException(
          'Error updating user',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      filter['password'] = hashedPassword;
    }

    let updatedUser;
    try {
      updatedUser = await this.userModel.findByIdAndUpdate(id, filter);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error updating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!updatedUser) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }

    return updatedUser;
  }

  async remove(id: string, request: Request): Promise<IUsers> {
    const token = request.cookies['jwt'];
    if (!token) {
      throw new UnauthorizedException();
    }
    let data;
    try {
      data = this.jwtService.verifyAsync(token);
      if (!data) {
        throw new UnauthorizedException();
      }
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
    let deletedCard;
    try {
      deletedCard = await this.userModel.findByIdAndDelete(id);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error getting user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (!deletedCard) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }

    return deletedCard;
  }

  handleCardCreated(data: CreateCardEvent) {
    console.log('User card created', data);
  }

  handleCardUpdated(data: CreateCardEvent) {
    console.log('User card updated', data);
  }

  handleCardDeleted(data: CreateCardEvent) {
    console.log('User card deleted', data);
  }
}
