import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../../../assets/logo.svg')} style={styles.logo} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 5,
    marginTop: -40,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 5,
    marginBottom: 8,
    width: '100%'
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  roleButton: {
    flex: 1,
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center'
  },
  activeRole: {
    backgroundColor: '#007AFF'
  },
  roleText: {
    color: '#000'
  },
  activeRoleText: {
    color: '#fff'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  error: {
    color: 'red',
    marginTop: 10
  },
  signupContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10
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