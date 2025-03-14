import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { collection, query, getDocs, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Quiz, QuizResult } from '../../types/Quiz';

export const StudentQuiz = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myQuizResults, setMyQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect triggered, user:', user?.uid);
    // Remove the early return to ensure quizzes are fetched even if user is not fully loaded
    fetchQuizzes();
    
    // Only fetch quiz results if user is logged in
    if (user?.uid) {
      fetchMyQuizResults();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    try {
      console.log('Fetching quizzes...');
      setLoading(true);
      setError(null);
      
      // Get all quizzes
      const quizzesQuery = query(collection(db, 'quizzes'));
      const quizzesSnapshot = await getDocs(quizzesQuery);
      console.log('Quizzes snapshot:', quizzesSnapshot.size, 'documents found');
      
      if (quizzesSnapshot.empty) {
        console.log('No quizzes found in the database');
        setQuizzes([]);
        setLoading(false);
        return;
      }
      
      const quizzesList = quizzesSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Quiz data:', data);
        return {
          id: doc.id,
          ...data
        };
      }) as Quiz[];
      
      console.log('Processed quizzes:', quizzesList.length);
      
      // Filter quizzes by student's courses if needed
      // For now, we'll show all quizzes
      setQuizzes(quizzesList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const fetchMyQuizResults = async () => {
    if (!user?.uid) return;
    
    try {
      const resultsQuery = query(
        collection(db, 'quizResults'),
        where('studentId', '==', user.uid)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsList = resultsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizResult[];
      
      setMyQuizResults(resultsList);
    } catch (err) {
      console.error('Error fetching quiz results:', err);
      // We'll still show quizzes even if results fail to load
    }
  };

  const getQuizStatus = (quiz: Quiz) => {
    const result = myQuizResults.find(r => r.quizId === quiz.id);
    
    if (!result) {
      return 'Not Started';
    }
    
    return result.status === 'completed' ? 'Completed' : 'In Progress';
  };

  const getQuizScore = (quiz: Quiz) => {
    const result = myQuizResults.find(r => r.quizId === quiz.id);
    
    if (!result || !result.score) {
      return 'Not Available';
    }
    
    return result.score.toString();
  };

  const handleStartQuiz = async (quiz: Quiz) => {
    if (!user?.uid) {
      Alert.alert('Error', 'You need to be logged in to start a quiz');
      return;
    }

    if (!quiz.googleFormUrl) {
      Alert.alert('Error', 'This quiz does not have a valid URL');
      return;
    }
    
    try {
      // Validate URL first
      const url = quiz.googleFormUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid quiz URL format');
      }

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error('Cannot open quiz URL');
      }

      // Check if there's already a result for this quiz
      const existingResult = myQuizResults.find(r => r.quizId === quiz.id);
      
      if (!existingResult) {
        try {
          // Create a new quiz result
          const newQuizResult = {
            quizId: quiz.id,
            studentId: user.uid,
            studentName: user.name || 'Student',
            status: 'started' as 'assigned' | 'started' | 'completed',
            startedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          };
          
          const docRef = await addDoc(collection(db, 'quizResults'), newQuizResult);
          console.log('Quiz result created successfully with ID:', docRef.id);
          
          // Update local state
          setMyQuizResults(prevResults => [
            ...prevResults,
            { id: docRef.id, ...newQuizResult }
          ]);
        } catch (firebaseErr) {
          console.error('Firebase error:', firebaseErr);
          throw new Error('Failed to save quiz progress. Please check your connection.');
        }
      }
      
      // Open the quiz URL
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error starting quiz:', err);
      Alert.alert(
        'Error',
        err instanceof Error 
          ? err.message 
          : 'Failed to start quiz. Please check your connection and try again.'
      );
    }
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

  const renderQuizItem = ({ item }: { item: Quiz }) => {
    const status = getQuizStatus(item);
    const isCompleted = status === 'Completed';
    
    return (
      <View style={styles.quizCard}>
        <View style={styles.quizInfo}>
          <Text style={styles.quizTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.quizDescription}>{item.description}</Text>
          )}
          <Text style={styles.quizDetail}>Scheduled: {formatDate(item.scheduledDate)}</Text>
          <Text style={styles.quizDetail}>Duration: {item.duration} minutes</Text>
          <Text style={styles.quizDetail}>
            Status: <Text style={getStatusStyle(status)}>{status}</Text>
          </Text>
          {isCompleted && (
            <Text style={styles.quizDetail}>
              Score: <Text style={styles.scoreText}>{getQuizScore(item)}</Text>
            </Text>
          )}
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.startButton, isCompleted && styles.disabledButton]}
            onPress={() => handleStartQuiz(item)}
            disabled={isCompleted}
          >
            <Text style={styles.startButtonText}>
              {isCompleted ? 'Completed' : 'Start Quiz'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Not Started':
        return styles.notStartedStatus;
      case 'In Progress':
        return styles.inProgressStatus;
      case 'Completed':
        return styles.completedStatus;
      default:
        return {};
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Quizzes</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading quizzes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuizzes}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : quizzes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No quizzes available</Text>
          <Text style={styles.emptySubText}>Check back later for new quizzes</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuizzes}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
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
  notStartedStatus: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  inProgressStatus: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  completedStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  scoreText: {
    fontWeight: 'bold',
    color: '#333',
  },
  actionContainer: {
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
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
});