import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types';

interface StudentWithId extends User {
  id: string;
}

export const AdminStudents = () => {
  const [students, setStudents] = useState<StudentWithId[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithId[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'wardha' | 'nagpur' | 'butibori' | 'akola'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithId | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentWithId[];

      setStudents(studentsList);
      setFilteredStudents(studentsList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = students;
    
    // Apply search query filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone.includes(searchQuery)
      );
    }
    
    // Apply branch filter
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(student => student.branch === selectedBranch);
    }
    
    setFilteredStudents(filtered);
  }, [searchQuery, selectedBranch, students]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const handleViewDetails = (student: StudentWithId) => {
    setSelectedStudent(student);
  };

  const handleCloseDetails = () => {
    setSelectedStudent(null);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!studentId) {
      console.error('Cannot remove student: studentId is undefined or null');
      Alert.alert('Error', 'Cannot remove student: Invalid student ID');
      return;
    }

    console.log('Attempting to remove student with ID:', studentId);
    
    Alert.alert(
      'Remove Student',
      'Are you sure you want to remove this student? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting document from users collection with ID:', studentId);
              const studentRef = doc(db, 'users', studentId);
              
              // Add more detailed logging
              console.log('Student reference:', studentRef);
              
              // Use a try-catch specifically for the deleteDoc operation
              try {
                await deleteDoc(studentRef);
                console.log('Document deleted successfully');
                
                // Update the UI state
                setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
                setSelectedStudent(null);
                Alert.alert('Success', 'Student removed successfully');
              } catch (deleteErr) {
                console.error('Firebase deleteDoc error:', deleteErr);
                console.error('Error details:', JSON.stringify(deleteErr));
                
                // Check if it's a network-related error
                if (deleteErr instanceof Error && 
                    (deleteErr.message.includes('network') || 
                     deleteErr.message.includes('ERR_BLOCKED_BY_CLIENT') || 
                     deleteErr.message.includes('NETWORK_ERROR'))) {
                  Alert.alert(
                    'Network Error', 
                    'Unable to connect to the server. This might be due to network issues or a firewall/content blocker. Please check your internet connection and disable any content blockers for this site.',
                    [{ text: 'OK' }]
                  );
                  return; // Don't re-throw, we've handled it
                }
                
                throw deleteErr; // Re-throw other errors to be caught by outer catch
              }
            } catch (err) {
              console.error('Error removing student:', err);
              Alert.alert('Error', `Failed to remove student: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  const renderStudentItem = ({ item }: { item: StudentWithId }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name || 'Unnamed Student'}</Text>
        <Text style={styles.studentDetail}>{item.email || 'No email'}</Text>
        <Text style={styles.studentDetail}>Phone: {item.phone || 'No phone'}</Text>
        <Text style={styles.studentDetail}>
          Courses: {item.coursesEnrolled?.length || 0}
        </Text>
        <Text style={styles.studentDetail}>
          Branch: {item.branch || 'Not specified'}
        </Text>
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewDetails(item)}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStudentDetails = () => {
    if (!selectedStudent) return null;

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>Student Details</Text>
          <TouchableOpacity onPress={handleCloseDetails}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContent}>
          <Text style={styles.detailsName}>{selectedStudent.name || 'Unnamed Student'}</Text>
          <Text style={styles.detailsItem}>Email: {selectedStudent.email || 'No email'}</Text>
          <Text style={styles.detailsItem}>Phone: {selectedStudent.phone || 'No phone'}</Text>
          <Text style={styles.detailsItem}>Branch: {selectedStudent.branch || 'Not specified'}</Text>
          <Text style={styles.detailsItem}>Address: {selectedStudent.address ? `${selectedStudent.address.district}, ${selectedStudent.address.tehsil}, ${selectedStudent.address.village}${selectedStudent.address.street ? `, ${selectedStudent.address.street}` : ''}` : 'No address'}</Text>
          <Text style={styles.detailsItem}>Secondary Phone: {selectedStudent.secondaryPhone || 'None'}</Text>
          
          <Text style={styles.sectionTitle}>Enrolled Courses</Text>
          {selectedStudent.coursesEnrolled && selectedStudent.coursesEnrolled.length > 0 ? (
            selectedStudent.coursesEnrolled.map((course, index) => (
              <Text key={index} style={styles.courseItem}>{course}</Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No courses enrolled</Text>
          )}

          <Text style={styles.sectionTitle}>Payment History</Text>
          {selectedStudent.payments && selectedStudent.payments.length > 0 ? (
            selectedStudent.payments.map((payment, index) => (
              <View key={index} style={styles.paymentItem}>
                <Text>Amount: ₹{payment.amount}</Text>
                <Text>Date: {payment.date}</Text>
                <Text>Status: {payment.status}</Text>
                <Text>Type: {payment.type}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No payment history</Text>
          )}

          <Text style={styles.sectionTitle}>Performance</Text>
          {selectedStudent.performance && selectedStudent.performance.length > 0 ? (
            selectedStudent.performance.map((result, index) => (
              <View key={index} style={styles.performanceItem}>
                <Text>Test: {result.test}</Text>
                <Text>Score: {result.score}</Text>
                <Text>Date: {result.date}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No performance data</Text>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => Alert.alert('Info', 'Edit functionality to be implemented')}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemoveStudent(selectedStudent.id)}
            >
              <Text style={styles.actionButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStudents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedStudent ? (
        renderStudentDetails()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Students</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email or phone"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <View style={styles.branchFilterContainer}>
              <Text style={styles.filterLabel}>Filter by Branch:</Text>
              <View style={styles.branchButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.branchButton, selectedBranch === 'all' && styles.activeBranchButton]}
                  onPress={() => setSelectedBranch('all')}
                >
                  <Text style={[styles.branchButtonText, selectedBranch === 'all' && styles.activeBranchText]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.branchButton, selectedBranch === 'wardha' && styles.activeBranchButton]}
                  onPress={() => setSelectedBranch('wardha')}
                >
                  <Text style={[styles.branchButtonText, selectedBranch === 'wardha' && styles.activeBranchText]}>Wardha</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.branchButton, selectedBranch === 'nagpur' && styles.activeBranchButton]}
                  onPress={() => setSelectedBranch('nagpur')}
                >
                  <Text style={[styles.branchButtonText, selectedBranch === 'nagpur' && styles.activeBranchText]}>Nagpur</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.branchButton, selectedBranch === 'butibori' && styles.activeBranchButton]}
                  onPress={() => setSelectedBranch('butibori')}
                >
                  <Text style={[styles.branchButtonText, selectedBranch === 'butibori' && styles.activeBranchText]}>Butibori</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.branchButton, selectedBranch === 'akola' && styles.activeBranchButton]}
                  onPress={() => setSelectedBranch('akola')}
                >
                  <Text style={[styles.branchButtonText, selectedBranch === 'akola' && styles.activeBranchText]}>Akola</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <FlatList
            data={filteredStudents}
            renderItem={renderStudentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No students match your search' : 'No students found'}
                </Text>
              </View>
            }
          />
        </>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  branchFilterContainer: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  branchButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  branchButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeBranchButton: {
    backgroundColor: '#6200ee',
  },
  branchButtonText: {
    fontSize: 12,
    color: '#333',
  },
  activeBranchText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  studentDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  actionContainer: {
    marginLeft: 16,
  },
  viewButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  viewButtonText: {
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#6200ee',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    color: '#fff',
    fontSize: 16,
  },
  detailsContent: {
    padding: 16,
  },
  detailsName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  detailsItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  courseItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  paymentItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  performanceItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  editButton: {
    backgroundColor: '#6200ee',
  },
  removeButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});