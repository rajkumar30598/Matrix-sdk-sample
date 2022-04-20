import { MessengerRoom } from "./messenger-room";
import { MessengerUser } from "./messenger-user";

export interface MessengerDirectChat {
    user: MessengerUser;
    room: MessengerRoom;
}
