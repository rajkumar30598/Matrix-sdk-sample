import { IMessengerRoom } from "./messenger-room";
import { IMessengerUser } from "./messenger-user";

export interface IMessengerMessage {
    sender: IMessengerUser;
    room: IMessengerRoom;
    content: String;
    date: Date;
}
