import { io, Socket } from "socket.io-client";
import env from "@/config/env";

const SIGNALING_SERVER_URL = env.SignalingURL();

export class WebRTCClient {
  private pc: RTCPeerConnection;
  private socket: Socket;
  private room: string;
  private isCaller: boolean;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream = new MediaStream();
  private started = false;

  constructor(room: string, isCaller: boolean) {
    this.room = room;
    this.isCaller = isCaller;
    this.socket = io(SIGNALING_SERVER_URL);
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("ice-candidate", {
          room: this.room,
          candidate: event.candidate,
        });
      }
    };

    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });
    };

    this.socket.on("offer", async ({ offer }) => {
      if (!this.started) return;
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.socket.emit("answer", { room: this.room, answer });
    });

    this.socket.on("answer", async ({ answer }) => {
      if (!this.started) return;
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    this.socket.on("ice-candidate", async ({ candidate }) => {
      if (!this.started) return;
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        console.error("Error adding received ice candidate", err);
      }
    });

    this.socket.on("peer-joined", () => {
      if (this.isCaller) {
        this.makeOffer();
      }
    });

    this.socket.emit("join", { room: this.room });
  }

  async start() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    this.localStream.getTracks().forEach((track) => {
      this.pc.addTrack(track, this.localStream!);
    });
    this.started = true;
    if (this.isCaller) {
      this.makeOffer();
    }
    return { localStream: this.localStream, remoteStream: this.remoteStream };
  }

  private async makeOffer() {
    if (this.pc.signalingState !== "stable") return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.socket.emit("offer", { room: this.room, offer });
  }
}
