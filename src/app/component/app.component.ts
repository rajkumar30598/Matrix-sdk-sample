import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MatrixSdkAccessService } from '../services/matrix-sdk-access.service';
import { IMessengerDirectChat } from '../messenger-interfaces/messenger-direct-chat';
import { IMessengerMessage } from '../messenger-interfaces/messenger-message';
import { IMessengerRoom } from '../messenger-interfaces/messenger-room';
import { IMessengerUser } from '../messenger-interfaces/messenger-user';
import { MatrixUserManagementService } from '../services/matrix-user-management.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public title = 'matrix-js-sdk-test';
 
  public nameOfLoggedInUser = "Max";
  public username: string = environment.personalMatrixAccount.username;
  public password: string = environment.personalMatrixAccount.password;

  public newUsername: string = "max.muster";
  public newPassword: string = "";
  
  public newRoomName: string = "Neuer Raum";

  public allRooms: IMessengerRoom[] = [];
  public allUsers: IMessengerUser[] = [];
  public allDms: IMessengerDirectChat[] = [];

  public allMessagesInSelectedRoom: IMessengerMessage[] = [];
  public selectedRoomId: string = "";
  public selectedUserId: string = "";

  public enteredMsgTxt: string = "Hello World";
  public enteredDirectMsgTxt: string = "Hello World";
  public afterLoginSectionHidden: boolean = true;

  public newMatrixIdPassword: string = environment.personalMatrixAccount.password;
 
  public userNameToDelete: string = "max.muster";

  public allRegisteredMatrixIds: string[] = [];

  constructor(private _matrixSdkAccessService: MatrixSdkAccessService, private _matrixUserManagementService: MatrixUserManagementService){}

  ngOnInit(): void {
    MatrixUserManagementService.getUsers().then(
      (res)=>{
        this.allRegisteredMatrixIds = res;
      }
    )
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
      this._matrixSdkAccessService.registerOnRoomJoinedListener((this.onRoomJoined).bind(this));
    });
  }

  public onCreateRoomBtClick(){
    const updateRooms = this.updateRooms.bind(this);
    this._matrixSdkAccessService.createRoom(this.newRoomName, "Testraum").then(
      (res) => {
        updateRooms();
      }
    )
  }

  public onSendMessageToRoomBtClick(){
    this._matrixSdkAccessService.sendMessageToRoom(this.selectedRoomId, this.enteredMsgTxt);
  }

  public onShowMessagesOfRoomBtClick(){
    this.allMessagesInSelectedRoom = this._matrixSdkAccessService.getAllMessagesFromRoom(this.selectedRoomId);
  }

  public onDeleteRoomBtClick(){
    const updateRooms = this.updateRooms.bind(this);
    this._matrixSdkAccessService.deleteRoom(this.selectedRoomId).then(
      (res)=>{
        updateRooms();
      }
    );
  }

  public onInviteToRoomBtClick(){
    this._matrixSdkAccessService.inviteUserToRoom(this.selectedUserId, this.selectedRoomId);
  }

  public onChangePasswordBtClick(){
    MatrixUserManagementService.changePassword(
      environment.personalMatrixAccount.username,
      this.newMatrixIdPassword
    );
  }

  public onDeleteUserBtClick(){
    MatrixUserManagementService.deactivateUser(this.userNameToDelete).then(
      (res)=>{
        console.log(res);
      }
    );
  }

  public onRegisterBtClick(){

      const promise = this._matrixUserManagementService.createNewUser(this.newUsername, this.newPassword, "Testbenutzer");
      promise.then(
        (res: any) =>{
          console.log(res);
        },
        (err: any)=>{
          console.log(err);
        }
      );
  }

  public onSendDirectMessageBtClick(){
    this._matrixSdkAccessService.sendDM(this.selectedUserId, this.enteredDirectMsgTxt);
  }
  /* UI */

  public updateRooms(){
    this.allRooms = this._matrixSdkAccessService.getAllRoomsOfLoggedInUser();
  }

  public updateUsers(){
    this.allUsers = this._matrixSdkAccessService.getAllMembersOfRoomsOfLoggedInUser();
  }

  public updateDms(){
    this.allDms = this._matrixSdkAccessService.getAllDmsOfLoggedInUser();
  }

  public onMessageArrived(message:IMessengerMessage){
    alert(message.sender.userDisplayName + " hat eine Nachricht in " + message.room.roomDisplayName + " gesendet: " + message.content);
  }

  public onRoomJoined(room: IMessengerRoom){
    alert("Du bist dem Raum" + room.roomDisplayName + " hinzugefügt worden");
    this.updateRooms();
  }
}
