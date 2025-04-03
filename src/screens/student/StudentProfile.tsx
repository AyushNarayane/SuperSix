import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { User, Payment, TestResult } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const StudentProfile = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

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
      {user.performance.length > 0 ? (
        user.performance.map((result, index) => (
          <View key={index} style={styles.performanceItem}>
            <Text style={styles.testName}>{result.test}</Text>
            <Text style={styles.score}>Score: {result.score}</Text>
            <Text style={styles.date}>Date: {result.date}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No performance data available</Text>
      )}
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
      <View style={styles.tabContainer}>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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