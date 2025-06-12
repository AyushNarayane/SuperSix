import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { WebView } from 'react-native-webview';

interface Video {
  id: string;
  title: string;
  youtubeUrl: string;
  chapterId: string;
}

interface Chapter {
  id: string;
  name: string;
  subject: string;
  videos: Video[];
}

export const StudentVideos = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('math');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const videosRef = collection(db, 'recordedVideos');
      const q = query(videosRef);
      const querySnapshot = await getDocs(q);
      
      const chaptersMap = new Map<string, Chapter>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const video: Video = {
          id: doc.id,
          title: data.title,
          youtubeUrl: data.youtubeUrl,
          chapterId: data.chapterId
        };

        if (!chaptersMap.has(data.chapterId)) {
          chaptersMap.set(data.chapterId, {
            id: data.chapterId,
            name: data.chapterName,
            subject: data.subject,
            videos: []
          });
        }
        
        chaptersMap.get(data.chapterId)?.videos.push(video);
      });

      setChapters(Array.from(chaptersMap.values()));
    } catch (error) {
      console.error('Error fetching videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    { id: 'math', name: 'Mathematics' },
    { id: 'reasoning', name: 'Reasoning' },
    { id: 'english', name: 'English' }
  ];

  const filteredChapters = chapters.filter(chapter => chapter.subject === selectedSubject);

  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => setSelectedVideo(item)}
    >
      <Text style={styles.videoTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderChapterItem = ({ item }: { item: Chapter }) => (
    <View style={styles.chapterContainer}>
      <Text style={styles.chapterTitle}>{item.name}</Text>
      <FlatList
        data={item.videos}
        renderItem={renderVideoItem}
        keyExtractor={(video) => video.id}
        scrollEnabled={false}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      {selectedVideo ? (
        <View style={styles.videoPlayerContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedVideo(null)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <WebView
            source={{ 
              uri: selectedVideo.youtubeUrl + 
                '&modestbranding=1' + // Hide YouTube branding
                '&rel=0' + // Don't show related videos
                '&showinfo=0' + // Hide video title and uploader info
                '&controls=1' + // Show video controls
                '&fs=1' + // Allow fullscreen
                '&iv_load_policy=3' + // Hide video annotations
                '&playsinline=1' + // Play inline on iOS
                '&enablejsapi=1' + // Enable JavaScript API
                '&origin=https://www.youtube.com' // Set origin for security
            }}
            style={styles.videoPlayer}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      ) : (
        <FlatList
          data={filteredChapters}
          renderItem={renderChapterItem}
          keyExtractor={(chapter) => chapter.id}
          contentContainerStyle={styles.chaptersList}
        />
      )}
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
  chaptersList: {
    padding: 16,
  },
  chapterContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  videoItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  videoTitle: {
    fontSize: 16,
    color: '#333',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoPlayer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default StudentVideos; 