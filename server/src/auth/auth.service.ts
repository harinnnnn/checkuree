import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { jwtConstants } from './const/auth.const';
import { JwtPayload } from './const/jwtPayload.interface';
import { CommonResponseDto } from '../common/response/common-response.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}
  public async signup(createAuthDto: CreateAuthDto): Promise<CommonResponseDto<User>> {
    const user = createAuthDto.toEntity();
    await user.hashPassword();
    const result = await this.userRepository.save(user);

    delete result.password;

    return new CommonResponseDto('SUCCESS SIGNUP', result);
  }

  public async validateUser(username: string, password: string) {
    const user = await this.userRepository.findOne({ relations: { userAttendance: true }, where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new BadRequestException('ID 또는 비밀번호가 정확하지 않습니다.');
  }

  public async signIn(signInDto: SignInDto): Promise<CommonResponseDto<TokenResponseDto>> {
    const user = await this.validateUser(signInDto.username, signInDto.password);

    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      userType: user.type,
      userAttendance: user.userAttendance,
    };

    const refreshToken = this.generateRefreshToken(payload);
    const accessToken = this.generateAccessToken(payload);

    await this.saveRefreshToken(user.id, refreshToken);

    return new CommonResponseDto('SUCCESS SIGN IN', new TokenResponseDto(accessToken, refreshToken));
  }

  public async refreshToken(oldRefreshToken: string): Promise<CommonResponseDto<TokenResponseDto>> {
    const decoded: JwtPayload = this.verifyRefreshToken(oldRefreshToken);
    const user = await this.userRepository.findOne({
      relations: { userAttendance: true },
      where: {
        id: decoded.id,
      },
    });

    if (!user || user.refreshToken !== oldRefreshToken) {
      throw new UnauthorizedException();
    }

    const jwtPayload: JwtPayload = {
      id: user.id,
      username: user.username,
      userType: user.type,
      userAttendance: user.userAttendance,
    };

    const newAccessToken = this.generateAccessToken(jwtPayload);
    const newRefreshToken = this.generateRefreshToken(jwtPayload);

    await this.saveRefreshToken(user.id, newRefreshToken);

    return new CommonResponseDto('SUCCESS REFRESH TOKEN', new TokenResponseDto(newAccessToken, newRefreshToken));
  }

  private generateAccessToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, {
      secret: jwtConstants.accessTokenSecret,
      expiresIn: jwtConstants.accessTokenExpiresIn,
    });
  }

  private generateRefreshToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, {
      secret: jwtConstants.refreshTokenSecret,
      expiresIn: jwtConstants.refreshTokenExpiresIn,
    });
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    await this.userRepository.update(userId, { refreshToken });
  }

  private verifyRefreshToken(oldRefreshToken: string) {
    try {
      return this.jwtService.verify(oldRefreshToken, { secret: jwtConstants.refreshTokenSecret });
    } catch (err) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }
  }
}
