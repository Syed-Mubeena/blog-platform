import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('feed'); // feed | post | write | auth
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postForm, setPostForm] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try { const res = await axios.get(`${API}/posts`); setPosts(res.data); } catch {}
  };

  const openPost = async (post) => {
    setActivePost(post);
    setView('post');
    try {
      const res = await axios.get(`${API}/posts/${post._id}/comments`);
      setComments(res.data);
    } catch {}
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = isLogin ? `${API}/auth/login` : `${API}/auth/register`;
      const payload = isLogin ? { email: authForm.email, password: authForm.password } : authForm;
      const res = await axios.post(url, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('name', res.data.name);
      setToken(res.data.token); setName(res.data.name);
      setView('feed');
    } catch (err) { setError(err.response?.data?.msg || 'Something went wrong'); }
  };

  const logout = () => { localStorage.clear(); setToken(''); setName(''); setView('feed'); };

  const submitPost = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API}/posts/${editingId}`, postForm, authHeaders);
      } else {
        await axios.post(`${API}/posts`, postForm, authHeaders);
      }
      setPostForm({ title: '', content: '' });
      setEditingId(null);
      fetchPosts();
      setView('feed');
    } catch (err) { setError('Failed to save post'); }
  };

  const editPost = (post) => {
    setPostForm({ title: post.title, content: post.content });
    setEditingId(post._id);
    setView('write');
  };

  const deletePost = async (id) => {
    try { await axios.delete(`${API}/posts/${id}`, authHeaders); fetchPosts(); setView('feed'); } catch {}
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!token) { setError('Please login to comment'); return; }
    try {
      const res = await axios.post(`${API}/posts/${activePost._id}/comments`, { text: newComment }, authHeaders);
      setComments([...comments, res.data]);
      setNewComment('');
    } catch { setError('Failed to add comment'); }
  };

  const deleteComment = async (id) => {
    try {
      await axios.delete(`${API}/comments/${id}`, authHeaders);
      setComments(comments.filter(c => c._id !== id));
    } catch {}
  };

  const inputStyle = { padding: '10px 14px', borderRadius: '8px', border: '0.5px solid rgba(175,169,236,0.2)', background: 'rgba(255,255,255,0.04)', color: '#e8e6f0', fontSize: '14px', outline: 'none', width: '100%' };

  const currentUserId = (() => {
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])).id; } catch { return null; }
  })();

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', fontFamily: "'Segoe UI',sans-serif", color: '#e8e6f0' }}>

      {/* NAVBAR */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,15,19,0.95)', borderBottom: '0.5px solid rgba(175,169,236,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', height: '56px', flexWrap: 'wrap' }}>
        <div onClick={() => setView('feed')} style={{ fontWeight: 700, color: '#AFA9EC', fontSize: '16px', cursor: 'pointer' }}>📝 InkSpace</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setView('feed')} style={{ background: view === 'feed' ? 'rgba(83,74,183,0.15)' : 'transparent', border: 'none', color: '#AFA9EC', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Feed</button>
          {token && <button onClick={() => { setPostForm({ title: '', content: '' }); setEditingId(null); setView('write'); }} style={{ background: view === 'write' ? 'rgba(83,74,183,0.15)' : 'transparent', border: 'none', color: '#AFA9EC', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>+ Write</button>}
          {token ? (
            <>
              <span style={{ fontSize: '13px', color: '#888' }}>Hi, <span style={{ color: '#AFA9EC' }}>{name}</span></span>
              <button onClick={logout} style={{ background: 'transparent', border: '0.5px solid rgba(175,169,236,0.3)', color: '#AFA9EC', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Logout</button>
            </>
          ) : (
            <button onClick={() => setView('auth')} style={{ background: '#534AB7', border: 'none', color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Login</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>
        {error && <div style={{ background: 'rgba(220,50,50,0.1)', border: '0.5px solid rgba(220,50,50,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '1.5rem' }}>{error} <span onClick={() => setError('')} style={{ float: 'right', cursor: 'pointer' }}>×</span></div>}

        {/* AUTH VIEW */}
        {view === 'auth' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.2)', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '380px' }}>
              <h2 style={{ color: '#f0eeff', marginBottom: '0.5rem', fontSize: '1.4rem' }}>{isLogin ? '👋 Welcome back' : '🚀 Create account'}</h2>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '1.5rem' }}>InkSpace</p>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!isLogin && <input required placeholder="Full name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} style={inputStyle} />}
                <input required type="email" placeholder="Email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} style={inputStyle} />
                <input required type="password" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} style={inputStyle} />
                <button type="submit" style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{isLogin ? 'Login' : 'Register'}</button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: '#666' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ color: '#AFA9EC', cursor: 'pointer' }}>{isLogin ? 'Register' : 'Login'}</span>
              </p>
            </div>
          </div>
        )}

        {/* FEED VIEW */}
        {view === 'feed' && (
          <>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0eeff', marginBottom: '1.5rem' }}>Latest Posts</div>
            {posts.length === 0 && <div style={{ color: '#666', textAlign: 'center', padding: '3rem' }}>No posts yet. Be the first to write one!</div>}
            {posts.map(p => (
              <div key={p._id} onClick={() => openPost(p)} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.12)', borderRadius: '12px', padding: '1.5rem', marginBottom: '14px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f0eeff', marginBottom: '6px' }}>{p.title}</div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>{p.content.slice(0, 140)}{p.content.length > 140 ? '…' : ''}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>by {p.authorName} · {new Date(p.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </>
        )}

        {/* WRITE VIEW */}
        {view === 'write' && token && (
          <>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0eeff', marginBottom: '1.5rem' }}>{editingId ? 'Edit Post' : 'Write a New Post'}</div>
            <form onSubmit={submitPost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input required placeholder="Post title" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} style={{ ...inputStyle, fontSize: '18px', fontWeight: 600, padding: '12px 16px' }} />
              <textarea required placeholder="Write your story..." value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} rows={12} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
              <button type="submit" style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '11px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', padding: '10px 28px' }}>{editingId ? 'Update Post' : 'Publish Post'}</button>
            </form>
          </>
        )}

        {/* SINGLE POST VIEW */}
        {view === 'post' && activePost && (
          <>
            <button onClick={() => setView('feed')} style={{ background: 'none', border: 'none', color: '#AFA9EC', cursor: 'pointer', fontSize: '13px', marginBottom: '1.5rem' }}>← Back to feed</button>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f0eeff', marginBottom: '8px' }}>{activePost.title}</div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '1.5rem' }}>by {activePost.authorName} · {new Date(activePost.createdAt).toLocaleDateString()}</div>
            <div style={{ fontSize: '15px', color: '#ccc', lineHeight: 1.8, marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{activePost.content}</div>

            {token && currentUserId === activePost.author && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem' }}>
                <button onClick={() => editPost(activePost)} style={{ background: 'rgba(83,74,183,0.12)', border: '0.5px solid rgba(175,169,236,0.2)', color: '#AFA9EC', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => deletePost(activePost._id)} style={{ background: 'rgba(220,50,50,0.1)', border: '0.5px solid rgba(220,50,50,0.3)', color: '#f87171', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Delete</button>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '0.5px solid rgba(175,169,236,0.1)', margin: '2rem 0' }} />

            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f0eeff', marginBottom: '1rem' }}>💬 Comments ({comments.length})</div>

            {token ? (
              <form onSubmit={addComment} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                <input placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} style={inputStyle} />
                <button type="submit" style={{ background: '#534AB7', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Post</button>
              </form>
            ) : (
              <div style={{ color: '#666', fontSize: '13px', marginBottom: '1.5rem' }}>
                <span onClick={() => setView('auth')} style={{ color: '#AFA9EC', cursor: 'pointer' }}>Login</span> to leave a comment
              </div>
            )}

            {comments.map(c => (
              <div key={c._id} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(175,169,236,0.1)', borderRadius: '10px', padding: '12px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#AFA9EC' }}>{c.authorName}</span>
                  {token && currentUserId === c.author && (
                    <button onClick={() => deleteComment(c._id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#ccc' }}>{c.text}</div>
              </div>
            ))}
            {comments.length === 0 && <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '1rem' }}>No comments yet</div>}
          </>
        )}
      </div>
    </div>
  );
}