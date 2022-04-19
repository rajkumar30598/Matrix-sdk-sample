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

  /* General Actions */
  public login(username: string, password: string, callback?: CallableFunction): Promise<any>{
    this.client = matrixcs.createClient(MatrixSdkAccessService.BASE_URL);
    const that = this;

    return this.client.loginWithPassword(username, password).then(
      (value: any) =>{
        return that.client.startClient().then(
          (value: any) =>{
            return that.synchronize(callback);
          },
          (error: any) =>{
            return error;
          }
        );
      },
      (error: any) =>{
        alert("Login was not successfull " + error);
        return error;
      }
    );
  }

  public synchronize(callback?: CallableFunction): Promise<any>{
    this.checkForValidClient();

    const that = this;
    return new Promise(function(resolve,reject){
      that.client.once('sync', (state: any, prevState: any, res:any) =>{
        if (state == "PREPARED") {
          if (callback) {
            callback();
          }          
          resolve({that});
        }
        //TODO: reject(that), if sync failed
      });      
    })
  }

  private checkForValidClient(): void{
    if (! this.client) {
      throw new Error("You have to login before beeing able to perform actions on the client");
    }
  }

  /* Room Actions */

  public getAllRoomsOfLoggedInUser(): MessengerRoom[]{
    this.checkForValidClient();

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

  public getAllUnencryptedRoomsOfLoggedInUser(): MessengerRoom[]{
    this.checkForValidClient();

    const allRooms: MessengerRoom[] = this.getAllRoomsOfLoggedInUser();
    const unencryptedRooms: MessengerRoom[] = [];
    for (let index = 0; index < allRooms.length; index++) {
      const room = allRooms[index];
      const isEncrypted: boolean = this.client.isRoomEncrypted(room.roomId);

      if (! isEncrypted) {
        unencryptedRooms.push(room);
      }
    }
    return unencryptedRooms;
  }

  public createRoom(roomName: string, roomDescription: string, callback?: CallableFunction): Promise<any>{
    this.checkForValidClient();

    const options = {
      topic: roomDescription,
      name: roomName
    }
    const that = this;
    return new Promise(function(resolve,reject){
      that.client.createRoom(options).then(
        (res: any) => {
          if (callback) {
            callback();
          }
          resolve(res);
        },
        (err: any) =>{
          reject(err);
        }
      );      
    })
  }

  public inviteUserToRoom(userId: string, roomId: string): void{
    this.checkForValidClient();
    this.client.invite(userId, roomId);
  }

  public deleteRoom(roomId: string, callback?: CallableFunction): Promise<any>{
    this.checkForValidClient();

    const that = this;

    return new Promise(function(resolve,reject){
      that.client.leave(roomId, function(){
        that.client.forget(roomId, true);
        if (callback) {
          callback();
        }
        resolve(roomId);
      });     
    })
  }

  /* Member Actions */

  public getLoggedInUser(): MessengerUser{
    this.checkForValidClient();

    const name = "My Name"//TODO: Get this correctly
    return {userName: name, userId: this.client.userName};
  }

  public getAllMembersOfRoomsOfLoggedInUser(): MessengerUser[]{
    this.checkForValidClient();

    const rooms: any[] = this.client.getAllRoomsOfLoggedInUser();
    let allUsers: MessengerUser[] = [];
    let userNamesByIds: {[key: string]: string} = {};

    //Collecting users in dictionary for eliminating duplicates
    for (let index = 0; index < rooms.length; index++) {
      const room = rooms[index];
      const users = room.getJoinedMembers();
      for (let j = 0; j < users.length; j++) {
          const user = users[j];
          const userName: string = user.name;
          const userId: string = user.userId;
          userNamesByIds[userId] = userName;
      }
    }

    //Pushing Users from dictionary into list
    Object.keys(userNamesByIds).forEach(function(userId) {
      const username: string = userNamesByIds[userId];
      allUsers.push({userName: username, userId:userId});
    });

    return allUsers;
  }

  /* Message Actions */

  public sendMessageToRoom(roomId: string, messageText: string): void{
    this.checkForValidClient();

    this.client.sendMessage(
      roomId,
      {
          body: messageText,
          msgtype: 'm.text',
      }
    );
  }

  public registerOnMessageListener(onMessageArrived: CallableFunction): void{
    this.checkForValidClient();
    
    this.client.on("Room.timeline", function(event:any, room:any, toStartOfTimeline:any) {
      if (event.getType() == "m.room.message" && event.getContent().body != "") {
          const message: string = event.getContent().body;
          const roomName: string = room.name;
          const roomId: string = event.getRoomId();

          const sender: any = room.getMember(event.getSender());
          const senderName: string = sender.name;
          const senderId: string = sender.userId;

          onMessageArrived(
            {userName: senderName, userId: senderId},
            {roomName: roomName, roomId: roomId},
            message
          );
        }
    });
  }


}