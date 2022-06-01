import { Injectable} from '@angular/core';
import { environment } from 'src/environments/environment';
import { IMessengerDirectChat } from '../messenger-interfaces/messenger-direct-chat';
import { IMessengerMessage } from '../messenger-interfaces/messenger-message';
import { IMessengerRoom } from '../messenger-interfaces/messenger-room';
import { IMessengerUser } from '../messenger-interfaces/messenger-user';
declare const matrixcs: any;


@Injectable({
  providedIn: 'root'
})
export class MatrixSdkAccessService {

  client: any;
  static ACCESS_TOKEN_SESSION_STORE_LOC = "access_token_loc";

  /* General Actions */

  /**
   * Logs a user into his Matrix-Account by using its username and password.
   * Must be called before all other public methods of service (except register)
   * @param {String} username username (Matrix-ID username) of the user that is logging in
   * @param {String} password password (Matrix-ID password) of the user that is logging in
   * @param {CallableFunction} callback a optional function that is called after a finished login attempt. It has to take one Parameter of the type MessengerUser
   * If the login is successfull the value of this parameter will be a MessengerUser object with the values of the currenctly logged in user
   * If the login fails the value of this parameter will be null
   * @returns {Promise} a promise.
   * If the login is sucessfull the result of the promis will be a MessengerUser object with the values of the currenctly logged in user
   * If the login fails the result of the promise will be the error message 
   */
  public login(username: string, password: string, callback?: (user: IMessengerUser|null) => any): Promise<IMessengerUser>{
    this.client = matrixcs.createClient(environment.matrixServerBaseUrl);

    //Store methods for binding this
    const client: any = this.client;
    const synchronize: Function = this.synchronize.bind(this);
    const getLoggedInUser: Function = this.getAllDmsOfLoggedInUser.bind(this);
    const activateAutoJoin: Function = this.activateAutoJoinRoomWhenInvited.bind(this);

    return new Promise(function(resolve,reject){
      client.loginWithPassword(username, password).then(
        (loginRes: any) =>{
          window.sessionStorage.setItem(MatrixSdkAccessService.ACCESS_TOKEN_SESSION_STORE_LOC, loginRes.access_token);
          return client.startClient().then(
            (startRes: any) =>{
              return synchronize().then(
                (syncRes: any)=>{
                  if (syncRes.state == "PREPARED") {
                    activateAutoJoin();
                    const yourUser: IMessengerUser = getLoggedInUser();
                    if (callback) {
                      callback(yourUser);
                    }
                    resolve(yourUser);
                  }else{
                    if (callback) {
                      callback(null);
                    }
                    reject("Sync Status was not PREPARED");
                  }
                }
              );
            },
            (startErr: string) =>{
              if (callback) {
                callback(null);
              }
              reject(startErr);
            }
          );
        },
        (loginErr: string) =>{
          if (callback) {
            callback(null);
          }
          reject(loginErr);
        }
      );    
    })
  }

  /**
   * Synchronises the matrix-client
   * @param {(param: {state:string, prevState:string})=>any} callback an optional function that will be called after the synchronizing is finished
   * it has to take an argument of type {state:string, prevState:string}
   * @returns {Promise<{state:string, prevState:string}>}promise with the result of type {state:string, prevState:string}
   */
  private synchronize(callback?: (param: {state:string, prevState:string} ) => any ): Promise<{state:string, prevState:string}>{
    this.checkForValidClient();
    const that: MatrixSdkAccessService = this;
    return new Promise(function(resolve, reject){
      that.client.once('sync', (state: any, prevState: any, res:any) =>{

        const result: {state:string, prevState:string} = {
          state:state,
          prevState:prevState
        }
        resolve(result);
        if (callback) {
          callback(result);
        }
      });      
    })
  }

  /**
   * Checks if the client is valid and throws an error, if its not
   */
  private checkForValidClient(): void{
    if (! this.client) {
      throw new Error("You have to login before beeing able to perform actions on the client");
    }
  }

  /* Room Actions */
  
  /**
   * Returns all Rooms of the Logged in User
   * @returns {IMessengerRoom[]} a list of MessengerRoom object filled with the values of all roomes of the currently logged in user
   */
  public getAllRoomsOfLoggedInUser(): IMessengerRoom[]{
    this.checkForValidClient();

    const rooms: any[] = this.client.getRooms();
    let allRooms: IMessengerRoom[] = [];
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

  /**
   * Returns all Rooms of the Logged in User, which dont have end-to-end-encryption enabled
   * @returns {IMessengerRoom[]} a list of MessengerRoom object filled with the values of all unencrypted roomes of the currently logged in user
   */
  public getAllUnencryptedRoomsOfLoggedInUser(): IMessengerRoom[]{
    this.checkForValidClient();

    const allRooms: IMessengerRoom[] = this.getAllRoomsOfLoggedInUser();
    const unencryptedRooms: IMessengerRoom[] = [];
    for (let index = 0; index < allRooms.length; index++) {
      const room: any = allRooms[index];
      const isEncrypted: boolean = this.client.isRoomEncrypted(room.roomId);

      if (! isEncrypted) {
        unencryptedRooms.push(room);
      }
    }
    return unencryptedRooms;
  }

  /**
   * Creates an new Room (a Group or Direct Chat)
   * @param {string} roomName 
   * @param {string} roomDescription 
   * @param {(room:IMessengerRoom|null)=>any} callback an optional Function that is called when the attempt of creating a room is finished. It has to take one parameter of type MessengerRoom
   * if the room was created successfully, the parameters value will be an MessengerRoom object, which is filled with the vaules of the newly created room
   * if the creation of the room failed the parameter will have the value null
   * @returns {Promise<IMessengerRoom>} a promise
   * if the room was created successfully, the result of the promise will be an MessengerRoom object, which is filled with the vaules of the newly created room
   * if the creation of the room failed the result of the promise will be the error message
   */
  public createRoom(roomName: string, roomDescription: string, callback?: (room:IMessengerRoom|null)=>any): Promise<IMessengerRoom>{
    this.checkForValidClient();

    const options: {topic: string, name: string} = {
      topic: roomDescription,
      name: roomName
    }
    const that: MatrixSdkAccessService = this;
    return new Promise(function(resolve,reject){
      that.client.createRoom(options).then(
        (createRoomRes: any) => {
          
          const roomId: string = createRoomRes.room_id;
          const messengerRoom: IMessengerRoom = {
            roomId: roomId,
            roomDisplayName: that.client.getRoom(roomId).name
          };

          if (callback) {
            callback(messengerRoom);
          }
          resolve(messengerRoom);
          
        },
        (err: any) =>{
          if (callback) {
            callback(null);
          }
          reject(err);
        }
      );      
    })
  }

  /**
   * Invites an user to join a room
   * @param {string} userId userId (matrix-user-Id) of the user that will be invited to the room
   * @param {string} roomId roomId of the room that the user will be invited to
   */
  public inviteUserToRoom(userId: string, roomId: string): void{
    this.checkForValidClient();
    this.client.invite(userId, roomId);
  }

  /**
   * Deletes an room
   * @param {string} roomId id of the room to delete
   * @param {(deletedRoom:IMessengerRoom|null)=>any} callback optional function that will be called after the finished attempt of deleting the room. It has to take one parameter of type MessengerRoom.
   * if the room is successfully deleted the parameters value will be an MessengerRoom object filled with the values of the room that has been deleted
   * if the room could not be deleted the parameters value will be null
   * @returns 
   */
  public deleteRoom(roomId: string, callback?: (deltedRoom:IMessengerRoom|null)=>any): Promise<IMessengerRoom>{
    this.checkForValidClient();

    const that: MatrixSdkAccessService = this;

    const room: any = this.client.getRoom(roomId);
    if (!room) {
      return new Promise(function(resolve, reject){
        reject("Room can not be delete because it was not found");
      })
    }
    const forgottenRoom: IMessengerRoom = {
      roomId: roomId,
      roomDisplayName: room.name
    }

    return new Promise(function(resolve, reject){
      that.client.leave(roomId).then(
        (leaveRes: any)=>{
          that.client.forget(roomId).then(
            (forgetRes: {})=>{
              
              resolve(forgottenRoom);
              if(callback) {
                callback(forgottenRoom);
              }
            },
            (forgetErr: any)=>{
              if(callback) {
                callback(null);
              }
              reject(forgetErr);
            }
          )
        },
        (leaveErr: any)=>{
          if(callback) {
            callback(null);
          }
          reject(leaveErr);
        }
      )  
    })
  }

  /* User Actions */

  /**
   * Get the user that is currently logged in
   * @returns {IMessengerUser} a MessengerUser object filled with the values of the currently logged in user
   */
  public getLoggedInUser(): IMessengerUser{
    this.checkForValidClient();

    const userId: string = this.client.getUserId();
    const displayName: string= this.client.getUser(this.client.getUserId()).displayName;
    console.log()
    return {
      userDisplayName: displayName,
      userId: userId
    };
  }

  /**
   * Gets all Members of an Room
   * @param {String} roomId id of the room, which members sould be returned
   * @returns {IMessengerUser[]} a List of MessengerUser object filled with the values of the users in the room
   */
  public getAllMembersOfRoom(roomId: String): IMessengerUser[]{
    this.checkForValidClient();

    const members: IMessengerUser[] = [];

    const room: any = this.client.getRoom(roomId);
    const users: any[] = room.getJoinedMembers();

    for (let i = 0; i < users.length; i++) {
      const user: any = users[i];
      const userName: string = user.name;
      const userId: string = user.userId;
      members.push({userId: userId, userDisplayName: userName});
    }
    return members;
  }

  /**
   * Returns all members of all rooms of the currently logged in user
   * @returns {IMessengerUser[]} a list of MessengerUser-Objects filled with the values of the users in the rooms
   */
  public getAllMembersOfRoomsOfLoggedInUser(): IMessengerUser[]{
    this.checkForValidClient();

    const rooms: any[] = this.client.getRooms();
    let allUsers: IMessengerUser[] = [];
    let userNamesByIds: {[key: string]: string} = {};

    //Collecting users in dictionary for eliminating duplicates
    for (let index = 0; index < rooms.length; index++) {
      const room: any = rooms[index];
      room.loadMembersIfNeeded()
      const users: any[] = room.getJoinedMembers();
      for (let j = 0; j < users.length; j++) {
          const user: any = users[j];
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

  /* Message Actions */

  /**
   * Sends a text-message into an room
   * @param {string} roomId id of the room which should receive the message 
   * @param {string} messageText text of the message that should be send
   */
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

  /**
   * Registers a method, which is executed every time a text-message arrives
   * @param {(msg:IMessengerMessage)=>any} onMessageArrived a method that is executed every time a text-message arrives
   * Has to take one parameter of type MessengerMessage, which will contain information about the arrived message
   */
  public registerOnMessageListener(onMessageArrived: (msg:IMessengerMessage)=>any): void{
    this.checkForValidClient();

    this.client.on("Room.timeline", function(event:any, room:any, toStartOfTimeline:any) {
      console.log("EVENT OCCURED" + event);
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

          const message: IMessengerMessage = {
            sender: {userDisplayName: senderName, userId: senderId},
            room: {roomDisplayName: roomName, roomId: roomId},
            content: messageText, date: date
          }
          onMessageArrived(message);
        }
    });
  }

  /**
   * Registers a method, which is executed every time you join a room
   * @param onRoomJoined a method that is executed every time the user is added to a group
   * Has to take one parameter of type MessengerRoom, which will contain information about the room that you have joined.
   */
  public registerOnRoomJoinedListener(onRoomJoined: (room:IMessengerRoom)=>any):void{
    this.checkForValidClient();

    const that: MatrixSdkAccessService = this;
    const myUserId = this.getLoggedInUser().userId;

    this.client.on("RoomMember.membership", function(event: any, member: any) {
      if (member.membership === "join" && member.userId === myUserId) {
        const roomId = member.roomId;
        const roomName = that.client.getRoom(roomId).name;
        const room: IMessengerRoom = {
          roomDisplayName: roomName,
          roomId: roomId
        };
        onRoomJoined(room);
      }
    });
  }

  /**
   * Enables the functionallity of automatically joining a room when you are invited
   */
  private activateAutoJoinRoomWhenInvited(): void{
    this.checkForValidClient();

    const that: MatrixSdkAccessService = this;
    const myUserId = this.getLoggedInUser().userId;

    this.client.on("RoomMember.membership", function(event: any, member: any) {
      if (member.membership === "invite" && member.userId === myUserId) {
        that.client.joinRoom(member.roomId);
      }
    });
  }

  /**
   * Gets all Messages from a room
   * @param {string} roomId id of the room
   * @returns {IMessengerMessage[]} a list of all messages that have been sent to the room
   */
  public getAllMessagesFromRoom(roomId: string): IMessengerMessage[]{
    this.checkForValidClient();

    const allMessages: IMessengerMessage[] = [];
    const room: any = this.client.getRoom(roomId);
    room.timeline.forEach((event: any) => {
        if(event.getType() == "m.room.message" && event.getContent().body != ""){          
          const room: any = this.client.getRoom(event.getRoomId());
          const sender: any = room.getMember(event.getSender());

          const roomId: string = room.roomId;
          const roomName: string = room.name;

          const senderId: string = sender.userId;
          const senderName: string = sender.name;

          const content: string = event.getContent().body;

          const date: Date = new Date(event.localTimestamp);

          const message: IMessengerMessage = {
            sender: {userId: senderId, userDisplayName: senderName},
            room: {roomId: roomId, roomDisplayName: roomName},
            content: content, date: date
          }
          allMessages.push(message);
        }        
    });
    return allMessages;
  }

  /* Direct Chat Actions */

  /**
   * Gets all Direct-Chats of the logged in user
   * @returns {IMessengerDirectChat[]} a list of all the direct chat that the user has had
   */
  public getAllDmsOfLoggedInUser(): IMessengerDirectChat[]{
    this.checkForValidClient();

    const directChats: IMessengerDirectChat[] = [];

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

  /**
   * Creates a new direct-chat
   * @param {string} userId user id (matrix-ID) of the user with whom a direct chat should be created
   * @param {(directChat:IMessengerDirectChat|null)=>any} callback optional method that will be called after an attempt to create a new direct chat is finished
   * Has to take one parameter of type MessengerDirectChat
   * If the creation of the Direct Chat was successfull the parameter will have the values of the newly created direct chat
   * If the creation of the Direct Chat failed, parameter will be null
   * @returns {Promise<IMessengerDirectChat>} a promise
   * If the creation of the Direct Chat was successfull the result of the promise will be an MessengerDirectChat-Object with the values of the newly created direct chat
   * If the creation of the Direct Chat failed, the result of the promise will be the error message
   */
  private createDM(userId: string, callback?: (directChat:IMessengerDirectChat|null)=>any): Promise<IMessengerDirectChat> {
    this.checkForValidClient();

    const options = {
      is_direct: true,
      invite: [userId],
      visibility: 'private',
      preset: 'trusted_private_chat',
      initial_state: [],
    };
    const that: MatrixSdkAccessService = this;
  
    return new Promise(function(resolve, reject){
      that.client.createRoom(options).then(
        (createRoomRes:any)=>{
          const roomId: string = createRoomRes.room_id;

          const directsEvent: any = that.client.getAccountData('m.direct');
          let userIdToRoomIds: { [key:string] : string[] } = {};
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
          const roomIds: string[] = userIdToRoomIds[userId] || [];
          if (roomIds.indexOf(roomId) === -1) {
            roomIds.push(roomId);
          }
          userIdToRoomIds[userId] = roomIds;

          that.client.setAccountData('m.direct', userIdToRoomIds).then(
            (setAccRes: any) =>{

              const room: any = that.client.getRoom(roomId);

              const directChat: IMessengerDirectChat = {
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
                callback(directChat)
              }
            },
            (setAccErr: any) =>{
              reject(setAccErr);
              if (callback) {
                callback(null);
              }
            }
          )
        },
        (createRoomErr:any)=>{
          reject(createRoomErr);
          if (callback) {
            callback(null);
          }
        }
      )
    })

  }

  /**
   * Sends a direct-message to an user. Creates an new direct-chat, if necessary.
   * @param {string} userId user id (Matrix-ID) of the receiving user
   * @param {string} message text of the message
   */
  public sendDM(userId: string, message:string):void{
    this.checkForValidClient();

    const allDms: IMessengerDirectChat[] = this.getAllDmsOfLoggedInUser();

    for (let index = 0; index < allDms.length; index++) {
      const dm: IMessengerDirectChat = allDms[index];
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

  /**
   * Gets all messages that the given user has sent with the logged in user
   * @param {string} userId  user id (Matrix-ID) of the user whos direct-chat-messages should be returned
   * @returns {IMessengerMessage[]} a list of MessengerMessage objects with the values of the messages of the direct-chat
   */
  public getAllMessagesFromUser(userId: string): IMessengerMessage[]{

    const allDms: IMessengerDirectChat[] = this.getAllDmsOfLoggedInUser();
    
    for (let index = 0; index < allDms.length; index++) {
      const dm: IMessengerDirectChat = allDms[index];
      if (dm.user.userId == userId) {
        return this.getAllMessagesFromRoom(dm.room.roomId);
      }
    }
    return [];    
  }

  public changePassword(username: string, oldPassword: string, newPassword: string): void {

    const authDict = {
        type: 'm.login.password',
        identifier: {
            type: 'm.id.user',
            user: username,
        },
        password: oldPassword,
    };

    this.client.setPassword(authDict, newPassword).then(
      (res: any) =>{
        console.log("Change Password res ", res);
      },
      (err: any) =>{
        console.log("Change Password err ", err);
      }
    )
  }

}