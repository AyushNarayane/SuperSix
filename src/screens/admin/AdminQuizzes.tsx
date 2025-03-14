import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Quiz } from '../../types/Quiz';

export const AdminQuizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [courseId, setCourseId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const quizzesQuery = query(collection(db, 'quizzes'));
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

  const handleCreateQuiz = async () => {
    if (!title || !googleFormUrl || !scheduledDate || !duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const newQuiz = {
        title,
        description,
        googleFormUrl,
        courseId: courseId || undefined,
        scheduledDate,
        duration: parseInt(duration),
        status: 'scheduled',
        createdBy: user?.uid || '',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'quizzes'), newQuiz);
      
      // Reset form
      resetForm();
      setModalVisible(false);
      
      // Refresh quiz list
      fetchQuizzes();
      
      Alert.alert('Success', 'Quiz created successfully');
    } catch (err) {
      console.error('Error creating quiz:', err);
      Alert.alert('Error', 'Failed to create quiz');
    }
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz || !title || !googleFormUrl || !scheduledDate || !duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const updatedQuiz = {
        title,
        description,
        googleFormUrl,
        courseId: courseId || undefined,
        scheduledDate,
        duration: parseInt(duration),
        status: editingQuiz.status
      };

      await updateDoc(doc(db, 'quizzes', editingQuiz.id), updatedQuiz);
      
      // Reset form
      resetForm();
      setModalVisible(false);
      setEditingQuiz(null);
      
      // Refresh quiz list
      fetchQuizzes();
      
      Alert.alert('Success', 'Quiz updated successfully');
    } catch (err) {
      console.error('Error updating quiz:', err);
      Alert.alert('Error', 'Failed to update quiz');
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    Alert.alert(
      'Delete Quiz',
      'Are you sure you want to delete this quiz?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'quizzes', quizId));
              
              // Refresh quiz list
              fetchQuizzes();
              
              Alert.alert('Success', 'Quiz deleted successfully');
            } catch (err) {
              console.error('Error deleting quiz:', err);
              Alert.alert('Error', 'Failed to delete quiz');
            }
          }
        }
      ]
    );
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description || '');
    setGoogleFormUrl(quiz.googleFormUrl);
    setCourseId(quiz.courseId || '');
    setScheduledDate(quiz.scheduledDate);
    setDuration(quiz.duration.toString());
    setModalVisible(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGoogleFormUrl('');
    setCourseId('');
    setScheduledDate('');
    setDuration('');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => (
    <View style={styles.quizCard}>
      <View style={styles.quizInfo}>
        <Text style={styles.quizTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.quizDescription}>{item.description}</Text>
        )}
        <Text style={styles.quizDetail}>Scheduled: {formatDate(item.scheduledDate)}</Text>
        <Text style={styles.quizDetail}>Duration: {item.duration} minutes</Text>
        <Text style={styles.quizDetail}>
          Status: <Text style={getStatusStyle(item.status)}>{item.status}</Text>
        </Text>
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditQuiz(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteQuiz(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'scheduled':
        return styles.scheduledStatus;
      case 'active':
        return styles.activeStatus;
      case 'completed':
        return styles.completedStatus;
      default:
        return {};
    }
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
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setEditingQuiz(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>Add Quiz</Text>
        </TouchableOpacity>
      </View>

      {quizzes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No quizzes available</Text>
          <Text style={styles.emptySubText}>Create a new quiz to get started</Text>
        </View>
      ) : (
        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingQuiz ? 'Edit Quiz' : 'Create Quiz'}
            </Text>
            
            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Quiz Title"
              />
              
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Quiz Description"
                multiline
              />
              
              <Text style={styles.inputLabel}>Google Form URL *</Text>
              <TextInput
                style={styles.input}
                value={googleFormUrl}
                onChangeText={setGoogleFormUrl}
                placeholder="https://forms.google.com/..."
                keyboardType="url"
              />
              
              <Text style={styles.inputLabel}>Course ID</Text>
              <TextInput
                style={styles.input}
                value={courseId}
                onChangeText={setCourseId}
                placeholder="Course ID (optional)"
              />
              
              <Text style={styles.inputLabel}>Scheduled Date *</Text>
              <TextInput
                style={styles.input}
                value={scheduledDate}
                onChangeText={setScheduledDate}
                placeholder="YYYY-MM-DD"
              />
              
              <Text style={styles.inputLabel}>Duration (minutes) *</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="60"
                keyboardType="numeric"
              />
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
              >
                <Text style={styles.saveButtonText}>
                  {editingQuiz ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quizDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scheduledStatus: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  completedStatus: {
    color: '#9E9E9E',
    fontWeight: 'bold',
  },
  actionContainer: {
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  formContainer: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});