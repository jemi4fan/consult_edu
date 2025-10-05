import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { chatAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  ChatIcon,
  UserIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  TrashIcon,
  SearchIcon
} from '@heroicons/react/outline';

const ChatPage = () => {
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch all chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery(
    ['chats', searchTerm],
    () => chatAPI.getChats(),
    {
      select: (response) => response.data.data,
      refetchInterval: 5000, // Refresh every 5 seconds
    }
  );

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['chatMessages', selectedChat?.id],
    () => chatAPI.getChatMessages(selectedChat?.id),
    {
      select: (response) => response.data.data,
      enabled: !!selectedChat?.id,
      refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
    }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    ({ chatId, message }) => chatAPI.sendMessage(chatId, { message }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chatMessages', selectedChat?.id]);
        queryClient.invalidateQueries('chats');
        setMessageText('');
        scrollToBottom();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Delete chat mutation
  const deleteChatMutation = useMutation(
    (chatId) => chatAPI.deleteChat(chatId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('chats');
        setShowDeleteModal(false);
        setChatToDelete(null);
        if (selectedChat?.id === chatToDelete) {
          setSelectedChat(null);
        }
        toast.success('Chat deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete chat');
      }
    }
  );

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && selectedChat) {
      sendMessageMutation.mutate({
        chatId: selectedChat.id,
        message: messageText.trim()
      });
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleDeleteClick = (chat) => {
    setChatToDelete(chat.id);
    setShowDeleteModal(true);
  };

  const handleDeleteChat = () => {
    deleteChatMutation.mutate(chatToDelete);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUnreadCount = (chat) => {
    return chat.unread_count || 0;
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.last_message) return 'No messages yet';
    const message = chat.last_message.message;
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">Manage customer support conversations</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chatsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : chatsData?.chats?.length > 0 ? (
              chatsData.chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-indigo-50 border-indigo-200' : ''
                  }`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {chat.user_name || 'Unknown User'}
                        </h3>
                        {getUnreadCount(chat) > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                            {getUnreadCount(chat)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {getLastMessagePreview(chat)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {chat.last_message ? formatTime(chat.last_message.created_at) : formatTime(chat.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(chat);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <ChatIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No chats found</p>
              </div>
            )}
          </div>
            </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {selectedChat.user_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedChat.user_name || 'Unknown User'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Chat started: {formatDate(selectedChat.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedChat.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedChat.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : messagesData?.messages?.length > 0 ? (
                  messagesData.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_type === 'admin'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_type === 'admin' ? 'text-indigo-200' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">
                    <ChatIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
                </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <form onSubmit={handleSendMessage} className="flex space-x-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={sendMessageMutation.isLoading}
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={!messageText.trim() || sendMessageMutation.isLoading}
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
                <p className="text-gray-600">
                  Choose a conversation from the sidebar to start messaging.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Chat"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this chat? This action cannot be undone and will remove all messages.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteChat}
              loading={deleteChatMutation.isLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage;