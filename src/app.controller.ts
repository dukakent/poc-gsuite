import { Get, Controller, Req, Res, Query } from '@nestjs/common';
import { google } from 'googleapis';

@Controller()
export class AppController {
  private oauth2Client: any;

  private readonly OAuthOptions = {
    clientId: 'CLIENT_ID_HERE',
    clientSecret: 'CLIENT_SECRET_HERE',
    redirectUri: 'CALLBACK_HERE',
  };

  constructor() {}

  @Get()
  root(@Req() req, @Res() res): void {
    this.oauth2Client = new google.auth.OAuth2(
      this.OAuthOptions.clientId,
      this.OAuthOptions.clientSecret,
      this.OAuthOptions.redirectUri,
    );

    const scope = [
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

    listUsers(tokens);
  }
}

function listUsers(auth) {
  const service = google.admin('directory_v1');

  console.log(auth);

}