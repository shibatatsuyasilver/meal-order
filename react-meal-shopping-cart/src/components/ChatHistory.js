import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Spin, Empty } from 'antd';
import api from './api';

const { Title, Text } = Typography;

const ChatHistory = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/chat/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByDate = (sessions) => {
    const groups = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    sessions.forEach(session => {
      const date = new Date(session.updated_at);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        groups['Today'].push(session);
      } else if (date.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(session);
      } else if (date > last7Days) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessionsByDate(sessions);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Chat History</Title>
      
      {Object.entries(groupedSessions).map(([group, groupSessions]) => (
        groupSessions.length > 0 && (
          <div key={group} style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ color: '#666', marginBottom: '16px' }}>{group}</Title>
            <List
              grid={{ gutter: 16, column: 1 }}
              dataSource={groupSessions}
              renderItem={session => (
                <List.Item>
                  <Card 
                    hoverable 
                    onClick={() => onSelectSession(session.id)}
                    style={{ cursor: 'pointer', borderRadius: '8px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: '16px' }}>{session.title || 'Untitled Chat'}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(session.updated_at).toLocaleString()}
                      </Text>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        )
      ))}

      {sessions.length === 0 && (
        <Empty description="No chat history found" />
      )}
    </div>
  );
};

export default ChatHistory;