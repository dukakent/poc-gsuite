# PoC GSuite

## Intro
This repo is a guide on Google integration to your application. You can find an example code in `./src/app.controller.ts`. Let's assume that we want the user to be able to access some information inside his organisation, such as getting list of all other users (members of his organisation), managing users, retrieving data of their Google Calendars, GMail statistics and whatever related to Google applications.

The single business-oriented service which provides all Google apps like GMail, Google Calendar, Google Docs, Google Drive to users inside some specific organisation or company is called [GSuite](https://gsuite.google.com/). It's similar to [Office 365](https://www.office.com/) from Microsoft. As a developer, you can use [Google APIs](https://developers.google.com/apis-explorer/#p/) to work with GSuite and all Google Apps and integrate them into your application which you are developing. I'm not going to describe how to enable and purchase a GSuite because it's a responsibility of a user. Let's assume the user already has GSuite working.

## User's authentication
The first thing user need to do in order to call Google APIs from your application - as well as to access any Google Application - is to pass authentication process. When user is authenticated, Google will determine user's identity and what organization (GSuite organisation) he belongs to. Google provides a great solution to authenticate users - it's an [OAuth 2.0 Protocol](https://developers.google.com/identity/protocols/OAuth2). This Google protocol completely implements all the authentication stuff and even provides a Sign-In form:

![Google Sign-In form](http://i.prntscr.com/daTpGagVQVaw6x0Rqqb6sQ.png)

After user is authenticated successfully, you can get a access token. This access token is what you need as a developer and is a required thing to call Google API so Google can identify our user. Next I'm going to describe all the steps of how to use Google OAuth protocol in your application and how to obtain that access token.
![Google OAuth 2.0 Protocol Flow](https://developers.google.com/accounts/images/webflow.png)

### Get OAuth credentials
First you need to create credentials so google can know which developer is using OAuth protocol in its application. Credentials consist of Client ID and Secret ID. You need them to create an instance of OAuth client in your app. Here is the step-by-step guide how to get the credentials:
* Go to [Developers Console](https://console.developers.google.com). Use your own usual developer email to authenticate yourself.
* Then you need to create a new Google Project. Click on `My Project` button in header
    ![New Project button](http://i.prntscr.com/Sy-bIgH7SkW8XyVnmMUmMg.png)

    In appeared pop-up click on "New Project". Fill the "Name" field. Make sure that you set an organisation domain.
    ![Create New Project](http://i.prntscr.com/HgZ8D_lSTY6vvE1qqyYXJg.png)
    
    Click on "create".
* Now when you've created a new Google Project, you can create an according OAuth credentials. Select your just created project in header. Then go to "Credentials" page (click on "Credentials" in sidebar) Then choose to create "OAuth client ID":
    ![Create OAuth Client ID](http://i.prntscr.com/ngE_hFHbQi2jEk8ZNvp9nw.png)
    
    On this step Console may may ask you to set up a consent screen. It means just to setup Google Sign-In form UI. Click on "Configure consent screen" dark blue button. Then Console will get you to OAuth consent screen. Just fill all the fields. Product name field is required and will be shown in Google Sign-In form
    ![OAuth consent screen](http://i.prntscr.com/B_ZkWvx3RFu5AxTpgSyVzw.png)
    Click "save".
    
    Then Console will get you back to "Create OAuth client ID" tab. Just specify the type of your application, which will be using the OAuth credentials. I suppose you want to choose "Web application". Then set any name for your credentials. Below you need to fill the list of all domains which will be calling OAuth protocol. This is needed to allow Cross Origin requests from your application. Also below you need to set a redirect URI. This is an URI which Google Sign-In form will call in case of successful authentication of a user.
    ![Create OAuth Client ID, set name and domains](http://i.prntscr.com/sAzJ98eIR2W8q5kofXD4nw.png)
    Click "Create". Well done, you just created an OAuth credentials! You can see it in your credentials list

### Usage of OAuth Client

* Install a OAuth client for your application. In my example I use [OAuth Node JS client](https://github.com/google/google-api-nodejs-client/) for nodejs backend apps. To create an instance of an OAuth client, you should use the code like this:
    ```typescript
    import { google } from 'googleapis'; // this is the NodeJS Client mentioned above
    
    const googleOauth2Client = new google.auth.OAuth2(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET,
        process.env.OAUTH_REDIRECT_URI,
      );
    ```

    Where Client ID and Client secret are parts of your just created OAuth credentials. You can find them in [Google Developers Console](https://console.developers.google.com/apis/credentials?project=robust-channel-208610). The redirect URI is the endpoint of your application which Google Sign-In form will call on successful user's authentication. Make sure you allow this endpoint in Console. 
* Generate an Authentication URL. This URL will get a user to a Google Sign-In form.
    ```typescript
    const scopes = [
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
      ];  
  
    const oauthURL = googleOauth2Client.generateAuthUrl({ scope: scopes });
    ```
    Scopes are Google API parts which you are going to use. You need to let google know which exact Google APIs you need so Google Sign-in Form can request user a permission  to use his personal data. Here is the [list of all scopes in Google](https://developers.google.com/identity/protocols/googlescopes).
*  Then you can call generated URL to redirect user to a Google sign-in form. When user signs in, it will call your redirect URI (chich you mentioned during OAuth Client instantiation) and will pass an authorization code as a query parameter. You need this code to generate an access token. Here is how my redirect URI route looks like:

    ```typescript
    @Get('/authcallback')
    async auth(@Request() req, @Response() res, @Query() queryParams) {
      const { autorizationCode } = queryParams;
        
      const { accessToken } = await this.googleOauth2Client.getToken(autorizationCode);
        
      googleOauth2Client.setCredentials(accessToken);
    
       // other actions
    }
    ```
    
    All right, when you got an access token and set it to your oauth client, you can use a Google API (particularly that on which you mentioned in scope array)
    
## Get all users of an organization
If you want user of your application to manages other users inside an organization, you should use [Directory API](https://developers.google.com/admin-sdk/directory/).

NOTE: You should handle a case in your application when a user, who wants to access a Directory API, doesn't have a permission to get or update other users' data. It means that a user doesn't have admin rights in his organization. In this case a Directory API will return `403 status code`.

You can initialize a Directory API client in your app in this way:
```typescript
const googleAdminClient = google.admin('directory_v1');
```

After that you can get a users list like this:
```typescript
googleAdminClient.users.list({
  auth: googleOauth2Client,
  customer: 'my_customer',
});
```
`list()` method returns a promise. `googleOauth2Client` is an OAuth client with set access token. A `customer` is an ID of the user's GSuite account. Use `my_customer` alias to point to a user's GSuite account if he belongs to a single organization. In other case, use `domain` parameter. [HERE](https://developers.google.com/admin-sdk/directory/v1/reference/users/list) you can take a look at all parameters of this API and quick try online.

## Get calendar events of other users
If you need to get an information about user's calendars and events, set up push notifications and so on, you should use [Calendar API](https://developers.google.com/calendar/).

Inside GSuite organization, members can easily access calendars of each others. When new user is added to an organization, he gets a calendar connected to his account. This calendar is called a `primary calendar`. Each calendar has a unique ID. In case of primary calendar, it's id equals to an owner's email address. For example, if you want users of your app to get a list of events from calendars of other users, you can use [GET calendars/events](https://developers.google.com/calendar/v3/reference/events/list) API. Its required parameter is a `calendarId`, which is a owner's email address (in case of primary calendar).

```typescript
const googleCalendarClient = google.calendar({version: 'v3', auth: googleOauth2Client})

const events = await googleCalendarClient.events.list({
  calendarId: email,
})
```
That's it! Please take a look at [Events list API reference](https://developers.google.com/calendar/v3/reference/events/list), you can find a lot of useful parameters to filter events, and change their order

### Here you can watch the video how my example works:
 https://www.useloom.com/share/4d15d20b7b2f45cab1b22a4417a4b1e4