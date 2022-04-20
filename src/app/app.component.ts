import { Component } from '@angular/core';
import { MatrixSdkAccessService } from './messenger/matrix-sdk-access.service';
import { MessengerDirectChat } from './messenger/messenger-direct-chat';
import { MessengerMessage } from './messenger/messenger-message';
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
 
  nameOfLoggedInUser = "Max";
  username: string = "max.muster";
  password: string = "secret";
  
  newRoomName: string = "Neuer Raum";

  allRooms: MessengerRoom[] = [];
  allUsers: MessengerUser[] = [];
  allDms: MessengerDirectChat[] = [];

  allMessagesInSelectedRoom: MessengerMessage[] = [];
  selectedRoomId: string = "";
  selectedUserId: string = "";

  enteredMsgTxt: string = "Hello World";
  enteredDirectMsgTxt: string = "Hello World";
  afterLoginSectionHidden: boolean = true;
 
  _matrixSdkAccessService: MatrixSdkAccessService;

  constructor(matrixSdkAccessService: MatrixSdkAccessService){

    this._matrixSdkAccessService = matrixSdkAccessService;
  }

  async onLoginBtClick(){
    this._matrixSdkAccessService.login(this.username, this.password)
    .then((value)=>{
      this.afterLoginSectionHidden = false;
      this.nameOfLoggedInUser = this._matrixSdkAccessService.getLoggedInUser().userDisplayName;
      this.updateRooms();
      this.updateUsers();
      this.updateDms();
      this._matrixSdkAccessService.registerOnMessageListener(this.onMessageArrived);
      
    });
  }

  onCreateRoomBtClick(){
    const that = this;
    this._matrixSdkAccessService.createRoom(this.newRoomName, "Testraum").then(
      (res) => {
        that.updateRooms();
      }
    )
  }

  onSendMessageToRoomBtClick(){
    this._matrixSdkAccessService.sendMessageToRoom(this.selectedRoomId, this.enteredMsgTxt);
  }

  onShowMessagesOfRoomBtClick(){
    this.allMessagesInSelectedRoom = this._matrixSdkAccessService.getAllMessagesFromRoom(this.selectedRoomId);
  }

  onDeleteRoomBtClick(){
    const that = this;
    this._matrixSdkAccessService.deleteRoom(this.selectedRoomId).then(
      (res)=>{
        that.updateRooms();
      }
    );
  }

  onInviteToRoomBtClick(){
    this._matrixSdkAccessService.inviteUserToRoom(this.selectedUserId, this.selectedRoomId);
  }

  onSendDirectMessageBtClick(){
    this._matrixSdkAccessService.sendDM(this.selectedUserId, this.enteredDirectMsgTxt);
  }
  /* UI */

  updateRooms(){
    this.allRooms = this._matrixSdkAccessService.getAllRoomsOfLoggedInUser();
  }

  updateUsers(){
    this.allUsers = this._matrixSdkAccessService.getAllMembersOfRoomsOfLoggedInUser();
  }

  updateDms(){
    this.allDms = this._matrixSdkAccessService.getAllDmsOfLoggedInUser();
  }

  onMessageArrived(message:MessengerMessage){
      alert(message.sender.userDisplayName + " hat eine Nachricht in " + message.room.roomDisplayName + " gesendet: " + message.content);
  }
}
