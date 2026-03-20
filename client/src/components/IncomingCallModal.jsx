import { useEffect, useRef } from 'react';
import { FiPhone, FiX, FiVideo } from 'react-icons/fi';
import { playRing, playCallEnd } from '../services/sounds';
import Avatar from './Avatar';

export default function IncomingCallModal({ call, onAccept, onReject }) {
  const ringStop = useRef({});
  useEffect(() => {
    playRing(ringStop.current);
    return () => { ringStop.current.stop?.(); };
  }, []);

  const accept = () => { ringStop.current.stop?.(); onAccept(); };
  const reject = () => { ringStop.current.stop?.(); playCallEnd(); onReject(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 w-80 text-center shadow-2xl animate-slide-up">
        <div className="mb-1">
          <p className="text-xs font-semibold text-lime-500 uppercase tracking-widest mb-4">
            {call.type === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call'}
          </p>
          <div className="flex justify-center mb-3">
            <div className="animate-ring">
              <Avatar src={call.callerAvatar} name={call.callerName} size="xl"/>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{call.callerName}</h3>
          <p className="text-gray-400 text-sm mt-1">is calling you...</p>
        </div>

        {/* Animated sound waves */}
        <div className="flex justify-center gap-1 my-4">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-1 bg-lime-400 rounded-full animate-bounce"
              style={{ height: `${12 + i*6}px`, animationDelay: `${i*0.1}s` }}/>
          ))}
        </div>

        <div className="flex justify-center gap-10 mt-2">
          <button onClick={reject}
            className="flex flex-col items-center gap-1 p-4 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-500 transition shadow-md">
            <FiX size={26}/>
            <span className="text-xs font-medium">Decline</span>
          </button>
          <button onClick={accept}
            className="flex flex-col items-center gap-1 p-4 rounded-full bg-lime-100 dark:bg-lime-900/30 hover:bg-lime-200 text-lime-600 transition shadow-md animate-bounce-soft">
            {call.type === 'video' ? <FiVideo size={26}/> : <FiPhone size={26}/>}
            <span className="text-xs font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
