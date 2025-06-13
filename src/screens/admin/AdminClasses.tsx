import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LiveClass } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface ClassWithId extends LiveClass {
  id: string;
  description?: string;
  zoomLink?: string;
}

export const AdminClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassWithId[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassWithId[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassWithId | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newClass, setNewClass] = useState({
    title: '',
    description: '',
    courseId: '',
    startTime: '',
    endTime: '',
    zoomLink: '',
    duration: 0,
    status: 'scheduled' as 'scheduled' | 'ongoing' | 'completed',
    createdBy: '',
    createdAt: ''
  });
  const [editMode, setEditMode] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const classesQuery = query(collection(db, 'classes'));
      const classesSnapshot = await getDocs(classesQuery);
      const classesList = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClassWithId[];

      setClasses(classesList);
      setFilteredClasses(classesList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClasses(classes);
    } else {
      const filtered = classes.filter(cls => 
        cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClasses(filtered);
    }
  }, [searchQuery, classes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  const handleViewDetails = (cls: ClassWithId) => {
    setSelectedClass(cls);
  };

  const handleCloseDetails = () => {
    setSelectedClass(null);
  };

  const handleAddClass = () => {
    setEditMode(false);
    setNewClass({
      title: '',
      description: '',
      courseId: '',
      startTime: '',
      endTime: '',
      zoomLink: '',
      duration: 0,
      status: 'scheduled' as 'scheduled' | 'ongoing' | 'completed',
      createdBy: '',
      createdAt: new Date().toISOString()
    });
    setModalVisible(true);
  };

  const handleEditClass = (cls: ClassWithId) => {
    setEditMode(true);
    setNewClass({
      title: cls.title,
      description: cls.description || '',
      courseId: cls.courseId || '',
      startTime: cls.startTime || '',
      endTime: cls.endTime || '',
      zoomLink: cls.zoomLink || '',
      duration: cls.duration || 0,
      createdBy: cls.createdBy || '',
      createdAt: cls.createdAt || '',
      status: cls.status || 'scheduled'
    });
    setSelectedClass(cls);
    setModalVisible(true);
  };

  const handleSaveClass = async () => {
    if (!newClass.title.trim()) {
      Alert.alert('Error', 'Class title is required');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to perform this action');
      return;
    }

    try {
      if (editMode && selectedClass) {
        // Update existing class
        await updateDoc(doc(db, 'classes', selectedClass.id), {
          title: newClass.title,
          description: newClass.description,
          courseId: newClass.courseId,
          startTime: newClass.startTime,
          endTime: newClass.endTime,
          zoomLink: newClass.zoomLink,
          duration: newClass.duration,
          status: newClass.status,
          createdBy: user.name,
          updatedAt: serverTimestamp()
        });

        setClasses(classes.map(cls => 
          cls.id === selectedClass.id ? 
          { ...cls, ...newClass, updatedAt: new Date() } : 
          cls
        ));

        Alert.alert('Success', 'Class updated successfully');
      } else {
        // Add new class
        const newClassData = {
          title: newClass.title,
          description: newClass.description,
          courseId: newClass.courseId,
          startTime: newClass.startTime,
          endTime: newClass.endTime,
          zoomLink: newClass.zoomLink,
          duration: newClass.duration,
          status: newClass.status,
          createdBy: user.name,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'classes'), newClassData);
        setClasses([...classes, { id: docRef.id, ...newClassData, createdAt: new Date().toISOString() } as ClassWithId]);

        Alert.alert('Success', 'Class added successfully');
      }

      setModalVisible(false);
      setSelectedClass(null);
    } catch (err) {
      console.error('Error saving class:', err);
      Alert.alert('Error', 'Failed to save class. Please try again.');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteDoc(doc(db, 'classes', classId));
      setClasses(classes.filter(cls => cls.id !== classId));
      setSelectedClass(null);
    } catch (err) {
      console.error('Error deleting class:', err);
      Alert.alert('Error', 'Failed to delete class');
    }
  };

  const renderClassItem = ({ item }: { item: ClassWithId }) => (
    <TouchableOpacity 
      style={styles.classCard}
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.classInfo}>
        <Text style={styles.classTitle}>{item.title}</Text>
        <Text style={styles.classDetail}>Start: {item.startTime}</Text>
        <Text style={styles.classDetail}>End: {item.endTime}</Text>
        <Text style={styles.classDetail}>Status: {item.status}</Text>
        {item.description && (
          <Text style={styles.classDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewDetails(item)}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteClass(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderClassDetails = () => {
    if (!selectedClass) return null;

    return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>Class Details</Text>
          <TouchableOpacity onPress={handleCloseDetails}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContent}>
          <Text style={styles.detailsName}>{selectedClass.title}</Text>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Course ID:</Text>
            <Text style={styles.detailsValue}>{selectedClass.courseId || 'Not specified'}</Text>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Start Time:</Text>
            <Text style={styles.detailsValue}>{selectedClass.startTime || 'Not specified'}</Text>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>End Time:</Text>
            <Text style={styles.detailsValue}>{selectedClass.endTime || 'Not specified'}</Text>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Zoom Link:</Text>
            <Text style={styles.detailsValue}>{selectedClass.zoomLink || 'Not specified'}</Text>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Duration:</Text>
            <Text style={styles.detailsValue}>{selectedClass.duration} minutes</Text>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Created By:</Text>
            <Text style={styles.detailsValue}>{selectedClass.createdBy || 'Not specified'}</Text>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Created At:</Text>
            <Text style={styles.detailsValue}>{new Date(selectedClass.createdAt).toLocaleString() || 'Not specified'}</Text>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Status:</Text>
            <Text style={styles.detailsValue}>{selectedClass.status || 'Not specified'}</Text>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Description:</Text>
            <Text style={styles.detailsValue}>{selectedClass.description || 'No description provided'}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEditClass(selectedClass)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteClass(selectedClass.id)}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderClassForm = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Class' : 'Add New Class'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.formScrollContainer}>
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={newClass.title}
                onChangeText={(text) => setNewClass({...newClass, title: text})}
                placeholder="Class title"
              />

              <Text style={styles.inputLabel}>Course ID</Text>
              <TextInput
                style={styles.input}
                value={newClass.courseId}
                onChangeText={(text) => setNewClass({...newClass, courseId: text})}
                placeholder="Course ID"
              />

              <Text style={styles.inputLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={newClass.startTime}
                onChangeText={(text) => setNewClass({...newClass, startTime: text})}
                placeholder="YYYY-MM-DD HH:mm"
              />

              <Text style={styles.inputLabel}>End Time</Text>
              <TextInput
                style={styles.input}
                value={newClass.endTime}
                onChangeText={(text) => setNewClass({...newClass, endTime: text})}
                placeholder="YYYY-MM-DD HH:mm"
              />

              <Text style={styles.inputLabel}>Zoom Link</Text>
              <TextInput
                style={styles.input}
                value={newClass.zoomLink}
                onChangeText={(text) => setNewClass({...newClass, zoomLink: text})}
                placeholder="https://zoom.us/j/..."
              />

              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={String(newClass.duration)}
                onChangeText={(text) => setNewClass({...newClass, duration: parseInt(text) || 0})}
                placeholder="Enter duration in minutes"
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Status</Text>
              <TextInput
                style={styles.input}
                value={newClass.status}
                onChangeText={(text) => setNewClass({...newClass, status: text as 'scheduled' | 'ongoing' | 'completed'})}
                placeholder="scheduled, ongoing, or completed"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newClass.description}
                onChangeText={(text) => setNewClass({...newClass, description: text})}
                placeholder="Class description"
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveClass}
              >
                <Text style={styles.saveButtonText}>Add Class</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchClasses}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedClass && !modalVisible ? (
        renderClassDetails()
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>Classes</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddClass}
              >
                <Text style={styles.addButtonText}>+ Add Class</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredClasses}
            renderItem={renderClassItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No classes match your search' : 'No classes found'}
                </Text>
                <TouchableOpacity 
                  style={styles.addEmptyButton}
                  onPress={handleAddClass}
                >
                  <Text style={styles.addEmptyButtonText}>Add Class</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}
      {renderClassForm()}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  listContent: {
    padding: 16,
  },
  classCard: {
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
  classInfo: {
    flex: 1,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  classDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  classDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    marginBottom: 16,
  },
  addEmptyButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addEmptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  detailsSection: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  detailsLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsValue: {
    flex: 1,
    color: '#666',
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
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
    flex: 1
  },
  formScrollContainer: {
    
    flexGrow: 1,
    padding: 0,
    backgroundColor: '#fff'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#6200ee',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});