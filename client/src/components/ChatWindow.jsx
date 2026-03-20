import { useState, useEffect, useRef } from 'react';
import { FiSend, FiPaperclip, FiImage, FiSmile, FiMoreVertical,
         FiEdit2, FiTrash2, FiShare2, FiX, FiMic, FiVideo, FiPhone,
         FiImage as FiWallpaper, FiAlertTriangle } from 'react-icons/fi';
import { BsCheck, BsCheckAll } from 'react-icons/bs';
import EmojiPicker from 'emoji-picker-react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useCallStore from '../store/callStore';
import { getSocket } from '../services/socket';
import { format } from 'date-fns';
import { playNotif } from '../services/sounds';
import WallpaperPicker from './WallpaperPicker';
import ReportModal from './ReportModal';
import Avatar from './Avatar';

export default function ChatWindow({ onStartCall }) {
  const {
    selectedUser, selectedGroup, messages,
    fetchMessages, fetchGroupMessages,
    sendMessage, sendGroupMessage, editMessage, deleteMessage, clearChat,
    addIncomingMessage, updateMessageStatus, setTyping, typingUsers,
    onlineUsers, inCallUsers, wallpapers
  } = useChatStore();
  const { user } = useAuthStore();
  const { activeCall } = useCallStore();

  const [text, setText]               = useState('');
  const [showEmoji, setShowEmoji]     = useState(false);
  const [file, setFile]               = useState(null);
  const [editingMsg, setEditingMsg]   = useState(null);
  const [replyTo, setReplyTo]         = useState(null);
  const [ctxMenu, setCtxMenu]         = useState(null);
  const [showClear, setShowClear]     = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showReport, setShowReport]   = useState(false);
  const [showMenu, setShowMenu]       = useState(false);
  const [recording, setRecording]     = useState(false);
  const [mrec, setMrec]               = useState(null);

  const endRef   = useRef(null);
  const fileRef  = useRef(null);
  const imgRef   = useRef(null);
  const typTimer = useRef(null);
  const socket   = getSocket();

  const chatId  = selectedUser?._id || selectedGroup?._id;
  const isGroup = !!selectedGroup;
  const wallpaper = chatId ? wallpapers[chatId] : null;

  useEffect(() => {
    if (chatId) { isGroup ? fetchGroupMessages(chatId) : fetchMessages(chatId); }
  }, [chatId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!socket || !chatId) return;

    const onReceive = (msg) => {
      const fromThisChat = isGroup
        ? msg.groupId === chatId
        : (msg.senderId?._id || msg.senderId) === chatId;
      if (fromThisChat) {
        addIncomingMessage(msg);
        playNotif();
        socket.emit('message:seen', { messageId: msg._id, senderId: msg.senderId?._id || msg.senderId });
      }
    };
    const onEdited   = (msg) => useChatStore.setState(s => ({ messages: s.messages.map(m => m._id === msg._id ? msg : m) }));
    const onDeleted  = ({ id }) => useChatStore.setState(s => ({ messages: s.messages.map(m => m._id === id ? { ...m, isDeleted:true, message:'This message was deleted' } : m) }));
    const onDelivered = (id)   => updateMessageStatus(id, 'delivered');
    const onSeen     = ({ messageId }) => updateMessageStatus(messageId, 'seen');
    const onGrpMsg   = (msg)   => { if (msg.groupId === chatId) { addIncomingMessage(msg); playNotif(); } };

    socket.on('message:receive',   onReceive);
    socket.on('message:edited',    onEdited);
    socket.on('message:deleted',   onDeleted);
    socket.on('message:delivered', onDelivered);
    socket.on('message:seen',      onSeen);
    socket.on('group:message:receive', onGrpMsg);
    socket.on('typing:start', ({ senderId }) => setTyping(senderId, true));
    socket.on('typing:stop',  ({ senderId }) => setTyping(senderId, false));
    socket.on('group:typing:start', ({ username }) => setTyping('group', username));
    socket.on('group:typing:stop',  ()             => setTyping('group', false));

    if (isGroup) socket.emit('group:join', chatId);
    return () => {
      ['message:receive','message:edited','message:deleted','message:delivered',
       'message:seen','group:message:receive','typing:start','typing:stop',
       'group:typing:start','group:typing:stop'].forEach(e => socket.off(e));
      if (isGroup) socket.emit('group:leave', chatId);
    };
  }, [socket, chatId]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !chatId) return;
    if (isGroup) socket.emit('group:typing:start', { groupId: chatId, username: user.username });
    else socket.emit('typing:start', { senderId: user._id, receiverId: chatId });
    clearTimeout(typTimer.current);
    typTimer.current = setTimeout(() => {
      if (isGroup) socket.emit('group:typing:stop', { groupId: chatId });
      else socket.emit('typing:stop', { senderId: user._id, receiverId: chatId });
    }, 1500);
  };

  const handleSend = async () => {
    if (!text.trim() && !file) return;
    if (editingMsg) {
      await editMessage(editingMsg._id, text);
      socket?.emit('message:edit', { ...editingMsg, message: text, receiverId: chatId });
      setEditingMsg(null);
    } else {
      const data = isGroup
        ? { groupId: chatId, message: text, ...(file && { file }), ...(replyTo && { replyTo: replyTo._id }) }
        : { receiverId: chatId, message: text, ...(file && { file }), ...(replyTo && { replyTo: replyTo._id }) };
      const sent = isGroup ? await sendGroupMessage(data) : await sendMessage(data);
      if (sent && socket) {
        if (isGroup) socket.emit('group:message', sent);
        else socket.emit('message:send', sent);
      }
    }
    setText(''); setFile(null); setReplyTo(null);
    if (isGroup) socket?.emit('group:typing:stop', { groupId: chatId });
    else socket?.emit('typing:stop', { senderId: user._id, receiverId: chatId });
  };

  const handleKey = (e) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        const vf = new File([blob], 'voice_' + Date.now() + '.ogg', { type: 'audio/ogg' });
        const data = isGroup ? { groupId: chatId, message: '🎤 Voice', file: vf, type: 'voice' } : { receiverId: chatId, message: '🎤 Voice', file: vf, type: 'voice' };
        const sent = isGroup ? await sendGroupMessage(data) : await sendMessage(data);
        if (sent && socket) { if (isGroup) socket.emit('group:message', sent); else socket.emit('message:send', sent); }
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); setMrec(mr); setRecording(true);
    } catch { alert('Microphone access denied'); }
  };
  const stopRec = () => { mrec?.stop(); setRecording(false); };

  const StatusIcon = ({ status }) =>
    status==='seen'      ? <BsCheckAll className="text-lime-400" size={13}/>
    : status==='delivered' ? <BsCheckAll className="text-gray-400" size={13}/>
    : <BsCheck className="text-gray-400" size={13}/>;

  const isTyping   = isGroup ? typingUsers['group'] : typingUsers[chatId];
  const chatName   = selectedUser?.username || selectedGroup?.name;
  const chatAvatar = selectedUser?.profilePic || selectedGroup?.avatar;
  const isOnline   = onlineUsers.includes(selectedUser?._id);
  const isInCall   = inCallUsers.includes(selectedUser?._id);

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-8xl mb-4">🍋</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Welcome to LimeChat</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Select a conversation to start chatting</p>
      </div>
    );
  }

  const bgStyle = wallpaper
    ? wallpaper.startsWith('http') || wallpaper.startsWith('/uploads')
      ? { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : wallpaper.includes('gradient')
        ? { background: wallpaper }
        : { backgroundColor: wallpaper }
    : {};

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-100 dark:border-gray-800 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Avatar src={chatAvatar} name={chatName} online={isOnline} inCall={isInCall}/>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">{chatName}</p>
            <p className="text-xs">
              {isTyping
                ? <span className="text-lime-500 font-medium animate-pulse">{isGroup?`${isTyping} typing...`:'typing...'}</span>
                : isInCall
                  ? <span className="text-blue-500">📞 In a call</span>
                  : isGroup
                    ? <span className="text-gray-400">{selectedGroup.members?.length} members</span>
                    : isOnline
                      ? <span className="text-lime-500">🟢 Online</span>
                      : <span className="text-gray-400">⚫ Offline</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isGroup && (
            <>
              <button onClick={() => onStartCall(selectedUser, 'voice')}
                disabled={isInCall || !!activeCall}
                className="p-2 rounded-full hover:bg-lime-50 dark:hover:bg-gray-800 text-lime-600 transition disabled:opacity-40 disabled:cursor-not-allowed" title="Voice call">
                <FiPhone size={17}/>
              </button>
              <button onClick={() => onStartCall(selectedUser, 'video')}
                disabled={isInCall || !!activeCall}
                className="p-2 rounded-full hover:bg-lime-50 dark:hover:bg-gray-800 text-lime-600 transition disabled:opacity-40 disabled:cursor-not-allowed" title="Video call">
                <FiVideo size={17}/>
              </button>
            </>
          )}
          {/* More menu */}
          <div className="relative">
            <button onClick={() => setShowMenu(m => !m)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition">
              <FiMoreVertical size={17}/>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}/>
                <div className="absolute right-0 top-9 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1 w-44 animate-fade-in">
                  <button onClick={() => { setShowWallpaper(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-lime-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <FiWallpaper size={14}/> Wallpaper
                  </button>
                  <button onClick={() => { setShowClear(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-gray-700 text-red-500">
                    <FiTrash2 size={14}/> Clear Chat
                  </button>
                  {selectedUser && (
                    <button onClick={() => { setShowReport(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-gray-700 text-red-400">
                      <FiAlertTriangle size={14}/> Report User
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ ...bgStyle, backgroundImage: bgStyle.backgroundImage || 'radial-gradient(circle at 1px 1px, rgba(132,204,22,0.04) 1px, transparent 0)', backgroundSize: bgStyle.backgroundSize || '20px 20px' }}>
        {messages.map((msg) => {
          const isMine = (msg.senderId?._id || msg.senderId) === user._id;
          return (
            <div key={msg._id} className={`flex ${isMine?'justify-end':'justify-start'} message-animate group`}>
              <div className={`flex flex-col ${isMine?'items-end':'items-start'} max-w-[70%]`}>
                {isGroup && !isMine && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 font-medium px-1 mb-0.5">{msg.senderId?.username}</p>
                )}
                {msg.replyTo && (
                  <div className={`text-xs p-2 rounded-lg mb-1 border-l-2 border-lime-400 ${isMine?'bg-lime-100/80 dark:bg-lime-900/30':'bg-gray-100/80 dark:bg-gray-800'}`}>
                    <p className="text-lime-600 font-medium">↩ Reply</p>
                    <p className="text-gray-600 dark:text-gray-300 truncate">{msg.replyTo.message}</p>
                  </div>
                )}
                <div className="flex items-end gap-1 group">
                  {!isMine && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1">
                      {msg.senderId?.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`relative px-3 py-2 shadow-sm ${isMine?'chat-bubble-sent':'chat-bubble-received'} ${msg.isDeleted?'opacity-60 italic':''}`}
                    onContextMenu={e => { e.preventDefault(); if (!msg.isDeleted) setCtxMenu({ id: msg._id, x: e.clientX, y: e.clientY, isMine }); }}>
                    {msg.type==='image' && msg.fileUrl
                      ? <img src={msg.fileUrl} alt="img" className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition" onClick={() => window.open(msg.fileUrl,'_blank')}/>
                      : msg.type==='voice'
                        ? <audio controls className="max-w-[200px]"><source src={msg.fileUrl}/></audio>
                        : msg.type==='file'
                          ? <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline"><FiPaperclip size={13}/> {msg.fileName||'File'}</a>
                          : <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>}
                    {msg.isEdited && !msg.isDeleted && <span className="text-xs opacity-50 ml-1">(edited)</span>}
                    {msg.reactions?.length>0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">{msg.reactions.map((r,i) => <span key={i} className="text-sm">{r.emoji}</span>)}</div>
                    )}
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine?'justify-end':'justify-start'}`}>
                      <span className={`text-xs ${isMine?'text-lime-100':'text-gray-400'}`}>{format(new Date(msg.createdAt),'h:mm a')}</span>
                      {isMine && <StatusIcon status={msg.status}/>}
                    </div>
                  </div>
                  {!msg.isDeleted && (
                    <button onClick={() => setReplyTo(msg)}
                      className="hidden group-hover:flex items-center p-1 rounded-full bg-white dark:bg-gray-700 shadow text-gray-400 hover:text-lime-500 transition mb-1">
                      <FiShare2 size={11}/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="chat-bubble-received px-4 py-3 flex gap-1 items-center">
              <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCtxMenu(null)}/>
          <div className="fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 min-w-[180px] animate-fade-in"
            style={{ left: Math.min(ctxMenu.x, window.innerWidth-200), top: Math.min(ctxMenu.y, window.innerHeight-250) }}>
            <div className="flex gap-1 px-3 mb-2">
              {['😀','❤️','👍','😂','😮','😢'].map(em => (
                <button key={em} onClick={async () => {
                  const tk = localStorage.getItem('limechat_token');
                  await fetch('/api/messages/' + ctxMenu.id + '/reaction', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk },
                    body: JSON.stringify({ emoji: em })
                  });
                  setCtxMenu(null);
                }} className="text-xl hover:scale-125 transition-transform">{em}</button>
              ))}
            </div>
            <hr className="border-gray-100 dark:border-gray-700 mb-1"/>
            {ctxMenu.isMine && (
              <button onClick={() => { const m = messages.find(m => m._id === ctxMenu.id); setEditingMsg(m); setText(m.message); setCtxMenu(null); }}
                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-lime-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                <FiEdit2 size={13}/> Edit
              </button>
            )}
            <button onClick={() => { const m = messages.find(m => m._id === ctxMenu.id); setReplyTo(m); setCtxMenu(null); }}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-lime-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
              <FiShare2 size={13}/> Reply
            </button>
            {ctxMenu.isMine && (
              <button onClick={async () => {
                await deleteMessage(ctxMenu.id, 'everyone');
                socket?.emit('message:delete', { id: ctxMenu.id, receiverId: chatId });
                setCtxMenu(null);
              }} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-gray-700 text-red-500">
                <FiTrash2 size={13}/> Delete for all
              </button>
            )}
            <button onClick={() => { deleteMessage(ctxMenu.id,'me'); setCtxMenu(null); }}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-gray-700 text-red-400">
              <FiTrash2 size={13}/> Delete for me
            </button>
          </div>
        </>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-lime-50 dark:bg-gray-800 border-l-4 border-lime-500">
          <div className="flex-1">
            <p className="text-xs text-lime-600 dark:text-lime-400 font-semibold">↩ {replyTo.senderId?.username}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{replyTo.message}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-400"><FiX size={14}/></button>
        </div>
      )}

      {/* Edit Banner */}
      {editingMsg && (
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-gray-800 border-l-4 border-blue-500">
          <div className="flex-1">
            <p className="text-xs text-blue-600 font-semibold">✏️ Editing</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{editingMsg.message}</p>
          </div>
          <button onClick={() => { setEditingMsg(null); setText(''); }} className="text-gray-400 hover:text-red-400"><FiX size={14}/></button>
        </div>
      )}

      {/* File Preview */}
      {file && (
        <div className="flex items-center gap-2 px-4 py-2 bg-lime-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <FiPaperclip className="text-lime-500" size={14}/>
          <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-400"><FiX size={13}/></button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
          <button onClick={() => setShowEmoji(e => !e)} className="text-gray-400 hover:text-lime-500 transition flex-shrink-0 pb-1">
            <FiSmile size={20}/>
          </button>
          <textarea value={text} onChange={handleTyping} onKeyDown={handleKey}
            placeholder="Type a message..." rows={1}
            style={{ resize:'none', minHeight:'24px', maxHeight:'100px' }}
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 py-1 overflow-y-auto"/>
          <div className="flex items-center gap-1 flex-shrink-0 pb-1">
            <button onClick={() => imgRef.current.click()} className="text-gray-400 hover:text-lime-500 transition"><FiImage size={17}/></button>
            <button onClick={() => fileRef.current.click()} className="text-gray-400 hover:text-lime-500 transition"><FiPaperclip size={17}/></button>
            <button onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec}
              className={`text-gray-400 hover:text-lime-500 transition ${recording?'text-red-500 animate-pulse':''}`}>
              <FiMic size={17}/>
            </button>
          </div>
          <button onClick={handleSend} disabled={!text.trim() && !file}
            className="bg-lime-500 hover:bg-lime-600 disabled:opacity-40 text-white rounded-xl p-2 transition flex-shrink-0">
            <FiSend size={15}/>
          </button>
        </div>
        {showEmoji && (
          <div className="absolute bottom-20 right-4 z-50">
            <EmojiPicker onEmojiClick={(e) => { setText(t => t + e.emoji); setShowEmoji(false); }}
              theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'} height={340} width={300}/>
          </div>
        )}
        <input ref={imgRef}  type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])}/>
        <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0])}/>
      </div>

      {/* Clear Confirm */}
      {showClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-72 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Clear Chat?</h3>
            <p className="text-sm text-gray-500 mb-4">This clears messages for you only.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClear(false)} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">Cancel</button>
              <button onClick={async () => { await clearChat(chatId); setShowClear(false); }} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium">Clear</button>
            </div>
          </div>
        </div>
      )}

      {showWallpaper && chatId && <WallpaperPicker chatId={chatId} onClose={() => setShowWallpaper(false)}/>}
      {showReport && selectedUser && <ReportModal user={selectedUser} onClose={() => setShowReport(false)}/>}
    </div>
  );
}
