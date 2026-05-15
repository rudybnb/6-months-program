import React, { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import type { Challenge, DiscussionPost, AppData } from '../types';
import './CommunityHub.css';

interface CommunityHubProps {
  appData: AppData;
  onBack: () => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({ appData, onBack }) => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'discussions'>('challenges');
  const [newPost, setNewPost] = useState('');

  const firstName = appData.profile?.name?.split(' ')[0] || 'User';

  // Simulated data
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: '1', title: '7-Day 5AM Wake Up', duration: '7 Days', participants: 42, type: 'routine' },
    { id: '2', title: 'No Sugar Week', duration: '7 Days', participants: 18, type: 'health' },
    { id: '3', title: '3-Day Water Fast', duration: '3 Days', participants: 5, type: 'health' },
    { id: '4', title: 'Daily Reading', duration: '30 Days', participants: 112, type: 'mind' }
  ]);

  const [discussions, setDiscussions] = useState<DiscussionPost[]>([
    { id: '1', authorFirstName: 'Sarah', content: 'Felt a lot of resistance this morning, but showed up anyway. The discipline matters more than the feeling.', timestamp: Date.now() - 3600000 },
    { id: '2', authorFirstName: 'David', content: 'Does anyone have tips for winding down in the evening? I struggle to turn my mind off.', timestamp: Date.now() - 7200000 },
    { id: '3', authorFirstName: 'Michael', content: 'Just finished my first week. Keep going everyone. The clarity is worth it.', timestamp: Date.now() - 86400000 }
  ]);

  const [joinedChallenges, setJoinedChallenges] = useState<string[]>([]);

  const handleJoinChallenge = (id: string) => {
    if (joinedChallenges.includes(id)) {
      setJoinedChallenges(prev => prev.filter(c => c !== id));
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, participants: c.participants - 1 } : c));
    } else {
      setJoinedChallenges(prev => [...prev, id]);
      setChallenges(prev => prev.map(c => c.id === id ? { ...c, participants: c.participants + 1 } : c));
    }
  };

  const handlePostDiscussion = () => {
    if (!newPost.trim()) return;

    const post: DiscussionPost = {
      id: Date.now().toString(),
      authorFirstName: firstName,
      content: newPost.trim(),
      timestamp: Date.now()
    };

    setDiscussions(prev => [post, ...prev]);
    setNewPost('');
  };

  const renderChallenges = () => (
    <div className="hub-challenges fade-in">
      <p className="hub-description">
        Action-based commitments. Small groups. Simple tracking.
      </p>
      <div className="challenges-grid">
        {challenges.map(challenge => {
          const isJoined = joinedChallenges.includes(challenge.id);
          return (
            <div key={challenge.id} className={`challenge-card ${isJoined ? 'joined' : ''}`}>
              <div className="challenge-header">
                <span className="challenge-duration">{challenge.duration}</span>
                <span className="challenge-participants">{challenge.participants} participating</span>
              </div>
              <h3 className="challenge-title">{challenge.title}</h3>
              <button 
                className={`challenge-join-btn ${isJoined ? 'active' : ''}`}
                onClick={() => handleJoinChallenge(challenge.id)}
              >
                {isJoined ? 'Committed' : 'Join Challenge'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDiscussions = () => (
    <div className="hub-discussions fade-in">
      <p className="hub-description">
        Share experiences and encourage others. No likes, no followers. Just calm, human connection.
      </p>
      
      <div className="discussion-compose">
        <textarea 
          placeholder="Share a thought or ask a question..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          maxLength={280}
        />
        <div className="compose-actions">
          <span className="char-count">{280 - newPost.length} chars left</span>
          <button 
            className="post-btn" 
            onClick={handlePostDiscussion}
            disabled={!newPost.trim()}
          >
            <Send size={16} />
            Post
          </button>
        </div>
      </div>

      <div className="discussion-feed">
        {discussions.map(post => {
          const date = new Date(post.timestamp);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          
          return (
            <div key={post.id} className="discussion-post">
              <div className="post-header">
                <span className="post-author">{post.authorFirstName}</span>
                <span className="post-time">{dateString} • {timeString}</span>
              </div>
              <p className="post-content">{post.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="community-hub-container">
      <div className="hub-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h1>Community Hub</h1>
      </div>

      <div className="hub-tabs">
        <button 
          className={`hub-tab ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          Challenges
        </button>
        <button 
          className={`hub-tab ${activeTab === 'discussions' ? 'active' : ''}`}
          onClick={() => setActiveTab('discussions')}
        >
          Discussions
        </button>
      </div>

      <div className="hub-content">
        {activeTab === 'challenges' ? renderChallenges() : renderDiscussions()}
      </div>
    </div>
  );
};
