import { newArray } from '@angular/compiler/src/util';
import { Injectable } from '@angular/core';
import { MessengerRoom } from './messenger-room';
import { MessengerUser } from './messenger-user';
declare const matrixcs: any;

@Injectable({
  providedIn: 'root'
})
export class MatrixSdkAccessService {

  client: any;
  static BASE_URL: string = "https://studytalk.inform.hs-hannover.de";
  constructor() { }

  login(username: string, password: string, callback: CallableFunction): Promise<any>{
    this.client = matrixcs.createClient(MatrixSdkAccessService.BASE_URL);
    const that = this;

    return this.client.loginWithPassword(username, password).then(
      (value: any) =>{
        return that.client.startClient().then(
          (value: any) =>{
            return that.synchronize(callback);
        });
      },
      (error: any) =>{
        alert("Login was not successfull " + error);
      }
    );
  }

  synchronize(callback: CallableFunction): Promise<any>{
    const that = this;
    return new Promise(function(resolve,reject){
      that.client.once('sync', (state: any, prevState: any, res:any) =>{
        if (state == "PREPARED") {
          console.log("synced");
          callback();
          resolve({that});
        }
        //TODO: reject(that), if sync failed
      });      
    })
  }

  /* Room Actions */
  getAllRoomsOfLoggedInUser(){
    const rooms = this.client.getRooms();
    let allRooms: MessengerRoom[] = [];
    for (let index = 0; index < rooms.length; index++) {
        const room = rooms[index];
        const roomName: string = room.name;
        const roomId: string = room.roomId;
        allRooms.push(
          {roomName: roomName, roomId: roomId}
        )
    }
    return allRooms;
  }

  getAllUnencryptedRoomsOfLoggedInUser(){

  }

  createRoom(roomName: string){

  }

  inviteUserToRoom(roomId: string, userId: string){

  }

  deleteRoom(roomId: string){

  }

  /* Member Actions */
  getLoggedInUser(){

  }

  getAllMembersOfRoomsOfLoggedInUser(){

  }

  /* Message Actions */

  sendMessageToRoom(roomId: string, messageText: string){

  }

  registerOnMessageListener(callback: CallableFunction){
    //TODO: Implement
    const room: MessengerRoom = {roomName: "",roomId: ""};
    const user: MessengerUser = {userName: "", userId: ""};
    const message = "Hello";
    callback(user, room, message);
  }
}