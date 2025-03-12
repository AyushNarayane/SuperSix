import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { db } from '../../config/firebase';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { StudyMaterial } from '../../types';

const StudentMaterials = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to study materials collection
    const q = query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const materialsData: StudyMaterial[] = [];
      const coursesSet = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const material = { id: doc.id, ...doc.data() } as StudyMaterial;
        materialsData.push(material);
        coursesSet.add(material.courseId);
      });
      
      setMaterials(materialsData);
      setCourses(Array.from(coursesSet));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching materials:', error);
      Alert.alert('Error', 'Failed to load study materials');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMaterials = selectedCourse
    ? materials.filter(material => material.courseId === selectedCourse)
    : materials;

  const handleDownload = async (material: StudyMaterial) => {
    try {
      // Open the PDF URL in the device's browser or PDF viewer
      await Linking.openURL(material.fileUrl);
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open the document');
    }
  };

  const renderCourseFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, !selectedCourse && styles.filterButtonActive]}
        onPress={() => setSelectedCourse(null)}
      >
        <Text style={[styles.filterButtonText, !selectedCourse && styles.filterButtonTextActive]}>All</Text>
      </TouchableOpacity>
      {courses.map(course => (
        <TouchableOpacity
          key={course}
          style={[styles.filterButton, selectedCourse === course && styles.filterButtonActive]}
          onPress={() => setSelectedCourse(course)}
        >
          <Text style={[styles.filterButtonText, selectedCourse === course && styles.filterButtonTextActive]}>
            {course}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
        style={styles.downloadButton}
        onPress={() => handleDownload(item)}
      >
        <Text style={styles.downloadButtonText}>Download</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Study Materials</Text>
      
      {renderCourseFilter()}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0066cc" />
      ) : (
        <FlatList
          data={filteredMaterials}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {selectedCourse 
                ? `No study materials available for ${selectedCourse}`
                : 'No study materials available'}
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0066cc',
  },
  filterButtonText: {
    color: '#333',
  },
  filterButtonTextActive: {
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
  downloadButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  downloadButtonText: {
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
});

export default StudentMaterials;