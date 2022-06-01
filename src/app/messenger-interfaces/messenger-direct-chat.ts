import { IMessengerRoom } from "./messenger-room";
import { IMessengerUser } from "./messenger-user";

export interface IMessengerDirectChat {
    user: IMessengerUser;
    room: IMessengerRoom;
}
