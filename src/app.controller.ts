import { Get, Controller, Request, Response, Query, Param } from '@nestjs/common';
import { admin_directory_v1, calendar_v3, google } from 'googleapis';
import { OAuthOptions } from '../tmp/credentials';
import { AxiosError } from '@nestjs/common/http/interfaces/axios.interfaces';
import Schema$Users = admin_directory_v1.Schema$Users;
import Schema$Events = calendar_v3.Schema$Events;

@Controller()
export class AppController {
  private readonly googleOauth2Client = new google.auth.OAuth2(
    OAuthOptions.clientId,
    OAuthOptions.clientSecret,
    OAuthOptions.redirectUri,
  );

  private readonly googleAdminClient = google.admin('directory_v1');
  private readonly googleCalendarClient = google.calendar({version: 'v3', auth: this.googleOauth2Client});

  private readonly scopes = [
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
  ];

  private readonly oauthURL = this.googleOauth2Client.generateAuthUrl({ scope: this.scopes });

  @Get()
  root(@Request() req, @Response() res): void {
    res.redirect(this.oauthURL);
  }

  @Get('/authcallback')
  async auth(@Request() req, @Response() res, @Query() queryParams) {
    const { code } = queryParams;

    const { tokens } = await this.googleOauth2Client.getToken(code);

    this.googleOauth2Client.setCredentials(tokens);

    this.getUserList()
      .catch((e: AxiosError) => {
        res.send(`ERROR: ${e.code}`);

        throw e;
      })
      .then(users => res.send(this.compileUserListTemplate(users.data)));
  }

  @Get('/calendar/:email')
  async getCalendar(@Request() req, @Response() res, @Param('email') email) {
    this.getEvents(email)
      .catch(e => {
        res.send(`ERROR: ${e.code}`);

        throw e;
      })
      .then(events => {
        res.send(this.compileEventsTemplate(email, events.data));
      });
  }

  private getUserList(): Promise<any> {
    return this.googleAdminClient.users.list({
      auth: this.googleOauth2Client,
      customer: 'my_customer',
    });
  }

  private getEvents(email: string): Promise<any> {
    return this.googleCalendarClient.events.list({
      calendarId: email,
      maxResults: 99,
    });
  }

  private compileUserListTemplate(usersResponse: Schema$Users): string {
    const users = usersResponse.users.map(user => `
      <p>
        <span>
          <div>${user.name.fullName}</div>
          <div>${user.primaryEmail}</div>
        </span>
        <span>
          <a href="/calendar/${user.primaryEmail}">Get his calendar events</a>
        </span>
      </p>
    `).join('');

    return `
      <p><h3>Users</h3></p>
      ${users}
    `;
  }

  private compileEventsTemplate(email: string, events: Schema$Events): string {
    const items = events.items.map(item => `
      <p style="border-bottom: 1px solid #333">
        <div>${item.summary}</div>
        <div>${item.description || ''}</div>
        <div>${item.start.dateTime}</div>
      </p>
    `).join('');

    return `
      <p>
        <h3>Events of ${email}</h3>
      </p>
      ${items}
    `;
  }
}
