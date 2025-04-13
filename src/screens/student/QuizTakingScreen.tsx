import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation';

interface QuizQuestion {
  questionText: string;
  questionImage?: string;
  options: string[];
  optionImages?: string[];
  correctOption: number;
}

type QuizTakingScreenRouteProp = RouteProp<RootStackParamList, 'QuizTaking'>;

export const QuizTakingScreen = () => {
  const { user } = useAuth();
  const route = useRoute<QuizTakingScreenRouteProp>();
  const { quiz, onComplete } = route.params;
  
  if (!quiz || !quiz.id || !quiz.questions) {
    console.error('Invalid quiz data:', quiz);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Not Available</Text>
        <Text style={styles.emptyText}>Invalid quiz data was provided. Please try again.</Text>
      </View>
    );
  }
  
  console.log('Quiz data received:', quiz);
  
  const safeQuiz = {
    id: quiz?.id || '',
    title: quiz?.title || '',
    questions: quiz?.questions || [],
    duration: quiz?.duration || 0
  };
  console.log('Safe quiz data:', safeQuiz);
  const [answers, setAnswers] = useState<number[]>(Array(safeQuiz.questions.length).fill(-1));
  const [submitting, setSubmitting] = useState(false);

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const checkPreviousAttempt = async () => {
    if (!user || !user.uid) return false;
    const quizResultsRef = collection(db, 'quizResults');
    const q = query(quizResultsRef, 
      where('quizId', '==', quiz.id),
      where('userId', '==', user.uid)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      
      if (!user || !user.uid) throw new Error('No user authenticated');

      // Check if user has already attempted this quiz
      const hasAttempted = await checkPreviousAttempt();
      if (hasAttempted) {
        Alert.alert('Not Allowed', 'You have already attempted this quiz.');
        onComplete();
        return;
      }

      const resultDoc = doc(collection(db, 'quizResults'));
      await setDoc(resultDoc, {
        quizId: quiz.id,
        userId: user.uid,
        answers,
        score: calculateScore(),
        submittedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Quiz submitted successfully!');
      onComplete();
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateScore = () => {
    return safeQuiz.questions.reduce((acc, question, index) => {
      return acc + (answers[index] === question.correctOption ? 1 : 0);
    }, 0);
  };

  if (!safeQuiz.id || safeQuiz.questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz Not Available</Text>
        <Text style={styles.emptyText}>The quiz data is missing or incomplete. Please try again later.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{safeQuiz.title}</Text>
      
      {safeQuiz.questions.map((question, qIndex) => (
        <View key={qIndex} style={styles.questionContainer}>
          <Text style={styles.questionText}>Q{qIndex + 1}: {question.questionText}</Text>
          {question.questionImage && (
            <Image
              source={{ uri: question.questionImage }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
          
          {question.options.map((option, oIndex) => (
            <TouchableOpacity
              key={oIndex}
              style={[
                styles.optionButton,
                answers[qIndex] === oIndex && styles.selectedOption
              ]}
              onPress={() => handleAnswerSelect(qIndex, oIndex)}
            >
              {question.optionImages?.[oIndex] && (
                <Image
                  source={{ uri: question.optionImages[oIndex] }}
                  style={styles.optionImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={submitQuiz}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#6200ee',
  },
  questionContainer: {
    marginBottom: 25,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: '600',
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    },
    optionImage: {
      width: '100%',
      height: undefined,
      marginBottom: 12,
      borderRadius: 4,
      aspectRatio: 16/9,
    },
    optionText: {
      fontSize: 16,
      marginTop: 8,
    },
  selectedOption: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  questionImage: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
  },
  
});