/// <reference types="@angular/localize" />

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// import { AwsRum, AwsRumConfig } from 'aws-rum-web';

// try {
//   const config: AwsRumConfig = {
//     sessionSampleRate: 1,
//     guestRoleArn: "arn:aws:iam::824949725598:role/RUM-Monitor-us-east-1-824949725598-3952923912961-Unauth",
//     identityPoolId: "us-east-1:19c9b4f2-ce65-4931-9e84-83c370a2b7a9",
//     endpoint: "https://dataplane.rum.us-east-1.amazonaws.com",
//     telemetries: ["performance","errors","http"],
//     allowCookies: false,
//     enableXRay: false
//   };

//   const APPLICATION_ID: string = '555862e6-875f-416f-8d0f-33253a025bf8';
//   const APPLICATION_VERSION: string = '1.0.0';
//   const APPLICATION_REGION: string = 'us-east-1';

//   const awsRum: AwsRum = new AwsRum(
//     APPLICATION_ID,
//     APPLICATION_VERSION,
//     APPLICATION_REGION,
//     config
//   );
// } catch (error) {
//   console.error("RUM Initialization Error!:", error);
// }
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));


