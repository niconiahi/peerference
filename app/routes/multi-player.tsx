import { useRef, useState } from "react";
import invariant from "tiny-invariant";
import { redirect } from "react-router";
import * as v from "valibot";
import type { Route } from "./+types/multi-player";

import type {
  AnswerEvent,
  CandidateEvent,
  Event,
  OfferEvent,
} from "~/utils/peer-connection";
import {
  AnswerEventSchema,
  CandidateEventSchema,
  EventSchema,
  OfferEventSchema,
} from "~/utils/peer-connection";
import { ICE_SERVERS } from "~/utils/ice_server";
import {
  ACCENT,
  Button,
  Field,
  PageShell,
  PageTitle,
  VideoGrid,
  eventColors,
} from "~/components/ui";

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");

  if (!username) {
    const redirect_url = new URL(`${url.origin}/login`);
    redirect_url.searchParams.set("redirectTo", url.toString());
    throw redirect(redirect_url.toString());
  }

  return { username };
}

export default ({ loaderData }: Route.ComponentProps) => {
  const { username } = loaderData;
  const eventRef = useRef<HTMLTextAreaElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | undefined>(undefined);

  const _candidateEvents = v.safeParse(
    v.array(CandidateEventSchema),
    events.filter((e) => e.type === "candidate"),
  );
  const candidateEvents = _candidateEvents.success ? _candidateEvents.output : [];

  const _answerEvent = v.safeParse(AnswerEventSchema, events.find((e) => e.type === "answer"));
  const answerEvent = _answerEvent.success ? _answerEvent.output : undefined;

  const _offerEvent = v.safeParse(OfferEventSchema, events.find((e) => e.type === "offer"));
  const offerEvent = _offerEvent.success ? _offerEvent.output : undefined;

  return (
    <PageShell>
      <PageTitle>Multi Player</PageTitle>

      <VideoGrid username={username} />

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <Button
          type="button"
          disabled={offerEvent !== undefined}
          style={{ flex: 1 }}
          onClick={async () => {
            const pc = new RTCPeerConnection(ICE_SERVERS);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { min: 640, ideal: 1920, max: 1920 }, height: { min: 480, ideal: 1080, max: 1080 } },
              audio: false,
            });
            const localVideo = document.querySelector("#local-video");
            if (localVideo) (localVideo as HTMLVideoElement).srcObject = mediaStream;
            for (const track of mediaStream.getTracks()) pc.addTrack(track, mediaStream);

            pc.onicecandidate = (e) => {
              if (e.candidate) {
                setEvents((prev) => [...prev, { candidate: JSON.stringify(e.candidate), sender: username, type: "candidate" } as CandidateEvent]);
              }
            };
            pc.ontrack = (e) => {
              const v = document.querySelector("#remote-video") as HTMLVideoElement | null;
              if (v && v.srcObject !== e.streams[0]) v.srcObject = e.streams[0];
            };

            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            pc.setLocalDescription(offer);
            setPeerConnection(pc);
            setEvents((prev) => [...prev, { type: "offer", sender: username, sessionDescription: JSON.stringify(offer) } as OfferEvent]);
          }}
        >
          Create offer
        </Button>

        <Button
          type="button"
          variant="secondary"
          style={{ flex: 1 }}
          disabled={offerEvent === undefined || username === offerEvent.sender}
          onClick={async () => {
            invariant(offerEvent, '"offer" is required to create an answer');
            const pc = new RTCPeerConnection(ICE_SERVERS);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { min: 640, ideal: 1920, max: 1920 }, height: { min: 480, ideal: 1080, max: 1080 } },
              audio: false,
            });
            const localVideo = document.querySelector("#local-video");
            if (localVideo) (localVideo as HTMLVideoElement).srcObject = mediaStream;
            for (const track of mediaStream.getTracks()) pc.addTrack(track, mediaStream);

            pc.onicecandidate = (e) => {
              if (e.candidate) {
                setEvents((prev) => [...prev, { candidate: JSON.stringify(e.candidate), sender: username, type: "candidate" } as CandidateEvent]);
              }
            };
            pc.ontrack = (e) => {
              const v = document.querySelector("#remote-video") as HTMLVideoElement | null;
              if (v && v.srcObject !== e.streams[0]) v.srcObject = e.streams[0];
            };

            pc.setRemoteDescription(JSON.parse(offerEvent.sessionDescription));
            const answer = await pc.createAnswer();
            pc.setLocalDescription(answer);
            candidateEvents.filter(({ sender }) => sender !== username).forEach(({ candidate }) => {
              pc.addIceCandidate(JSON.parse(candidate));
            });
            setPeerConnection(pc);
            setEvents((prev) => [...prev, { type: "answer", sender: username, sessionDescription: JSON.stringify(answer) } as AnswerEvent]);
          }}
        >
          Create answer
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={
            offerEvent === undefined ||
            answerEvent === undefined ||
            answerEvent.sender === username ||
            peerConnection === undefined ||
            candidateEvents.length < 2
          }
          onClick={async () => {
            invariant(offerEvent, '"offerEvent" is required to add the answer');
            invariant(answerEvent, '"answerEvent" is required to add the answer');
            invariant(peerConnection, '"peerConnection" is required to add the answer');
            await peerConnection.setLocalDescription(JSON.parse(offerEvent.sessionDescription));
            await peerConnection.setRemoteDescription(JSON.parse(answerEvent.sessionDescription));
            candidateEvents.filter(({ sender }) => sender !== username).forEach(({ candidate }) => {
              peerConnection.addIceCandidate(JSON.parse(candidate));
            });
          }}
        >
          Add answer
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Field label="Offer" id="offer" defaultValue={offerEvent?.sessionDescription ?? ""} readOnly disabled />
        <Field label="Answer" id="answer" defaultValue={answerEvent?.sessionDescription ?? ""} readOnly disabled />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Field
            label="Paste event"
            id="event"
            placeholder="Paste copied event here"
            textareaRef={eventRef}
            rows={2}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const textarea = eventRef.current;
              if (!textarea) return;
              const isArray = Array.isArray(JSON.parse(textarea.value));
              const parsed = v.safeParse(
                v.array(EventSchema),
                isArray ? JSON.parse(textarea.value) : [JSON.parse(textarea.value)],
              );
              if (!parsed.success) { console.error(parsed.issues); return; }
              setEvents((prev) => [...prev, ...parsed.output]);
              textarea.value = "";
            }}
          >
            Add event
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        style={{ width: "100%", marginBottom: 16 }}
        onClick={() => {
          const emitted = events.filter((e) => e.sender === username);
          navigator.clipboard.writeText(JSON.stringify(emitted));
        }}
      >
        Copy your events for the peer
      </Button>

      <ol style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {events.map((event, index) => {
          const colors = eventColors(event.type);
          const id = `event-${event.type}-${index}`;
          return (
            <li
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              <span style={{ fontWeight: 700, color: colors.text, minWidth: 20 }}>{index}</span>
              <span style={{ flex: 1, color: colors.text }}>
                <b>{event.type}</b> — sent by {event.sender}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(event))}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: colors.text,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <title>Copy</title>
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>
            </li>
          );
        })}
      </ol>
    </PageShell>
  );
};
