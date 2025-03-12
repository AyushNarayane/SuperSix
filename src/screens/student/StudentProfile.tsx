import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  coursesEnrolled: string[];
  payments: Payment[];
  performance: Performance[];
}

interface Payment {
  amount: number;
  date: string;
  status: 'paid' | 'pending';
  description: string;
}

interface Performance {
  test: string;
  score: number;
  date: string;
}

export const StudentProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'courses' | 'performance' | 'payments'>('info');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          setError('User profile not found');
        }
      } catch (err) {
        setError('Failed to load profile data');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Name:</Text>
        <Text style={styles.infoValue}>{profile?.name || 'Not available'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Email:</Text>
        <Text style={styles.infoValue}>{profile?.email || 'Not available'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Phone:</Text>
        <Text style={styles.infoValue}>{profile?.phone || 'Not available'}</Text>
      </View>
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCoursesTab = () => (
    <View style={styles.tabContent}>
      {profile?.coursesEnrolled && profile.coursesEnrolled.length > 0 ? (
        profile.coursesEnrolled.map((course, index) => (
          <View key={index} style={styles.courseItem}>
            <Text style={styles.courseTitle}>{course === 'class4' ? 'Class 4 Course' : 'Class 8 Course'}</Text>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No courses enrolled</Text>
      )}
    </View>
  );

  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      {profile?.performance && profile.performance.length > 0 ? (
        profile.performance.map((item, index) => (
          <View key={index} style={styles.performanceItem}>
            <Text style={styles.performanceTest}>{item.test}</Text>
            <Text style={styles.performanceScore}>{item.score}%</Text>
            <Text style={styles.performanceDate}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No performance data available</Text>
      )}
    </View>
  );

  const renderPaymentsTab = () => (
    <View style={styles.tabContent}>
      {profile?.payments && profile.payments.length > 0 ? (
        profile.payments.map((payment, index) => (
          <View key={index} style={styles.paymentItem}>
            <View>
              <Text style={styles.paymentDescription}>{payment.description}</Text>
              <Text style={styles.paymentDate}>{new Date(payment.date).toLocaleDateString()}</Text>
            </View>
            <View>
              <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
              <Text style={[styles.paymentStatus, payment.status === 'paid' ? styles.paidStatus : styles.pendingStatus]}>
                {payment.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No payment history</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://via.placeholder.com/100' }} 
          style={styles.profileImage} 
        />
        <Text style={styles.profileName}>{profile?.name || 'Student'}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'info' && styles.activeTabButton]} 
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'courses' && styles.activeTabButton]} 
          onPress={() => setActiveTab('courses')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'courses' && styles.activeTabText]}>Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'performance' && styles.activeTabButton]} 
          onPress={() => setActiveTab('performance')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'performance' && styles.activeTabText]}>Performance</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'payments' && styles.activeTabButton]} 
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'payments' && styles.activeTabText]}>Payments</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'info' && renderInfoTab()}
      {activeTab === 'courses' && renderCoursesTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'payments' && renderPaymentsTab()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#6200ee',
  },
  tabButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  tabContent: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  infoLabel: {
    width: 80,
    fontWeight: 'bold',
    color: '#333',
  },
  infoValue: {
    flex: 1,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  viewButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  viewButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  performanceTest: {
    flex: 2,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  performanceScore: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    textAlign: 'center',
  },
  performanceDate: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 5,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  paidStatus: {
    backgroundColor: '#e6f7ed',
    color: '#00a651',
  },
  pendingStatus: {
    backgroundColor: '#fff4e5',
    color: '#ff9800',
  },
});