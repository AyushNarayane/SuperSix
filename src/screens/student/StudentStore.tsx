import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  installments: {
    initial: number;
    monthly: number;
  };
  image: string;
  features: string[];
}

export const StudentStore = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[];
        setCourses(coursesData);

        // Fetch user's enrolled courses
        if (user?.uid) {
          const userDoc = await getDocs(collection(db, 'users'));
          const userData = userDoc.docs.find(doc => doc.id === user.uid);
          if (userData) {
            setEnrolledCourses(userData.data().coursesEnrolled || []);
          }
        }
      } catch (err) {
        setError('Failed to load courses. Please try again.');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handlePurchase = (course: Course) => {
    // In a real app, this would integrate with Razorpay
    Alert.alert(
      'Purchase Course',
      `Would you like to purchase ${course.title} for ₹${course.price}?\n\nEMI Option: ₹${course.installments.initial} initial + ₹${course.installments.monthly}/month`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Full Payment', onPress: () => initiatePayment(course, 'full') },
        { text: 'EMI', onPress: () => initiatePayment(course, 'emi') }
      ]
    );
  };

  const initiatePayment = (course: Course, paymentType: 'full' | 'emi') => {
    // This would be replaced with actual Razorpay integration
    Alert.alert(
      'Payment Simulation',
      `Redirecting to payment gateway for ${paymentType === 'full' ? 'full payment' : 'EMI payment'}...`,
      [{ text: 'OK' }]
    );
  };

  const renderCourseCard = (course: Course) => {
    const isEnrolled = enrolledCourses.includes(course.id);

    return (
      <View key={course.id} style={styles.courseCard}>
        <Image 
          source={{ uri: course.image || 'https://via.placeholder.com/300x150?text=Course+Image' }} 
          style={styles.courseImage}
          resizeMode="cover"
        />
        <View style={styles.courseContent}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription}>{course.description}</Text>
          
          <View style={styles.featuresContainer}>
            {course.features && course.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureText}>✓ {feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price:</Text>
            <Text style={styles.priceValue}>₹{course.price}</Text>
          </View>
          
          <View style={styles.emiContainer}>
            <Text style={styles.emiLabel}>EMI Option:</Text>
            <Text style={styles.emiValue}>
              ₹{course.installments?.initial || 2000} initial + 
              ₹{course.installments?.monthly || 500}/month
            </Text>
          </View>

          {isEnrolled ? (
            <TouchableOpacity style={styles.enrolledButton} disabled>
              <Text style={styles.enrolledButtonText}>Enrolled</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.purchaseButton}
              onPress={() => handlePurchase(course)}
            >
              <Text style={styles.purchaseButtonText}>Purchase</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading courses...</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Store</Text>
        <Text style={styles.headerSubtitle}>Enroll in our premium courses</Text>
      </View>

      <View style={styles.coursesContainer}>
        {courses.length > 0 ? (
          courses.map(renderCourseCard)
        ) : (
          <Text style={styles.emptyText}>No courses available at the moment</Text>
        )}
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  coursesContainer: {
    padding: 15,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseImage: {
    width: '100%',
    height: 150,
  },
  courseContent: {
    padding: 15,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#444',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 5,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  emiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  emiLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 5,
  },
  emiValue: {
    fontSize: 14,
    color: '#6200ee',
  },
  purchaseButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  enrolledButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enrolledButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 30,
  },
});