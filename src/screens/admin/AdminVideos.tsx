import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Video {
  id: string;
  title: string;
  youtubeUrl: string;
  chapterId: string;
  chapterName: string;
  subject: string;
}

interface Chapter {
  id: string;
  name: string;
  subject: string;
}

export const AdminVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('math');
  const [isAddVideoModalVisible, setIsAddVideoModalVisible] = useState(false);
  const [isAddChapterModalVisible, setIsAddChapterModalVisible] = useState(false);
  const [newVideo, setNewVideo] = useState({ 
    title: '', 
    youtubeUrl: '', 
    chapterId: '',
    subject: 'math'
  });
  const [newChapter, setNewChapter] = useState({ name: '', subject: 'math' });
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch chapters
      const chaptersRef = collection(db, 'chapters');
      const chaptersSnapshot = await getDocs(chaptersRef);
      const chaptersData: Chapter[] = [];
      
      chaptersSnapshot.forEach((doc) => {
        const data = doc.data();
        chaptersData.push({
          id: doc.id,
          name: data.name,
          subject: data.subject
        });
      });
      
      setChapters(chaptersData);

      // Fetch videos
      const videosRef = collection(db, 'recordedVideos');
      const videosSnapshot = await getDocs(videosRef);
      const videosData: Video[] = [];
      
      videosSnapshot.forEach((doc) => {
        const data = doc.data();
        videosData.push({
          id: doc.id,
          title: data.title,
          youtubeUrl: data.youtubeUrl,
          chapterId: data.chapterId,
          chapterName: data.chapterName,
          subject: data.subject
        });
      });
      
      setVideos(videosData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load videos and chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!newVideo.title || !newVideo.youtubeUrl || !newVideo.chapterId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const chapter = chapters.find(c => c.id === newVideo.chapterId);
      if (!chapter) {
        Alert.alert('Error', 'Selected chapter not found');
        return;
      }

      // Create clean YouTube URL
      const videoId = newVideo.youtubeUrl.split('v=')[1]?.split('&')[0] || 
                     newVideo.youtubeUrl.split('/').pop()?.split('?')[0];
      
      if (!videoId) {
        Alert.alert('Error', 'Invalid YouTube URL');
        return;
      }

      const cleanYoutubeUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1&fs=1&iv_load_policy=3`;

      const videoData = {
        title: newVideo.title,
        youtubeUrl: cleanYoutubeUrl,
        chapterId: newVideo.chapterId,
        chapterName: chapter.name,
        subject: chapter.subject
      };

      await addDoc(collection(db, 'recordedVideos'), videoData);
      Alert.alert('Success', 'Video added successfully');
      setIsAddVideoModalVisible(false);
      setNewVideo({ title: '', youtubeUrl: '', chapterId: '', subject: 'math' });
      setIsSubjectDropdownOpen(false);
      setIsChapterDropdownOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding video:', error);
      Alert.alert('Error', 'Failed to add video');
    }
  };

  const handleAddChapter = async () => {
    if (!newChapter.name) {
      Alert.alert('Error', 'Please enter chapter name');
      return;
    }

    try {
      const chapterData = {
        name: newChapter.name,
        subject: newChapter.subject
      };

      await addDoc(collection(db, 'chapters'), chapterData);
      Alert.alert('Success', 'Chapter added successfully');
      setIsAddChapterModalVisible(false);
      setNewChapter({ name: '', subject: 'math' });
      fetchData();
    } catch (error) {
      console.error('Error adding chapter:', error);
      Alert.alert('Error', 'Failed to add chapter');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteDoc(doc(db, 'recordedVideos', videoId));
      Alert.alert('Success', 'Video deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting video:', error);
      Alert.alert('Error', 'Failed to delete video');
    }
  };

  const subjects = [
    { id: 'math', name: 'Mathematics' },
    { id: 'reasoning', name: 'Reasoning' },
    { id: 'english', name: 'English' }
  ];

  const filteredVideos = videos.filter(video => video.subject === selectedSubject);

  const renderVideoItem = ({ item }: { item: Video }) => (
    <View style={styles.videoItem}>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{item.title}</Text>
        <Text style={styles.chapterName}>Chapter: {item.chapterName}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteVideo(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recorded Videos</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddChapterModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Add Chapter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddVideoModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Add Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.subjectTabs}>
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            style={[
              styles.subjectTab,
              selectedSubject === subject.id && styles.selectedSubjectTab
            ]}
            onPress={() => setSelectedSubject(subject.id)}
          >
            <Text
              style={[
                styles.subjectTabText,
                selectedSubject === subject.id && styles.selectedSubjectTabText
              ]}
            >
              {subject.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredVideos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.videosList}
      />

      {/* Add Video Modal */}
      <Modal
        visible={isAddVideoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddVideoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Video</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Video Title"
              value={newVideo.title}
              onChangeText={(text) => setNewVideo({ ...newVideo, title: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="YouTube URL"
              value={newVideo.youtubeUrl}
              onChangeText={(text) => setNewVideo({ ...newVideo, youtubeUrl: text })}
            />

            {/* Subject Dropdown */}
            <Text style={styles.sectionLabel}>Select Subject:</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                setIsSubjectDropdownOpen(!isSubjectDropdownOpen);
                setIsChapterDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownButtonText}>
                {subjects.find(s => s.id === newVideo.subject)?.name || 'Select Subject'}
              </Text>
              <Text style={styles.dropdownArrow}>{isSubjectDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {isSubjectDropdownOpen && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScrollView}>
                  {subjects.map(subject => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.dropdownItem,
                        newVideo.subject === subject.id && styles.selectedDropdownItem
                      ]}
                      onPress={() => {
                        setNewVideo({ ...newVideo, subject: subject.id, chapterId: '' });
                        setIsSubjectDropdownOpen(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        newVideo.subject === subject.id && styles.selectedDropdownItemText
                      ]}>
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Chapter Dropdown */}
            <Text style={styles.sectionLabel}>Select Chapter:</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                setIsChapterDropdownOpen(!isChapterDropdownOpen);
                setIsSubjectDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownButtonText}>
                {chapters.find(c => c.id === newVideo.chapterId)?.name || 'Select Chapter'}
              </Text>
              <Text style={styles.dropdownArrow}>{isChapterDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {isChapterDropdownOpen && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScrollView}>
                  {chapters
                    .filter(chapter => chapter.subject === newVideo.subject)
                    .map(chapter => (
                      <TouchableOpacity
                        key={chapter.id}
                        style={[
                          styles.dropdownItem,
                          newVideo.chapterId === chapter.id && styles.selectedDropdownItem
                        ]}
                        onPress={() => {
                          setNewVideo({ ...newVideo, chapterId: chapter.id });
                          setIsChapterDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          newVideo.chapterId === chapter.id && styles.selectedDropdownItemText
                        ]}>
                          {chapter.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddVideoModalVisible(false);
                  setNewVideo({ title: '', youtubeUrl: '', chapterId: '', subject: 'math' });
                  setIsSubjectDropdownOpen(false);
                  setIsChapterDropdownOpen(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddVideo}
              >
                <Text style={styles.submitButtonText}>Add Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Chapter Modal */}
      <Modal
        visible={isAddChapterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddChapterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Chapter</Text>
            <TextInput
              style={styles.input}
              placeholder="Chapter Name"
              value={newChapter.name}
              onChangeText={(text) => setNewChapter({ ...newChapter, name: text })}
            />
            <View style={styles.subjectPicker}>
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectOption,
                    newChapter.subject === subject.id && styles.selectedSubject
                  ]}
                  onPress={() => setNewChapter({ ...newChapter, subject: subject.id })}
                >
                  <Text style={styles.subjectOptionText}>{subject.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAddChapterModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddChapter}
              >
                <Text style={styles.submitButtonText}>Add Chapter</Text>
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  addButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subjectTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  subjectTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectedSubjectTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200ee',
  },
  subjectTabText: {
    fontSize: 16,
    color: '#666',
  },
  selectedSubjectTabText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  videosList: {
    padding: 16,
  },
  videoItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chapterName: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  subjectPicker: {
    marginBottom: 16,
  },
  subjectOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 8,
  },
  selectedSubject: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  subjectOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedSubjectText: {
    color: '#6200ee',
    fontWeight: '600',
  },
  chapterPicker: {
    marginBottom: 16,
  },
  chapterOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 8,
  },
  selectedChapter: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  chapterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedChapterText: {
    color: '#6200ee',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  submitButton: {
    backgroundColor: '#6200ee',
  },
  cancelButtonText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginTop: 4,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDropdownItem: {
    backgroundColor: '#f3e5f5',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDropdownItemText: {
    color: '#6200ee',
    fontWeight: '600',
  },
});

export default AdminVideos; 