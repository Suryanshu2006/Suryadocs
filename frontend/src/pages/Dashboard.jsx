import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const { token, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteDoc = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createDoc = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: 'New Document' })
      });
      const data = await res.json();
      if (res.ok) navigate(`/document/${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <nav className="navbar">
        <h2>Suryadocs</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>Welcome, {user?.username}</span>
          <button style={{ width: 'auto', padding: '8px 16px' }} onClick={logout}>Logout</button>
        </div>
      </nav>
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Your Documents</h1>
          <button style={{ width: 'auto' }} onClick={createDoc}>+ New Document</button>
        </div>
        <div className="doc-grid">
          {documents.map(doc => (
            <div key={doc._id} className="doc-card glass-panel" onClick={() => navigate(`/document/${doc._id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>{doc.title}</h3>
                <button onClick={(e) => deleteDoc(e, doc._id)} style={{ background: '#ef4444', padding: '4px 8px', fontSize: '12px', width: 'auto' }}>Delete</button>
              </div>
              <p>Last updated: {new Date(doc.updatedAt).toLocaleDateString()}</p>
            </div>
          ))}
          {documents.length === 0 && <p style={{ color: '#94a3b8' }}>No documents yet. Create one!</p>}
        </div>
      </div>
    </>
  );
}
