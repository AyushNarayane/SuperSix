import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../config/cloudinary';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User, Payment, TestResult } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { SvgXml } from 'react-native-svg';
import { auth } from '../../config/firebase';

interface QuizResult {
  quizId: string;
  score: number;
  submittedAt: any;
  answers: number[];
}

const StudentProfile = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [uploading, setUploading] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchQuizResults();
    }
  }, [user]);

  const fetchQuizResults = async () => {
    if (!user?.uid) return;
    
    setLoadingResults(true);
    try {
      const resultsRef = collection(db, 'quizResults');
                                                 // First get results by userId only to avoid composite index requirement
      const q = query(
        resultsRef,
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            quizId: data.quizId || doc.id,
            score: data.score || 0,
            submittedAt: data.submittedAt,
            answers: data.answers || [],
          } as QuizResult;
        })
        // Sort results client-side by submittedAt in descending order
        .sort((a, b) => {
          const dateA = a.submittedAt?.toDate() || new Date(0);
          const dateB = b.submittedAt?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      
      setQuizResults(results);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      Alert.alert('Error', 'Failed to load quiz results');
    } finally {
      setLoadingResults(false);
    }
  };

  const pickImage = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setUploading(true);
        try {
          console.log('Starting image upload to Cloudinary...');
          const imageUrl = await uploadImage(result.assets[0].uri);
          console.log('Image uploaded successfully to Cloudinary:', imageUrl);
          
          const userRef = doc(db, 'users', auth.currentUser?.uid || '');
          console.log('Attempting to update Firestore document:', auth.currentUser?.uid);
          
          try {
            await updateDoc(userRef, {
              profile: imageUrl
            });
            console.log('Firestore document updated successfully');
          } catch (error) {
            console.error('Firestore update error:', error);
            if ((error as { code?: string }).code === 'permission-denied') {
              console.error('Permission denied error:', error);
              Alert.alert('Permission Error', 'You don\'t have permission to update your profile');
              return;
            } else if ((error as { code?: string }).code === 'resource-exhausted') {
              console.error('Resource exhausted error:', error);
              Alert.alert('Error', 'Too many requests. Please try again later.');
              return;
            } else if ((error as Error).toString().includes('ERR_BLOCKED_BY_CLIENT')) {
              console.error('Client blocked error:', error);
              Alert.alert('Error', 'Profile update blocked by browser. Please check your browser settings.');
              return;
            } else {
              console.error('Unknown Firestore error:', error);
              Alert.alert('Error', 'Profile picture uploaded but failed to save. Please try again.');
              return;
            }
          }
          Alert.alert('Success', 'Profile picture updated successfully');
        } catch (error) {
          console.error('Error in upload process:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
          Alert.alert('Error', errorMessage);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to pick image';
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.emptyText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Unable to load profile. Please try again.</Text>
      </View>
    );
  }

  const renderProfilePicture = () => (
    <View style={styles.profilePictureContainer}>
      <TouchableOpacity onPress={pickImage} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator size="large" color="#ff6b6b" style={styles.profilePicture} />
        ) : (
          user.profile ? (
            <Image
              source={{ uri: user.profile }}
              style={styles.profilePicture}
            />
          ) : (
            <SvgXml
              width={120}
              height={120}
              xml={require('../../../assets/default-avatar.svg')}
              style={styles.profilePicture}
            />
          )
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={pickImage} style={styles.uploadButton} disabled={uploading}>
        <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Change Photo'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{user.name}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email || 'Not provided'}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{user.phone}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Branch:</Text>
        <Text style={styles.value}>{user.branch || 'Not specified'}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>District:</Text>
        <Text style={styles.value}>{user.address?.district || 'Not specified'}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Tehsil:</Text>
        <Text style={styles.value}>{user.address?.tehsil || 'Not specified'}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Village:</Text>
        <Text style={styles.value}>{user.address?.village || 'Not specified'}</Text>
      </View>
      <View style={styles.infoItem}>
        <Text style={styles.label}>Street:</Text>
        <Text style={styles.value}>{user.address?.street || 'Not specified'}</Text>
      </View>
    </View>
  );

  const renderCourses = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Enrolled Courses</Text>
      {user.coursesEnrolled.length > 0 ? (
        user.coursesEnrolled.map((course, index) => (
          <View key={index} style={styles.courseItem}>
            <Text style={styles.courseTitle}>{course}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No courses enrolled</Text>
      )}
    </View>
  );

  const renderPerformance = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Performance</Text>
      
      <View style={styles.quizTabContainer}>
        <Text style={[styles.tabTitle, styles.sectionSubtitle]}>Quiz Results</Text>
        {loadingResults ? (
          <ActivityIndicator size="small" color="#6200ee" />
        ) : quizResults.length > 0 ? (
          quizResults.map((result, index) => (
            <View key={index} style={styles.quizResultItem}>
              <View style={styles.quizResultHeader}>
                <Text style={styles.quizScore}>Score: {result.score}/{result.answers.length}</Text>
                <Text style={styles.quizDate}>
                  {result.submittedAt?.toDate().toLocaleDateString() || 'Date not available'}
                </Text>
              </View>
              <Text style={styles.quizId}>Quiz ID: {result.quizId}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No quiz results available</Text>
        )}
      </View>

      <View style={styles.quizTabContainer}>
        <Text style={[styles.tabTitle, styles.sectionSubtitle]}>Other Assessments</Text>
        {user.performance && user.performance.length > 0 ? (
          user.performance.map((result, index) => (
            <View key={index} style={styles.performanceItem}>
              <Text style={styles.testName}>{result.test}</Text>
              <Text style={styles.score}>Score: {result.score}</Text>
              <Text style={styles.date}>Date: {result.date}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No assessment data available</Text>
        )}
      </View>
    </View>
  );

  const renderPayments = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Payment History</Text>
      {user.payments.length > 0 ? (
        user.payments.map((payment, index) => (
          <View key={index} style={styles.paymentItem}>
            <Text style={styles.amount}>Amount: ₹{payment.amount}</Text>
            <Text style={styles.paymentType}>Type: {payment.type}</Text>
            <Text style={styles.paymentStatus}>Status: {payment.status}</Text>
            <Text style={styles.date}>Date: {payment.date}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No payment history available</Text>
      )}
    </View>
  );

  const renderAssignments = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Assignments</Text>
      <Text style={styles.emptyText}>No assignments available</Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return renderBasicInfo();
      case 'courses':
        return renderCourses();
      case 'performance':
        return renderPerformance();
      case 'payments':
        return renderPayments();
      case 'assignments':
        return renderAssignments();
      default:
        return renderBasicInfo();
    }
  };

  return (
    <View style={styles.container}>
      {renderProfilePicture()}
      <View style={styles.tabNavigationBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabButton title="Info" isActive={activeTab === 'info'} onPress={() => setActiveTab('info')} />
          <TabButton title="Courses" isActive={activeTab === 'courses'} onPress={() => setActiveTab('courses')} />
          <TabButton title="Performance" isActive={activeTab === 'performance'} onPress={() => setActiveTab('performance')} />
          <TabButton title="Payments" isActive={activeTab === 'payments'} onPress={() => setActiveTab('payments')} />
          <TabButton title="Assignments" isActive={activeTab === 'assignments'} onPress={() => setActiveTab('assignments')} />
        </ScrollView>
      </View>
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
  <View style={[styles.tab, isActive && styles.activeTab]}>
    <Text style={[styles.tabText, isActive && styles.activeTabText]} onPress={onPress}>
      {title}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  tabNavigationBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  quizTabContainer: {
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#6200ee',
  },
  quizResultItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  quizResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  quizScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ee',
  },
  quizDate: {
    fontSize: 14,
    color: '#666',
  },
  quizId: {
    fontSize: 14,
    color: '#888',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff6b6b',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  label: {
    width: 80,
    fontSize: 16,
    color: '#666',
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  courseItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 16,
    color: '#333',
  },
  performanceItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 10,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  score: {
    fontSize: 15,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  paymentItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 10,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  paymentType: {
    fontSize: 15,
    color: '#666',
  },
  paymentStatus: {
    fontSize: 15,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default StudentProfile;