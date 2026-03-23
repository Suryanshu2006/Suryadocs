import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';

export default function EditorPage() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [docMeta, setDocMeta] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const ydocRef = useRef(new Y.Doc());
  const socketRef = useRef(null);
  const editorLoadedRef = useRef(false);

  // Initialize socket and fetch initial document binary content
  useEffect(() => {
    socketRef.current = io('http://localhost:5001');
    
    fetch(`http://localhost:5001/api/documents/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setDocMeta(data);
      if (data.content && data.content.length > 0) {
        // Apply existing document content binary state
        const update = new Uint8Array(data.content);
        Y.applyUpdate(ydocRef.current, update);
      }
      
      // We only want to join the room once we have loaded the DB document
      socketRef.current.emit('join-document', id);
      editorLoadedRef.current = true;
      
      // When local yjs doc changes, broadcast it
      ydocRef.current.on('update', (update) => {
        socketRef.current.emit('sync-update', { documentId: id, update: Array.from(update) });
      });

      // When remote changes arrive via Socket.IO
      socketRef.current.on('sync-update', (updateArray) => {
        Y.applyUpdate(ydocRef.current, new Uint8Array(updateArray));
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [id, token]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydocRef.current,
      })
    ],
  });

  const saveDocument = async () => {
    setIsSaving(true);
    const content = Y.encodeStateAsUpdate(ydocRef.current);
    try {
      await fetch(`http://localhost:5001/api/documents/${id}/save`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: Array.from(content) })
      });
      // Optionally update the title as well, using another fetch or merging them
    } catch(err) {
      console.error('Failed to save', err);
    }
    setIsSaving(false);
  };

  // Autosave every 10 seconds silently
  useEffect(() => {
    const timer = setInterval(() => {
      if (editorLoadedRef.current) {
        saveDocument();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [id, token]);

  if (!editor || !docMeta) return <div style={{color:'white', padding:32}}>Loading Editor...</div>;

  return (
    <div className="editor-layout">
      <div className="editor-toolbar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => navigate('/')}>&larr; Back</button>
        <span style={{ color: 'white', fontWeight: 600, marginLeft: 16 }}>{docMeta.title}</span>
        <div style={{ flex: 1 }}></div>
        <button 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
        >Bold</button>
        <button 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
        >Italic</button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
        >H1</button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
        >H2</button>
        <button 
          style={{ background: isSaving ? '#64748b' : '#10b981', marginLeft: 16 }} 
          onClick={saveDocument}
          disabled={isSaving}
        >{isSaving ? 'Saving...' : 'Save'}</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
