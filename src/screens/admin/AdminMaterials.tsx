import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { db } from '../../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import { StudyMaterial } from '../../types';
import { uploadPDF } from '../../config/uploadthing';

const AdminMaterials = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);

  useEffect(() => {
    // Subscribe to study materials collection
    const q = query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const materialsData: StudyMaterial[] = [];
      querySnapshot.forEach((doc) => {
        materialsData.push({ id: doc.id, ...doc.data() } as StudyMaterial);
      });
      setMaterials(materialsData);
    }, (error) => {
      console.error('Error fetching materials:', error);
      Alert.alert('Error', 'Failed to load study materials');
    });

    return () => unsubscribe();
  }, []);

  const handleUpload = async () => {
    try {
      setUploading(true);
      
      // Pick a document (PDF)
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      // Get the file URI
      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name || 'Unnamed document';

      // Store selected file info and show modal
      setSelectedFile({ uri: fileUri, name: fileName });
      setMaterialTitle('');
      setCourseId('');
      setModalVisible(true);
      setUploading(false);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
      setUploading(false);
    }
  };

  const handleSubmitMaterial = async () => {
    if (!materialTitle.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!courseId.trim()) {
      Alert.alert('Error', 'Course ID is required');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'No file selected');
      return;
    }

    try {
      setUploading(true);
      setModalVisible(false);
      
      // Upload file to UploadThing
      const response = await uploadPDF.uploadFile(selectedFile.uri);
      
      if (!response?.url) {
        throw new Error('Failed to get upload URL');
      }

      // Save metadata to Firestore
      await addDoc(collection(db, 'studyMaterials'), {
        title: materialTitle,
        courseId,
        uploadDate: new Date().toISOString(),
        type: 'pdf',
        fileName: selectedFile.name,
        fileUrl: response.url
      });

      Alert.alert('Success', 'Material uploaded successfully');
      
      // Reset form
      setSelectedFile(null);
      setMaterialTitle('');
      setCourseId('');
    } catch (error) {
      console.error('Error in upload process:', error);
      Alert.alert('Error', 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (material: StudyMaterial) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${material.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Delete from Firestore
              await deleteDoc(doc(db, 'studyMaterials', material.id));
              
              Alert.alert('Success', 'Material deleted successfully');
            } catch (error) {
              console.error('Error deleting material:', error);
              Alert.alert('Error', 'Failed to delete material');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: StudyMaterial }) => (
    <View style={styles.materialItem}>
      <View style={styles.materialInfo}>
        <Text style={styles.materialTitle}>{item.title}</Text>
        <Text style={styles.materialDetails}>Course: {item.courseId}</Text>
        <Text style={styles.materialDetails}>
          Uploaded: {new Date(item.uploadDate).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        disabled={loading}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Materials</Text>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload New</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0066cc" />
      ) : (
        <FlatList
          data={materials}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No study materials available</Text>
          }
        />
      )}

      {/* Material Upload Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedFile(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Study Material</Text>
            
            {selectedFile && (
              <Text style={styles.fileInfo}>File: {selectedFile.name}</Text>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Material Title"
              value={materialTitle}
              onChangeText={setMaterialTitle}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Course ID"
              value={courseId}
              onChangeText={setCourseId}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedFile(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitMaterial}
              >
                <Text style={styles.submitButtonText}>Upload</Text>
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  uploadButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 16,
  },
  materialItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  materialDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  fileInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#0066cc',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminMaterials;