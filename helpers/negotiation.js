/* Simple generic WebRTC negotiation pattern.
 * Using "Perfect negotiation" pattern would be ideal but it's not perfect yet:
 * https://bugs.chromium.org/p/chromium/issues/detail?id=980872
 */

export default function setupNegotiation(pc, signaler, isCaller) {
  // Triggered by pc.setLocalDescription()
  pc.onicecandidate = ({ candidate }) => signaler.send({ candidate });
  signaler.on("message", ({ data: { candidate } }) => {
    if (candidate) pc.addIceCandidate(candidate).catch(handleError);
  });

  if (isCaller) {
    // Triggered by pc.addTrack or createDataChannel
    pc.onnegotiationneeded = () => {
      pc.setLocalDescription().then(() => { // Implicitly creates offer
        signaler.send({ description: pc.localDescription });
      }).catch(handleError);
    };
  }

  signaler.on("message", ({ data: { description } }) => {
    if (!description) return;
    pc.setRemoteDescription(description).then(() => {
      if (description.type === "offer") {
        pc.setLocalDescription().then(() => { // Implicitly creates answer
          signaler.send({ description: pc.localDescription });
        });
      }
    }).catch(handleError);
  });
}

function handleError(e) {
  console.error(e);
}
