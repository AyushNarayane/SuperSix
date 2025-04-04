import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Linking, Image, ActivityIndicator, FlatList, Modal, TextInput, Alert } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../config/firebase';
import { LiveClass } from '../../types';
import Carousel from 'react-native-reanimated-carousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Banner {
  id: string;
  title: string;
  image: string;
}

interface Course {
  id: string;
  title: string;
  price: number;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  profilePic?: string;
  timestamp: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

export const StudentHome = () => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Banner>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);

  const socialLinks = [
    { platform: 'YouTube', url: 'https://www.youtube.com/@supersixacademy' },
    { platform: 'Instagram', url: 'https://instagram.com/handle' },
    { platform: 'Facebook', url: 'https://facebook.com/page' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch banners
        const bannersSnapshot = await getDocs(collection(db, 'banners'));
        const bannersData = bannersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
        setBanners(bannersData);

        // Fetch live classes
        const classesSnapshot = await getDocs(collection(db, 'classes'));
        const classesData = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LiveClass[];
        setLiveClasses(classesData.filter(c => c.status !== 'completed'));

        // Fetch courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[];
        setCourses(coursesData);

        // Fetch reviews
        const reviewsSnapshot = await getDocs(collection(db, 'reviews'));
        const reviewsData = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
        setReviews(reviewsData);

      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderBannerItem = ({ item }: { item: Banner }) => (
    <View style={[styles.bannerItem, { width: SCREEN_WIDTH }]}>
      <Image 
        source={{ uri: item.image }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <Text style={styles.bannerTitle}>{item.title}</Text>
    </View>
  );

  useEffect(() => {
    const autoplayTimer = setInterval(() => {
      if (banners.length > 0) {
        const nextIndex = (currentIndex + 1) % banners.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
        setCurrentIndex(nextIndex);
      }
    }, 3000);

    return () => clearInterval(autoplayTimer);
  }, [currentIndex, banners.length]);

  const renderLiveClass = (item: LiveClass) => (
    <View style={styles.liveClassCard}>
      <Text style={styles.classTitle}>{item.title}</Text>
      <Text style={styles.classInfo}>{new Date(item.startTime).toLocaleTimeString()} - {item.status}</Text>
      {item.googleMeetLink && (
        <TouchableOpacity 
          style={styles.meetButton}
          onPress={() => Linking.openURL(item.googleMeetLink)}
        >
          <Text style={styles.meetButtonText}>Join Meet</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCourse = (item: Course) => (
    <TouchableOpacity style={styles.courseCard}>
      <Text style={styles.courseTitle}>{item.title}</Text>
      <Text style={styles.coursePrice}>₹{item.price}</Text>
    </TouchableOpacity>
  );

  const renderSocialLink = (item: SocialLink) => (
    <TouchableOpacity
     
      style={styles.socialButton}
      onPress={() => Linking.openURL(item.url)}
    >
      <Text style={styles.socialText}>{item.platform}</Text>
    </TouchableOpacity>
  );

  const handleAddReview = async () => {
    if (!user || !user.name || rating === 0 || !reviewText.trim()) {
      Alert.alert('Error', 'Please provide both rating and review text');
      return;
    }

    try {
      const newReview = {
        name: user.name,
        rating,
        text: reviewText.trim(),
        profilePic: user.profile,
        timestamp: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'reviews'), newReview);
      const reviewWithId = { ...newReview, id: docRef.id };
      setReviews([reviewWithId, ...reviews]);
      setReviewText('');
      setRating(0);
      setIsReviewModalVisible(false);
    } catch (err) {
      console.error('Error adding review:', err);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
          >
            <Text style={styles.starButton}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReview = (item: Review) => (
    <View key={item.id} style={styles.reviewCard}>
      <View style={styles.reviewContent}>
        <Text style={styles.reviewName}>{item.name}</Text>
        <Text style={styles.reviewRating}>{'⭐'.repeat(item.rating)}</Text>
        <Text style={styles.reviewText}>{item.text}</Text>
      </View>
      {item.profilePic ? (
        <Image 
          source={{ uri: item.profilePic }}
          style={styles.reviewProfilePic} 
          resizeMode="cover"
        />
      ) : (
        <SvgXml
          xml={`<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="60" fill="#E0E0E0"/>
            <circle cx="60" cy="45" r="20" fill="#BDBDBD"/>
            <path d="M60 70C73.2548 70 84 80.7452 84 94V120H36V94C36 80.7452 46.7452 70 60 70Z" fill="#BDBDBD"/>
          </svg>`}
          width={50}
          height={50}
          style={styles.reviewProfilePic}
        />
      )}
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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.carouselContainer}>
        <Carousel
          loop
          width={SCREEN_WIDTH}
          height={220}
          data={banners}
          renderItem={renderBannerItem}
          autoPlay={true}
          autoPlayInterval={3000}
          scrollAnimationDuration={1000}
          onSnapToItem={(index) => setCurrentIndex(index)}
        />
        <View style={styles.paginationContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[styles.paginationDot, currentIndex === index && styles.paginationDotActive]}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Classes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {liveClasses.length > 0 ? (
            <FlatList
              horizontal
              data={liveClasses}
              renderItem={({ item }) => renderLiveClass(item)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.liveClassesContainer}
              keyExtractor={(item) => item.id}
            />
          ) : (
            <Text style={styles.emptyText}>No live classes scheduled</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Courses</Text>
        <View style={styles.coursesGrid}>
          {courses.length > 0 ? (
            courses.map((item) => React.cloneElement(renderCourse(item), { key: item.id }))
          ) : (
            <Text style={styles.emptyText}>No courses available</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follow Us</Text>
        <View style={styles.socialContainer}>
          {socialLinks.map((item) => React.cloneElement(renderSocialLink(item), { key: item.platform }))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.reviewHeader}>
          <Text style={styles.sectionTitle}>Student Reviews</Text>
          <TouchableOpacity 
            style={styles.addReviewButton}
            onPress={() => setIsReviewModalVisible(true)}
          >
            <Text style={styles.addReviewButtonText}>Add Review</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {reviews.length > 0 ? (
            reviews.map(renderReview)
          ) : (
            <Text style={styles.emptyText}>No reviews yet</Text>
          )}
        </ScrollView>

        <Modal
          visible={isReviewModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsReviewModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Your Review</Text>
              {renderStars()}
              <TextInput
                style={styles.reviewInput}
                placeholder="Write your review here..."
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsReviewModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAddReview}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addReviewButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addReviewButtonText: {
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
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    fontSize: 30,
    marginHorizontal: 5,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
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
  carouselContainer: {
    height: 220,
    marginVertical: 15,
  },
  bannerItem: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerImage: {
    width: SCREEN_WIDTH,
    height: 180,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#6200ee',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bannerTitle: {
    padding: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  liveClassCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    minWidth: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  liveClassesContainer: {
    paddingHorizontal: 15,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  classInfo: {
    fontSize: 14,
    color: '#666',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  coursePrice: {
    fontSize: 15,
    color: '#6200ee',
    fontWeight: 'bold',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  socialButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  socialText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    minWidth: 250,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewContent: {
    flex: 1,
    marginRight: 10,
  },
  reviewProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  reviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  reviewRating: {
    fontSize: 14,
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  meetButton: {
    backgroundColor: '#34A853',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  meetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});