import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  isAdmin: boolean;
  isReminder?: boolean;
}

interface Student {
  id: string;
  name: string;
  unreadCount?: number;
}

export const AdminChats = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsList = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Student'
        }));
        
        setStudents(studentsList);
        if (studentsList.length > 0) {
          setSelectedStudent(studentsList[0]);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load student contacts');
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // No need to filter if search query is empty
      return;
    }
    
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filtered.length > 0 && !selectedStudent) {
      setSelectedStudent(filtered[0]);
    }
  }, [searchQuery, students]);

  // Listen for messages when a student is selected
  useEffect(() => {
    if (!user?.uid || !selectedStudent) return;

    setLoading(true);
    setError(null);

    // Create a unique chat ID based on user and student IDs
    const chatId = [user.uid, selectedStudent.id].sort().join('_');
    
    // Listen for messages in this chat
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, 
      (snapshot) => {
        const messageList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        
        setMessages(messageList);
        setLoading(false);
        
        // Scroll to bottom when new messages arrive
        if (messageList.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      },
      (err) => {
        console.error('Error listening to messages:', err);
        setError('Failed to load messages');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedStudent]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.uid || !selectedStudent) return;

    try {
      // Create a unique chat ID based on user and student IDs
      const chatId = [user.uid, selectedStudent.id].sort().join('_');
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: user.name || 'Admin',
        timestamp: serverTimestamp(),
        isAdmin: true
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const sendReminder = async () => {
    if (!user?.uid || !selectedStudent) return;

    try {
      // Create a unique chat ID based on user and student IDs
      const chatId = [user.uid, selectedStudent.id].sort().join('_');
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: 'This is a reminder that your payment is due. Please complete your payment as soon as possible.',
        senderId: user.uid,
        senderName: user.name || 'Admin',
        timestamp: serverTimestamp(),
        isAdmin: true,
        isReminder: true
      });

      alert('Payment reminder sent successfully');
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert('Failed to send reminder. Please try again.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.userMessageContainer : styles.otherMessageContainer,
        item.isReminder && styles.reminderContainer
      ]}>
        {!isCurrentUser && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.userBubble : styles.otherBubble,
          item.isReminder && styles.reminderBubble
        ]}>
          <Text style={[
            styles.messageText,
            item.isReminder && styles.reminderText
          ]}>{item.text}</Text>
          <Text style={styles.timestamp}>
            {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  const renderStudentButton = (student: Student) => (
    <TouchableOpacity
      key={student.id}
      style={[styles.studentButton, selectedStudent?.id === student.id && styles.selectedStudentButton]}
      onPress={() => setSelectedStudent(student)}
    >
      <Text style={[styles.studentButtonText, selectedStudent?.id === student.id && styles.selectedStudentText]}>
        {student.name}
      </Text>
      {student.unreadCount && student.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{student.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView style={styles.studentsList}>
          {students.map(renderStudentButton)}
        </ScrollView>
      </View>

      <View style={styles.chatContainer}>
        {selectedStudent ? (
          <KeyboardAvoidingView 
            style={styles.chatContent}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}
          >
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderText}>
                Chat with {selectedStudent.name}
              </Text>
              <TouchableOpacity 
                style={styles.reminderButton}
                onPress={sendReminder}
              >
                <Text style={styles.reminderButtonText}>Send Payment Reminder</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendButton, !newMessage.trim() && styles.disabledSendButton]} 
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.noStudentContainer}>
            <Text style={styles.noStudentText}>Select a student to start chatting</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: '#f5f5f5',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'web' ? 0 : 100,
  },
  sidebar: {
    width: Platform.OS === 'web' ? 250 : '100%',
    height: Platform.OS === 'web' ? '100%' : 'auto',
    maxHeight: Platform.OS === 'web' ? undefined : 200,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderBottomWidth: Platform.OS === 'web' ? 0 : 1,
    borderRightColor: '#e0e0e0',
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  studentsList: {
    flex: 1,
  },
  studentButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedStudentButton: {
    backgroundColor: '#f0e6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  studentButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedStudentText: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  unreadBadge: {
    backgroundColor: '#6200ee',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? undefined : 0,
    paddingBottom: Platform.OS === 'web' ? 0 : 100,
    height: '100%',
    overflow: 'scroll',
    position: 'relative',
    marginBottom: Platform.OS === 'web' ? 0 : 80,
  },
  chatContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: Platform.OS === 'web' ? '100%' : undefined,
  },
  chatHeader: {
    padding: 15,
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reminderButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  reminderButtonText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  noStudentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noStudentText: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6200ee',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  reminderContainer: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    marginLeft: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    minWidth: 80,
  },
  userBubble: {
    backgroundColor: '#6200ee',
    borderBottomRightRadius: 5,
  },
  otherBubble: {
    backgroundColor: '#e0e0e0',
    borderBottomLeftRadius: 5,
  },
  reminderBubble: {
    backgroundColor: '#fff4e5',
    borderRadius: 10,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  reminderText: {
    color: '#ff9800',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 25,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 0 : 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: Platform.OS === 'web' ? 25 : 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    minHeight: 120,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#6200ee',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledSendButton: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});