import { Component } from '@angular/core';
import sdk from 'matrix-js-sdk';
import { SDPStreamMetadataKey } from 'matrix-js-sdk/lib/webrtc/callEventTypes';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'matrix-js-sdk-test';

  constructor(){
    const client: any = sdk.createClient("https://studytalk.inform.hs-hannover.de");
    client.loginWithPassword("brian.kuhn", "secret");
  }
  

}
