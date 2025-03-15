import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
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
}

export const StudentQuiz = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchQuizzes().finally(() => setRefreshing(false));
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current date
      const now = new Date();
      
      // Query active quizzes without requiring composite index
      const quizzesQuery = query(
        collection(db, 'quizzes'),
        where('isActive', '==', true)
      );

      const quizzesSnapshot = await getDocs(quizzesQuery);
      const quizzesList = quizzesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quiz[];

      setQuizzes(quizzesList);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(
        err instanceof Error
          ? `Failed to load quizzes: ${err.message}`
          : 'Failed to load quizzes. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const takeQuiz = (quiz: Quiz) => {
    // Check if the quiz is available to take
    const now = new Date();
    const quizDate = quiz.scheduledDate?.toDate();
    
    if (!quizDate) {
      Alert.alert('Error', 'This quiz has no scheduled date.');
      return;
    }
    
    // Add a buffer of 10 minutes before quiz starts
    const startBuffer = new Date(quizDate.getTime() - 10 * 60000);
    // Calculate end time based on duration
    const endTime = new Date(quizDate.getTime() + quiz.duration * 60000);
    
    if (now < startBuffer) {
      Alert.alert('Not Available', `This quiz will be available 10 minutes before the scheduled time: ${quizDate.toLocaleString()}.`);
      return;
    }
    
    if (now > endTime) {
      Alert.alert('Expired', 'This quiz has ended.');
      return;
    }
    
    // Open the Google Form URL
    Linking.openURL(quiz.googleFormUrl).catch(err => {
      console.error('Error opening quiz URL:', err);
      Alert.alert('Error', 'Could not open the quiz. Please try again.');
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'No date set';
    try {
      const date = timestamp.toDate();
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => {
    const now = new Date();
    const quizDate = item.scheduledDate?.toDate();
    const endTime = quizDate ? new Date(quizDate.getTime() + item.duration * 60000) : null;
    
    let status = 'Upcoming';
    let statusStyle = styles.upcomingStatus;
    
    if (quizDate && now > quizDate && endTime && now < endTime) {
      status = 'In Progress';
      statusStyle = styles.activeStatus;
    } else if (endTime && now > endTime) {
      status = 'Ended';
      statusStyle = styles.endedStatus;
    }

    return (
      <TouchableOpacity 
        style={styles.quizCard}
        onPress={() => takeQuiz(item)}
      >
        <View style={styles.quizHeader}>
          <Text style={styles.quizTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        <Text style={styles.quizDescription}>{item.description}</Text>
        <View style={styles.quizDetails}>
          <Text style={styles.quizInfo}>Scheduled: {formatDate(item.scheduledDate)}</Text>
          <Text style={styles.quizInfo}>Duration: {item.duration} minutes</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading quizzes...</Text>
      </View>
    );
  }

  if (error) {
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
        <Text style={styles.headerSubtitle}>Take your scheduled quizzes</Text>
      </View>

      {quizzes.length > 0 ? (
        <FlatList
          data={quizzes}
          renderItem={renderQuizItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.quizList}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No quizzes available at the moment</Text>
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
  upcomingStatus: {
    backgroundColor: '#e0e0e0',
  },
  activeStatus: {
    backgroundColor: '#4caf50',
  },
  endedStatus: {
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default StudentQuiz;