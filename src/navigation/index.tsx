import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { TouchableOpacity, Text } from 'react-native';

// Import all student screens
import { StudentHome } from '../screens/student/StudentHome';
import { StudentStore } from '../screens/student/StudentStore';
import { StudentChats } from '../screens/student/StudentChats';
import StudentProfile from '../screens/student/StudentProfile';
import StudentMaterials from '../screens/student/StudentMaterials';
import { StudentQuiz } from '../screens/student/StudentQuiz';

// Import admin screens
import { AdminDashboard } from '../screens/admin/AdminDashboard';
import { AdminStudents } from '../screens/admin/AdminStudents';
import { AdminClasses } from '../screens/admin/AdminClasses';
import { AdminChats } from '../screens/admin/AdminChats';
import AdminMaterials from '../screens/admin/AdminMaterials';
import { AdminQuizzes } from '../screens/admin/AdminQuizzes';

// Admin Payments screen (to be implemented)
const AdminPayments = () => null;

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const StudentDrawerNavigator = () => {
  const { logout } = useAuth();
  
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        drawerStyle: {
          backgroundColor: '#f6f6f6',
        },
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={StudentHome} 
        options={{
          headerRight: () => (
            <TouchableOpacity 
              onPress={logout}
              style={{ marginRight: 15 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Drawer.Screen name="Store" component={StudentStore} />
      <Drawer.Screen name="Chats" component={StudentChats} />
      <Drawer.Screen name="Materials" component={StudentMaterials} />
      <Drawer.Screen name="Quizzes" component={StudentQuiz} />
      <Drawer.Screen name="Profile" component={StudentProfile} />
    </Drawer.Navigator>
  );
};

const AdminTabNavigator = () => {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#6200ee',
        headerRight: () => (
          <TouchableOpacity 
            onPress={logout}
            style={{ marginRight: 15 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Students" component={AdminStudents} />
      <Tab.Screen name="Classes" component={AdminClasses} />
      <Tab.Screen name="Chats" component={AdminChats} />
      <Tab.Screen name="Materials" component={AdminMaterials} />
      <Tab.Screen name="Quizzes" component={AdminQuizzes} />
      <Tab.Screen name="Payments" component={AdminPayments} />
    </Tab.Navigator>
  );
};

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? (
        user.role === 'admin' ? <AdminTabNavigator /> : <StudentDrawerNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};
