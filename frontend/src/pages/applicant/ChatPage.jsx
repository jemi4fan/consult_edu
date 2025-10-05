import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  Search,
  Circle,
  Clock,
  Check,
  CheckCheck,
  User,
} from 'lucide-react';

const ApplicantChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  const conversations = [
    {
      id: 1,
      participant: {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        role: 'staff',
        avatar: '/api/placeholder/40/40',
        isOnline: true,
        lastSeen: null,
      },
      lastMessage: {
        content: 'I have reviewed your application. Everything looks good!',
        timestamp: '2024-01-20T14:30:00Z',
        isFromCurrentUser: false,
        status: 'read',
      },
      unreadCount: 0,
      updatedAt: '2024-01-20T14:30:00Z',
    },
    {
      id: 2,
      participant: {
        id: 2,
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        role: 'admin',
        avatar: '/api/placeholder/40/40',
        isOnline: false,
        lastSeen: '2024-01-20T12:15:00Z',
      },
      lastMessage: {
        content: 'Please upload your transcript as soon as possible.',
        timestamp: '2024-01-20T12:15:00Z',
        isFromCurrentUser: false,
        status: 'delivered',
      },
      unreadCount: 1,
      updatedAt: '2024-01-20T12:15:00Z',
    },
  ];

  const messages = selectedConversation ? [
    {
      id: 1,
      content: 'Hello! I have a question about my application.',
      timestamp: '2024-01-20T14:00:00Z',
      isFromCurrentUser: true,
      status: 'read',
    },
    {
      id: 2,
      content: 'Hi! I\'d be happy to help. What\'s your question?',
      timestamp: '2024-01-20T14:01:00Z',
      isFromCurrentUser: false,
      status: 'read',
    },
    {
      id: 3,
      content: 'I want to know if I can change my preferred program after submitting the application.',
      timestamp: '2024-01-20T14:02:00Z',
      isFromCurrentUser: true,
      status: 'read',
    },
    {
      id: 4,
      content: 'Yes, you can make changes to your application as long as it\'s still in draft status. Once submitted, you\'ll need to contact us directly.',
      timestamp: '2024-01-20T14:05:00Z',
      isFromCurrentUser: false,
      status: 'read',
    },
    {
      id: 5,
      content: 'Thank you for the information!',
      timestamp: '2024-01-20T14:30:00Z',
      isFromCurrentUser: true,
      status: 'read',
    },
  ] : [];

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.participant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Send message logic here
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const getMessageStatusIcon = (status, isFromCurrentUser) => {
    if (!isFromCurrentUser) return null;
    
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="text-gray-600">
            Communicate with our staff and administrators.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Conversations
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      {conversation.participant.isOnline && (
                        <Circle className="absolute -bottom-1 -right-1 h-3 w-3 fill-green-500 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.participant.name}
                        </p>
                        <div className="flex items-center space-x-1">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="primary" size="sm">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" size="sm" className="capitalize">
                          {conversation.participant.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.isFromCurrentUser && 'You: '}
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      {selectedConversation.participant.isOnline && (
                        <Circle className="absolute -bottom-1 -right-1 h-3 w-3 fill-green-500 text-green-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedConversation.participant.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" size="sm" className="capitalize">
                          {selectedConversation.participant.role}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {selectedConversation.participant.isOnline 
                            ? 'Online' 
                            : `Last seen ${new Date(selectedConversation.participant.lastSeen).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 overflow-y-auto">
                <div className="p-4 space-y-4 min-h-full">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isFromCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-end mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                          {getMessageStatusIcon(message.status, message.isFromCurrentUser)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No conversation selected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a conversation from the list to start chatting with our staff.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ApplicantChatPage;


