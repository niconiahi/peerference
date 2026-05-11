import { useEffect } from "react";
import type { Route } from "./+types/peer-player";
import { redirect } from "react-router";
import {
  EventSchema,
  type CandidateEvent,
  type Event,
} from "~/utils/peer-connection";
import * as v from "valibot";
import { ICE_SERVERS } from "~/utils/ice_server";
import { Button, PageShell, PageTitle, Toast, VideoGrid } from "~/components/ui";

export function loader({ request, context }: Route.LoaderArgs) {
  context.cloudflare.env.BROADCASTER;
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  const username = url.searchParams.get("username");

  if (!host || !username) {
    const redirect_url = new URL(`${url.origin}/login`);
    redirect_url.searchParams.set("redirectTo", url.toString());
    throw redirect(redirect_url.toString());
  }

  return { host, username };
}

export default function ({ loaderData }: Route.ComponentProps) {
  const { host, username } = loaderData;

  useEffect(() => {
    const peer_connection = new RTCPeerConnection(ICE_SERVERS);
    const url = new URL("/", window.location.href);
    url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("host", host);
    const ws = new WebSocket(url.toString());
    ws.addEventListener("message", async (event) => {
      const events = v.parse(v.array(EventSchema), JSON.parse(event.data));
      const sender = events[0].sender;
      if (sender !== username) {
        if (events.some((event) => event.type === "offer")) {
          const answer = await make_answer(peer_connection, username, events);
          const ice_candidates = await make_ice_candidates(peer_connection);
          ws.send(
            JSON.stringify([
              {
                type: "answer",
                sender: username,
                sessionDescription: JSON.stringify(answer),
              },
              ...ice_candidates.map((candidate) => ({
                type: "candidate",
                candidate: JSON.stringify(candidate),
                sender: username,
              } as CandidateEvent)),
            ] as Event[]),
          );
        }
        if (events.some((event) => event.type === "answer")) {
          await add_answer(username, peer_connection, events);
        }
      }
    });
    ws.addEventListener("open", async () => {
      if (host !== username) {
        const offer = await make_offer(peer_connection);
        const ice_candidates = await make_ice_candidates(peer_connection);
        ws.send(
          JSON.stringify([
            {
              type: "offer",
              sender: username,
              sessionDescription: JSON.stringify(offer),
            },
            ...ice_candidates.map((candidate) => ({
              type: "candidate",
              candidate: JSON.stringify(candidate),
              sender: username,
            } as CandidateEvent)),
          ] as Event[]),
        );
      }
    });

    return () => {
      ws.close();
      peer_connection.close();
    };
  }, [host, username]);

  return (
    <PageShell>
      <PageTitle>Peer Player</PageTitle>

      <VideoGrid username={username} />

      {host === username ? (
        <Button
          type="button"
          style={{ width: "100%" }}
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("username");
            navigator.clipboard.writeText(url.toString());
            show_toast("Invite link copied");
          }}
        >
          Copy invite link
        </Button>
      ) : null}

      <Toast />
    </PageShell>
  );
}

function show_toast(message: string, duration = 2000) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  (toast as HTMLElement).style.display = "block";
  const id = setTimeout(() => {
    (toast as HTMLElement).style.display = "none";
    clearTimeout(id);
  }, duration);
}

async function add_answer(
  username: string,
  peer_connection: RTCPeerConnection,
  events: Event[],
) {
  const answer_event = events.find((event) => event.type === "answer");
  if (!answer_event) throw new Error('"answer" event is required');
  const candidate_events = events.filter((event) => event.type === "candidate");
  await peer_connection.setRemoteDescription(
    JSON.parse(answer_event.sessionDescription),
  );
  candidate_events
    .filter(({ sender }) => sender !== username)
    .forEach(({ candidate }) => {
      peer_connection.addIceCandidate(JSON.parse(candidate));
    });
}

async function make_ice_candidates(
  peer_connection: RTCPeerConnection,
): Promise<RTCIceCandidate[]> {
  const candidates: RTCIceCandidate[] = [];
  return new Promise((resolve) => {
    peer_connection.onicecandidate = (event) => {
      if (event.candidate) {
        candidates.push(event.candidate);
      } else {
        resolve(candidates);
      }
    };
  });
}

async function make_answer(
  peer_connection: RTCPeerConnection,
  username: string,
  events: Event[],
) {
  const offer_event = events.find((event) => event.type === "offer");
  if (!offer_event) throw new Error('"offer" event is required');
  const candidate_events = events.filter((event) => event.type === "candidate");
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { min: 640, ideal: 1920, max: 1920 },
      height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio: false,
  });
  const localVideo = document.querySelector("#local-video");
  if (localVideo) (localVideo as HTMLVideoElement).srcObject = mediaStream;
  for (const track of mediaStream.getTracks()) {
    peer_connection.addTrack(track, mediaStream);
  }
  peer_connection.ontrack = (event) => {
    const remoteVideo = document.querySelector("#remote-video") as HTMLVideoElement | null;
    if (remoteVideo && remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };
  peer_connection.setRemoteDescription(JSON.parse(offer_event.sessionDescription));
  const answer = await peer_connection.createAnswer();
  peer_connection.setLocalDescription(answer);
  candidate_events
    .filter(({ sender }) => sender !== username)
    .forEach(({ candidate }) => {
      peer_connection.addIceCandidate(JSON.parse(candidate));
    });
  return answer;
}

async function make_offer(peer_connection: RTCPeerConnection) {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { min: 640, ideal: 1920, max: 1920 },
      height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio: false,
  });
  const localVideo = document.querySelector("#local-video");
  if (localVideo) (localVideo as HTMLVideoElement).srcObject = mediaStream;
  for (const track of mediaStream.getTracks()) {
    peer_connection.addTrack(track, mediaStream);
  }
  peer_connection.ontrack = (event) => {
    const remoteVideo = document.querySelector("#remote-video") as HTMLVideoElement | null;
    if (remoteVideo && remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };
  const offer = await peer_connection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  });
  peer_connection.setLocalDescription(offer);
  return offer;
}
