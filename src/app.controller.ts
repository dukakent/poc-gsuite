import { Get, Controller, Req, Res, Query } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuthOptions } from '../tmp/credentials';
import { AxiosError } from '@nestjs/common/http/interfaces/axios.interfaces';

@Controller()
export class AppController {
  private oauth2Client: any;

  private readonly OAuthOptions = OAuthOptions;

  constructor() {}

  @Get()
  root(@Req() req, @Res() res): void {
    this.oauth2Client = new google.auth.OAuth2(
      this.OAuthOptions.clientId,
      this.OAuthOptions.clientSecret,
      this.OAuthOptions.redirectUri,
    );

    const scope = [
      'https://www.googleapis.com/auth/admin.directory.user',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    ];

    const url = this.oauth2Client.generateAuthUrl({ scope });

    res.redirect(url);
  }

  @Get('/authcallback')
  async auth(@Query() queryParams) {
    const { code } = queryParams;

    const { tokens } = await this.oauth2Client.getToken(code);

    this.oauth2Client.setCredentials(tokens);

    this.listUsers()
      .catch((e: AxiosError) => {
        console.log('ERROR: ', e);
      })
      .then(users => {
        console.log('Users: ', users);
      });
  }

  private listUsers(): Promise<any> {
    const service = google.admin('directory_v1');

    return new Promise((resolve, reject) => {
      service.users.list({
        auth: this.oauth2Client,
        orderBy: 'email',
        domain: 'valor-software.com',
      }, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}
