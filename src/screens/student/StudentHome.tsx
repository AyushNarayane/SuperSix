import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Linking, Image, ActivityIndicator, FlatList } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LiveClass } from '../../types';

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
}

interface SocialLink {
  platform: string;
  url: string;
}

export const StudentHome = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Banner>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

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
        const classesSnapshot = await getDocs(collection(db, 'liveClasses'));
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
    <TouchableOpacity key={item.id} style={styles.liveClassCard}>
      <Text style={styles.classTitle}>{item.title}</Text>
      <Text style={styles.classInfo}>{new Date(item.startTime).toLocaleTimeString()} - {item.status}</Text>
    </TouchableOpacity>
  );

  const renderCourse = (item: Course) => (
    <TouchableOpacity key={item.id} style={styles.courseCard}>
      <Text style={styles.courseTitle}>{item.title}</Text>
      <Text style={styles.coursePrice}>₹{item.price}</Text>
    </TouchableOpacity>
  );

  const renderSocialLink = (item: SocialLink) => (
    <TouchableOpacity
      key={item.platform}
      style={styles.socialButton}
      onPress={() => Linking.openURL(item.url)}
    >
      <Text style={styles.socialText}>{item.platform}</Text>
    </TouchableOpacity>
  );

  const renderReview = (item: Review) => (
    <View key={item.id} style={styles.reviewCard}>
      <Text style={styles.reviewName}>{item.name}</Text>
      <Text style={styles.reviewRating}>{'⭐'.repeat(item.rating)}</Text>
      <Text style={styles.reviewText}>{item.text}</Text>
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
        <FlatList
          data={banners}
          renderItem={renderBannerItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.floor(
              Math.floor(event.nativeEvent.contentOffset.x) /
                Math.floor(event.nativeEvent.layoutMeasurement.width)
            );
            setCurrentIndex(slideIndex);
          }}
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
            liveClasses.map(renderLiveClass)
          ) : (
            <Text style={styles.emptyText}>No live classes scheduled</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Courses</Text>
        <View style={styles.coursesGrid}>
          {courses.length > 0 ? (
            courses.map(renderCourse)
          ) : (
            <Text style={styles.emptyText}>No courses available</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follow Us</Text>
        <View style={styles.socialContainer}>
          {socialLinks.map(renderSocialLink)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Reviews</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {reviews.length > 0 ? (
            reviews.map(renderReview)
          ) : (
            <Text style={styles.emptyText}>No reviews yet</Text>
          )}
        </ScrollView>
      </View>
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
});