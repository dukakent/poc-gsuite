# PoC GSuite
All the code you want to read is located in `./src/app.controller.ts`

In order to use Google API to access and manage your GSuite organization, you need to setup OAuth
## How to setup Google OAuth Client
* Create new Google App in [Developers Console](https://console.developers.google.com/)
* Create OAuth credentials, setup CORS URLs and allowed redirect URIs
* install Google API Client
[client for JS](https://developers.google.com/api-client-library/javascript/start/start-js)
[client for Node JS](https://github.com/google/google-api-nodejs-client)
* Initialize OAuth client in your app, use generated client id and secret id from Developers Console. Also you need to specify redirect URI. This redirect URI will be called on successful login in Google Sign-In form. Make sure that this URI is in allowed Redirect URI list in Developers Console.
[example of client setting up and getting auth URLwith NodeJS client](https://github.com/google/google-api-nodejs-client#oauth2-client)
* Then you need to generate an auth URL. Please mention scopes you want to use (scopes define which exact parts of Google API you will be able to access). The Auth URL will get user to Google Sign-In form
[list of all scopes](https://developers.google.com/identity/protocols/googlescopes)
* When user signs in successfully, Sign-In form will call redirect URI with set authorization code as URL parameter. This code is required to generate access token
[example of getting access token](https://github.com/google/google-api-nodejs-client/#retrieve-access-token)

No you can use this access token in order to use Google API

## Get users of organisation
To get all users list you should use Directory API ([official docs](https://developers.google.com/admin-sdk/directory/v1/guides/manage-users))

WARNING: If you intend to get users info, use *https://googleapis.com/auth/admin.directory.user.readonly* scope. If you are going to adjust users' info, use *https://googleapis.com/auth/admin.directory.user* scope

WARGING: Make sure that user has permissions to get user personal data. You can setup this in GSuite Admin Console for some specific user

In order to get users list:

call `GET https://www.googleapis.com/admin/directory/v1/users`

OR 

```angular2html
googleAdminClient.users.list({
  auth: this.googleOauth2Client,
  customer: 'my_customer',
});
```

where `my_customer` is an alias pointed to the organization domain, and `auth` is an OAuth client with access token set

see [official documentation](https://developers.google.com/admin-sdk/directory/v1/guides/manage-users) on how to manage users

## Get calendar events of users
In order to access calendar of other users, you don't need any permission because users inside an organization are able to access calendar events info of each other

To get events of particular calendar (not only your one), use this API:

`GET https://www.googleapis.com/calendar/v3/calendars/`*calendarId*`/events`

OR

```
googleCalendarClient.events.list({
  calendarId: email,
  maxResults: 99,
});
```

You can pass a user's email as `calendarId` to get events of his primary calendar