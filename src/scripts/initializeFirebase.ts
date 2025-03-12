import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPhoneNumber, PhoneAuthProvider } from 'firebase/auth';
import { default as app } from '../config/firebase';

// Get Firebase instances
const db = getFirestore(app);
const auth = getAuth(app);

// Admin user data
const adminPhone = "+919876543210"; // Replace with actual admin phone number
const adminData = {
  role: 'admin',
  name: 'Super Admin',
  phone: adminPhone,
  coursesEnrolled: [],
  payments: [],
  performance: []
};

// Sample data
const banners = [
  {
    title: 'Welcome to Super Six Academy',
    image: 'https://example.com/banner1.jpg'
  },
  {
    title: 'New Courses Available',
    image: 'https://example.com/banner2.jpg'
  }
];

const courses = [
  {
    title: 'Mathematics Foundation',
    price: 9999,
    installments: {
      initial: 2999,
      monthly: 1000
    },
    description: 'Comprehensive mathematics course for beginners'
  },
  {
    title: 'Advanced Physics',
    price: 12999,
    installments: {
      initial: 3999,
      monthly: 1500
    },
    description: 'Advanced physics concepts and problem solving'
  }
];

const liveClasses = [
  {
    title: 'Introduction to Algebra',
    courseId: 'course1',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    youtubeLink: 'https://youtube.com/watch?v=example1',
    status: 'scheduled'
  },
  {
    title: 'Newton\'s Laws of Motion',
    courseId: 'course2',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 90000000).toISOString(),
    youtubeLink: 'https://youtube.com/watch?v=example2',
    status: 'scheduled'
  }
];

const reviews = [
  {
    name: 'John Doe',
    rating: 5,
    text: 'Excellent teaching methodology!'
  },
  {
    name: 'Jane Smith',
    rating: 4,
    text: 'Very helpful courses and materials'
  }
];

// Function to create admin user
async function createAdminUser() {
  try {
    // Create admin user document
    const adminUid = 'admin-' + Date.now(); // Generate a unique admin ID
    await setDoc(doc(db, 'users', adminUid), adminData);
    console.log('Admin user created successfully');
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}

// Function to initialize collections
async function initializeCollections() {
  try {
    // First create admin user
    const adminCreated = await createAdminUser();
    if (!adminCreated) {
      throw new Error('Failed to create admin user');
    }
    // Add banners
    for (const banner of banners) {
      await addDoc(collection(db, 'banners'), banner);
    }
    console.log('Banners added successfully');

    // Add courses
    for (const course of courses) {
      await addDoc(collection(db, 'courses'), course);
    }
    console.log('Courses added successfully');

    // Add live classes
    for (const liveClass of liveClasses) {
      await addDoc(collection(db, 'liveClasses'), liveClass);
    }
    console.log('Live classes added successfully');

    // Add reviews
    for (const review of reviews) {
      await addDoc(collection(db, 'reviews'), review);
    }
    console.log('Reviews added successfully');

    console.log('All collections initialized successfully!');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
}

// Run the initialization
initializeCollections();