import { Component } from '@angular/core';
import { MatrixSdkAccessService } from './messenger/matrix-sdk-access.service';
import { MessengerRoom } from './messenger/messenger-room';
import { MessengerUser } from './messenger/messenger-user';

declare const matrixcs: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'matrix-js-sdk-test';
  client: any;
  username: string = "max.muster";
  password: string = "secret";
  BASE_URL: string = "https://studytalk.inform.hs-hannover.de";

  allRooms: MessengerRoom[] = [];
  allUsers: MessengerUser[] = [];
  selectedRoomId: string = "";
  selectedUserId: string = "";
  enteredMsgTxt: string = "Hello World";
  afterLoginSectionHidden: boolean = true;
  newRoomName: string = "Neuer Raum";

  matrixSdkAccessService: MatrixSdkAccessService;

  constructor(matrixSdkAccessService: MatrixSdkAccessService){

    this.matrixSdkAccessService = matrixSdkAccessService;
  }

  /* Matrix-SDK-Access */
  async onLoginBtClick(){
    //console.log("LoginBtClicked")
    //this.client = matrixcs.createClient(this.BASE_URL);

    //await this.client.loginWithPassword(this.username, this.password);
    //await this.client.startClient();
    //await this.client.once('sync', (this.onLoggedIn).bind(this));
    const that = this;
    this.matrixSdkAccessService.login(this.username, this.password, function(){
      console.log("callback called")
    }).then((value)=>{
      console.log("promise called", value)
      that.afterLoginSectionHidden = false;
      that.updateRooms(false);
      that.updateUsers(false);
      that.addMessageReceiveCallback(that.onMessageArrived);
    });
  }

  onCreateRoomBtClick(){
    const that = this;
    this.createRoom(this.newRoomName, function(){
      that.updateRooms(true);
  });
  }

  onSendMessageToRoomBtClick(){
    this.sendMessage(this.selectedRoomId, this.enteredMsgTxt);
  }

  onDeleteRoomBtClick(){
    this.forgetRoom(this.selectedRoomId);
  }

  onInviteToRoomBtClick(){
      this.inviteMemberToRoom(this.selectedUserId, this.selectedRoomId);
  }

  onLoggedIn(state:any, prevState:any, res:any){
    if (state == "PREPARED") {
      this.afterLoginSectionHidden = false;
      this.updateRooms(false);
      this.updateUsers(false);
      this.addMessageReceiveCallback(this.onMessageArrived);
    }
  }

  addMessageReceiveCallback(callback:Function){
    this.client.on("Room.timeline", function(event:any, room:any, toStartOfTimeline:any) {
          if (event.getType() == "m.room.message" && event.getContent().body != "") {
              const message = event.getContent().body;
              const roomName = room.name;
              const roomId = event.getRoomId();
              const sender = event.getSender();
              callback(message, sender, roomId, roomName);
          }
      });
  }

  sendMessage(roomId: string, messageText:string){
    this.client.sendMessage(
          roomId,
          {
              body: messageText,
              msgtype: 'm.text',
          }
      );
  }

  async createRoom(roomName:string, callback:Function){
      const options = {
          topic: "Dies ist ein Raum zum Testen",
          name: roomName
      }
      let result = await this.client.createRoom(options);
      callback(result.roomId);
  }

  forgetRoom(roomId:string){
    const that = this;
    this.client.leave(roomId, function(){
      that.client.forget(roomId, true);
          that.updateRooms(true);
      });
  }

  inviteMemberToRoom(roomId:string, userId:string){
    this.client.invite(userId, roomId);
  }

  /* UI */

  async updateRooms(sync:boolean){
    const that = this;
    function update(){
      that.allRooms = that.matrixSdkAccessService.getAllRoomsOfLoggedInUser()
    }
    if (sync) {
      this.client.once('sync', update);
    }else{
      update();
    }
  }

  updateUsers(sync: boolean){
    const that = this;
    function update(){
      const rooms = that.client.getRooms();
      let allUsersWithDuplicates: {name:string, id:string}[] = [];
      let userNamesByIds: {[key: string]: string} = {};

      for (let index = 0; index < rooms.length; index++) {
        const room = rooms[index];
        const users = room.getJoinedMembers();
        for (let j = 0; j < users.length; j++) {
            const user = users[j];
            const userName: string = user.name;
            const userId: string = user.userId;
            userNamesByIds[userId] = userName;
            allUsersWithDuplicates.push(
              {name: userName, id: userId}
            )
        }
      }

      Object.keys(userNamesByIds).forEach(function(userId) {
        const username: string = userNamesByIds[userId];
        that.allUsers.push({userName: username, userId:userId});
      });

    }
    if (sync) {
      this.client.once('sync', update);
    }else{
      update();
    }
  }

  onMessageArrived(message:string, sender:string, roomId:string, roomName:string){
      alert(sender + " hat eine Nachricht in " + roomName + " gesendet: " + message);
  }
}
