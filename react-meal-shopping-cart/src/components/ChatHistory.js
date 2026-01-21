import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Spin, Empty, Button, message, Modal, Checkbox, Flex } from 'antd';
import { DeleteOutlined, CheckSquareOutlined, CloseSquareOutlined } from '@ant-design/icons';
import api, { deleteSession, deleteSessions } from './api';

const { Title, Text } = Typography;
const { confirm } = Modal;

const ChatHistory = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);

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

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedSessionIds([]);
  };

  const handleSelectSession = (e, sessionId) => {
    e.stopPropagation();
    if (selectedSessionIds.includes(sessionId)) {
      setSelectedSessionIds(selectedSessionIds.filter(id => id !== sessionId));
    } else {
      setSelectedSessionIds([...selectedSessionIds, sessionId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSessionIds.length === sessions.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(sessions.map(s => s.id));
    }
  };

  const handleDelete = (e, sessionId) => {
    e.stopPropagation(); // Prevent card click
    confirm({
      title: 'Are you sure delete this chat session?',
      icon: <DeleteOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteSession(sessionId);
          message.success('Session deleted successfully');
          fetchSessions(); // Refresh list
        } catch (error) {
          console.error("Error deleting session:", error);
          message.error('Failed to delete session');
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedSessionIds.length === 0) return;

    confirm({
      title: `Are you sure you want to delete ${selectedSessionIds.length} sessions?`,
      icon: <DeleteOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteSessions(selectedSessionIds, false);
          message.success('Sessions deleted successfully');
          setSelectedSessionIds([]);
          setIsSelectionMode(false);
          fetchSessions();
        } catch (error) {
          console.error("Error deleting sessions:", error);
          message.error('Failed to delete sessions');
        }
      },
    });
  };

  const handleDeleteAll = () => {
    confirm({
      title: 'Are you sure you want to delete ALL chat history?',
      icon: <DeleteOutlined />,
      content: 'This will remove all chat sessions permanently. This action cannot be undone.',
      okText: 'Yes, Delete All',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteSessions([], true);
          message.success('All history deleted successfully');
          setSelectedSessionIds([]);
          setIsSelectionMode(false);
          fetchSessions();
        } catch (error) {
          console.error("Error deleting all history:", error);
          message.error('Failed to delete all history');
        }
      },
    });
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
      <Flex justify="space-between" align="center" style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>Chat History</Title>
        <Flex gap="small">
            {isSelectionMode ? (
                <>
                    <Button onClick={handleSelectAll}>
                        {selectedSessionIds.length === sessions.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button 
                        danger 
                        type="primary" 
                        disabled={selectedSessionIds.length === 0}
                        onClick={handleBatchDelete}
                        icon={<DeleteOutlined />}
                    >
                        Delete Selected ({selectedSessionIds.length})
                    </Button>
                    <Button onClick={toggleSelectionMode} icon={<CloseSquareOutlined />}>
                        Cancel
                    </Button>
                </>
            ) : (
                <>
                    <Button onClick={toggleSelectionMode} icon={<CheckSquareOutlined />}>
                        Select
                    </Button>
                    <Button danger onClick={handleDeleteAll} icon={<DeleteOutlined />}>
                        Delete All
                    </Button>
                </>
            )}
        </Flex>
      </Flex>
      
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
                    onClick={() => !isSelectionMode && onSelectSession(session.id)}
                    style={{ 
                        cursor: isSelectionMode ? 'default' : 'pointer', 
                        borderRadius: '8px',
                        border: isSelectionMode && selectedSessionIds.includes(session.id) ? '1px solid #1890ff' : undefined
                    }}
                    bodyStyle={{ padding: '12px 24px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {isSelectionMode && (
                          <Checkbox 
                            checked={selectedSessionIds.includes(session.id)}
                            onChange={(e) => handleSelectSession(e, session.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                      )}
                      <div style={{ flex: 1 }} onClick={(e) => isSelectionMode && handleSelectSession(e, session.id)}>
                        <Text strong style={{ fontSize: '16px' }}>{session.title || 'Untitled Chat'}</Text>
                        <br/>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(session.updated_at).toLocaleString()}
                        </Text>
                      </div>
                      {!isSelectionMode && (
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={(e) => handleDelete(e, session.id)}
                          />
                      )}
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