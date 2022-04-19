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

  async onLoginBtClick(){
    this.matrixSdkAccessService.login(this.username, this.password)
    .then((value)=>{
      this.afterLoginSectionHidden = false;
      this.updateRooms(false);
      this.updateUsers(false);
      this.matrixSdkAccessService.registerOnMessageListener(this.onMessageArrived);
    });
  }

  onCreateRoomBtClick(){
    const that = this;
    this.matrixSdkAccessService.createRoom(this.newRoomName, "Testraum").then(
      (res) => {
        that.updateRooms();
      }
    )
  }

  onSendMessageToRoomBtClick(){
    this.matrixSdkAccessService.sendMessageToRoom(this.selectedRoomId, this.enteredMsgTxt);
  }

  onDeleteRoomBtClick(){
    this.matrixSdkAccessService.deleteRoom(this.selectedRoomId);
  }

  onInviteToRoomBtClick(){
    this.matrixSdkAccessService.inviteUserToRoom(this.selectedUserId, this.selectedRoomId);
  }

  onLoggedIn(state:any, prevState:any, res:any){
    if (state == "PREPARED") {
      this.afterLoginSectionHidden = false;
      this.updateRooms(false);
      this.updateUsers(false);
      //TODO: this.addMessageReceiveCallback(this.onMessageArrived);
    }
  }

  /* UI */

  async updateRooms(sync?:boolean){
    if (sync) {
      this.matrixSdkAccessService.synchronize().then(
        (res)=>{
          this.allRooms = this.matrixSdkAccessService.getAllRoomsOfLoggedInUser();
        }
      )
    }else{
      this.allRooms = this.matrixSdkAccessService.getAllRoomsOfLoggedInUser();
    }
  }

  updateUsers(sync: boolean){
    if (sync) {
      this.matrixSdkAccessService.synchronize().then(
        (res)=>{
          this.allUsers = this.matrixSdkAccessService.getAllMembersOfRoomsOfLoggedInUser();
        }
      )
    }else{
      this.allUsers = this.matrixSdkAccessService.getAllMembersOfRoomsOfLoggedInUser();
    }
  }

  onMessageArrived(message:string, sender:MessengerUser, room:MessengerRoom){
      alert(sender.userName + " hat eine Nachricht in " + room.roomName + " gesendet: " + message);
  }
}
