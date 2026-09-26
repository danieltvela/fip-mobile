import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload, REFRESH_TOKEN_HEADER } from './jwt.strategies';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in with a press-team-issued credential number' })
  login(@Body() body: { credentialNumber?: unknown }) {
    return this.authService.login(body?.credentialNumber);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate a refresh token into a new token pair' })
  refresh(@Req() req: Request) {
    return this.authService.refresh(req.headers[REFRESH_TOKEN_HEADER]);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Profile of the authenticated journalist' })
  me(@Req() req: Request) {
    return this.authService.profile((req.user as JwtPayload).sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Invalidate the current refresh token' })
  logout(@Req() req: Request) {
    return this.authService.logout((req.user as JwtPayload).sub);
  }
}
