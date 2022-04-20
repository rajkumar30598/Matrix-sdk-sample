import { Injectable} from '@angular/core';
import { MessengerDirectChat } from './messenger-direct-chat';
import { MessengerMessage } from './messenger-message';
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

    return new Promise(function(resolve,reject){
      that.client.loginWithPassword(username, password).then(
        (loginRes: any) =>{
          return that.client.startClient().then(
            (startRes: any) =>{
              return that.synchronize().then(
                (syncRes)=>{
                  if (syncRes.state == "PREPARED") {
                    if (callback) {
                      callback();
                    }
                    resolve(that.client);
                    that.getAllDmsOfLoggedInUser();
                  }else{
                    reject("Sync Status was not PREPARED");
                  }
                }
              );
            },
            (startErr: any) =>{
              reject(startErr);
            }
          );
        },
        (loginErr: any) =>{
          reject(loginErr);
        }
      );    
    })
  }

  public register(username: string, password: string, callback?:CallableFunction){
    //TODO: Implement
  }

  private synchronize(callback?: CallableFunction): Promise<any>{
    this.checkForValidClient();

    const that = this;
    return new Promise(function(resolve, reject){
      that.client.once('sync', (state: any, prevState: any, res:any) =>{
        resolve({state:state, prevState:prevState, res:res});
        if (callback) {
          callback();
        }
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
          {roomDisplayName: roomName, roomId: roomId}
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

    return new Promise(function(resolve, reject){
      that.client.leave(roomId).then(
        (leaveRes: any)=>{
          that.client.forget(roomId).then(
            (forgetRes: any)=>{
              resolve(forgetRes);
              if(callback) {
                callback();
              }
            },
            (forgetErr: any)=>{
              reject(forgetErr);
            }
          )
        },
        (leaveErr: any)=>{
          reject(leaveErr);
        }
      )  
    })
  }

  /* User Actions */

  public getLoggedInUser(): MessengerUser{
    this.checkForValidClient();

    const name = "My Name"//TODO: Get this correctly
    return {userDisplayName: name, userId: this.client.userName};
  }

  public getAllMembersOfRoom(roomId: String): MessengerUser[]{
    this.checkForValidClient();

    const members: MessengerUser[] = [];

    const room: any = this.client.getRoom(roomId);
    const users: any[] = room.getJoinedMembers();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userName: string = user.name;
      const userId: string = user.userId;
      members.push({userId: userId, userDisplayName: userName});
    }
    return members;
  }

  public getAllMembersOfRoomsOfLoggedInUser(): MessengerUser[]{
    this.checkForValidClient();

    const rooms: any[] = this.client.getRooms();
    let allUsers: MessengerUser[] = [];
    let userNamesByIds: {[key: string]: string} = {};

    //Collecting users in dictionary for eliminating duplicates
    for (let index = 0; index < rooms.length; index++) {
      const room = rooms[index];
      room.loadMembersIfNeeded()
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
      allUsers.push({userDisplayName: username, userId:userId});
    });

    return allUsers;
  }

  public getAllDmsOfLoggedInUser(): MessengerDirectChat[]{
    this.checkForValidClient();

    const directChats: MessengerDirectChat[] = [];

    const dms: any = this.client
      .getAccountData('m.direct')
      ?.getContent();

    if (typeof dms === 'undefined'){
      return directChats;
    } 

    Object.keys(dms).forEach((userId: string) => {
      dms[userId].forEach((roomId: string) => {

        const room: any = this.client.getRoom(roomId);
        if (room) {
          directChats.push({
            user: {userId: userId, userDisplayName: room.getMember(userId).name},
            room: {roomDisplayName:room.name, roomId: roomId}
          });
        }
      });
    });
    return directChats;
  }

  public createDM(userId: string, callback?:CallableFunction):Promise<MessengerDirectChat> {
    this.checkForValidClient();

    const options = {
      is_direct: true,
      invite: [userId],
      visibility: 'private',
      preset: 'trusted_private_chat',
      initial_state: [],
    };
    const that = this;
  
    return new Promise(function(resolve, reject){
      that.client.createRoom(options).then(
        (createRoomRes:any)=>{
          const roomId: string = createRoomRes.room_id;

 

          const directsEvent = that.client.getAccountData('m.direct');
          let userIdToRoomIds: { [key:string] : [value:string] } = {};
          if (typeof directsEvent !== 'undefined'){
            userIdToRoomIds = directsEvent.getContent();
          }
        
          // remove it from the lists of any others users
          // (it can only be a DM room for one person)
          Object.keys(userIdToRoomIds).forEach((thisUserId) => {
            const roomIds = userIdToRoomIds[thisUserId];
            if (thisUserId !== userId) {
              const indexOfRoomId = roomIds.indexOf(roomId);
              if (indexOfRoomId > -1) {
                roomIds.splice(indexOfRoomId, 1);
              }
            }
          });
        
          // now add it, if it's not already there
          const roomIds = userIdToRoomIds[userId] || [];
          if (roomIds.indexOf(roomId) === -1) {
            roomIds.push(roomId);
          }
          userIdToRoomIds[userId] = roomIds;

          that.client.setAccountData('m.direct', userIdToRoomIds).then(
            (setAccRes: any) =>{

              const room: any = that.client.getRoom(roomId);

              const directChat: MessengerDirectChat = {
                room:{
                  roomId: roomId,
                  roomDisplayName: room.name},
                user:{
                  userId: userId,
                  userDisplayName: room.getMember(userId).name
                }
              };

              resolve(directChat);
              if (callback) {
                callback()
              }
            },
            (setAccErr: any) =>{
              reject(setAccErr);
            }
          )
        },
        (createRoomErr:any)=>{
          reject(createRoomErr);
        }
      )
    })

  }

  public sendDM(userId: string, message:string){
    this.checkForValidClient();
    
    const allDms: MessengerDirectChat[] = this.getAllDmsOfLoggedInUser();

    for (let index = 0; index < allDms.length; index++) {
      const dm = allDms[index];
      if (dm.user.userId == userId) {
        this.sendMessageToRoom(dm.room.roomId, message);
        return;
      }
    }

    this.createDM(userId).then(
      (res:any)=>{
        this.sendMessageToRoom(res.room.roomId, message);
      },
      (err:any)=>{
        throw new Error("An Error occured while creating the new DM");
        
      }
    )

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

          const sender: any = room.getMember(event.getSender());
          const senderName: string = sender.name;
          const senderId: string = sender.userId;

          if (room.myUserId == senderId) {
            return;
          }

          const messageText: string = event.getContent().body;
          const roomName: string = room.name;
          const roomId: string = event.getRoomId();

          const date: Date = new Date(event.localTimestamp);

          const message: MessengerMessage = {
            sender: {userDisplayName: senderName, userId: senderId},
            room: {roomDisplayName: roomName, roomId: roomId},
            content: messageText, date: date
          }
          onMessageArrived(message);
        }
    });
  }

  public getAllMessagesFromRoom(roomId: string): MessengerMessage[]{
    this.checkForValidClient();

    const allMessages: MessengerMessage[] = [];
    const room: any = this.client.getRoom(roomId);
    room.timeline.forEach((event: any) => {
        if(event.getType() == "m.room.message" && event.getContent().body != ""){          
          const room = this.client.getRoom(event.getRoomId());
          const sender: any = room.getMember(event.getSender());

          const roomId: string = room.roomId;
          const roomName: string = room.name;

          const senderId: string = sender.userId;
          const senderName: string = sender.name;

          const content: string = event.getContent().body;

          const date: Date = new Date(event.localTimestamp);

          const message: MessengerMessage = {
            sender: {userId: senderId, userDisplayName: senderName},
            room: {roomId: roomId, roomDisplayName: roomName},
            content: content, date: date
          }
          allMessages.push(message);
        }        
    });
    return allMessages;
  }


}