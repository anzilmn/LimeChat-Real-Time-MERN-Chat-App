import { useEffect, useRef, useState } from 'react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhone } from 'react-icons/fi';
import { getSocket } from '../services/socket';
import { playCallEnd, playRing } from '../services/sounds';
import useCallStore from '../store/callStore';
import useAuthStore from '../store/authStore';
import Avatar from './Avatar';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export default function CallScreen() {
  const { activeCall, incomingCall, callDuration, setCallStatus, endCall, clearIncoming } = useCallStore();
  const { user } = useAuthStore();
  const socket = getSocket();

  const localRef  = useRef(null);
  const remoteRef = useRef(null);
  const peerRef   = useRef(null);
  const streamRef = useRef(null);
  const ringStop  = useRef({});

  const [muted,    setMuted]    = useState(false);
  const [camOff,   setCamOff]   = useState(false);
  const [status,   setStatus]   = useState('connecting');
  const [remoteStream, setRemoteStream] = useState(false);

  const isVideo   = (activeCall || incomingCall)?.type === 'video';
  const peerId    = activeCall?.peerId || incomingCall?.from;
  const callLogId = activeCall?.callLogId || incomingCall?.callLogId;
  const peerName  = activeCall?.callerName || incomingCall?.callerName || 'Caller';
  const isCallee  = !!incomingCall && !activeCall; // are we answering?

  // ── Format duration ──────────────────────────────────────
  const fmt = (s) => {
    const m = Math.floor(s/60); const sec = s%60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  // ── Init peer connection ──────────────────────────────────
  const initPeer = (stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = (e) => {
      if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
      setRemoteStream(true);
      setStatus('connected');
      setCallStatus('connected');
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) socket?.emit('call:ice-candidate', { to: peerId, candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (['disconnected','failed','closed'].includes(pc.connectionState)) handleEnd(false);
    };
    return pc;
  };

  // ── Start call (caller side) ──────────────────────────────
  const startCall = async () => {
    setStatus('ringing');
    playRing(ringStop.current);
    try {
      const constraints = isVideo ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;
      const pc = initPeer(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.emit('call:offer', { to: peerId, offer });
    } catch { setStatus('error'); }
  };

  // ── Answer call (callee side) ─────────────────────────────
  const answerCall = async () => {
    ringStop.current.stop?.();
    setStatus('connecting');
    try {
      const constraints = isVideo ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;
      const pc = initPeer(stream);
      // Wait for offer from caller (already emitted before accept)
      socket?.once('call:offer', async ({ offer }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', { to: peerId, answer });
      });
      socket?.emit('call:accept', { to: peerId, callLogId });
      clearIncoming();
    } catch { setStatus('error'); }
  };

  // ── Socket listeners ─────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('call:accepted', () => {
      ringStop.current.stop?.();
      setStatus('connecting');
    });
    socket.on('call:rejected', () => {
      ringStop.current.stop?.();
      playCallEnd();
      setStatus('rejected');
      setTimeout(() => endCall('rejected'), 2000);
    });
    socket.on('call:timeout', () => {
      ringStop.current.stop?.();
      setStatus('timeout');
      setTimeout(() => endCall('timeout'), 2000);
    });
    socket.on('call:ended', ({ duration }) => {
      playCallEnd();
      setStatus('ended');
      streamRef.current?.getTracks().forEach(t => t.stop());
      peerRef.current?.close();
      setTimeout(() => endCall('completed'), 1500);
    });
    socket.on('call:offer', async ({ offer }) => {
      if (!isCallee || !peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit('call:answer', { to: peerId, answer });
    });
    socket.on('call:answer', async ({ answer }) => {
      if (peerRef.current) await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on('call:ice-candidate', async ({ candidate }) => {
      if (peerRef.current && candidate)
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    if (!isCallee) startCall();
    else answerCall();

    return () => {
      ['call:accepted','call:rejected','call:timeout','call:ended','call:offer','call:answer','call:ice-candidate']
        .forEach(e => socket.off(e));
    };
  }, []);

  // ── End call (user initiated) ─────────────────────────────
  const handleEnd = (emit = true) => {
    ringStop.current.stop?.();
    playCallEnd();
    streamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    if (emit && socket) socket.emit('call:end', { to: peerId, callLogId, duration: callDuration });
    endCall('completed');
  };

  const toggleMute  = () => { streamRef.current?.getAudioTracks().forEach(t => t.enabled = !t.enabled); setMuted(m => !m); };
  const toggleCam   = () => { streamRef.current?.getVideoTracks().forEach(t => t.enabled = !t.enabled); setCamOff(c => !c); };

  // ─── Status display ───────────────────────────────────────
  const statusLabel = {
    ringing:   '📲 Ringing...',
    connecting:'⏳ Connecting...',
    connected: '🟢 Connected · ' + fmt(callDuration),
    rejected:  '❌ Call Declined',
    timeout:   '⏱ No Answer',
    ended:     '📴 Call Ended',
    error:     '⚠️ Connection Error'
  }[status] || status;

  return (
    <div className="fixed inset-0 z-[90] bg-gray-900 flex flex-col select-none">
      {/* Remote / background */}
      {isVideo ? (
        <video ref={remoteRef} autoPlay playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: remoteStream ? 'block' : 'none' }}/>
      ) : null}

      {/* Dark overlay or avatar for voice call */}
      {(!isVideo || !remoteStream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="animate-ring mb-6">
            <Avatar name={peerName} size="xl"/>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{peerName}</h2>
          <p className="text-lime-400 text-sm font-medium">{statusLabel}</p>
          {isVideo && !remoteStream && status === 'connected' && (
            <p className="text-gray-400 text-xs mt-2">Waiting for video...</p>
          )}
        </div>
      )}

      {/* Remote status overlay for video */}
      {isVideo && remoteStream && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-1.5 rounded-full z-10">
          {peerName} · {statusLabel}
        </div>
      )}

      {/* Local video (PiP) */}
      {isVideo && (
        <video ref={localRef} autoPlay playsInline muted
          className="absolute top-4 right-4 w-32 h-44 object-cover rounded-2xl border-2 border-lime-400 shadow-2xl z-20"
          style={{ transform: 'scaleX(-1)' }}/>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 pb-10 pt-6 bg-gradient-to-t from-black/70 to-transparent z-30">
        <button onClick={toggleMute}
          className={`flex flex-col items-center gap-1 p-4 rounded-full transition shadow-lg ${muted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
          {muted ? <FiMicOff size={22}/> : <FiMic size={22}/>}
          <span className="text-xs">{muted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button onClick={() => handleEnd(true)}
          className="flex flex-col items-center gap-1 p-5 rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-2xl">
          <FiPhone size={28} className="rotate-[135deg]"/>
          <span className="text-xs">End</span>
        </button>

        {isVideo && (
          <button onClick={toggleCam}
            className={`flex flex-col items-center gap-1 p-4 rounded-full transition shadow-lg ${camOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
            {camOff ? <FiVideoOff size={22}/> : <FiVideo size={22}/>}
            <span className="text-xs">{camOff ? 'Show' : 'Hide'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
