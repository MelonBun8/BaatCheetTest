// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useWebRTC } from '../context/webRTCContext';

// const ContactList = () => {
//   const { user } = useAuth();
//   const { startCall } = useWebRTC();
//   const [contacts, setContacts] = useState([]);
//   const [onlineUsers, setOnlineUsers] = useState([]);

//   // In a real app, you would fetch this from your backend
//   useEffect(() => {
//     // Mock data - replace with actual API call
//     const mockContacts = [
//       { id: '2', name: 'Alice Johnson', online: true },
//       { id: '3', name: 'Bob Smith', online: false },
//       { id: '4', name: 'Charlie Brown', online: true }
//     ].filter(contact => contact.id !== user.id); // Exclude current user
    
//     setContacts(mockContacts);
//   }, [user.id]);

//   return (
//     <div className="contact-list">
//       <h3>Contacts</h3>
//       <ul>
//         {contacts.map(contact => (
//           <li key={contact.id} className={contact.online ? 'online' : 'offline'}>
//             <span>{contact.name}</span>
//             {contact.online && (
//               <button 
//                 onClick={() => startCall(contact.id)}
//                 className="call-button"
//               >
//                 Call
//               </button>
//             )}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default ContactList;

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../context/webRTCContext';

const ContactList = () => {
  const { user } = useAuth();
  const { startCall, onlineUsers } = useWebRTC();
  
  // Online users are now fetched directly from WebRTC context
  // which gets updated via WebSockets

  const handleStartCall = (userId, userName) => {
    startCall(userId, userName);
  };

  return (
    <div className="contact-list">
      <h3>Online Users</h3>
      {onlineUsers.length === 0 ? (
        <p>No users online right now</p>
      ) : (
        <ul>
          {onlineUsers.map(onlineUser => (
            <li key={onlineUser.id} className="online">
              <span>{onlineUser.name || onlineUser.id}</span>
              <button 
                onClick={() => handleStartCall(onlineUser.id, onlineUser.name || 'User')}
                className="call-button"
              >
                Call
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContactList;
