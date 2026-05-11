import type { HeadersFunction, MetaFunction } from "react-router";
import { useEffect, useState } from "react";
import { Button, Field, PageShell, PageTitle, VideoGrid } from "~/components/ui";

export const headers: HeadersFunction = () => ({
  title: "Single Player — Peerference",
});

export const meta: MetaFunction = () => {
  return [{ name: "description", content: "Local WebRTC demo — both peers in the same tab" }];
};

const iceServers = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  ],
};

interface Connection {
  mediaStream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

type Step =
  | "media"
  | "peerConnection"
  | "createOffer"
  | "setOffer"
  | "createAnswer"
  | "setAnswer"
  | undefined;


export default () => {
  const [offer, setOffer] = useState("");
  const [answer, setAnswer] = useState("");
  const [step, setStep] = useState<Step>("media");
  const [local, setLocal] = useState<Connection>({});
  const [remote, setRemote] = useState<Connection>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLocal((prev) => ({ ...prev, peerConnection: new RTCPeerConnection(iceServers) }));
    setRemote((prev) => ({ ...prev, peerConnection: new RTCPeerConnection(iceServers) }));
  }, []);

  return (
    <PageShell>
      <PageTitle>Single Player</PageTitle>

      <VideoGrid />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        <StepButton
          label="Get media"
          active={step === "media"}
          onClick={async () => {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { width: { min: 640, ideal: 1920, max: 1920 }, height: { min: 480, ideal: 1080, max: 1080 } },
              audio: false,
            });
            setLocal((prev) => ({ ...prev, mediaStream }));
            const localVideo = document.querySelector("#local-video");
            if (localVideo) (localVideo as HTMLVideoElement).srcObject = mediaStream;
            setStep("peerConnection");
          }}
        />
        <StepButton
          label="Create peer connection"
          active={step === "peerConnection"}
          onClick={async () => {
            const { mediaStream: localMediaStream, peerConnection: localPeerConnection } = local;
            const { peerConnection: remotePeerConnection } = remote;
            if (!localMediaStream || !localPeerConnection || !remotePeerConnection) return;

            localPeerConnection.onicecandidate = (e) => {
              if (e.candidate) remotePeerConnection.addIceCandidate(e.candidate);
            };
            remotePeerConnection.onicecandidate = (e) => {
              if (e.candidate) localPeerConnection.addIceCandidate(e.candidate);
            };
            remotePeerConnection.ontrack = (e) => {
              const remoteVideo = document.querySelector("#remote-video") as HTMLVideoElement | null;
              if (remoteVideo && remoteVideo.srcObject !== e.streams[0]) {
                remoteVideo.srcObject = e.streams[0];
              }
            };
            localMediaStream.getTracks().forEach((track) => {
              localPeerConnection.addTrack(track, localMediaStream);
            });
            setStep("createOffer");
          }}
        />
        <StepButton
          label="Create offer"
          active={step === "createOffer"}
          onClick={async () => {
            const { peerConnection: localPeerConnection } = local;
            if (!localPeerConnection) return;
            const offer = await localPeerConnection.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            setOffer(JSON.stringify(offer));
            setStep("setOffer");
          }}
        />
        <StepButton
          label="Set offer"
          active={step === "setOffer"}
          onClick={async () => {
            const { peerConnection: localPeerConnection } = local;
            const { peerConnection: remotePeerConnection } = remote;
            if (!localPeerConnection || !remotePeerConnection) return;
            const description = JSON.parse(offer);
            await localPeerConnection.setLocalDescription(description);
            await remotePeerConnection.setRemoteDescription(description);
            setStep("createAnswer");
          }}
        />
        <StepButton
          label="Create answer"
          active={step === "createAnswer"}
          onClick={async () => {
            const { peerConnection: remotePeerConnection } = remote;
            if (!remotePeerConnection) return;
            const answer = await remotePeerConnection.createAnswer();
            setAnswer(JSON.stringify(answer));
            setStep("setAnswer");
          }}
        />
        <StepButton
          label="Add answer"
          active={step === "setAnswer"}
          onClick={async () => {
            const { peerConnection: localPeerConnection } = local;
            const { peerConnection: remotePeerConnection } = remote;
            if (!localPeerConnection || !remotePeerConnection) return;
            const description = JSON.parse(answer);
            await localPeerConnection.setRemoteDescription(description);
            await remotePeerConnection.setLocalDescription(description);
            setStep(undefined);
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Offer" id="offer" defaultValue={offer} readOnly disabled />
        <Field label="Answer" id="answer" defaultValue={answer} readOnly disabled />
      </div>
    </PageShell>
  );
};

function StepButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "primary" : "secondary"}
      disabled={!active}
      onClick={onClick}
      style={{ width: "100%", textAlign: "left" }}
    >
      {label}
    </Button>
  );
}
