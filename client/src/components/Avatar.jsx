export default function Avatar({ src, name, online, inCall, size='md' }) {
  const s = size==='sm'?'w-8 h-8 text-xs':size==='lg'?'w-14 h-14 text-xl':size==='xl'?'w-20 h-20 text-3xl':'w-10 h-10 text-sm';
  return (
    <div className="relative flex-shrink-0">
      {src
        ? <img src={src} alt={name} className={`${s} rounded-full object-cover border-2 border-lime-400`}/>
        : <div className={`${s} rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white font-bold`}>
            {name?.charAt(0)?.toUpperCase()}
          </div>
      }
      {inCall && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
        <span className="text-[6px] text-white">📞</span>
      </span>}
      {!inCall && online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-lime-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse-lime"/>}
    </div>
  );
}
