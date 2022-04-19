import { MessengerRoom } from "./messenger-room";
import { MessengerUser } from "./messenger-user";

export interface MessengerMessage {
    sender: MessengerUser;
    room: MessengerRoom;
    content: String;
    date: Date;
}
