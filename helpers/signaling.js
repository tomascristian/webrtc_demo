/* This is just a wrapper over scaledron.com messaging service.
 * It returns an object with a typical signaling API for sending and
 * listening to messages.
 */

const SCALEDRONE_API_KEY = "abeFaNyfIb2E6CUM";

export default async function createSignalingChannel(channelName) {
  const roomIdentifier = "observable-" + channelName;
  const drone = await openDrone();
  const { room, members } = await openRoom(drone, roomIdentifier);
  const signaler = {
    userCount: members.length,
    send(message) {
      drone.publish({
        room: roomIdentifier,
        message
      });
    },
    on(event, handler) {
      room.on(event, (message) => {
        // Ignore your own messages
        if (message.clientId === drone.clientId) return;
        handler(message);
      });
    },
  };
  return signaler;

  function openDrone() {
    return new Promise((resolve, reject) => {
      const channel = new ScaleDrone(SCALEDRONE_API_KEY);
      channel.on("open", error => {
        if (error) reject(error);
        resolve(channel);
      });
    });
  }

  function openRoom(drone, roomName) {
    return new Promise((resolve, reject) => {
      const room = drone.subscribe(roomName);
      room.on("open", error => {
        if (error) reject(error);
      });
      room.on("members", members => {
        resolve({ room, members });
      });
    });
  }
}
