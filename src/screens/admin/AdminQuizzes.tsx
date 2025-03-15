import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

interface Quiz {
  id: string;
  title: string;
  description: string;
  googleFormUrl: string;
  scheduledDate: any; // Firestore timestamp
  duration: number; // in minutes
  isActive: boolean;
  createdBy: string;
  createdAt: any; // Firestore timestamp
}

export const AdminQuizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);
  
  // New quiz form state
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizGoogleFormUrl, setNewQuizGoogleFormUrl] = useState('');
  const [newQuizScheduledDate, setNewQuizScheduledDate] = useState(new Date());
  const [newQuizDuration, setNewQuizDuration] = useState('60'); // Default 60 minutes
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        orderBy('createdAt', 'desc')
      );

      const quizzesSnapshot = await getDocs(quizzesQuery);
      const quizzesList = quizzesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quiz[];

      setQuizzes(quizzesList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes');
      setLoading(false);
    }
  };

  const addQuiz = async () => {
    try {
      // Validate form
      if (!newQuizTitle.trim()) {
        Alert.alert('Error', 'Please enter a quiz title');
        return;
      }

      if (!newQuizGoogleFormUrl.trim()) {
        Alert.alert('Error', 'Please enter a Google Form URL');
        return;
      }

      // Validate date
      if (!newQuizScheduledDate) {
        Alert.alert('Error', 'Please select a scheduled date and time');
        return;
      }

      const scheduledDate = newQuizScheduledDate;

      // Validate duration
      const duration = parseInt(newQuizDuration);
      if (isNaN(duration) || duration <= 0) {
        Alert.alert('Error', 'Please enter a valid duration in minutes');
        return;
      }

      setLoading(true);

      // Add new quiz to Firestore
      await addDoc(collection(db, 'quizzes'), {
        title: newQuizTitle.trim(),
        description: newQuizDescription.trim(),
        googleFormUrl: newQuizGoogleFormUrl.trim(),
        scheduledDate: scheduledDate,
        duration: duration,
        isActive: true,
        createdBy: user?.uid,
        createdAt: serverTimestamp()
      });

      // Reset form
      setNewQuizTitle('');
      setNewQuizDescription('');
      setNewQuizGoogleFormUrl('');
      setNewQuizScheduledDate(new Date());
      setNewQuizDuration('60');
      setIsAddingQuiz(false);
      
      // Refresh quizzes list
      fetchQuizzes();
      
      Alert.alert('Success', 'Quiz added successfully');
    } catch (err) {
      console.error('Error adding quiz:', err);
      Alert.alert('Error', 'Failed to add quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuizStatus = async (quiz: Quiz) => {
    try {
      await updateDoc(doc(db, 'quizzes', quiz.id), {
        isActive: !quiz.isActive
      });
      
      // Update local state
      setQuizzes(quizzes.map(q => 
        q.id === quiz.id ? { ...q, isActive: !q.isActive } : q
      ));
      
      Alert.alert('Success', `Quiz ${quiz.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error('Error toggling quiz status:', err);
      Alert.alert('Error', 'Failed to update quiz status. Please try again.');
    }
  };

  const deleteQuiz = async (quizId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this quiz? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'quizzes', quizId));
              
              // Update local state
              setQuizzes(quizzes.filter(q => q.id !== quizId));
              
              Alert.alert('Success', 'Quiz deleted successfully');
            } catch (err) {
              console.error('Error deleting quiz:', err);
              Alert.alert('Error', 'Failed to delete quiz. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'No date set';
    try {
      // Handle both Firestore timestamps and regular Date objects
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => {
    return (
      <View style={styles.quizCard}>
        <View style={styles.quizHeader}>
          <Text style={styles.quizTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, item.isActive ? styles.activeStatus : styles.inactiveStatus]}>
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        
        <Text style={styles.quizDescription}>{item.description}</Text>
        
        <View style={styles.quizDetails}>
          <Text style={styles.quizInfo}>Google Form: {item.googleFormUrl}</Text>
          <Text style={styles.quizInfo}>Scheduled: {formatDate(item.scheduledDate)}</Text>
          <Text style={styles.quizInfo}>Duration: {item.duration} minutes</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.toggleButton]}
            onPress={() => toggleQuizStatus(item)}
          >
            <Text style={styles.actionButtonText}>
              {item.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteQuiz(item.id)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAddQuizForm = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Add New Quiz</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Quiz Title"
          value={newQuizTitle}
          onChangeText={setNewQuizTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Quiz Description"
          value={newQuizDescription}
          onChangeText={setNewQuizDescription}
          multiline
        />
        
        <TextInput
          style={styles.input}
          placeholder="Google Form URL"
          value={newQuizGoogleFormUrl}
          onChangeText={setNewQuizGoogleFormUrl}
          keyboardType="url"
        />
        
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeText}>
            {newQuizScheduledDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeText}>
            {newQuizScheduledDate.toLocaleTimeString()}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={newQuizScheduledDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const newDate = new Date(selectedDate);
                newDate.setHours(newQuizScheduledDate.getHours());
                newDate.setMinutes(newQuizScheduledDate.getMinutes());
                setNewQuizScheduledDate(newDate);
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={newQuizScheduledDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const newDate = new Date(selectedTime);
                newDate.setFullYear(newQuizScheduledDate.getFullYear());
                newDate.setMonth(newQuizScheduledDate.getMonth());
                newDate.setDate(newQuizScheduledDate.getDate());
                setNewQuizScheduledDate(newDate);
              }
            }}
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Duration (minutes)"
          value={newQuizDuration}
          onChangeText={setNewQuizDuration}
          keyboardType="number-pad"
        />
        
        <View style={styles.formButtons}>
          <TouchableOpacity 
            style={[styles.formButton, styles.cancelButton]}
            onPress={() => setIsAddingQuiz(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.formButton, styles.submitButton]}
            onPress={addQuiz}
          >
            <Text style={styles.submitButtonText}>Add Quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && quizzes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading quizzes...</Text>
      </View>
    );
  }

  if (error && quizzes.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuizzes}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quizzes</Text>
        <Text style={styles.headerSubtitle}>Manage student quizzes</Text>
      </View>

      {!isAddingQuiz ? (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddingQuiz(true)}
        >
          <Text style={styles.addButtonText}>+ Add New Quiz</Text>
        </TouchableOpacity>
      ) : renderAddQuizForm()}

      {quizzes.length > 0 ? (
        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.quizList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No quizzes available</Text>
          <Text style={styles.emptySubtext}>Create your first quiz by clicking the button above</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200ee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  quizList: {
    padding: 16,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeStatus: {
    backgroundColor: '#4caf50',
  },
  inactiveStatus: {
    backgroundColor: '#f44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  quizDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 4,
  },
  quizInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  toggleButton: {
    backgroundColor: '#ff9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6200ee',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#000',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  formButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#6200ee',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  }});