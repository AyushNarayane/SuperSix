import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, ScrollView, SafeAreaView, Dimensions, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export const LoginScreen = ({ navigation }: { navigation: any }) => {
  const { loginWithRole, error: authError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        return;
      }
      const success = await loginWithRole(email, password, role);
      if (!success) {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.title}>Login</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'student' && styles.activeRole]}
                onPress={() => setRole('student')}
              >
                <Text style={[styles.roleText, role === 'student' && styles.activeRoleText]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'admin' && styles.activeRole]}
                onPress={() => setRole('admin')}
              >
                <Text style={[styles.roleText, role === 'admin' && styles.activeRoleText]}>Admin</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
      
          {(error || authError) && <Text style={styles.error}>{error || authError}</Text>}
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New student?</Text>
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },


  logoContainer: {
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 5,
    paddingVertical: 5,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 5,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeRole: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  roleText: {
    color: '#666',
    fontWeight: '600',
  },
  activeRoleText: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#ff3b30',
    marginTop: 15,
    textAlign: 'center',
  },
  signupContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    marginTop: 30,
    marginBottom: 20,
    width: '100%',
  },
  signupText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666'
  },
  signupButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    maxWidth: 300,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});